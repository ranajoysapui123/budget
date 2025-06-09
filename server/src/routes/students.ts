import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { dbService } from '../index';
import { RequestHandler } from '../types/express';

const router = Router();

// Get all students with their fees
const getAllStudents: RequestHandler = async (req, res) => {
  try {
    const students = await dbService.students.getStudentsWithFees();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
};

// Get student by ID
const getStudentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await dbService.students.getStudentById(id);
    
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    
    const subjects = await dbService.students.getStudentSubjects(id);
    const fees = await dbService.students.getStudentFees(id);
    
    res.json({
      ...student,
      subjects,
      fees
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student' });
  }
};

// Create new student
const createStudent: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const studentData = req.body;
    const student = await dbService.students.createStudent(studentData);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student' });
  }
};

// Update student
const updateStudent: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    await dbService.students.updateStudent(id, req.body);
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student' });
  }
};

// Delete student
const deleteStudent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.students.deleteStudent(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
};

// Get all subjects
const getAllSubjects: RequestHandler = async (req, res) => {
  try {
    const subjects = await dbService.students.getAllSubjects();
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

// Create new subject
const createSubject: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const subject = await dbService.students.createSubject(req.body);
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Error creating subject' });
  }
};

// Enroll student in subject
const enrollStudent: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const enrollment = await dbService.students.enrollStudentInSubject(req.body);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ message: 'Error enrolling student' });
  }
};

// Record fee payment
const recordFeePayment: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { studentId, month, year, paidAmount, paymentMethod, notes } = req.body;
    
    // Calculate total monthly fee for the student
    const totalAmount = await dbService.students.calculateMonthlyFee(studentId);
    
    // Determine payment status
    let status = 'pending';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }
    
    const feeRecord = await dbService.students.createFeeRecord({
      studentId,
      month,
      year,
      totalAmount,
      paidAmount,
      paymentDate: new Date().toISOString(),
      paymentMethod,
      status: status as any,
      notes,
      aggregated: false // Mark as not aggregated initially
    });
    
    res.status(201).json(feeRecord);
  } catch (error) {
    console.error('Error recording fee payment:', error);
    res.status(500).json({ message: 'Error recording fee payment' });
  }
};

// Get fee summary for a month
const getFeeSummary: RequestHandler = async (req, res) => {
  try {
    const { month, year } = req.query;
    const summary = await dbService.students.getMonthlyFeeSummary(
      month as string, 
      parseInt(year as string)
    );
    res.json(summary);
  } catch (error) {
    console.error('Error fetching fee summary:', error);
    res.status(500).json({ message: 'Error fetching fee summary' });
  }
};

// Generate monthly fee records for all active students
const generateMonthlyFees: RequestHandler = async (req, res) => {
  try {
    const { month, year } = req.body;
    const students = await dbService.students.getAllStudents();
    const activeStudents = students.filter(s => s.status === 'active');
    
    const feeRecords = [];
    
    for (const student of activeStudents) {
      const totalAmount = await dbService.students.calculateMonthlyFee(student.id);
      
      if (totalAmount > 0) {
        try {
          const feeRecord = await dbService.students.createFeeRecord({
            studentId: student.id,
            month,
            year,
            totalAmount,
            paidAmount: 0,
            status: 'pending',
            aggregated: false
          });
          feeRecords.push(feeRecord);
        } catch (error) {
          // Skip if record already exists
          console.log(`Fee record already exists for student ${student.name} for ${month}/${year}`);
        }
      }
    }
    
    res.json({
      message: `Generated ${feeRecords.length} fee records for ${month}/${year}`,
      records: feeRecords
    });
  } catch (error) {
    console.error('Error generating monthly fees:', error);
    res.status(500).json({ message: 'Error generating monthly fees' });
  }
};

// NEW: Aggregate monthly fees to main financial database
const aggregateMonthlyFees: RequestHandler = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Get all unaggregated paid fees for the month
    const unaggregatedPayments = await dbService.students.getUnaggregatedFeePayments(month, year);
    
    if (unaggregatedPayments.length === 0) {
      res.json({
        message: `No unaggregated fees found for ${month}/${year}`,
        totalAmount: 0,
        paymentCount: 0
      });
      return;
    }
    
    // Calculate total amount
    const totalAmount = unaggregatedPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    
    // Create a transaction in the main financial database
    const transaction = await dbService.addTransaction({
      description: `Tuition Fees Collection - ${month}/${year}`,
      amount: totalAmount,
      date: new Date().toISOString(),
      type: 'income',
      category: 'tuition-fees', // This should match a category in your main system
      mainCategory: 'business'
    });
    
    // Mark all payments as aggregated
    const paymentIds = unaggregatedPayments.map(p => p.id);
    await dbService.students.markPaymentsAsAggregated(paymentIds);
    
    // Record the aggregation in the tracking table
    const aggregationRecord = {
      id: crypto.randomUUID(),
      month,
      year,
      totalAmount,
      paymentCount: unaggregatedPayments.length,
      transactionId: transaction.id,
      aggregatedAt: new Date().toISOString()
    };
    
    // Insert aggregation record
    const stmt = dbService.getRawDatabase().prepare(`
      INSERT INTO monthly_aggregations (
        id, month, year, total_amount, payment_count, transaction_id, aggregated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      aggregationRecord.id,
      aggregationRecord.month,
      aggregationRecord.year,
      aggregationRecord.totalAmount,
      aggregationRecord.paymentCount,
      aggregationRecord.transactionId,
      aggregationRecord.aggregatedAt
    );
    
    res.json({
      message: `Successfully aggregated ${unaggregatedPayments.length} fee payments totaling ₹${totalAmount.toLocaleString()} for ${month}/${year}`,
      totalAmount,
      paymentCount: unaggregatedPayments.length,
      transactionId: transaction.id,
      aggregationRecord
    });
  } catch (error) {
    console.error('Error aggregating monthly fees:', error);
    res.status(500).json({ message: 'Error aggregating monthly fees' });
  }
};

// NEW: Get aggregation history
const getAggregationHistory: RequestHandler = async (req, res) => {
  try {
    const stmt = dbService.getRawDatabase().prepare(`
      SELECT 
        id, month, year, total_amount as totalAmount, 
        payment_count as paymentCount, transaction_id as transactionId,
        aggregated_at as aggregatedAt
      FROM monthly_aggregations 
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);
    
    const history = stmt.all();
    res.json(history);
  } catch (error) {
    console.error('Error fetching aggregation history:', error);
    res.status(500).json({ message: 'Error fetching aggregation history' });
  }
};

