// Text Input Component
import React from 'react';

const TextInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  className = '',
  required = false,
}) => {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-body-regular font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-xl shadow-elevation-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-blue-500 ${error ? 'border-error-300' : 'border-slate-300'} ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-body-regular text-error-600">{error}</p>
      )}
    </div>
  );
};

export default TextInput;
