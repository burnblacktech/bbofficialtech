// =====================================================
// INTEGRATION SERVICES BARREL EXPORTS
// External service integrations
// =====================================================

const S3Service = require('./S3Service');
const EmailService = require('./EmailService');
const AIService = require('./AIService');

module.exports = {
  S3Service,
  EmailService,
  AIService
};