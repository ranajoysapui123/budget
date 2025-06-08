import { Database } from 'better-sqlite3';

export const initializeDatabase = (db: Database): void => {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Check and add PIN columns to users table if they don't exist
  const checkPinColumn = db.prepare("PRAGMA table_info(users)");
  const columns = checkPinColumn.all();
  const columnNames = columns.map((col: any) => col.name);
  
  if (!columnNames.includes('pin_hash')) {
    db.exec(`ALTER TABLE users ADD COLUMN pin_hash TEXT`);
  }
  
  if (!columnNames.includes('pin_attempts')) {
    db.exec(`ALTER TABLE users ADD COLUMN pin_attempts INTEGER DEFAULT 0`);
  }
  
  if (!columnNames.includes('pin_locked_until')) {
    db.exec(`ALTER TABLE users ADD COLUMN pin_locked_until TEXT`);
  }

  // Create user sessions table for PIN validation
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      pin_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
  `);
 
  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'investment')) NOT NULL,
      parent_id TEXT,
      color TEXT,
      icon TEXT,
      description TEXT,
      budget REAL,
      is_archived INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'investment')) NOT NULL,
      category TEXT NOT NULL,
      main_category TEXT CHECK(main_category IN ('personal', 'business', 'family')) NOT NULL,
      date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_split INTEGER DEFAULT 0,
      reference_type TEXT CHECK(reference_type IN ('receipt', 'invoice', 'contract', 'other')),
      reference_number TEXT,
      reference_notes TEXT,
      reference_screenshot TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category) REFERENCES categories (id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create transaction_splits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_splits (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      main_category TEXT CHECK(main_category IN ('personal', 'business', 'family')) NOT NULL,
      description TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
      FOREIGN KEY (category) REFERENCES categories (id) ON DELETE RESTRICT
    )
  `);

  // Create transaction_tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_tags (
      transaction_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (transaction_id, tag),
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
    )
  `);

  // Create recurring_transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'investment')) NOT NULL,
      category TEXT NOT NULL,
      main_category TEXT CHECK(main_category IN ('personal', 'business', 'family')) NOT NULL,
      frequency TEXT CHECK(frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_processed TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category) REFERENCES categories (id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create recurring_transaction_tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transaction_tags (
      recurring_transaction_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (recurring_transaction_id, tag),
      FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions (id) ON DELETE CASCADE
    )
  `);

  // Create savings_goals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      deadline TEXT,
      category TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category) REFERENCES categories (id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      user_id TEXT NOT NULL,
      month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
      year INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(category_id, user_id, month, year)
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user ON recurring_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_date ON budgets(user_id, year, month);
  `);
};