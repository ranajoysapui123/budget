import React from 'react';
import Card from '../../ui/Card';
import { useApp } from '../../../contexts/AppContext';
import BudgetVsActual from './BudgetVsActual';
import SpendingForecast from './SpendingForecast';
import SavingsProjection from './SavingsProjection';

const BudgetaryTools: React.FC = () => {
  const { user } = useApp();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Budgetary Tools</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BudgetVsActual />
        <SpendingForecast />
        <SavingsProjection />
      </div>
    </div>
  );
};

export default BudgetaryTools;
