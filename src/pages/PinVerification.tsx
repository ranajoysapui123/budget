import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PinVerification: React.FC = () => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { verifyPin, user, logout } = useAuth();

  // Handle lockout countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) return;
    
    setError('');

    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be between 4-6 digits');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    try {
      setLoading(true);
      await verifyPin(pin);
      // Reset attempts on successful verification
      setAttempts(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
      setError(errorMessage);
      
      // Handle lockout logic
      if (errorMessage.includes('locked')) {
        setIsLocked(true);
        setLockoutTime(15 * 60); // 15 minutes in seconds
      } else if (errorMessage.includes('attempts remaining')) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
      }
      
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    if (isLocked) return;
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);
    setError('');
  };

  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isLocked 
                ? 'bg-red-100 dark:bg-red-900' 
                : 'bg-blue-100 dark:bg-blue-900'
            }`}
          >
            {isLocked ? (
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            ) : (
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isLocked ? 'Account Locked' : 'Enter Your PIN'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLocked 
              ? `Too many failed attempts. Try again in ${formatLockoutTime(lockoutTime)}`
              : `Welcome back ${user?.email}! Please enter your PIN to continue.`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent text-center text-lg tracking-widest ${
                  isLocked
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-blue-500'
                } text-gray-900 dark:text-white`}
                placeholder={isLocked ? 'Locked' : 'Enter PIN'}
                maxLength={6}
                disabled={isLocked || loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
{error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-3 ${
                  isLocked
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLocked || loading || pin.length < 4}
              whileHover={{ scale: isLocked ? 1 : 1.02 }}
              whileTap={{ scale: isLocked ? 1 : 0.98 }}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLocked
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : loading
                  ? 'bg-blue-400 dark:bg-blue-500 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Verify PIN'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Sign out and use different account
            </button>
          </div>

          {attempts > 0 && !isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
                {5 - attempts} attempt{5 - attempts > 1 ? 's' : ''} remaining.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  };

  export default PinVerification;