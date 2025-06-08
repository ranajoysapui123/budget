import { Database } from 'better-sqlite3';

export const initializeStudentDatabase = (db: Database): void => {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      date_of_birth TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      enrollment_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive', 'graduated')) DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      base_fee REAL NOT NULL,
      duration TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create student_subjects junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_subjects (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      custom_fee REAL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT CHECK(status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
      UNIQUE(student_id, subject_id, status)
    )
  `);

  // Create fee_payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_date TEXT,
      payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'bank_transfer', 'upi')),
      status TEXT CHECK(status IN ('pending', 'partial', 'paid', 'overdue')) DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      UNIQUE(student_id, month, year)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_date);
    CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_subjects_subject ON student_subjects(subject_id);
    CREATE INDEX IF NOT EXISTS idx_student_subjects_status ON student_subjects(status);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_month_year ON fee_payments(month, year);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
  `);
};