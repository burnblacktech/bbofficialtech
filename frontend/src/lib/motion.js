// =====================================================
// MOTION & ANIMATION UTILITIES
// Comprehensive Framer Motion variants and transition presets
// Enhanced with spring physics and micro-interactions
// =====================================================

/**
 * Spring physics presets for natural animations
 */
export const springs = {
  // Quick, responsive spring (buttons, small elements)
  snappy: { type: 'spring', stiffness: 400, damping: 25, mass: 0.5 },
  // Playful, energetic spring (success states, celebrations)
  bouncy: { type: 'spring', stiffness: 500, damping: 15, mass: 0.5 },
  // Smooth, relaxed spring (modals, cards)
  gentle: { type: 'spring', stiffness: 200, damping: 30, mass: 1 },
  // Balanced spring (general purpose)
  smooth: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  // Slow, deliberate spring (page transitions)
  slow: { type: 'spring', stiffness: 150, damping: 25, mass: 1.2 },
  // Wobbly spring (attention-grabbing)
  wobbly: { type: 'spring', stiffness: 350, damping: 10, mass: 0.5 },
};

/**
 * Easing functions matching newUI.md Section 9.2
 * Defined before transitions since transitions depends on it
 */
export const easings = {
  // newUI.md Section 9.2 - Easing Curves
  'ease-smooth': [0.4, 0, 0.2, 1],        // Most UI transitions
  'ease-bounce': [0.34, 1.56, 0.64, 1],   // Success states, celebrations
  'ease-spring': [0.175, 0.885, 0.32, 1.275], // Modals, popups
  // Legacy aliases (backward compatibility)
  'ease-out': [0, 0, 0.2, 1],
  'ease-in': [0.4, 0, 1, 1],
  'ease-both': [0.4, 0, 0.2, 1],
  'ease-out-back': [0.34, 1.56, 0.64, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
};

/**
 * Transition presets matching newUI.md Section 9.1
 */
export const transitions = {
  instant: { duration: 0 },
  // newUI.md Section 9.1 - Animation Durations
  small: { duration: 0.15, ease: easings['ease-smooth'] },      // Button state changes
  fast: { duration: 0.15, ease: easings['ease-smooth'] },
  medium: { duration: 0.25, ease: easings['ease-smooth'] },     // Card expand
  normal: { duration: 0.2, ease: easings['ease-smooth'] },
  cardExpand: { duration: 0.3, ease: easings['ease-smooth'] },  // Card expand/collapse
  relaxed: { duration: 0.3, ease: easings['ease-smooth'] },
  valueUpdate: { duration: 0.4, ease: easings['ease-smooth'] }, // Value update animations
  regimeSwitch: { duration: 0.5, ease: easings['ease-spring'] }, // Regime toggle
  large: { duration: 0.35, ease: easings['ease-smooth'] },      // Page transitions
  slow: { duration: 0.5, ease: easings['ease-smooth'] },
  slower: { duration: 0.7, ease: easings['ease-smooth'] },
  breathing: { duration: 0.4, ease: [0, 0, 0.2, 1] },
};

/**
 * Stagger presets for container animations
 */
export const stagger = {
  // Fast stagger for lists (30ms)
  fast: { staggerChildren: 0.03, delayChildren: 0 },
  // Normal stagger (50ms)
  normal: { staggerChildren: 0.05, delayChildren: 0.05 },
  // Slow stagger for dramatic effect (80ms)
  slow: { staggerChildren: 0.08, delayChildren: 0.1 },
  // Reverse stagger (from bottom)
  reverse: { staggerChildren: 0.03, staggerDirection: -1 },
};

/**
 * Micro-interaction presets
 */
export const microInteractions = {
  // Button hover/press
  button: {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: springs.snappy },
    tap: { scale: 0.98, transition: springs.snappy },
  },

  // Card hover lift
  cardLift: {
    rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    hover: {
      y: -4,
      boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
      transition: springs.gentle,
    },
  },

  // Icon pulse
  iconPulse: {
    rest: { scale: 1 },
    hover: { scale: 1.1, transition: springs.bouncy },
    tap: { scale: 0.9, transition: springs.snappy },
  },

  // Input focus - Updated to use Gold-500 (#D4AF37)
  inputFocus: {
    rest: { borderColor: '#A6A6A6', boxShadow: '0 0 0 0 rgba(212,175,55,0)' },
    focus: {
      borderColor: '#D4AF37', // Gold-500
      boxShadow: '0 0 0 3px rgba(212,175,55,0.2)',
      transition: transitions.fast,
    },
    error: {
      borderColor: '#EF4444',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.2)',
      transition: transitions.fast,
    },
  },

  // Checkbox/toggle - Updated to use Gold-500
  toggle: {
    off: { x: 0, backgroundColor: '#A6A6A6' },
    on: { x: 20, backgroundColor: '#D4AF37', transition: springs.snappy }, // Gold-500
  },

  // Ripple effect (simplified)
  ripple: {
    initial: { scale: 0, opacity: 0.5 },
    animate: { scale: 2.5, opacity: 0, transition: { duration: 0.5 } },
  },
};

