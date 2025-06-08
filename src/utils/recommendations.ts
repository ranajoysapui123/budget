import { Transaction, MonthlyBudget, SavingsGoal, TransactionCategory, CategoryDefinition } from '../types';
import { formatCurrency } from './helpers';

interface BudgetRecommendation {
  type: 'warning' | 'success' | 'info';
  message: string;
  category?: TransactionCategory;
  suggestedLimit?: number;
  currentSpending?: number;
}

export const generateBudgetRecommendations = (
  transactions: Transaction[],
  currentBudget: MonthlyBudget,
  savingsGoals: SavingsGoal[],
  currency: string,
  categories: CategoryDefinition[]
): BudgetRecommendation[] => {
  const recommendations: BudgetRecommendation[] = [];

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate category-wise spending
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Check overall budget health
  const spendingRatio = totalExpenses / totalIncome;
  if (spendingRatio > 0.8) {
    recommendations.push({
      type: 'warning',
      message: `Your expenses are ${Math.round(spendingRatio * 100)}% of your income. Consider reducing non-essential spending.`
    });
  }

  // Check category-specific spending
  Object.entries(categorySpending).forEach(([categoryId, spent]) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const limit = currentBudget.categoryLimits?.[categoryId];
    if (limit && spent > limit) {
      recommendations.push({
        type: 'warning',
        message: `You've exceeded your ${category.name} budget by ${formatCurrency(spent - limit, currency)}`,
        category: categoryId,
        currentSpending: spent,
        suggestedLimit: Math.ceil(spent * 1.1) // Suggest a limit 10% above current spending
      });
    }

    // Check subcategories spending
    const subcategories = categories.filter(c => c.parentId === categoryId);
    if (subcategories.length > 0) {
      const subcategorySpending = transactions
        .filter(t => subcategories.some(sc => sc.id === t.category))
        .reduce((sum, t) => sum + t.amount, 0);

      if (subcategorySpending > spent * 0.8) { // If subcategories account for >80% of category spending
        recommendations.push({
          type: 'info',
          message: `Consider setting individual budgets for ${category.name} subcategories as they make up ${Math.round(subcategorySpending / spent * 100)}% of the category spending.`,
          category: categoryId
        });
      }
    }
  });

  // Analyze savings goals progress
  const activeGoals = savingsGoals.filter(g => !g.isCompleted);
  const totalMonthlyGoals = activeGoals.reduce((sum, g) => {
    const deadline = new Date(g.deadline);
    const now = new Date();
    const monthsLeft = (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth();
    if (monthsLeft > 0) {
      const remainingAmount = g.targetAmount - g.currentAmount;
      return sum + (remainingAmount / monthsLeft);
    }
    return sum;
  }, 0);

  // Calculate recommended savings based on income
  const recommendedSavings = totalIncome * 0.2; // 20% of income
  if (totalMonthlyGoals > recommendedSavings) {
    recommendations.push({
      type: 'info',
      message: `Your monthly savings goals (${formatCurrency(totalMonthlyGoals, currency)}) might be too ambitious. Consider extending deadlines or adjusting targets.`
    });
  }

  // Check for potential savings opportunities in discretionary categories
  const discretionaryCategories = categories
    .filter(c => ['entertainment', 'dining', 'shopping'].includes(c.name.toLowerCase()))
    .map(c => c.id);

  const discretionarySpending = transactions
    .filter(t => t.type === 'expense' && (
      discretionaryCategories.includes(t.category) || 
      categories.some(c => c.parentId && discretionaryCategories.includes(c.parentId) && c.id === t.category)
    ))
    .reduce((sum, t) => sum + t.amount, 0);

  if (discretionarySpending > totalIncome * 0.3) {
    recommendations.push({
      type: 'info',
      message: `You're spending ${formatCurrency(discretionarySpending, currency)} (${Math.round(discretionarySpending / totalIncome * 100)}%) on discretionary items. Consider redirecting some to savings.`
    });
  }

  // Suggest budget adjustments based on consistent overspending
  const consistentlyOverBudget = Object.entries(categorySpending)
    .filter(([categoryId, spent]) => {
      const limit = currentBudget.categoryLimits?.[categoryId];
      return limit && spent > limit * 1.2; // 20% over budget
    })
    .map(([categoryId]) => categories.find(c => c.id === categoryId)?.name || categoryId);

  if (consistentlyOverBudget.length > 0) {
    recommendations.push({
      type: 'info',
      message: `Consider adjusting budgets for: ${consistentlyOverBudget.join(', ')}`
    });
  }

  return recommendations;
};