// =====================================================
// UNIFIED FRONTEND SERVICES EXPORTS
// All frontend services organized by category
// =====================================================

// Core services
import apiClient from './core/APIClient';
import cacheService from './core/CacheService';
import errorHandler from './core/ErrorHandler';

// API services
import authService from './api/authService';
import itrService from './api/itrService';
import documentService from './api/documentService';
import paymentService from './api/paymentService';

// Utility services
import validationService from './utils/validationService';
import storageService from './utils/storageService';

// Export services
import { itrJsonExportService } from './itrJsonExportService';
import { form16ExtractionService } from './form16ExtractionService';
import { bankStatementService } from './bankStatementService';
import { taxSavingsService } from './taxSavingsService';

// =====================================================
// EXPORTS
// =====================================================

// Core services
export {
  apiClient,
  cacheService,
  errorHandler
};

// API services
export {
  authService,
  itrService,
  documentService,
  paymentService
};

// Utility services
export {
  validationService,
  storageService,
  itrJsonExportService,
  form16ExtractionService,
  bankStatementService,
  taxSavingsService
};

// Service categories
export const core = {
  apiClient,
  cacheService,
  errorHandler
};

export const api = {
  authService,
  itrService,
  documentService,
  paymentService
};

export const utils = {
  validationService,
  storageService,
  itrJsonExportService,
  form16ExtractionService,
  bankStatementService,
  taxSavingsService
};

// Default export
export default {
  ...core,
  ...api,
  ...utils,
  itrJsonExportService,
  form16ExtractionService,
  bankStatementService,
  taxSavingsService
};