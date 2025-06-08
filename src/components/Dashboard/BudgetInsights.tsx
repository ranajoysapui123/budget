import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { generateBudgetRecommendations } from '../../utils/recommendations';

const BudgetInsights: React.FC = () => {
  const { user, filteredTransactions, currentMonthBudget, updateBudget } = useApp();

  const insights = useMemo(() => {
    return generateBudgetRecommendations(
      filteredTransactions,
      currentMonthBudget,
      user.savingsGoals,
      user.settings.currency,
      user.categories
    );
  }, [filteredTransactions, currentMonthBudget, user.savingsGoals, user.settings.currency, user.categories]);

  const getIcon = (type: 'warning' | 'success' | 'info') => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundColor = (type: 'warning' | 'success' | 'info') => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Budget Insights</h2>
        </div>

        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${getBackgroundColor(insight.type)} flex items-start gap-3`}
              >
                {getIcon(insight.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {insight.message}
                  </p>
                  {insight.category && insight.suggestedLimit && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedLimits: Record<string, number> = {
                            ...currentMonthBudget.categoryLimits
                          };
                          
                          if (insight.category && insight.suggestedLimit) {
                            updatedLimits[insight.category] = insight.suggestedLimit;
                          }
                          
                          const updatedBudget = {
                            ...currentMonthBudget,
                            categoryLimits: updatedLimits
                          };
                          updateBudget(updatedBudget);
                        }}
                      >
                        Update Budget Limit
                      </Button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Suggested: {formatCurrency(insight.suggestedLimit, user.settings.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Looking good! No budget concerns at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BudgetInsights;