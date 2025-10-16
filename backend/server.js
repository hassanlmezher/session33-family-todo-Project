const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to DB');
  } catch (err) {
    console.error('Initial DB connection failed (non-fatal):', err.message);
  }
})();


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});


function getDecodedFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No authorization header');
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, familyName } = req.body;
  if (!email || !password || !familyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, family_name) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, familyName]
    );
    const userId = result.rows[0].id;
    const familyResult = await pool.query('INSERT INTO families (name) VALUES ($1) RETURNING id', [familyName]);
    const familyId = familyResult.rows[0].id;
    await pool.query('INSERT INTO family_members (user_id, family_id, role) VALUES ($1, $2, $3)', [userId, familyId, 'admin']);
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    res.json({ token, userId, familyId });
  } catch (error) {

    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/join', async (req, res) => {
  const { inviteToken } = req.body;
  if (!inviteToken) return res.status(400).json({ error: 'Missing inviteToken' });
  try {
    const decoded = getDecodedFromHeader(req);
    const userId = decoded.userId;
    console.log('User ID:', userId);
    const inviteResult = await pool.query(
      'SELECT i.*, f.name as family_name FROM invites i JOIN families f ON i.family_id = f.id WHERE i.token = $1',
      [inviteToken]
    );
    if (inviteResult.rows.length === 0) return res.status(400).json({ error: 'Invalid token' });
    const invite = inviteResult.rows[0];

    await pool.query('UPDATE users SET family_name = $1 WHERE id = $2', [invite.family_name, userId]);

    await pool.query('DELETE FROM family_members WHERE user_id = $1', [userId]);

    await pool.query('INSERT INTO family_members (user_id, family_id, role) VALUES ($1, $2, $3)', [userId, invite.family_id, 'member']);
    await pool.query('DELETE FROM invites WHERE token = $1', [inviteToken]);
    res.json({ message: 'Joined family successfully' });
  } catch (error) {
    console.error('Join error:', error);
    res.status(400).json({ error: error.message });
  }
});


app.get('/api/family', async (req, res) => {
  try {
    const decoded = getDecodedFromHeader(req);
    const result = await pool.query('SELECT f.* FROM families f JOIN family_members fm ON f.id = fm.family_id WHERE fm.user_id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Family not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('/api/family error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/family/members', async (req, res) => {
  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;
    const result = await pool.query('SELECT u.id, u.email FROM users u JOIN family_members fm ON u.id = fm.user_id WHERE fm.family_id = $1', [familyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('/api/family/members error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/search', async (req, res) => {
  try {
    const decoded = getDecodedFromHeader(req);
    const userResult = await pool.query('SELECT family_name FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const userFamilyName = userResult.rows[0].family_name;
    const result = await pool.query(
      'SELECT u.id, u.email FROM users u WHERE u.family_name = $1 AND u.id != $2 AND u.id NOT IN (SELECT user_id FROM family_members WHERE family_id = (SELECT family_id FROM family_members WHERE user_id = $2))',
      [userFamilyName, decoded.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('/api/users/search error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/family/invite', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;
    const inviteToken = Math.random().toString(36).substr(2, 9);
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const email = userResult.rows[0].email;
    await pool.query('INSERT INTO invites (family_id, email, token) VALUES ($1, $2, $3)', [familyId, email, inviteToken]);
    res.json({ token: inviteToken });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/invites', async (req, res) => {
  try {
    const decoded = getDecodedFromHeader(req);
    const result = await pool.query('SELECT i.token, f.name as family_name FROM invites i JOIN families f ON i.family_id = f.id WHERE i.email = (SELECT email FROM users WHERE id = $1)', [decoded.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('/api/invites error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Todo routes
app.get('/api/todos', async (req, res) => {
  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;
    const result = await pool.query(`
      SELECT t.*, u.email as assignee_email
      FROM todos t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.family_id = $1
    `, [familyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('/api/todos GET error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  const { title, description, due_date, assignee_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing required field: title' });
  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;
    const result = await pool.query(
      'INSERT INTO todos (title, description, due_date, assignee_id, family_id, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, due_date, assignee_id, familyId, decoded.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('/api/todos POST error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates provided' });

  const allowedFields = ['title', 'description', 'due_date', 'assignee_id', 'completed'];
  const keys = Object.keys(updates).filter(k => allowedFields.includes(k));
  if (keys.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map(k => updates[k]);

    values.push(id, familyId);
    const idParamIndex = values.length - 1; 
    const familyParamIndex = values.length; 
    const query = `UPDATE todos SET ${setClause} WHERE id = $${idParamIndex} AND family_id = $${familyParamIndex} RETURNING *`;
    const result = await pool.query(query, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Todo not found or not in your family' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('/api/todos PUT error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = getDecodedFromHeader(req);
    const memberResult = await pool.query('SELECT family_id FROM family_members WHERE user_id = $1', [decoded.userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'User not in a family' });
    const familyId = memberResult.rows[0].family_id;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 AND family_id = $2 RETURNING *', [id, familyId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Todo not found or not in your family' });
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    console.error('/api/todos DELETE error:', error);
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




