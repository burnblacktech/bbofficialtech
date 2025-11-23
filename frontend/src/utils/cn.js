// =====================================================
// CLASSNAME UTILITY (CN)
// Utility function for conditional class names
// Similar to clsx or classnames library
// =====================================================

export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input.trim());
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

export default cn;