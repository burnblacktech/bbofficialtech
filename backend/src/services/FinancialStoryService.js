// =====================================================
// FINANCIAL STORY SERVICE
// Pure projection helpers for narrative UX
// Maps existing engines to user-facing stories
// =====================================================

const ITRApplicabilityService = require('./ITRApplicabilityService');

/**
 * Financial Story Service
 * 
 * Pure projection functions to transform backend data
 * into user-facing financial narratives.
 * 
 * No computation, no mutations, just presentation mapping.
 */
class FinancialStoryService {
    /**
     * Extract high-level income summary from snapshot
     */
    static extractIncomeSummary(jsonPayload) {
        const income = jsonPayload?.income || {};

        return {
            salary: this._extractSalaryTotal(income.salary),
            capitalGains: this._extractCapitalGainsTotal(income.capitalGains),
            businessIncome: this._extractBusinessTotal(income.business),
            presumptiveIncome: this._extractPresumptiveTotal(income.presumptive),
            otherIncome: this._extractOtherIncomeTotal(income),
            totalIncome: this._calculateTotalIncome(income)
        };
    }

    /**
     * Extract detailed salary story
     */
    static extractSalaryStory(salaryData) {
        if (!salaryData || !salaryData.employers || salaryData.employers.length === 0) {
            return null;
        }

        const employers = salaryData.employers.map(emp => ({
            name: emp.name || 'Employer',
            period: this._formatPeriod(emp.workPeriodFrom, emp.workPeriodTo),
            grossSalary: emp.gross || emp.grossSalary || 0,
            tdsDeducted: emp.tds || 0,
            netReceived: (emp.gross || emp.grossSalary || 0) - (emp.tds || 0)
        }));

        return {
            employers,
            total: employers.reduce((sum, emp) => sum + emp.grossSalary, 0)
        };
    }

    /**
     * Extract capital gains story
     */
    static extractCapitalGainsStory(cgData) {
        if (!cgData) {
            return {
                intent: 'not_declared',
                transactions: [],
                shortTerm: 0,
                longTerm: 0,
                total: 0
            };
        }

        const intent = cgData.intent?.declared ? 'declared' : 'not_declared';
        const transactions = cgData.transactions || [];

        return {
            intent,
            transactions: transactions.map(txn => ({
                assetType: txn.assetType,
                saleDate: txn.saleDate,
                gainType: txn.gainType,
                gain: txn.saleValue - txn.purchaseValue - (txn.expenses || 0)
            })),
            shortTerm: transactions
                .filter(t => t.gainType === 'short-term')
                .reduce((sum, t) => sum + (t.saleValue - t.purchaseValue - (t.expenses || 0)), 0),
            longTerm: transactions
                .filter(t => t.gainType === 'long-term')
                .reduce((sum, t) => sum + (t.saleValue - t.purchaseValue - (t.expenses || 0)), 0),
            total: transactions.reduce((sum, t) => sum + (t.saleValue - t.purchaseValue - (t.expenses || 0)), 0)
        };
    }

    /**
     * Extract business income story
     */
    static extractBusinessStory(businessData) {
        if (!businessData || !businessData.businesses || businessData.businesses.length === 0) {
            return null;
        }

        return {
            businesses: businessData.businesses.map(biz => ({
                name: biz.name,
                natureOfBusiness: biz.natureOfBusiness,
                turnover: biz.turnover || 0,
                netProfit: biz.netProfit || 0
            })),
            total: businessData.businesses.reduce((sum, biz) => sum + (biz.netProfit || 0), 0)
        };
    }

    /**
     * Extract other income story
     */
    static extractOtherIncomeStory(income) {
        return {
            interest: income.interestIncome || income.otherSources?.totalInterestIncome || 0,
            dividend: income.dividendIncome || 0,
            total: (income.interestIncome || 0) + (income.dividendIncome || 0) + (income.otherIncome || 0)
        };
    }

