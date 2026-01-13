/**
 * Database Migration: Add ready_for_submission State
 * Adds new lifecycle state to support payment gate (S27)
 * 
 * Run: node backend/migrations/add_ready_for_submission_state.js
 */

// Load environment variables from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');
const enterpriseLogger = require('../src/utils/logger');

// Database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'burnblack',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => enterpriseLogger.debug(msg)
    }
);

async function migrate() {
    try {
        enterpriseLogger.info('Starting migration: Add ready_for_submission state');

        // Check if enum type exists
        const [enumCheck] = await sequelize.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM pg_type 
                WHERE typname = 'enum_itr_filings_lifecycle_state'
            ) as exists;
        `);

        if (!enumCheck[0].exists) {
            enterpriseLogger.warn('Enum type does not exist, creating from scratch');
            await sequelize.query(`
                CREATE TYPE enum_itr_filings_lifecycle_state AS ENUM (
                    'draft',
                    'ready_for_submission',
                    'review_pending',
                    'reviewed',
                    'approved_by_ca',
                    'submitted_to_eri',
                    'eri_in_progress',
                    'eri_success',
                    'eri_failed'
                );
            `);
        } else {
            // Check if ready_for_submission already exists
            const [valueCheck] = await sequelize.query(`
                SELECT EXISTS (
                    SELECT 1 
                    FROM pg_enum 
                    WHERE enumlabel = 'ready_for_submission'
                    AND enumtypid = (
                        SELECT oid 
                        FROM pg_type 
                        WHERE typname = 'enum_itr_filings_lifecycle_state'
                    )
                ) as exists;
            `);

            if (valueCheck[0].exists) {
                enterpriseLogger.info('ready_for_submission state already exists, skipping');
                return;
            }

            // Add new enum value
            await sequelize.query(`
                ALTER TYPE enum_itr_filings_lifecycle_state 
                ADD VALUE 'ready_for_submission' 
                AFTER 'draft';
            `);
        }

        enterpriseLogger.info('Successfully added ready_for_submission state');

        // Optional: Migrate existing filings
        // Filings in draft with tax liability > 0 and payment proof can be transitioned
        const [migrationResult] = await sequelize.query(`
            UPDATE itr_filings 
            SET lifecycle_state = 'ready_for_submission'
            WHERE lifecycle_state = 'draft' 
              AND tax_liability > 0 
              AND json_payload->'taxes_paid' IS NOT NULL
              AND (
                  json_payload->'taxes_paid'->'advanceTax' IS NOT NULL 
                  OR json_payload->'taxes_paid'->'selfAssessmentTax' IS NOT NULL
              );
        `);

        enterpriseLogger.info('Migration complete', {
            rowsUpdated: migrationResult.rowCount || 0
        });

    } catch (error) {
        enterpriseLogger.error('Migration failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run migration
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('✅ Migration successful');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        });
}

module.exports = migrate;
