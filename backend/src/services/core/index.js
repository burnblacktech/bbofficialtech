// =====================================================
// CORE SERVICES BARREL EXPORTS
// Core business logic services
// =====================================================

const TaxComputationEngine = require('./TaxComputationEngine');
const ValidationEngine = require('./ValidationEngine');
const DocumentService = require('./DocumentService');

module.exports = {
  TaxComputationEngine,
  ValidationEngine,
  DocumentService
};