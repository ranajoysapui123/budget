import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { TransactionType, TransactionCategory, MainCategory } from '../../types';
import Select from '../ui/Select';
import Input from '../ui/Input';
import TagInput from '../ui/TagInput';
import { Filter, X } from 'lucide-react';

const TransactionFilters: React.FC = () => {
  const { filter, setFilter, user } = useApp();

  const handleClearFilters = () => {
    setFilter({
      month: filter.month // Preserve the current month
    });
  };

  const handleDateRangeChange = (type: 'start' | 'end') => (value: string) => {
    setFilter({
      ...filter,
      dateRange: {
        startDate: type === 'start' ? (value || '') : (filter.dateRange?.startDate || ''),
        endDate: type === 'end' ? (value || '') : (filter.dateRange?.endDate || '')
      }
    });
  };

  const handleAmountRangeChange = (type: 'min' | 'max') => (value: string) => {
    setFilter({
      ...filter,
      amountRange: {
        ...filter.amountRange,
        [type]: value ? parseFloat(value) : undefined
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <Filter size={18} className="mr-2" />
          Filters
        </h3>
        
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
        >
          <X size={14} className="mr-1" />
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Select
            label="Transaction Type"
            value={filter.type || ''}
            onChange={(value) => setFilter({ ...filter, type: value as TransactionType })}
            options={[
              { value: '', label: 'All Types' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
              { value: 'investment', label: 'Investment' }
            ]}
          />

          <Select
            label="Category"
            value={filter.categories?.[0] || ''}
            onChange={(value) => setFilter({ ...filter, categories: value ? [value] : undefined })}
            options={[
              { value: '', label: 'All Categories' },
              ...user.categories
                .filter(c => !c.parentId && !c.isArchived)
                .map(c => ({
                  value: c.id,
                  label: c.name,
                  indent: 0
                }))
                .concat(
                  user.categories
                    .filter(c => c.parentId && !c.isArchived)
                    .map(c => ({
                      value: c.id,
                      label: c.name,
                      indent: 1
                    }))
                )
            ]}
            renderOption={(option) => (
              <span style={{ marginLeft: `${option.indent ? option.indent * 1.5 : 0}rem` }}>
                {option.label}
              </span>
            )}
          />

          <Select
            label="Main Category"
            value={filter.mainCategories?.[0] || ''}
            onChange={(value) => setFilter({ ...filter, mainCategories: value ? [value as MainCategory] : undefined })}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' },
              { value: 'family', label: 'Family' }
            ]}
          />
        </div>

        <div className="space-y-4">
          <Input
            label="Start Date"
            type="date"
            value={filter.dateRange?.startDate || ''}
            onChange={handleDateRangeChange('start')}
          />

          <Input
            label="End Date"
            type="date"
            value={filter.dateRange?.endDate || ''}
            onChange={handleDateRangeChange('end')}
          />
        </div>

        <div className="space-y-4">
          <Input
            label="Minimum Amount"
            type="number"
            value={filter.amountRange?.min?.toString() || ''}
            onChange={handleAmountRangeChange('min')}
            placeholder="Enter minimum amount"
          />

          <Input
            label="Maximum Amount"
            type="number"
            value={filter.amountRange?.max?.toString() || ''}
            onChange={handleAmountRangeChange('max')}
            placeholder="Enter maximum amount"
          />
        </div>
      </div>

      <div className="mt-4">
        <TagInput
          selectedTags={filter.tags || []}
          onChange={(tags) => setFilter({ ...filter, tags })}
        />
      </div>
    </div>
  );
};

export default TransactionFilters;