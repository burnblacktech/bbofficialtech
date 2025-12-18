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
import validationService from '../utils/validationService';
import storageService from '../utils/storageService';

// Tax and financial services
import { itrJsonExportService } from './itrJsonExportService';
import { form16ExtractionService } from './form16ExtractionService';
import { bankStatementService } from './bankStatementService';
import { taxSavingsService } from './taxSavingsService';

// Data integration services
import { dataIntegrationService } from './DataIntegrationService';
import { financialProfileService } from './FinancialProfileService';
import { aisForm26ASService } from './AISForm26ASService';
import { documentProcessingService } from './DocumentProcessingService';
import { autoPopulationITRService } from './AutoPopulationITRService';

// Broker integration
import BrokerAPIService, { createBrokerService } from './BrokerAPIService';

// Specialized services
import BankAPIService from './BankAPIService';
import DeductionOCRService from './DeductionOCRService';
import CABotService from './CABotService';

// =====================================================
// EXPORTS
// =====================================================

// Core services
export {
  apiClient,
  cacheService,
  errorHandler,
};

// API services
export {
  authService,
  itrService,
  documentService,
  paymentService,
};

// Utility services
export {
  validationService,
  storageService,
  itrJsonExportService,
  form16ExtractionService,
  bankStatementService,
  taxSavingsService,
};

// Data integration services
export {
  dataIntegrationService,
  financialProfileService,
  aisForm26ASService,
  documentProcessingService,
  autoPopulationITRService,
};

// Broker integration
export {
  BrokerAPIService,
  createBrokerService,
};

// Specialized services
export {
  BankAPIService,
  DeductionOCRService,
  CABotService,
};

// Service categories
export const core = {
  apiClient,
  cacheService,
  errorHandler,
};

export const api = {
  authService,
  itrService,
  documentService,
  paymentService,
};

export const utils = {
  validationService,
  storageService,
  itrJsonExportService,
  form16ExtractionService,
  bankStatementService,
  taxSavingsService,
};

export const dataIntegration = {
  dataIntegrationService,
  financialProfileService,
  aisForm26ASService,
  documentProcessingService,
  autoPopulationITRService,
};

export const brokerIntegration = {
  BrokerAPIService,
  createBrokerService,
};

export const specialized = {
  BankAPIService,
  DeductionOCRService,
  CABotService,
};

// Default export
export default {
  ...core,
  ...api,
  ...utils,
  ...dataIntegration,
  ...brokerIntegration,
  ...specialized,
};
