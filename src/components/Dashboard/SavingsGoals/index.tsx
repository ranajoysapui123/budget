import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { SavingsGoal } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { Plus } from 'lucide-react';
import SavingsGoalCard from './SavingsGoalCard';
import SavingsGoalModal from './SavingsGoalModal';

const SavingsGoals: React.FC = () => {
  const { user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  const handleAddGoal = () => {
    setEditGoal(null);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Savings Goals</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddGoal}
          icon={<Plus size={16} />}
        >
          Add Goal
        </Button>
      </div>

      {user.savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.savingsGoals.map(goal => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No savings goals yet. Create your first goal to start tracking your progress!
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddGoal}
              icon={<Plus size={16} />}
            >
              Create Your First Goal
            </Button>
          </div>
        </Card>
      )}

      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editGoal={editGoal}
      />
    </div>
  );
};

export default SavingsGoals;