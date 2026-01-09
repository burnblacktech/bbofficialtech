// =====================================================
// EMPLOYER MANAGEMENT SERVICE (F1.2.2)
// Manages employer data within ITR filings
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const FilingFreezeService = require('./FilingFreezeService'); // S18

class EmployerManagementService {
    /**
     * Add employer to filing
     * @param {string} filingId - Filing ID
     * @param {object} employerData - Employer data
     * @returns {Promise<object>}
     */
    async addEmployer(filingId, employerData) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            // S18: Freeze guard - prevent mutations after draft
            FilingFreezeService.assertMutable(filing);

            // Initialize employers array if needed
            const jsonPayload = filing.jsonPayload || {};
            const income = jsonPayload.income || {};
            const salary = income.salary || {};
            const employers = salary.employers || [];

            // Validate employer data
            this.validateEmployerData(employerData);

            // Generate employer ID
            const employerId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Add employer
            const newEmployer = {
                id: employerId,
                name: employerData.name,
                workPeriod: {
                    from: employerData.workPeriodFrom, // Format: "2024-04"
                    to: employerData.workPeriodTo,     // Format: "2024-08"
                },
                gross: employerData.gross || 0,
                tds: employerData.tds || 0,
                form16Uploaded: employerData.form16Uploaded || false,
                form16Data: employerData.form16Data || null,
                tan: employerData.tan || null,
            };

            employers.push(newEmployer);

            // Update filing
            filing.jsonPayload = {
                ...jsonPayload,
                income: {
                    ...income,
                    salary: {
                        ...salary,
                        employers,
                    },
                },
            };

            // Mark jsonPayload as changed (required for Sequelize JSONB persistence)
            filing.changed('jsonPayload', true);

            await filing.save();

            enterpriseLogger.info('Employer added to filing', {
                filingId,
                employerId,
                employerName: employerData.name,
            });

            return {
                employer: newEmployer,
                totalEmployers: employers.length,
                hasOverlap: this.detectOverlap(employers),
            };
        } catch (error) {
            enterpriseLogger.error('Add employer failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Update employer details
     * @param {string} filingId - Filing ID
     * @param {string} employerId - Employer ID
     * @param {object} updates - Updated fields
     * @returns {Promise<object>}
     */
    async updateEmployer(filingId, employerId, updates) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const employers = filing.jsonPayload?.income?.salary?.employers || [];
            const employerIndex = employers.findIndex(e => e.id === employerId);

            if (employerIndex === -1) {
                throw new AppError('Employer not found', 404);
            }

            // Update employer
            employers[employerIndex] = {
                ...employers[employerIndex],
                ...updates,
                id: employerId, // Preserve ID
            };

            // Update filing
            filing.jsonPayload.income.salary.employers = employers;
            await filing.save();

            enterpriseLogger.info('Employer updated', {
                filingId,
                employerId,
            });

            return employers[employerIndex];
        } catch (error) {
            enterpriseLogger.error('Update employer failed', {
                filingId,
                employerId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Remove employer from filing
     * @param {string} filingId - Filing ID
     * @param {string} employerId - Employer ID
     * @returns {Promise<void>}
     */
    async removeEmployer(filingId, employerId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const employers = filing.jsonPayload?.income?.salary?.employers || [];
            const filteredEmployers = employers.filter(e => e.id !== employerId);

            if (filteredEmployers.length === employers.length) {
                throw new AppError('Employer not found', 404);
            }

            // Update filing
            filing.jsonPayload.income.salary.employers = filteredEmployers;
            await filing.save();

            enterpriseLogger.info('Employer removed', {
                filingId,
                employerId,
                remainingEmployers: filteredEmployers.length,
            });
        } catch (error) {
            enterpriseLogger.error('Remove employer failed', {
                filingId,
                employerId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Detect overlapping employment periods
     * @param {Array} employers - Array of employer objects
     * @returns {object} - Overlap details
     */
    detectOverlap(employers) {
        if (employers.length < 2) {
            return { hasOverlap: false };
        }

        const overlaps = [];

        for (let i = 0; i < employers.length; i++) {
            for (let j = i + 1; j < employers.length; j++) {
                const emp1 = employers[i];
                const emp2 = employers[j];

                const overlap = this.calculateOverlap(
                    emp1.workPeriod.from,
                    emp1.workPeriod.to,
                    emp2.workPeriod.from,
                    emp2.workPeriod.to
                );

                if (overlap.hasOverlap) {
                    overlaps.push({
                        employer1: emp1.name,
                        employer2: emp2.name,
                        months: overlap.months,
                    });
                }
            }
        }

        return {
            hasOverlap: overlaps.length > 0,
            overlaps,
        };
    }

    /**
     * Calculate overlap between two date ranges
     * @param {string} start1 - Format: "2024-04"
     * @param {string} end1 - Format: "2024-08"
     * @param {string} start2 - Format: "2024-09"
     * @param {string} end2 - Format: "2025-03"
     * @returns {object}
     */
    calculateOverlap(start1, end1, start2, end2) {
        const toDate = (str) => new Date(str + '-01');

        const s1 = toDate(start1);
        const e1 = toDate(end1);
        const s2 = toDate(start2);
        const e2 = toDate(end2);

        const overlapStart = s1 > s2 ? s1 : s2;
        const overlapEnd = e1 < e2 ? e1 : e2;

        if (overlapStart <= overlapEnd) {
            const months = [];
            let current = new Date(overlapStart);

            while (current <= overlapEnd) {
                months.push(current.toISOString().substr(0, 7)); // "2024-08"
                current.setMonth(current.getMonth() + 1);
            }

            return {
                hasOverlap: true,
                months,
            };
        }

        return { hasOverlap: false };
    }

    /**
     * Validate employer data
     * @param {object} data - Employer data
     * @throws {AppError}
     */
    validateEmployerData(data) {
        if (!data.name) {
            throw new AppError('Employer name is required', 400);
        }

        if (!data.workPeriodFrom || !data.workPeriodTo) {
            throw new AppError('Work period (from/to) is required', 400);
        }

        // Validate date format (YYYY-MM)
        const dateRegex = /^\d{4}-\d{2}$/;
        if (!dateRegex.test(data.workPeriodFrom) || !dateRegex.test(data.workPeriodTo)) {
            throw new AppError('Work period must be in YYYY-MM format', 400);
        }

        // Validate from < to
        if (data.workPeriodFrom > data.workPeriodTo) {
            throw new AppError('Work period "from" must be before "to"', 400);
        }
    }

    /**
     * Get all employers for a filing
     * @param {string} filingId - Filing ID
     * @returns {Promise<Array>}
     */
    async getEmployers(filingId) {
        try {
            const filing = await ITRFiling.findByPk(filingId);
            if (!filing) {
                throw new AppError('Filing not found', 404);
            }

            const employers = filing.jsonPayload?.income?.salary?.employers || [];

            return {
                employers,
                count: employers.length,
                hasMultiple: employers.length > 1,
                overlap: this.detectOverlap(employers),
            };
        } catch (error) {
            enterpriseLogger.error('Get employers failed', {
                filingId,
                error: error.message,
            });
            throw error;
        }
    }
}

module.exports = new EmployerManagementService();
