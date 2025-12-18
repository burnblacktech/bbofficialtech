// =====================================================
// SECTION CARD COMPONENT (POLISHED UI)
// Three density states: Glance, Summary, Detailed
// Enhanced with gradients, shadows, and micro-interactions
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, ChevronRight, X } from 'lucide-react';
import { cn } from '../../utils';

// Card dimensions (fixed to match grid columns)
const CARD_SIZES = {
  glance: { width: 72, height: 72 },
  summary: { width: 200, minHeight: 140 },
  detailed: { minWidth: 480, maxWidth: 720 },
};

// Status color configurations - Updated to newUI.md Gold palette
const STATUS_CONFIG = {
  complete: {
    bg: 'bg-success-light', // #ECFDF5
    border: 'border-success-base',
    text: 'text-success-base', // #10B981
    icon: CheckCircle,
    glow: 'shadow-success-500/20',
  },
  warning: {
    bg: 'bg-warning-light', // #FFF8E7 (Gold-100)
    border: 'border-warning-base',
    text: 'text-gold-500', // #D4AF37 - Uses Gold per newUI.md Section 5.2
    icon: AlertTriangle,
    glow: 'shadow-gold-accent',
    pulse: true,
  },
  error: {
    bg: 'bg-error-light', // #FEF2F2
    border: 'border-error-base',
    text: 'text-error-base', // #EF4444
    icon: AlertCircle,
    glow: 'shadow-error-500/20',
    pulse: true,
  },
  pending: {
    bg: 'bg-neutral-100',
    border: 'border-neutral-300',
    text: 'text-neutral-500', // #737373
    icon: Info,
    glow: '',
  },
};

// Animation variants - Updated to use newUI.md easing curves
const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // ease-smooth - newUI.md Section 9.2
    },
  }),
};

const glanceVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 17 } },
  tap: { scale: 0.95 },
};

const summaryVariants = {
  // Idle: Shadow Level 1 - newUI.md Section 8.0
  idle: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
  // Hover: Shadow Level 2 - newUI.md Section 8.0
  hover: {
    y: -2,
    boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // ease-smooth
    },
  },
  tap: { scale: 0.98 },
};

