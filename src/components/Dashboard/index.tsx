import React, { useState } from 'react';
import { Transaction } from '../../types';
import FinancialSummary from './FinancialSummary';
import MonthSelector from './MonthSelector';
import BudgetInsights from './BudgetInsights';
import TransactionList from './TransactionList';
import TransactionModal from './TransactionModal';
import BulkTransactionModal from './BulkTransactionModal';
import SavingsGoals from './SavingsGoals';
import CategoryManager from './CategoryManager';
import Button from '../ui/Button';
import { Plus, Filter, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionFilters from './TransactionFilters';
import { StudentManagement } from './index';

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isCategoryManagerVisible, setIsCategoryManagerVisible] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const handleAddTransaction = () => {
    setEditTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditTransaction(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MonthSelector />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FinancialSummary />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BudgetInsights />
          <SavingsGoals />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={isFiltersVisible ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              icon={<Filter size={16} />}
            >
              Filters
            </Button>
            <Button
              variant={isCategoryManagerVisible ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsCategoryManagerVisible(!isCategoryManagerVisible)}
              icon={<Database size={16} />}
            >
              Categories
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Bulk Add
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddTransaction}
              icon={<Plus size={16} />}
            >
              Add Transaction
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFiltersVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TransactionFilters />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryManagerVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <CategoryManager />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <TransactionList
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
        />
      </motion.div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editTransaction={editTransaction}
      />

      <BulkTransactionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8"
      >
        <StudentManagement />
      </motion.div>
    </div>
  );
};

export default Dashboard;
export { default as StudentManagement } from './StudentManagement';