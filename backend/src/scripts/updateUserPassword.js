
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
        console.log('Updating Password...');
        const hashed = await bcrypt.hash('Password@123', 12);
        const res = await client.query("UPDATE users SET password_hash = $1 WHERE email = 'user@burnblack.com'", [hashed]);
        console.log('Updated rows:', res.rowCount);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