// NEW: Auto-aggregate fees (can be called by a cron job)
const autoAggregateLastMonth: RequestHandler = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
    const year = lastMonth.getFullYear();
    
    // Check if already aggregated
    const existingAggregation = dbService.getRawDatabase().prepare(`
      SELECT id FROM monthly_aggregations WHERE month = ? AND year = ?
    `).get(month, year);
    
    if (existingAggregation) {
      res.json({
        message: `Fees for ${month}/${year} have already been aggregated`,
        alreadyAggregated: true
      });
      return;
    }
    
    // Perform aggregation
    const unaggregatedPayments = await dbService.students.getUnaggregatedFeePayments(month, year);
    
    if (unaggregatedPayments.length === 0) {
      res.json({
        message: `No fees to aggregate for ${month}/${year}`,
        totalAmount: 0,
        paymentCount: 0
      });
      return;
    }
    
    const totalAmount = unaggregatedPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    
    // Create transaction in main database
    const transaction = await dbService.addTransaction({
      description: `Tuition Fees Collection - ${month}/${year} (Auto-aggregated)`,
      amount: totalAmount,
      date: new Date().toISOString(),
      type: 'income',
      category: 'tuition-fees',
      mainCategory: 'business'
    });
    
    // Mark payments as aggregated
    const paymentIds = unaggregatedPayments.map(p => p.id);
    await dbService.students.markPaymentsAsAggregated(paymentIds);
    
    // Record aggregation
    const stmt = dbService.getRawDatabase().prepare(`
      INSERT INTO monthly_aggregations (
        id, month, year, total_amount, payment_count, transaction_id, aggregated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      crypto.randomUUID(),
      month,
      year,
      totalAmount,
      unaggregatedPayments.length,
      transaction.id,
      new Date().toISOString()
    );
    
    res.json({
      message: `Auto-aggregated ${unaggregatedPayments.length} fee payments totaling ₹${totalAmount.toLocaleString()} for ${month}/${year}`,
      totalAmount,
      paymentCount: unaggregatedPayments.length,
      transactionId: transaction.id,
      autoAggregated: true
    });
  } catch (error) {
    console.error('Error in auto-aggregation:', error);
    res.status(500).json({ message: 'Error in auto-aggregation' });
  }
};

// Routes
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.post('/students', [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('enrollmentDate').isISO8601(),
  body('guardianName').optional().trim(),
  body('guardianPhone').optional().isMobilePhone('any')
], createStudent);

router.put('/students/:id', [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone('any')
], updateStudent);

router.delete('/students/:id', deleteStudent);

router.get('/subjects', getAllSubjects);
router.post('/subjects', [
  body('name').notEmpty().trim(),
  body('baseFee').isNumeric(),
  body('duration').optional().trim()
], createSubject);

router.post('/enroll', [
  body('studentId').notEmpty(),
  body('subjectId').notEmpty(),
  body('startDate').isISO8601(),
  body('customFee').optional().isNumeric()
], enrollStudent);

router.post('/fees/payment', [
  body('studentId').notEmpty(),
  body('month').matches(/^\d{2}$/),
  body('year').isInt({ min: 2020, max: 2030 }),
  body('paidAmount').isNumeric(),
  body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'upi'])
], recordFeePayment);

router.get('/fees/summary', [
  query('month').matches(/^\d{2}$/),
  query('year').isInt({ min: 2020, max: 2030 })
], getFeeSummary);

router.post('/fees/generate', [
  body('month').matches(/^\d{2}$/),
  body('year').isInt({ min: 2020, max: 2030 })
], generateMonthlyFees);

// NEW ROUTES for fee aggregation
router.post('/fees/aggregate', [
  body('month').matches(/^\d{2}$/),
  body('year').isInt({ min: 2020, max: 2030 })
], aggregateMonthlyFees);

router.get('/fees/aggregation-history', getAggregationHistory);
router.post('/fees/auto-aggregate', autoAggregateLastMonth);

export default router;