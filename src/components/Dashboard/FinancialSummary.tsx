import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import Card from '../ui/Card';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency, calculateTotal, detectCurrency } from '../../utils/helpers';

const FinancialSummary: React.FC = () => {
  const { user, filteredTransactions } = useApp();
  const { showNotification } = useNotification();

  const { totalIncome, totalExpenses, totalInvestments, netBalance } = useMemo(() => ({
    totalIncome: calculateTotal(filteredTransactions, 'income'),
    totalExpenses: calculateTotal(filteredTransactions, 'expense'),
    totalInvestments: calculateTotal(filteredTransactions, 'investment'),
    netBalance: calculateTotal(filteredTransactions, 'income') - 
               calculateTotal(filteredTransactions, 'expense') - 
               calculateTotal(filteredTransactions, 'investment')
  }), [filteredTransactions]);

  // Check currency patterns
  useMemo(() => {
    if (filteredTransactions.length >= 5) {
      const detectedPatterns = detectCurrency(filteredTransactions);
      const currentCurrency = user.settings.currency;
      
      // If the detected currency with highest confidence doesn't match current settings
      const mostLikelyCurrency = detectedPatterns[0];
      if (mostLikelyCurrency && mostLikelyCurrency.currency !== currentCurrency && mostLikelyCurrency.confidence > 70) {
        showNotification({
          type: 'info',
          message: `Your transactions seem to be in ${mostLikelyCurrency.currency}. Consider updating your currency settings.`,
          duration: 7000
        });
      }
    }
  }, [filteredTransactions, user.settings.currency]);

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Total Income</h3>
            <ArrowUpCircle className="text-green-500" size={20} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-300">
            {formatCurrency(totalIncome, user.settings.currency)}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Total Expenses</h3>
            <ArrowDownCircle className="text-red-500" size={20} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-300">
            {formatCurrency(totalExpenses, user.settings.currency)}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Investments</h3>
            <DollarSign className="text-purple-500" size={20} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-purple-700 dark:text-purple-300">
            {formatCurrency(totalInvestments, user.settings.currency)}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Net Balance</h3>
            {netBalance >= 0 ? (
              <ArrowUpCircle className="text-blue-500" size={20} />
            ) : (
              <AlertCircle className="text-yellow-500" size={20} />
            )}
          </div>
          <p className={`mt-2 text-2xl font-semibold ${
            netBalance >= 0 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {formatCurrency(netBalance, user.settings.currency)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FinancialSummary;