import { Database } from 'better-sqlite3';
import {  Transaction } from '../types';

export class analyticsService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Analytics and reporting methods
  async getMonthlySpending(userId: string, year: number, month: number): Promise<{ category: string; amount: number }[]> {
    const stmt = this.db.prepare(`
      SELECT category, SUM(amount) as amount
      FROM transactions
      WHERE user_id = ? 
        AND type = 'expense'
        AND strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `);

    return stmt.all(userId, year.toString(), month.toString().padStart(2, '0')) as { category: string; amount: number }[];
  }

  async getMonthlyIncome(userId: string, year: number, month: number): Promise<{ category: string; amount: number }[]> {
    const stmt = this.db.prepare(`
      SELECT category, SUM(amount) as amount
      FROM transactions
      WHERE user_id = ? 
        AND type = 'income'
        AND strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `);

    return stmt.all(userId, year.toString(), month.toString().padStart(2, '0')) as { category: string; amount: number }[];
  }

  async getSpendingTrends(userId: string, months: number = 6): Promise<{
    month: string;
    totalSpending: number;
    totalIncome: number;
    netAmount: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalSpending,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as netAmount
      FROM transactions
      WHERE user_id = ? 
        AND date >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT ?
    `);

    return stmt.all(userId, months, months) as {
      month: string;
      totalSpending: number;
      totalIncome: number;
      netAmount: number;
    }[];
  }

  async getCategorySpending(userId: string, startDate: string, endDate: string): Promise<{
    mainCategory: string;
    category: string;
    amount: number;
    transactionCount: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        main_category as mainCategory,
        category,
        SUM(amount) as amount,
        COUNT(*) as transactionCount
      FROM transactions
      WHERE user_id = ? 
        AND type = 'expense'
        AND date BETWEEN ? AND ?
      GROUP BY main_category, category
      ORDER BY amount DESC
    `);

    return stmt.all(userId, startDate, endDate) as {
      mainCategory: string;
      category: string;
      amount: number;
      transactionCount: number;
    }[];
  }

  async getBudgetProgress(userId: string, year: number, month: number): Promise<{
    categoryId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        b.category_id as categoryId,
        c.name as categoryName,
        b.amount as budgetAmount,
        COALESCE(SUM(t.amount), 0) as spentAmount,
        (b.amount - COALESCE(SUM(t.amount), 0)) as remainingAmount,
        ROUND((COALESCE(SUM(t.amount), 0) * 100.0 / b.amount), 2) as percentageUsed
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON c.name = t.category 
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y', t.date) = ?
        AND strftime('%m', t.date) = ?
      WHERE b.user_id = ? 
        AND b.year = ? 
        AND b.month = ?
      GROUP BY b.id, b.category_id, c.name, b.amount
      ORDER BY percentageUsed DESC
    `);

    return stmt.all(
      year.toString(), 
      month.toString().padStart(2, '0'), 
      userId, 
      year, 
      month
    ) as {
      categoryId: string;
      categoryName: string;
      budgetAmount: number;
      spentAmount: number;
      remainingAmount: number;
      percentageUsed: number;
    }[];
  }

  async getTopExpenseCategories(userId: string, limit: number = 10, days: number = 30): Promise<{
    category: string;
    mainCategory: string;
    amount: number;
    transactionCount: number;
    averageAmount: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        category,
        main_category as mainCategory,
        SUM(amount) as amount,
        COUNT(*) as transactionCount,
        ROUND(AVG(amount), 2) as averageAmount
      FROM transactions
      WHERE user_id = ? 
        AND type = 'expense'
        AND date >= date('now', '-' || ? || ' days')
      GROUP BY category, main_category
      ORDER BY amount DESC
      LIMIT ?
    `);

    return stmt.all(userId, days, limit) as {
      category: string;
      mainCategory: string;
      amount: number;
      transactionCount: number;
      averageAmount: number;
    }[];
  }

  async getAccountBalance(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as currentBalance
      FROM transactions
      WHERE user_id = ?
    `);

    const result = stmt.get(userId) as any;
    return {
      totalIncome: result.totalIncome || 0,
      totalExpenses: result.totalExpenses || 0,
      currentBalance: result.currentBalance || 0
    };
  }

  async getTransactionsByTag(userId: string, tag: string): Promise<Transaction[]> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT t.*
      FROM transactions t
      JOIN transaction_tags tt ON t.id = tt.transaction_id
      WHERE t.user_id = ? AND tt.tag = ?
      ORDER BY t.date DESC
    `);

    const transactions = stmt.all(userId, tag) as any[];
    
    // Get splits and tags for each transaction
    const splitsStmt = this.db.prepare(`SELECT * FROM transaction_splits WHERE transaction_id = ?`);
    const tagsStmt = this.db.prepare(`SELECT tag FROM transaction_tags WHERE transaction_id = ?`);

    return transactions.map(t => {
      const splits = splitsStmt.all(t.id) as any[];
      const tags = tagsStmt.all(t.id) as any[];
      
      return {
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        mainCategory: t.main_category,
        date: t.date,
        userId: t.user_id,
        isSplit: Boolean(t.is_split),
        reference: t.reference_type ? {
          type: t.reference_type,
          number: t.reference_number,
          notes: t.reference_notes,
          screenshot: t.reference_screenshot
        } : undefined,
        splits: splits.map(s => ({
          id: s.id,
          amount: s.amount,
          category: s.category,
          mainCategory: s.main_category,
          description: s.description
        })),
        tags: tags.map(tag => tag.tag),
        createdAt: t.created_at,
        updatedAt: t.updated_at
      };
    });
  }

  async getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<{
    date: string;
    totalAmount: number;
    transactionCount: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        date,
        SUM(amount) as totalAmount,
        COUNT(*) as transactionCount
      FROM transactions
      WHERE user_id = ? 
        AND type = 'expense'
        AND date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date DESC
    `);

    return stmt.all(userId, startDate, endDate) as {
      date: string;
      totalAmount: number;
      transactionCount: number;
    }[];
  }

  async getSavingsProgress(userId: string): Promise<{
    goalId: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    progressPercentage: number;
    deadline?: string;
    daysRemaining?: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id as goalId,
        name as goalName,
        target_amount as targetAmount,
        current_amount as currentAmount,
        (target_amount - current_amount) as remainingAmount,
        ROUND((current_amount * 100.0 / target_amount), 2) as progressPercentage,
        deadline,
        CASE 
          WHEN deadline IS NOT NULL 
          THEN CAST((julianday(deadline) - julianday('now')) AS INTEGER)
          ELSE NULL 
        END as daysRemaining
      FROM savings_goals
      WHERE user_id = ?
      ORDER BY progressPercentage DESC
    `);

    return stmt.all(userId) as {
      goalId: string;
      goalName: string;
      targetAmount: number;
      currentAmount: number;
      remainingAmount: number;
      progressPercentage: number;
      deadline?: string;
      daysRemaining?: number;
    }[];
  }

  async getRecurringTransactionsDue(userId: string): Promise<{
    id: string;
    description: string;
    amount: number;
    type: string;
    frequency: string;
    nextDueDate: string;
    daysPastDue: number;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        description,
        amount,
        type,
        frequency,
        CASE frequency
          WHEN 'daily' THEN date(COALESCE(last_processed, start_date), '+1 day')
          WHEN 'weekly' THEN date(COALESCE(last_processed, start_date), '+7 days')
          WHEN 'monthly' THEN date(COALESCE(last_processed, start_date), '+1 month')
          WHEN 'yearly' THEN date(COALESCE(last_processed, start_date), '+1 year')
        END as nextDueDate,
        CASE 
          WHEN CASE frequency
            WHEN 'daily' THEN date(COALESCE(last_processed, start_date), '+1 day')
            WHEN 'weekly' THEN date(COALESCE(last_processed, start_date), '+7 days')
            WHEN 'monthly' THEN date(COALESCE(last_processed, start_date), '+1 month')
            WHEN 'yearly' THEN date(COALESCE(last_processed, start_date), '+1 year')
          END <= date('now')
          THEN CAST((julianday('now') - julianday(
            CASE frequency
              WHEN 'daily' THEN date(COALESCE(last_processed, start_date), '+1 day')
              WHEN 'weekly' THEN date(COALESCE(last_processed, start_date), '+7 days')
              WHEN 'monthly' THEN date(COALESCE(last_processed, start_date), '+1 month')
              WHEN 'yearly' THEN date(COALESCE(last_processed, start_date), '+1 year')
            END
          )) AS INTEGER)
          ELSE 0
        END as daysPastDue
      FROM recurring_transactions
      WHERE user_id = ?
        AND (end_date IS NULL OR end_date >= date('now'))
        AND start_date <= date('now')
      HAVING nextDueDate <= date('now', '+7 days')
      ORDER BY daysPastDue DESC, nextDueDate ASC
    `);

    return stmt.all(userId) as {
      id: string;
      description: string;
      amount: number;
      type: string;
      frequency: string;
      nextDueDate: string;
      daysPastDue: number;
    }[];
  }

  // Utility methods for data cleanup and maintenance
  async cleanupExpiredRecurringTransactions(): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM recurring_transactions 
      WHERE end_date IS NOT NULL AND end_date < date('now')
    `);
    
    const result = stmt.run();
    return result.changes;
  }

  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    averageTransaction: number;
    mostUsedCategory: string;
    oldestTransaction: string;
    newestTransaction: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        ROUND(AVG(amount), 2) as averageTransaction,
        MIN(date) as oldestTransaction,
        MAX(date) as newestTransaction
      FROM transactions
      WHERE user_id = ?
    `);

    const categoryStmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM transactions
      WHERE user_id = ?
      GROUP BY category
      ORDER BY count DESC
      LIMIT 1
    `);

    const stats = stmt.get(userId) as any;
    const categoryResult = categoryStmt.get(userId) as any;

    return {
      totalTransactions: stats.totalTransactions || 0,
      totalIncome: stats.totalIncome || 0,
      totalExpenses: stats.totalExpenses || 0,
      averageTransaction: stats.averageTransaction || 0,
      mostUsedCategory: categoryResult?.category || 'None',
      oldestTransaction: stats.oldestTransaction || '',
      newestTransaction: stats.newestTransaction || ''
    };
  }
}
