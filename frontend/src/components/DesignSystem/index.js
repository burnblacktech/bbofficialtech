// =====================================================
// MAIN DESIGN SYSTEM EXPORT
// Clean exports for the modular design system
// =====================================================

// Design tokens
export { DESIGN_TOKENS, COLORS, TYPOGRAPHY, SPACING, ANIMATIONS } from './tokens';

// Base components
export {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  Badge
} from './components';

// Behavioral psychology components
export {
  SecurityBadge,
  TrustIndicator,
  ProgressStepper,
  DeadlineCountdown,
  RefundEstimator,
  SocialProof,
  MicroCelebration,
  SuccessCelebration,
  EmotionalStateIndicator
} from './behavioral';

// Legacy exports for backward compatibility
import DESIGN_TOKENS from './tokens';
import Components from './components';
import BehavioralComponents from './behavioral';

export default {
  DESIGN_TOKENS,
  ...Components,
  ...BehavioralComponents
};