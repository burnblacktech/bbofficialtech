// =====================================================
// DYNAMIC ITR FORM SYSTEM
// Unified ITR filing components replacing 38 scattered components
// Single codebase for all ITR types with configurable forms
// =====================================================

// Core components
export { default as ITRFormRenderer } from './core/ITRFormRenderer';
export { default as ITRValidationEngine } from './core/ITRValidationEngine';
export { default as ITRComputationEngine } from './core/ITRComputationEngine';

// Configurations
export { default as ITR1_CONFIG } from './config/ITR1Config.js';

// Legacy compatibility exports
import ITRFormRenderer from './core/ITRFormRenderer';
import ITRValidationEngine from './core/ITRValidationEngine';
import ITRComputationEngine from './core/ITRComputationEngine';
import ITR1_CONFIG from './config/ITR1Config.js';

// Enhanced ITR form system with all the benefits
export const EnhancedITRForm = ITRFormRenderer;

export default {
  ITRFormRenderer,
  ITRValidationEngine,
  ITRComputationEngine,
  ITR1_CONFIG,
  EnhancedITRForm,
};
