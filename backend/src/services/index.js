// =====================================================
// UNIFIED SERVICES EXPORTS
// All backend services organized by category
// =====================================================

// Core business logic services
const { TaxComputationEngine, ValidationEngine, DocumentService } = require('./core');

// Integration services (external APIs)
const { S3Service, EmailService, AIService } = require('./integration');

// Business-specific services
const {
  ExpertReviewService,
  InvoiceService,
  ServiceTicketService,
  PANVerificationService,
  MFAService,
  BrokerFileProcessingService,

  ERIIntegrationService,
  eriSigningService,
} = require('./business');

// Utility services
const { AuditService, NotificationService } = require('./utils');

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Core services
  TaxComputationEngine,
  ValidationEngine,
  DocumentService,

  // Integration services
  S3Service,
  EmailService,
  AIService,

  // Business services
  ExpertReviewService,
  InvoiceService,
  ServiceTicketService,
  PANVerificationService,
  MFAService,
  BrokerFileProcessingService,

  ERIIntegrationService,
  eriSigningService,

  // Utility services
  AuditService,
  NotificationService,

  // Service categories
  core: {
    TaxComputationEngine,
    ValidationEngine,
    DocumentService,
  },
  integration: {
    S3Service,
    EmailService,
    AIService,
  },
  business: {
    ExpertReviewService,
    InvoiceService,
    ServiceTicketService,
    PANVerificationService,
    MFAService,
    BrokerFileProcessingService,

    ERIIntegrationService,
    eriSigningService,
  },
  utils: {
    AuditService,
    NotificationService,
  },
};