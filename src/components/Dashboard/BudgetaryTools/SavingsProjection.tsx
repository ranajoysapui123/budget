import React, { useMemo } from 'react';
import Card from '../../ui/Card';
import { useApp } from '../../../contexts/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../../utils/helpers';

const SavingsProjection: React.FC = () => {
  const { user, filteredTransactions } = useApp();

  const projectionData = useMemo(() => {
    // Calculate average monthly income and expenses
    const monthlyTransactions = filteredTransactions.reduce((acc, t) => {
      const month = t.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += t.amount;
      } else if (t.type === 'expense') {
        acc[month].expenses += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    const months = Object.values(monthlyTransactions);
    const avgIncome = months.reduce((sum, m) => sum + m.income, 0) / months.length;
    const avgExpenses = months.reduce((sum, m) => sum + m.expenses, 0) / months.length;
    const avgSavings = avgIncome - avgExpenses;

    // Get active savings goals and sort by deadline
    const activeGoals = user.savingsGoals
      .filter(g => !g.isCompleted)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    // Calculate total current savings and milestones
    const currentSavings = user.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    
    // Project savings for next 12 months with milestones
    const data = [];
    let projectedSavings = currentSavings;
    const now = new Date();
    const milestones: Array<{ month: string; amount: number; label: string }> = [];

    // Add goal deadlines as milestones
    activeGoals.forEach(goal => {
      const deadline = new Date(goal.deadline);
      if (deadline >= now && deadline <= new Date(now.getFullYear(), now.getMonth() + 12, 1)) {
        milestones.push({
          month: deadline.toISOString().substring(0, 7),
          amount: goal.targetAmount,
          label: goal.name
        });
      }
    });

    for (let i = 0; i <= 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = month.toISOString().substring(0, 7);
      projectedSavings += avgSavings;

      // Find milestones for this month
      const monthMilestones = milestones.filter(m => m.month === monthKey);

      data.push({
        month: month.toLocaleString('default', { month: 'short', year: '2-digit' }),
        projectedSavings: Math.max(0, projectedSavings),
        milestones: monthMilestones.length ? monthMilestones.map(m => m.amount).reduce((a, b) => a + b, 0) : undefined
      });
    }

    return data;
  }, [filteredTransactions, user.savingsGoals]);

  // Calculate total savings goals target
  const totalGoalAmount = user.savingsGoals
    .filter(g => !g.isCompleted)
    .reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Savings Projection</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, user.settings.currency)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, user.settings.currency)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="projectedSavings"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
                name="Projected Savings"
              />
              {projectionData.map((data, index) => 
                data.milestones && (
                  <ReferenceLine
                    key={index}
                    x={data.month}
                    y={data.milestones}
                    stroke="#6366F1"
                    strokeDasharray="3 3"
                    label={{
                      position: 'top',
                      value: formatCurrency(data.milestones, user.settings.currency),
                      fill: '#6366F1'
                    }}
                  />
                )
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Projection based on average monthly savings rate
          </div>
          <div className="text-sm">
            <span className="font-medium">Total Savings Goal: </span>
            <span className="text-blue-600">{formatCurrency(totalGoalAmount, user.settings.currency)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SavingsProjection;
