import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import { initializeDatabase } from './db/schema';
import { initializeStudentDatabase } from './db/studentSchema';
import { DatabaseService}  from './db/index';
import authRoutes, { initializeAuth } from './routes/auth';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import recurringRoutes from './routes/recurring';
import savingsRoutes from './routes/savings';
import budgetRoutes from './routes/budgets';
import studentRoutes from './routes/students';
import feesRoutes from './routes/fees';
import { authenticateToken } from './middleware/auth';

// Load environment variables
config();

// Initialize database
const db = new Database(process.env.DATABASE_PATH || './data.db');
initializeDatabase(db);
initializeStudentDatabase(db);
export const dbService = new DatabaseService(db);

// IMPORTANT: Initialize auth with database service BEFORE using routes
initializeAuth(dbService);

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authenticateToken as express.RequestHandler, transactionRoutes);
app.use('/api/categories', authenticateToken as express.RequestHandler, categoryRoutes);
app.use('/api/budgets', authenticateToken as express.RequestHandler, budgetRoutes);
app.use('/api/savings', authenticateToken as express.RequestHandler, savingsRoutes);
app.use('/api/recurring', authenticateToken as express.RequestHandler, recurringRoutes);
app.use('/api/students', authenticateToken as express.RequestHandler, studentRoutes);
app.use('/api/fees', authenticateToken as express.RequestHandler, feesRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});