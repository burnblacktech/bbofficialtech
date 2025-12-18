// =====================================================
// ENHANCED EMPTY STATE COMPONENT
// Reusable empty state with icons, messages, and actions
// Supports both new API and legacy API for backward compatibility
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Inbox,
  Search,
  AlertCircle,
  Loader,
  Plus,
  RefreshCw,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import Button from './components/Button';
import { cn } from '../../utils';

const VARIANT_CONFIG = {
  'no-data': {
    icon: Inbox,
    title: 'No Data Available',
    description: 'There is no data to display at this time.',
    colors: {
      icon: 'text-slate-400',
      title: 'text-slate-600',
      description: 'text-slate-500',
    },
  },
  error: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    description: 'We encountered an error while loading the data.',
    colors: {
      icon: 'text-red-400',
      title: 'text-error-600',
      description: 'text-error-500',
    },
  },
  loading: {
    icon: Loader,
    title: 'Loading...',
    description: 'Please wait while we fetch the data.',
    colors: {
      icon: 'text-blue-400',
      title: 'text-blue-600',
      description: 'text-blue-500',
    },
  },
  'not-found': {
    icon: Search,
    title: 'Not Found',
    description: 'The item you are looking for does not exist.',
    colors: {
      icon: 'text-slate-400',
      title: 'text-slate-600',
      description: 'text-slate-500',
    },
  },
};

const EmptyState = ({
  // New API props
  variant = 'no-data',
  title,
  description,
  icon: CustomIcon,
  illustration,
  action,
  actionLabel = 'Get Started',
  secondaryAction,
  secondaryActionLabel,
  className = '',
  // Legacy API props (for backward compatibility)
  size = 'md',
  ...props
}) => {
  // Detect if using legacy API (has size prop and no variant)
  const isLegacyAPI = size !== undefined && variant === 'no-data' && !CustomIcon && !illustration;

  if (isLegacyAPI && CustomIcon === undefined && illustration === undefined) {
    // Legacy API handling - use icon prop if provided, otherwise use FileText
    const Icon = CustomIcon || FileText;
    const iconSize = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };

    const padding = {
      sm: 'py-8 px-4',
      md: 'py-12 px-6',
      lg: 'py-16 px-8',
    };

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center',
          padding[size],
          className,
        )}
        role="status"
        aria-live="polite"
        {...props}
      >
        {Icon && (
          <div className={cn('mb-4', size === 'lg' && 'mb-5')}>
            <Icon className={cn('text-slate-300', iconSize[size])} aria-hidden="true" />
          </div>
        )}

        {title && (
          <h3
            className={cn(
              'text-heading-md font-semibold text-gray-800 mb-2',
              size === 'sm' && 'text-heading-sm',
              size === 'lg' && 'text-heading-lg',
            )}
            style={{
              fontSize: size === 'sm' ? '16px' : size === 'lg' ? '20px' : '18px',
              fontWeight: 600,
              lineHeight: size === 'sm' ? '24px' : size === 'lg' ? '28px' : '26px',
            }}
          >
            {title}
          </h3>
        )}

        {description && (
          <p
            className={cn(
              'text-body-md text-slate-500 max-w-sm mb-6',
              size === 'sm' && 'text-body-sm',
            )}
            style={{
              fontSize: size === 'sm' ? '13px' : '14px',
              lineHeight: size === 'sm' ? '20px' : '22px',
            }}
          >
            {description}
          </p>
        )}

        {(action || actionLabel || secondaryAction || secondaryActionLabel) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {action || (actionLabel && (
              <Button variant="primary" onClick={action}>
                {actionLabel}
              </Button>
            ))}
            {secondaryAction || (secondaryActionLabel && (
              <Button variant="secondary" onClick={secondaryAction}>
                {secondaryActionLabel}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // New API handling
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG['no-data'];
  const Icon = CustomIcon || config.icon;
  const colors = config.colors;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <motion.div
          className={`mb-4 ${colors.icon}`}
          animate={variant === 'loading' ? { rotate: 360 } : {}}
          transition={
            variant === 'loading'
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : {}
          }
        >
          <Icon className="w-16 h-16" />
        </motion.div>
      )}

      {/* Title */}
      <h3 className={`text-lg font-semibold mb-2 ${colors.title}`}>
        {displayTitle}
      </h3>

      {/* Description */}
      <p className={`text-sm max-w-md mb-6 ${colors.description}`}>
        {displayDescription}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <motion.button
              onClick={action}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              onClick={secondaryAction}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-4 h-4" />
              {secondaryActionLabel}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Pre-built empty states (for backward compatibility)
export const NoDataEmptyState = ({ itemType = 'items', onAdd }) => {
  return (
    <EmptyState
      icon={FileText}
      title={`No ${itemType} added`}
      description={`Add your ${itemType} to get started with tax calculation`}
      action={onAdd}
      actionLabel={`+ Add ${itemType}`}
    />
  );
};

export const UploadEmptyState = ({ documentType = 'document', onUpload, onManualEntry }) => {
  return (
    <EmptyState
      icon={Upload}
      title={`Upload ${documentType} to get started`}
      description={`We'll auto-fill your details from the ${documentType}`}
      action={onUpload}
      actionLabel={`Upload ${documentType}`}
      secondaryAction={onManualEntry}
      secondaryActionLabel="or enter details manually"
    />
  );
};

export const ErrorEmptyState = ({ onRetry }) => {
  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="We couldn't load your data. Please try again."
      action={onRetry}
      actionLabel="Try Again"
    />
  );
};

export const NoResultsEmptyState = ({ searchTerm, onClear }) => {
  return (
    <EmptyState
      variant="not-found"
      title="No results found"
      description={`No matches for "${searchTerm}". Try a different search term.`}
      action={onClear}
      actionLabel="Clear Search"
    />
  );
};

export default EmptyState;
