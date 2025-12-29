const { sequelize } = require('./src/config/database');

async function createAuditTable() {
    try {
        console.log('Creating audit_events table...');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS audit_events (
                id UUID PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                actor_id VARCHAR(255),
                actor_role VARCHAR(50),
                payload JSONB,
                ip_address VARCHAR(50),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Indexes
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);`);

        console.log('✅ audit_events table ready.');
    } catch (e) {
        console.error('Failed to create table', e);
    }
}

createAuditTable();
