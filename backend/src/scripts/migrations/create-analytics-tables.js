// =====================================================
// MIGRATION: Create analytics tables (Financial Snapshots, Milestones, Insights)
// =====================================================
// Run this script to create the tables needed for analytics and financial storytelling
// Usage: node src/scripts/migrations/create-analytics-tables.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function createAnalyticsTables() {
    try {
        enterpriseLogger.info('Creating analytics tables...');
        console.log('\n=== Creating Analytics Tables ===\n');

        // 1. FINANCIAL SNAPSHOTS
        const [snapshotsTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'financial_snapshots'
    `);

        if (snapshotsTable.length === 0) {
            console.log('Creating financial_snapshots table...');
            await sequelize.query(`
        CREATE TABLE financial_snapshots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          filing_id UUID NOT NULL REFERENCES itr_filings(id) ON DELETE CASCADE,
          assessment_year TEXT NOT NULL,
          
          total_income DECIMAL(15, 2) DEFAULT 0,
          salary_income DECIMAL(15, 2) DEFAULT 0,
          business_income DECIMAL(15, 2) DEFAULT 0,
          rental_income DECIMAL(15, 2) DEFAULT 0,
          capital_gains DECIMAL(15, 2) DEFAULT 0,
          other_income DECIMAL(15, 2) DEFAULT 0,
          
          total_tax_paid DECIMAL(15, 2) DEFAULT 0,
          tds_paid DECIMAL(15, 2) DEFAULT 0,
          advance_tax_paid DECIMAL(15, 2) DEFAULT 0,
          effective_tax_rate DECIMAL(5, 2) DEFAULT 0,
          
          total_deductions DECIMAL(15, 2) DEFAULT 0,
          section_80c DECIMAL(15, 2) DEFAULT 0,
          section_80d DECIMAL(15, 2) DEFAULT 0,
          
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, assessment_year)
        )
      `);
            await sequelize.query(`CREATE INDEX idx_financial_snapshots_user_id ON financial_snapshots(user_id)`);
            console.log('✅ financial_snapshots table created');
        } else {
            console.log('financial_snapshots table already exists');
        }

        // 2. FINANCIAL MILESTONES
        const [milestonesTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'financial_milestones'
    `);

        if (milestonesTable.length === 0) {
            console.log('Creating financial_milestones table...');
            await sequelize.query(`
        CREATE TABLE financial_milestones (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          milestone_type TEXT NOT NULL,
          milestone_date DATE NOT NULL,
          amount DECIMAL(15, 2),
          description TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
            await sequelize.query(`CREATE INDEX idx_financial_milestones_user_date ON financial_milestones(user_id, milestone_date)`);
            await sequelize.query(`CREATE INDEX idx_financial_milestones_type ON financial_milestones(milestone_type)`);
            console.log('✅ financial_milestones table created');
        } else {
            console.log('financial_milestones table already exists');
        }

        // 3. USER INSIGHTS
        const [insightsTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_insights'
    `);

        if (insightsTable.length === 0) {
            console.log('Creating user_insights table...');
            await sequelize.query(`
        CREATE TABLE user_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assessment_year TEXT,
          insight_type TEXT NOT NULL,
          insight_text TEXT NOT NULL,
          priority INTEGER DEFAULT 5,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
            await sequelize.query(`CREATE INDEX idx_user_insights_user_year ON user_insights(user_id, assessment_year)`);
            await sequelize.query(`CREATE INDEX idx_user_insights_type ON user_insights(insight_type)`);
            await sequelize.query(`CREATE INDEX idx_user_insights_priority ON user_insights(priority)`);
            console.log('✅ user_insights table created');
        } else {
            console.log('user_insights table already exists');
        }

        console.log('\n✅ Analytics migration completed successfully!\n');
        enterpriseLogger.info('Analytics tables migration completed');

    } catch (error) {
        console.error('\n❌ Analytics migration failed:', error.message);
        enterpriseLogger.error('Analytics tables migration failed', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

if (require.main === module) {
    createAnalyticsTables()
        .then(async () => {
            await sequelize.close();
            process.exit(0);
        })
        .catch(async (error) => {
            await sequelize.close();
            process.exit(1);
        });
}

module.exports = createAnalyticsTables;
