/**
 * Database Migration: Add Income Sources and Deductions Tables
 * For dashboard financial overview and recommendations
 */

const { sequelize } = require('../config/database');
const { QueryInterface } = require('sequelize');

async function up() {
  console.log('Running migration: Add income sources and deductions tables...');

  const queryInterface = sequelize.getQueryInterface();

  try {
    // Create income_sources table
    await queryInterface.createTable('income_sources', {
      id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      filing_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'itr_filings',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      financial_year: {
        type: sequelize.Sequelize.STRING(10),
        allowNull: false,
      },
      source_type: {
        type: sequelize.Sequelize.STRING(50),
        allowNull: false,
      },
      source_data: {
        type: sequelize.Sequelize.JSONB,
        defaultValue: {},
      },
      amount: {
        type: sequelize.Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      data_source: {
        type: sequelize.Sequelize.STRING(20),
        defaultValue: 'MANUAL',
      },
      verified: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      },
      updated_at: {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      },
    });

    // Create indexes for income_sources
    await queryInterface.addIndex('income_sources', ['user_id'], {
      name: 'idx_income_sources_user_id',
    });
    await queryInterface.addIndex('income_sources', ['financial_year'], {
      name: 'idx_income_sources_financial_year',
    });
    await queryInterface.addIndex('income_sources', ['source_type'], {
      name: 'idx_income_sources_source_type',
    });
    await queryInterface.addIndex('income_sources', ['user_id', 'financial_year'], {
      name: 'idx_income_sources_user_year',
    });

    // Create deductions table
    await queryInterface.createTable('deductions', {
      id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      filing_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'itr_filings',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      financial_year: {
        type: sequelize.Sequelize.STRING(10),
        allowNull: false,
      },
      section: {
        type: sequelize.Sequelize.STRING(20),
        allowNull: false,
      },
      deduction_type: {
        type: sequelize.Sequelize.STRING(50),
        allowNull: false,
      },
      deduction_data: {
        type: sequelize.Sequelize.JSONB,
        defaultValue: {},
      },
      amount: {
        type: sequelize.Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      verified: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      },
      updated_at: {
        type: sequelize.Sequelize.DATE,
        defaultValue: sequelize.Sequelize.NOW,
      },
    });

    // Create indexes for deductions
    await queryInterface.addIndex('deductions', ['user_id'], {
      name: 'idx_deductions_user_id',
    });
    await queryInterface.addIndex('deductions', ['financial_year'], {
      name: 'idx_deductions_financial_year',
    });
    await queryInterface.addIndex('deductions', ['section'], {
      name: 'idx_deductions_section',
    });
    await queryInterface.addIndex('deductions', ['user_id', 'financial_year'], {
      name: 'idx_deductions_user_year',
    });

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  console.log('Rolling back migration: Remove income sources and deductions tables...');

  const queryInterface = sequelize.getQueryInterface();

  try {
    await queryInterface.dropTable('deductions');
    await queryInterface.dropTable('income_sources');

    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
