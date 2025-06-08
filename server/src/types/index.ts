// Model types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  pinHash?: string|null;
  pinAttempts?: number;
  pinLockedUntil?: string|null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  pinVerified: boolean;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

export interface DatabaseService {
  getUserByEmail: (email: string) => Promise<User | undefined>;
  updateUserPin: (userId: string, pinHash: string) => Promise<void>;
  updatePinAttempts: (userId: string, attempts: number, lockedUntil?: string) => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
}
   
// Model types for financial application
// These types represent the core data structures used in the application 
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
  parentId?: string;
  color?: string;
  icon?: string;
  description?: string;
  budget?: number;
  isArchived: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: string;
  mainCategory: 'personal' | 'business' | 'family';
  date: string;
  userId: string;
  isSplit: boolean;
  reference?: {
    type: 'receipt' | 'invoice' | 'contract' | 'other';
    number: string;
    notes?: string;
    screenshot?: string;
  };
  splits?: {
    id: string;
    amount: number;
    category: string;
    mainCategory: 'personal' | 'business' | 'family';
    description?: string;
  }[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: string;
  mainCategory: 'personal' | 'business' | 'family';
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastProcessed?: string;
  userId: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  userId: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

// Re-export types from auth and express
export * from './auth';
export * from './express';