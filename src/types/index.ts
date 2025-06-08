export type TransactionType = 'income' | 'expense' | 'investment';

export type MainCategory = 'personal' | 'business' | 'family';

export interface CategoryDefinition {
  id: string;
  name: string;
  type: TransactionType;
  parentId?: string;
  color?: string;
  icon?: string;
  description?: string;
  budget?: number;
  isArchived?: boolean;
  subCategories?: CategoryDefinition[];
}

export type TransactionCategory = string;

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface TransactionReference {
  type: 'receipt' | 'invoice' | 'contract' | 'other';
  number: string;
  notes?: string;
  screenshot?: string;
}

export interface TransactionTag {
  id: string;
  name: string;
  color: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  mainCategory: MainCategory;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  lastProcessed?: string;
  tags?: string[];
}

export interface SplitTransaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  mainCategory: MainCategory;
  description?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: TransactionType;
  category: TransactionCategory;
  mainCategory: MainCategory;
  reference?: TransactionReference;
  recurringTransactionId?: string;
  tags?: string[];
  splits?: SplitTransaction[];
  isSplit?: boolean;
}

export interface MonthlyBudget {
  month: string;
  incomeGoal: number;
  expenseLimit: number;
  investmentGoal: number;
  categoryLimits?: Record<TransactionCategory, number>;
  balance: number;
}

export interface BudgetInsight {
  type: 'warning' | 'success' | 'info';
  message: string;
  category?: TransactionCategory;
  amount?: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  autoAllocatePercentage: number;
  isCompleted: boolean;
}

export interface User {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  budgets: MonthlyBudget[];
  tags: TransactionTag[];
  categories: CategoryDefinition[];
  savingsGoals: SavingsGoal[];
  settings: {
    currency: string;
    theme: 'light' | 'dark';
    defaultDateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  reportTemplates: ReportTemplate[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface ReportOptions {
  startDate: string;
  endDate: string;
  types: TransactionType[];
  mainCategories: MainCategory[];
  format: 'pdf' | 'csv';
  includeCharts: boolean;
  includeScreenshots: boolean;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  month?: string;
  search?: string;
  tags?: string[];
  dateRange?: DateRange;
  categories?: TransactionCategory[];
  mainCategories?: MainCategory[];
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'detailed' | 'comparison';
  options: ReportOptions;
}

export interface ComparisonReport {
  period1: DateRange;
  period2: DateRange;
  metrics: {
    income: {
      total: number;
      byCategory: Record<string, number>;
      percentageChange: number;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
      percentageChange: number;
    };
    investments: {
      total: number;
      byCategory: Record<string, number>;
      percentageChange: number;
    };
  };
}