// =====================================================
// DATABASE RESET SCRIPT
// =====================================================

const { Pool } = require('pg');
const enterpriseLogger = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'burnblack_itr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

class DatabaseResetter {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      enterpriseLogger.info('Database connection established for reset');
      return client;
    } catch (error) {
      enterpriseLogger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  async dropAllTables(client) {
    enterpriseLogger.info('Dropping all tables...');

    const tables = [
      'migrations',
      'itr_drafts',
      'itr_filings',
      'documents',
      'notifications',
      'sessions',
      'tax_slabs',
      'validation_rules',
      'users',
    ];

    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        enterpriseLogger.info(`Dropped table: ${table}`);
      } catch (error) {
        enterpriseLogger.warn(`Failed to drop table ${table}:`, { error: error.message });
      }
    }
  }

  async dropAllFunctions(client) {
    enterpriseLogger.info('Dropping all functions...');

    try {
      await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
      enterpriseLogger.info('Dropped function: update_updated_at_column');
    } catch (error) {
      enterpriseLogger.warn('Failed to drop function:', { error: error.message });
    }
  }

  async dropAllTypes(client) {
    enterpriseLogger.info('Dropping all custom types...');

    const types = [
      'user_role',
      'user_status',
      'itr_type',
      'filing_status',
      'draft_step',
      'notification_priority',
    ];

    for (const type of types) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${type} CASCADE`);
        enterpriseLogger.info(`Dropped type: ${type}`);
      } catch (error) {
        enterpriseLogger.warn(`Failed to drop type ${type}:`, { error: error.message });
      }
    }
  }

  async resetDatabase() {
    let client;

    try {
      client = await this.connect();

      await client.query('BEGIN');

      // Drop all tables, functions, and types
      await this.dropAllTables(client);
      await this.dropAllFunctions(client);
      await this.dropAllTypes(client);

      await client.query('COMMIT');

      enterpriseLogger.info('Database reset completed successfully');

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      enterpriseLogger.error('Database reset failed', { error: error.message });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
      await this.pool.end();
    }
  }
}

// Main execution
async function main() {
  try {
    enterpriseLogger.info('Starting database reset process');

    // Confirm reset in production
    if (process.env.NODE_ENV === 'production') {
      enterpriseLogger.error('Database reset is not allowed in production environment');
      process.exit(1);
    }

    const resetter = new DatabaseResetter();
    await resetter.resetDatabase();

    enterpriseLogger.info('Database reset completed successfully');
    enterpriseLogger.info('Run "npm run db:migrate" to recreate the schema');
    enterpriseLogger.info('Run "npm run db:seed" to populate with initial data');

    process.exit(0);

  } catch (error) {
    enterpriseLogger.error('Database reset failed', { error: error.message });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseResetter;
