// =====================================================
// FIXED VIEWPORT CONTAINER COMPONENT
// Apple-like fixed viewport with no scrolling until necessary
// Content expands/collapses within fixed frame
// =====================================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * FixedViewportContainer
 * Creates a fixed-height container that prevents page scrolling
 * Content slides/zooms within this fixed frame
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {number} props.headerHeight - Height of header (default: 56)
 * @param {number} props.footerHeight - Height of footer (default: 0)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.allowInternalScroll - Allow scrolling inside container if content exceeds (default: false)
 */
const FixedViewportContainer = ({
  children,
  headerHeight = 56,
  footerHeight = 0,
  className = '',
  allowInternalScroll = false,
  ...props
}) => {
  const containerRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState('calc(100vh - 56px)');

  useEffect(() => {
    const calculateHeight = () => {
      const totalOffset = headerHeight + footerHeight;
      setAvailableHeight(`calc(100vh - ${totalOffset}px)`);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [headerHeight, footerHeight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed-viewport-container',
        'overflow-hidden',
        'flex flex-col',
        className
      )}
      style={{
        height: availableHeight,
        maxHeight: availableHeight,
      }}
      {...props}
    >
      <div
        className={cn(
          'flex-1',
          'relative',
          allowInternalScroll && 'overflow-y-auto overflow-x-hidden'
        )}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * SlideTransition
 * Wrapper for content that should slide in/out
 */
export const SlideTransition = ({
  children,
  direction = 'horizontal', // 'horizontal' | 'vertical' | 'zoom'
  isActive = true,
  className = '',
}) => {
  const variants = {
    horizontal: {
      hidden: { x: '100%', opacity: 0 },
      visible: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
    vertical: {
      hidden: { y: '100%', opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: '-100%', opacity: 0 },
    },
    zoom: {
      hidden: { scale: 0.95, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="slide-content"
          variants={variants[direction]}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
          className={cn('w-full h-full', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FixedViewportContainer;

