// =====================================================
// MIGRATION: Create PlatformSettings Table
// =====================================================
// Run this script to create the platform_settings table
// Usage: node src/scripts/migrations/create-platform-settings-table.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function createPlatformSettingsTable() {
  try {
    enterpriseLogger.info('Creating platform_settings table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL DEFAULT '{}',
        description TEXT,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
      CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON platform_settings(updated_by);

      COMMENT ON TABLE platform_settings IS 'Stores platform-wide configuration settings';
      COMMENT ON COLUMN platform_settings.key IS 'Settings key (e.g., "platform", "billing", "tax_config")';
      COMMENT ON COLUMN platform_settings.value IS 'Settings value as JSON object';
      COMMENT ON COLUMN platform_settings.description IS 'Description of what this setting controls';
      COMMENT ON COLUMN platform_settings.updated_by IS 'User ID who last updated this setting';
    `);

    // Seed default platform settings
    const { PlatformSettings } = require('../../models');
    const defaultSettings = {
      defaultBillingMode: 'per_filing',
      defaultItrRates: {
        itr_1: 500,
        itr_2: 800,
        itr_3: 1200,
        itr_4: 1000,
      },
      maxFilingsPerUserMonth: 10,
      maxFilingsPerUserYear: 50,
      serviceTicketAutoCreate: true,
      caAssistedFilingVisible: true,
      platformCommission: 5.0,
    };

    await PlatformSettings.setSetting(
      'platform',
      defaultSettings,
      null,
      'Platform-wide configuration settings'
    );

    enterpriseLogger.info('✅ PlatformSettings table created and seeded successfully');
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('Migration failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
createPlatformSettingsTable();

