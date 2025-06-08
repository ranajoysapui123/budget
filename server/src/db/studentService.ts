import { Database } from 'better-sqlite3';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  duration: string; // e.g., "1 hour", "90 minutes"
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubject {
  id: string;
  studentId: string;
  subjectId: string;
  customFee?: number; // Override base fee if needed
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'dropped';
  createdAt: string;
  updatedAt: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  month: string; // YYYY-MM format
  year: number;
  totalAmount: number;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'upi';
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class StudentService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Student CRUD operations
  async createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO students (
        id, name, email, phone, address, date_of_birth, 
        guardian_name, guardian_phone, enrollment_date, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, student.name, student.email, student.phone, student.address,
      student.dateOfBirth, student.guardianName, student.guardianPhone,
      student.enrollmentDate, student.status, now, now
    );

    return { ...student, id, createdAt: now, updatedAt: now };
  }

  async getAllStudents(): Promise<Student[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, email, phone, address, date_of_birth as dateOfBirth,
        guardian_name as guardianName, guardian_phone as guardianPhone,
        enrollment_date as enrollmentDate, status, created_at as createdAt,
        updated_at as updatedAt
      FROM students 
      ORDER BY name
    `);
    
    return stmt.all() as Student[];
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, email, phone, address, date_of_birth as dateOfBirth,
        guardian_name as guardianName, guardian_phone as guardianPhone,
        enrollment_date as enrollmentDate, status, created_at as createdAt,
        updated_at as updatedAt
      FROM students 
      WHERE id = ?
    `);
    
    return stmt.get(id) as Student | undefined;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const dbKey = key === 'dateOfBirth' ? 'date_of_birth' :
                     key === 'guardianName' ? 'guardian_name' :
                     key === 'guardianPhone' ? 'guardian_phone' :
                     key === 'enrollmentDate' ? 'enrollment_date' :
                     key === 'updatedAt' ? 'updated_at' : key;
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE students SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  async deleteStudent(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
  }

  // Subject CRUD operations
  async createSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO subjects (id, name, description, base_fee, duration, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, subject.name, subject.description, subject.baseFee, subject.duration, now, now);
    return { ...subject, id, createdAt: now, updatedAt: now };
  }

  async getAllSubjects(): Promise<Subject[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, description, base_fee as baseFee, duration,
        created_at as createdAt, updated_at as updatedAt
      FROM subjects 
      ORDER BY name
    `);
    
    return stmt.all() as Subject[];
  }

  async updateSubject(id: string, updates: Partial<Subject>): Promise<void> {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const dbKey = key === 'baseFee' ? 'base_fee' :
                     key === 'updatedAt' ? 'updated_at' : key;
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE subjects SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  async deleteSubject(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM subjects WHERE id = ?');
    stmt.run(id);
  }

  // Student-Subject enrollment
  async enrollStudentInSubject(enrollment: Omit<StudentSubject, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentSubject> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO student_subjects (
        id, student_id, subject_id, custom_fee, start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, enrollment.studentId, enrollment.subjectId, enrollment.customFee,
      enrollment.startDate, enrollment.endDate, enrollment.status, now, now
    );

    return { ...enrollment, id, createdAt: now, updatedAt: now };
  }

  async getStudentSubjects(studentId: string): Promise<(StudentSubject & { subjectName: string; baseFee: number })[]> {
    const stmt = this.db.prepare(`
      SELECT 
        ss.id, ss.student_id as studentId, ss.subject_id as subjectId,
        ss.custom_fee as customFee, ss.start_date as startDate,
        ss.end_date as endDate, ss.status, ss.created_at as createdAt,
        ss.updated_at as updatedAt, s.name as subjectName, s.base_fee as baseFee
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.student_id = ? AND ss.status = 'active'
      ORDER BY s.name
    `);
    
    return stmt.all(studentId) as (StudentSubject & { subjectName: string; baseFee: number })[];
  }

  async updateStudentSubject(id: string, updates: Partial<StudentSubject>): Promise<void> {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const dbKey = key === 'studentId' ? 'student_id' :
                     key === 'subjectId' ? 'subject_id' :
                     key === 'customFee' ? 'custom_fee' :
                     key === 'startDate' ? 'start_date' :
                     key === 'endDate' ? 'end_date' :
                     key === 'updatedAt' ? 'updated_at' : key;
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE student_subjects SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  // Fee management
  async createFeeRecord(fee: Omit<FeePayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeePayment> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO fee_payments (
        id, student_id, month, year, total_amount, paid_amount,
        payment_date, payment_method, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, fee.studentId, fee.month, fee.year, fee.totalAmount, fee.paidAmount,
      fee.paymentDate, fee.paymentMethod, fee.status, fee.notes, now, now
    );

    return { ...fee, id, createdAt: now, updatedAt: now };
  }

  async getStudentFees(studentId: string, year?: number): Promise<FeePayment[]> {
    let query = `
      SELECT 
        id, student_id as studentId, month, year, total_amount as totalAmount,
        paid_amount as paidAmount, payment_date as paymentDate,
        payment_method as paymentMethod, status, notes,
        created_at as createdAt, updated_at as updatedAt
      FROM fee_payments 
      WHERE student_id = ?
    `;
    
    const params = [studentId];
    
    if (year) {
      query += ' AND year = ?';
      params.push(year.toString());
    }
    
    query += ' ORDER BY year DESC, month DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as FeePayment[];
  }

  async updateFeePayment(id: string, updates: Partial<FeePayment>): Promise<void> {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const dbKey = key === 'studentId' ? 'student_id' :
                     key === 'totalAmount' ? 'total_amount' :
                     key === 'paidAmount' ? 'paid_amount' :
                     key === 'paymentDate' ? 'payment_date' :
                     key === 'paymentMethod' ? 'payment_method' :
                     key === 'updatedAt' ? 'updated_at' : key;
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE fee_payments SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  }

  // Calculate monthly fee for a student
  async calculateMonthlyFee(studentId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT 
        COALESCE(ss.custom_fee, s.base_fee) as fee
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.student_id = ? AND ss.status = 'active'
    `);
    
    const fees = stmt.all(studentId) as { fee: number }[];
    return fees.reduce((total, { fee }) => total + fee, 0);
  }

  // Get students with their monthly fees
  async getStudentsWithFees(): Promise<(Student & { monthlyFee: number; subjects: string[] })[]> {
    const students = await this.getAllStudents();
    
    const result = await Promise.all(students.map(async (student) => {
      const monthlyFee = await this.calculateMonthlyFee(student.id);
      const subjects = await this.getStudentSubjects(student.id);
      
      return {
        ...student,
        monthlyFee,
        subjects: subjects.map(s => s.subjectName)
      };
    }));
    
    return result;
  }

  // Get fee summary for a specific month
  async getMonthlyFeeSummary(month: string, year: number): Promise<{
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    studentCount: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as studentCount,
        SUM(total_amount) as totalExpected,
        SUM(paid_amount) as totalCollected,
        SUM(total_amount - paid_amount) as totalPending
      FROM fee_payments 
      WHERE month = ? AND year = ?
    `);
    
    const result = stmt.get(month, year) as any;
    
    return {
      totalExpected: result.totalExpected || 0,
      totalCollected: result.totalCollected || 0,
      totalPending: result.totalPending || 0,
      studentCount: result.studentCount || 0
    };
  }
}