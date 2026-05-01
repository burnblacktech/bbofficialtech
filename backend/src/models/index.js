// =====================================================
// MODELS INDEX - MODEL EXPORTS
// Loads core filing models + finance tracker models.
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

// Finance tracker models
const IncomeEntry = require('./IncomeEntry');
const ExpenseEntry = require('./ExpenseEntry');
const InvestmentEntry = require('./InvestmentEntry');
const InAppNotification = require('./InAppNotification');
const GSTLookup = require('./GSTLookup');

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
  onDelete: 'RESTRICT',
});
ITRFiling.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'RESTRICT',
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

// ── User ↔ IncomeEntry ──
User.hasMany(IncomeEntry, { foreignKey: 'userId', as: 'incomeEntries' });
IncomeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User ↔ ExpenseEntry ──
User.hasMany(ExpenseEntry, { foreignKey: 'userId', as: 'expenseEntries' });
ExpenseEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User ↔ InvestmentEntry ──
User.hasMany(InvestmentEntry, { foreignKey: 'userId', as: 'investmentEntries' });
InvestmentEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User ↔ InAppNotification ──
User.hasMany(InAppNotification, { foreignKey: 'userId', as: 'inAppNotifications' });
InAppNotification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── ITRFiling ↔ Finance Entries (optional link when used in filing) ──
ITRFiling.hasMany(IncomeEntry, { foreignKey: 'usedInFilingId', as: 'incomeEntries' });
ITRFiling.hasMany(ExpenseEntry, { foreignKey: 'usedInFilingId', as: 'expenseEntries' });
ITRFiling.hasMany(InvestmentEntry, { foreignKey: 'usedInFilingId', as: 'investmentEntries' });

// ── Billing: User ↔ Order ──
const Order = require('./Order');
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Billing: ITRFiling ↔ Order ──
ITRFiling.hasMany(Order, { foreignKey: 'filingId', as: 'orders' });
Order.belongsTo(ITRFiling, { foreignKey: 'filingId', as: 'filing' });

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
  IncomeEntry,
  ExpenseEntry,
  InvestmentEntry,
  InAppNotification,
  Notification: require('./Notification'),
  Order,
  FamilyMember: require('./FamilyMember'),
  VaultDocument: require('./VaultDocument'),
  Coupon: require('./Coupon'),
  GSTLookup,
};
