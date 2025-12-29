// =====================================================
// DATABASE SEED SCRIPT
// =====================================================

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
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

class DatabaseSeeder {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      enterpriseLogger.info('Database connection established for seeding');
      return client;
    } catch (error) {
      enterpriseLogger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  async seedUsers(client) {
    enterpriseLogger.info('Seeding users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);
    const caPassword = await bcrypt.hash('ca123', 12);

    const users = [
      {
        email: 'admin@burnblack.com',
        password_hash: adminPassword,
        role: 'SUPER_ADMIN',
        full_name: 'System Administrator',
        phone: '9999999999',
        status: 'active',
        email_verified: true,
        phone_verified: true,
      },
      {
        email: 'user@burnblack.com',
        password_hash: userPassword,
        role: 'END_USER',
        full_name: 'Test User',
        phone: '8888888888',
        status: 'active',
        email_verified: true,
        phone_verified: false,
      },
      {
        email: 'ca@burnblack.com',
        password_hash: caPassword,
        role: 'CA',
        full_name: 'Chartered Accountant',
        phone: '7777777777',
        status: 'active',
        email_verified: true,
        phone_verified: true,
      },
    ];

    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (email, password_hash, role, full_name, phone, status, email_verified, phone_verified, created_at, updated_at, auth_provider, onboarding_completed, token_version, id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), 'LOCAL', true, 0, $9)
          ON CONFLICT (email) DO NOTHING
        `, [
          user.email,
          user.password_hash,
          user.role,
          user.full_name,
          user.phone,
          user.status,
          user.email_verified,
          user.phone_verified,
          uuidv4(),
        ]);

        enterpriseLogger.info(`User seeded: ${user.email}`);
      } catch (error) {
        enterpriseLogger.error(`Failed to seed user: ${user.email}`, { error: error.message });
      }
    }
  }

  async seedTaxSlabs(client) {
    enterpriseLogger.info('Seeding tax slabs...');

    const taxSlabs = [
      {
        assessment_year: '2024-25',
        slabs: [
          { min_income: 0, max_income: 300000, tax_rate: 0, cess_rate: 0 },
          { min_income: 300001, max_income: 600000, tax_rate: 5, cess_rate: 4 },
          { min_income: 600001, max_income: 900000, tax_rate: 10, cess_rate: 4 },
          { min_income: 900001, max_income: 1200000, tax_rate: 15, cess_rate: 4 },
          { min_income: 1200001, max_income: 1500000, tax_rate: 20, cess_rate: 4 },
          { min_income: 1500001, max_income: null, tax_rate: 30, cess_rate: 4 },
        ],
      },
    ];

    // Create tax_slabs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_slabs (
        id SERIAL PRIMARY KEY,
        assessment_year VARCHAR(7) NOT NULL,
        slabs JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const taxSlab of taxSlabs) {
      try {
        await client.query(`
          INSERT INTO tax_slabs (assessment_year, slabs)
          VALUES ($1, $2)
          ON CONFLICT (assessment_year) DO UPDATE SET
            slabs = EXCLUDED.slabs,
            updated_at = CURRENT_TIMESTAMP
        `, [taxSlab.assessment_year, JSON.stringify(taxSlab.slabs)]);

        enterpriseLogger.info(`Tax slabs seeded for: ${taxSlab.assessment_year}`);
      } catch (error) {
        enterpriseLogger.error(`Failed to seed tax slabs: ${taxSlab.assessment_year}`, { error: error.message });
      }
    }
  }

  async seedValidationRules(client) {
    enterpriseLogger.info('Seeding validation rules...');

    const validationRules = [
      {
        itr_type: 'ITR-1',
        rules: {
          required_fields: ['pan', 'full_name', 'email', 'phone'],
          field_validations: {
            pan: { pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$', message: 'Invalid PAN format' },
            email: { pattern: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' },
            phone: { pattern: '^[0-9]{10}$', message: 'Phone must be 10 digits' },
          },
        },
      },
      {
        itr_type: 'ITR-2',
        rules: {
          required_fields: ['pan', 'full_name', 'email', 'phone'],
          field_validations: {
            pan: { pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$', message: 'Invalid PAN format' },
            email: { pattern: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' },
            phone: { pattern: '^[0-9]{10}$', message: 'Phone must be 10 digits' },
          },
        },
      },
    ];

    // Create validation_rules table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS validation_rules (
        id SERIAL PRIMARY KEY,
        itr_type VARCHAR(10) NOT NULL,
        rules JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const rule of validationRules) {
      try {
        await client.query(`
          INSERT INTO validation_rules (itr_type, rules)
          VALUES ($1, $2)
          ON CONFLICT (itr_type) DO UPDATE SET
            rules = EXCLUDED.rules,
            updated_at = CURRENT_TIMESTAMP
        `, [rule.itr_type, JSON.stringify(rule.rules)]);

        enterpriseLogger.info(`Validation rules seeded for: ${rule.itr_type}`);
      } catch (error) {
        enterpriseLogger.error(`Failed to seed validation rules: ${rule.itr_type}`, { error: error.message });
      }
    }
  }

  async seedSampleData(client) {
    enterpriseLogger.info('Seeding sample data...');

    // Get a test user
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['user@burnblack.com']);

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;

      // Create a sample ITR filing
      const filingResult = await client.query(`
        INSERT INTO itr_filings (user_id, itr_type, assessment_year, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [userId, 'ITR-1', '2024-25', 'draft']);

      const filingId = filingResult.rows[0].id;

      // Create sample draft
      await client.query(`
        INSERT INTO itr_drafts (filing_id, step, data, is_completed)
        VALUES ($1, $2, $3, $4)
      `, [
        filingId,
        'personal_info',
        JSON.stringify({
          pan: 'ABCDE1234F',
          full_name: 'Test User',
          email: 'user@burnblack.com',
          phone: '8888888888',
        }),
        true,
      ]);

      enterpriseLogger.info('Sample ITR filing and draft created');
    }
  }

  async runSeeding() {
    let client;

    try {
      client = await this.connect();

      // await client.query('BEGIN');

      await this.seedUsers(client);
      await this.seedTaxSlabs(client);
      await this.seedValidationRules(client);
      await this.seedSampleData(client);

      // await client.query('COMMIT');

      enterpriseLogger.info('Database seeding completed successfully');

    } catch (error) {
      if (client) {
        // await client.query('ROLLBACK');
      }
      enterpriseLogger.error('Database seeding failed', { error: error.message });
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
    enterpriseLogger.info('Starting database seeding process');

    const seeder = new DatabaseSeeder();
    await seeder.runSeeding();

    enterpriseLogger.info('Database seeding completed successfully');
    process.exit(0);

  } catch (error) {
    enterpriseLogger.error('Database seeding failed', { error: error.message });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseSeeder;
