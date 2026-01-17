#!/usr/bin/env node
// =====================================================
// CREATE GSTIN_LOOKUPS TABLE MIGRATION
// Creates the gstin_lookups table for caching GSTIN API responses
// =====================================================

require('dotenv').config();

const { sequelize } = require('../config/database');

async function createGSTINLookupsTable() {
    console.log('='.repeat(60));
    console.log('🔧 CREATE GSTIN_LOOKUPS TABLE');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('📊 Connecting to database...');

        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        console.log('');

        // Create the table
        console.log('🔄 Creating gstin_lookups table...');

        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS public.gstin_lookups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gstin VARCHAR(15) NOT NULL UNIQUE,
        api_response JSONB,
        success BOOLEAN NOT NULL DEFAULT false,
        error_message TEXT,
        source VARCHAR(20) NOT NULL DEFAULT 'SUREPASS_API',
        lookup_count INTEGER NOT NULL DEFAULT 1,
        last_looked_up_by UUID REFERENCES public.users(id),
        last_looked_up_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        console.log('✅ Table created successfully');
        console.log('');

        // Create indexes
        console.log('🔄 Creating indexes...');

        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_gstin_lookups_gstin ON public.gstin_lookups(gstin);
      CREATE INDEX IF NOT EXISTS idx_gstin_lookups_last_looked_up_by ON public.gstin_lookups(last_looked_up_by);
      CREATE INDEX IF NOT EXISTS idx_gstin_lookups_created_at ON public.gstin_lookups(created_at);
      CREATE INDEX IF NOT EXISTS idx_gstin_lookups_success ON public.gstin_lookups(success);
    `);

        console.log('✅ Indexes created successfully');
        console.log('');

        // Verify table creation
        const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'gstin_lookups';
    `);

        if (tables.length > 0) {
            console.log('✅ Table verification successful');
            console.log('');

            // Show table structure
            const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'gstin_lookups'
        ORDER BY ordinal_position;
      `);

            console.log('📋 Table Structure:');
            columns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        }

        console.log('');
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('💡 The GSTIN lookup service will now cache responses in the database');

    } catch (error) {
        console.error('');
        console.error('❌ Migration failed:', error.message);
        console.error('');
        if (error.original) {
            console.error('Database error:', error.original.message);
        }
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        try {
            await sequelize.close();
            console.log('🔌 Database connection closed');
        } catch (closeError) {
            console.error('⚠️  Warning: Error closing database connection:', closeError.message);
        }
    }
}

// Run the migration
if (require.main === module) {
    createGSTINLookupsTable()
        .then(() => {
            console.log('');
            console.log('👋 Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('');
            console.error('❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createGSTINLookupsTable };
