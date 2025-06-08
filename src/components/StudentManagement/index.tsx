import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Search, 
  Plus,
  BookOpen
} from 'lucide-react';
import StudentDashboard from './StudentDashboard';
import StudentList from './StudentList';
import StudentForm from './StudentForm';
import FeeManagement from './FeeManagement';
import StudentQuery from './StudentQuery';
import SubjectManagement from './SubjectManagement';
import { useNotification } from '../../contexts/NotificationContext';

type ActiveView = 'dashboard' | 'students' | 'subjects' | 'fees' | 'query' | 'add-student' | 'edit-student';

interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  selectedSubjects: Array<{
    subjectId: string;
    customFee?: number;
  }>;
  subjects?: Array<{
    name: string;
    fee: number;
  }>;
}

interface Subject {
  name: string;
  fee: number;
}

interface Student {
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
  monthlyFee: number;
  subjects: Subject[];
}

const StudentManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleAddStudent = () => {
    setEditingStudent(null);
    setActiveView('add-student');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setActiveView('edit-student');
  };

  const handleViewStudent = (student: Student) => {
    // For now, just show a notification. In a full implementation,
    // this could open a detailed view modal or navigate to a detail page
    showNotification({
      type: 'info',
      message: `Viewing details for ${student.name}`
    });
  };

  const handleStudentSubmit = async (formData: StudentFormData) => {
    try {
      const requiredFields = [
        'name',
        'email',
        'phone',
        'address',
        'dateOfBirth',
        'guardianName',
        'guardianPhone'
      ];

      const missingFields = requiredFields.filter(field => 
        !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        showNotification({
          type: 'error',
          message: `Please fill in all required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showNotification({
          type: 'error',
          message: 'Please enter a valid email address'
        });
        return;
      }

      // Update or create student
      const url = `/api/students/student${editingStudent ? `/${editingStudent.id}` : ''}`;
      const method = editingStudent ? 'PUT' : 'POST';
      
      const studentResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          guardianName: formData.guardianName,
          guardianPhone: formData.guardianPhone,
          enrollmentDate: formData.enrollmentDate,
          status: 'active'
        })
      });

      if (!studentResponse.ok) {
        throw new Error('Failed to save student');
      }

      const student = await studentResponse.json();
      const studentId = editingStudent ? editingStudent.id : student.id;

      // Update student subjects
      if (formData.subjects && formData.subjects.length > 0) {
        const subjectsResponse = await fetch(`/api/students/${studentId}/subjects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            subjects: formData.subjects.map(subject => ({
              name: subject.name,
              fee: subject.fee,
              startDate: formData.enrollmentDate
            }))
          })
        });

        if (!subjectsResponse.ok) {
          throw new Error('Failed to update student subjects');
        }
      }

      showNotification({
        type: 'success',
        message: `Student ${editingStudent ? 'updated' : 'added'} successfully`
      });

      setActiveView('students');
    } catch (error) {
      console.error('Error saving student:', error);
      showNotification({
        type: 'error',
        message: `Failed to ${editingStudent ? 'update' : 'add'} student`
      });
    }
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setActiveView('students');
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'fees', label: 'Fee Management', icon: DollarSign },
    { id: 'query', label: 'Query System', icon: Search }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'students':
        return (
          <StudentList
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onViewStudent={handleViewStudent}
          />
        );
      case 'fees':
        return <FeeManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'query':
        return <StudentQuery />;
      case 'add-student':
      case 'edit-student':
        return (
          <StudentForm
            onSubmit={handleStudentSubmit}
            onCancel={handleCancel}
            initialData={editingStudent || undefined}
            isEditing={!!editingStudent}
          />
        );
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h1>
              </div>
            </div>
            
            {activeView === 'students' && (
              <Button
                variant="primary"
                onClick={handleAddStudent}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Student
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ActiveView)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentManagement;