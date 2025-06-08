import { Database } from 'better-sqlite3';
import {  SavingsGoal } from '../types';

export class SavingGoalService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Savings Goal methods
  async createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavingsGoal> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO savings_goals (
        id, name, target_amount, current_amount, deadline,
        category, user_id, created_at, updated_at
      )
      VALUES (
        $id, $name, $targetAmount, $currentAmount, $deadline,
        $category, $userId, $createdAt, $updatedAt
      )
    `);

    const id = crypto.randomUUID();
    stmt.run({
      id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline || null,
      category: goal.category || null,
      userId: goal.userId,
      createdAt: now,
      updatedAt: now
    });

    return {
      ...goal,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  async getUserSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, target_amount as targetAmount, current_amount as currentAmount,
        deadline, category, user_id as userId, created_at as createdAt,
        updated_at as updatedAt
      FROM savings_goals 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    
    return stmt.all(userId) as SavingsGoal[];
  }

  async updateSavingsGoal(id: string, goal: Partial<SavingsGoal>): Promise<void> {
    const sets: string[] = [];
    const params: Record<string, any> = { id };

    if (goal.name !== undefined) {
      sets.push('name = $name');
      params.name = goal.name;
    }
    if (goal.targetAmount !== undefined) {
      sets.push('target_amount = $targetAmount');
      params.targetAmount = goal.targetAmount;
    }
    if (goal.currentAmount !== undefined) {
      sets.push('current_amount = $currentAmount');
      params.currentAmount = goal.currentAmount;
    }
    if (goal.deadline !== undefined) {
      sets.push('deadline = $deadline');
      params.deadline = goal.deadline;
    }
    if (goal.category !== undefined) {
      sets.push('category = $category');
      params.category = goal.category;
    }

    sets.push('updated_at = $updatedAt');
    params.updatedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE savings_goals
      SET ${sets.join(', ')}
      WHERE id = $id
    `);

    stmt.run(params);
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM savings_goals WHERE id = ?');
    stmt.run(id);
  }}
