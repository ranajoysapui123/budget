import React from 'react';

interface InputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number;
  className?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  min,
  max,
  step,
  className = '',
  error
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;