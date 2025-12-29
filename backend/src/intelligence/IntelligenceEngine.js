/**
 * IntelligenceEngine.js
 * Orchestrator for all intelligence signals (V2.1)
 *
 * Responsibilities:
 * - Aggregates signals from specialized modules
 * - Enforces signal contract
 * - Provides a single entry point for "thinking"
 */

const incomeSignals = require('./signals/incomeSignals');
const deductionSignals = require('./signals/deductionSignals');
const regimeSignals = require('./signals/regimeSignals');
const riskSignals = require('./signals/riskSignals');

class IntelligenceEngine {
    /**
     * Run all intelligence rules against the filing data
     * @param {Object} formData - The filing data (ITR JSON structure)
     * @param {Object} taxComputation - The computed tax result
     * @param {String} itrType - "ITR-1", "ITR-2", etc.
     * @returns {Array} - List of signals
     */
    static run(formData, taxComputation, itrType) {
        const signals = [];

        // 1. Collect Signals
        signals.push(...incomeSignals.evaluate(formData, taxComputation));
        signals.push(...deductionSignals.evaluate(formData, taxComputation));
        signals.push(...regimeSignals.evaluate(formData, taxComputation));
        signals.push(...riskSignals.evaluate(formData, taxComputation));

        // 2. Sort by Severity/Importance
        return this.prioritizeSignals(signals);
    }

    static prioritizeSignals(signals) {
        const severityWeight = {
            'important': 3,
            'warning': 2,
            'info': 1
        };

        return signals.sort((a, b) => {
            return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
        });
    }
}

module.exports = IntelligenceEngine;
