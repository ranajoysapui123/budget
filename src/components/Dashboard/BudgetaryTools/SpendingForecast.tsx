import React, { useMemo } from 'react';
import Card from '../../ui/Card';
import { useApp } from '../../../contexts/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, TooltipProps } from 'recharts';
import { formatCurrency } from '../../../utils/helpers';

interface ForecastData {
  month: string;
  actual: number;
  forecast: number | null;
  upperBound: number | null;
  lowerBound: number | null;
}

const SpendingForecast: React.FC = () => {
  const { user, filteredTransactions } = useApp();

  const forecastData = useMemo(() => {
    // Get the last 6 months of spending
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    
    // Group transactions by month
    const monthlySpending = filteredTransactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= sixMonthsAgo)
      .reduce((acc, t) => {
        const monthKey = t.date.substring(0, 7); // YYYY-MM
        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Calculate weighted moving average (more recent months have higher weights)
    const values = Object.entries(monthlySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, amount]) => amount);

    const weights = values.map((_, i) => i + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const weightedAvg = values.reduce((sum, val, i) => sum + (val * weights[i]), 0) / weightSum;

    // Calculate standard deviation for confidence intervals
    const squaredDiffs = values.map(v => Math.pow(v - weightedAvg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Project next 3 months with confidence intervals
    const data: ForecastData[] = [];
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    for (let i = -6; i <= 3; i++) {
      const month = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1);
      const monthKey = month.toISOString().substring(0, 7);
      const actual = monthlySpending[monthKey] || 0;
      
      // Calculate forecast and confidence intervals for future months
      const forecast = i > 0 ? weightedAvg + (weightedAvg * 0.01 * i) : null;
      const confidence = stdDev * 1.96; // 95% confidence interval

      data.push({
        month: month.toLocaleString('default', { month: 'short', year: '2-digit' }),
        actual,
        forecast,
        upperBound: forecast !== null ? forecast + confidence : null,
        lowerBound: forecast !== null ? Math.max(0, forecast - confidence) : null
      });
    }

    return data;
  }, [filteredTransactions]);

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <p className="text-sm font-medium">Month: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm ${
              entry.dataKey === 'actual' ? 'text-blue-600' :
              entry.dataKey === 'forecast' ? 'text-purple-600' : 'text-gray-600'
            }`}>
              {entry.name}: {formatCurrency(entry.value || 0, user.settings.currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Spending Forecast</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, user.settings.currency)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                dataKey="upperBound"
                stroke="none"
                fill="#9333EA"
                fillOpacity={0.1}
              />
              <Area
                dataKey="lowerBound"
                stroke="none"
                fill="#9333EA"
                fillOpacity={0.1}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#9333EA"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#9333EA' }}
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Forecast based on weighted 6-month spending patterns with 95% confidence interval
        </div>
      </div>
    </Card>
  );
};

export default SpendingForecast;
