// =====================================================
// TOOLTIP COMPONENT - CANONICAL DESIGN SYSTEM
// Unified tooltip component with consistent styling and behavior
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
// import { enterpriseLogger } from '../../utils/logger';

const Tooltip = ({
  children,
  content,
  position = 'top',
  trigger = 'hover',
  delay = 0,
  disabled = false,
  className = '',
  maxWidth = 300,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (position) {
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
      default:
        top = triggerRect.top + scrollTop - tooltipRect.height - 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8;
    if (top < 0) top = 8;
    if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height - 8;

    setTooltipPosition({ top, left });
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setTimeout(calculatePosition, 0);
      }, delay);
    } else {
      setIsVisible(true);
      setTimeout(calculatePosition, 0);
    }
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Handle trigger events
  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'hover-focus') {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' || trigger === 'hover-focus') {
      hideTooltip();
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus' || trigger === 'hover-focus') {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus' || trigger === 'hover-focus') {
      hideTooltip();
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (trigger === 'click' && isVisible &&
          triggerRef.current && !triggerRef.current.contains(event.target) &&
          tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, trigger]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Base classes
  const baseClasses = 'tooltip';
  const positionClass = `tooltip-${position}`;
  const triggerClass = `tooltip-${trigger}`;
  const visibilityClass = isVisible ? 'tooltip-visible' : 'tooltip-hidden';

  const tooltipClasses = [
    baseClasses,
    positionClass,
    triggerClass,
    visibilityClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={tooltipClasses}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth: `${maxWidth}px`,
          }}
          role="tooltip"
        >
          <div className="tooltip-content">
            {content}
          </div>
          <div className={`tooltip-arrow tooltip-arrow-${position}`} />
        </div>
      )}
    </>
  );
};

// Tooltip variants
export const TopTooltip = (props) => <Tooltip position="top" {...props} />;
export const BottomTooltip = (props) => <Tooltip position="bottom" {...props} />;
export const LeftTooltip = (props) => <Tooltip position="left" {...props} />;
export const RightTooltip = (props) => <Tooltip position="right" {...props} />;

// Tooltip triggers
export const HoverTooltip = (props) => <Tooltip trigger="hover" {...props} />;
export const FocusTooltip = (props) => <Tooltip trigger="focus" {...props} />;
export const ClickTooltip = (props) => <Tooltip trigger="click" {...props} />;
export const HoverFocusTooltip = (props) => <Tooltip trigger="hover-focus" {...props} />;

// Delayed tooltip
export const DelayedTooltip = ({ delay = 500, ...props }) => (
  <Tooltip delay={delay} {...props} />
);

// Info tooltip with info icon
export const InfoTooltip = ({ content, ...props }) => (
  <Tooltip content={content} {...props}>
    <span className="info-icon">ℹ️</span>
  </Tooltip>
);

// Help tooltip with help icon
export const HelpTooltip = ({ content, ...props }) => (
  <Tooltip content={content} {...props}>
    <span className="help-icon">❓</span>
  </Tooltip>
);

// Warning tooltip with warning icon
export const WarningTooltip = ({ content, ...props }) => (
  <Tooltip content={content} {...props}>
    <span className="warning-icon">⚠️</span>
  </Tooltip>
);

// Error tooltip with error icon
export const ErrorTooltip = ({ content, ...props }) => (
  <Tooltip content={content} {...props}>
    <span className="error-icon">❌</span>
  </Tooltip>
);

// Success tooltip with success icon
export const SuccessTooltip = ({ content, ...props }) => (
  <Tooltip content={content} {...props}>
    <span className="success-icon">✅</span>
  </Tooltip>
);

export default Tooltip;
