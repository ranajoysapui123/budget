import { Database } from 'better-sqlite3';
import {  Category } from '../types';

export class  catagoryService{
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }
// Category methods
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO categories (
        id, name, type, parent_id, color, icon, description, 
        budget, is_archived, user_id, created_at, updated_at
      )
      VALUES (
        $id, $name, $type, $parentId, $color, $icon, $description,
        $budget, $isArchived, $userId, $createdAt, $updatedAt
      )
    `);

    const id = crypto.randomUUID();
    stmt.run({
      id,
      name: category.name,
      type: category.type,
      parentId: category.parentId || null,
      color: category.color || null,
      icon: category.icon || null,
      description: category.description || null,
      budget: category.budget || null,
      isArchived: category.isArchived ? 1 : 0,
      userId: category.userId,
      createdAt: now,
      updatedAt: now
    });

    return {
      ...category,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, type, parent_id as parentId, color, icon, description,
        budget, is_archived as isArchived, user_id as userId,
        created_at as createdAt, updated_at as updatedAt
      FROM categories 
      WHERE user_id = ? 
      ORDER BY name
    `);
    const results = stmt.all(userId) as any[];
    
    return results.map(row => ({
      ...row,
      isArchived: Boolean(row.isArchived)
    }));
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const sets: string[] = [];
    const params: Record<string, any> = { id };

    if (category.name !== undefined) {
      sets.push('name = $name');
      params.name = category.name;
    }
    if (category.type !== undefined) {
      sets.push('type = $type');
      params.type = category.type;
    }
    if (category.parentId !== undefined) {
      sets.push('parent_id = $parentId');
      params.parentId = category.parentId;
    }
    if (category.color !== undefined) {
      sets.push('color = $color');
      params.color = category.color;
    }
    if (category.icon !== undefined) {
      sets.push('icon = $icon');
      params.icon = category.icon;
    }
    if (category.description !== undefined) {
      sets.push('description = $description');
      params.description = category.description;
    }
    if (category.budget !== undefined) {
      sets.push('budget = $budget');
      params.budget = category.budget;
    }
    if (category.isArchived !== undefined) {
      sets.push('is_archived = $isArchived');
      params.isArchived = category.isArchived ? 1 : 0;
    }

    sets.push('updated_at = $updatedAt');
    params.updatedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE categories
      SET ${sets.join(', ')}
      WHERE id = $id
    `);

    stmt.run(params);
  }

  async deleteCategory(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(id);
  }}
