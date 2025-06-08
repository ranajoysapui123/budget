import React from 'react';
import Card from '../../ui/Card';
import { useApp } from '../../../contexts/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { formatCurrency } from '../../../utils/helpers';

interface ChartData {
  name: string;
  budget: number;
  actual: number;
  percentage: number;
}

const BudgetVsActual: React.FC = () => {
  const { user, currentMonthBudget, filteredTransactions } = useApp();

  // Calculate actual spending by category
  const actualSpending = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Prepare data for the chart
  const chartData = Object.entries(currentMonthBudget.categoryLimits || {}).map(([category, limit]) => {
    const actual = actualSpending[category] || 0;
    const percentage = limit > 0 ? Math.round((actual / limit) * 100) : 0;
    return {
      name: category,
      budget: limit,
      actual,
      percentage
    };
  });

  // Colors for the chart
  const COLORS = ['#10B981', '#EF4444'];

  // Custom tooltip formatter
  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartData;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-green-600">
            Budget: {formatCurrency(data.budget, user.settings.currency)}
          </p>
          <p className="text-sm text-red-600">
            Actual: {formatCurrency(data.actual, user.settings.currency)}
          </p>
          <p className={`text-sm ${data.percentage > 100 ? 'text-red-600' : 'text-gray-600'}`}>
            {data.percentage}% of budget
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Budget vs. Actual</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="budget"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
              >
                {chartData.map((_, index) => (
                  <Cell key={`budget-${index}`} fill={COLORS[0]} />
                ))}
              </Pie>
              <Pie
                data={chartData}
                dataKey="actual"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={85}
                outerRadius={95}
              >
                {chartData.map((_, index) => (
                  <Cell key={`actual-${index}`} fill={COLORS[1]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {chartData.map(item => (
            <div key={item.name} className="flex justify-between items-center text-sm">
              <span className="capitalize">{item.name}</span>
              <div className="space-x-4">
                <span className="text-green-600">
                  Budget: {formatCurrency(item.budget, user.settings.currency)}
                </span>
                <span className="text-red-600">
                  Actual: {formatCurrency(item.actual, user.settings.currency)}
                </span>
                <span className={`${item.percentage > 100 ? 'text-red-600' : 'text-gray-600'}`}>
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default BudgetVsActual;
