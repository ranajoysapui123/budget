import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbService } from '../index';
import {  RequestHandler } from '../types/express';

const router = Router();

// Get recurring transactions
const getRecurringTransactions: RequestHandler = (req, res) => {
  try {
    const userId = req.user!.id;
    const transactions = dbService.getUserRecurringTransactions(userId);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recurring transactions' });
  }
};

// Create recurring transaction
const createRecurringTransaction: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { amount, description, category, mainCategory, type, frequency, startDate, endDate } = req.body;
    const transaction = await dbService.createRecurringTransaction({
      userId: req.user!.id,
      amount,
      description,
      category,
      mainCategory,
      type,
      frequency,
      startDate,
      endDate: endDate || null
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating recurring transaction' });
  }
};

// Route definitions
router.get('/', getRecurringTransactions);
router.post('/', [
  body('amount').isNumeric(),
  body('description').notEmpty(),
  body('category').notEmpty(),
  body('mainCategory').notEmpty(),
  body('type').isIn(['income', 'expense']),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601()
], createRecurringTransaction);

export default router;