const SectionCard = ({
  title,
  icon: Icon,
  description,
  density = 'summary',
  onExpand,
  children,
  status = 'pending',
  statusCount = 0,
  primaryValue,
  secondaryValue,
  className = '',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onExpand?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onExpand?.();
    }
  };

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIconComponent = statusConfig.icon;

  // Status indicator component
  const StatusIndicator = ({ size = 'sm' }) => {
    const sizeClasses = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

    if ((status === 'error' || status === 'warning') && statusCount > 0) {
      return (
        <motion.div
          className={cn(
            'rounded-full flex items-center justify-center text-xs font-bold',
            size === 'lg' ? 'w-7 h-7' : 'w-5 h-5',
            status === 'error' ? 'bg-error-base text-white' : 'bg-gold-500 text-white', // Updated to Gold
          )}
          animate={statusConfig.pulse ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {statusCount}
        </motion.div>
      );
    }

    return (
      <motion.div
        className={cn(
          'rounded-full flex items-center justify-center',
          size === 'lg' ? 'w-7 h-7' : 'w-5 h-5',
          statusConfig.bg,
        )}
        animate={statusConfig.pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <StatusIconComponent className={cn(sizeClasses, statusConfig.text)} />
      </motion.div>
    );
  };

  // Safe currency formatter
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return value;
  };

  // =====================================================
  // GLANCE STATE: Compact icon + status (72x72)
  // =====================================================
  if (density === 'glance') {
    return (
      <motion.div
        className={cn(
          'section-card section-card-glance cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2',
          className,
        )}
        data-density="glance"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`${title} section`}
        variants={glanceVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        style={{
          width: CARD_SIZES.glance.width,
          height: CARD_SIZES.glance.height,
        }}
        {...props}
      >
        <div className={cn(
          'w-full h-full flex flex-col items-center justify-center rounded-xl relative overflow-hidden',
          'bg-gradient-to-br from-white via-white to-neutral-100',
          'border border-neutral-300 hover:border-gold-300', // Updated to Gold-300 and neutral colors
          'shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200', // Updated to new elevation levels
        )}>
          {/* Background glow effect on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-gold-100/50 to-transparent"
              />
            )}
          </AnimatePresence>

          {/* Icon */}
          {Icon && (
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                    isHovered ? 'text-gold-700' : 'text-neutral-500',
                )}
              />
            </motion.div>
          )}

          {/* Status badge */}
          <div className="absolute bottom-1 right-1">
            <StatusIndicator size="sm" />
          </div>
        </div>
      </motion.div>
    );
  }

  // =====================================================
  // SUMMARY STATE: Card with title + primary value (200px)
  // =====================================================
  if (density === 'summary') {
    return (
      <motion.div
        className={cn(
          'section-card section-card-summary cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2',
          className,
        )}
        data-density="summary"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`${title}${primaryValue ? `: ${formatCurrency(primaryValue)}` : ''}`}
        variants={summaryVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        style={{
          width: CARD_SIZES.summary.width,
          minHeight: CARD_SIZES.summary.minHeight,
        }}
        {...props}
      >
        <div className={cn(
          'w-full h-full rounded-xl relative overflow-hidden',
          'bg-gradient-to-br from-white via-white to-neutral-100/50',
          'border border-neutral-300 hover:border-gold-300', // Updated to Gold-300
          'transition-colors duration-300',
          'p-3 flex flex-col',
        )}>
          {/* Subtle gradient overlay on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-gold-100/30 via-transparent to-transparent pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-start justify-between mb-1 relative">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {Icon && (
                <motion.div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br from-neutral-100 to-neutral-50',
                    'transition-colors duration-200',
                    isHovered && 'from-gold-100 to-gold-100',
                  )}
                  animate={{ scale: isHovered ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-colors duration-200',
                    isHovered ? 'text-gold-700' : 'text-neutral-600',
                  )} />
                </motion.div>
              )}
              <h3 className="text-sm font-semibold text-neutral-900 leading-tight truncate">{title}</h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <StatusIndicator size="sm" />
            </div>
          </div>

          {/* Primary Value - Enhanced for Income Card (Apple-like prominence) */}
          <div className="flex-1 flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              {primaryValue !== undefined && primaryValue !== null && (
                <motion.div
                  key={primaryValue}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} // 400ms value update animation
                  className={cn(
                    'tabular-nums font-bold text-neutral-900',
                    // Apple-like: Larger font for income section (28-32px equivalent)
                    props.sectionId === 'income' ? 'text-[28px] leading-tight' : 'text-2xl',
                  )}
                >
                  {formatCurrency(primaryValue)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Secondary Value or Description */}
            {secondaryValue && (
              <p className="text-body-small text-neutral-500 mt-0.5">{secondaryValue}</p>
            )}
            {!primaryValue && description && (
              <p className="text-body-small text-neutral-500 line-clamp-2">{description}</p>
            )}
            {/* Meta Text (from summary) */}
            {props.metaText && (
              <p className="text-body-small text-neutral-400 mt-0.5">{props.metaText}</p>
            )}
          </div>

          {/* Expand hint */}
          <motion.div
            className="flex items-center justify-end mt-1 text-body-small text-neutral-400"
            animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.6 }}
            transition={{ duration: 0.2 }}
          >
            <span className="mr-1">Details</span>
            <ChevronRight className="w-3 h-3" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // =====================================================
  // DETAILED STATE: Expanded with full content (480-720px)
  // =====================================================
  return (
    <motion.div
      className={cn(
        'section-card section-card-detailed',
        'focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2',
        className,
      )}
      data-density="detailed"
      role="article"
      aria-expanded={true}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} // 300ms card expand/collapse
      style={{
        width: '100%',
        minWidth: CARD_SIZES.detailed.minWidth,
        maxWidth: CARD_SIZES.detailed.maxWidth,
      }}
      {...props}
    >
      <div className={cn(
        'rounded-2xl overflow-hidden',
        'bg-white',
        'border-2 border-gold-300', // Updated to Gold
        'shadow-elevation-2', // Updated to new elevation level
      )}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-gold-100 via-white to-gold-100/30 border-b border-gold-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {Icon && (
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-gold-accent"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              )}
              <div>
                <motion.h2
                  className="text-heading-3 font-bold text-neutral-900"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {title}
                </motion.h2>
                {description && (
                  <motion.p
                    className="text-body-regular text-neutral-500 mt-0.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Primary value in header */}
              {primaryValue !== undefined && primaryValue !== null && (
                <motion.div
                  className="text-right"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-body-small font-medium text-neutral-400 uppercase tracking-wide">Total</p>
                  <p className="text-heading-2 font-bold text-neutral-900 tabular-nums">
                    {formatCurrency(primaryValue)}
                  </p>
                </motion.div>
              )}

              {/* Status and Close */}
              <div className="flex items-center gap-2">
                <StatusIndicator size="lg" />
                {onExpand && (
                  <motion.button
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      'bg-neutral-100 hover:bg-neutral-200',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2',
                    )}
                    aria-label="Collapse section"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={props.sectionId || props.id || 'content'}
            className="section-card-content px-4 py-3"
            style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              minHeight: '200px',
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
            }}
          >
            {React.Children.map(children, (child, index) => {
              if (!child) {
                // Show empty state instead of blank
                return (
                  <motion.div
                    key={`empty-${props.sectionId || props.id || index}`}
                    className="flex items-center justify-center py-8 text-neutral-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-body-regular">No content available</p>
                  </motion.div>
                );
              }
              // Use stable key based on section ID and child props
              const childKey = child.props?.id || child.props?.sectionId || props.sectionId || props.id || `child-${index}`;
              return (
                <motion.div
                  key={childKey}
                  variants={contentVariants}
                  custom={index}
                >
                  {child}
                </motion.div>
              );
            })}
            {React.Children.count(children) === 0 && (
              <motion.div
                className="flex items-center justify-center py-8 text-neutral-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-body-regular">No content available</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SectionCard;
