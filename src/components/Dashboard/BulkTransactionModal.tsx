import React, { useState, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../../components/ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { TransactionType } from '../../types';
import { getCategoriesByType, validateBulkTransactions } from '../../utils/helpers';

interface BulkTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type?: TransactionType;
  category?: string;
}

const BulkTransactionModal: React.FC<BulkTransactionModalProps> = ({ isOpen, onClose }) => {
  const { user, addTransaction } = useApp();
  const { showNotification } = useNotification();
  const [defaultType, setDefaultType] = useState<TransactionType>('expense');
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Smart categorization based on existing transactions
  const getCategorySuggestions = useCallback((description: string, amount: number): { 
    category: string; 
    type: TransactionType;
    confidence: number;
  }[] => {
    const suggestions: { category: string; type: TransactionType; confidence: number; }[] = [];
    const descriptionLower = description.toLowerCase();
    
    // Find similar transactions
    const similarTransactions = user.transactions
      .filter(t => t.description.toLowerCase().includes(descriptionLower) || 
                   descriptionLower.includes(t.description.toLowerCase()))
      .slice(0, 5);

    if (similarTransactions.length > 0) {
      // Group by category and type
      const categoryCount = similarTransactions.reduce((acc, t) => {
        const key = `${t.type}-${t.category}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to suggestions with confidence scores
      Object.entries(categoryCount).forEach(([key, count]) => {
        const [type, category] = key.split('-') as [TransactionType, string];
        const confidence = (count / similarTransactions.length) * 100;
        suggestions.push({ category, type, confidence });
      });
    }

    // Add suggestions based on amount patterns
    if (amount > 1000) {
      suggestions.push({ category: 'salary', type: 'income', confidence: 60 });
    }
    if (amount < 100) {
      suggestions.push({ category: 'food', type: 'expense', confidence: 40 });
    }

    // Common keywords matching
    const keywordMap: Record<string, { category: string; type: TransactionType; confidence: number }> = {
      'salary': { category: 'salary', type: 'income', confidence: 90 },
      'rent': { category: 'housing', type: 'expense', confidence: 90 },
      'uber': { category: 'transportation', type: 'expense', confidence: 85 },
      'netflix': { category: 'entertainment', type: 'expense', confidence: 85 },
      'grocery': { category: 'food', type: 'expense', confidence: 85 },
      'restaurant': { category: 'food', type: 'expense', confidence: 80 },
      'insurance': { category: 'healthcare', type: 'expense', confidence: 85 },
      'investment': { category: 'stocks', type: 'investment', confidence: 90 },
    };

    Object.entries(keywordMap).forEach(([keyword, suggestion]) => {
      if (descriptionLower.includes(keyword)) {
        suggestions.push(suggestion);
      }
    });

    // Sort by confidence and remove duplicates
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.category === suggestion.category && s.type === suggestion.type)
      );
  }, [user.transactions]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (content: string) => {
    try {
      const lines = content.split('\n');
      const parsed: ParsedTransaction[] = [];

      lines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return;

        const [date, description, amount] = line.split(',').map(s => s.trim());
        const parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));

        if (date && description && !isNaN(parsedAmount)) {
          parsed.push({
            date,
            description,
            amount: parsedAmount
          });
        }
      });

      // Validate the parsed transactions
      const validation = validateBulkTransactions(parsed, user.settings.currency);
      setValidationErrors(validation.errors);

      if (validation.isValid) {
        // Apply smart categorization
        const categorizedTransactions = parsed.map(t => {
          const suggestions = getCategorySuggestions(t.description, t.amount);
          const bestMatch = suggestions[0];

          return {
            ...t,
            type: bestMatch?.type || defaultType,
            category: bestMatch?.category || getCategoriesByType(defaultType)[0]
          };
        });

        setParsedTransactions(categorizedTransactions);
        
        if (categorizedTransactions.length > 0) {
          showNotification({
            type: 'success',
            message: `Successfully parsed ${categorizedTransactions.length} transactions`,
            duration: 4000
          });
        }
      } else {
        showNotification({
          type: 'info',
          message: 'Please review the validation warnings before importing',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('CSV parsing error:', error);
      showNotification({
        type: 'error',
        message: 'Failed to parse CSV file. Please check the format.',
        duration: 4000
      });
    }
  };

  const handleImport = () => {
    try {
      parsedTransactions.forEach(t => {
        if (t.type && t.category) {
          addTransaction({
            description: t.description,
            amount: t.amount,
            date: t.date,
            type: t.type,
            category: t.category,
            mainCategory: 'personal'
          });
        }
      });

      showNotification({
        type: 'success',
        message: `Successfully imported ${parsedTransactions.length} transactions`,
        duration: 4000
      });

      onClose();
      setParsedTransactions([]);
    } catch (error) {
      console.error('Import error:', error);
      showNotification({
        type: 'error',
        message: 'Failed to import transactions. Please try again.',
        duration: 4000
      });
    }
  };

  const updateTransactionType = (index: number, type: TransactionType) => {
    setParsedTransactions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        type,
        category: getCategoriesByType(type)[0]
      };
      return updated;
    });
  };

  const updateTransactionCategory = (index: number, category: string) => {
    setParsedTransactions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        category
      };
      return updated;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Transactions"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Upload a CSV file with the following columns: Date, Description, Amount
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <Select
          label="Default Transaction Type"
          value={defaultType}
          onChange={(value) => setDefaultType(value as TransactionType)}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
            { value: 'investment', label: 'Investment' }
          ]}
        />

        {validationErrors.length > 0 && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Please review the following:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsedTransactions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Preview ({parsedTransactions.length} transactions)
            </h3>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {parsedTransactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{transaction.date}</td>
                      <td className="px-4 py-2 text-sm">{transaction.description}</td>
                      <td className="px-4 py-2 text-sm">{transaction.amount}</td>
                      <td className="px-4 py-2">
                        <Select
                          label=""
                          value={transaction.type || defaultType}
                          onChange={(value) => updateTransactionType(index, value as TransactionType)}
                          options={[
                            { value: 'expense', label: 'Expense' },
                            { value: 'income', label: 'Income' },
                            { value: 'investment', label: 'Investment' }
                          ]}
                        />
                      <td className="px-4 py-2">
                        <Select
                          label=""
                          value={transaction.category || ''}
                          onChange={(value) => updateTransactionCategory(index, value)}
                          options={user.categories
                            .filter(c => !c.isArchived && (c.type === (transaction.type || defaultType)))
                            .map(cat => ({
                              value: cat.id,
                              label: cat.name,
                              indent: cat.parentId ? 1 : 0
                            }))}
                          renderOption={(option) => (
                            <span style={{ marginLeft: `${option.indent ? option.indent * 1.5 : 0}rem` }}>
                              {option.label}
                            </span>
                          )}
                        />
                      </td>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={validationErrors.some(error => !error.startsWith('Warning:'))}
              >
                Import Transactions
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkTransactionModal;