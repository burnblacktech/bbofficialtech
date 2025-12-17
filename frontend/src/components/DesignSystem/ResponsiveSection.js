// =====================================================
// RESPONSIVE SECTION WRAPPER
// Wrapper component for responsive sections with progressive disclosure
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsiveBreakpoint } from '../../utils/responsive';
import { cn } from '../../lib/utils';

const ResponsiveSection = ({
  id,
  title,
  icon: Icon,
  description,
  children,
  defaultExpanded = false,
  className = '',
  showTotal = false,
  totalValue = 0,
  totalLabel = 'Total',
  onToggle,
  isExpanded: controlledExpanded,
}) => {
  const { isMobile, isTablet } = useResponsiveBreakpoint();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = onToggle || setInternalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isExpanded);
    } else {
      setInternalExpanded(!isExpanded);
    }
  };

  // Desktop: Always show content, no collapse
  if (!isMobile && !isTablet) {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {Icon && (
                <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <h3 className="text-heading-4 font-semibold text-slate-900">{title}</h3>
            </div>
            {description && (
              <p className="text-body-regular text-slate-600 ml-10">{description}</p>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    );
  }

  // Mobile/Tablet: Progressive disclosure with [+] / [-] indicators
  return (
    <div className={cn('w-full border border-slate-200 rounded-xl bg-white overflow-hidden', className)}>
      <button
        onClick={handleToggle}
        onKeyDown={(e) => {
          // Support Enter and Space keys for accessibility
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        style={{ minHeight: '44px' }} // Ensure touch target ≥ 44px
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="text-body-regular font-medium text-slate-600">
            {isExpanded ? '[-]' : '[+]'}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon className="w-4 h-4 text-slate-600" />
              )}
              <span className="text-body-regular font-semibold text-slate-900 truncate" title={title}>{title}</span>
              {showTotal && totalValue !== undefined && (
                <span className="text-body-regular font-medium text-slate-600">
                  (₹{totalValue.toLocaleString('en-IN')})
                </span>
              )}
            </div>
            {description && !isExpanded && (
              <p className="text-body-small text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`section-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResponsiveSection;

