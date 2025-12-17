// =====================================================
// MIGRATION: Create service_ticket_number_seq
// Used to generate unique, sequential ServiceTicket.ticketNumber values (TK000001...)
// Usage: node src/scripts/migrations/create-service-ticket-number-sequence.js
// =====================================================

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function createServiceTicketNumberSequence() {
  try {
    enterpriseLogger.info('Starting migration: create service_ticket_number_seq');
    console.log('\n=== Migration: Create service_ticket_number_seq ===\n');

    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'S'
            AND c.relname = 'service_ticket_number_seq'
            AND n.nspname = 'public'
        ) THEN
          CREATE SEQUENCE public.service_ticket_number_seq START 1;
        END IF;
      END
      $$;
    `);

    console.log('✅ Sequence ensured: public.service_ticket_number_seq');

    console.log('\n✅ Migration completed successfully.\n');
  } catch (error) {
    enterpriseLogger.error('Migration failed: create service_ticket_number_seq', { error: error.message });
    console.error('\n❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
  }
}

createServiceTicketNumberSequence();


