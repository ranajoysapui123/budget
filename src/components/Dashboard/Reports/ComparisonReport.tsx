import React, { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import TransactionChart from './TransactionChart';
import CategoryBreakdown from './CategoryBreakdown';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import { Transaction, CategoryDefinition } from '../../../types';

interface ComparisonReportProps {
  onTransactionsSelected: (transactions: Transaction[], startDate: string, endDate: string) => void;
}

const ComparisonReport: React.FC<ComparisonReportProps> = ({ onTransactionsSelected }) => {
  const { filteredTransactions, user } = useApp();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedRange, setSelectedRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: '',
    endDate: ''
  });

  const getDateRangeOptions = () => {
    const options: { label: string; start: string; end: string }[] = [];
    const today = new Date();
    
    // Add options based on selected period
    for (let i = 0; i < 12; i++) {
      let start = new Date(today);
      let end = new Date(today);
      let label = '';

      if (period === 'month') {
        start.setMonth(today.getMonth() - i, 1);
        end.setMonth(today.getMonth() - i + 1, 0);
        label = start.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else if (period === 'quarter') {
        const quarter = Math.floor((today.getMonth() - i * 3) / 3);
        start.setMonth(quarter * 3, 1);
        end.setMonth(quarter * 3 + 3, 0);
        label = `Q${quarter + 1} ${start.getFullYear()}`;
      } else {
        start.setFullYear(today.getFullYear() - i, 0, 1);
        end.setFullYear(today.getFullYear() - i, 11, 31);
        label = start.getFullYear().toString();
      }

      options.push({
        label,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });
    }

    return options;
  };

  const getFilteredTransactions = () => {
    if (!selectedRange.startDate || !selectedRange.endDate) return [];    return filteredTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(selectedRange.startDate) && 
             date <= new Date(selectedRange.endDate);
    });
  };

  useEffect(() => {
    const options = getDateRangeOptions();
    if (options.length > 0) {
      const latest = options[0];
      setSelectedRange({
        startDate: latest.start,
        endDate: latest.end
      });
    }
  }, [period]);

  useEffect(() => {
    const filteredTransactions = getFilteredTransactions();
    onTransactionsSelected(
      filteredTransactions,
      selectedRange.startDate,
      selectedRange.endDate
    );
  }, [selectedRange, filteredTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">          <Select
            label="Period"
            value={period}
            onChange={(value) => setPeriod(value as 'month' | 'quarter' | 'year')}
            options={[
              { value: 'month', label: 'Monthly' },
              { value: 'quarter', label: 'Quarterly' },
              { value: 'year', label: 'Yearly' }
            ]}
          />
          <Select
            label="Date Range"
            value={JSON.stringify(selectedRange)}
            onChange={(value) => {
              const range = JSON.parse(value);
              setSelectedRange(range);
            }}
            options={getDateRangeOptions().map(option => ({
              value: JSON.stringify({
                startDate: option.start,
                endDate: option.end
              }),
              label: option.label
            }))}
          />
        </div>
      </div>      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionChart 
          transactions={getFilteredTransactions()}
          startDate={selectedRange.startDate}
          endDate={selectedRange.endDate}
          categories={user.categories}
        />
        <CategoryBreakdown 
          transactions={getFilteredTransactions()}
          categories={user.categories}
        />
      </div>
    </div>
  );
};

export default ComparisonReport;