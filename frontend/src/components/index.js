// =====================================================
// COMPONENTS BARREL EXPORTS
// Clean exports for all component modules
// =====================================================

// =====================================================
// NEW DESIGN SYSTEM (Atomic Design)
// Preferred - use these for new code
// =====================================================

// Atoms
export { default as AtomButton } from './atoms/Button';
export { default as AtomInput } from './atoms/Input';
export { default as AtomCard } from './atoms/Card';
export { default as AtomIcon } from './atoms/Icon';
export { default as AtomBadge } from './atoms/Badge';

// Molecules
export { default as FormField } from './molecules/FormField';
export { default as OTPInput } from './molecules/OTPInput';
export { default as UploadZone } from './molecules/UploadZone';

// Organisms
export { default as FilingEntrySelector } from './organisms/FilingEntrySelector';

// Design Tokens
export { tokens } from '../styles/tokens';

// Layout Components
export { default as AuthLayout } from './layouts/AuthLayout';
export { default as Layout } from './Layout';

// Common Components
export { default as ErrorBoundary } from './ErrorBoundary';

// Form Components
export { default as BreakdownInput } from './BreakdownInput';
