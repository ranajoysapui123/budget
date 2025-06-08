import { Transaction, TransactionType, TransactionCategory, SplitTransaction } from '../types';

// Format currency based on user settings
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format date to display in a user-friendly way
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Group transactions by month
export const groupTransactionsByMonth = (transactions: Transaction[]): Record<string, Transaction[]> => {
  return transactions.reduce((acc, transaction) => {
    const month = transaction.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);
};

// Calculate total for a specific transaction type
export const calculateTotal = (transactions: Transaction[], type?: TransactionType): number => {
  return transactions
    .filter(t => !type || t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
};

// Get current month in YYYY-MM format
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get transaction category options based on type
export const getCategoriesByType = (type: TransactionType): TransactionCategory[] => {
  switch (type) {
    case 'income':
      return ['salary', 'freelance', 'passive', 'gifts', 'other-income'];
    case 'expense':
      return ['housing', 'food', 'transportation', 'utilities', 'entertainment', 'healthcare', 'personal', 'education', 'other-expense'];
    case 'investment':
      return ['stocks', 'bonds', 'real-estate', 'crypto', 'retirement', 'other-investment'];
    default:
      return [];
  }
};

// Get user-friendly category display name
export const getCategoryDisplayName = (category: TransactionCategory): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get category color
export const getCategoryColor = (category: TransactionCategory): string => {
  // Color mapping based on category
  const colorMap: Record<TransactionCategory, string> = {
    // Income colors (teal variants)
    'salary': 'bg-teal-500',
    'freelance': 'bg-teal-600',
    'passive': 'bg-teal-700',
    'gifts': 'bg-teal-400',
    'other-income': 'bg-teal-300',
    
    // Expense colors (amber variants)
    'housing': 'bg-amber-500',
    'food': 'bg-amber-600',
    'transportation': 'bg-amber-700',
    'utilities': 'bg-amber-400',
    'entertainment': 'bg-amber-300',
    'healthcare': 'bg-amber-800',
    'personal': 'bg-amber-200',
    'education': 'bg-amber-900',
    'other-expense': 'bg-amber-100',
    
    // Investment colors (purple variants)
    'stocks': 'bg-purple-500',
    'bonds': 'bg-purple-600',
    'real-estate': 'bg-purple-700',
    'crypto': 'bg-purple-400',
    'retirement': 'bg-purple-300',
    'other-investment': 'bg-purple-200'
  };
  
  return colorMap[category] || 'bg-gray-500';
};

// Get split transaction suggestions
export const getSplitSuggestions = (
  description: string,
  amount: number,
  type: TransactionType,
  transactions: Transaction[]
): SplitTransaction[] | null => {
  // Find similar transactions based on description similarity
  const similarTransactions = transactions
    .filter(t => 
      t.isSplit && 
      t.splits && 
      t.type === type &&
      t.description.toLowerCase().includes(description.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (similarTransactions.length === 0) return null;

  // Use the most recent similar transaction's split pattern
  const recentSplit = similarTransactions[0].splits!;
  const totalOriginal = recentSplit.reduce((sum, split) => sum + split.amount, 0);
  
  // Calculate proportions and create new splits
  return recentSplit.map(split => ({
    id: generateId(),
    amount: (split.amount / totalOriginal) * amount,
    category: split.category,
    mainCategory: split.mainCategory,
    description: split.description
  }));
};

interface CurrencyPattern {
  currency: string;
  confidence: number;
  examples: number[];
}

export const detectCurrency = (transactions: Transaction[]): CurrencyPattern[] => {
  const patterns: Record<string, { count: number; amounts: number[] }> = {
    'USD': { count: 0, amounts: [] },
    'EUR': { count: 0, amounts: [] },
    'GBP': { count: 0, amounts: [] },
    'JPY': { count: 0, amounts: [] },
    'INR': { count: 0, amounts: [] }
  };

  transactions.forEach(t => {
    const amount = t.amount;
    
    // Check for common currency patterns
    if (Number.isInteger(amount) && amount > 1000) {
      // Likely JPY or other whole-number currencies
      patterns.JPY.count++;
      patterns.JPY.amounts.push(amount);
    }
    
    if (amount.toString().includes('.') && /\.\d{2}$/.test(amount.toString())) {
      // Common for USD, EUR, GBP (two decimal places)
      if (amount > 0.01 && amount < 100000) {
        patterns.USD.count++;
        patterns.EUR.count++;
        patterns.GBP.count++;
        patterns.USD.amounts.push(amount);
        patterns.EUR.amounts.push(amount);
        patterns.GBP.amounts.push(amount);
      }
    }
    
    // Check for INR pattern (larger numbers, often rounded)
    if (amount > 100 && amount % 1 === 0) {
      patterns.INR.count++;
      patterns.INR.amounts.push(amount);
    }
  });

  // Calculate confidence scores
  const totalTransactions = transactions.length;
  const results: CurrencyPattern[] = Object.entries(patterns)
    .map(([currency, data]) => ({
      currency,
      confidence: (data.count / totalTransactions) * 100,
      examples: data.amounts.slice(0, 3)
    }))
    .filter(pattern => pattern.confidence > 20) // Only include patterns with >20% confidence
    .sort((a, b) => b.confidence - a.confidence);

  return results;
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateBulkTransactions = (
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
  }>,
  currentCurrency: string
): ValidationResult => {
  const errors: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Check for empty transactions
  if (transactions.length === 0) {
    errors.push('No transactions to import');
    return { isValid: false, errors };
  }

  // Currency pattern detection and validation
  const detectedPatterns = detectCurrency(transactions.map(t => ({
    ...t,
    id: generateId(),
    type: 'expense',
    category: 'other-expense',
    mainCategory: 'personal'
  })));

  if (detectedPatterns.length > 0) {
    const mostLikelyCurrency = detectedPatterns[0];
    if (mostLikelyCurrency.currency !== currentCurrency && mostLikelyCurrency.confidence > 70) {
      errors.push(`Warning: Transactions appear to be in ${mostLikelyCurrency.currency} but your settings use ${currentCurrency}`);
    }
  }

  // Validate each transaction
  transactions.forEach((t, index) => {
    // Date validation
    if (!dateRegex.test(t.date)) {
      errors.push(`Row ${index + 1}: Invalid date format. Use YYYY-MM-DD`);
    } else {
      const date = new Date(t.date);
      if (isNaN(date.getTime()) || date > new Date()) {
        errors.push(`Row ${index + 1}: Invalid or future date`);
      }
    }

    // Description validation
    if (!t.description || t.description.length < 2) {
      errors.push(`Row ${index + 1}: Description too short`);
    }
    if (t.description.length > 200) {
      errors.push(`Row ${index + 1}: Description too long (max 200 characters)`);
    }

    // Amount validation
    if (isNaN(t.amount) || t.amount === 0) {
      errors.push(`Row ${index + 1}: Invalid amount`);
    }
    if (Math.abs(t.amount) > 1000000) {
      errors.push(`Row ${index + 1}: Amount exceeds maximum limit`);
    }
  });

  // Check for duplicate transactions
  const duplicates = findDuplicateTransactions(transactions);
  if (duplicates.length > 0) {
    errors.push(`Found ${duplicates.length} potential duplicate transactions`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const findDuplicateTransactions = (
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
  }>
): number[] => {
  const duplicateIndices: number[] = [];
  const seen = new Map<string, number>();

  transactions.forEach((t, index) => {
    // Create a unique key for each transaction
    const key = `${t.date}-${t.description}-${t.amount}`;
    
    if (seen.has(key)) {
      duplicateIndices.push(index);
    } else {
      seen.set(key, index);
    }
  });

  return duplicateIndices;
};