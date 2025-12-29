const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');
const AppError = require('../../utils/AppError');
const ErrorCodes = require('../../constants/ErrorCodes');
const { mapERIError } = require('../../utils/eriErrorMapper');
const forge = require('node-forge');
const fs = require('fs');

class ERIGatewayService {
    constructor() {
        this.baseUrl = process.env.ERI_BASE_URL || 'https://eri-sandbox.incometax.gov.in/api';
        this.apiKey = process.env.ERI_API_KEY;
        this.clientId = process.env.ERI_CLIENT_ID;
        this.clientSecret = process.env.ERI_CLIENT_SECRET;
        this.mode = process.env.ERI_MODE || 'SANDBOX'; // SANDBOX, PRODUCTION, MOCK
    }

    _maskPan(pan) {
        if (!pan) return 'N/A';
        return pan.substring(0, 5) + '****' + pan.substring(9);
    }

    /**
     * Sign Payload using PKCS#12 (CMS/PKCS#7)
     * @param {object} payload - The JSON payload to sign
     * @returns {string} - Base64 encoded PKCS#7 signature (Attached or Detached based on implementation)
     */
    signPayload(payload) {
        if (this.mode === 'MOCK' || this.mode === 'SANDBOX') {
            // Return mock signature for Sandbox if no keystore configured
            if (!process.env.ERI_KEYSTORE_PATH) {
                return 'MOCK_SIGNATURE_BASE64';
            }
        }

        try {
            const keystorePath = process.env.ERI_KEYSTORE_PATH;
            const keystorePassword = process.env.ERI_KEYSTORE_PASSWORD;

            if (!keystorePath || !keystorePassword) {
                throw new Error('ERI_KEYSTORE_PATH or ERI_KEYSTORE_PASSWORD not set');
            }

            const p12Buffer = fs.readFileSync(keystorePath);
            const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, keystorePassword);

            // Get Key and Cert
            const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag][0];

            const privateKey = keyBag.key;
            const certificate = certBag.cert;

            // Create PKCS#7 SignedData
            const p7 = forge.pkcs7.createSignedData();
            p7.content = forge.util.createBuffer(JSON.stringify(payload), 'utf8');
            p7.addCertificate(certificate);
            p7.addSigner({
                key: privateKey,
                certificate: certificate,
                digestAlgorithm: forge.pki.oids.sha256,
                authenticatedAttributes: [{
                    type: forge.pki.oids.contentType,
                    value: forge.pki.oids.data
                }, {
                    type: forge.pki.oids.messageDigest,
                    // value will be auto-calculated
                }, {
                    type: forge.pki.oids.signingTime,
                    // value will be auto-generated
                }]
            });
            p7.sign({ detached: true }); // Using detached signature often preferred for API logic where body is sent + signature header

