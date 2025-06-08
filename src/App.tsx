import { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Reports from './pages/Reports';
import CategoryManager from './components/Dashboard/CategoryManager';
import RecurringTransactions from './components/Dashboard/RecurringTransactions';
import BudgetSettings from './components/Dashboard/BudgetSettings';
import StudentManagement from './components/StudentManagement'; // Add this import
import Auth from './pages/Auth';
import PinSetup from './pages/PinSetup.tsx';
import PinVerification from './pages/PinVerification.tsx';
import { AnimatePresence, motion } from 'framer-motion';


// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <motion.div 
      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'categories' | 'recurring' | 'budget' | 'students'>('dashboard');
  const { 
    isAuthenticated, 
    isFullyAuthenticated, 
    needsPinSetup, 
    pinRequired, 
    pinVerified,
    loading 
  } = useAuth();

  const getComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
      case 'categories':
        return <CategoryManager />;
      case 'recurring':
        return <RecurringTransactions />;
      case 'budget':
        return <BudgetSettings />;
      case 'students': // Add this case
        return <StudentManagement />;
      default:
        return null;
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Auth />
      </div>
    );
  }

  // Authenticated but needs PIN setup (new user)
  if (needsPinSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <PinSetup />
      </div>
    );
  }

  // Authenticated with PIN required but not verified
  if (pinRequired && !pinVerified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <PinVerification />
      </div>
    );
  }

  // Fully authenticated - show main app
  if (isFullyAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {getComponent()}
          </motion.main>
        </AnimatePresence>
      </div>
    );
  }

  // Fallback - should not reach here
  return <LoadingSpinner />;
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;