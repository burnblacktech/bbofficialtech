const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'burnblack_itr',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function createTestUser() {
    const pool = new Pool(dbConfig);
    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        const email = 'user@burnblack.com';
        const passwordRaw = 'user123';
        const passwordHash = await bcrypt.hash(passwordRaw, 12);

        // Check if user exists
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            console.log('User exists. Updating password...');
            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
            console.log('Password updated.');
        } else {
            console.log('User does not exist. Creating...');
            await client.query(`
           INSERT INTO users (email, password_hash, role, full_name, phone, status, email_verified, phone_verified, created_at, updated_at, auth_provider, onboarding_completed, token_version, id)
           VALUES ($1, $2, 'END_USER', 'Test User', '8888888888', 'active', true, false, NOW(), NOW(), 'LOCAL', true, 0, $3)
        `, [email, passwordHash, uuidv4()]);
            console.log('User created.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

createTestUser();
