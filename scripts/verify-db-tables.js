#!/usr/bin/env node

/**
 * Quick Database Tables Verification
 * Lists all tables and their column counts
 */

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));
const { sequelize } = require(path.resolve(__dirname, '..', 'backend', 'src', 'config', 'database'));

async function verifyTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`Found ${tables.length} tables in database:\n`);

    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get column count
      const [columns] = await sequelize.query(`
        SELECT COUNT(*)::int as count
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
      `, {
        type: sequelize.QueryTypes.SELECT,
      });

      // Get row count
      try {
        const [rows] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM ${tableName}
        `, {
          type: sequelize.QueryTypes.SELECT,
        });
        const colCount = columns[0]?.count || 0;
        const rowCount = rows[0]?.count || 0;
        console.log(`  ✅ ${tableName.padEnd(40)} ${colCount.toString().padStart(3)} columns, ${rowCount} rows`);
      } catch (e) {
        const colCount = columns[0]?.count || 0;
        console.log(`  ✅ ${tableName.padEnd(40)} ${colCount.toString().padStart(3)} columns`);
      }
    }

    // Check for expected tables from models
    const expectedTables = [
      'users', 'user_profiles', 'user_sessions', 'family_members',
      'itr_filings', 'itr_drafts', 'documents', 'service_tickets',
      'service_ticket_messages', 'invoices', 'audit_logs',
      'password_reset_tokens', 'ca_firms', 'invites',
      'account_linking_tokens', 'assignments', 'return_versions',
      'consents', 'data_sources', 'tax_payments', 'foreign_assets',
      'refund_tracking', 'itr_v_processing', 'assessment_notices',
      'tax_demands', 'scenarios', 'document_templates',
      'notifications', 'help_articles', 'ca_marketplace_inquiries',
      'ca_bookings', 'ca_firm_reviews', 'bank_accounts',
      'pricing_plans', 'coupons', 'user_segments', 'platform_settings'
    ];

    console.log(`\n\nExpected tables (${expectedTables.length}):`);
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    const extraTables = existingTableNames.filter(t => !expectedTables.includes(t));

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables (${missingTables.length}):`);
      missingTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log(`\n✅ All expected tables exist!`);
    }

    if (extraTables.length > 0) {
      console.log(`\nℹ️  Extra tables (${extraTables.length}):`);
      extraTables.forEach(t => console.log(`  - ${t}`));
    }

    // Check users table for gender column
    console.log(`\n\nChecking users table for gender column...`);
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'gender'
    `);

    if (userColumns.length > 0) {
      console.log(`✅ Gender column exists:`);
      console.log(`   Type: ${userColumns[0].udt_name || userColumns[0].data_type}`);
      console.log(`   Nullable: ${userColumns[0].is_nullable}`);
    } else {
      console.log(`❌ Gender column missing from users table`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifyTables();

