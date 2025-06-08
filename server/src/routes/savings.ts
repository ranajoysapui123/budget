import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { dbService } from '../index';
import { AuthRequest, RouteHandler, AsyncRouteHandler } from '../types';

const router = Router();

// Get savings goals
const getSavingsGoals: RouteHandler = (req, res) => {
  try {
    const userId = req.user!.id;
    const goals = dbService.getUserSavingsGoals(userId);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching savings goals' });
  }
};

// Create savings goal
const createSavingsGoal: AsyncRouteHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, targetAmount, deadline, category, currentAmount = 0 } = req.body;
    const goal = await dbService.createSavingsGoal({
      userId: req.user!.id,
      name,
      targetAmount,
      currentAmount,
      deadline,
      category
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Error creating savings goal' });
  }
};

router.get('/', getSavingsGoals);

router.post('/', [
  body('name').notEmpty(),
  body('targetAmount').isNumeric(),
  body('deadline').optional().isISO8601(),
  body('category').optional().isString(),
  body('currentAmount').optional().isNumeric()
], createSavingsGoal);

export default router;
