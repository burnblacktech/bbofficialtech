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
};
