import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  token: string | null;
  user: { id: string; email: string } | null;
  pinRequired: boolean;
  pinVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isFullyAuthenticated: boolean;
  needsPinSetup: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [pinVerified, setPinVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { showNotification } = useNotification();

  // Check session and PIN status on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await checkSessionStatus();
      } else {
        resetPinState();
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, [token]);

  // Reset PIN verification on app focus (when user returns to app)
  useEffect(() => {
    const handleFocus = () => {
      if (token && pinRequired && pinVerified) {
        setPinVerified(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token && pinRequired && pinVerified) {
        setPinVerified(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, pinRequired, pinVerified]);

  const checkSessionStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/session-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        throw new Error(data.message || 'Session check failed');
      }

      setUser(data.user);
      setPinRequired(data.pinRequired);
      setPinVerified(data.pinVerified);
    } catch (err) {
      console.error('Session check error:', err);
      logout();
    }
  };

  const resetPinState = () => {
    setPinRequired(false);
    setPinVerified(false);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setPinRequired(data.pinRequired);
      setPinVerified(false); // Always require PIN verification after login
      
      showNotification({
        type: 'success',
        message: 'Login successful'
      });
    } catch (err) {
      console.error('Login error:', err);
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Login failed'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setPinRequired(false); // New users don't have PIN yet
      setPinVerified(true); // Allow access to set up PIN
      
      showNotification({
        type: 'success',
        message: 'Registration successful. Please set up your PIN for security.'
      });
    } catch (err) {
      console.error('Registration error:', err);
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Registration failed'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setupPin = async (pin: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/setup-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'PIN setup failed');
      }

      setPinRequired(true);
      setPinVerified(true);
      
      showNotification({
        type: 'success',
        message: 'PIN set up successfully'
      });
    } catch (err) {
      console.error('PIN setup error:', err);
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'PIN setup failed'
      });
      throw err;
    }
  };

  const verifyPin = async (pin: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'PIN verification failed');
      }

      setPinVerified(true);
      
      showNotification({
        type: 'success',
        message: 'PIN verified successfully'
      });
    } catch (err) {
      console.error('PIN verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
      showNotification({
        type: 'error',
        message: errorMessage
      });
      throw err;
    }
  };

  const changePin = async (oldPin: string, newPin: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPin, newPin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'PIN change failed');
      }

      showNotification({
        type: 'success',
        message: 'PIN changed successfully'
      });
    } catch (err) {
      console.error('PIN change error:', err);
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'PIN change failed'
      });
      throw err;
    }
  };

  const logout = () => {
    // Call logout endpoint to clean up server-side session
    if (token) {
      fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.error('Logout API error:', err));
    }

    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('budgetPlannerUser');
    resetPinState();
    
    showNotification({
      type: 'info',
      message: 'Logged out successfully'
    });
  };

  const isAuthenticated = !!token && !!user;
  const isFullyAuthenticated = isAuthenticated && (!pinRequired || pinVerified);
  const needsPinSetup = isAuthenticated && !pinRequired && pinVerified;

  return (
    <AuthContext.Provider value={{
      token,
      user,
      pinRequired,
      pinVerified,
      login,
      register,
      setupPin,
      verifyPin,
      changePin,
      logout,
      isAuthenticated,
      isFullyAuthenticated,
      needsPinSetup,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};