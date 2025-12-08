// =====================================================
// MODELS INDEX - CANONICAL MODEL EXPORTS
// =====================================================

const User = require('./User');
const ITRFiling = require('./ITRFiling');
const ITRDraft = require('./ITRDraft');
const { FamilyMember } = require('./Member');
const { Document } = require('./Document');
const { ServiceTicket } = require('./ServiceTicket');
const { ServiceTicketMessage } = require('./ServiceTicketMessage');
const { Invoice } = require('./Invoice');
const UserSession = require('./UserSession');
const AuditLog = require('./AuditLog');
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
const ForeignAsset = require('./ForeignAsset');
const RefundTracking = require('./RefundTracking');
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
  AuditLog,
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
  ForeignAsset,
  RefundTracking,
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
};
