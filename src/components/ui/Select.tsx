import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  indent?: number;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  error,
  renderOption
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-white transition-colors`}
        required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={option.indent ? { paddingLeft: `${option.indent * 1.5}rem` } : undefined}
          >
            {renderOption ? renderOption(option) : option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;