// databaseService.ts - Main orchestrator service that combines all individual services

import { Database } from 'better-sqlite3';
import { userService } from './userService';
import { catagoryService } from './catagoryService'; // Fixed typo
import { transactionService } from './transactionService';
import { RecurringTransactionService } from './RecurringTransactionService';
import { SavingGoalService } from './SavingGoalService';
import { budgetService } from './budgetService';
import { analyticsService } from './analyticsService';
import { StudentService } from './studentService';

/**
 * Main database service that orchestrates all individual services
 * Provides a unified interface for database operations
 */
export class DatabaseService {
  // Individual service instances
  public readonly users: userService;
  public readonly categories: catagoryService; // Fixed typo
  public readonly transactions: transactionService;
  public readonly recurringTransactions: RecurringTransactionService;
  public readonly savingsGoals: SavingGoalService;
  public readonly budgets: budgetService;
  public readonly analytics: analyticsService;
  public readonly students: StudentService;

  private db: Database;

  constructor(db: Database) {
    this.db = db;
    
    // Initialize all service instances with the database connection
    this.users = new userService(db);
    this.categories = new catagoryService(db); // Fixed typo
    this.transactions = new transactionService(db);
    this.recurringTransactions = new RecurringTransactionService(db);
    this.savingsGoals = new SavingGoalService(db);
    this.budgets = new budgetService(db);
    this.analytics = new analyticsService(db);
    this.students = new StudentService(db);
  }

  // ==========================================
  // USER SERVICE METHODS
  // ==========================================
  createUser = (userData: any) => this.users.createUser(userData);
  getUserByEmail = (email: string) => this.users.getUserByEmail(email);
  updateUserPin = (userId: string, pin: string) => this.users.updateUserPin(userId, pin);
  updatePinAttempts = (userId: string, attempts: number,lockedUntil?: string) => this.users.updatePinAttempts(userId, attempts,lockedUntil);
  

  // ==========================================
  // CATEGORY SERVICE METHODS
  // ==========================================
  createCategory = (categoryData: any) => this.categories.createCategory(categoryData);
  getUserCategories = (userId: string) => this.categories.getUserCategories(userId);

  updateCategory = (id: string, categoryData: any) => this.categories.updateCategory(id, categoryData);
  deleteCategory = (id: string) => this.categories.deleteCategory(id);

  // ==========================================
  // TRANSACTION SERVICE METHODS
  // ==========================================
  createTransaction = (transactionData: any) => this.transactions.createTransaction(transactionData);
  getUserTransactions = (userId: string,filters?: {
    startDate?: string;
    endDate?: string;
    type?: string[];
    category?: string[];
    mainCategory?: string[];
  }) => this.transactions.getUserTransactions(userId,filters);
   getTransactionById = (id: string,userId: string,) => this.transactions.getTransactionById(id,userId);
  updateTransaction = (id: string, transactionData: any) => this.transactions.updateTransaction(id, transactionData);
  deleteTransaction = (id: string) => this.transactions.deleteTransaction(id);

  // Add transaction method for student fees
  addTransaction = (transactionData: any) => this.transactions.createTransaction(transactionData);

  // ==========================================
  // RECURRING TRANSACTION SERVICE METHODS
  // ==========================================
  createRecurringTransaction = (data: any) => this.recurringTransactions.createRecurringTransaction(data);
  getUserRecurringTransactions = (userId: string) => this.recurringTransactions.getUserRecurringTransactions(userId);

  updateRecurringTransaction = (id: string, data: any) => this.recurringTransactions.updateRecurringTransaction(id, data);
  deleteRecurringTransaction = (id: string) => this.recurringTransactions.deleteRecurringTransaction(id);
 
  // ==========================================
  // SAVINGS GOAL SERVICE METHODS
  // ==========================================
  // Fixed method names to match interface expectations
  createSavingsGoal = (goalData: any) => this.savingsGoals.createSavingsGoal(goalData);
  getUserSavingsGoals = (userId: string) => this.savingsGoals.getUserSavingsGoals(userId);
  updateSavingsGoal = (id: string, goalData: any) => this.savingsGoals.updateSavingsGoal(id, goalData);
  deleteSavingsGoal = (id: string) => this.savingsGoals.deleteSavingsGoal(id);

  // ==========================================
  // BUDGET SERVICE METHODS
  // ==========================================
  createBudget = (budgetData: any) => this.budgets.createBudget(budgetData);
  getUserBudgets = (userId: string, year: number, month: number) => this.budgets.getUserBudgets(userId,year, month);
  updateBudget = (id: string, budgetData: any) => this.budgets.updateBudget(id, budgetData);
  deleteBudget = (id: string) => this.budgets.deleteBudget(id);
 
 

