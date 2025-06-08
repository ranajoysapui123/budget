import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PinSetup: React.FC = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setupPin, user, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be between 4-6 digits');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      setLoading(true);
      await setupPin(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string, isConfirm = false) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    if (isConfirm) {
      setConfirmPin(numericValue);
    } else {
      setPin(numericValue);
    }
    setError('');
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
            className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Set Up Your PIN
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome {user?.email}! Create a secure PIN to protect your financial data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Create PIN (4-6 digits)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest"
                placeholder="Enter PIN"
                maxLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, true)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest"
                placeholder="Confirm PIN"
                maxLength={6}
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
            >
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Important:</strong> Remember your PIN. You'll need it every time you return to the app.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || pin !== confirmPin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Setting up PIN...
              </div>
            ) : (
              'Set Up PIN'
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full text-gray-600 dark:text-gray-400 py-2 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Sign out instead
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PinSetup;