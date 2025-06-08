import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  BookOpen,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  User
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

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
  subjects: string[];
}

interface QueryFilters {
  searchTerm: string;
  status: 'all' | 'active' | 'inactive' | 'graduated';
  enrollmentDateFrom: string;
  enrollmentDateTo: string;
  feeRangeMin: string;
  feeRangeMax: string;
  subject: string;
}

const StudentQuery: React.FC = () => {
  const { showNotification } = useNotification();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [filters, setFilters] = useState<QueryFilters>({
    searchTerm: '',
    status: 'all',
    enrollmentDateFrom: '',
    enrollmentDateTo: '',
    feeRangeMin: '',
    feeRangeMax: '',
    subject: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load students'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/students/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const subjectNames = data.map((s: any) => s.name);
        setSubjects(subjectNames);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleFilterChange = (key: keyof QueryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      enrollmentDateFrom: '',
      enrollmentDateTo: '',
      feeRangeMin: '',
      feeRangeMax: '',
      subject: ''
    });
  };

  const filteredStudents = students.filter(student => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.phone.includes(filters.searchTerm) ||
        student.guardianName.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && student.status !== filters.status) {
      return false;
    }

    // Enrollment date filter
    if (filters.enrollmentDateFrom) {
      const enrollmentDate = new Date(student.enrollmentDate);
      const fromDate = new Date(filters.enrollmentDateFrom);
      if (enrollmentDate < fromDate) return false;
    }

    if (filters.enrollmentDateTo) {
      const enrollmentDate = new Date(student.enrollmentDate);
      const toDate = new Date(filters.enrollmentDateTo);
      if (enrollmentDate > toDate) return false;
    }

    // Fee range filter
    if (filters.feeRangeMin) {
      const minFee = parseFloat(filters.feeRangeMin);
      if (student.monthlyFee < minFee) return false;
    }

    if (filters.feeRangeMax) {
      const maxFee = parseFloat(filters.feeRangeMax);
      if (student.monthlyFee > maxFee) return false;
    }

    // Subject filter
    if (filters.subject) {
      if (!student.subjects.includes(filters.subject)) return false;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Address', 'Date of Birth', 
      'Guardian Name', 'Guardian Phone', 'Enrollment Date', 
      'Status', 'Monthly Fee', 'Subjects'
    ];

    const csvData = filteredStudents.map(student => [
      student.name,
      student.email,
      student.phone,
      student.address,
      student.dateOfBirth,
      student.guardianName,
      student.guardianPhone,
      student.enrollmentDate,
      student.status,
      student.monthlyFee,
      student.subjects.join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_query_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification({
      type: 'success',
      message: `Exported ${filteredStudents.length} student records`
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'graduated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Query System
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Search and filter student data with advanced criteria
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            icon={<Download className="w-4 h-4" />}
            disabled={filteredStudents.length === 0}
          >
            Export ({filteredStudents.length})
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Advanced Filters
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <Select
            label=""
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'graduated', label: 'Graduated' }
            ]}
          />

          <Select
            label=""
            value={filters.subject}
            onChange={(value) => handleFilterChange('subject', value)}
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map(subject => ({ value: subject, label: subject }))
            ]}
          />

          <Input
            label=""
            type="date"
            value={filters.enrollmentDateFrom}
            onChange={(value) => handleFilterChange('enrollmentDateFrom', value)}
            placeholder="Enrollment from"
          />

          <Input
            label=""
            type="date"
            value={filters.enrollmentDateTo}
            onChange={(value) => handleFilterChange('enrollmentDateTo', value)}
            placeholder="Enrollment to"
          />

          <div className="flex space-x-2">
            <Input
              label=""
              type="number"
              value={filters.feeRangeMin}
              onChange={(value) => handleFilterChange('feeRangeMin', value)}
              placeholder="Min fee"
            />
            <Input
              label=""
              type="number"
              value={filters.feeRangeMax}
              onChange={(value) => handleFilterChange('feeRangeMax', value)}
              placeholder="Max fee"
            />
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{filteredStudents.length}</span> of{' '}
            <span className="font-medium text-gray-900 dark:text-white">{students.length}</span> students
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Monthly Revenue: <span className="font-medium text-green-600">
              {formatCurrency(filteredStudents.reduce((sum, s) => sum + s.monthlyFee, 0))}
            </span>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monthly Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subjects
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          DOB: {formatDate(student.dateOfBirth)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center mb-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {student.email || 'No email'}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {student.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(student.enrollmentDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(student.monthlyFee)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.slice(0, 2).map((subject, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                        >
                          {subject}
                        </span>
                      ))}
                      {student.subjects.length > 2 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                          +{student.subjects.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDetails(true);
                      }}
                      icon={<Eye className="w-3 h-3" />}
                    >
                      View
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No students found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </Card>

      {/* Student Details Modal */}
      {showDetails && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Student Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedStudent.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.phone || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Guardian Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Guardian Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.guardianName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Guardian Phone</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedStudent.guardianPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Academic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Enrollment Date</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedStudent.enrollmentDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedStudent.status)}`}>
                        {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Fee</label>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedStudent.monthlyFee)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Subjects</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStudent.subjects.map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentQuery;