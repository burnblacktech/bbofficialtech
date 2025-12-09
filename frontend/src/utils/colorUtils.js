// =====================================================
// COLOR UTILITY FUNCTIONS
// Helper functions for consistent color usage across components
// Maps semantic meanings to design tokens
// =====================================================

/**
 * Get primary action color classes
 * Use for buttons, CTAs, links
 */
export const getPrimaryColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-gold-500',
      hover: 'hover:bg-gold-600',
      active: 'active:bg-gold-700',
      text: 'text-white',
      border: 'border-gold-500',
    },
    outline: {
      bg: 'bg-transparent',
      hover: 'hover:bg-gold-50',
      active: 'active:bg-gold-100',
      text: 'text-gold-600',
      border: 'border-gold-500',
    },
    ghost: {
      bg: 'bg-transparent',
      hover: 'hover:bg-gold-50',
      active: 'active:bg-gold-100',
      text: 'text-gold-600',
      border: 'border-transparent',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Get success color classes
 * Use for success states, positive values, savings
 */
export const getSuccessColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-success-500',
      hover: 'hover:bg-success-600',
      text: 'text-white',
      border: 'border-success-500',
      bgLight: 'bg-success-50',
      textDark: 'text-success-600',
    },
    light: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      border: 'border-success-100',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Get error color classes
 * Use for errors, critical states, tax due
 */
export const getErrorColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-error-500',
      hover: 'hover:bg-error-600',
      text: 'text-white',
      border: 'border-error-500',
      bgLight: 'bg-error-50',
      textDark: 'text-error-600',
    },
    light: {
      bg: 'bg-error-50',
      text: 'text-error-600',
      border: 'border-error-100',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Get warning color classes
 * Use for warnings, discrepancies, attention needed
 */
export const getWarningColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-warning-500',
      hover: 'hover:bg-warning-600',
      text: 'text-white',
      border: 'border-warning-500',
      bgLight: 'bg-warning-50',
      textDark: 'text-warning-600',
    },
    light: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      border: 'border-warning-100',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Get info color classes
 * Use for info states, auto-filled, system generated
 */
export const getInfoColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-info-500',
      hover: 'hover:bg-info-600',
      text: 'text-white',
      border: 'border-info-500',
      bgLight: 'bg-info-50',
      textDark: 'text-info-600',
    },
    light: {
      bg: 'bg-info-50',
      text: 'text-info-600',
      border: 'border-info-100',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Get gold color classes (for positive values, savings)
 */
export const getGoldColorClasses = (variant = 'default') => {
  const variants = {
    default: {
      bg: 'bg-gold-500',
      hover: 'hover:bg-gold-600',
      text: 'text-black-950',
      border: 'border-gold-500',
      bgLight: 'bg-gold-50',
      textDark: 'text-gold-600',
    },
    light: {
      bg: 'bg-gold-50',
      text: 'text-gold-600',
      border: 'border-gold-100',
    },
  };
  return variants[variant] || variants.default;
};

/**
 * Map old color names to new design tokens
 * Helps with migration
 */
export const colorMap = {
  // Blue → Gold (primary actions)
  'bg-blue-600': 'bg-gold-500',
  'bg-blue-500': 'bg-gold-500',
  'bg-blue-700': 'bg-gold-600',
  'text-blue-600': 'text-gold-600',
  'text-blue-500': 'text-gold-500',
  'border-blue-600': 'border-gold-500',
  'bg-blue-100': 'bg-gold-50',
  'text-blue-800': 'text-gold-700',

  // Green → Success or Gold (context-dependent)
  'bg-green-600': 'bg-success-500', // Use success for success states
  'bg-green-500': 'bg-success-500',
  'bg-green-700': 'bg-success-600',
  'text-green-600': 'text-success-600',
  'text-green-500': 'text-success-500',
  'border-green-600': 'border-success-500',
  'bg-green-100': 'bg-success-50',
  'text-green-800': 'text-success-600',

  // Purple → Info or Gold (context-dependent)
  'bg-purple-600': 'bg-info-500', // Use info for informational features
  'bg-purple-500': 'bg-info-500',
  'bg-purple-700': 'bg-info-600',
  'text-purple-600': 'text-info-600',
  'text-purple-500': 'text-info-500',
  'border-purple-600': 'border-info-500',
  'bg-purple-100': 'bg-info-50',
  'text-purple-800': 'text-info-600',

  // Yellow → Warning or Gold (context-dependent)
  'bg-yellow-500': 'bg-warning-500', // Use warning for warnings
  'bg-yellow-600': 'bg-warning-600',
  'text-yellow-600': 'text-warning-600',
  'text-yellow-500': 'text-warning-500',
  'border-yellow-500': 'border-warning-500',
  'bg-yellow-100': 'bg-warning-50',
  'text-yellow-800': 'text-warning-600',

  // Red → Error
  'bg-red-600': 'bg-error-500',
  'bg-red-500': 'bg-error-500',
  'bg-red-700': 'bg-error-600',
  'text-red-600': 'text-error-600',
  'text-red-500': 'text-error-500',
  'border-red-600': 'border-error-500',
  'bg-red-100': 'bg-error-50',
  'text-red-800': 'text-error-600',
};

/**
 * Get activity icon colors based on activity type
 */
export const getActivityIconColors = (type) => {
  const colorMap = {
    filing_created: { bg: 'bg-success-50', icon: 'text-success-500' },
    filing_submitted: { bg: 'bg-success-50', icon: 'text-success-500' },
    document_uploaded: { bg: 'bg-info-50', icon: 'text-info-500' },
    member_added: { bg: 'bg-gold-50', icon: 'text-gold-500' },
    default: { bg: 'bg-gray-100', icon: 'text-gray-600' },
  };
  return colorMap[type] || colorMap.default;
};

export default {
  getPrimaryColorClasses,
  getSuccessColorClasses,
  getErrorColorClasses,
  getWarningColorClasses,
  getInfoColorClasses,
  getGoldColorClasses,
  colorMap,
  getActivityIconColors,
};

