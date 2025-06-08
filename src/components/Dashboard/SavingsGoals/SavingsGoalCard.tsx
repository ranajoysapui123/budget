import React, { useEffect } from 'react';
import { SavingsGoal } from '../../../types';
import Card from '../../ui/Card';
import { formatCurrency } from '../../../utils/helpers';
import { PiggyBank, Calendar, Target } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onEdit }) => {
  const { user } = useApp();
  const { showNotification } = useNotification();
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    // Show notification when close to goal
    if (progress >= 90 && progress < 100 && !goal.isCompleted) {
      showNotification({
        type: 'info',
        message: `You're almost there! Only ${formatCurrency(remainingAmount, user.settings.currency)} left to reach your ${goal.name} goal.`,
        duration: 5000
      });
    }

    // Show warning when deadline is approaching
    if (daysLeft <= 7 && !goal.isCompleted) {
      showNotification({
        type: progress >= 90 ? 'info' : 'error',
        message: `${daysLeft} days left to reach your ${goal.name} goal. ${
          progress < 90 
            ? `Still needs ${formatCurrency(remainingAmount, user.settings.currency)}.` 
            : 'You\'re almost there!'
        }`,
        duration: 6000
      });
    }
  }, [progress, daysLeft, goal.isCompleted]);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onEdit(goal)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{goal.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{goal.category}</p>
        </div>
        <PiggyBank className={`${progress >= 100 ? 'text-green-500' : 'text-blue-500'}`} size={24} />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{formatCurrency(goal.currentAmount, user.settings.currency)}</span>
            <span>{formatCurrency(goal.targetAmount, user.settings.currency)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            <Target size={16} className="mr-1" />
            <span>
              {formatCurrency(remainingAmount, user.settings.currency)} left
            </span>
          </div>
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {goal.autoAllocatePercentage > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Auto-allocating {goal.autoAllocatePercentage}% of income
          </p>
        )}
      </div>
    </Card>
  );
};

export default SavingsGoalCard;