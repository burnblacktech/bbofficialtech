// Tax Calculator Service - Real-time tax computation
const TAX_SLABS_OLD_REGIME = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const TAX_SLABS_NEW_REGIME = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 600000, rate: 5 },
    { min: 600000, max: 900000, rate: 10 },
    { min: 900000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 },
];

class TaxCalculatorService {
    /**
     * Calculate tax for a given income and regime
     */
    static calculateTax(taxableIncome, regime = 'new') {
        const slabs = regime === 'old' ? TAX_SLABS_OLD_REGIME : TAX_SLABS_NEW_REGIME;
        let tax = 0;
        let remainingIncome = taxableIncome;

        for (const slab of slabs) {
            if (remainingIncome <= 0) break;

            const slabIncome = Math.min(
                remainingIncome,
                slab.max === Infinity ? remainingIncome : slab.max - slab.min
            );

            tax += (slabIncome * slab.rate) / 100;
            remainingIncome -= slabIncome;
        }

        return Math.round(tax);
    }

    /**
     * Calculate cess (4% on tax)
     */
    static calculateCess(tax) {
        return Math.round(tax * 0.04);
    }

    /**
     * Calculate rebate under section 87A
     */
    static calculateRebate(taxableIncome, tax) {
        // Rebate of up to ₹12,500 if income ≤ ₹5L (old regime) or ₹7L (new regime)
        if (taxableIncome <= 500000) {
            return Math.min(tax, 12500);
        }
        return 0;
    }

    /**
     * Comprehensive tax calculation
     */
    static computeTaxLiability({
        totalIncome = 0,
        deductions = 0,
        regime = 'new',
        advanceTaxPaid = 0,
        tdsPaid = 0,
    }) {
        const taxableIncome = Math.max(0, totalIncome - deductions);
        const baseTax = this.calculateTax(taxableIncome, regime);
        const rebate = this.calculateRebate(taxableIncome, baseTax);
        const taxAfterRebate = Math.max(0, baseTax - rebate);
        const cess = this.calculateCess(taxAfterRebate);
        const totalTaxLiability = taxAfterRebate + cess;
        const taxPaid = advanceTaxPaid + tdsPaid;
        const refundOrPayable = taxPaid - totalTaxLiability;

        return {
            totalIncome,
            deductions,
            taxableIncome,
            baseTax,
            rebate,
            cess,
            totalTaxLiability,
            advanceTaxPaid,
            tdsPaid,
            totalTaxPaid: taxPaid,
            refund: refundOrPayable > 0 ? refundOrPayable : 0,
            payable: refundOrPayable < 0 ? Math.abs(refundOrPayable) : 0,
            regime,
        };
    }

    /**
     * Compare old vs new regime
     */
    static compareRegimes({ totalIncome, deductions }) {
        const oldRegime = this.computeTaxLiability({
            totalIncome,
            deductions,
            regime: 'old',
        });

        const newRegime = this.computeTaxLiability({
            totalIncome,
            deductions: 0, // New regime doesn't allow most deductions
            regime: 'new',
        });

        return {
            oldRegime,
            newRegime,
            recommended: oldRegime.totalTaxLiability < newRegime.totalTaxLiability ? 'old' : 'new',
            savings: Math.abs(oldRegime.totalTaxLiability - newRegime.totalTaxLiability),
        };
    }
}

module.exports = TaxCalculatorService;
