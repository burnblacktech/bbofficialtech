// =====================================================
// DESIGN TOKENS - BARREL EXPORTS
// =====================================================

import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';
import { SPACING } from './spacing';
import { ANIMATIONS } from './animations';

export const DESIGN_TOKENS = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  shadows: ANIMATIONS.shadows,
  borderRadius: ANIMATIONS.borderRadius,
  transitions: ANIMATIONS.transitions,
  easings: ANIMATIONS.easings
};

export { COLORS, TYPOGRAPHY, SPACING, ANIMATIONS };

export default DESIGN_TOKENS;