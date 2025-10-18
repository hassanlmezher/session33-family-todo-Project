import { useState, useEffect } from 'react';
import useStore, { PotentialMember, Todo } from '../store';
import TodoList from './TodoList';
import TodoCard from './TodoCard';
import TodoForm from './TodoForm';
import EditTodoForm from './EditTodoForm';

function Dashboard() {
  const { family, todos, view, setView, logout, inviteMember, searchUsers, potentialMembers, join, fetchInvites, invites, fetchFamily, searchText, setSearchText, filterAssignee, setFilterAssignee, filterCompleted, setFilterCompleted, clearFilters, familyMembers } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedUser, setSelectedUser] = useState<PotentialMember | null>(null);
  const [inviteToken, setInviteToken] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    searchUsers();
    fetchInvites();
  }, [searchUsers, fetchInvites]);

  const handleInvite = async () => {
    if (selectedUser) {
      const result = await inviteMember(selectedUser.id);
      if (result.token) {
        // Invite sent successfully
      }
      setSelectedUser(null);
    }
  };

  const handleJoin = async () => {
    if (inviteToken) {
      const result = await join(inviteToken);
      if (result.success) {
        setInviteToken('');
        fetchFamily();
        fetchInvites();
        const { fetchTodos } = useStore.getState();
        fetchTodos();
      }
    }
  };

  const handleComplete = async (id: number) => {
    const { toggleTodoComplete } = useStore.getState();
    await toggleTodoComplete(id);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-readable">{family?.name || 'Family'} Todos</h1>
                <p className="text-sm text-muted">Manage your family's tasks together</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 shadow-sm"
                  aria-label="Notifications"
                >
                  <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21h13.78a3 3 0 002.442-1.527l.363-.727A2.25 2.25 0 0018.25 16H6.75a2.25 2.25 0 00-2.163 1.683z" />
                  </svg>
                  {invites && invites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
                      {invites.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-readable mb-3">Family Invites</h3>
                      {invites && invites.length > 0 ? (
                        <div className="space-y-2">
                          {invites.map((invite, index) => (
                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-500">
                              <p className="text-sm font-medium text-readable">Invite from {invite.family_name}</p>
                              <p className="text-xs text-muted mt-1">Token: <span className="font-mono bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-800 dark:text-slate-100 select-all cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">{invite.token}</span></p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No pending invites</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={logout} className="btn-secondary">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-3xl font-bold text-readable mb-4">Family Tasks</h2>
            <p className="text-muted text-lg">Keep everyone organized and on track</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="flex space-x-2">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  view === 'list'
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Switch to list view"
              >
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </button>
              <button
                onClick={() => setView('cards')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  view === 'cards'
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Switch to cards view"
              >
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Cards View
              </button>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary" aria-label="Add new task">
              <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="input-field"
              >
                <option value="">All Assignees</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.email}>{member.email}</option>
                ))}
              </select>
              <select
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value as "" | "completed" | "pending")}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <button onClick={clearFilters} className="btn-secondary">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-xl font-semibold text-readable mb-4 flex items-center">
              <svg className="h-6 w-6 mr-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6m0 12h6" />
              </svg>
              Invite Members
            </h3>
            <div className="space-y-3">
              <select
                value={selectedUser ? selectedUser.id : ''}
                onChange={(e) => {
                  const user = potentialMembers.find(u => u.id === parseInt(e.target.value));
                  setSelectedUser(user || null);
                }}
                className="input-field"
              >
                <option value="">Select a user to invite</option>
                {potentialMembers && potentialMembers.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
              <button onClick={handleInvite} disabled={!selectedUser} className="btn-primary w-full">
                Send Invite
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-readable mb-4 flex items-center">
              <svg className="h-6 w-6 mr-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Join Family
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter invite token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value.trim())}
                className="input-field"
              />
              <button onClick={handleJoin} disabled={!inviteToken} className="btn-primary w-full">
                Join Family
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-readable mb-4 flex items-center">
              <svg className="h-6 w-6 mr-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Total Tasks:</span>
                <span className="font-semibold text-readable">{todos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Completed:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{todos.filter(t => t.completed).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Pending:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{todos.filter(t => !t.completed).length}</span>
              </div>
            </div>
          </div>
        </div>

        {showForm && <TodoForm onClose={() => setShowForm(false)} />}
        {editingTodo && <EditTodoForm todo={editingTodo} onClose={() => setEditingTodo(null)} />}
        <div className="mt-8">
          {view === 'list' ? <TodoList todos={todos} onEdit={setEditingTodo} /> : <TodoCard todos={todos} onEdit={setEditingTodo} />}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
