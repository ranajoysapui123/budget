import React, { useState, useEffect } from 'react';
import { SavingsGoal, CategoryDefinition } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import { generateId } from '../../../utils/helpers';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import { X } from 'lucide-react';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGoal: SavingsGoal | null;
}

const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({ isOpen, onClose, editGoal }) => {
  const { user, updateUser } = useApp();
  
  const initialValues = {
    name: '',
    targetAmount: '',
    deadline: new Date().toISOString().slice(0, 10),
    category: '',
    autoAllocatePercentage: '0'
  };

  const [name, setName] = useState(initialValues.name);
  const [targetAmount, setTargetAmount] = useState(initialValues.targetAmount);
  const [deadline, setDeadline] = useState(initialValues.deadline);
  const [category, setCategory] = useState(initialValues.category);
  const [autoAllocatePercentage, setAutoAllocatePercentage] = useState(initialValues.autoAllocatePercentage);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (editGoal && typeof editGoal === 'object') {
      // Handle each field with proper null checking and type conversion
      setName(editGoal.name ?? '');
      
      // Handle numeric values
      if (typeof editGoal.targetAmount === 'number' && !isNaN(editGoal.targetAmount)) {
        setTargetAmount(editGoal.targetAmount.toString());
      }
      
      // Handle date
      if (editGoal.deadline) {
        try {
          const date = new Date(editGoal.deadline);
          if (!isNaN(date.getTime())) {
            setDeadline(date.toISOString().slice(0, 10));
          }
        } catch {
          setDeadline(new Date().toISOString().slice(0, 10));
        }
      }
      
      setCategory(editGoal.category ?? '');
      
      // Handle auto allocate percentage
      if (typeof editGoal.autoAllocatePercentage === 'number' && !isNaN(editGoal.autoAllocatePercentage)) {
        setAutoAllocatePercentage(editGoal.autoAllocatePercentage.toString());
      }
    } else {
      resetForm();
    }
  }, [editGoal, isOpen]);

  const resetForm = () => {
    setName(initialValues.name);
    setTargetAmount(initialValues.targetAmount);
    setDeadline(initialValues.deadline);
    setCategory(initialValues.category);
    setAutoAllocatePercentage(initialValues.autoAllocatePercentage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const goal: SavingsGoal = {
      id: editGoal?.id || generateId(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: editGoal?.currentAmount || 0,
      deadline: new Date(deadline).toISOString(),
      category,
      autoAllocatePercentage: parseFloat(autoAllocatePercentage),
      isCompleted: false
    };

    const updatedGoals = editGoal
      ? user.savingsGoals.map(g => g.id === editGoal.id ? goal : g)
      : [...user.savingsGoals, goal];

    updateUser({
      ...user,
      savingsGoals: updatedGoals
    });

    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            value={name}
            onChange={setName}
            placeholder="Enter goal name"
            required
          />

          <Input
            label="Target Amount"
            type="number"
            value={targetAmount}
            onChange={setTargetAmount}
            placeholder="Enter target amount"
            min={0.01}
            step={0.01}
            required
          />

          <Input
            label="Target Date"
            type="date"
            value={deadline}
            onChange={setDeadline}
            min={new Date().toISOString().slice(0, 10)}
            required
          />          <div className="grid grid-cols-1 gap-4">
            <Select
              label="Main Category"
              value={category}
              onChange={(value) => {
                setCategory(value);
                // If there's a subcategory, select the first one
                const firstSubCat = user.categories.find(c => c.parentId === value);
                if (firstSubCat) {
                  setCategory(firstSubCat.id);
                }
              }}
              options={[
                ...user.categories
                  .filter(c => !c.parentId && !c.isArchived)
                  .map(c => ({
                    value: c.id,
                    label: c.name
                  }))
              ]}
              required
            />
            
            {category && (
              <Select
                label="Subcategory"
                value={category}
                onChange={setCategory}
                options={[
                  ...user.categories
                    .filter(c => c.parentId && !c.isArchived)
                    .map(c => ({
                      value: c.id,
                      label: c.name
                    }))
                ]}
              />
            )}
          </div>

          <Input
            label="Auto-allocate Income Percentage"
            type="number"
            value={autoAllocatePercentage}
            onChange={setAutoAllocatePercentage}
            placeholder="Enter percentage to auto-allocate"
            min={0}
            max={100}
            step={1}
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editGoal ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavingsGoalModal;