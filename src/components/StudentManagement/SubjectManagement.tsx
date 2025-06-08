import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface Subject {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  duration: string;
}

interface SubjectFormData {
  name: string;
  description: string;
  baseFee: string;
  duration: string;
}

const SubjectManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    baseFee: '',
    duration: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        throw new Error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load subjects'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.baseFee) {
        showNotification({
          type: 'error',
          message: 'Name and base fee are required'
        });
        return;
      }

      const payload = {
        ...formData,
        baseFee: parseFloat(formData.baseFee)
      };

      const url = editingSubject 
        ? `/api/students/subject/${editingSubject.id}`
        : '/api/students/subject';

      const response = await fetch(url, {
        method: editingSubject ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: `Subject ${editingSubject ? 'updated' : 'created'} successfully`
        });
        resetForm();
        fetchSubjects();
      } else {
        throw new Error('Failed to save subject');
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      showNotification({
        type: 'error',
        message: 'Failed to save subject'
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/subject/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification({
          type: 'success',
          message: 'Subject deleted successfully'
        });
        fetchSubjects();
      } else {
        throw new Error('Failed to delete subject');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      showNotification({
        type: 'error',
        message: 'Failed to delete subject'
      });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      baseFee: subject.baseFee.toString(),
      duration: subject.duration || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      baseFee: '',
      duration: ''
    });
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subject Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage subjects and their fees
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Subject
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              label="Subject Name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              required
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            />
            
            <Input
              label="Base Fee"
              type="number"
              value={formData.baseFee}
              onChange={(value) => setFormData(prev => ({ ...prev, baseFee: value }))}
              min="0"
              required
            />
            
            <Input
              label="Duration (e.g., 1 hour, 90 minutes)"
              value={formData.duration}
              onChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
            />
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingSubject ? 'Update' : 'Add'} Subject
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {subject.name}
              </h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(subject)}
                  icon={<Edit className="w-3 h-3" />}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(subject.id, subject.name)}
                  icon={<Trash2 className="w-3 h-3" />}
                />
              </div>
            </div>
            
            {subject.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {subject.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {subject.duration || 'Duration not specified'}
              </div>
              <div className="flex items-center font-medium text-blue-600 dark:text-blue-400">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatCurrency(subject.baseFee)}/month
              </div>
            </div>
          </Card>
        ))}
      </div>

      {subjects.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Plus className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No subjects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start by adding your first subject
          </p>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add First Subject
          </Button>
        </Card>
      )}
    </div>
  );
};

export default SubjectManagement;
