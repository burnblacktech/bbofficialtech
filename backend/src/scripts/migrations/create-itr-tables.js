// =====================================================
// MIGRATION: Create ITR Drafts and Filings Tables
// =====================================================
// Run this script to create the itr_drafts and itr_filings tables
// Usage: node src/scripts/migrations/create-itr-tables.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function createITRTables() {
  try {
    enterpriseLogger.info('Creating ITR tables...');
    console.log('\n=== Creating ITR Drafts and Filings Tables ===\n');

    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('itr_filings', 'itr_drafts', 'family_members', 'ca_firms', 'foreign_assets')
    `);
    
    const existingTables = tables.map(t => t.table_name);
    const itrFilingsExists = existingTables.includes('itr_filings');
    const itrDraftsExists = existingTables.includes('itr_drafts');
    const familyMembersExists = existingTables.includes('family_members');
    const caFirmsExists = existingTables.includes('ca_firms');
    const foreignAssetsExists = existingTables.includes('foreign_assets');

    // Create itr_filings table first (parent table)
    if (!itrFilingsExists) {
      console.log('Creating itr_filings table...');
      await sequelize.query(`
        CREATE TABLE itr_filings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          member_id UUID${familyMembersExists ? ' REFERENCES family_members(id) ON DELETE SET NULL' : ''},
          itr_type VARCHAR(10) NOT NULL CHECK (itr_type IN ('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4')),
          assessment_year VARCHAR(10) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'processed', 'rejected', 'paused')),
          json_payload JSONB DEFAULT '{}',
          submitted_at TIMESTAMP,
          acknowledgment_number VARCHAR(50),
          ack_number VARCHAR(50),
          paused_at TIMESTAMP,
          resumed_at TIMESTAMP,
          pause_reason TEXT,
          acknowledged_at TIMESTAMP,
          processed_at TIMESTAMP,
          rejection_reason TEXT,
          tax_liability DECIMAL(15, 2),
          refund_amount DECIMAL(15, 2),
          balance_payable DECIMAL(15, 2),
          service_ticket_id UUID,
          firm_id UUID${caFirmsExists ? ' REFERENCES ca_firms(id) ON DELETE SET NULL' : ''},
          assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
          review_status VARCHAR(20) CHECK (review_status IN ('pending', 'in_review', 'approved', 'rejected')),
          verification_method VARCHAR(20) CHECK (verification_method IN ('AADHAAR_OTP', 'NETBANKING', 'DSC')),
          verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
          verification_date TIMESTAMP,
          verification_details JSONB,
          regime VARCHAR(10) CHECK (regime IN ('old', 'new')),
          previous_year_filing_id UUID REFERENCES itr_filings(id) ON DELETE SET NULL,
          shared_with JSONB DEFAULT '[]',
          tax_computation JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_filing_per_member UNIQUE (user_id, member_id, itr_type, assessment_year)
        )
      `);
      console.log('✅ itr_filings table created');
    } else {
      console.log('itr_filings table already exists, checking for missing columns...');
      // Check and add missing columns
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'itr_filings' 
        AND table_schema = 'public'
      `);
      const existingColumns = columns.map(c => c.column_name);
      
      // List of all columns that should exist
      const requiredColumns = [
        { name: 'acknowledgment_number', type: 'VARCHAR(50)' },
        { name: 'ack_number', type: 'VARCHAR(50)' },
        { name: 'member_id', type: `UUID${familyMembersExists ? ' REFERENCES family_members(id) ON DELETE SET NULL' : ''}` },
        { name: 'paused_at', type: 'TIMESTAMP' },
        { name: 'resumed_at', type: 'TIMESTAMP' },
        { name: 'pause_reason', type: 'TEXT' },
        { name: 'acknowledged_at', type: 'TIMESTAMP' },
        { name: 'processed_at', type: 'TIMESTAMP' },
        { name: 'rejection_reason', type: 'TEXT' },
        { name: 'tax_liability', type: 'DECIMAL(15, 2)' },
        { name: 'refund_amount', type: 'DECIMAL(15, 2)' },
        { name: 'balance_payable', type: 'DECIMAL(15, 2)' },
        { name: 'service_ticket_id', type: 'UUID' },
        { name: 'firm_id', type: `UUID${caFirmsExists ? ' REFERENCES ca_firms(id) ON DELETE SET NULL' : ''}` },
        { name: 'assigned_to', type: 'UUID REFERENCES users(id) ON DELETE SET NULL' },
        { name: 'review_status', type: 'VARCHAR(20) CHECK (review_status IN (\'pending\', \'in_review\', \'approved\', \'rejected\'))' },
        { name: 'verification_method', type: 'VARCHAR(20) CHECK (verification_method IN (\'AADHAAR_OTP\', \'NETBANKING\', \'DSC\'))' },
        { name: 'verification_status', type: 'VARCHAR(20) DEFAULT \'pending\' CHECK (verification_status IN (\'pending\', \'verified\', \'failed\'))' },
        { name: 'verification_date', type: 'TIMESTAMP' },
        { name: 'verification_details', type: 'JSONB' },
        { name: 'regime', type: 'VARCHAR(10) CHECK (regime IN (\'old\', \'new\'))' },
        { name: 'previous_year_filing_id', type: 'UUID REFERENCES itr_filings(id) ON DELETE SET NULL' },
        { name: 'shared_with', type: 'JSONB DEFAULT \'[]\'' },
        { name: 'tax_computation', type: 'JSONB' },
      ];

      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            await sequelize.query(`ALTER TABLE itr_filings ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Added ${col.name} column`);
          } catch (error) {
            console.warn(`⚠️  Could not add ${col.name}: ${error.message}`);
          }
        }
      }
    }

    // Create indexes for itr_filings
    console.log('Creating indexes for itr_filings...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_itr_filings_user_id ON itr_filings(user_id);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_member_id ON itr_filings(member_id);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_status ON itr_filings(status);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_itr_type ON itr_filings(itr_type);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_assessment_year ON itr_filings(assessment_year);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_user_status ON itr_filings(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_ack_number ON itr_filings(ack_number);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_created_at ON itr_filings(created_at);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_previous_year_queries ON itr_filings(user_id, assessment_year, status);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_regime ON itr_filings(regime);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_previous_year_filing_id ON itr_filings(previous_year_filing_id);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_json_payload_gin ON itr_filings USING gin(json_payload);
      CREATE INDEX IF NOT EXISTS idx_itr_filings_tax_computation_gin ON itr_filings USING gin(tax_computation)
    `);

      // Add comments (only if columns exist)
      try {
        await sequelize.query(`
          COMMENT ON TABLE itr_filings IS 'Stores ITR filing records for all ITR types (1-4)';
          COMMENT ON COLUMN itr_filings.user_id IS 'User who owns this filing';
          COMMENT ON COLUMN itr_filings.member_id IS 'For family/friend profiles - links to family_members table';
          COMMENT ON COLUMN itr_filings.itr_type IS 'ITR form type: ITR-1, ITR-2, ITR-3, or ITR-4';
          COMMENT ON COLUMN itr_filings.assessment_year IS 'Assessment year (e.g., 2024-25)';
          COMMENT ON COLUMN itr_filings.status IS 'Filing status: draft, submitted, acknowledged, processed, rejected, or paused';
          COMMENT ON COLUMN itr_filings.json_payload IS 'Complete form data for all sections (JSONB for efficient querying) - supports all ITR types';
          COMMENT ON COLUMN itr_filings.submitted_at IS 'Timestamp when filing was submitted';
          COMMENT ON COLUMN itr_filings.acknowledgment_number IS 'ITR-V acknowledgment number after submission';
          COMMENT ON COLUMN itr_filings.regime IS 'Tax regime selected: old or new';
          COMMENT ON COLUMN itr_filings.tax_computation IS 'Stored tax computation result with breakdown for both regimes';
          COMMENT ON COLUMN itr_filings.previous_year_filing_id IS 'Reference to previous year filing for copy feature';
          COMMENT ON COLUMN itr_filings.shared_with IS 'Array of draft sharing records for collaboration'
        `);
      } catch (commentError) {
        console.warn('⚠️  Some comments could not be added (non-critical):', commentError.message);
      }

    // Create itr_drafts table (child table)
    if (!itrDraftsExists) {
      console.log('Creating itr_drafts table...');
      await sequelize.query(`
        CREATE TABLE itr_drafts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filing_id UUID NOT NULL REFERENCES itr_filings(id) ON DELETE CASCADE,
          step VARCHAR(50) DEFAULT 'personal_info',
          data JSONB DEFAULT '{}',
          is_completed BOOLEAN NOT NULL DEFAULT false,
          last_saved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('✅ itr_drafts table created');
    } else {
      console.log('itr_drafts table already exists');
    }

    // Create indexes for itr_drafts
    console.log('Creating indexes for itr_drafts...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_itr_drafts_filing_id ON itr_drafts(filing_id);
      CREATE INDEX IF NOT EXISTS idx_itr_drafts_step ON itr_drafts(step);
      CREATE INDEX IF NOT EXISTS idx_itr_drafts_is_completed ON itr_drafts(is_completed);
      CREATE INDEX IF NOT EXISTS idx_itr_drafts_data_gin ON itr_drafts USING gin(data)
    `);

    // Add comments (only if columns exist)
    try {
      await sequelize.query(`
        COMMENT ON TABLE itr_drafts IS 'Stores draft data for ITR filings with section-based workflow';
        COMMENT ON COLUMN itr_drafts.filing_id IS 'Foreign key to itr_filings table';
        COMMENT ON COLUMN itr_drafts.step IS 'Current step in the filing process (e.g., personal_info, income, deductions)';
        COMMENT ON COLUMN itr_drafts.data IS 'Form data for all sections (JSONB for efficient querying and updates)';
        COMMENT ON COLUMN itr_drafts.is_completed IS 'Whether the draft is marked as completed';
        COMMENT ON COLUMN itr_drafts.last_saved_at IS 'Timestamp of last save operation'
      `);
    } catch (commentError) {
      console.warn('⚠️  Some comments could not be added (non-critical):', commentError.message);
    }

    // Verify foreign_assets table exists and has correct schema
    if (!foreignAssetsExists) {
      console.log('\n⚠️  foreign_assets table does not exist. This table is required for ITR-2 and ITR-3 Schedule FA.');
      console.log('   Please create it separately or it will be created when ForeignAsset model is synced.');
    } else {
      console.log('✅ foreign_assets table exists');
    }

    // Verify family_members table exists
    if (!familyMembersExists) {
      console.log('\n⚠️  family_members table does not exist. This table is required for filing for family members.');
      console.log('   Please create it separately or it will be created when FamilyMember model is synced.');
    } else {
      console.log('✅ family_members table exists');
    }

    enterpriseLogger.info('✅ ITR tables created successfully');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nTables verified/created:');
    console.log('  - itr_filings (with all columns and indexes)');
    console.log('  - itr_drafts (with indexes)');
    console.log('\nSchema supports all ITR types (ITR-1, ITR-2, ITR-3, ITR-4)');
    console.log('All ITR-specific data is stored in JSONB columns for flexibility.');
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
createITRTables();

