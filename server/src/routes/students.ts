import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { dbService } from '../index';
import { RequestHandler } from '../types/express';
import { authenticateToken } from '../middleware/auth';
import { DatabaseService } from '../db/databaseService';
import Database from 'better-sqlite3';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();
const db = new Database('data.db');
const studentDbService = new DatabaseService(db);

// Get all students with their fees
const getAllStudents: RequestHandler = async (req, res) => {
  try {
    // Set cache control headers to prevent 304 responses
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    
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
    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    
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

// Update subject
const updateSubject: RequestHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    await dbService.students.updateSubject(id, req.body);
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ message: 'Error updating subject' });
  }
};

// Delete subject
const deleteSubject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.students.deleteSubject(id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Error deleting subject' });
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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { studentId, month, year, paidAmount, paymentMethod, notes } = req.body;
    
    // Validate month format
    if (!/^\d{2}$/.test(month) || parseInt(month) < 1 || parseInt(month) > 12) {
      res.status(400).json({ message: 'Invalid month format. Must be 2 digits between 01-12' });
      return;
    }

    // Validate year format
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      res.status(400).json({ message: 'Invalid year' });
      return;
    }

    // Validate payment amount
    if (paidAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be greater than 0' });
      return;
    }
    
    // Check if student exists and is active
    const student = await dbService.students.getStudentById(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    if (student.status !== 'active') {
      res.status(400).json({ message: 'Cannot record payment for inactive student' });
      return;
    }
    
    // Calculate total monthly fee for the student
    const totalAmount = await dbService.students.calculateMonthlyFee(studentId);
    
    if (totalAmount <= 0) {
      res.status(400).json({ message: 'No active subjects found for this student' });
      return;
    }
    
    // Check for existing fee record
    const existingRecord = await dbService.students.getFeeRecord(studentId, month, year);

    let feeRecord;
    
    if (existingRecord) {
      // Calculate the remaining amount that can be paid
      const remainingAmount = totalAmount - existingRecord.paidAmount;
      
      // Validate that the payment amount is not more than the remaining amount
      if (paidAmount > remainingAmount) {
        res.status(400).json({ 
          message: 'Payment amount exceeds the remaining balance',
          remainingAmount,
          totalAmount,
          alreadyPaid: existingRecord.paidAmount
        });
        return;
      }

      // Update existing record
      const totalPaid = existingRecord.paidAmount + paidAmount;
      const newStatus = totalPaid >= totalAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
      
      await dbService.students.updateFeePayment(existingRecord.id, {
        paidAmount: totalPaid,
        status: newStatus,
        paymentMethod,
        paymentDate: new Date().toISOString(),
        notes: notes ? `${existingRecord.notes ? existingRecord.notes + '; ' : ''}${notes}` : existingRecord.notes
      });
      
      feeRecord = await dbService.students.getFeeRecord(studentId, month, year);
    } else {
      // Validate that the payment amount is not more than the total amount
      if (paidAmount > totalAmount) {
        res.status(400).json({ 
          message: 'Payment amount exceeds the total fee amount',
          totalAmount
        });
        return;
      }

      // Determine initial payment status
      const status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
      
      // Create new record
      feeRecord = await dbService.students.createFeeRecord({
        studentId,
        month,
        year,
        totalAmount,
        paidAmount,
        paymentDate: new Date().toISOString(),
        paymentMethod,
        status,
        notes
      });
    }
    
    res.status(201).json(feeRecord);
  } catch (error: any) {
    console.error('Error recording fee payment:', error);

    // Handle known error cases
    if (error.message?.includes('UNIQUE constraint failed')) {
      res.status(409).json({ message: 'A fee record already exists for this month' });
      return;
    }
    
    if (error.message === 'Fee record not found') {
      res.status(404).json({ message: 'Fee record not found' });
      return;
    }

    // For unknown errors, return 500
    res.status(500).json({ 
      message: 'An error occurred while recording the payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    const errors = [];
    
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
            status: 'pending'
          });
          feeRecords.push(feeRecord);
        } catch (error) {
          // Skip if record already exists
          errors.push(`Fee record already exists for student ${student.name} for ${month}/${year}`);
        }
      }
    }
    
    res.json({
      message: `Generated ${feeRecords.length} fee records for ${month}/${year}`,
      records: feeRecords,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error generating monthly fees:', error);
    res.status(500).json({ message: 'Error generating monthly fees' });
  }
};

// Get students with subjects
const getStudentsWithSubjects: RequestHandler = async (req, res) => {
  try {
    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    
    const { month, year } = req.query;
    
    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }

    const monthStr = month.toString().padStart(2, '0');
    const yearNum = parseInt(year.toString(), 10);
    
    const students = await dbService.students.getStudentsWithSubjectsAndFees(monthStr, yearNum);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students with subjects:', error);
    res.status(500).json({ message: 'Error fetching students with subjects' });
  }
}

