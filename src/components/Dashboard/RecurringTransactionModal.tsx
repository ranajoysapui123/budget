import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { RecurringTransaction, TransactionType, TransactionCategory, MainCategory, RecurringFrequency } from '../../types';
import { getCategoriesByType, generateId } from '../../utils/helpers';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction: RecurringTransaction | null;
}

const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({
  isOpen,
  onClose,
  editTransaction
}) => {
  const { user, updateUser } = useApp();
  
  const initialValues = {
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'food' as TransactionCategory,
    mainCategory: 'personal' as MainCategory,
    frequency: 'monthly' as const,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: ''
  };
  
  const [description, setDescription] = useState(initialValues.description);
  const [amount, setAmount] = useState(initialValues.amount);
  const [type, setType] = useState<TransactionType>(initialValues.type);
  const [category, setCategory] = useState<TransactionCategory>(initialValues.category);
  const [mainCategory, setMainCategory] = useState<MainCategory>(initialValues.mainCategory);
  const [frequency, setFrequency] = useState<RecurringFrequency>(initialValues.frequency);
  const [startDate, setStartDate] = useState(initialValues.startDate);
  const [endDate, setEndDate] = useState(initialValues.endDate);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setMainCategory(editTransaction.mainCategory);
      setFrequency(editTransaction.frequency);
      setStartDate(editTransaction.startDate.slice(0, 10));
      setEndDate(editTransaction.endDate?.slice(0, 10) || '');
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]);
  
  useEffect(() => {
    setCategory(getCategoriesByType(type)[0]);
  }, [type]);
  
  const resetForm = () => {
    setDescription(initialValues.description);
    setAmount(initialValues.amount);
    setType(initialValues.type);
    setCategory(initialValues.category);
    setMainCategory(initialValues.mainCategory);
    setFrequency(initialValues.frequency);
    setStartDate(initialValues.startDate);
    setEndDate(initialValues.endDate);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recurringTransaction: RecurringTransaction = {
      id: editTransaction?.id || generateId(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      mainCategory,
      frequency,
      startDate: startDate + (startDate.length === 10 ? 'T00:00:00.000Z' : ''),
      endDate: endDate ? endDate + 'T00:00:00.000Z' : undefined,
      lastProcessed: editTransaction?.lastProcessed
    };
    
    const updatedRecurringTransactions = editTransaction
      ? (user.recurringTransactions ?? []).map(t => 
          t.id === editTransaction.id ? recurringTransaction : t
        )
      : [...(user.recurringTransactions ?? []), recurringTransaction];
    
    updateUser({
      ...user,
      recurringTransactions: updatedRecurringTransactions
    });
    
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="fixed inset-0 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editTransaction ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Enter transaction description"
                required
              />
              
              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Enter amount"
                min={0.01}
                step={0.01}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Type"
                value={type}
                onChange={(value) => setType(value as TransactionType)}
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'investment', label: 'Investment' }
                ]}
                required
              />
              
              <Select
                label="Main Category"
                value={mainCategory}
                onChange={(value) => setMainCategory(value as MainCategory)}
                options={[
                  { value: 'personal', label: 'Personal' },
                  { value: 'business', label: 'Business' },
                  { value: 'family', label: 'Family' }
                ]}
                required
              />
              
              <Select
                label="Category"
                value={category}
                onChange={(value) => setCategory(value)}
                options={user.categories
                  .filter(cat => !cat.parentId && cat.type === type && !cat.isArchived)
                  .map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    indent: 0
                  }))
                  .concat(
                    user.categories
                      .filter(cat => cat.parentId && cat.type === type && !cat.isArchived)
                      .map(cat => ({
                        value: cat.id,
                        label: cat.name,
                        indent: 1
                      }))
                  )}
                renderOption={(option) => (
                  <span style={{ marginLeft: `${option.indent ? option.indent * 1.5 : 0}rem` }}>
                    {option.label}
                  </span>
                )}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Frequency"
                value={frequency}
                onChange={(value) => setFrequency(value as RecurringFrequency)}
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'yearly', label: 'Yearly' }
                ]}
                required
              />
              
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={setStartDate}
                required
              />
              
              <Input
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={setEndDate}
                min={startDate}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-8">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                size="lg"
              >
                {editTransaction ? 'Update' : 'Create'} Recurring Transaction
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecurringTransactionModal;