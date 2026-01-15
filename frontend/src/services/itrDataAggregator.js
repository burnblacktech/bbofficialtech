/**
 * ITR Data Aggregator Service
 * Intelligently merges data from multiple sources (PAN, Form 16, AIS, Modules)
 */

import incomeService from './incomeService';
import api from './api';

class ITRDataAggregator {
    /**
     * Derive personal information from PAN
     * 4th character indicates birth year and gender
     */
    derivePersonalInfo(pan, userName) {
        if (!pan || pan.length !== 10) {
            return { age: null, gender: null, birthYear: null };
        }

        const fourthChar = pan[3].toUpperCase();

        // Gender mapping
        const gender = ['F', 'L'].includes(fourthChar) ? 'FEMALE' : 'MALE';

        // Birth year mapping (approximate)
        const birthYearMap = {
            'A': 1940, 'B': 1941, 'C': 1942, 'D': 1943, 'E': 1944,
            'F': 1945, 'G': 1946, 'H': 1947, 'J': 1948, 'K': 1949,
            'L': 1950, 'M': 1951, 'N': 1952, 'P': 1990, 'Q': 1991,
            'R': 1992, 'S': 1993, 'T': 1994, 'U': 1995, 'V': 1996,
            'W': 1997, 'X': 1998, 'Y': 1999, 'Z': 2000,
        };

        const birthYear = birthYearMap[fourthChar] || null;
        const currentYear = new Date().getFullYear();
        const age = birthYear ? currentYear - birthYear : null;

        return {
            name: userName,
            gender,
            birthYear,
            age,
            derivedFromPAN: true,
        };
    }

    /**
     * Merge income sources from multiple sources
     * Priority: AIS > Form16 > Module (most authoritative first)
     */
    mergeIncomeSources(form16Data, aisData, moduleData) {
        const sources = new Map();

        // Helper to add source
        const addSource = (type, source, amount, origin, details = {}) => {
            const key = `${type}_${source}`;
            const existing = sources.get(key);

            if (existing && existing.amount !== amount) {
                // Conflict detected
                sources.set(key, {
                    type,
                    source,
                    amount,
                    origin,
                    conflict: true,
                    alternatives: [...(existing.alternatives || [existing]), { amount, origin }],
                    ...details,
                });
            } else {
                sources.set(key, {
                    type,
                    source,
                    amount,
                    origin,
                    conflict: false,
                    ...details,
                });
            }
        };

        // Add from module (lowest priority)
        if (moduleData?.breakdown) {
            if (moduleData.breakdown.salary > 0) {
                addSource('salary', 'Salary Income', moduleData.breakdown.salary, 'Income Module');
            }
            if (moduleData.breakdown.business > 0) {
                addSource('business', 'Business Income', moduleData.breakdown.business, 'Income Module');
            }
            if (moduleData.breakdown.houseProperty > 0) {
                addSource('house_property', 'House Property', moduleData.breakdown.houseProperty, 'Income Module');
            }
            if (moduleData.breakdown.capitalGains > 0) {
                addSource('capital_gains', 'Capital Gains', moduleData.breakdown.capitalGains, 'Income Module');
            }
            if (moduleData.breakdown.otherSources > 0) {
                addSource('other', 'Other Sources', moduleData.breakdown.otherSources, 'Income Module');
            }
        }

        // Add from Form 16 (medium priority)
        if (form16Data?.salary) {
            addSource('salary', form16Data.employerName || 'Employer', form16Data.salary, 'Form 16', {
                employerName: form16Data.employerName,
                employerTAN: form16Data.employerTAN,
            });
        }

        // Add from AIS (highest priority)
        if (aisData?.incomeSources) {
            aisData.incomeSources.forEach(item => {
                addSource(item.type, item.source, item.amount, 'AIS', item.details);
            });
        }

        return Array.from(sources.values());
    }

    /**
     * Merge deductions from multiple sources
     */
    mergeDeductions(form16Data, moduleData) {
        const deductions = new Map();

        const addDeduction = (section, description, amount, origin, details = {}) => {
            const key = `${section}_${description}`;
            const existing = deductions.get(key);

            if (existing && existing.amount !== amount) {
                deductions.set(key, {
                    section,
                    description,
                    amount,
                    origin,
                    conflict: true,
                    alternatives: [...(existing.alternatives || [existing]), { amount, origin }],
                    ...details,
                });
            } else {
                deductions.set(key, {
                    section,
                    description,
                    amount,
                    origin,
                    conflict: false,
                    ...details,
                });
            }
        };

        // Add from module
        if (moduleData?.deductions) {
            moduleData.deductions.forEach(ded => {
                addDeduction(ded.section, ded.description, ded.amount, 'Deductions Module', ded.details);
            });
        }

        // Add from Form 16
        if (form16Data?.deductions) {
            Object.entries(form16Data.deductions).forEach(([section, amount]) => {
                if (amount > 0) {
                    addDeduction(section, `${section} Deduction`, amount, 'Form 16');
                }
            });
        }

        return Array.from(deductions.values());
    }

    /**
     * Merge TDS data from all sources
     */
    mergeTDS(form16Data, aisData) {
        const tdsEntries = [];

        // From Form 16
        if (form16Data?.tds > 0) {
            tdsEntries.push({
                source: form16Data.employerName || 'Employer',
                amount: form16Data.tds,
                origin: 'Form 16',
                type: 'salary',
            });
        }

        // From AIS
        if (aisData?.tds) {
            aisData.tds.forEach(entry => {
                tdsEntries.push({
                    source: entry.deductor,
                    amount: entry.amount,
                    origin: 'AIS',
                    type: entry.type,
                });
            });
        }

        return tdsEntries;
    }

    /**
     * Calculate tax based on income and deductions
     */
    calculateTax(totalIncome, totalDeductions, regime = 'new') {
        const taxableIncome = Math.max(0, totalIncome - totalDeductions);

        let tax = 0;
        if (regime === 'new') {
            // New tax regime slabs (FY 2024-25)
            if (taxableIncome <= 300000) tax = 0;
            else if (taxableIncome <= 600000) tax = (taxableIncome - 300000) * 0.05;
            else if (taxableIncome <= 900000) tax = 15000 + (taxableIncome - 600000) * 0.10;
            else if (taxableIncome <= 1200000) tax = 45000 + (taxableIncome - 900000) * 0.15;
            else if (taxableIncome <= 1500000) tax = 90000 + (taxableIncome - 1200000) * 0.20;
            else tax = 150000 + (taxableIncome - 1500000) * 0.30;
        } else {
            // Old tax regime (with standard deduction)
            const standardDeduction = 50000;
            const adjustedIncome = Math.max(0, taxableIncome - standardDeduction);

            if (adjustedIncome <= 250000) tax = 0;
            else if (adjustedIncome <= 500000) tax = (adjustedIncome - 250000) * 0.05;
            else if (adjustedIncome <= 1000000) tax = 12500 + (adjustedIncome - 500000) * 0.20;
            else tax = 112500 + (adjustedIncome - 1000000) * 0.30;
        }

        // Add 4% cess
        tax = tax * 1.04;

        return Math.round(tax);
    }

    /**
     * Determine appropriate ITR form based on income sources
     */
    determineITR(incomeSources) {
        const types = new Set(incomeSources.map(s => s.type));

        // ITR-1: Only salary, one house property, other sources (interest, etc.)
        if (!types.has('business') && !types.has('capital_gains') &&
            (types.has('salary') || types.has('other'))) {
            return 'ITR-1';
        }

        // ITR-2: Capital gains, multiple house properties, no business
        if (types.has('capital_gains') && !types.has('business')) {
            return 'ITR-2';
        }

        // ITR-3: Business or professional income
        if (types.has('business')) {
            return 'ITR-3';
        }

        // ITR-4: Presumptive taxation
        return 'ITR-4';
    }

    /**
     * Main aggregation function
     */
    async aggregateAllData(userId, financialYear = '2024-25') {
        try {
            // Fetch all data in parallel
            const [userProfile, form16, incomeData] = await Promise.all([
                api.get('/api/auth/profile').then(res => res.data.data),
                this.getForm16Data(userId, financialYear).catch(() => null),
                incomeService.getIncomeSummary().catch(() => null),
            ]);

            // Deduction data will come from tax planner module in future
            const deductionData = null;

            // Mock AIS data (to be replaced with real API)
            const aisData = null;

            // Derive personal info
            const personalInfo = this.derivePersonalInfo(
                userProfile.pan || userProfile.panNumber,
                userProfile.fullName,
            );

            // Merge income sources
            const incomeSources = this.mergeIncomeSources(form16, aisData, incomeData);
            const totalIncome = incomeSources.reduce((sum, s) => sum + s.amount, 0);

            // Merge deductions
            const deductions = this.mergeDeductions(form16, deductionData);
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

            // Merge TDS
            const tdsEntries = this.mergeTDS(form16, aisData);
            const totalTDS = tdsEntries.reduce((sum, t) => sum + t.amount, 0);

            // Calculate tax for both regimes
            const newRegimeTax = this.calculateTax(totalIncome, 0, 'new'); // No deductions in new regime
            const oldRegimeTax = this.calculateTax(totalIncome, totalDeductions, 'old');

            const recommendedRegime = newRegimeTax < oldRegimeTax ? 'new' : 'old';
            const taxLiability = Math.min(newRegimeTax, oldRegimeTax);
            const refundOrPayable = totalTDS - taxLiability;

            // Determine ITR form
            const recommendedITR = this.determineITR(incomeSources);

            return {
                personal: {
                    ...personalInfo,
                    pan: userProfile.pan || userProfile.panNumber,
                    email: userProfile.email,
                    phone: userProfile.phone,
                    address: userProfile.address,
                },
                income: {
                    sources: incomeSources,
                    total: totalIncome,
                },
                deductions: {
                    items: deductions,
                    total: totalDeductions,
                },
                taxPaid: {
                    entries: tdsEntries,
                    total: totalTDS,
                },
                computation: {
                    grossIncome: totalIncome,
                    totalDeductions,
                    taxableIncome: Math.max(0, totalIncome - totalDeductions),
                    newRegimeTax,
                    oldRegimeTax,
                    recommendedRegime,
                    taxLiability,
                    refundOrPayable,
                    isRefund: refundOrPayable > 0,
                },
                recommendedITR,
                dataQuality: {
                    hasForm16: !!form16,
                    hasAIS: !!aisData,
                    hasModuleData: !!(incomeData || deductionData),
                    conflicts: [
                        ...incomeSources.filter(s => s.conflict),
                        ...deductions.filter(d => d.conflict),
                    ],
                },
            };
        } catch (error) {
            console.error('Error aggregating ITR data:', error);
            throw error;
        }
    }

    /**
     * Get Form 16 data (mock for now)
     */
    async getForm16Data(userId, financialYear) {
        // This will be replaced with actual Form 16 OCR data
        return null;
    }
}

export default new ITRDataAggregator();
