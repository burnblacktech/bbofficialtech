
const axios = require('axios');
require('dotenv').config();

async function test() {
    try {
        const baseURL = 'http://localhost:3002/api';

        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'user@burnblack.com',
            password: 'Password@123'
        });

        const token = loginRes.data.accessToken;
        console.log('Login Success. Token length:', token.length);

        // 2. Verify PAN
        console.log('Verifying PAN...');
        const panRes = await axios.post(`${baseURL}/itr/pan/verify`, {
            pan: 'ABCDE1234F',
            memberType: 'self'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('PAN Verification Response:', JSON.stringify(panRes.data, null, 2));

    } catch (err) {
        console.error('Error Details:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Message:', err.message);
            console.error('Stack:', err.stack);
        }
    }
}

test();
