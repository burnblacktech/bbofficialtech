// =====================================================
// BURNBLACK UNIFIED DESIGN SYSTEM (UDS) - LEGACY COMPATIBILITY
// Behavioral Psychology-Driven Component Library
// Implements LYRA method principles for trust-first, minimalistic design
//
// This file provides backward compatibility while the components have been
// modularized for better maintainability and performance
// =====================================================

// Re-export everything from the new modular system
export {
  // Design tokens
  DESIGN_TOKENS,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  ANIMATIONS,

  // Base components
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  Badge,

  // Behavioral psychology components
  SecurityBadge,
  TrustIndicator,
  ProgressStepper,
  DeadlineCountdown,
  RefundEstimator,
  SocialProof,
  MicroCelebration,
  SuccessCelebration,
  EmotionalStateIndicator
} from './index';

// Default export for backward compatibility
import DesignSystem from './index';
export default DesignSystem;