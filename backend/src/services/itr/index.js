// =====================================================
// ITR SERVICES BARREL
// Canonical exports for all ITR-related services
// =====================================================

const BalanceSheetService = require('./BalanceSheetService');
const AuditInformationService = require('./AuditInformationService');
const ITRApplicabilityService = require('../ITRApplicabilityService');
const ITRExportService = require('./ITRExportService');
const ITRComputationService = require('./ITRComputationService');
const CompletionChecklistService = require('./CompletionChecklistService');
const FilingSafetyService = require('./FilingSafetyService');
const BusinessIncomeCalculator = require('./BusinessIncomeCalculator');
const ProfessionalIncomeCalculator = require('./ProfessionalIncomeCalculator');
const ITR1JsonBuilder = require('./ITR1JsonBuilder');
const ITR2JsonBuilder = require('./ITR2JsonBuilder');
const ITR3JsonBuilder = require('./ITR3JsonBuilder');
const ITR4JsonBuilder = require('./ITR4JsonBuilder');

module.exports = {
    BalanceSheetService,
    AuditInformationService,
    ITRApplicabilityService,
    ITRExportService,
    ITRComputationService,
    CompletionChecklistService,
    FilingSafetyService,
    BusinessIncomeCalculator,
    ProfessionalIncomeCalculator,
    ITR1JsonBuilder,
    ITR2JsonBuilder,
    ITR3JsonBuilder,
    ITR4JsonBuilder
};
