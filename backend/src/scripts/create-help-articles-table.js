// =====================================================
// CREATE HELP ARTICLES TABLE
// Creates the help_articles table if it doesn't exist
// Usage: node src/scripts/create-help-articles-table.js
// =====================================================

const { sequelize } = require('../config/database');
const { HelpArticle } = require('../models');
const enterpriseLogger = require('../utils/logger');

async function createHelpArticlesTable() {
  try {
    enterpriseLogger.info('Creating help_articles table...');
    console.log('\n=== Creating Help Articles Table ===\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync the HelpArticle model (creates table if it doesn't exist)
    await HelpArticle.sync({ alter: false });
    console.log('✅ help_articles table created/verified\n');

    enterpriseLogger.info('Help articles table created successfully');
    console.log('✅ Table creation completed successfully!\n');
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('Failed to create help_articles table', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Table creation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createHelpArticlesTable();
}

module.exports = { createHelpArticlesTable };

