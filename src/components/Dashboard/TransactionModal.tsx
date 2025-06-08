import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Transaction, TransactionType, MainCategory, SplitTransaction, CategoryDefinition } from '../../types';
import { getSplitSuggestions } from '../../utils/helpers';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { X, Image as ImageIcon, Trash } from 'lucide-react';
import TransactionSplitForm from './TransactionSplitForm';
import { useNotification } from '../../contexts/NotificationContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction: Transaction | null;
}

interface CategoryOption {
  value: string;
  label: string;
  indent?: number;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, editTransaction }) => {
  const { user, addTransaction, updateTransaction } = useApp();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialValues = {
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'expense' as TransactionType,
    category: '',
    mainCategory: 'personal' as MainCategory,
    reference: {
      type: 'receipt' as const,
      number: '',
      notes: '',
      screenshot: ''
    },
    isSplit: false,
    splits: [] as SplitTransaction[]
  };

  const [description, setDescription] = useState(initialValues.description);
  const [amount, setAmount] = useState(initialValues.amount);
  const [date, setDate] = useState(initialValues.date);
  const [type, setType] = useState<TransactionType>(initialValues.type);
  const [category, setCategory] = useState<string>(initialValues.category);
  const [mainCategory, setMainCategory] = useState<MainCategory>(initialValues.mainCategory);
  const [referenceType, setReferenceType] = useState<'receipt' | 'invoice' | 'contract' | 'other'>(initialValues.reference.type);
  const [referenceNumber, setReferenceNumber] = useState(initialValues.reference.number);
  const [referenceNotes, setReferenceNotes] = useState(initialValues.reference.notes);
  const [screenshot, setScreenshot] = useState(initialValues.reference.screenshot);
  const [isSplit, setIsSplit] = useState(initialValues.isSplit);
  const [splits, setSplits] = useState<SplitTransaction[]>(initialValues.splits);

  // Convert categories to hierarchical options including subcategories
  const categoryOptions = useMemo(() => {
    const options: CategoryOption[] = [];
    
    // Add main categories first
    user.categories
      .filter(cat => !cat.parentId && cat.type === type && !cat.isArchived)
      .forEach(cat => {
        options.push({
          value: cat.id,
          label: cat.name,
          indent: 0
        });

        // Add subcategories
        user.categories
          .filter(subCat => subCat.parentId === cat.id && !subCat.isArchived && subCat.type === type)
          .forEach(subCat => {
            options.push({
              value: subCat.id,
              label: subCat.name,
              indent: 1
            });
          });
      });

    return options;
  }, [user.categories, type]);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setDate(editTransaction.date.slice(0, 10));
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setMainCategory(editTransaction.mainCategory);
      if (editTransaction.reference) {
        setReferenceType(editTransaction.reference.type);
        setReferenceNumber(editTransaction.reference.number);
        setReferenceNotes(editTransaction.reference.notes || '');
        setScreenshot(editTransaction.reference.screenshot || '');
      }
      setIsSplit(editTransaction.isSplit || false);
      setSplits(editTransaction.splits || []);
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]);

  useEffect(() => {
    // When type changes, reset category and select first available category
    if (categoryOptions.length > 0) {
      setCategory(categoryOptions[0].value);
    }
  }, [type, categoryOptions]);

  useEffect(() => {
    if (description && amount && type && !editTransaction && !splits.length) {
      const suggestions = getSplitSuggestions(
        description,
        parseFloat(amount),
        type,
        user.transactions
      );

      if (suggestions) {
        showNotification({
          type: 'info',
          message: 'Split suggestion available based on similar transactions',
          duration: 5000
        });
      }
    }
  }, [description, amount, type]);

  const resetForm = () => {
    setDescription(initialValues.description);
    setAmount(initialValues.amount);
    setDate(initialValues.date);
    setType(initialValues.type);
    setCategory(initialValues.category);
    setMainCategory(initialValues.mainCategory);
    setReferenceType(initialValues.reference.type);
    setReferenceNumber(initialValues.reference.number);
    setReferenceNotes(initialValues.reference.notes);
    setScreenshot(initialValues.reference.screenshot);
    setIsSplit(initialValues.isSplit);
    setSplits(initialValues.splits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      showNotification({
        type: 'error',
        message: 'Please select a category',
        duration: 4000
      });
      return;
    }

    const selectedCategory = user.categories.find(c => c.id === category);
    if (!selectedCategory) {
      showNotification({
        type: 'error',
        message: 'Invalid category selected',
        duration: 4000
      });
      return;
    }

    const transaction: Omit<Transaction, 'id'> = {
      description,
      amount: parseFloat(amount),
      date: date + (date.length === 10 ? 'T00:00:00.000Z' : ''),
      type,
      category,
      mainCategory,
      reference: {
        type: referenceType,
        number: referenceNumber,
        notes: referenceNotes || undefined,
        screenshot: screenshot || undefined
      },
      isSplit,
      splits
    };

    if (editTransaction) {
      updateTransaction({ ...transaction, id: editTransaction.id });
    } else {
      addTransaction(transaction);
    }

    onClose();
    resetForm();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshot(event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteScreenshot = () => {
    setScreenshot('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get category full name with parent
  const getCategoryFullName = (categoryId: string): string => {
    const category = user.categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parentId) {
      const parent = user.categories.find(c => c.id === category.parentId);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    
    return category.name;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

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
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={setDate}
              required
            />

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

            {!isSplit && (
              <>
                <Select
                  label="Category"
                  value={category}
                  onChange={(value) => {
                    setCategory(value);
                    const parentCat = user.categories.find(c => c.id === value);
                    if (parentCat && !parentCat.parentId) {
                      // If there's a subcategory, select the first one
                      const firstSubCat = user.categories.find(c => c.parentId === value);
                      if (firstSubCat) {
                        setCategory(firstSubCat.id);
                      }
                    }
                  }}
                  options={[
                    ...user.categories
                      .filter(c => !c.parentId && c.type === type && !c.isArchived)
                      .map(c => ({
                        value: c.id,
                        label: c.name
                      }))
                  ]}
                  required
                />

                {category && (
                  <Select
                    label="Subcategory"
                    value={category}
                    onChange={setCategory}
                    options={[
                      ...user.categories
                        .filter(c => {
                          const parentCat = user.categories.find(pc => pc.id === c.parentId);
                          return c.parentId && parentCat && parentCat.type === type && !c.isArchived;
                        })
                        .map(c => ({
                          value: c.id,
                          label: c.name
                        }))
                    ]}
                  />
                )}

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
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="splitTransaction"
                checked={isSplit}
                onChange={(e) => {
                  setIsSplit(e.target.checked);
                  if (!e.target.checked) {
                    setSplits([]);
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="splitTransaction" className="text-sm text-gray-600 dark:text-gray-300">
                Split Transaction
              </label>
            </div>
          </div>

          {isSplit && (
            <TransactionSplitForm
              type={type}
              totalAmount={parseFloat(amount || '0')}
              splits={splits}
              onChange={setSplits}
            />
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Reference</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Type"
                  value={referenceType}
                  onChange={(value) => setReferenceType(value as typeof referenceType)}
                  options={[
                    { value: 'receipt', label: 'Receipt' },
                    { value: 'invoice', label: 'Invoice' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'other', label: 'Other' }
                  ]}
                />

                <Input
                  label="Reference Number"
                  value={referenceNumber}
                  onChange={setReferenceNumber}
                  placeholder="Enter reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<ImageIcon size={16} />}
                  >
                    Upload Screenshot
                  </Button>

                  {screenshot && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDeleteScreenshot}
                      icon={<Trash size={16} />}
                    >
                      Remove Screenshot
                    </Button>
                  )}
                </div>
                {screenshot && (
                  <div className="mt-2">
                    <img
                      src={screenshot}
                      alt="Receipt"
                      className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editTransaction ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;