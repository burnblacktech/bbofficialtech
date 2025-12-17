// =====================================================
// UI COMPONENT LIBRARY - BARREL EXPORTS
// Centralized exports for all UI components
// =====================================================

// Data Display Components
export { default as BreakdownList } from './BreakdownList/BreakdownList';
export { default as ComparisonTable } from './ComparisonTable/ComparisonTable';

// Status & Feedback Components
export { default as StatusBadge, StatusDot } from '../DesignSystem/StatusBadge';
export { default as EmptyState, NoDataEmptyState, UploadEmptyState, ErrorEmptyState, NoResultsEmptyState } from '../DesignSystem/EmptyState';

// Source & Data Provenance
export { default as SourceChip } from './SourceChip/SourceChip';
export {
  default as AutoFillIndicator,
  FieldAutoFillIndicator,
  SectionAutoFillBanner,
  MixedSourcesDisplay,
} from './AutoFillIndicator/AutoFillIndicator';
export { default as EditConfirmationDialog, EditConfirmationDialog as EditConfirmationDialogComponent } from './EditConfirmationDialog/EditConfirmationDialog';
export { default as AuditTrail, AuditTrail as AuditTrailComponent } from './AuditTrail/AuditTrail';

// Verification States
export { default as VerificationState, VerificationState as VerificationStateComponent } from './VerificationState/VerificationState';
export { default as FieldVerification, FieldVerification as FieldVerificationComponent, FieldVerificationBadge } from './FieldVerification/FieldVerification';
export { default as SectionVerification, SectionVerification as SectionVerificationComponent } from './SectionVerification/SectionVerification';
export { default as DocumentVerification, DocumentVerification as DocumentVerificationComponent } from './DocumentVerification/DocumentVerification';

// Error Prevention & Validation
export {
  default as InlineValidation,
  InlineValidation as InlineValidationComponent,
  ValidationSummary,
} from './InlineValidation/InlineValidation';
export {
  default as ConfirmationDialog,
  ConfirmationDialog as ConfirmationDialogComponent,
  DeleteConfirmationDialog,
} from './ConfirmationDialog/ConfirmationDialog';
export {
  default as SmartDefaultSuggestion,
  SmartDefaultSuggestion as SmartDefaultSuggestionComponent,
  CorrectionSuggestion,
  SmartDefaultHint,
} from './SmartDefaults/SmartDefaults';

// Tooltips & Contextual Help
export { default as Tooltip, Tooltip as TooltipComponent, RichTooltip } from './Tooltip/Tooltip';
export { default as HelpIcon, HelpIcon as HelpIconComponent, FieldLabelWithHelp } from './HelpIcon/HelpIcon';
export { default as ContextualHelpPanel, ContextualHelpPanel as ContextualHelpPanelComponent, HelpLink } from './ContextualHelpPanel/ContextualHelpPanel';
export { default as AISuggestionCard, AISuggestionCard as AISuggestionCardComponent } from './AISuggestionCard/AISuggestionCard';
export { default as TaxTerm, TaxTerm as TaxTermComponent, TaxTermGlossary, useTaxTerm } from './TaxTermGlossary/TaxTermGlossary';
export { default as FirstTimeTooltip, FirstTimeTooltip as FirstTimeTooltipComponent, useFirstTimeTour } from './FirstTimeTooltip/FirstTimeTooltip';
export { default as Disclaimer, Disclaimer as DisclaimerComponent } from './Disclaimer/Disclaimer';

// Other UI Components (if they exist)
export { default as InteractiveCard } from './InteractiveCard';
export { default as Button } from '../DesignSystem/components/Button';
export { default as Card } from './Card';
