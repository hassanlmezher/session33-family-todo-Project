const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const pool = new Pool ({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {expiresIn: '7d' });
};

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided' });

  try{
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

app.post ('/api/register', async (req, res) => {
  const { name, email, password } = res.body;
  try{
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(userExists.rows.length > 0) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email, hashedPassword]);

    const token = generateToken(newUser.rows[0].id);
    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0].id, token, });
  } catch (err) {
    console.error('Register Error:'. err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('api/login', async (req, res) => {
  const { email, password } = req.body;
  try{
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(user.rows.length === 0) return res.status(400).json({ message: 'Invalid email or password' });

    const validPass = await bcrypt.compare(password, user.rows[0].password);
    if(!validPass) return res.status(400).json({ message: "Invalid email or password" });
    const token = generateToken(user.rows[0].id);
    res.json({
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
      token,
    });
  } catch(err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

