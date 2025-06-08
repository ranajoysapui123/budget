import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  padding = 'md',
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 ${paddingClasses[padding]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;