    /**
     * Extract presumptive income story (ITR-4)
     */
    static extractPresumptiveStory(presumptiveData) {
        if (!presumptiveData) return null;

        const business = presumptiveData.business;
        const professional = presumptiveData.professional;

        const sections = [];
        if (business) {
            sections.push({
                section: '44AD',
                name: business.businessName || 'Business',
                receipts: business.grossReceipts || 0,
                income: business.presumptiveIncome || 0
            });
        }
        if (professional) {
            sections.push({
                section: '44ADA',
                name: professional.professionName || 'Profession',
                receipts: professional.grossReceipts || 0,
                income: professional.presumptiveIncome || 0
            });
        }

        return {
            sections,
            totalReceipts: sections.reduce((sum, s) => sum + s.receipts, 0),
            totalIncome: sections.reduce((sum, s) => sum + s.income, 0)
        };
    }

    /**
     * Derive completion checklist from missing blocks and active blockers
     */
    static deriveChecklist(missingBlocks = [], blockers = []) {
        const hasTaxBlocker = blockers.some(b => b.code === 'TAX_PAYMENT_PENDING');

        return {
            salaryDetails: !missingBlocks.includes('income.salary'),
            bankAccounts: !missingBlocks.includes('bankAccounts'),
            verification: !missingBlocks.includes('verification'),
            capitalGainsDetails: !missingBlocks.includes('income.capitalGains'),
            presumptiveDetails: !missingBlocks.includes('income.presumptive'),
            taxPayment: !hasTaxBlocker
        };
    }

    /**
     * Explain CA requirement
     */
    static explainCArequirement(caRequired, itrType) {
        const explanations = {
            mandatory: `CA review is mandatory for ${itrType} due to business income or complex transactions.`,
            optional: `CA review is optional for ${itrType}. You may submit directly or seek CA assistance for additional confidence.`,
            not_applicable: 'CA review is not required for this filing.'
        };

        return explanations[caRequired] || explanations.not_applicable;
    }

    /**
     * Mask PAN for display
     */
    static maskPan(pan) {
        if (!pan || pan.length < 10) return pan;
        return `${pan.substring(0, 5)}****${pan.substring(9)}`;
    }

    /**
     * Extract TDS total from snapshot
     */
    static extractTDS(jsonPayload) {
        const taxes = jsonPayload?.taxes || {};
        const tds = taxes.tds || [];

        if (Array.isArray(tds)) {
            return tds.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        }

        return 0;
    }

    // Private helpers

    static _extractSalaryTotal(salaryData) {
        if (!salaryData || typeof salaryData === 'number') {
            return salaryData || 0;
        }

        if (salaryData.employers && Array.isArray(salaryData.employers)) {
            return salaryData.employers.reduce((sum, emp) => sum + (emp.gross || emp.grossSalary || 0), 0);
        }

        return 0;
    }

    static _extractCapitalGainsTotal(cgData) {
        if (!cgData) return 0;
        if (typeof cgData === 'number') return cgData;

        if (cgData.transactions && Array.isArray(cgData.transactions)) {
            return cgData.transactions.reduce((sum, txn) =>
                sum + (txn.saleValue - txn.purchaseValue - (txn.expenses || 0)), 0);
        }

        return 0;
    }

    static _extractBusinessTotal(businessData) {
        if (!businessData) return 0;
        if (typeof businessData === 'number') return businessData;

        if (businessData.businesses && Array.isArray(businessData.businesses)) {
            return businessData.businesses.reduce((sum, biz) => sum + (biz.netProfit || 0), 0);
        }

        return 0;
    }

    static _extractOtherIncomeTotal(income) {
        return (income.interestIncome || 0) + (income.dividendIncome || 0) + (income.otherIncome || 0);
    }

    static _extractPresumptiveTotal(presumptiveData) {
        if (!presumptiveData) return 0;
        const bIncome = parseFloat(presumptiveData.business?.presumptiveIncome || 0);
        const pIncome = parseFloat(presumptiveData.professional?.presumptiveIncome || 0);
        return bIncome + pIncome;
    }

    static _calculateTotalIncome(income) {
        return this._extractSalaryTotal(income.salary) +
            this._extractCapitalGainsTotal(income.capitalGains) +
            this._extractBusinessTotal(income.business) +
            this._extractPresumptiveTotal(income.presumptive) +
            this._extractOtherIncomeTotal(income);
    }

    static _formatPeriod(from, to) {
        if (!from || !to) return 'Full year';

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        };

        return `${formatDate(from)} - ${formatDate(to)}`;
    }
}

module.exports = FinancialStoryService;
