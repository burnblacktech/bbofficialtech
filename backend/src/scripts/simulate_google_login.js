const { User } = require('../models');
const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const email = 'google_test_user_' + Date.now() + '@burnblack.com';

        // Create Mock Google User
        const user = await User.create({
            email: email,
            fullName: 'Google Test User',
            authProvider: 'GOOGLE',
            providerId: 'google-sub-' + Date.now(),
            role: 'END_USER',
            status: 'active',
            emailVerified: true,
            metadata: {
                // F1.2 Verification: Profile Picture persistence
                profile_picture: 'https://via.placeholder.com/150'
            }
        });

        console.log(`User Created: ${user.email} (${user.id})`);

        // Generate Token
        // Matches auth.js logic
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                tokenVersion: user.tokenVersion || 0,
            },
            process.env.JWT_SECRET || 'fallback-secret', // Default from auth.js
            { expiresIn: '1h' }
        );

        const fs = require('fs');
        fs.writeFileSync('token.txt', JSON.stringify({ token, userId: user.id }, null, 2));
        console.log('Token written to token.txt');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
