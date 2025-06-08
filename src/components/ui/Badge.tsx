import React from 'react';
import { TransactionType } from '../../types';

interface BadgeProps {
  type: TransactionType;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ type, className = '' }) => {
  let baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  
  const typeClasses = {
    income: 'bg-teal-100 text-teal-800',
    expense: 'bg-amber-100 text-amber-800',
    investment: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <span className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

export default Badge;