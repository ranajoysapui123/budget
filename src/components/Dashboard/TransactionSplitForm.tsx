import React, { useState, useEffect, useMemo } from 'react';
import { SplitTransaction, TransactionType, MainCategory, CategoryDefinition } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/helpers';
import { useApp } from '../../contexts/AppContext';

interface SplitTransactionFormProps {
  type: TransactionType;
  totalAmount: number;
  splits: SplitTransaction[];
  onChange: (splits: SplitTransaction[]) => void;
}

interface CategoryOption {
  value: string;
  label: string;
  indent?: number;
}

const SplitTransactionForm: React.FC<SplitTransactionFormProps> = ({
  type,
  totalAmount,
  splits,
  onChange
}) => {
  const { user } = useApp();
  const [localSplits, setLocalSplits] = useState<SplitTransaction[]>(splits);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);
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
          .filter(subCat => subCat.parentId === cat.id && !subCat.isArchived)
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
    setRemainingAmount(totalAmount - localSplits.reduce((sum, split) => sum + split.amount, 0));
  }, [totalAmount, localSplits]);

  const handleAddSplit = () => {
    const defaultCategory = categoryOptions[0]?.value || '';
    const newSplit: SplitTransaction = {
      id: generateId(),
      amount: remainingAmount,
      category: defaultCategory,
      mainCategory: 'personal',
      description: ''
    };

    const updatedSplits = [...localSplits, newSplit];
    setLocalSplits(updatedSplits);
    onChange(updatedSplits);
  };

  const handleRemoveSplit = (id: string) => {
    const updatedSplits = localSplits.filter(split => split.id !== id);
    setLocalSplits(updatedSplits);
    onChange(updatedSplits);
  };

  const handleSplitChange = (id: string, field: keyof SplitTransaction, value: any) => {
    const updatedSplits = localSplits.map(split => {
      if (split.id === id) {
        return { ...split, [field]: field === 'amount' ? parseFloat(value) : value };
      }
      return split;
    });
    setLocalSplits(updatedSplits);
    onChange(updatedSplits);
  };

  const renderOptionLabel = (option: CategoryOption) => (
    <span style={{ marginLeft: `${option.indent ? option.indent * 1.5 : 0}rem` }}>
      {option.label}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {localSplits.map((split) => (
          <div key={split.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Amount"
                type="number"
                value={split.amount.toString()}
                onChange={(value) => handleSplitChange(split.id, 'amount', value)}
                min={0}
                step={0.01}
                required
              />

              <Select
                label="Category"
                value={split.category}
                onChange={(value) => handleSplitChange(split.id, 'category', value)}
                options={categoryOptions}
                renderOption={renderOptionLabel}
                required
              />

              <Select
                label="Main Category"
                value={split.mainCategory}
                onChange={(value) => handleSplitChange(split.id, 'mainCategory', value as MainCategory)}
                options={[
                  { value: 'personal', label: 'Personal' },
                  { value: 'business', label: 'Business' },
                  { value: 'family', label: 'Family' }
                ]}
                required
              />

              <Input
                label="Description (Optional)"
                value={split.description || ''}
                onChange={(value) => handleSplitChange(split.id, 'description', value)}
                placeholder="Split description"
              />
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveSplit(split.id)}
              className="mt-8"
              icon={<Trash2 size={14} />}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddSplit}
        icon={<Plus size={14} />}
        disabled={remainingAmount <= 0}
      >
        Add Split
      </Button>

      {remainingAmount !== 0 && (
        <p className="text-sm text-red-500">
          Total split amounts must equal the transaction amount
        </p>
      )}
    </div>
  );
};

export default SplitTransactionForm;