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

async function checkUser() {
    const pool = new Pool(dbConfig);
    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        const email = 'user123@burnblack.com';

        // Check if user exists
        const res = await client.query('SELECT id, email, role, status, email_verified, pan_verified, created_at, updated_at FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('User Found:', JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('User NOT Found: ' + email);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
