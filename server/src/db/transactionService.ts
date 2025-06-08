import { Database } from 'better-sqlite3';
import {  Transaction } from '../types';

export class transactionService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Transaction methods
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    return this.db.transaction(() => {
      // Insert main transaction
      const stmt = this.db.prepare(`
        INSERT INTO transactions (
          id, description, amount, type, category, main_category,
          date, user_id, is_split, reference_type, reference_number,
          reference_notes, reference_screenshot, created_at, updated_at
        )
        VALUES (
          $id, $description, $amount, $type, $category, $mainCategory,
          $date, $userId, $isSplit, $referenceType, $referenceNumber,
          $referenceNotes, $referenceScreenshot, $createdAt, $updatedAt
        )
      `);

      stmt.run({
        id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        mainCategory: transaction.mainCategory,
        date: transaction.date,
        userId: transaction.userId,
        isSplit: transaction.isSplit ? 1 : 0,
        referenceType: transaction.reference?.type || null,
        referenceNumber: transaction.reference?.number || null,
        referenceNotes: transaction.reference?.notes || null,
        referenceScreenshot: transaction.reference?.screenshot || null,
        createdAt: now,
        updatedAt: now
      });

      // Insert splits if any
      if (transaction.splits?.length) {
        const splitStmt = this.db.prepare(`
          INSERT INTO transaction_splits (
            id, transaction_id, amount, category, main_category, description
          )
          VALUES ($id, $transactionId, $amount, $category, $mainCategory, $description)
        `);

        for (const split of transaction.splits) {
          splitStmt.run({
            id: split.id || crypto.randomUUID(),
            transactionId: id,
            amount: split.amount,
            category: split.category,
            mainCategory: split.mainCategory,
            description: split.description || null
          });
        }
      }

      // Insert tags if any
      if (transaction.tags?.length) {
        const tagStmt = this.db.prepare(`
          INSERT INTO transaction_tags (transaction_id, tag)
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

  async getUserTransactions(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: string[];
    category?: string[];
    mainCategory?: string[];
  }): Promise<Transaction[]> {
    let query = `
      SELECT 
        t.*,
        GROUP_CONCAT(DISTINCT tt.tag) as tags
      FROM transactions t
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      WHERE t.user_id = ?
    `;

    const params: any[] = [userId];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }
    if (filters?.type?.length) {
      query += ` AND t.type IN (${filters.type.map(() => '?').join(',')})`;
      params.push(...filters.type);
    }
    if (filters?.category?.length) {
      query += ` AND t.category IN (${filters.category.map(() => '?').join(',')})`;
      params.push(...filters.category);
    }
    if (filters?.mainCategory?.length) {
      query += ` AND t.main_category IN (${filters.mainCategory.map(() => '?').join(',')})`;
      params.push(...filters.mainCategory);
    }

    query += ' GROUP BY t.id ORDER BY t.date DESC';

    const stmt = this.db.prepare(query);
    const transactions = stmt.all(...params) as any[];

    // Get splits for each transaction
    const splitsStmt = this.db.prepare(`
      SELECT * FROM transaction_splits WHERE transaction_id = ?
    `);

    return transactions.map(t => {
      const splits = splitsStmt.all(t.id) as any[];
      
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
        tags: t.tags ? t.tags.split(',') : [],
        createdAt: t.created_at,
        updatedAt: t.updated_at
      };
    });
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction | undefined> {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(DISTINCT tt.tag) as tags
      FROM transactions t
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      WHERE t.id = ? AND t.user_id = ?
      GROUP BY t.id
    `);
    
    const transaction = stmt.get(id, userId) as any;
    if (!transaction) return undefined;

    // Get splits
    const splitsStmt = this.db.prepare(`
      SELECT * FROM transaction_splits WHERE transaction_id = ?
    `);
    const splits = splitsStmt.all(id) as any[];

    return {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      mainCategory: transaction.main_category,
      date: transaction.date,
      userId: transaction.user_id,
      isSplit: Boolean(transaction.is_split),
      reference: transaction.reference_type ? {
        type: transaction.reference_type,
        number: transaction.reference_number,
        notes: transaction.reference_notes,
        screenshot: transaction.reference_screenshot
      } : undefined,
      splits: splits.map(s => ({
        id: s.id,
        amount: s.amount,
        category: s.category,
        mainCategory: s.main_category,
        description: s.description
      })),
      tags: transaction.tags ? transaction.tags.split(',') : [],
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    };
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
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
      if (transaction.date !== undefined) {
        sets.push('date = $date');
        params.date = transaction.date;
      }
      if (transaction.isSplit !== undefined) {
        sets.push('is_split = $isSplit');
        params.isSplit = transaction.isSplit ? 1 : 0;
      }
      if (transaction.reference !== undefined) {
        sets.push('reference_type = $referenceType');
        sets.push('reference_number = $referenceNumber');
        sets.push('reference_notes = $referenceNotes');
        sets.push('reference_screenshot = $referenceScreenshot');
        params.referenceType = transaction.reference?.type || null;
        params.referenceNumber = transaction.reference?.number || null;
        params.referenceNotes = transaction.reference?.notes || null;
        params.referenceScreenshot = transaction.reference?.screenshot || null;
      }

      sets.push('updated_at = $updatedAt');
      params.updatedAt = new Date().toISOString();

      const stmt = this.db.prepare(`
        UPDATE transactions
        SET ${sets.join(', ')}
        WHERE id = $id
      `);
      stmt.run(params);

      // Update splits if provided
      if (transaction.splits !== undefined) {
        // Delete existing splits
        const deleteSplitsStmt = this.db.prepare('DELETE FROM transaction_splits WHERE transaction_id = ?');
        deleteSplitsStmt.run(id);

        // Insert new splits
        if (transaction.splits.length > 0) {
          const splitStmt = this.db.prepare(`
            INSERT INTO transaction_splits (
              id, transaction_id, amount, category, main_category, description
            )
            VALUES ($id, $transactionId, $amount, $category, $mainCategory, $description)
          `);

          for (const split of transaction.splits) {
            splitStmt.run({
              id: split.id || crypto.randomUUID(),
              transactionId: id,
              amount: split.amount,
              category: split.category,
              mainCategory: split.mainCategory,
              description: split.description || null
            });
          }
        }
      }

      // Update tags if provided
      if (transaction.tags !== undefined) {
        // Delete existing tags
        const deleteTagsStmt = this.db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?');
        deleteTagsStmt.run(id);

        // Insert new tags
        if (transaction.tags.length > 0) {
          const tagStmt = this.db.prepare(`
            INSERT INTO transaction_tags (transaction_id, tag)
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

  async deleteTransaction(id: string): Promise<void> {
    return this.db.transaction(() => {
      // Delete tags
      const deleteTagsStmt = this.db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?');
      deleteTagsStmt.run(id);

      // Delete splits
      const deleteSplitsStmt = this.db.prepare('DELETE FROM transaction_splits WHERE transaction_id = ?');
      deleteSplitsStmt.run(id);

      // Delete transaction
      const deleteTransactionStmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
      deleteTransactionStmt.run(id);
    })();
  }}
