import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { dbService } from '../index';
import { RequestHandler } from '../types/express';

const router = Router();

// Get transactions
const getTransactions: RequestHandler = (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, type, category, mainCategory } = req.query;
    
    const transactions = dbService.getUserTransactions(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      type: type ? [type as string] : undefined,
      category: category ? [category as string] : undefined,
      mainCategory: mainCategory ? [mainCategory as string] : undefined
    });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Create transaction
const createTransaction: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { amount, description, date, category, mainCategory, type, tags = [], splits = [] } = req.body;
        const transaction = await dbService.createTransaction({
          userId: req.user!.id,
          amount,
          description,
          date,
          category,
          mainCategory,
          type,
          tags,
          splits,
          isSplit: splits.length > 0
        });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

// Route definitions
router.get('/', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().isString(),
  query('mainCategory').optional().isString()
], getTransactions);

router.post('/', [
  body('amount').isNumeric(),
  body('description').notEmpty(),
  body('date').isISO8601(),
  body('category').notEmpty(),
  body('mainCategory').notEmpty(),
  body('type').isIn(['income', 'expense']),
  body('tags').optional().isArray(),
  body('splits').optional().isArray()
], createTransaction);

export default router;
