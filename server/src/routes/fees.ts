import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { DatabaseService } from '../db/databaseService';
import { authenticateToken } from '../middleware/auth';
import Database from 'better-sqlite3';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const router = express.Router();
const db = new Database('data.db');
const dbService = new DatabaseService(db);

// Route to manually trigger monthly fee aggregation
router.post('/aggregate-monthly', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await dbService.aggregateMonthlyTuitionFees(req.user!.id);
    res.status(200).json({ message: 'Monthly tuition fees aggregated successfully' });
  } catch (error) {
    console.error('Error aggregating monthly fees:', error);
    res.status(500).json({ message: 'Error aggregating monthly fees' });
  }
});

// Record a fee payment
router.post('/payment', [
  body('amount').isNumeric(),
  body('description').notEmpty(),
  body('date').isISO8601(),
  authenticateToken
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transaction = await dbService.recordTuitionFee(
      req.user!.id,
      req.body.amount,
      req.body.description,
      req.body.date,
      req.body.reference
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error recording fee payment:', error);
    res.status(500).json({ message: 'Error recording fee payment' });
  }
});

export default router;
