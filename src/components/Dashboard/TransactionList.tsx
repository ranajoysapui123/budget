import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Plus, Search, Filter, Edit, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionListProps {
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onAddTransaction, onEditTransaction }) => {
  const { filteredTransactions, deleteTransaction, filter, setFilter, user } = useApp();
  const [searchTerm, setSearchTerm] = useState(filter.search || '');
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ ...filter, search: searchTerm });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilter({ ...filter, search: '' });
  };

  const handleFilterByType = (type: 'income' | 'expense' | 'investment' | undefined) => {
    setFilter({ ...filter, type });
  };

  const toggleTransactionExpand = (transactionId: string) => {
    setExpandedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Transactions</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-10 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-2 top-1.5 text-gray-400 dark:text-gray-500" size={16} />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="sr-only">Search</button>
          </form>
          
          <div className="flex items-center gap-1">
            <Button
              variant={filter.type === undefined ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterByType(undefined)}
            >
              All
            </Button>
            <Button
              variant={filter.type === 'income' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterByType('income')}
            >
              Income
            </Button>
            <Button
              variant={filter.type === 'expense' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterByType('expense')}
            >
              Expenses
            </Button>
            <Button
              variant={filter.type === 'investment' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterByType('investment')}
            >
              Investments
            </Button>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={onAddTransaction}
            icon={<Plus size={16} />}
          >
            Add
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {filteredTransactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <tr 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {transaction.description}
                        {transaction.isSplit && (
                          <button
                            onClick={() => toggleTransactionExpand(transaction.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            {expandedTransactions.includes(transaction.id) ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 text-gray-800 dark:text-white`}>
                        {(() => {
                          const category = user.categories.find(c => c.id === transaction.category);
                          if (!category) return '';
                          
                          if (category.parentId) {
                            const parent = user.categories.find(c => c.id === category.parentId);
                            return parent ? `${parent.name} > ${category.name}` : category.name;
                          }
                          
                          return category.name;
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400'
                          : transaction.type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-purple-600 dark:text-purple-400'
                      }>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Badge type={transaction.type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTransaction(transaction)}
                        icon={<Edit size={14} />}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                        icon={<Trash size={14} />}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                  {transaction.isSplit && expandedTransactions.includes(transaction.id) && transaction.splits?.map(split => (
                    <tr 
                      key={split.id}
                      className="bg-gray-50 dark:bg-gray-800"
                    >
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 pl-8">
                        {split.description || 'Split portion'}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 text-gray-800 dark:text-white`}>
                          {(() => {
                            const category = user.categories.find(c => c.id === split.category);
                            if (!category) return '';
                            
                            if (category.parentId) {
                              const parent = user.categories.find(c => c.id === category.parentId);
                              return parent ? `${parent.name} > ${category.name}` : category.name;
                            }
                            
                            return category.name;
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                        {formatCurrency(split.amount)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No transactions found.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTransaction}
              icon={<Plus size={16} />}
              className="mt-4"
            >
              Add your first transaction
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionList;