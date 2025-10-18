import { useEffect } from 'react';
import useStore from './store';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const { user, fetchFamily, fetchTodos, theme } = useStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        useStore.setState({ user: { id: payload.userId } });
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFamily();
      fetchTodos();
    }
  }, [user, fetchFamily, fetchTodos]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen">
      {!user ? <Auth /> : <Dashboard />}
    </div>
  );
}

export default App;
