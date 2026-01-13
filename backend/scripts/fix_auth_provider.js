/**
 * Quick fix script to update auth_provider for users who set passwords
 * Run: node backend/scripts/fix_auth_provider.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: console.log
    }
);

async function fixAuthProvider() {
    try {
        console.log('Checking for users with password but wrong auth_provider...');

        // Find users who have password_hash but auth_provider is still 'google'
        const [users] = await sequelize.query(`
            SELECT id, email, auth_provider, password_hash IS NOT NULL as has_password
            FROM users
            WHERE auth_provider = 'google' 
            AND password_hash IS NOT NULL
        `);

        console.log(`Found ${users.length} users to fix:`);
        console.log(JSON.stringify(users, null, 2));

        if (users.length > 0) {
            // Update auth_provider to 'local' for these users
            const [result] = await sequelize.query(`
                UPDATE users
                SET auth_provider = 'local'
                WHERE auth_provider = 'google' 
                AND password_hash IS NOT NULL
            `);

            console.log(`\n✅ Updated ${users.length} users to auth_provider='local'`);
            console.log('You can now login with email/password!');
        } else {
            console.log('No users need fixing.');
        }

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

fixAuthProvider();
