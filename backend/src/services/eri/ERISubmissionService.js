// =====================================================
// ERI SUBMISSION SERVICE (S21)
// Pure adapter - no DB writes, no state changes
// Input: snapshot, Output: deterministic outcome
// =====================================================

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const forge = require('node-forge');
const enterpriseLogger = require('../../utils/logger');

class ERISubmissionService {
    /**
     * Submit filing snapshot to ERI
     * Pure function - no side effects
     * @param {Object} snapshot - Immutable snapshot from FilingSnapshotService
     * @returns {Promise<Object>} { outcome, referenceId?, errorCode?, errorMessage? }
     */
    static async submit(snapshot) {
        const mode = process.env.ERI_MODE || 'stub';

        enterpriseLogger.info('ERI submission attempt', {
            mode,
            taxpayerPan: snapshot.taxpayerPan,
            assessmentYear: snapshot.assessmentYear,
            trigger: snapshot.trigger
        });

        if (mode === 'stub') {
            return this._submitStub(snapshot);
        } else if (mode === 'live') {
            return this._submitLive(snapshot);
        } else {
            throw new Error(`Invalid ERI_MODE: ${mode}. Must be 'stub' or 'live'.`);
        }
    }

    /**
     * Stub mode submission (deterministic outcomes for testing)
     * @private
     */
    static async _submitStub(snapshot) {
        // Rules:
        // - PAN ends with 'P': SUCCESS
        // - PAN ends with 'F': TERMINAL_FAILURE
        // - All others: RETRYABLE_FAILURE
        const pan = snapshot.taxpayerPan || '';
        const lastChar = pan.slice(-1).toUpperCase();

        if (!lastChar) {
            return {
                outcome: 'TERMINAL_FAILURE',
                errorCode: 'INVALID_PAN',
                errorMessage: 'PAN missing in snapshot'
            };
        }

        // Deterministic outcomes for testing
        if (lastChar === 'P') {
            const referenceId = `ERI_ACK_${Date.now()}_${pan.slice(-4)}`;
            enterpriseLogger.info('ERI submission successful (stub)', { referenceId });

            return {
                outcome: 'SUCCESS',
                referenceId
            };
        }

        if (lastChar === 'F') {
            enterpriseLogger.error('ERI submission terminal failure (stub)', {
                errorCode: 'ERI_REJECTED'
            });

            return {
                outcome: 'TERMINAL_FAILURE',
                errorCode: 'ERI_REJECTED',
                errorMessage: 'Submission rejected by ERI - validation failed'
            };
        }

        // Default: retryable failure
        enterpriseLogger.warn('ERI submission retryable failure (stub)', {
            errorCode: 'ERI_TIMEOUT'
        });

        return {
            outcome: 'RETRYABLE_FAILURE',
            errorCode: 'ERI_TIMEOUT',
            errorMessage: 'Temporary ERI timeout - will retry'
        };
    }

    /**
     * Live mode submission (infrastructure-authenticated)
     * @private
     */
    static async _submitLive(snapshot) {
        try {
            // Validate required environment variables
            this._validateLiveConfig();

            // Build payload
            const payload = this.buildPayload(snapshot);

            // Create HTTPS agent with mutual TLS
            const agent = this._createTLSAgent();

            // Send request
            const response = await this._sendRequest(payload, agent);

            // Parse response into semantic outcome
            return this._parseResponse(response);

        } catch (error) {
            enterpriseLogger.error('ERI live submission error', {
                error: error.message,
                code: error.code
            });

            // Classify error
            if (this._isRetryableError(error)) {
                return {
                    outcome: 'RETRYABLE_FAILURE',
                    errorCode: error.code || 'ERI_NETWORK_ERROR',
                    errorMessage: error.message
                };
            } else {
                return {
                    outcome: 'TERMINAL_FAILURE',
                    errorCode: error.code || 'ERI_FATAL_ERROR',
                    errorMessage: error.message
                };
            }
        }
    }

    /**
     * Validate live mode configuration
     * @private
     */
    static _validateLiveConfig() {
        const required = [
            'ERI_USERNAME',
            'ERI_SECRET',
            'ERI_CERT_PATH',
            'ERI_KEY_PATH',
            'ERI_CA_CHAIN',
            'ERI_ENDPOINT',
            'ERI_PRIVATE_KEY_PATH',
            'ERI_CERT_CHAIN_PATH',
            'ERI_AES_SECRET'
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(
                `Missing required ERI live mode configuration: ${missing.join(', ')}`
            );
        }

        // Validate certificate files exist
        const certFiles = [
            process.env.ERI_CERT_PATH,
            process.env.ERI_KEY_PATH,
            process.env.ERI_CA_CHAIN,
            process.env.ERI_PRIVATE_KEY_PATH,
            process.env.ERI_CERT_CHAIN_PATH
        ];

        certFiles.forEach(path => {
            if (!fs.existsSync(path)) {
                throw new Error(`Certificate file not found: ${path}`);
            }
        });

        // Validate AES secret is 32 bytes for AES-256
        if (Buffer.from(process.env.ERI_AES_SECRET, 'utf8').length !== 32) {
            throw new Error('ERI_AES_SECRET must be exactly 32 bytes for AES-256');
        }
    }

    /**
     * Create HTTPS agent with mutual TLS
     * @private
     */
    static _createTLSAgent() {
        return new https.Agent({
            cert: fs.readFileSync(process.env.ERI_CERT_PATH),
            key: fs.readFileSync(process.env.ERI_KEY_PATH),
            ca: fs.readFileSync(process.env.ERI_CA_CHAIN),
            rejectUnauthorized: true
        });
    }