  // ==========================================
  // ANALYTICS SERVICE METHODS
  // ==========================================
  getTransactionsByTag = (userId: string, tag: string) => this.analytics.getTransactionsByTag(userId, tag);
  getAccountBalance = (userId: string,) => this.analytics.getAccountBalance(userId, );
  getCategorySpending = (userId: string, startDate: string, endDate: string) => this.analytics.getCategorySpending(userId,startDate, endDate);
  getMonthlySpending = (userId: string,year:number, months: number) => this.analytics.getMonthlySpending(userId, months, year);
  getBudgetProgress = (userId: string, year: number, month: number) => this.analytics.getBudgetProgress(userId,year, month);
  getTopExpenseCategories = (userId: string, limit: number = 10, days: number = 30) => this.analytics.getTopExpenseCategories(userId,limit, days);
  getExpensesByDateRange = (userId: string, startDate: string, endDate: string) => this.analytics.getExpensesByDateRange(userId,startDate, endDate);
  getSavingsProgress = (userId: string,) => this.analytics.getSavingsProgress(userId, );
  getRecurringTransactionsDue = (userId: string,) => this.analytics.getRecurringTransactionsDue(userId, );
  getTransactionStats = (userId: string,) => this.analytics.getTransactionStats(userId );

  // Missing methods that need to be implemented
  getMonthlyIncome = (userId: string, year: number, month: number) => this.analytics.getMonthlyIncome(userId, year, month);
  getSpendingTrends = (userId: string, startDate:any,) => this.analytics.getSpendingTrends(userId, startDate);
  cleanupExpiredRecurringTransactions = () => this.analytics.cleanupExpiredRecurringTransactions();

  // ==========================================


  // ==========================================
  // ORCHESTRATOR METHODS
  // ==========================================

  /**
   * Execute a database transaction across multiple services
   * Useful for operations that span multiple entities
   */
  public executeTransaction<T>(callback: (db: Database) => T): T {
    return this.db.transaction(callback)(this.db);
  }

  /**
   * Get the raw database instance for advanced operations
   * Use with caution - prefer using the individual services
   */
  public getRawDatabase(): Database {
    return this.db;
  }

  /**
   * Close the database connection
   */
  public close(): void {
    this.db.close();
  }

  /**
   * Check if the database connection is open
   */
  public isOpen(): boolean {
    return this.db.open;
  }

  /**
   * Execute raw SQL query (use sparingly)
   */
  public executeRawQuery(sql: string, params?: any[]): any {
    const stmt = this.db.prepare(sql);
    return params ? stmt.all(...params) : stmt.all();
  }

  /**
   * Backup database to a file
   */
  public async backup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.backup(backupPath)
        .then(() => resolve())
        .catch(reject);
    });
  }

  /**
   * Get database statistics
   */
  public getStats(): {
    filename: string;
    inTransaction: boolean;
    open: boolean;
    readonly: boolean;
    memory: boolean;
  } {
    return {
      filename: this.db.name,
      inTransaction: this.db.inTransaction,
      open: this.db.open,
      readonly: this.db.readonly,
      memory: this.db.memory
    };
  }

  /**
   * Utility method to perform cleanup operations
   * Calls cleanup methods from various services
   */
  public async performMaintenance(): Promise<{
    expiredRecurringTransactions: number;
  }> {
    const expiredRecurringTransactions = await this.analytics.cleanupExpiredRecurringTransactions();
    
    return {
      expiredRecurringTransactions
    };
  }

  /**
   * Initialize database with default data if needed
   * Can be extended to set up default categories, etc.
   */
  public async initializeDefaults(userId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Food & Dining', type: 'expense', color: '#FF6B6B', icon: '🍽️' },
      { name: 'Transportation', type: 'expense', color: '#4ECDC4', icon: '🚗' },
      { name: 'Shopping', type: 'expense', color: '#45B7D1', icon: '🛍️' },
      { name: 'Entertainment', type: 'expense', color: '#96CEB4', icon: '🎬' },
      { name: 'Bills & Utilities', type: 'expense', color: '#FECA57', icon: '💡' },
      { name: 'Salary', type: 'income', color: '#48CAE4', icon: '💰' },
      { name: 'Freelance', type: 'income', color: '#06FFA5', icon: '💼' },
      { name: 'Tuition Fees', type: 'income', color: '#06FFA5', icon: '🎓' }, // Added for student management
    ] as const;

    for (const category of defaultCategories) {
      try {
        await this.categories.createCategory({
          ...category,
          userId,
          isArchived: false
        });
      } catch (error) {
        console.warn(`Failed to create default category ${category.name}:`, error);
      }
    }
  }
}