// Get students with detailed subject info
const getStudentsWithDetails: RequestHandler = async (req, res) => {
  try {
    const students = await dbService.students.getStudentsWithDetailedSubjects();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students with details:', error);
    res.status(500).json({ message: 'Error fetching students with details' });
  }
};

// Get student fees by month and year
const getStudentFees: RequestHandler = async (req, res) => {
  try {
    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    
    const { month, year } = req.query;
    
    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }

    const monthStr = month.toString().padStart(2, '0');
    const yearNum = parseInt(year.toString(), 10);
    
    // Get students with their fee records for the specified month
    const students = await dbService.students.getAllStudents();
    const activeStudents = students.filter(s => s.status === 'active');
    
    const feeRecords = [];
    
    for (const student of activeStudents) {
      const totalAmount = await dbService.students.calculateMonthlyFee(student.id);
      const feeRecord = await dbService.students.getFeeRecord(student.id, monthStr, yearNum);
      
      // Create a fee record object with required information
      feeRecords.push({
        id: feeRecord?.id || `${student.id}-${monthStr}-${yearNum}`,
        studentId: student.id,
        studentName: student.name,
        month: monthStr,
        year: yearNum,
        totalAmount,
        paidAmount: feeRecord?.paidAmount || 0,
        paymentDate: feeRecord?.paymentDate,
        paymentMethod: feeRecord?.paymentMethod,
        status: feeRecord?.status || 'pending',
        notes: feeRecord?.notes
      });
    }
    
    res.json(feeRecords);
  } catch (error) {
    console.error('Error fetching fee records:', error);
    res.status(500).json({ message: 'Error fetching fee records' });
  }
};

// IMPORTANT: Order matters! Put specific routes BEFORE parameterized routes

// All specific routes first (no parameters)
router.get('/students', getAllStudents);
router.get('/with-subjects', getStudentsWithDetails);
router.get('/subjects', getAllSubjects);

// Fee-related specific routes
router.get('/fees', [
  query('month').matches(/^\d{2}$/),
  query('year').isInt({ min: 2020, max: 2030 })
], getStudentFees);

router.get('/fees/summary', [
  query('month').matches(/^\d{2}$/),
  query('year').isInt({ min: 2020, max: 2030 })
], getFeeSummary);

router.post('/fees/payment', [
  body('studentId').notEmpty(),
  body('month').matches(/^\d{2}$/),
  body('year').isInt({ min: 2020, max: 2030 }),
  body('paidAmount').isNumeric(),
  body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'upi']),
  body('notes').optional().trim()
], recordFeePayment);

router.post('/fees/generate', [
  body('month').matches(/^\d{2}$/),
  body('year').isInt({ min: 2020, max: 2030 })
], generateMonthlyFees);

// Subject-related routes
router.post('/subject', [
  body('name').notEmpty(),
  body('description').optional().trim(),
  body('baseFee').isNumeric(),
  body('duration').optional().trim()
], createSubject);

router.post('/enroll', [
  body('studentId').notEmpty(),
  body('subjectId').notEmpty(),
  body('startDate').isISO8601(),
  body('customFee').optional().isNumeric()
], enrollStudent);

// Now the parameterized routes (these should come LAST)
router.get('/student/:id', getStudentById);

router.put('/student/:id', updateStudent);
router.delete('/student/:id', deleteStudent);

router.post('/student', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
  body('address').notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('guardianName').notEmpty(),
  body('guardianPhone').notEmpty(),
  body('status').isIn(['active', 'inactive', 'graduated'])
], createStudent);

router.put('/subject/:id', [
  body('name').optional().notEmpty(),
  body('description').optional().trim(),
  body('baseFee').optional().isNumeric(),
  body('duration').optional().trim()
], updateSubject);

router.delete('/subject/:id', deleteSubject);

// Authenticated routes with parameters
router.get('/:id/fee-balance', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    const balance = await studentDbService.getStudentFeeBalance(studentId, req.user!.id);
    res.json(balance);
  } catch (error) {
    console.error('Error fetching fee balance:', error);
    res.status(500).json({ message: 'Error fetching fee balance' });
  }
});

router.post('/:id/subjects', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    const { subjects } = req.body;

    await studentDbService.updateStudentSubjects(studentId, subjects);
    res.status(201).json({ message: 'Subjects saved successfully' });
  } catch (error) {
    console.error('Error saving subjects:', error);
    res.status(500).json({ message: 'Error saving subjects' });
  }
});

export default router;