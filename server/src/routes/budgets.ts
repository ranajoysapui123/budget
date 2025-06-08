import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { dbService } from '../index';
import { AuthRequest, RouteHandler, AsyncRouteHandler } from '../types';

const router = Router();

// Get budgets
const getBudgets: RouteHandler = (req, res) => {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;
    
    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }
    
    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);
    
    const budgets = dbService.getUserBudgets(userId, yearNum, monthNum);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets' });
  }
};

// Create or update budget
const createOrUpdateBudget: AsyncRouteHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { categoryId, amount, month, year } = req.body;
    const budget = await dbService.createBudget({
      userId: req.user!.id,
      categoryId,
      amount,
      month,
      year
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error creating budget' });
  }
};

router.get('/', [
  query('month').isInt({ min: 1, max: 12 }),
  query('year').isInt({ min: 2000, max: 2100 })
], getBudgets);

router.post('/', [
  body('categoryId').notEmpty(),
  body('amount').isNumeric(),
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2000, max: 2100 })
], createOrUpdateBudget);

export default router;
