// =====================================================
// MODEL ASSOCIATIONS
// Defines relationships between Sequelize models
// =====================================================

// Require models directly to avoid circular dependency
const User = require('./User');
const CAFirm = require('./CAFirm');
const { FamilyMember } = require('./Member');
const ITRFiling = require('./ITRFiling');
const Assignment = require('./Assignment');
const { ServiceTicket } = require('./ServiceTicket');
const Document = require('./Document');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const HelpArticle = require('./HelpArticle');
const CAMarketplaceInquiry = require('./CAMarketplaceInquiry');
const CABooking = require('./CABooking');
const CAFirmReview = require('./CAFirmReview');

const enterpriseLogger = require('../utils/logger');

// =====================================================
// USER ASSOCIATIONS
// =====================================================

// User belongs to CA Firm (optional, for B2B)
User.belongsTo(CAFirm, {
  foreignKey: 'caFirmId',
  as: 'caFirm',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// User has many ITR Filings
User.hasMany(ITRFiling, {
  foreignKey: 'userId',
  as: 'filings',
  onDelete: 'CASCADE',
});

// User has many Family Members (B2C)
User.hasMany(FamilyMember, {
  foreignKey: 'userId',
  as: 'familyMembers',
  onDelete: 'CASCADE',
});

// User has many Assignments (as assigned user)
User.hasMany(Assignment, {
  foreignKey: 'userId',
  as: 'assignments',
  onDelete: 'CASCADE',
});

// User has many Service Tickets
User.hasMany(ServiceTicket, {
  foreignKey: 'userId',
  as: 'serviceTickets',
  onDelete: 'SET NULL',
});

// User has many Service Tickets (as assigned to)
User.hasMany(ServiceTicket, {
  foreignKey: 'assignedTo',
  as: 'assignedTickets',
  onDelete: 'SET NULL',
});

// User has many Audit Logs
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
  onDelete: 'SET NULL',
});

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

// User has many Help Articles (as author)
User.hasMany(HelpArticle, {
  foreignKey: 'authorId',
  as: 'authoredArticles',
  onDelete: 'SET NULL',
});

// User has many CA Marketplace Inquiries
User.hasMany(CAMarketplaceInquiry, {
  foreignKey: 'userId',
  as: 'caInquiries',
  onDelete: 'SET NULL',
});

// User has many CA Bookings
User.hasMany(CABooking, {
  foreignKey: 'userId',
  as: 'caBookings',
  onDelete: 'SET NULL',
});

// User has many CA Firm Reviews
User.hasMany(CAFirmReview, {
  foreignKey: 'userId',
  as: 'caReviews',
  onDelete: 'SET NULL',
});

// =====================================================
// CA FIRM ASSOCIATIONS
// =====================================================

// CA Firm has many Users (staff and clients)
CAFirm.hasMany(User, {
  foreignKey: 'caFirmId',
  as: 'users',
  onDelete: 'SET NULL',
});

// CA Firm has many Clients (FamilyMembers with clientType='ca_client')
CAFirm.hasMany(FamilyMember, {
  foreignKey: 'firmId',
  as: 'clients',
  onDelete: 'SET NULL',
});

// CA Firm has many ITR Filings (through users)
CAFirm.hasMany(ITRFiling, {
  foreignKey: 'firmId',
  as: 'filings',
  onDelete: 'SET NULL',
});

// CA Firm has many Service Tickets
CAFirm.hasMany(ServiceTicket, {
  foreignKey: 'caFirmId',
  as: 'serviceTickets',
  onDelete: 'SET NULL',
});

// CA Firm has many Marketplace Inquiries
CAFirm.hasMany(CAMarketplaceInquiry, {
  foreignKey: 'firmId',
  as: 'inquiries',
  onDelete: 'CASCADE',
});

// CA Firm has many Bookings
CAFirm.hasMany(CABooking, {
  foreignKey: 'firmId',
  as: 'bookings',
  onDelete: 'CASCADE',
});

// CA Firm has many Reviews
CAFirm.hasMany(CAFirmReview, {
  foreignKey: 'firmId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

// =====================================================
// FAMILY MEMBER (CLIENT) ASSOCIATIONS
// =====================================================

// FamilyMember belongs to User (owner)
FamilyMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner',
  onDelete: 'CASCADE',
});

// FamilyMember belongs to CA Firm (for B2B clients)
FamilyMember.belongsTo(CAFirm, {
  foreignKey: 'firmId',
  as: 'firm',
  onDelete: 'SET NULL',
});

// FamilyMember has many Assignments
FamilyMember.hasMany(Assignment, {
  foreignKey: 'clientId',
  as: 'assignments',
  onDelete: 'CASCADE',
});

// FamilyMember has many ITR Filings
FamilyMember.hasMany(ITRFiling, {
  foreignKey: 'memberId',
  as: 'filings',
  onDelete: 'CASCADE',
});

// =====================================================
// ASSIGNMENT ASSOCIATIONS
// =====================================================

// Assignment belongs to Client (FamilyMember)
Assignment.belongsTo(FamilyMember, {
  foreignKey: 'clientId',
  as: 'client',
  onDelete: 'CASCADE',
});

// Assignment belongs to User (preparer/reviewer)
Assignment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// Assignment belongs to User (created by)
Assignment.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'SET NULL',
});

// =====================================================
// ITR FILING ASSOCIATIONS
// =====================================================

// ITRFiling belongs to User
ITRFiling.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// ITRFiling belongs to FamilyMember (optional)
ITRFiling.belongsTo(FamilyMember, {
  foreignKey: 'memberId',
  as: 'member',
  onDelete: 'CASCADE',
});

// ITRFiling belongs to CA Firm
ITRFiling.belongsTo(CAFirm, {
  foreignKey: 'firmId',
  as: 'firm',
  onDelete: 'SET NULL',
});

// ITRFiling belongs to User (assigned to)
ITRFiling.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

// ITRFiling has many Service Tickets
ITRFiling.hasMany(ServiceTicket, {
  foreignKey: 'filingId',
  as: 'serviceTickets',
  onDelete: 'SET NULL',
});

// ITRFiling belongs to ITRFiling (previous year filing)
ITRFiling.belongsTo(ITRFiling, {
  foreignKey: 'previousYearFilingId',
  as: 'previousYearFiling',
  onDelete: 'SET NULL',
});

// ITRFiling has many ITRFilings (as previous year filing)
ITRFiling.hasMany(ITRFiling, {
  foreignKey: 'previousYearFilingId',
  as: 'copiedToFilings',
  onDelete: 'SET NULL',
});

// =====================================================
// DOCUMENT ASSOCIATIONS
// =====================================================

// Document belongs to User
Document.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// User has many Documents
User.hasMany(Document, {
  foreignKey: 'userId',
  as: 'documents',
  onDelete: 'CASCADE',
});

// =====================================================
// ITR-V PROCESSING ASSOCIATIONS
// =====================================================

const ITRVProcessing = require('./ITRVProcessing');

// ITRVProcessing belongs to ITRFiling
ITRVProcessing.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'CASCADE',
});

// ITRFiling has one ITRVProcessing
ITRFiling.hasOne(ITRVProcessing, {
  foreignKey: 'filingId',
  as: 'itrvProcessing',
  onDelete: 'CASCADE',
});

// =====================================================
// ASSESSMENT NOTICE ASSOCIATIONS
// =====================================================

const AssessmentNotice = require('./AssessmentNotice');

// AssessmentNotice belongs to User
AssessmentNotice.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// AssessmentNotice belongs to ITRFiling
AssessmentNotice.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'SET NULL',
});

// User has many AssessmentNotices
User.hasMany(AssessmentNotice, {
  foreignKey: 'userId',
  as: 'assessmentNotices',
  onDelete: 'CASCADE',
});

// ITRFiling has many AssessmentNotices
ITRFiling.hasMany(AssessmentNotice, {
  foreignKey: 'filingId',
  as: 'assessmentNotices',
  onDelete: 'SET NULL',
});

// =====================================================
// TAX DEMAND ASSOCIATIONS
// =====================================================

const TaxDemand = require('./TaxDemand');

// TaxDemand belongs to User
TaxDemand.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// TaxDemand belongs to ITRFiling
TaxDemand.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'SET NULL',
});

// User has many TaxDemands
User.hasMany(TaxDemand, {
  foreignKey: 'userId',
  as: 'taxDemands',
  onDelete: 'CASCADE',
});

// ITRFiling has many TaxDemands
ITRFiling.hasMany(TaxDemand, {
  foreignKey: 'filingId',
  as: 'taxDemands',
  onDelete: 'SET NULL',
});

// =====================================================
// SCENARIO ASSOCIATIONS
// =====================================================

const Scenario = require('./Scenario');

// Scenario belongs to User
Scenario.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// Scenario belongs to ITRFiling
Scenario.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'SET NULL',
});

// User has many Scenarios
User.hasMany(Scenario, {
  foreignKey: 'userId',
  as: 'scenarios',
  onDelete: 'CASCADE',
});

// ITRFiling has many Scenarios
ITRFiling.hasMany(Scenario, {
  foreignKey: 'filingId',
  as: 'scenarios',
  onDelete: 'SET NULL',
});

// =====================================================
// SERVICE TICKET ASSOCIATIONS
// =====================================================

// ServiceTicket belongs to User
ServiceTicket.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL',
});

// ServiceTicket belongs to User (assigned to)
ServiceTicket.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

// ServiceTicket belongs to ITRFiling
ServiceTicket.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'SET NULL',
});

// ServiceTicket belongs to CA Firm
ServiceTicket.belongsTo(CAFirm, {
  foreignKey: 'caFirmId',
  as: 'firm',
  onDelete: 'SET NULL',
});

// =====================================================
// NOTIFICATION ASSOCIATIONS
// =====================================================

// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// =====================================================
// HELP ARTICLE ASSOCIATIONS
// =====================================================

// HelpArticle belongs to User (author)
HelpArticle.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
  onDelete: 'SET NULL',
});

// =====================================================
// CA MARKETPLACE INQUIRY ASSOCIATIONS
// =====================================================

// CAMarketplaceInquiry belongs to CA Firm
CAMarketplaceInquiry.belongsTo(CAFirm, {
  foreignKey: 'firmId',
  as: 'firm',
  onDelete: 'CASCADE',
});

// CAMarketplaceInquiry belongs to User
CAMarketplaceInquiry.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL',
});

// =====================================================
// CA BOOKING ASSOCIATIONS
// =====================================================

// CABooking belongs to CA Firm
CABooking.belongsTo(CAFirm, {
  foreignKey: 'firmId',
  as: 'firm',
  onDelete: 'CASCADE',
});

// CABooking belongs to User
CABooking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL',
});

// =====================================================
// CA FIRM REVIEW ASSOCIATIONS
// =====================================================

// CAFirmReview belongs to CA Firm
CAFirmReview.belongsTo(CAFirm, {
  foreignKey: 'firmId',
  as: 'firm',
  onDelete: 'CASCADE',
});

// CAFirmReview belongs to User
CAFirmReview.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL',
});

// =====================================================
// FINANCE ASSOCIATIONS (Phase 5)
// =====================================================

const { Invoice } = require('./Invoice');
const Payment = require('./Payment');

// Invoice belongs to User
Invoice.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
});

// Invoice belongs to ITR Filing
Invoice.belongsTo(ITRFiling, {
  foreignKey: 'filingId',
  as: 'filing',
  onDelete: 'SET NULL',
});

// Invoice has many Payments
Invoice.hasMany(Payment, {
  foreignKey: 'invoiceId',
  as: 'payments',
  onDelete: 'CASCADE',
});

// Payment belongs to Invoice
Payment.belongsTo(Invoice, {
  foreignKey: 'invoiceId',
  as: 'invoice',
  onDelete: 'CASCADE',
});

enterpriseLogger.info('Model associations defined');

