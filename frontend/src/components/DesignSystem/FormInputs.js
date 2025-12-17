// =====================================================
// FORM INPUT COMPONENTS (POLISHED)
// Beautifully styled form inputs with animations
// Features: floating labels, focus glow, error states
// =====================================================

import { useState, useRef, forwardRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Eye, EyeOff, ChevronDown, X, Search, IndianRupee } from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs, variants } from '../../lib/motion';

// =====================================================
// TEXT INPUT
// =====================================================
export const TextInput = forwardRef(({
  label,
  error,
  success,
  hint,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  floatingLabel = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const inputId = useId();

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  // Input States - newUI.md Section 9.3.5
  const borderColor = error
    ? 'border-error-base focus:border-error-base' // Error: Border Error-Base
    : success
    ? 'border-neutral-300' // Filled: Border Gray-300
    : 'border-neutral-300 focus:border-gold-500 focus:border-2'; // Empty/Focus: Border Gray-300, Focus: Border Gold-500 (2px)

  // Focus shadow - newUI.md Section 9.3.5
  const focusShadow = error
    ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' // Error shadow
    : 'focus:shadow-[0_0_0_3px_rgba(212,175,55,0.2)]'; // Focus: shadow with Gold-500

  return (
    <div className={cn('relative', className)}>
      {/* Standard Label */}
      {label && !floatingLabel && (
        <label
          htmlFor={inputId}
          className="block text-body-regular font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={cn(
              'w-4 h-4 transition-colors',
              isFocused ? 'text-gold-500' : 'text-neutral-500', // Focus: Gold-500
            )} />
          </div>
        )}

        {/* Input Field - newUI.md Section 9.3.5 */}
        <motion.input
          ref={ref}
          id={inputId}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-white border transition-all duration-150',
            'text-neutral-900 placeholder:text-neutral-500',
            'focus:outline-none',
            borderColor,
            focusShadow,
            Icon && 'pl-10',
            RightIcon && 'pr-10',
            disabled && 'bg-neutral-100 text-neutral-500 cursor-not-allowed',
            floatingLabel && (isFocused || hasValue) && 'pt-3.5 pb-1.5', // Extra top padding when label floats
            inputClassName,
          )}
          animate={error ? {
            // Shake animation on submit - newUI.md Section 9.3.5 (100ms, 3 iterations)
            x: [0, -8, 8, -8, 8, 0],
            transition: {
              duration: 0.1,
              repeat: 2,
              ease: 'easeInOut',
            },
          } : {}}
          {...props}
        />

        {/* Floating Label - newUI.md Section 9.3.5 */}
        {floatingLabel && label && (
          <motion.label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 pointer-events-none',
              'text-neutral-500 bg-white px-1 z-10',
              (isFocused || hasValue) && 'text-body-small text-gold-700',
            )}
            initial={false}
            animate={isFocused || hasValue ? {
              y: -24,
              scale: 0.85,
              transition: {
                duration: 0.15,
                ease: [0, 0, 0.2, 1], // ease-out - newUI.md Section 9.3.5
              },
            } : {
              y: 0,
              scale: 1,
              transition: {
                duration: 0.15,
                ease: [0, 0, 0.2, 1],
              },
            }}
          >
            {label}
            {required && <span className="text-error-base ml-0.5">*</span>}
          </motion.label>
        )}

        {/* Right Icon / Status */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Filled: Checkmark fades in when valid - newUI.md Section 9.3.5 */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <Check className="w-4 h-4 text-success-base" />
            </motion.div>
          )}
          {/* Error icon - newUI.md Section 9.3.5 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <AlertCircle className="w-4 h-4 text-error-base" />
            </motion.div>
          )}
          {RightIcon && !success && !error && (
            <RightIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Error / Hint Message */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1.5 text-body-small text-error-base flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1.5 text-body-small text-slate-500"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

TextInput.displayName = 'TextInput';

// =====================================================
// CURRENCY INPUT
// =====================================================
export const CurrencyInput = forwardRef(({
  label,
  error,
  success,
  hint,
  max,
  min = 0,
  className = '',
  showLimit = false,
  onChange,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatForDisplay(value));
  const inputId = useId();

  // Format number with Indian comma system
  function formatForDisplay(val) {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
  }

  // Parse formatted string to number
  function parseValue(val) {
    if (val === '' || val === null || val === undefined) return '';
    return parseFloat(String(val).replace(/,/g, '')) || 0;
  }

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setDisplayValue(rawValue);
    onChange?.(parseFloat(rawValue) || 0);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    const numValue = parseValue(e.target.value);
    setDisplayValue(formatForDisplay(numValue));
    props.onBlur?.(e);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Show raw number when editing
    const numValue = parseValue(displayValue);
    if (numValue) setDisplayValue(String(numValue));
    props.onFocus?.(e);
  };

  // Sync with controlled value
  if (value !== undefined && !isFocused) {
    const formatted = formatForDisplay(value);
    if (formatted !== displayValue) {
      setDisplayValue(formatted);
    }
  }

  const isOverLimit = max && parseValue(displayValue) > max;
  const isUnderLimit = min && parseValue(displayValue) < min;

  const borderColor = error || isOverLimit
    ? 'border-red-400 focus:border-error-500'
    : success
    ? 'border-emerald-400 focus:border-emerald-500'
    : 'border-slate-200 focus:border-primary-500';

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body-regular font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Rupee prefix */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 flex items-center justify-center w-10',
          'bg-slate-100 rounded-l-xl border-2 border-r-0 transition-colors',
          isFocused ? 'border-primary-500 bg-primary-50' : 'border-slate-200',
        )}>
          <IndianRupee className={cn(
            'w-4 h-4 transition-colors',
            isFocused ? 'text-primary-600' : 'text-slate-500',
          )} />
        </div>

        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border-2 transition-all duration-200',
            'text-slate-900 placeholder:text-slate-400 text-right tabular-nums font-medium',
            'focus:outline-none focus:ring-4 focus:ring-primary-500/20',
            borderColor,
          )}
          {...props}
        />

        {/* Status indicator */}
        {(success || isOverLimit) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {success && !isOverLimit && <Check className="w-4 h-4 text-emerald-500" />}
            {isOverLimit && <AlertCircle className="w-4 h-4 text-error-500" />}
          </motion.div>
        )}
      </div>

      {/* Limit indicator */}
      {showLimit && max && (
        <div className="mt-1.5 flex justify-between items-center text-body-small">
          <span className="text-slate-500">
            {hint || 'Maximum limit'}
          </span>
          <span className={cn(
            'font-medium tabular-nums',
            isOverLimit ? 'text-error-500' : 'text-slate-600',
          )}>
            ₹{parseValue(displayValue).toLocaleString('en-IN')} / ₹{max.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {(error || isOverLimit) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1.5 text-body-small text-error-500"
          >
            {error || `Exceeds maximum limit of ₹${max?.toLocaleString('en-IN')}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

// =====================================================
// SELECT INPUT
// =====================================================
export const SelectInput = forwardRef(({
  label,
  options = [],
  error,
  hint,
  placeholder = 'Select...',
  searchable = false,
  className = '',
  value,
  onChange,
  disabled = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const handleSelect = (opt) => {
    onChange?.(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  // Close on click outside
  const handleClickOutside = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  // Add/remove click listener
  if (typeof window !== 'undefined') {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body-regular font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      <button
        ref={ref}
        id={inputId}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl bg-white border-2 transition-all duration-200',
          'text-left flex items-center justify-between',
          'focus:outline-none focus:ring-4 focus:ring-primary-500/20',
          error
            ? 'border-red-400 focus:border-error-500'
            : 'border-slate-200 focus:border-primary-500',
          disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
        )}
        {...props}
      >
        <span className={cn(
          selectedOption ? 'text-slate-900' : 'text-slate-400',
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.snappy}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springs.snappy}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl border-2 border-slate-200 shadow-elevation-3 overflow-hidden"
          >
            {/* Search */}
            {searchable && (
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 text-body-regular rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-body-regular text-slate-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors',
                      'hover:bg-primary-50',
                      opt.value === value && 'bg-primary-50 text-primary-700 font-medium',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {opt.value === value && (
                        <Check className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-body-small text-slate-500 mt-0.5">{opt.description}</p>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / Hint */}
      {(error || hint) && (
        <p className={cn(
          'mt-1.5 text-xs',
          error ? 'text-error-500' : 'text-slate-500',
        )}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

SelectInput.displayName = 'SelectInput';

// =====================================================
// FORM SECTION (Collapsible)
// =====================================================
export const FormSection = ({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
  status, // 'complete' | 'warning' | 'error' | 'pending'
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const statusColors = {
    complete: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    error: 'bg-error-50 border-red-200 text-error-700',
    pending: 'bg-slate-50 border-slate-200 text-slate-600',
  };

  const statusIcons = {
    complete: <Check className="w-3.5 h-3.5" />,
    warning: <AlertCircle className="w-3.5 h-3.5" />,
    error: <X className="w-3.5 h-3.5" />,
    pending: null,
  };

  return (
    <div className={cn(
      'rounded-xl border-2 border-slate-200 overflow-hidden bg-white',
      className,
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <div className="text-left">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            {description && (
              <p className="text-body-small text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border',
              statusColors[status],
            )}>
              {statusIcons[status]}
              {status === 'complete' && 'Done'}
              {status === 'warning' && 'Review'}
              {status === 'error' && 'Error'}
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={springs.snappy}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.gentle}
          >
            <div className="p-4 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================
// PASSWORD INPUT
// =====================================================
export const PasswordInput = forwardRef(({
  label,
  error,
  hint,
  showStrength = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextInput
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={error}
      hint={hint}
      className={className}
      rightIcon={() => (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// =====================================================
// TEXTAREA
// =====================================================
export const TextArea = forwardRef(({
  label,
  error,
  hint,
  rows = 4,
  maxLength,
  showCount = false,
  className = '',
  ...props
}, ref) => {
  const [value, setValue] = useState(props.value || props.defaultValue || '');
  const inputId = useId();

  const handleChange = (e) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body-regular font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        maxLength={maxLength}
        onChange={handleChange}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-white border-2 transition-all duration-200 resize-none',
          'text-slate-900 placeholder:text-slate-400',
          'focus:outline-none focus:ring-4 focus:ring-primary-500/20',
          error
            ? 'border-red-400 focus:border-error-500'
            : 'border-slate-200 focus:border-primary-500',
        )}
        {...props}
      />

      <div className="mt-1.5 flex justify-between items-center text-body-small">
        <span className={error ? 'text-error-500' : 'text-slate-500'}>
          {error || hint}
        </span>
        {showCount && maxLength && (
          <span className={cn(
            'tabular-nums',
            value.length > maxLength * 0.9 ? 'text-amber-500' : 'text-slate-400',
          )}>
            {value.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

// =====================================================
// CHECKBOX
// =====================================================
export const Checkbox = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const inputId = useId();

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex items-start gap-3 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <div className="relative mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          className={cn(
            'w-5 h-5 rounded-xl border-2 transition-colors',
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'bg-white border-slate-300 group-hover:border-primary-400',
          )}
          whileTap={!disabled ? { scale: 0.9 } : {}}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={springs.bouncy}
                className="flex items-center justify-center h-full"
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div>
        <span className="text-body-regular font-medium text-slate-900">{label}</span>
        {description && (
          <p className="text-body-small text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
};

// =====================================================
// RADIO GROUP
// =====================================================
export const RadioGroup = ({
  label,
  options = [],
  value,
  onChange,
  name,
  className = '',
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-body-regular font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative mt-0.5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="sr-only"
            />
            <div className={cn(
              'w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center',
              value === option.value
                ? 'border-primary-500'
                : 'border-slate-300 group-hover:border-primary-400',
            )}>
              <AnimatePresence>
                {value === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springs.bouncy}
                    className="w-2.5 h-2.5 rounded-full bg-primary-500"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          <div>
            <span className="text-body-regular font-medium text-slate-900">{option.label}</span>
            {option.description && (
              <p className="text-body-small text-slate-500 mt-0.5">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default {
  TextInput,
  CurrencyInput,
  SelectInput,
  FormSection,
  PasswordInput,
  TextArea,
  Checkbox,
  RadioGroup,
};

