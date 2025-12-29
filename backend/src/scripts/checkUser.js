
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
        console.log('Checking User...');
        const res = await client.query("SELECT id, email, password_hash, role, status, auth_provider FROM users WHERE email = 'user@burnblack.com'");
        if (res.rows.length === 0) {
            console.log('User NOT FOUND');
        } else {
            console.log('User FOUND:', res.rows[0]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
