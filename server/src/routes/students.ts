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
      notes
    });

    // If fully paid, add to main financial database as income
    if (status === 'paid') {
      await dbService.addTransaction({
        description: `Tuition fees - ${month}/${year}`,
        amount: totalAmount,
        date: new Date().toISOString(),
        type: 'income',
        category: 'tuition-fees',
        mainCategory: 'business'
      });
    }
    
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
            status: 'pending'
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

export default router;