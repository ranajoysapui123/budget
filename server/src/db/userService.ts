import { Database } from 'better-sqlite3';
import { User, Category, Transaction, RecurringTransaction, SavingsGoal, Budget } from '../types';


export class userService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }


  // Fixed User creation method
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    
    // FIXED: Include all columns that exist in the database schema
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, 
        email, 
        password_hash, 
        pin_hash, 
        pin_attempts, 
        pin_locked_until,
        created_at, 
        updated_at
      )
      VALUES (
        $id, 
        $email, 
        $passwordHash, 
        $pinHash, 
        $pinAttempts, 
        $pinLockedUntil,
        $createdAt, 
        $updatedAt
      )
    `);

    const id = crypto.randomUUID();
    
    try {
      stmt.run({
        id,
        email: user.email,
        passwordHash: user.passwordHash,
        pinHash: user.pinHash || null,  // FIXED: Include pinHash
        pinAttempts: user.pinAttempts || 0,
        pinLockedUntil: user.pinLockedUntil || null,  // FIXED: Include pinLockedUntil
        createdAt: now,
        updatedAt: now
      });

      return {
        id,
        email: user.email,
        passwordHash: user.passwordHash,
        pinHash: user.pinHash,
        pinAttempts: user.pinAttempts || 0,
        pinLockedUntil: user.pinLockedUntil,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Database error creating user:', error);
      throw new Error('Failed to create user in database');
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      const result = stmt.get(email) as any;
      
      if (!result) return undefined;
      
      // Map snake_case database columns to camelCase TypeScript properties
      return {
        id: result.id,
        email: result.email,
        passwordHash: result.password_hash,
        pinHash: result.pin_hash,
        pinAttempts: result.pin_attempts || 0,
        pinLockedUntil: result.pin_locked_until,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Database error getting user by email:', error);
      throw new Error('Failed to retrieve user from database');
    }
  }

  async updateUserPin(userId: string, pinHash: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET pin_hash = ?, updated_at = ?
        WHERE id = ?
      `);
      const result = stmt.run(pinHash, new Date().toISOString(), userId);
      
      if (result.changes === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Database error updating user PIN:', error);
      throw new Error('Failed to update user PIN');
    }
  }

  async updatePinAttempts(userId: string, attempts: number, lockedUntil?: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET pin_attempts = ?, pin_locked_until = ?, updated_at = ?
        WHERE id = ?
      `);
      const result = stmt.run(attempts, lockedUntil || null, new Date().toISOString(), userId);
      
      if (result.changes === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Database error updating PIN attempts:', error);
      throw new Error('Failed to update PIN attempts');
    }
  }}
  