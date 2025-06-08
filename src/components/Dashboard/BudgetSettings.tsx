import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Settings } from 'lucide-react';

const BudgetSettings: React.FC = () => {
  const { currentMonthBudget, updateBudget } = useApp();
  
  const [incomeGoal, setIncomeGoal] = useState(currentMonthBudget?.incomeGoal.toString() || '0');
  const [expenseLimit, setExpenseLimit] = useState(currentMonthBudget?.expenseLimit.toString() || '0');
  const [investmentGoal, setInvestmentGoal] = useState(currentMonthBudget?.investmentGoal.toString() || '0');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMonthBudget) return;
    
    updateBudget({
      ...currentMonthBudget,
      incomeGoal: parseFloat(incomeGoal) || 0,
      expenseLimit: parseFloat(expenseLimit) || 0,
      investmentGoal: parseFloat(investmentGoal) || 0
    });
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <Settings size={18} className="mr-2" />
        Monthly Budget Goals
      </h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Income Goal"
          type="number"
          value={incomeGoal}
          onChange={setIncomeGoal}
          min={0}
          step={100}
          placeholder="Enter your monthly income goal"
        />
        
        <Input
          label="Expense Limit"
          type="number"
          value={expenseLimit}
          onChange={setExpenseLimit}
          min={0}
          step={100}
          placeholder="Enter your monthly expense limit"
        />
        
        <Input
          label="Investment Goal"
          type="number"
          value={investmentGoal}
          onChange={setInvestmentGoal}
          min={0}
          step={100}
          placeholder="Enter your monthly investment goal"
        />
        
        <div className="md:col-span-3">
          <Button 
            type="submit" 
            variant="primary"
            size="md"
            className="w-full md:w-auto"
          >
            Update Budget Goals
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BudgetSettings;