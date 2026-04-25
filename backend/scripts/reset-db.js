/**
 * Reset database — drop all tables/enums and recreate from models
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sequelize } = require('../src/config/database');

// Import models WITHOUT loading index.js (which sets up associations)
const User = require('../src/models/User');
const CAFirm = require('../src/models/CAFirm');
const ITRFiling = require('../src/models/ITRFiling');
const AuditEvent = require('../src/models/AuditEvent');
const UserSession = require('../src/models/UserSession');
const PasswordResetToken = require('../src/models/PasswordResetToken');
const UserProfile = require('../src/models/UserProfile');
const FilingSnapshot = require('../src/models/FilingSnapshot');
const ERISubmissionAttempt = require('../src/models/ERISubmissionAttempt');

(async () => {
  try {
    console.log('Dropping schema...');
    await sequelize.query('DROP SCHEMA public CASCADE');
    await sequelize.query('CREATE SCHEMA public');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public');

    console.log('Creating tables (no FK constraints)...');
    const models = [User, CAFirm, ITRFiling, AuditEvent, UserSession, PasswordResetToken, UserProfile, FilingSnapshot, ERISubmissionAttempt];
    for (const model of models) {
      await model.sync();
      console.log(`  - ${model.tableName}`);
    }

    // Now add FK constraints via associations
    console.log('Adding FK constraints...');
    require('../src/models'); // This loads index.js which defines associations

    // Add FK columns that associations create (caFirmId on users, etc.)
    // These are already defined in the models, so no alter needed
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`\nCreated ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t}`));
    console.log('\nDatabase reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
