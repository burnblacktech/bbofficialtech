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

// Legacy exports for backward compatibility
import DESIGN_TOKENS from './tokens';
import Components from './components';

export default {
  DESIGN_TOKENS,
  ...Components
};