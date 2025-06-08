import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isLogin 
                ? 'Sign in to manage your finances'
                : 'Sign up to start tracking your finances'}
            </p>
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
