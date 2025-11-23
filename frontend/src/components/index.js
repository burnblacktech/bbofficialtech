// =====================================================
// COMPONENTS BARREL EXPORTS
// Clean exports for all component modules
// =====================================================

// Design System Components
export { default as DesignSystem } from './DesignSystem';
export {
  DESIGN_TOKENS,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  ANIMATIONS,
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  Badge,
  SecurityBadge,
  TrustIndicator,
  ProgressStepper,
  DeadlineCountdown,
  RefundEstimator,
  SocialProof,
  MicroCelebration,
  SuccessCelebration,
  EmotionalStateIndicator
} from './DesignSystem';

// Layout Components
export { default as Layout } from './Layout';

// Common Components
export { default as ErrorBoundary } from './ErrorBoundary';

// Form Components
export { default as BreakdownInput } from './BreakdownInput';

// Re-export DesignSystem as default for backward compatibility
import DesignSystem from './DesignSystem';
export default DesignSystem;