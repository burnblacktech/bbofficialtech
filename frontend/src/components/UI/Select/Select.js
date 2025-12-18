// =====================================================
// SELECT COMPONENT - ENHANCED
// Custom dropdown matching design system
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  disabled = false,
  placeholder = 'Select an option',
  searchable = false,
  className = '',
  id,
  required = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  const inputId = id || `select-${label?.toLowerCase().replace(/\s/g, '-') || 'select'}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchTerm
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label-lg text-slate-700 mb-1.5"
          style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          id={inputId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full h-12 px-4 pr-10 text-body-lg text-gray-800 rounded-[10px] border transition-all',
            'flex items-center justify-between',
            'focus:outline-none focus:ring-0',
            {
              'border-slate-300 bg-white focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.1)]':
                !error && !disabled,
              'border-2 border-error-500 bg-error-50': error,
              'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed': disabled,
            },
          )}
          style={{ fontSize: '16px', lineHeight: '24px' }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={required}
        >
          <span className={selectedOption ? 'text-gray-800' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-slate-400 transition-transform',
              { 'rotate-180': isOpen },
            )}
          />
        </button>

        {/* Error Icon */}
        {error && (
          <AlertCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-error-500 pointer-events-none" />
        )}

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-[10px] shadow-floating max-h-60 overflow-auto"
            role="listbox"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-10 px-3 text-body-md border border-slate-300 rounded-xl focus:outline-none focus:border-gold-500"
                  style={{ fontSize: '14px', lineHeight: '22px' }}
                  autoFocus
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-body-md text-slate-500 text-center" style={{ fontSize: '14px' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-4 py-3 text-left text-body-md transition-colors',
                    'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                    {
                      'bg-gold-50 text-gold-600': value === option.value,
                      'text-gray-800': value !== option.value,
                    },
                  )}
                  style={{ fontSize: '14px', lineHeight: '22px' }}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-body-sm text-error-600"
          style={{ fontSize: '13px', lineHeight: '20px' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1.5 text-body-sm text-slate-500"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;

