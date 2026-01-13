// =====================================================
// MIGRATION: CREATE FINANCIAL ANALYTICS TABLES
// Creates tables for financial storytelling features
// =====================================================

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create financial_snapshots table
        await queryInterface.createTable('financial_snapshots', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            filing_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'itr_filings',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            assessment_year: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },

            // Income breakdown
            total_income: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            salary_income: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            business_income: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            rental_income: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            capital_gains: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            other_income: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },

            // Tax details
            total_tax_paid: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            tds_paid: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            advance_tax_paid: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            effective_tax_rate: {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0,
            },

            // Deductions
            total_deductions: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            section_80c: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },
            section_80d: {
                type: Sequelize.DECIMAL(15, 2),
                defaultValue: 0,
            },

            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Create indexes for financial_snapshots
        await queryInterface.addIndex('financial_snapshots', ['user_id', 'assessment_year'], {
            unique: true,
            name: 'financial_snapshots_user_year_unique',
        });
        await queryInterface.addIndex('financial_snapshots', ['user_id'], {
            name: 'financial_snapshots_user_id_idx',
        });

        // Create financial_milestones table
        await queryInterface.createTable('financial_milestones', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            milestone_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            milestone_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Create indexes for financial_milestones
        await queryInterface.addIndex('financial_milestones', ['user_id', 'milestone_date'], {
            name: 'financial_milestones_user_date_idx',
        });
        await queryInterface.addIndex('financial_milestones', ['milestone_type'], {
            name: 'financial_milestones_type_idx',
        });

        // Create user_insights table
        await queryInterface.createTable('user_insights', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            assessment_year: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            insight_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            insight_text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            priority: {
                type: Sequelize.INTEGER,
                defaultValue: 5,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Create indexes for user_insights
        await queryInterface.addIndex('user_insights', ['user_id', 'assessment_year'], {
            name: 'user_insights_user_year_idx',
        });
        await queryInterface.addIndex('user_insights', ['insight_type'], {
            name: 'user_insights_type_idx',
        });
        await queryInterface.addIndex('user_insights', ['priority'], {
            name: 'user_insights_priority_idx',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('user_insights');
        await queryInterface.dropTable('financial_milestones');
        await queryInterface.dropTable('financial_snapshots');
    },
};
