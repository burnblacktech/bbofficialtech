// =====================================================
// MODELS INDEX - MVP MODEL EXPORTS
// Only load models needed for the core filing flow.
// Non-MVP models are preserved on disk but not loaded at boot.
// =====================================================

const User = require('./User');
const ITRFiling = require('./ITRFiling');
const AuditEvent = require('./AuditEvent');
const UserSession = require('./UserSession');
const PasswordResetToken = require('./PasswordResetToken');
const CAFirm = require('./CAFirm');
const UserProfile = require('./UserProfile');
const FilingSnapshot = require('./FilingSnapshot');
const ERISubmissionAttempt = require('./ERISubmissionAttempt');

// Define MVP associations inline (replaces associations.js)
// ── User ↔ CAFirm ──
User.belongsTo(CAFirm, {
  foreignKey: 'caFirmId',
  as: 'caFirm',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
CAFirm.hasMany(User, {
  foreignKey: 'caFirmId',
  as: 'users',
  onDelete: 'SET NULL',
});

// ── User ↔ ITRFiling ──
User.hasMany(ITRFiling, {
  foreignKey: 'createdBy',
  as: 'filings',
  onDelete: 'CASCADE',
});
ITRFiling.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'CASCADE',
});

// ── ITRFiling ↔ CAFirm ──
ITRFiling.belongsTo(CAFirm, {
  foreignKey: 'caFirmId',
  as: 'firm',
  onDelete: 'SET NULL',
});
CAFirm.hasMany(ITRFiling, {
  foreignKey: 'caFirmId',
  as: 'filings',
  onDelete: 'SET NULL',
});

// ── User ↔ AuditEvent ──
User.hasMany(AuditEvent, {
  foreignKey: 'actorId',
  as: 'auditTrail',
  onDelete: 'SET NULL',
});

module.exports = {
  User,
  ITRFiling,
  AuditEvent,
  UserSession,
  PasswordResetToken,
  CAFirm,
  UserProfile,
  FilingSnapshot,
  ERISubmissionAttempt,
  Notification: require('./Notification'),
  Order: require('./Order'),
  FamilyMember: require('./FamilyMember'),
  VaultDocument: require('./VaultDocument'),
};
