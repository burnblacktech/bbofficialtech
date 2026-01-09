// =====================================================
// CORE SERVICES BARREL EXPORTS
// Core business logic services
// =====================================================

const TaxComputationEngine = require('../tax/TaxComputationEngine');
const DocumentService = require('./DocumentService');
const FilingService = require('./FilingService');
const AuditService = require('./AuditService');

module.exports = {
  TaxComputationEngine,
  DocumentService,
  FilingService,
  AuditService,
};