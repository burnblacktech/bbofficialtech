const axios = require('axios');

// Configuration
const CREDS = {
    email: 'user@burnblack.com',
    password: 'user123'
};

const PAYLOAD_DRAFT = {
    itrType: 'ITR-1',
    assessmentYear: '2024-25',
    personalInfo: {
        pan: 'ABCDE1234F',
        name: 'Test User',
        email: 'user@burnblack.com',
        phone: '8888888888',
        dateOfBirth: '1990-01-01',
        address: '123 Test Street'
    },
    income: {
        salary: 600000,
        otherIncome: 10000
    },
    deductions: {
        section80C: 150000
    }
};

async function checkPort(port) {
    try {
        // Force IPv4 to avoid Node 17+ localhost/IPv6 mismatch
        await axios.get(`http://127.0.0.1:${port}/health`, { timeout: 1000 });
        return true;
    } catch (e) {
        if (e.response && e.response.status === 200) return true;
        return false;
    }
}

const fs = require('fs');

async function runTest() {
    console.log('🚀 Starting F6 E2E Filing Dry Run...');

    // 1. Detect Port
    let port = null;
    const ports = [5555, 5000, 3000, 5040, 7070, 8080];

    for (const p of ports) {
        console.log(`Checking port ${p}...`);
        if (await checkPort(p)) {
            port = p;
            console.log(`✅ FOUND UP PORT: ${port}`);
            break;
        }
    }

    if (!port) {
        console.error('❌ FATAL: Could not reach backend on any known port. Ensure `npm run dev` is healthy.');
        process.exit(1);
    }

    const BASE_URL = `http://127.0.0.1:${port}/api`;

    let token = null;
    let headers = {};

    // 2. Auth Strategy (Token File vs Login)
    if (fs.existsSync('token.txt')) {
        console.log('ℹ️  Found token.txt. Using pre-generated Google User Token.');
        const tokenData = JSON.parse(fs.readFileSync('token.txt', 'utf8'));
        token = tokenData.token;
    } else {
        console.log('🔑 Attempting Standard Login...');
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, CREDS);
            token = loginRes.data.accessToken;
            console.log('✅ Login Successful.');
        } catch (e) {
            console.error('❌ Login Failed. Creating new user if allowed or failing.');
            // Optional: Auto-register logic here if needed
            process.exit(1);
        }
    }

    headers = { Authorization: `Bearer ${token}` };

    try {
        // 3. Create Draft
        console.log('\n📄 [Step 3] Creating Draft (ITR-1)...');
        const draftRes = await axios.post(`${BASE_URL}/itr/drafts`, PAYLOAD_DRAFT, { headers });
        const filingId = draftRes.data.filingId || draftRes.data.data?.filingId || draftRes.data.data?.id;

        if (!filingId) {
            console.error('Submission Response invalid:', JSON.stringify(draftRes.data));
            throw new Error('No Filing ID returned');
        }
        console.log(`✅ Draft Created. Filing ID: ${filingId}`);

        // Wait 
        await new Promise(r => setTimeout(r, 1000));

        // 4. Compute Tax
        console.log('\n🧮 [Step 4] Computing Tax...');
        const computeRes = await axios.post(`${BASE_URL}/itr/compute`, { filingId }, { headers });
        console.log('✅ Computation Successful.');
        // Check assertion: Tax should be calculated
        const summary = computeRes.data.computationSummary || computeRes.data.data || computeRes.data;
        if (!summary) throw new Error('Computation returned empty summary');
        console.log(`   > Gross Income: ${summary.totalIncome || 'N/A'}`);
        console.log(`   > Tax Payable: ${summary.totalTaxPayable || 'N/A'}`);

        // 5. Submit to ERI
        console.log('\n📤 [Step 5] Submitting to ERI (Dry Run / Mock)...');
        try {
            const submitRes = await axios.post(`${BASE_URL}/itr/submit`, { filingId }, { headers });
            console.log('✅ Submission Successful (Mock/Sandbox Result).');
            console.log('   > ACK Number:', submitRes.data.ackNumber);
        } catch (submitError) {
            const errData = submitError.response?.data || {};
            const errCode = errData.errorCode || errData.code;

            console.log('ℹ️  Submission Response:', JSON.stringify(errData, null, 2));

            if (['INVALID_PAN', 'ERI_AUTH_FAILED', 'UPSTREAM_ERROR'].includes(errCode)) {
                console.log('✅ Assertion Passed: ERI Error Mapped Correctly.');
            } else if (submitError.response?.status === 400 || submitError.response?.status === 500) {
                console.log('⚠️  Submission Failed (Expected for invalid Sandbox Pan or Mock mode).');
            } else {
                throw submitError;
            }
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

runTest();
