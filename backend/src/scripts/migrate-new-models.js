#!/usr/bin/env node
/**
 * Migration script for new platform completion models.
 * Syncs: Order, Notification, FamilyMember, VaultDocument
 *
 * Usage: node src/scripts/migrate-new-models.js
 *
 * Safe to run multiple times — uses alter:true (adds missing columns/tables).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

async function migrate() {
  console.log('=== BurnBlack: New Models Migration ===\n');

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Load models
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    const FamilyMember = require('../models/FamilyMember');
    const VaultDocument = require('../models/VaultDocument');

    const models = [
      { model: Order, name: 'orders' },
      { model: Notification, name: 'notifications' },
      { model: FamilyMember, name: 'family_members' },
      { model: VaultDocument, name: 'vault_documents' },
    ];

    // Check which tables already exist
    const existingTables = await sequelize.getQueryInterface().showAllTables();
    console.log(`Existing tables: ${existingTables.length}`);
    console.log('');

    for (const { model, name } of models) {
      const exists = existingTables.includes(name);
      try {
        if (exists) {
          // Table exists — alter to add any missing columns
          await model.sync({ alter: true });
          console.log(`✓ ${name} — synced (alter)`);
        } else {
          // Table doesn't exist — create it
          await model.sync({ force: false });
          console.log(`✓ ${name} — created`);
        }
      } catch (error) {
        // If alter fails (e.g., enum type conflicts), try without alter
        console.log(`⚠ ${name} — alter failed: ${error.message}`);
        try {
          await model.sync({ force: false, alter: false });
          console.log(`✓ ${name} — synced (no alter)`);
        } catch (err2) {
          console.error(`✗ ${name} — FAILED: ${err2.message}`);
        }
      }
    }

    // Create ENUM types if they don't exist (for Neon/cloud DBs)
    const enumQueries = [
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notifications_channel') THEN CREATE TYPE enum_notifications_channel AS ENUM('email', 'sms', 'in_app'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notifications_status') THEN CREATE TYPE enum_notifications_status AS ENUM('pending', 'sent', 'failed', 'cancelled'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_family_members_relationship') THEN CREATE TYPE enum_family_members_relationship AS ENUM('spouse', 'parent', 'child', 'other'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_vault_documents_category') THEN CREATE TYPE enum_vault_documents_category AS ENUM('salary', 'investments', 'insurance', 'rent', 'donations', 'medical', 'capital_gains', 'business', 'other'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_vault_documents_ocr_status') THEN CREATE TYPE enum_vault_documents_ocr_status AS ENUM('pending', 'completed', 'failed', 'not_applicable'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN CREATE TYPE enum_orders_status AS ENUM('created', 'paid', 'failed', 'refunded', 'expired'); END IF; END $$;`,
    ];

    console.log('\nCreating ENUM types...');
    for (const q of enumQueries) {
      try { await sequelize.query(q); } catch { /* already exists */ }
    }
    console.log('✓ ENUM types verified');

    // Add indexes that might be missing
    console.log('\nVerifying indexes...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_filing_id ON orders(filing_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at)',
      'CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_family_members_pan ON family_members(pan)',
      'CREATE INDEX IF NOT EXISTS idx_vault_docs_user_fy ON vault_documents(user_id, financial_year)',
      'CREATE INDEX IF NOT EXISTS idx_vault_docs_user_cat ON vault_documents(user_id, category)',
      'CREATE INDEX IF NOT EXISTS idx_vault_docs_expiry ON vault_documents(expiry_date)',
    ];

    for (const q of indexQueries) {
      try { await sequelize.query(q); } catch { /* index already exists */ }
    }
    console.log('✓ Indexes verified');

    // Final verification
    console.log('\n--- Final Table Check ---');
    const finalTables = await sequelize.getQueryInterface().showAllTables();
    const required = ['orders', 'notifications', 'family_members', 'vault_documents'];
    for (const t of required) {
      const ok = finalTables.includes(t);
      console.log(`${ok ? '✓' : '✗'} ${t}`);
    }

    console.log(`\n=== Migration complete (${finalTables.length} tables total) ===`);

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
