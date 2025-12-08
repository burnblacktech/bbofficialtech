// =====================================================
// BREATHING GRID COMPONENT (POLISHED ANIMATIONS)
// Spring physics, staggered entrance, smooth transitions
// Desktop: Fixed column layout with spring animations
// Mobile/Tablet: Horizontal glance bar with scroll snap
// =====================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Grid configuration - Optimized spacing for reduced whitespace
const GRID_CONFIG = {
  glance: 72,
  summary: 200,
  summaryMin: 180,
  summaryMax: 220,
  expandedMin: 480,
  expandedMax: 720,
  gapDesktop: 16,      // Desktop: 16px gap (reduced from 24px)
  gapTablet: 12,       // Tablet: 12px gap (reduced from 20px)
  gapMobile: 8,        // Mobile: 8px gap (reduced from 16px)
  paddingDesktop: 16,  // Desktop: 16px padding (reduced from 24px)
  paddingTablet: 12,   // Tablet: 12px padding (reduced from 20px)
  paddingMobile: 12,   // Mobile: 12px padding (reduced from 16px)
};

// Spring animation presets
const SPRING = {
  default: { type: 'spring', stiffness: 300, damping: 30 },
  snappy: { type: 'spring', stiffness: 400, damping: 25 },
  gentle: { type: 'spring', stiffness: 200, damping: 30 },
  bouncy: { type: 'spring', stiffness: 500, damping: 20 },
};

// Animation variants for desktop grid cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...SPRING.default,
      delay: i * 0.05,
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }, // ease-smooth
};

// Mobile glance bar item variants
const glanceItemVariants = {
  unselected: { scale: 1, backgroundColor: 'transparent' },
  selected: {
    scale: 1.05,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Updated to Gold-500
    transition: SPRING.snappy,
  },
  tap: { scale: 0.95 },
};

