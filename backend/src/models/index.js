// =====================================================
// MODELS INDEX - CANONICAL MODEL EXPORTS
// =====================================================

const User = require('./User');
const ITRFiling = require('./ITRFiling');
const ITRDraft = require('./ITRDraft');
const { FamilyMember } = require('./Member');
const Document = require('./Document');
const { ServiceTicket } = require('./ServiceTicket');
const { ServiceTicketMessage } = require('./ServiceTicketMessage');
const { Invoice } = require('./Invoice');
const AuditEvent = require('./AuditEvent');
const UserSession = require('./UserSession');
const PasswordResetToken = require('./PasswordResetToken');
const CAFirm = require('./CAFirm');
const Invite = require('./Invite');
const AccountLinkingToken = require('./AccountLinkingToken');
const UserProfile = require('./UserProfile');
const Assignment = require('./Assignment');
const ReturnVersion = require('./ReturnVersion');
const Consent = require('./Consent');
const DataSource = require('./DataSource');
const TaxPayment = require('./TaxPayment');
const Payment = require('./Payment');
const ForeignAsset = require('./ForeignAsset');
const RefundTracking = require('./RefundTracking');
const ITRVProcessing = require('./ITRVProcessing');
const AssessmentNotice = require('./AssessmentNotice');
const TaxDemand = require('./TaxDemand');
const Scenario = require('./Scenario');
const DocumentTemplate = require('./DocumentTemplate');
const Notification = require('./Notification');
const HelpArticle = require('./HelpArticle');
const CAMarketplaceInquiry = require('./CAMarketplaceInquiry');
const CABooking = require('./CABooking');
const CAFirmReview = require('./CAFirmReview');
const BankAccount = require('./BankAccount');
const PricingPlan = require('./PricingPlan');
const Coupon = require('./Coupon');
const UserSegment = require('./UserSegment');
const PlatformSettings = require('./PlatformSettings');
const ERISubmissionAttempt = require('./ERISubmissionAttempt');

// Define associations after all models are loaded
require('./associations');

module.exports = {
  User,
  ITRFiling,
  ITRDraft,
  FamilyMember,
  Document,
  ServiceTicket,
  ServiceTicketMessage,
  Invoice,
  UserSession,
  AuditEvent,
  PasswordResetToken,
  CAFirm,
  Invite,
  AccountLinkingToken,
  UserProfile,
  Assignment,
  ReturnVersion,
  Consent,
  DataSource,
  TaxPayment,
  Payment,
  ForeignAsset,
  RefundTracking,
  ITRVProcessing,
  AssessmentNotice,
  TaxDemand,
  Scenario,
  DocumentTemplate,
  Notification,
  HelpArticle,
  CAMarketplaceInquiry,
  CABooking,
  CAFirmReview,
  BankAccount,
  PricingPlan,
  Coupon,
  UserSegment,
  PlatformSettings,
  ERISubmissionAttempt,
};
