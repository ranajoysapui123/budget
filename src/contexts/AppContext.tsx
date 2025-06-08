import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, User, MonthlyBudget, TransactionFilter, TransactionTag } from '../types';
import { generateId, getCurrentMonth, formatCurrency } from '../utils/helpers';
import { useNotification } from './NotificationContext';

interface AppContextType {
  user: User;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (budget: MonthlyBudget) => void;
  updateSettings: (settings: User['settings']) => void;
  updateUser: (user: User) => void;
  filteredTransactions: Transaction[];
  setFilter: (filter: TransactionFilter) => void;
  filter: TransactionFilter;
  currentMonthBudget: MonthlyBudget;
  addTag: (tag: Omit<TransactionTag, 'id'>) => void;
  updateTag: (tag: TransactionTag) => void;
  deleteTag: (id: string) => void;
  deleteRecurringTransaction: (id: string) => void;
}

const defaultUser: User = {
  transactions: [],
  recurringTransactions: [],
  budgets: [{
    month: getCurrentMonth(),
    incomeGoal: 0,
    expenseLimit: 0,
    investmentGoal: 0,
    categoryLimits: {},
    balance: 0
  }],
  tags: [],
  categories: [],
  savingsGoals: [],
  reportTemplates: [],
  settings: {
    currency: 'USD',
    theme: 'light',
    defaultDateRange: 'month'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('budgetPlannerUser');
    return savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser;
  });
  
  const [filter, setFilter] = useState<TransactionFilter>({ 
    month: getCurrentMonth()
  });

  const { showNotification } = useNotification();

  // Calculate and update balance for each month with bi-directional carry-forward
  useEffect(() => {
    const updateMonthlyBalances = () => {
      // Sort transactions by date
      const sortedTransactions = [...user.transactions].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Get earliest and latest transaction dates
      const dates = sortedTransactions.map(t => new Date(t.date));
      const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

      // Generate all months between earliest and latest transaction
      const allMonths = new Set<string>();
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        allMonths.add(currentDate.toISOString().substring(0, 7));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Add months from existing budgets
      user.budgets.forEach(b => allMonths.add(b.month));

      // Convert to array and sort
      const sortedMonths = Array.from(allMonths).sort();

      // Initialize monthly totals and running balances
      const monthlyData: Record<string, {
        income: number;
        expenses: number;
        investments: number;
        balance: number;
      }> = {};

      // Calculate monthly totals and running balance
      let runningBalance = 0;
      sortedMonths.forEach(month => {
        const monthTransactions = sortedTransactions.filter(t => 
          t.date.startsWith(month)
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const investments = monthTransactions
          .filter(t => t.type === 'investment')
          .reduce((sum, t) => sum + t.amount, 0);

        runningBalance += income - expenses - investments;

        monthlyData[month] = {
          income,
          expenses,
          investments,
          balance: runningBalance
        };
      });

      // Update budgets with new balances
      const updatedBudgets = sortedMonths.map(month => {
        const existingBudget = user.budgets.find(b => b.month === month) || {
          month,
          incomeGoal: 0,
          expenseLimit: 0,
          investmentGoal: 0,
          categoryLimits: {}
        };

        return {
          ...existingBudget,
          balance: monthlyData[month].balance
        };
      });

      setUser(prev => ({
        ...prev,
        budgets: updatedBudgets
      }));
    };

    updateMonthlyBalances();
  }, [user.transactions]);

  // Process recurring transactions
  useEffect(() => {
    const processRecurringTransactions = () => {
      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of current day
      const updatedTransactions = [...user.transactions];
      const updatedRecurringTransactions = [...(user.recurringTransactions || [])];

      user.recurringTransactions.forEach((recurring) => {
        const startDate = new Date(recurring.startDate);
        const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
        
        // Skip if the start date is in the future
        if (startDate > now) return;
        
        const lastProcessed = recurring.lastProcessed ? new Date(recurring.lastProcessed) : startDate;

        if (endDate && now > endDate) return;

        let nextDueDate = new Date(lastProcessed);
        switch (recurring.frequency) {
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
        }

        while (nextDueDate <= now) {
          const transaction: Transaction = {
            id: generateId(),
            description: recurring.description,
            amount: recurring.amount,
            type: recurring.type,
            category: recurring.category,
            mainCategory: recurring.mainCategory,
            date: nextDueDate.toISOString(),
            recurringTransactionId: recurring.id,
            tags: recurring.tags
          };

          updatedTransactions.push(transaction);

          const index = updatedRecurringTransactions.findIndex(r => r.id === recurring.id);
          if (index !== -1) {
            updatedRecurringTransactions[index] = {
              ...updatedRecurringTransactions[index],
              lastProcessed: nextDueDate.toISOString()
            };
          }

          switch (recurring.frequency) {
            case 'weekly':
              nextDueDate.setDate(nextDueDate.getDate() + 7);
              break;
            case 'monthly':
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextDueDate.setMonth(nextDueDate.getMonth() + 3);
              break;
            case 'yearly':
              nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
              break;
          }
        }
      });

      if (updatedTransactions.length !== user.transactions.length) {
        setUser(prev => ({
          ...prev,
          transactions: updatedTransactions,
          recurringTransactions: updatedRecurringTransactions
        }));
      }
    };

    processRecurringTransactions();
    const interval = setInterval(processRecurringTransactions, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [user.recurringTransactions]);

  useEffect(() => {
    localStorage.setItem('budgetPlannerUser', JSON.stringify(user));
  }, [user]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: generateId()
    };

    // Handle automatic savings goal allocation for income transactions
    if (transaction.type === 'income') {
      const updatedGoals = [...user.savingsGoals];
      let remainingAmount = transaction.amount;
      let isUpdated = false;

      // Allocate to savings goals based on percentage
      updatedGoals.forEach(goal => {
        if (!goal.isCompleted && goal.autoAllocatePercentage > 0) {
          const allocationAmount = Math.min(
            (transaction.amount * goal.autoAllocatePercentage) / 100,
            goal.targetAmount - goal.currentAmount
          );
          
          if (allocationAmount > 0 && remainingAmount >= allocationAmount) {
            goal.currentAmount += allocationAmount;
            remainingAmount -= allocationAmount;
            isUpdated = true;

            // Show notification for allocation
            showNotification({
              type: 'info',
              message: `Allocated ${formatCurrency(allocationAmount)} to ${goal.name}`,
              duration: 5000
            });

            // Create a split transaction for the savings allocation
            if (!newTransaction.isSplit) {
              newTransaction.isSplit = true;
              newTransaction.splits = [];
            }

            newTransaction.splits!.push({
              id: generateId(),
              amount: allocationAmount,
              category: goal.category,
              mainCategory: 'personal', // Changed from 'savings' to valid MainCategory
              description: `Auto-allocation to ${goal.name}`
            });

            // Check if goal is completed after allocation
            if (goal.currentAmount >= goal.targetAmount) {
              goal.isCompleted = true;
              showNotification({
                type: 'success',
                message: `Congratulations! You've reached your savings goal for ${goal.name}`,
                duration: 7000
              });
            }
          }
        }
      });

      // Update the main transaction amount if splits were created
      if (newTransaction.splits?.length) {
        const remainingSplit = {
          id: generateId(),
          amount: remainingAmount,
          category: transaction.category,
          mainCategory: transaction.mainCategory,
          description: 'Remaining amount'
        };
        newTransaction.splits.push(remainingSplit);

        showNotification({
          type: 'info',
          message: `Transaction split into ${newTransaction.splits.length} parts`,
          duration: 3000
        });
      }

      // Update user state with modified goals if any allocations were made
      if (isUpdated) {
        setUser(prev => ({
          ...prev,
          savingsGoals: updatedGoals
        }));
      }
    }

    setUser(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction]
    }));
  };

  const updateTransaction = (transaction: Transaction) => {
    // Keep the original date string to preserve month information
    const updatedTransaction = {
      ...transaction,
      date: transaction.date
    };

    setUser(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === transaction.id ? updatedTransaction : t
      )
    }));
  };

  const deleteTransaction = (id: string) => {
    setUser(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const deleteRecurringTransaction = (id: string) => {
    setUser(prev => ({
      ...prev,
      recurringTransactions: prev.recurringTransactions.filter(t => t.id !== id),
      transactions: prev.transactions.filter(t => t.recurringTransactionId !== id)
    }));
  };

  const updateBudget = (budget: MonthlyBudget) => {
    setUser(prev => {
      const existingBudgetIndex = prev.budgets.findIndex(b => b.month === budget.month);
      
      if (existingBudgetIndex >= 0) {
        const newBudgets = [...prev.budgets];
        newBudgets[existingBudgetIndex] = budget;
        return { ...prev, budgets: newBudgets };
      } else {
        return { ...prev, budgets: [...prev.budgets, budget] };
      }
    });
  };

  const updateSettings = (settings: User['settings']) => {
    setUser(prev => ({
      ...prev,
      settings
    }));
  };

  const updateUser = (updatedUser: User) => {
    setUser({
      ...defaultUser,
      ...updatedUser,
      recurringTransactions: updatedUser.recurringTransactions || []
    });
  };

  const addTag = (tag: Omit<TransactionTag, 'id'>) => {
    setUser(prev => ({
      ...prev,
      tags: [...prev.tags, { ...tag, id: generateId() }]
    }));
  };

  const updateTag = (tag: TransactionTag) => {
    setUser(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === tag.id ? tag : t)
    }));
  };

  const deleteTag = (id: string) => {
    setUser(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== id),
      transactions: prev.transactions.map(t => ({
        ...t,
        tags: t.tags?.filter(tagId => tagId !== id)
      }))
    }));
  };

  const filteredTransactions = user.transactions.filter(transaction => {
    let matches = true;
    
    if (filter.type && transaction.type !== filter.type) {
      matches = false;
    }
    
    if (filter.month && !transaction.date.startsWith(filter.month)) {
      matches = false;
    }
    
    if (filter.dateRange) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(filter.dateRange.startDate);
      const endDate = new Date(filter.dateRange.endDate);
      
      if (transactionDate < startDate || transactionDate > endDate) {
        matches = false;
      }
    }
    
    if (filter.tags?.length) {
      const hasMatchingTag = transaction.tags?.some(tag => filter.tags?.includes(tag));
      if (!hasMatchingTag) {
        matches = false;
      }
    }
    
    if (filter.categories?.length) {
      if (!filter.categories.includes(transaction.category)) {
        matches = false;
      }
    }
    
    if (filter.mainCategories?.length) {
      if (!filter.mainCategories.includes(transaction.mainCategory)) {
        matches = false;
      }
    }
    
    if (filter.amountRange) {
      if (
        (filter.amountRange.min !== undefined && transaction.amount < filter.amountRange.min) ||
        (filter.amountRange.max !== undefined && transaction.amount > filter.amountRange.max)
      ) {
        matches = false;
      }
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const descriptionMatches = transaction.description.toLowerCase().includes(searchLower);
      const categoryMatches = transaction.category.toLowerCase().includes(searchLower);
      const tagMatches = transaction.tags?.some(tagId => {
        const tag = user.tags.find(t => t.id === tagId);
        return tag?.name.toLowerCase().includes(searchLower);
      });
      
      if (!descriptionMatches && !categoryMatches && !tagMatches) {
        matches = false;
      }
    }
    
    return matches;
  });

  const currentMonthBudget = user.budgets.find(b => b.month === filter.month) || {
    month: filter.month || getCurrentMonth(),
    incomeGoal: 0,
    expenseLimit: 0,
    investmentGoal: 0,
    categoryLimits: {},
    balance: 0
  };

  return (
    <AppContext.Provider value={{
      user,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateBudget,
      updateSettings,
      updateUser,
      filteredTransactions,
      setFilter,
      filter,
      currentMonthBudget,
      addTag,
      updateTag,
      deleteTag,
      deleteRecurringTransaction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};