            const pem = forge.pkcs7.messageToPem(p7);
            // Extract Body (Base64) from PEM-like structure or just DER
            const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
            return forge.util.encode64(der);

        } catch (error) {
            enterpriseLogger.error('CMS Signing Failed', { error: error.message });
            // In LIVE mode, this is critical. In Sandbox, we might fallback.
            if (this.mode === 'SANDBOX') return 'MOCK_SIGNATURE_FAIL_FALLBACK';
            throw new AppError(ErrorCodes.UPSTREAM_ERROR, 'Digital Signing Failed', 500, { cause: error.message });
        }
    }

    /**
     * Authenticate with ERI Gateway
     * @returns {Promise<string>} Access Token
     */
    async authenticate() {
        if (this.mode === 'MOCK') {
            return 'mock-access-token-uuid-v4';
        }

        try {
            const response = await axios.post(`${this.baseUrl}/auth/token`, {
                clientId: this.clientId,
                clientSecret: this.clientSecret
            });
            return response.data.accessToken;
        } catch (error) {
            enterpriseLogger.error('ERI Authentication Failed', { error: error.message });
            throw mapERIError(error);
        }
    }

    /**
     * Submit ITR JSON to ERI Gateway
     * @param {object} payload - The ITR JSON Payload
     * @param {string} itrType - ITR-1, ITR-2, etc.
     * @param {string} assessmentYear - 2024-25
     * @param {string} userId - For tracking
     * @returns {Promise<object>} { ackNumber, status, errors }
     */
    async submitReturn(payload, itrType, assessmentYear, userId) {
        enterpriseLogger.info('Initiating ERI Submission', {
            mode: this.mode,
            itrType,
            userId
        });

        if (this.mode === 'MOCK') {
            return this._mockSubmission(itrType, userId);
        }

        try {
            const token = await this.authenticate();

            // Sign the payload
            const signature = this.signPayload(payload);

            const response = await axios.post(`${this.baseUrl}/v1/returns/submit`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-ITR-Type': itrType,
                    'X-Assessment-Year': assessmentYear,
                    'X-Correlation-ID': `SUB-${Date.now()}`,
                    'X-ERI-Signature': signature, // Transmit signature
                },
                timeout: 30000 // 30s timeout
            });

            const result = response.data;

            if (result.status === 'REJECTED') {
                throw new AppError(ErrorCodes.SUBMISSION_REJECTED, 'ITD Rejected the return', 400, {
                    errors: result.errors
                });
            }

            return {
                ackNumber: result.acknowledgementNumber,
                status: 'SUBMITTED',
                token: result.submissionToken,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            enterpriseLogger.error('ERI Submission Failed', {
                itrType,
                error: error.message,
                response: error.response?.data
            });

            throw mapERIError(error);
        }
    }

    /**
     * Validate PAN with ERI
     * @param {string} pan
     * @returns {Promise<object>}
     */
    async validatePAN(pan) {
        if (this.mode === 'MOCK') {
            return this.mockPanVerification(pan);
        }

        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.baseUrl}/pan/verify/${pan}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            enterpriseLogger.error('PAN validation failed', { pan: this._maskPan(pan), error: error.message });
            throw mapERIError(error);
        }
    }

    /**
     * Get Prefilled Data
     * @param {string} pan
     * @param {string} assessmentYear
     * @returns {Promise<object>}
     */
    async getPrefilledData(pan, assessmentYear) {
        if (this.mode === 'MOCK') {
            return this.mockPreviousItrData(pan, assessmentYear);
        }

        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.baseUrl}/itr/prefill/${pan}/${assessmentYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            enterpriseLogger.error('Prefilled data fetch failed', { pan: this._maskPan(pan), error: error.message });
            throw mapERIError(error);
        }
    }

    /**
     * Get Form 26AS
     * @param {string} pan
     * @param {string} assessmentYear
     * @returns {Promise<object>}
     */
    async getForm26AS(pan, assessmentYear) {
        if (this.mode === 'MOCK') {
            return { success: true, data: { tds: [] } }; // Placeholder mock
        }

        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.baseUrl}/tax-credit/26as/${pan}/${assessmentYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            enterpriseLogger.error('Form 26AS fetch failed', { pan: this._maskPan(pan), error: error.message });
            throw mapERIError(error);
        }
    }

    /**
     * Get AIS
     * @param {string} pan
     * @param {string} assessmentYear
     * @returns {Promise<object>}
     */
    async getAIS(pan, assessmentYear) {
        if (this.mode === 'MOCK') {
            return { success: true, data: { incomes: [] } }; // Placeholder mock
        }

        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.baseUrl}/ais/${pan}/${assessmentYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            enterpriseLogger.error('AIS fetch failed', { pan: this._maskPan(pan), error: error.message });
            throw mapERIError(error);
        }
    }

    async downloadITRV(acknowledgmentNumber) {
        // Placeholder for now
        return { success: true, pdf: Buffer.from('Mock PDF'), filename: `ITR-V_${acknowledgmentNumber}.pdf` };
    }

    /**
     * Get Filing Status
     * @param {string} ackNumber
     * @returns {Promise<object>}
     */
    async getFilingStatus(ackNumber) {
        if (this.mode === 'MOCK') {
            return this.mockAcknowledgementFetch(ackNumber);
        }
        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.baseUrl}/itr/status/${ackNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, status: response.data.status, data: response.data };
        } catch (error) {
            enterpriseLogger.error('Filing status check failed', { ackNumber, error: error.message });
            throw mapERIError(error);
        }
    }

    async _mockSubmission(itrType) {
        // Simulate network delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Randomly fail 10% of requests to test error handling
                if (Math.random() < 0.1) {
                    reject(new AppError(ErrorCodes.UPSTREAM_ERROR, 'Simulated ERI Network Failure', 503));
                    return;
                }

                resolve({
                    ackNumber: `ACK-${Date.now()}-${itrType}`,
                    status: 'SUBMITTED',
                    token: `MOCK-TOKEN-${Math.random().toString(36).substring(7)}`,
                    timestamp: new Date().toISOString()
                });
            }, 1500);
        });
    }
}

module.exports = new ERIGatewayService();