    /**
     * Send HTTPS request to ERI
     * @private
     */
    static async _sendRequest(payload, agent) {
        return new Promise((resolve, reject) => {
            // Build plain payload JSON
            const payloadJson = JSON.stringify(payload);

            // Encrypt password
            const encryptedPassword = this._encryptPassword(process.env.ERI_SECRET);

            // Add encrypted password to payload
            const payloadWithEncryptedPwd = {
                ...payload,
                password: encryptedPassword,
                eriUserId: process.env.ERI_USERNAME
            };

            const finalPayloadJson = JSON.stringify(payloadWithEncryptedPwd);

            // Sign payload
            const signedData = this._signPayload(finalPayloadJson);

            // Build ERI request format: { sign, data, eriUserId }
            const eriRequest = {
                sign: signedData,
                data: Buffer.from(finalPayloadJson).toString('base64'),
                eriUserId: process.env.ERI_USERNAME
            };

            const postData = JSON.stringify(eriRequest);

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                agent,
                timeout: 30000 // 30 second timeout
            };

            const req = https.request(process.env.ERI_ENDPOINT, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve({ statusCode: res.statusCode, body: response });
                    } catch (error) {
                        reject(new Error(`Invalid JSON response from ERI: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('ERI request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Parse ERI response into semantic outcome
     * @private
     */
    static _parseResponse(response) {
        const { statusCode, body } = response;

        // Success: 200 with acknowledgment number
        if (statusCode === 200 && body.acknowledgmentNumber) {
            enterpriseLogger.info('ERI submission successful (live)', {
                referenceId: body.acknowledgmentNumber
            });

            return {
                outcome: 'SUCCESS',
                referenceId: body.acknowledgmentNumber
            };
        }

        // Terminal failures: 400-level errors (validation, invalid PAN, etc.)
        if (statusCode >= 400 && statusCode < 500) {
            enterpriseLogger.error('ERI submission terminal failure (live)', {
                statusCode,
                errorCode: body.errorCode,
                errorMessage: body.errorMessage
            });

            return {
                outcome: 'TERMINAL_FAILURE',
                errorCode: body.errorCode || 'ERI_VALIDATION_ERROR',
                errorMessage: body.errorMessage || 'Validation failed'
            };
        }

        // Retryable failures: 500-level errors (server issues, timeouts)
        enterpriseLogger.warn('ERI submission retryable failure (live)', {
            statusCode,
            errorCode: body.errorCode
        });

        return {
            outcome: 'RETRYABLE_FAILURE',
            errorCode: body.errorCode || 'ERI_SERVER_ERROR',
            errorMessage: body.errorMessage || 'Server error - will retry'
        };
    }

    /**
     * Determine if error is retryable
     * @private
     */
    static _isRetryableError(error) {
        const retryableCodes = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'ENOTFOUND',
            'EAI_AGAIN'
        ];

        return retryableCodes.includes(error.code);
    }

    /**
     * Sign payload using CMS/PKCS#7
     * @private
     * @param {string} payloadJson - JSON string to sign
     * @returns {string} Base64-encoded CMS signed data
     */
    static _signPayload(payloadJson) {
        try {
            // Load private key and certificate
            const privateKeyPem = fs.readFileSync(process.env.ERI_PRIVATE_KEY_PATH, 'utf8');
            const certChainPem = fs.readFileSync(process.env.ERI_CERT_CHAIN_PATH, 'utf8');

            const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
            const cert = forge.pki.certificateFromPem(certChainPem);

            // Create PKCS#7 signed data
            const p7 = forge.pkcs7.createSignedData();
            p7.content = forge.util.createBuffer(payloadJson, 'utf8');
            p7.addCertificate(cert);
            p7.addSigner({
                key: privateKey,
                certificate: cert,
                digestAlgorithm: forge.pki.oids.sha256,
                authenticatedAttributes: [
                    {
                        type: forge.pki.oids.contentType,
                        value: forge.pki.oids.data
                    },
                    {
                        type: forge.pki.oids.messageDigest
                    },
                    {
                        type: forge.pki.oids.signingTime,
                        value: new Date()
                    }
                ]
            });

            p7.sign();

            // Convert to DER format and base64 encode
            const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
            return Buffer.from(der, 'binary').toString('base64');
        } catch (error) {
            enterpriseLogger.error('ERI payload signing error', {
                error: error.message
            });
            throw new Error(`Failed to sign payload: ${error.message}`);
        }
    }

    /**
     * Encrypt password using AES-256-ECB
     * @private
     * @param {string} password - Password to encrypt
     * @returns {string} Base64-encoded encrypted password
     */
    static _encryptPassword(password) {
        try {
            const secretKey = Buffer.from(process.env.ERI_AES_SECRET, 'utf8');
            const cipher = crypto.createCipheriv('aes-256-ecb', secretKey, null);
            const encrypted = Buffer.concat([
                cipher.update(password, 'utf8'),
                cipher.final()
            ]);
            return encrypted.toString('base64');
        } catch (error) {
            enterpriseLogger.error('ERI password encryption error', {
                error: error.message
            });
            throw new Error(`Failed to encrypt password: ${error.message}`);
        }
    }

    /**
     * Build ERI payload from snapshot
     * @param {Object} snapshot
     * @returns {Object} ERI-formatted payload
     */
    static buildPayload(snapshot) {
        // S21: Build ERI-compliant payload
        // This format will be refined based on actual ERI specification
        return {
            pan: snapshot.taxpayerPan,
            assessmentYear: snapshot.assessmentYear,
            formType: snapshot.formType || 'ITR-1',
            filingData: snapshot.jsonPayload,
            submittedAt: new Date().toISOString()
        };
    }
}

module.exports = ERISubmissionService;
