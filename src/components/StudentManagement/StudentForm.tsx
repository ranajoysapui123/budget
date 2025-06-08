import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { User, BookOpen, Phone, MapPin, Calendar, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface Subject {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  duration: string;
}

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

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  initialData?: Partial<StudentFormData>;
  isEditing?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { showNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    selectedSubjects: [],
    ...initialData
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/students/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load subjects'
      });
    }
  };

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSubject = () => {
    if (subjects.length === 0) return;
    
    const availableSubjects = subjects.filter(
      subject => !formData.selectedSubjects.some(s => s.subjectId === subject.id)
    );
    
    if (availableSubjects.length === 0) {
      showNotification({
        type: 'info',
        message: 'All subjects have been added'
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      selectedSubjects: [
        ...prev.selectedSubjects,
        { subjectId: availableSubjects[0].id }
      ]
    }));
  };

  const removeSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.filter((_, i) => i !== index)
    }));
  };

  const updateSubject = (index: number, field: 'subjectId' | 'customFee', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.map((subject, i) => 
        i === index 
          ? { ...subject, [field]: field === 'customFee' ? Number(value) : value }
          : subject
      )
    }));
  };

  const calculateTotalFee = () => {
    return formData.selectedSubjects.reduce((total, selectedSubject) => {
      const subject = subjects.find(s => s.id === selectedSubject.subjectId);
      const fee = selectedSubject.customFee || subject?.baseFee || 0;
      return total + fee;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedSubjects.length === 0) {
      showNotification({
        type: 'error',
        message: 'Please select at least one subject'
      });
      return;
    }

    // Map selected subjects to required format
    const mappedSubjects = formData.selectedSubjects.map(selected => {
      const subject = subjects.find(s => s.id === selected.subjectId);
      if (!subject) {
        throw new Error('Selected subject not found');
      }
      return {
        name: subject.name,
        fee: selected.customFee || subject.baseFee,
      };
    });
    
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        subjects: mappedSubjects
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSubjects = (currentIndex: number) => {
    const currentSubjectId = formData.selectedSubjects[currentIndex]?.subjectId;
    return subjects.filter(subject => 
      !formData.selectedSubjects.some((s, i) => 
        s.subjectId === subject.id && i !== currentIndex
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Student' : 'Add New Student'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditing ? 'Update student information' : 'Enter student details and select subjects'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Enter student's full name"
                required
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="student@example.com"
              />
              
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="+1 (555) 123-4567"
              />
              
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(value) => handleInputChange('dateOfBirth', value)}
                required
              />
              
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Guardian Name"
                value={formData.guardianName}
                onChange={(value) => handleInputChange('guardianName', value)}
                placeholder="Enter guardian's name"
              />
              
              <Input
                label="Guardian Phone"
                type="tel"
                value={formData.guardianPhone}
                onChange={(value) => handleInputChange('guardianPhone', value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Enrollment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Enrollment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Enrollment Date"
                type="date"
                value={formData.enrollmentDate}
                onChange={(value) => handleInputChange('enrollmentDate', value)}
                required
              />
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Subject Selection
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubject}
                icon={<Plus className="w-4 h-4" />}
                disabled={formData.selectedSubjects.length >= subjects.length}
              >
                Add Subject
              </Button>
            </div>

            <div className="space-y-4">
              {formData.selectedSubjects.map((selectedSubject, index) => {
                const subject = subjects.find(s => s.id === selectedSubject.subjectId);
                const availableSubjects = getAvailableSubjects(index);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <Select
                        label=""
                        value={selectedSubject.subjectId}
                        onChange={(value) => updateSubject(index, 'subjectId', value)}
                        options={availableSubjects.map(s => ({
                          value: s.id,
                          label: `${s.name} - ₹${s.baseFee}/month`
                        }))}
                        required
                      />
                    </div>
                    
                    <div className="w-32">
                      <Input
                        label=""
                        type="number"
                        value={selectedSubject.customFee?.toString() || ''}
                        onChange={(value) => updateSubject(index, 'customFee', value)}
                        placeholder={`₹${subject?.baseFee || 0}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Custom fee (optional)</p>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{selectedSubject.customFee || subject?.baseFee || 0}
                      </p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeSubject(index)}
                      icon={<Trash2 className="w-4 h-4" />}
                    />
                  </motion.div>
                );
              })}
              
              {formData.selectedSubjects.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No subjects selected. Click "Add Subject" to get started.</p>
                </div>
              )}
            </div>

            {formData.selectedSubjects.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      Total Monthly Fee:
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{calculateTotalFee().toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || formData.selectedSubjects.length === 0}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Add Student')}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default StudentForm;