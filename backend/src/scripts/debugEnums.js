
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'burnblack_itr',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(dbConfig);

async function main() {
    const client = await pool.connect();
    try {
        console.log('Checking Enums...');

        // Check role enum
        const roles = await client.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_users_role'");
        console.log('Role Enum Values:', roles.rows.map(r => r.enumlabel));

        // Check auth_provider enum
        const auth = await client.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_users_auth_provider'");
        console.log('Auth Provider Enum Values:', auth.rows.map(r => r.enumlabel));

        // Check status enum
        const status = await client.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_users_status'");
        console.log('Status Enum Values:', status.rows.map(r => r.enumlabel));

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
