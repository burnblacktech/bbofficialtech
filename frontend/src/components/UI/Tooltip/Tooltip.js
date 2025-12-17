// =====================================================
// TOOLTIP COMPONENT
// UI.md-compliant tooltip with basic, rich, and help variants
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

/**
 * Basic Tooltip Component
 * Per UI.md specifications (lines 5952-6009, 7892-7905)
 */
export const Tooltip = ({
  children,
  content,
  side = 'top',
  variant = 'dark',
  delayDuration = 300,
  maxWidth = 280,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualSide, setActualSide] = useState(side);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Auto-flip to stay in viewport
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const checkPosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newSide = side;

      // Check if tooltip goes out of viewport
      if (side === 'top' && triggerRect.top - tooltipRect.height - 8 < 0) {
        newSide = 'bottom';
      } else if (side === 'bottom' && triggerRect.bottom + tooltipRect.height + 8 > viewportHeight) {
        newSide = 'top';
      } else if (side === 'left' && triggerRect.left - tooltipRect.width - 8 < 0) {
        newSide = 'right';
      } else if (side === 'right' && triggerRect.right + tooltipRect.width + 8 > viewportWidth) {
        newSide = 'left';
      }

      setActualSide(newSide);
    };

    checkPosition();
  }, [isVisible, side]);

  const showTooltip = () => {
    if (disabled) return;

    if (delayDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayDuration);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Handle mobile (click) vs desktop (hover)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleMouseEnter = () => {
    if (!isMobile) showTooltip();
  };

  const handleMouseLeave = () => {
    if (!isMobile) hideTooltip();
  };

  const handleClick = () => {
    if (isMobile) {
      setIsVisible(prev => !prev);
    }
  };

  const handleFocus = () => {
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  // Calculate position
  const getPositionStyles = () => {
    if (!triggerRef.current || !tooltipRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (actualSide) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollLeft + 8;
        break;
    }

    return { top, left };
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle click outside (mobile)
  useEffect(() => {
    if (!isVisible || !isMobile) return;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, isMobile]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-block"
        {...props}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'fixed z-50 pointer-events-none',
              'px-3 py-2 rounded-xl text-body-sm',
              'max-w-[280px]',
              {
                'bg-gray-900 text-white': variant === 'dark',
                'bg-white text-slate-700 border border-slate-200 shadow-elevated': variant === 'light',
              },
              className,
            )}
            style={{
              ...getPositionStyles(),
              maxWidth: `${maxWidth}px`,
            }}
            role="tooltip"
          >
            <div className="tooltip-content">{content}</div>
            {/* Arrow */}
            <div
              className={cn('absolute w-2 h-2 rotate-45', {
                'bg-gray-900': variant === 'dark',
                'bg-white border border-slate-200': variant === 'light',
              })}
              style={{
                [actualSide === 'top' ? 'bottom' : actualSide === 'bottom' ? 'top' : 'top']: '-4px',
                [actualSide === 'left' ? 'right' : actualSide === 'right' ? 'left' : 'left']: '50%',
                transform: 'translateX(-50%)',
                ...(actualSide === 'left' || actualSide === 'right'
                  ? {
                      top: '50%',
                      transform: 'translateY(-50%)',
                      [actualSide === 'left' ? 'right' : 'left']: '-4px',
                    }
                  : {}),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Rich Tooltip Component
 * Per UI.md specifications (lines 7906-7926)
 */
export const RichTooltip = ({
  children,
  title,
  description,
  link,
  side = 'top',
  variant = 'light',
  delayDuration = 300,
  className = '',
  ...props
}) => {
  return (
    <Tooltip
      content={
        <div className="space-y-2" style={{ maxWidth: '320px' }}>
          <p
            className={cn('text-label-md font-semibold', {
              'text-white': variant === 'dark',
              'text-gray-800': variant === 'light',
            })}
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            {title}
          </p>
          <div
            className={cn('h-px', {
              'bg-gray-700': variant === 'dark',
              'bg-slate-200': variant === 'light',
            })}
          />
          <p
            className={cn('text-body-sm', {
              'text-slate-300': variant === 'dark',
              'text-slate-600': variant === 'light',
            })}
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            {description}
          </p>
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-body-sm font-medium',
                {
                  'text-gold-400 hover:text-gold-300': variant === 'dark',
                  'text-gold-500 hover:text-gold-600': variant === 'light',
                },
              )}
              style={{ fontSize: '13px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {link.label}
              <span aria-hidden>→</span>
            </a>
          )}
        </div>
      }
      side={side}
      variant={variant}
      delayDuration={delayDuration}
      maxWidth={320}
      className={className}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default Tooltip;

