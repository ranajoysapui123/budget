import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Repeat, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { RecurringTransaction } from '../../types';
import { formatCurrency, formatDate, getCategoryDisplayName } from '../../utils/helpers';
import RecurringTransactionModal from './RecurringTransactionModal';

const RecurringTransactions: React.FC = () => {
  const { user, deleteRecurringTransaction } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<RecurringTransaction | null>(null);

  const handleAddRecurring = () => {
    setEditTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditRecurring = (transaction: RecurringTransaction) => {
    setEditTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteRecurring = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction? This will also remove all related transactions.')) {
      deleteRecurringTransaction(id);
    }
  };

  const getNextDueDate = (transaction: RecurringTransaction): Date => {
    const lastProcessed = transaction.lastProcessed 
      ? new Date(transaction.lastProcessed)
      : new Date(transaction.startDate);
    
    const nextDue = new Date(lastProcessed);
    
    switch (transaction.frequency) {
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'yearly':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }
    
    return nextDue;
  };

  const isOverdue = (nextDueDate: Date): boolean => {
    return nextDueDate < new Date();
  };

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <Repeat size={18} className="mr-2" />
          Recurring Transactions
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddRecurring}
          icon={<Plus size={16} />}
        >
          Add Recurring
        </Button>
      </div>

      {(user?.recurringTransactions?.length ?? 0) > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frequency
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Due
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {(user?.recurringTransactions ?? []).map((transaction) => {
                const nextDueDate = getNextDueDate(transaction);
                const overdue = isOverdue(nextDueDate);

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getCategoryDisplayName(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {transaction.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar size={14} className="mr-1" />
                        {formatDate(nextDueDate.toISOString())}
                        {overdue && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecurring(transaction)}
                        icon={<Edit2 size={14} />}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRecurring(transaction.id)}
                        icon={<Trash2 size={14} />}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No recurring transactions set up yet.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddRecurring}
            icon={<Plus size={16} />}
            className="mt-4"
          >
            Add your first recurring transaction
          </Button>
        </div>
      )}

      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editTransaction={editTransaction}
      />
    </Card>
  );
};

export default RecurringTransactions;