import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpCircle
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalSubjects: number;
  monthlyRevenue: number;
  pendingFees: number;
  collectionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'payment' | 'new_student' | 'aggregation';
  message: string;
  timestamp: string;
  amount?: number;
}

interface AggregationHistory {
  id: string;
  month: string;
  year: number;
  totalAmount: number;
  paymentCount: number;
  transactionId: string;
  aggregatedAt: string;
}

const StudentDashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalSubjects: 0,
    monthlyRevenue: 0,
    pendingFees: 0,
    collectionRate: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [aggregationHistory, setAggregationHistory] = useState<AggregationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchAggregationHistory();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const studentsResponse = await fetch('/api/students/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Fetch subjects
      const subjectsResponse = await fetch('/api/students/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Fetch current month fee summary
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      
      const feeSummaryResponse = await fetch(
        `/api/students/fees/summary?month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (studentsResponse.ok && subjectsResponse.ok && feeSummaryResponse.ok) {
        const students = await studentsResponse.json();
        const subjects = await subjectsResponse.json();
        const feeSummary = await feeSummaryResponse.json();
        
        const activeStudents = students.filter((s: any) => s.status === 'active').length;
        const collectionRate = feeSummary.totalExpected > 0 
          ? (feeSummary.totalCollected / feeSummary.totalExpected) * 100 
          : 0;

        setStats({
          totalStudents: students.length,
          activeStudents,
          totalSubjects: subjects.length,
          monthlyRevenue: feeSummary.totalCollected,
          pendingFees: feeSummary.totalPending,
          collectionRate
        });

        // Generate recent activity (mock data for now)
        setRecentActivity([
          {
            id: '1',
            type: 'payment',
            message: 'Fee payment received from John Doe',
            timestamp: new Date().toISOString(),
            amount: 3000
          },
          {
            id: '2',
            type: 'new_student',
            message: 'New student enrolled: Jane Smith',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'enrollment',
            message: 'Mike Johnson enrolled in Physics',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAggregationHistory = async () => {
    try {
      const response = await fetch('/api/students/fees/aggregation-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setAggregationHistory(history);
      }
    } catch (error) {
      console.error('Error fetching aggregation history:', error);
    }
  };

  const generateMonthlyFees = async () => {
    try {
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      
      const response = await fetch('/api/students/fees/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ month, year })
      });

      if (response.ok) {
        const result = await response.json();
        showNotification({
          type: 'success',
          message: result.message
        });
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to generate fees');
      }
    } catch (error) {
      console.error('Error generating fees:', error);
      showNotification({
        type: 'error',
        message: 'Failed to generate monthly fees'
      });
    }
  };

  const aggregateCurrentMonthFees = async () => {
    try {
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      
      const response = await fetch('/api/students/fees/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ month, year })
      });

      if (response.ok) {
        const result = await response.json();
        showNotification({
          type: 'success',
          message: result.message
        });
        fetchDashboardData();
        fetchAggregationHistory();
      } else {
        throw new Error('Failed to aggregate fees');
      }
    } catch (error) {
      console.error('Error aggregating fees:', error);
      showNotification({
        type: 'error',
        message: 'Failed to aggregate monthly fees'
      });
    }
  };

  const autoAggregateLastMonth = async () => {
    try {
      const response = await fetch('/api/students/fees/auto-aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        showNotification({
          type: 'success',
          message: result.message
        });
        fetchDashboardData();
        fetchAggregationHistory();
      } else {
        throw new Error('Failed to auto-aggregate fees');
      }
    } catch (error) {
      console.error('Error in auto-aggregation:', error);
      showNotification({
        type: 'error',
        message: 'Failed to auto-aggregate fees'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'new_student':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'enrollment':
        return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'aggregation':
        return <ArrowUpCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your tuition center
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={generateMonthlyFees}
            icon={<Calendar className="w-4 h-4" />}
          >
            Generate Monthly Fees
          </Button>
          <Button
            variant="primary"
            onClick={aggregateCurrentMonthFees}
            icon={<ArrowUpCircle className="w-4 h-4" />}
          >
            Aggregate to Main DB
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalStudents}
                </p>
                <p className="text-sm text-green-600">
                  {stats.activeStudents} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subjects Offered
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSubjects}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                <p className="text-sm text-green-600">
                  {stats.collectionRate.toFixed(1)}% collected
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Fees
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.pendingFees)}
                </p>
                <p className="text-sm text-red-600">
                  Requires follow-up
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity and Aggregation History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(activity.amount)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fee Aggregation History
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={autoAggregateLastMonth}
                icon={<ArrowUpCircle className="w-4 h-4" />}
              >
                Auto-Aggregate Last Month
              </Button>
            </div>
            <div className="space-y-3">
              {aggregationHistory.length > 0 ? (
                aggregationHistory.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.month}/{record.year}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {record.paymentCount} payments
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(record.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.aggregatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <ArrowUpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No aggregations yet</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              icon={<Users className="w-4 h-4" />}
            >
              View All Students
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<DollarSign className="w-4 h-4" />}
            >
              Fee Collection Report
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<BookOpen className="w-4 h-4" />}
            >
              Manage Subjects
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              icon={<TrendingUp className="w-4 h-4" />}
            >
              Analytics & Reports
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;