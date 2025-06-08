import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  year: number;
  totalAmount: number;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
}

interface Student {
  id: string;
  name: string;
  monthlyFee: number;
}

const FeeManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid' | 'overdue'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'upi'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchFeeRecords();
  }, [selectedMonth, selectedYear]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.filter((s: any) => s.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFeeRecords = async () => {
    try {
      setLoading(true);
      // For now, we'll generate mock data since we need to implement the backend endpoint
      // In a real implementation, this would fetch from /api/students/fees
      
      const mockFeeRecords: FeeRecord[] = students.map(student => ({
        id: `fee-${student.id}-${selectedMonth}-${selectedYear}`,
        studentId: student.id,
        studentName: student.name,
        month: selectedMonth,
        year: selectedYear,
        totalAmount: student.monthlyFee,
        paidAmount: Math.random() > 0.3 ? student.monthlyFee : Math.random() * student.monthlyFee,
        paymentDate: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        paymentMethod: ['cash', 'card', 'bank_transfer', 'upi'][Math.floor(Math.random() * 4)] as any,
        status: (() => {
          const rand = Math.random();
          if (rand > 0.7) return 'paid';
          if (rand > 0.5) return 'partial';
          if (rand > 0.3) return 'pending';
          return 'overdue';
        })() as any,
        notes: Math.random() > 0.7 ? 'Payment received in installments' : undefined
      }));

      setFeeRecords(mockFeeRecords);
    } catch (error) {
      console.error('Error fetching fee records:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load fee records'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !paymentAmount) {
      showNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const response = await fetch('/api/students/fees/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          month: selectedMonth,
          year: selectedYear,
          paidAmount: parseFloat(paymentAmount),
          paymentMethod,
          notes: paymentNotes
        })
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: 'Payment recorded successfully'
        });
        setShowPaymentForm(false);
        resetPaymentForm();
        fetchFeeRecords();
      } else {
        throw new Error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showNotification({
        type: 'error',
        message: 'Failed to record payment'
      });
    }
  };

  const resetPaymentForm = () => {
    setSelectedStudent('');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  const filteredRecords = feeRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const totalExpected = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0);
  const totalCollected = filteredRecords.reduce((sum, record) => sum + record.paidAmount, 0);
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fee Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage student fee payments
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowPaymentForm(true)}
          icon={<DollarSign className="w-4 h-4" />}
        >
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expected Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalExpected)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Collected Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              collectionRate >= 80 ? 'bg-green-100 text-green-600' : 
              collectionRate >= 60 ? 'bg-yellow-100 text-yellow-600' : 
              'bg-red-100 text-red-600'
            }`}>
              {collectionRate >= 80 ? '✓' : collectionRate >= 60 ? '!' : '⚠'}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="flex gap-2">
            {['all', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Fee Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.studentName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(record.paidAmount)} / {formatCurrency(record.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.paidAmount < record.totalAmount && (
                        <span className="text-red-600">
                          Pending: {formatCurrency(record.totalAmount - record.paidAmount)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className={`ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.paymentDate ? formatDate(record.paymentDate) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.paymentMethod ? record.paymentMethod.replace('_', ' ').toUpperCase() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {record.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(record.studentId);
                          setPaymentAmount((record.totalAmount - record.paidAmount).toString());
                          setShowPaymentForm(true);
                        }}
                      >
                        Record Payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Record Fee Payment
            </h3>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <Select
                label="Student"
                value={selectedStudent}
                onChange={setSelectedStudent}
                options={students.map(student => ({
                  value: student.id,
                  label: `${student.name} - ${formatCurrency(student.monthlyFee)}/month`
                }))}
                required
              />
              
              <Input
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={setPaymentAmount}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />
              
              <Select
                label="Payment Method"
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as any)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'upi', label: 'UPI' }
                ]}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Add any notes about this payment..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPaymentForm(false);
                    resetPaymentForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Record Payment
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;