// Panel transition variants
const panelVariants = {
  enter: { opacity: 0, x: 20, scale: 0.98 },
  center: { opacity: 1, x: 0, scale: 1, transition: { ...SPRING.default, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }, // ease-smooth
  exit: { opacity: 0, x: -20, scale: 0.98, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }, // ease-in
};

const BreathingGrid = ({
  children,
  expandedSectionId = null,
  onSectionExpand = () => {},
  className = '',
  'aria-label': ariaLabel = 'ITR Filing Sections',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const gridRef = useRef(null);
  const sectionRefs = useRef([]);
  const glanceBarRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const childrenArray = useMemo(() => React.Children.toArray(children).filter(Boolean), [children]);

  const sectionIds = useMemo(() =>
    childrenArray.map((child) => child?.props?.id || child?.props?.sectionId).filter(Boolean),
    [childrenArray],
  );

  const expandedIndex = useMemo(() => {
    if (!expandedSectionId) return -1;
    return childrenArray.findIndex(
      (c) => (c?.props?.id || c?.props?.sectionId) === expandedSectionId,
    );
  }, [childrenArray, expandedSectionId]);

  const isExpanded = expandedIndex !== -1;

  // Track first render for entrance animation
  useEffect(() => {
    if (!hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasAnimated]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1280);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Scroll glance bar to selected item on mobile
  useEffect(() => {
    if ((isMobile || isTablet) && expandedSectionId && glanceBarRef.current) {
      const selectedIndex = sectionIds.indexOf(expandedSectionId);
      if (selectedIndex !== -1) {
        const container = glanceBarRef.current;
        const items = container.querySelectorAll('[role="tab"]');
        if (items[selectedIndex]) {
          items[selectedIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [expandedSectionId, isMobile, isTablet, sectionIds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isWithinGrid = gridRef.current?.contains(e.target);
      if (!isWithinGrid) return;

      if (e.key === 'Escape' && expandedSectionId) {
        e.preventDefault();
        onSectionExpand(null);
        if (expandedIndex !== -1 && sectionRefs.current[expandedIndex]) {
          setTimeout(() => sectionRefs.current[expandedIndex]?.focus(), 100);
        }
        return;
      }

      if (!isMobile && !isTablet && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = focusedIndex ?? 0;
        const newIndex = e.key === 'ArrowLeft'
          ? (currentIndex > 0 ? currentIndex - 1 : sectionIds.length - 1)
          : (currentIndex < sectionIds.length - 1 ? currentIndex + 1 : 0);
        setFocusedIndex(newIndex);
        sectionRefs.current[newIndex]?.focus();
      }

      if ((e.key === 'Enter' || e.key === ' ') && focusedIndex !== null) {
        e.preventDefault();
        const sectionId = sectionIds[focusedIndex];
        if (sectionId) {
          onSectionExpand(sectionId === expandedSectionId ? null : sectionId);
        }
      }
    };

    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('keydown', handleKeyDown);
      return () => gridElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [expandedSectionId, expandedIndex, focusedIndex, isMobile, isTablet, sectionIds, onSectionExpand]);

  const handleGridClick = useCallback((e) => {
    if (e.target === e.currentTarget && expandedSectionId) {
      onSectionExpand(null);
    }
  }, [expandedSectionId, onSectionExpand]);

  // Determine card configuration
  const getCardConfig = useCallback((index) => {
    if (!isExpanded) {
      return { density: 'summary', gridColumn: 'auto', row: Math.floor(index / 5) + 1 };
    }

    const distance = index - expandedIndex;

    if (index === expandedIndex) {
      return { density: 'detailed', gridColumn: '3', row: 1 };
    }

    if (distance === -2) return { density: 'glance', gridColumn: '1', row: 1 };
    if (distance === -1) return { density: 'glance', gridColumn: '2', row: 1 };
    if (distance === 1) return { density: 'glance', gridColumn: '4', row: 1 };
    if (distance === 2) return { density: 'glance', gridColumn: '5', row: 1 };

    const summaryOrder = index < expandedIndex - 2 ? index : index - 5;
    return { density: 'summary', gridColumn: 'auto', row: 2, order: summaryOrder };
  }, [expandedIndex, isExpanded]);

  // =====================================================
  // MOBILE/TABLET: Horizontal glance bar + expanded panel
  // =====================================================
  if (isMobile || isTablet) {
    return (
      <div
        ref={gridRef}
        className={`breathing-grid-mobile ${className}`}
        role="region"
        aria-label={ariaLabel}
        style={{ paddingBottom: isMobile ? '100px' : '0' }}
      >
        {/* Glance Bar with scroll snap */}
        <motion.div
          className="glance-bar sticky top-[56px] z-30"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : SPRING.snappy}
        >
          <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
            <div
              ref={glanceBarRef}
              className="flex items-center gap-2 h-16 px-4 overflow-x-auto hide-scrollbar"
              role="tablist"
              aria-label="Section navigation"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {childrenArray.map((child, index) => {
                const sectionId = child.props?.id || child.props?.sectionId;
                const isSelected = sectionId === expandedSectionId;
                const title = child.props?.title || `Section ${index + 1}`;
                const Icon = child.props?.icon;
                const status = child.props?.status;

                return (
                  <motion.button
                    key={sectionId || index}
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`panel-${sectionId}`}
                    onClick={() => onSectionExpand(isSelected ? null : sectionId)}
                    className={`
                      relative flex flex-col items-center justify-center flex-shrink-0
                      w-14 h-14 rounded-xl transition-colors
                      ${isSelected ? 'text-primary-600' : 'text-slate-600'}
                    `}
                    style={{ scrollSnapAlign: 'center' }}
                    variants={shouldReduceMotion ? {} : glanceItemVariants}
                    initial="unselected"
                    animate={isSelected ? 'selected' : 'unselected'}
                    whileTap={shouldReduceMotion ? {} : 'tap'}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="glanceIndicator"
                        className="absolute inset-0 bg-primary-50 rounded-xl border-2 border-primary-300"
                        initial={false}
                        transition={SPRING.snappy}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                      {Icon && (
                        <motion.div
                          animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                          transition={SPRING.snappy}
                        >
                          <Icon className="w-5 h-5" />
                        </motion.div>
                      )}
                      <span className="text-[10px] mt-1 font-medium truncate max-w-[48px]">
                        {title.length > 6 ? title.slice(0, 5) + '…' : title}
                      </span>
                    </div>

                    {/* Status dot */}
                    {status && status !== 'pending' && (
                      <motion.div
                        className={`
                          absolute top-1 right-1 w-2 h-2 rounded-full
                          ${status === 'complete' ? 'bg-emerald-500' :
                            status === 'warning' ? 'bg-amber-500' :
                            status === 'error' ? 'bg-red-500' : 'bg-slate-300'}
                        `}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={SPRING.bouncy}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Expanded Content Panel */}
        <AnimatePresence mode="wait">
          {expandedSectionId && (
            <motion.div
              key={expandedSectionId}
              role="tabpanel"
              id={`panel-${expandedSectionId}`}
              variants={shouldReduceMotion ? {} : panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-4"
            >
              {childrenArray.map((child) => {
                const sectionId = child.props?.id || child.props?.sectionId;
                if (sectionId === expandedSectionId) {
                  return React.cloneElement(child, {
                    key: sectionId,
                    density: 'detailed',
                    isExpanded: true,
                    onExpand: () => onSectionExpand(null),
                  });
                }
                return null;
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default Summary Grid */}
        {!expandedSectionId && (
          <div className="grid gap-4 p-4" style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_CONFIG.summaryMin}px, 1fr))`,
          }}>
            {childrenArray.map((child, index) => {
              const sectionId = child.props?.id || child.props?.sectionId;
              return (
                <motion.div
                  key={sectionId || index}
                  custom={index}
                  variants={shouldReduceMotion ? {} : cardVariants}
                  initial={hasAnimated ? false : 'hidden'}
                  animate="visible"
                >
                  {React.cloneElement(child, {
                    density: 'summary',
                    isExpanded: false,
                    onExpand: () => onSectionExpand(sectionId),
                    className: `${child.props?.className || ''} section-card`,
                  })}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // DESKTOP: Fixed 5-column grid with spring animations
  // =====================================================
  const gridTemplate = isExpanded
    ? `${GRID_CONFIG.glance}px ${GRID_CONFIG.glance}px minmax(${GRID_CONFIG.expandedMin}px, ${GRID_CONFIG.expandedMax}px) ${GRID_CONFIG.glance}px ${GRID_CONFIG.glance}px`
    : `repeat(auto-fill, ${GRID_CONFIG.summary}px)`;

  return (
    <motion.div
      ref={gridRef}
      className={`breathing-grid ${className}`}
      onClick={handleGridClick}
      role="region"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        gap: isMobile ? `${GRID_CONFIG.gapMobile}px` : isTablet ? `${GRID_CONFIG.gapTablet}px` : `${GRID_CONFIG.gapDesktop}px`,
        padding: isMobile ? `${GRID_CONFIG.paddingMobile}px` : isTablet ? `${GRID_CONFIG.paddingTablet}px` : `${GRID_CONFIG.paddingDesktop}px`,
        justifyContent: 'center',
        alignContent: 'start',
        maxWidth: '1400px',
        margin: '0 auto',
        transition: shouldReduceMotion ? 'none' : 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // 300ms ease-smooth
      }}
    >
      {childrenArray.map((child, index) => {
        const sectionId = child.props?.id || child.props?.sectionId;
        const cardConfig = getCardConfig(index);
        const title = child.props?.title || `Section ${index + 1}`;

        let gridStyles = {};
        if (isExpanded) {
          if (cardConfig.density === 'detailed') {
            gridStyles = { gridColumn: '3', gridRow: '1' };
          } else if (cardConfig.density === 'glance') {
            gridStyles = { gridColumn: cardConfig.gridColumn, gridRow: '1' };
          } else {
            gridStyles = { gridRow: '2' };
          }
        }

        return (
          <motion.div
            key={sectionId || index}
            layout={!shouldReduceMotion}
            custom={index}
            variants={shouldReduceMotion ? {} : cardVariants}
            initial={hasAnimated ? false : 'hidden'}
            animate="visible"
            exit="exit"
            style={{
              ...gridStyles,
              width: cardConfig.density === 'glance' ? `${GRID_CONFIG.glance}px` :
                     cardConfig.density === 'summary' ? `${GRID_CONFIG.summary}px` : '100%',
              minWidth: cardConfig.density === 'detailed' ? `${GRID_CONFIG.expandedMin}px` : undefined,
              maxWidth: cardConfig.density === 'detailed' ? `${GRID_CONFIG.expandedMax}px` : undefined,
              zIndex: cardConfig.density === 'detailed' ? 10 : 1,
            }}
            ref={(el) => { if (el) sectionRefs.current[index] = el; }}
            whileHover={cardConfig.density !== 'detailed' && !shouldReduceMotion ? {
              y: -4,
              transition: SPRING.snappy,
            } : {}}
          >
            {React.cloneElement(child, {
              key: sectionId || child.key, // Ensure stable key
              id: sectionId || child.props?.id,
              sectionId: sectionId || child.props?.sectionId,
              density: cardConfig.density,
              isExpanded: cardConfig.density === 'detailed',
              onExpand: () => {
                setFocusedIndex(index);
                onSectionExpand(cardConfig.density === 'detailed' ? null : sectionId);
              },
              'aria-label': title,
              tabIndex: cardConfig.density === 'glance' ? -1 : 0,
              role: 'article',
              'aria-expanded': cardConfig.density === 'detailed',
              className: `${child.props?.className || ''} section-card`,
            })}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default BreathingGrid;
