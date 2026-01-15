/**
 * Migration: Create Financial Data Capture Tables
 * Creates: documents, bank_accounts, financial_events, deductions
 * Updates: income_sources (add document tracking)
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Create documents table
        await queryInterface.createTable('documents', {
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            document_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'form16, insurance_receipt, rent_receipt, bank_statement, etc.',
            },
            file_path: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            file_name: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            file_size: {
                type: Sequelize.INTEGER,
                comment: 'File size in bytes',
            },
            mime_type: {
                type: Sequelize.STRING(100),
            },
            financial_year: {
                type: Sequelize.STRING(10),
                comment: 'e.g., 2024-25',
            },
            upload_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            ocr_status: {
                type: Sequelize.STRING(20),
                defaultValue: 'pending',
                comment: 'pending, processing, completed, failed',
            },
            ocr_data: {
                type: Sequelize.JSONB,
                comment: 'Extracted data from OCR',
            },
            linked_entity_type: {
                type: Sequelize.STRING(50),
                comment: 'income_source, deduction, etc.',
            },
            linked_entity_id: {
                type: Sequelize.UUID,
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add indexes for documents
        await queryInterface.addIndex('documents', ['user_id', 'financial_year']);
        await queryInterface.addIndex('documents', ['document_type']);
        await queryInterface.addIndex('documents', ['ocr_status']);

        // 2. Create bank_accounts table
        await queryInterface.createTable('bank_accounts', {
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            bank_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            account_number_encrypted: {
                type: Sequelize.TEXT,
                comment: 'Encrypted full account number',
            },
            account_number_last4: {
                type: Sequelize.STRING(4),
                comment: 'Last 4 digits for display',
            },
            ifsc_code: {
                type: Sequelize.STRING(11),
            },
            account_type: {
                type: Sequelize.STRING(20),
                comment: 'savings, current, etc.',
            },
            is_primary: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            is_verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            verification_method: {
                type: Sequelize.STRING(50),
                comment: 'penny_drop, statement, manual',
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add indexes for bank_accounts
        await queryInterface.addIndex('bank_accounts', ['user_id']);
        await queryInterface.addIndex('bank_accounts', ['user_id', 'is_primary']);

        // 3. Create financial_events table
        await queryInterface.createTable('financial_events', {
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            event_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'income_added, deduction_added, document_uploaded, etc.',
            },
            event_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            entity_type: {
                type: Sequelize.STRING(50),
                comment: 'income_source, deduction, document',
            },
            entity_id: {
                type: Sequelize.UUID,
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
            },
            description: {
                type: Sequelize.TEXT,
            },
            source: {
                type: Sequelize.STRING(50),
                comment: 'manual, ocr, api',
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add indexes for financial_events
        await queryInterface.addIndex('financial_events', ['user_id', 'event_date']);
        await queryInterface.addIndex('financial_events', ['event_type']);

        // 4. Create deductions table
        await queryInterface.createTable('deductions', {
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            section: {
                type: Sequelize.STRING(10),
                allowNull: false,
                comment: '80C, 80D, 80E, etc.',
            },
            deduction_type: {
                type: Sequelize.STRING(50),
                comment: 'LIC, PPF, Health Insurance, etc.',
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
            },
            financial_year: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            document_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'documents',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            source: {
                type: Sequelize.STRING(20),
                defaultValue: 'manual',
                comment: 'manual, ocr, api',
            },
            verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            verified_at: {
                type: Sequelize.DATE,
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add indexes for deductions
        await queryInterface.addIndex('deductions', ['user_id', 'financial_year']);
        await queryInterface.addIndex('deductions', ['section']);

        // 5. Update income_sources table (add document tracking columns)
        await queryInterface.addColumn('income_sources', 'document_id', {
            type: Sequelize.UUID,
            references: {
                model: 'documents',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        await queryInterface.addColumn('income_sources', 'source', {
            type: Sequelize.STRING(20),
            defaultValue: 'manual',
            comment: 'manual, ocr, api',
        });

        await queryInterface.addColumn('income_sources', 'verified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });

        await queryInterface.addColumn('income_sources', 'verified_at', {
            type: Sequelize.DATE,
        });

        console.log('✅ Financial data capture tables created successfully');
    },

    down: async (queryInterface, Sequelize) => {
        // Remove columns from income_sources
        await queryInterface.removeColumn('income_sources', 'verified_at');
        await queryInterface.removeColumn('income_sources', 'verified');
        await queryInterface.removeColumn('income_sources', 'source');
        await queryInterface.removeColumn('income_sources', 'document_id');

        // Drop tables in reverse order
        await queryInterface.dropTable('deductions');
        await queryInterface.dropTable('financial_events');
        await queryInterface.dropTable('bank_accounts');
        await queryInterface.dropTable('documents');

        console.log('✅ Financial data capture tables dropped');
    },
};
