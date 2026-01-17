// =====================================================
// GSTIN SERVICE - SurePass GSTIN Advanced API Integration
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');

class GSTINService {
    constructor() {
        this.surepassApiKey = process.env.SUREPASS_API_KEY;
        this.surepassBaseUrl = process.env.SUREPASS_COMPREHENSIVE_BASE_URL || 'https://kyc-api.surepass.app/api/v1';

        if (!this.surepassApiKey) {
            enterpriseLogger.warn('GSTIN Service initialized without SurePass API key', {
                hasApiKey: false,
            });
        }

        enterpriseLogger.info('GSTIN Service initialized', {
            baseUrl: this.surepassBaseUrl,
            hasApiKey: !!this.surepassApiKey,
        });
    }

    /**
     * Validate GSTIN format
     * @param {string} gstin - GSTIN number to validate
     * @returns {boolean} - True if valid format
     */
    validateGSTINFormat(gstin) {
        if (!gstin || typeof gstin !== 'string') {
            return false;
        }

        // GSTIN format: 15 characters alphanumeric
        // Format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (Z by default) + 1 alphanumeric (checksum)
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin.toUpperCase());
    }

    /**
   * Lookup GSTIN details via SurePass API (with database caching)
   * @param {string} gstinNumber - GSTIN number to lookup
   * @param {string} userId - User ID making the request (for audit)
   * @returns {Promise<Object>} - GSTIN details from cache or SurePass
   */
    async lookupGSTIN(gstinNumber, userId = null) {
        try {
            // Validate GSTIN format
            if (!this.validateGSTINFormat(gstinNumber)) {
                enterpriseLogger.warn('Invalid GSTIN format', {
                    gstin: gstinNumber,
                    userId,
                });
                throw new Error('Invalid GSTIN format. Expected format: 27AAACR5055K2Z6');
            }

            const normalizedGSTIN = gstinNumber.toUpperCase();

            // Step 1: Check database cache first
            const GSTINLookup = require('../../models/GSTINLookup');
            const cachedLookup = await GSTINLookup.findByGSTIN(normalizedGSTIN);

            if (cachedLookup && !cachedLookup.isExpired()) {
                // Cache hit - increment lookup count and return cached data
                await cachedLookup.incrementLookupCount(userId);

                enterpriseLogger.info('GSTIN lookup from cache', {
                    gstin: normalizedGSTIN,
                    userId,
                    cacheAge: Math.floor((Date.now() - cachedLookup.createdAt.getTime()) / 1000 / 60 / 60), // hours
                    lookupCount: cachedLookup.lookupCount,
                });

                return {
                    success: true,
                    data: cachedLookup.apiResponse,
                    gstin: normalizedGSTIN,
                    timestamp: new Date().toISOString(),
                    source: 'CACHE',
                    cachedAt: cachedLookup.createdAt,
                    lookupCount: cachedLookup.lookupCount,
                };
            }

            // Step 2: Cache miss or expired - call SurePass API
            enterpriseLogger.info('GSTIN lookup from SurePass API', {
                gstin: normalizedGSTIN,
                userId,
                cacheStatus: cachedLookup ? 'expired' : 'not_found',
            });

            // Check if API key is available
            if (!this.surepassApiKey) {
                enterpriseLogger.error('SurePass API key missing for GSTIN lookup', {
                    gstin: normalizedGSTIN,
                    userId,
                });
                throw new Error('GSTIN lookup service is not configured. Please contact administrator.');
            }

            // Call SurePass GSTIN Advanced API
            const response = await axios.post(
                `${this.surepassBaseUrl}/corporate/gstin-advanced`,
                {
                    id_number: normalizedGSTIN,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.surepassApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000, // 30 second timeout
                }
            );

            enterpriseLogger.info('SurePass GSTIN API response received', {
                gstin: normalizedGSTIN,
                userId,
                statusCode: response.status,
                success: response.data?.success,
            });

            // Step 3: Save response to database
            await GSTINLookup.createOrUpdate(
                normalizedGSTIN,
                response.data,
                true, // success
                userId,
                null // no error
            );

            // Return the response
            return {
                success: true,
                data: response.data,
                gstin: normalizedGSTIN,
                timestamp: new Date().toISOString(),
                source: 'SUREPASS_API',
            };

        } catch (error) {
            // Handle different error types
            if (error.response) {
                // API returned an error response
                const statusCode = error.response.status;
                const errorData = error.response.data;

                enterpriseLogger.error('SurePass GSTIN API error response', {
                    gstin: gstinNumber,
                    userId,
                    statusCode,
                    errorData,
                });

                // Save failed lookup to database for audit
                try {
                    const GSTINLookup = require('../../models/GSTINLookup');
                    await GSTINLookup.createOrUpdate(
                        gstinNumber.toUpperCase(),
                        errorData,
                        false, // not successful
                        userId,
                        errorData?.message || errorData?.error || 'API error'
                    );
                } catch (dbError) {
                    enterpriseLogger.error('Failed to save error to database', {
                        gstin: gstinNumber,
                        error: dbError.message,
                    });
                }

                if (statusCode === 401) {
                    throw new Error('Invalid API credentials. Please contact administrator.');
                } else if (statusCode === 400) {
                    const message = errorData?.message || errorData?.error || 'Invalid GSTIN number';
                    throw new Error(message);
                } else if (statusCode === 404) {
                    throw new Error('GSTIN not found in records');
                } else if (statusCode >= 500) {
                    throw new Error('GSTIN lookup service is temporarily unavailable. Please try again later.');
                } else {
                    throw new Error(errorData?.message || 'Failed to lookup GSTIN');
                }
            } else if (error.request) {
                // Request was made but no response received
                enterpriseLogger.error('SurePass GSTIN API request failed (network/timeout)', {
                    gstin: gstinNumber,
                    userId,
                    error: error.message,
                });
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                // Error in request setup or validation
                enterpriseLogger.error('GSTIN lookup error', {
                    gstin: gstinNumber,
                    userId,
                    error: error.message,
                });
                throw error;
            }
        }
    }
    /**
     * Get service health status
     * @returns {Object} - Service health information
     */
    getHealthStatus() {
        return {
            service: 'GSTIN Lookup',
            configured: !!this.surepassApiKey,
            baseUrl: this.surepassBaseUrl,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = new GSTINService();
