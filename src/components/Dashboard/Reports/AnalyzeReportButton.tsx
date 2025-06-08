import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Button from '../../ui/Button';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Transaction } from '../../../types';

interface AnalyzeReportButtonProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
}

interface Insight {
  type: 'info' | 'warning' | 'success';
  message: string;
  priority: number;
}

const AnalyzeReportButton: React.FC<AnalyzeReportButtonProps> = ({
  transactions,
  startDate,
  endDate
}) => {
  const { showNotification } = useNotification();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const findAnomalies = (data: Transaction[]): Insight[] => {
    const insights: Insight[] = [];
    
    // Group transactions by category
    const categoryTotals = data.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average transaction amount by category
    const categoryAverages = data.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { sum: 0, count: 0 };
      }
      acc[t.category].sum += t.amount;
      acc[t.category].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number; }>);

    // Check for unusual spending patterns
    Object.entries(categoryAverages).forEach(([category, stats]) => {
      const average = stats.sum / stats.count;
      
      // Find transactions significantly above average
      const highTransactions = data.filter(t => 
        t.category === category && t.amount > average * 2
      );

      if (highTransactions.length > 0) {
        insights.push({
          type: 'warning',
          message: `Found ${highTransactions.length} unusual high-value transactions in ${category}`,
          priority: 2
        });
      }
    });

    // Check for spending trends
    const monthlyTotals = data.reduce((acc, t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const months = Object.keys(monthlyTotals).sort();
    if (months.length >= 2) {
      const lastMonth = monthlyTotals[months[months.length - 1]];
      const previousMonth = monthlyTotals[months[months.length - 2]];
      
      if (lastMonth > previousMonth * 1.5) {
        insights.push({
          type: 'warning',
          message: `Spending increased by ${Math.round((lastMonth / previousMonth - 1) * 100)}% compared to previous month`,
          priority: 3
        });
      }
    }

    // Check for recurring transactions
    const potentialRecurring = findRecurringPatterns(data);
    if (potentialRecurring.length > 0) {
      insights.push({
        type: 'info',
        message: `Found ${potentialRecurring.length} potential recurring transactions that could be automated`,
        priority: 1
      });
    }

    // Check category distribution
    const totalSpending = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    Object.entries(categoryTotals).forEach(([category, total]) => {
      const percentage = (total / totalSpending) * 100;
      if (percentage > 40) {
        insights.push({
          type: 'warning',
          message: `${category} represents ${Math.round(percentage)}% of total spending`,
          priority: 2
        });
      }
    });

    return insights.sort((a, b) => b.priority - a.priority);
  };

  const findRecurringPatterns = (data: Transaction[]): Transaction[] => {
    const patterns: Transaction[] = [];
    const descriptionMap = new Map<string, Transaction[]>();

    // Group transactions by similar descriptions
    data.forEach(t => {
      const key = t.description.toLowerCase().trim();
      if (!descriptionMap.has(key)) {
        descriptionMap.set(key, []);
      }
      descriptionMap.get(key)!.push(t);
    });

    // Find potential recurring transactions
    descriptionMap.forEach((transactions, description) => {
      if (transactions.length >= 2) {
        const amounts = transactions.map(t => t.amount);
        const uniqueAmounts = new Set(amounts);
        
        // If same amount occurs multiple times
        if (uniqueAmounts.size === 1) {
          patterns.push(transactions[0]);
        }
      }
    });

    return patterns;
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insights = findAnomalies(transactions);
      
      if (insights.length === 0) {
        showNotification({
          type: 'success',
          message: 'No significant anomalies found in the report data',
          duration: 5000
        });
      } else {
        // Show high priority insights immediately
        insights
          .filter(insight => insight.priority >= 2)
          .forEach(insight => {
            showNotification({
              type: insight.type,
              message: insight.message,
              duration: 6000
            });
          });

        // Show lower priority insights after a delay
        setTimeout(() => {
          insights
            .filter(insight => insight.priority < 2)
            .forEach((insight, index) => {
              setTimeout(() => {
                showNotification({
                  type: insight.type,
                  message: insight.message,
                  duration: 5000
                });
              }, index * 1000);
            });
        }, 1000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      showNotification({
        type: 'error',
        message: 'Failed to analyze report data',
        duration: 4000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleAnalyze}
      disabled={isAnalyzing || transactions.length === 0}
      icon={isAnalyzing ? <AlertCircle size={16} /> : <TrendingUp size={16} />}
    >
      {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
    </Button>
  );
};

export default AnalyzeReportButton;