/**
 * ConfidenceEngine.js
 * V2.2 Authoritative Trust Scoring
 *
 * Responsibilities:
 * - Calculate Trust Score (0-100) based on deterministic rules.
 * - Determine Confidence Band (HIGH/MEDIUM/LOW).
 * - Flag CA Assist recommendation.
 * - Identify Blocking Issues.
 *
 * PURE FUNCTION. No DB access.
 */

class ConfidenceEngine {

    /**
     * Evaluate confidence of the filing
     * @param {Object} context - The evaluation context
     * @param {Array} context.signals - Signals from IntelligenceEngine
     * @param {Object} context.formData - Filing data
     * @param {Object} context.taxComputation - Computed tax
     * @param {Object} context.metadata - Metadata (sources, verification status)
     * @returns {Object} Confidence Result
     */
    static evaluate({
        signals = [],
        formData = {},
        taxComputation = {},
        metadata = {}
    }) {
        let score = 100;
        const drivers = {
            positive: [],
            negative: []
        };

        // --- 1. Deductions Scoring ---
        signals.forEach(signal => {
            if (signal.category === 'deduction' || signal.category === 'income' || signal.category === 'regime' || signal.category === 'risk') {
                if (signal.severity === 'important') {
                    score -= 15;
                    drivers.negative.push(`Signal: ${signal.id} (Important)`);
                } else if (signal.severity === 'warning') {
                    score -= 7;
                    drivers.negative.push(`Signal: ${signal.id} (Warning)`);
                }
            }
        });

        // --- 2. Data Confidence Scoring ---
        // Check for sources in metadata or inferred from formData
        // metadata.sources expected to be array e.g. ['FORM_16', 'JSON_UPLOAD']
        const sources = metadata.sources || [];
        const hasForm26AS = sources.includes('FORM_26AS') || sources.includes('AIS');
        const hasForm16 = sources.includes('FORM_16');

        // Income checks
        const salaryIncome = taxComputation.income?.salary || 0;

        if (!hasForm26AS) {
            score -= 10;
            drivers.negative.push('No Form 26AS/AIS data');
        } else {
            drivers.positive.push('Verified against Form 26AS/AIS');
        }

        if (salaryIncome > 0 && !hasForm16) {
            score -= 15;
            drivers.negative.push('Salary declared without Form 16');
        } else if (salaryIncome > 0 && hasForm16) {
            drivers.positive.push('Salary backed by Form 16');
        }

        // Verification checks
        // Assuming metadata has verification flags, or we extract from formData/User model stored in context?
        // The prompt says inputs include bankVerified, panVerified.
        // Let's assume these are passed in metadata for purity.
        const bankVerified = metadata.bankVerified === true;
        const panVerified = metadata.panVerified === true;

        if (!bankVerified) {
            score -= 10;
            drivers.negative.push('Bank account not verified');
        } else {
            drivers.positive.push('Bank account verified');
        }

        if (!panVerified) {
            score -= 25; // Hard penalty, though this is also a blocking issue
            drivers.negative.push('PAN not verified');
        } else {
            drivers.positive.push('PAN verified');
        }

        // --- 3. Stability Scoring ---
        // YoY Spike
        const yoySpikeSignal = signals.find(s => s.id === 'LARGE_YOY_JUMP'); // Example ID
        if (yoySpikeSignal) {
            score -= 10;
            // Driver added via signals loop above or specific msg?
            // Signals loop adds generic message. We can add specific if needed.
        }

        // Regime Warning
        const regimeSignal = signals.find(s => s.category === 'regime' && s.severity === 'important');
        if (regimeSignal) {
            score -= 5;
        }

        // --- 4. Floor / Ceiling ---
        score = Math.max(30, Math.min(100, score));

        // --- 5. Derived Flags ---
        let confidenceBand = 'LOW';
        if (score >= 80) confidenceBand = 'HIGH';
        else if (score >= 55) confidenceBand = 'MEDIUM';

        const caAssistRecommended = confidenceBand !== 'HIGH';
        const blockingIssues = !panVerified;

        return {
            trustScore: score,
            confidenceBand,
            drivers,
            caAssistRecommended,
            blockingIssues
        };
    }
}

module.exports = ConfidenceEngine;