/**
 * Framer Motion variants for common animations
 */
export const variants = {
  // Basic fade
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.normal },
    exit: { opacity: 0, transition: transitions.fast },
  },

  // Slide up with fade
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springs.gentle },
    exit: { opacity: 0, y: -10, transition: transitions.fast },
  },

  // Slide down with fade
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: springs.gentle },
    exit: { opacity: 0, y: 10, transition: transitions.fast },
  },

  // Slide from left
  slideLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: springs.gentle },
    exit: { opacity: 0, x: 30, transition: transitions.fast },
  },

  // Slide from right
  slideRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: springs.gentle },
    exit: { opacity: 0, x: -30, transition: transitions.fast },
  },

  // Scale in (pop effect)
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: springs.bouncy },
    exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
  },

  // Scale in from center (for modals)
  popIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: springs.bouncy },
    exit: { opacity: 0, scale: 0.9, transition: transitions.normal },
  },

  // Stagger children container
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        ...stagger.normal,
        when: 'beforeChildren',
      },
    },
    exit: { opacity: 0, transition: { when: 'afterChildren' } },
  },

  // Fast stagger container
  staggerContainerFast: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        ...stagger.fast,
        when: 'beforeChildren',
      },
    },
  },

  // Stagger child item
  staggerItem: {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: springs.gentle },
  },

  // Card stagger item (with lift effect)
  cardStaggerItem: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: springs.smooth },
  },

  // Breathing Grid specific variants - Updated per newUI.md Section 9.3.1
  cardExpand: {
    collapsed: {
      width: 'var(--card-glance-width, 72px)',
      transition: transitions.cardExpand,
    },
    summary: {
      width: 'var(--card-summary-width, 200px)',
      transition: transitions.cardExpand,
    },
    expanded: {
      width: 'var(--card-expanded-width, 720px)',
      transition: transitions.cardExpand,
    },
  },

  // Card expand/collapse with content fade - newUI.md Section 9.3.1
  cardExpandWithContent: {
    collapsed: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: easings['ease-smooth'] },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: easings['ease-smooth'] },
    },
  },

  // Content fade-in with delay - newUI.md Section 9.3.1
  contentFadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1, // 100ms delay per newUI.md
        duration: 0.2,
        ease: easings['ease-out'],
      },
    },
  },

  // Content fade with stagger support
  contentFade: {
    hidden: { opacity: 0, y: 8 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.2,
        ease: easings['ease-out'],
      },
    }),
  },

  // Grid layout transition
  gridLayout: {
    default: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 220px))',
      transition: { duration: 0.4, ease: easings['ease-out'] },
    },
    expanded: {
      gridTemplateColumns: '72px 72px minmax(480px, 720px) 72px 72px',
      transition: { duration: 0.4, ease: easings['ease-out'] },
    },
  },

  // Success feedback (checkmark)
  successCheck: {
    hidden: { scale: 0, rotate: -45 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: springs.bouncy,
    },
  },

  // Error shake
  errorShake: {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  },

  // Pulse attention
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2 },
    },
  },

  // Glow pulse (for status indicators) - Updated to Gold-500
  glowPulse: {
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(212, 175, 55, 0)', // Gold-500
        '0 0 0 8px rgba(212, 175, 55, 0.2)',
        '0 0 0 0 rgba(212, 175, 55, 0)',
      ],
      transition: { repeat: Infinity, duration: 2 },
    },
  },

  // Toast animations
  toast: {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: springs.snappy },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: transitions.fast },
  },

  // Modal animations - Updated to use ease-spring per newUI.md
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: easings['ease-spring'] },
    },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: transitions.fast },
  },

  // Modal backdrop
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.normal },
    exit: { opacity: 0, transition: transitions.fast },
  },

  // Bottom sheet animations
  bottomSheet: {
    hidden: { y: '100%' },
    visible: { y: 0, transition: springs.gentle },
    exit: { y: '100%', transition: transitions.normal },
  },

  // Dropdown menu
  dropdown: {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: springs.snappy },
    exit: { opacity: 0, y: -5, scale: 0.98, transition: transitions.fast },
  },

  // Tooltip
  tooltip: {
    hidden: { opacity: 0, scale: 0.9, y: 4 },
    visible: { opacity: 1, scale: 1, y: 0, transition: springs.snappy },
    exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
  },

  // Value update animation - newUI.md Section 9.3.2
  valueUpdate: {
    initial: { opacity: 1, filter: 'blur(0px)' },
    updating: {
      opacity: 0.7,
      filter: 'blur(2px)',
      transition: { duration: 0.05, ease: easings['ease-smooth'] },
    },
    updated: {
      opacity: 1,
      filter: 'blur(0px)',
      scale: [1, 1.02, 1],
      transition: { duration: 0.4, ease: easings['ease-smooth'] },
    },
  },

  // Regime switch animation - newUI.md Section 9.3.3
  regimeSwitch: {
    initial: { opacity: 1, scale: 1 },
    switching: {
      opacity: 0.5,
      scale: 0.98,
      transition: { duration: 0.15, ease: easings['ease-spring'] },
    },
    switched: {
      opacity: 1,
      scale: [0.98, 1.02, 1],
      transition: { duration: 0.5, ease: easings['ease-spring'] },
    },
  },

  // Success celebration - newUI.md Section 9.3.7
  successCelebration: {
    // Phase 1: Checkmark draw (0-400ms)
    checkmarkDraw: {
      hidden: { pathLength: 0, opacity: 0, scale: 0 },
      visible: {
        pathLength: 1,
        opacity: 1,
        scale: [0, 1.1, 1],
        transition: {
          pathLength: { duration: 0.4, ease: easings['ease-out'] },
          opacity: { duration: 0.2 },
          scale: { duration: 0.4, ease: easings['ease-bounce'] },
        },
      },
    },
    // Phase 2: Confetti burst (400-800ms) - handled by confetti library
    // Phase 3: Content reveal (800-2000ms)
    contentReveal: {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: 0.8,
          duration: 0.3,
          ease: easings['ease-out'],
          staggerChildren: 0.1,
        },
      },
    },
  },

  // Number change highlight (legacy, updated)
  numberChange: {
    increase: {
      color: ['#10B981', '#10B981', 'currentColor'], // Updated to Success-Base
      scale: [1, 1.1, 1],
      transition: { duration: 0.5 },
    },
    decrease: {
      color: ['#EF4444', '#EF4444', 'currentColor'],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5 },
    },
  },

  // Page transitions
  pageEnter: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...springs.gentle,
        when: 'beforeChildren',
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0, transition: transitions.fast },
  },

  // Section reveal (for scroll-triggered animations)
  sectionReveal: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springs.slow,
    },
  },

  // Expand/collapse
  expand: {
    collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
    expanded: { height: 'auto', opacity: 1, transition: springs.gentle },
  },

  // Rotate
  rotate: {
    closed: { rotate: 0, transition: springs.snappy },
    open: { rotate: 180, transition: springs.snappy },
  },

  // Skeleton shimmer (for loading states)
  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: { repeat: Infinity, duration: 1.5, ease: 'linear' },
    },
  },
};

