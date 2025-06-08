// index.ts - Central export point for all database services

export { userService } from "./userService";
export { catagoryService } from "./catagoryService";
export { transactionService } from "./transactionService";
export { RecurringTransactionService } from "./RecurringTransactionService";
export { SavingGoalService } from "./SavingGoalService";
export { budgetService } from './budgetService';
export { analyticsService } from './analyticsService';

export { DatabaseService } from './databaseService';

// Re-export types for convenience
export type {
  User,
  Category,
  Transaction,
  RecurringTransaction,
  SavingsGoal,
  Budget
} from '../types';