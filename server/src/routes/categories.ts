import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { dbService } from '../index';
import { AuthRequest, RouteHandler, AsyncRouteHandler } from '../types';

const router = Router();

// Get all categories for user
const getCategories: RouteHandler = (req, res) => {
  try {
    const categories = dbService.getUserCategories(req.user!.id);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Create new category
const createCategory: AsyncRouteHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, type } = req.body;
    const category = await dbService.createCategory({
      name,
      type,
      userId: req.user!.id,
      isArchived: false
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category' });
  }
};

router.get('/', getCategories);
router.post('/', [
  body('name').notEmpty().trim(),
  body('type').isIn(['income', 'expense'])
], createCategory);

export default router;
