import React from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthSelector: React.FC = () => {
  const { filter, setFilter } = useApp();
  
  const currentMonth = filter.month || '';
  
  const decrementMonth = () => {
    if (!currentMonth) return;
    
    const [year, month] = currentMonth.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    setFilter({
      ...filter,
      month: `${newYear}-${String(newMonth).padStart(2, '0')}`
    });
  };
  
  const incrementMonth = () => {
    if (!currentMonth) return;
    
    const [year, month] = currentMonth.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    setFilter({
      ...filter,
      month: `${newYear}-${String(newMonth).padStart(2, '0')}`
    });
  };
  
  const formatMonthDisplay = (monthStr: string) => {
    if (!monthStr) return '';
    
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
        Financial Dashboard
      </h2>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={decrementMonth}
          icon={<ChevronLeft size={16} />}
        />
        
        <span className="text-sm font-medium px-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 min-w-[150px] text-center">
          {formatMonthDisplay(currentMonth)}
        </span>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={incrementMonth}
          icon={<ChevronRight size={16} />}
        />
      </div>
    </div>
  );
};

export default MonthSelector;