import { Database } from 'better-sqlite3';
import {  Budget } from '../types';

export class budgetService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Budget methods
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO budgets (
        id, category_id, amount, user_id, month, year, created_at, updated_at
      )
      VALUES (
        $id, $categoryId, $amount, $userId, $month, $year, $createdAt, $updatedAt
      )
    `);

    const id = crypto.randomUUID();
    stmt.run({
      id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      userId: budget.userId,
      month: budget.month,
      year: budget.year,
      createdAt: now,
      updatedAt: now
    });

    return {
      ...budget,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  async getUserBudgets(userId: string, year?: number, month?: number): Promise<Budget[]> {
    let query = `
      SELECT 
        id, category_id as categoryId, amount, user_id as userId,
        month, year, created_at as createdAt, updated_at as updatedAt
      FROM budgets 
      WHERE user_id = ?
    `;
    
    const params: any[] = [userId];

    if (year !== undefined) {
      query += ' AND year = ?';
      params.push(year);
    }
    if (month !== undefined) {
      query += ' AND month = ?';
      params.push(month);
    }

    query += ' ORDER BY year DESC, month DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Budget[];
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    const sets: string[] = [];
    const params: Record<string, any> = { id };

    if (budget.categoryId !== undefined) {
      sets.push('category_id = $categoryId');
      params.categoryId = budget.categoryId;
    }
    if (budget.amount !== undefined) {
      sets.push('amount = $amount');
      params.amount = budget.amount;
    }
    if (budget.month !== undefined) {
      sets.push('month = $month');
      params.month = budget.month;
    }
    if (budget.year !== undefined) {
      sets.push('year = $year');
      params.year = budget.year;
    }

    sets.push('updated_at = $updatedAt');
    params.updatedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE budgets
      SET ${sets.join(', ')}
      WHERE id = $id
    `);

    stmt.run(params);
  }

  async deleteBudget(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM budgets WHERE id = ?');
    stmt.run(id);
  }}