/**
 * Page transition variants for route changes
 */
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transitions.normal },
    exit: { opacity: 0, transition: transitions.fast },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: springs.gentle },
    exit: { opacity: 0, y: -10, transition: transitions.fast },
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: springs.gentle },
    exit: { opacity: 0, x: -30, transition: transitions.fast },
  },
};

/**
 * Apple-like slide and zoom transitions for fixed viewport design
 */
export const slideTransitions = {
  horizontal: {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
  },
  vertical: {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    exit: {
      y: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
  },
  zoom: {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
  },
  zoomFocus: {
    hidden: { scale: 0.9, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 250,
        damping: 25,
        mass: 1,
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  },
};

/**
 * Get animation variant with custom delay
 */
export function getVariantWithDelay(variantName, delay = 0) {
  const variant = variants[variantName];
  if (!variant) return variant;

  if (typeof variant.visible === 'function') {
    return {
      ...variant,
      visible: (i) => ({
        ...variant.visible(i),
        transition: {
          ...variant.visible(i).transition,
          delay: delay + (i || 0) * 0.03,
        },
      }),
    };
  }

  return {
    ...variant,
    visible: {
      ...variant.visible,
      transition: {
        ...variant.visible.transition,
        delay,
      },
    },
  };
}

/**
 * Create stagger container with custom settings
 */
export function createStaggerContainer(options = {}) {
  const {
    staggerChildren = 0.05,
    delayChildren = 0,
    direction = 1,
  } = options;

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
        staggerDirection: direction,
        when: 'beforeChildren',
      },
    },
  };
}

/**
 * Respect reduced motion preference
 */
export function withReducedMotion(variant) {
  if (typeof window === 'undefined') return variant;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  return variant;
}

/**
 * Hook-like function to check reduced motion preference
 */
export function shouldReduceMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create hover animation props
 */
export function createHoverProps(type = 'lift') {
  const presets = {
    lift: {
      whileHover: { y: -4, transition: springs.snappy },
      whileTap: { scale: 0.98 },
    },
    scale: {
      whileHover: { scale: 1.02, transition: springs.snappy },
      whileTap: { scale: 0.98 },
    },
    glow: {
      whileHover: { boxShadow: '0 0 20px rgba(255,195,0,0.3)', transition: springs.snappy },
      whileTap: { scale: 0.98 },
    },
    subtle: {
      whileHover: { y: -2, transition: springs.snappy },
      whileTap: { y: 0 },
    },
  };

  return presets[type] || presets.lift;
}

export default {
  springs,
  transitions,
  easings,
  stagger,
  microInteractions,
  variants,
  pageTransitions,
  getVariantWithDelay,
  createStaggerContainer,
  withReducedMotion,
  shouldReduceMotion,
  createHoverProps,
};
