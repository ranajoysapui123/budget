import { Database } from 'better-sqlite3';
import {  RecurringTransaction,  } from '../types';


export class RecurringTransactionService{
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Recurring Transaction methods
  async createRecurringTransaction(transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    return this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO recurring_transactions (
          id, description, amount, type, category, main_category,
          frequency, start_date, end_date, last_processed, user_id,
          created_at, updated_at
        )
        VALUES (
          $id, $description, $amount, $type, $category, $mainCategory,
          $frequency, $startDate, $endDate, $lastProcessed, $userId,
          $createdAt, $updatedAt
        )
      `);

      stmt.run({
        id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        mainCategory: transaction.mainCategory,
        frequency: transaction.frequency,
        startDate: transaction.startDate,
        endDate: transaction.endDate || null,
        lastProcessed: transaction.lastProcessed || null,
        userId: transaction.userId,
        createdAt: now,
        updatedAt: now
      });

      if (transaction.tags?.length) {
        const tagStmt = this.db.prepare(`
          INSERT INTO recurring_transaction_tags (recurring_transaction_id, tag)
          VALUES ($transactionId, $tag)
        `);

        for (const tag of transaction.tags) {
          tagStmt.run({
            transactionId: id,
            tag
          });
        }
      }

      return {
        ...transaction,
        id,
        createdAt: now,
        updatedAt: now
      };
    })();
  }

  async getUserRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const stmt = this.db.prepare(`
      SELECT 
        rt.*,
        GROUP_CONCAT(rtt.tag) as tags
      FROM recurring_transactions rt
      LEFT JOIN recurring_transaction_tags rtt ON rt.id = rtt.recurring_transaction_id
      WHERE rt.user_id = ?
      GROUP BY rt.id
      ORDER BY rt.start_date DESC
    `);

    const transactions = stmt.all(userId) as any[];

    return transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      mainCategory: t.main_category,
      frequency: t.frequency,
      startDate: t.start_date,
      endDate: t.end_date,
      lastProcessed: t.last_processed,
      userId: t.user_id,
      tags: t.tags ? t.tags.split(',') : [],
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  }

  async updateRecurringTransaction(id: string, transaction: Partial<RecurringTransaction>): Promise<void> {
    return this.db.transaction(() => {
      const sets: string[] = [];
      const params: Record<string, any> = { id };

      if (transaction.description !== undefined) {
        sets.push('description = $description');
        params.description = transaction.description;
      }
      if (transaction.amount !== undefined) {
        sets.push('amount = $amount');
        params.amount = transaction.amount;
      }
      if (transaction.type !== undefined) {
        sets.push('type = $type');
        params.type = transaction.type;
      }
      if (transaction.category !== undefined) {
        sets.push('category = $category');
        params.category = transaction.category;
      }
      if (transaction.mainCategory !== undefined) {
        sets.push('main_category = $mainCategory');
        params.mainCategory = transaction.mainCategory;
      }
      if (transaction.frequency !== undefined) {
        sets.push('frequency = $frequency');
        params.frequency = transaction.frequency;
      }
      if (transaction.startDate !== undefined) {
        sets.push('start_date = $startDate');
        params.startDate = transaction.startDate;
      }
      if (transaction.endDate !== undefined) {
        sets.push('end_date = $endDate');
        params.endDate = transaction.endDate;
      }
      if (transaction.lastProcessed !== undefined) {
        sets.push('last_processed = $lastProcessed');
        params.lastProcessed = transaction.lastProcessed;
      }

      sets.push('updated_at = $updatedAt');
      params.updatedAt = new Date().toISOString();

      const stmt = this.db.prepare(`
        UPDATE recurring_transactions
        SET ${sets.join(', ')}
        WHERE id = $id
      `);
      stmt.run(params);

      // Update tags if provided
      if (transaction.tags !== undefined) {
        // Delete existing tags
        const deleteTagsStmt = this.db.prepare('DELETE FROM recurring_transaction_tags WHERE recurring_transaction_id = ?');
        deleteTagsStmt.run(id);

        // Insert new tags
        if (transaction.tags.length > 0) {
          const tagStmt = this.db.prepare(`
            INSERT INTO recurring_transaction_tags (recurring_transaction_id, tag)
            VALUES ($transactionId, $tag)
          `);

          for (const tag of transaction.tags) {
            tagStmt.run({
              transactionId: id,
              tag
            });
          }
        }
      }
    })();
  }

  async deleteRecurringTransaction(id: string): Promise<void> {
    return this.db.transaction(() => {
      // Delete tags
      const deleteTagsStmt = this.db.prepare('DELETE FROM recurring_transaction_tags WHERE recurring_transaction_id = ?');
      deleteTagsStmt.run(id);

      // Delete recurring transaction
      const deleteTransactionStmt = this.db.prepare('DELETE FROM recurring_transactions WHERE id = ?');
      deleteTransactionStmt.run(id);
    })();
  }}
 