// =====================================================
// ERROR MESSAGE COMPONENT
// Standardized error message display with icon and consistent styling
// =====================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * ErrorMessage - Standardized error message component
 * @param {Object} props
 * @param {string} props.message - Error message text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.inline - Whether to display inline (default: false, displays below)
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export const ErrorMessage = ({
  message,
  className = '',
  inline = false,
  size = 'md',
  id,
  ...props
}) => {
  if (!message) return null;

  const sizeClasses = {
    sm: 'text-body-small',
    md: 'text-body-regular',
    lg: 'text-body-large',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const containerClasses = cn(
    'flex items-start gap-2',
    inline ? 'inline-flex' : 'flex',
    className,
  );

  return (
    <div
      id={id}
      className={containerClasses}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <AlertCircle
        className={cn(
          iconSizes[size],
          'text-error-500 flex-shrink-0 mt-0.5',
        )}
        aria-hidden="true"
      />
      <p className={cn(sizeClasses[size], 'text-error-600')}>
        {message}
      </p>
    </div>
  );
};

/**
 * ErrorMessageInline - Inline error message for form fields
 */
export const ErrorMessageInline = ({ message, className = '', id, ...props }) => {
  return (
    <ErrorMessage
      message={message}
      inline={true}
      size="sm"
      className={cn('mt-1', className)}
      id={id}
      {...props}
    />
  );
};

/**
 * ErrorMessageBlock - Block-level error message
 */
export const ErrorMessageBlock = ({ message, className = '', id, ...props }) => {
  return (
    <div
      className={cn(
        'bg-error-50 border border-error-200 rounded-xl p-4',
        className,
      )}
      role="alert"
      aria-live="polite"
      id={id}
      {...props}
    >
      <ErrorMessage message={message} size="md" />
    </div>
  );
};

export default ErrorMessage;

