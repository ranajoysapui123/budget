import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Menu, X, LayoutDashboard, PieChart, FolderTree, Repeat, Settings } from 'lucide-react';
import Button from './ui/Button';
import { motion } from 'framer-motion';

interface HeaderProps {
  activeTab: 'dashboard' | 'reports' | 'categories' | 'recurring' | 'budget' | 'students';
  onTabChange: (tab: 'dashboard' | 'reports' | 'categories' | 'recurring' | 'budget' | 'students') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { user, updateSettings } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleTheme = () => {
    const newTheme = user.settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ ...user.settings, theme: newTheme });
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  React.useEffect(() => {
    if (user.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user.settings.theme]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'budget', label: 'Budget', icon: Settings },
    { id: 'students', label: 'Student Management', icon: Settings },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center">
              BudgetTracker
            </h1>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-2">
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onTabChange(tab.id as typeof activeTab)}
                  icon={<tab.icon size={16} />}
                >
                  {tab.label}
                </Button>
              </motion.div>
            ))}
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleTheme}
                icon={user.settings.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              >
                {user.settings.theme === 'light' ? 'Dark' : 'Light'}
              </Button>
            </motion.div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <motion.div 
          className="md:hidden shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800">
            {tabs.map((tab) => (
              <Button 
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  onTabChange(tab.id as typeof activeTab);
                  setIsMenuOpen(false);
                }}
                icon={<tab.icon size={16} />}
                fullWidth
              >
                {tab.label}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              icon={user.settings.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              fullWidth
            >
              {user.settings.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;