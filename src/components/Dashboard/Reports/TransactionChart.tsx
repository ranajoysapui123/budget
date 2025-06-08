import React, { useState, useMemo } from 'react';
import Card from '../../ui/Card';
import { Transaction, CategoryDefinition } from '../../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Select from '../../ui/Select';

interface TransactionChartProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
  categories: CategoryDefinition[];
}

type ChartMode = 'daily' | 'weekly' | 'monthly';

const formatDate = (dateStr: string, mode: ChartMode) => {
  const date = new Date(dateStr);
  if (mode === 'daily') {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else if (mode === 'weekly') {
    return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
};

const TransactionChart: React.FC<TransactionChartProps> = ({
  transactions,
  startDate,
  endDate,
  categories
}) => {
  const [mode, setMode] = useState<ChartMode>('daily');

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const data: { date: string; income: number; expenses: number; net: number }[] = [];

    const getDateKey = (date: Date) => {
      if (mode === 'daily') {
        return date.toISOString().split('T')[0];
      } else if (mode === 'weekly') {
        const firstDay = new Date(date);
        firstDay.setDate(date.getDate() - date.getDay());
        return firstDay.toISOString().split('T')[0];
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
    };

    // Initialize data points
    let current = new Date(start);
    while (current <= end) {
      data.push({
        date: getDateKey(current),
        income: 0,
        expenses: 0,
        net: 0
      });

      if (mode === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (mode === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Helper function to get category amount including subcategories
    const getCategoryAmount = (categoryId: string): number => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return 0;

      let amount = 0;
      // Add main category transactions
      const mainCategoryTransactions = transactions.filter(t => t.category === categoryId);
      amount += mainCategoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Add subcategory transactions
      const subcategories = categories.filter(c => c.parentId === categoryId);
      subcategories.forEach(subcat => {
        const subcatTransactions = transactions.filter(t => t.category === subcat.id);
        amount += subcatTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      });

      return amount;
    };

    // Aggregate transactions
    transactions.forEach(transaction => {
      const dateKey = getDateKey(new Date(transaction.date));
      const dataPoint = data.find(d => d.date === dateKey);
      if (dataPoint) {
        const amount = Math.abs(transaction.amount);

        if (transaction.type === 'income') {
          dataPoint.income += amount;
        } else {
          dataPoint.expenses += amount;
        }
        dataPoint.net = dataPoint.income - dataPoint.expenses;
      }
    });

    // Format dates for display
    return data.map(point => ({
      ...point,
      displayDate: formatDate(point.date, mode)
    }));
  }, [transactions, mode, startDate, endDate, categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Transaction Trends</h3>
        <Select
          label="Chart Mode"
          value={mode}
          onChange={(value) => setMode(value as ChartMode)}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' }
          ]}
        />
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stackId="1"
              stroke="#4CAF50"
              fill="#4CAF50"
              fillOpacity={0.6}
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="2"
              stroke="#f44336"
              fill="#f44336"
              fillOpacity={0.6}
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#2196F3"
              fill="#2196F3"
              fillOpacity={0.6}
              name="Net"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.income, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.expenses, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.net, 0))}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TransactionChart;