import { useState, useEffect } from 'react';
import useStore from '../store';



function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, signup, join, error, clearError, fetchInvites, invites } = useStore();

  useEffect(() => {
    if (!isLogin) {
      fetchInvites();
    }
  }, [isLogin, fetchInvites]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFamilyName = familyName.trim();
    const trimmedInviteToken = inviteToken.trim();

    if (!trimmedEmail) {
      setLocalError('Email is required');
      return;
    }
    if (!trimmedPassword) {
      setLocalError('Password is required');
      return;
    }
    if (!isLogin && !inviteToken && !trimmedFamilyName) {
      setLocalError('Family name is required');
      return;
    }
    if (!isLogin && inviteToken && !trimmedInviteToken) {
      setLocalError('Invite token is required');
      return;
    }

    try {
      if (isLogin) {
        await login(trimmedEmail, trimmedPassword);
      } else if (inviteToken) {
        await join(trimmedInviteToken);
      } else {
        await signup(trimmedEmail, trimmedPassword, trimmedFamilyName);
      }
    } catch (error) {
      // Error is already set in the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-readable mb-4">
            {isLogin ? 'Welcome Back' : inviteToken ? 'Join Your Family' : 'Create Your Family'}
          </h2>
          <p className="text-muted text-lg">
            {isLogin ? 'Sign in to manage your family todos' : inviteToken ? 'Enter your details to join' : 'Start organizing your family tasks'}
          </p>
        </div>
        <div className="card">
          {(error || localError) && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error || localError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-medium text-readable mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-base font-medium text-readable mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
              />
            </div>
            {!isLogin && (
              <>
                {!inviteToken && (
                  <div>
                    <label htmlFor="familyName" className="block text-base font-medium text-readable mb-2">
                      Family Name
                    </label>
                    <input
                      id="familyName"
                      type="text"
                      placeholder="Enter your family name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      required
                      className="input-field"
                    />
                  </div>
                )}
              </>
            )}
            <button type="submit" className="btn-primary w-full">
              {isLogin ? 'Sign In' : inviteToken ? 'Join Family' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-accent hover:text-accent/80 font-medium transition duration-200"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need to create an account?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
