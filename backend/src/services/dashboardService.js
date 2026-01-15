/**
 * Dashboard Service
 * Provides financial overview data for the dashboard
 */

const { sequelize } = require('../config/database');

class DashboardService {
    /**
     * Get comprehensive dashboard data
     * @param {string} userId - User ID
     * @param {string} financialYear - Financial year (e.g., '2024-25')
     * @returns {Object} Dashboard data
     */
    async getDashboardData(userId, financialYear = '2024-25') {
        try {
            // Get financial overview
            const financialOverview = await this.getFinancialOverview(userId, financialYear);

            // Get smart recommendations
            const recommendations = await this.getRecommendations(userId, financialYear);

            // Get income breakdown
            const incomeBreakdown = await this.getIncomeBreakdown(userId, financialYear);

            // Get upcoming deadlines
            const deadlines = await this.getUpcomingDeadlines(financialYear);

            // Get active filing
            const activeFiling = await this.getActiveFiling(userId, financialYear);

            return {
                financialOverview,
                recommendations,
                incomeBreakdown,
                deadlines,
                activeFiling,
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    /**
     * Get financial overview (total income, tax liability, savings, health score)
     */
    async getFinancialOverview(userId, financialYear) {
        const query = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN source_type = 'salary' THEN (source_data->>'grossSalary')::numeric
            WHEN source_type = 'business' THEN (source_data->>'revenue')::numeric
            WHEN source_type = 'rental' THEN (source_data->>'annualRent')::numeric
            WHEN source_type = 'interest' THEN (source_data->>'amount')::numeric
            ELSE 0
          END
        ), 0) as total_income,
        COUNT(DISTINCT source_type) as income_source_count
      FROM income_sources
      WHERE user_id = $1
      AND financial_year = $2
    `;

        const result = await sequelize.query(query, {
            bind: [userId, financialYear],
            type: sequelize.QueryTypes.SELECT
        });
        const totalIncome = parseFloat(result[0]?.total_income || 0);

        // Calculate tax liability (simplified - will use tax calculation service later)
        const taxLiability = this.calculateTaxLiability(totalIncome);

        // Calculate tax saved (mock for now)
        const taxSaved = totalIncome * 0.036; // Assuming 3.6% savings

        // Calculate financial health score
        const financialHealth = this.calculateFinancialHealth(totalIncome, taxSaved);

        // Calculate refund/payable
        const tdsDeducted = totalIncome * 0.084; // Assuming 8.4% TDS
        const refund = Math.max(0, tdsDeducted - taxLiability);
        const payable = Math.max(0, taxLiability - tdsDeducted);

        return {
            totalIncome: Math.round(totalIncome),
            taxLiability: Math.round(taxLiability),
            taxSaved: Math.round(taxSaved),
            financialHealth,
            refund: Math.round(refund),
            payable: Math.round(payable),
            incomeSourceCount: parseInt(result[0]?.income_source_count || 0),
        };
    }

    /**
     * Calculate tax liability (simplified)
     */
    calculateTaxLiability(income) {
        // New tax regime slabs (FY 2024-25)
        if (income <= 300000) return 0;
        if (income <= 600000) return (income - 300000) * 0.05;
        if (income <= 900000) return 15000 + (income - 600000) * 0.10;
        if (income <= 1200000) return 45000 + (income - 900000) * 0.15;
        if (income <= 1500000) return 90000 + (income - 1200000) * 0.20;
        return 150000 + (income - 1500000) * 0.30;
    }

    /**
     * Calculate financial health score (0-100)
     */
    calculateFinancialHealth(income, taxSaved) {
        let score = 50; // Base score

        // Income level (max 20 points)
        if (income > 1000000) score += 20;
        else if (income > 500000) score += 15;
        else if (income > 300000) score += 10;

        // Tax savings rate (max 20 points)
        const savingsRate = (taxSaved / income) * 100;
        if (savingsRate > 5) score += 20;
        else if (savingsRate > 3) score += 15;
        else if (savingsRate > 1) score += 10;

        // Diversification (max 10 points) - will add later
        score += 10;

        return Math.min(100, Math.round(score));
    }

    /**
     * Get smart recommendations
     */
    async getRecommendations(userId, financialYear) {
        const recommendations = [];

        // Get user's current deductions
        const deductionsQuery = `
      SELECT 
        COALESCE(SUM((deduction_data->>'amount')::numeric), 0) as total_80c
      FROM deductions
      WHERE user_id = $1
      AND financial_year = $2
      AND section = '80C'
    `;

        const deductionResult = await sequelize.query(deductionsQuery, {
            bind: [userId, financialYear],
            type: sequelize.QueryTypes.SELECT
        });
        const current80C = parseFloat(deductionResult[0]?.total_80c || 0);

        // Recommendation: Max out 80C
        if (current80C < 150000) {
            const remaining = 150000 - current80C;
            const savings = remaining * 0.312; // Assuming 31.2% tax bracket
            recommendations.push({
                type: 'tax_saving',
                priority: 'high',
                message: `Invest ₹${remaining.toLocaleString('en-IN')} more in ELSS to save ₹${Math.round(savings).toLocaleString('en-IN')}`,
                action: '/tax-planner/deductions',
            });
        }

        // Recommendation: Advance tax
        const currentMonth = new Date().getMonth() + 1;
        if ([3, 6, 9, 12].includes(currentMonth)) {
            recommendations.push({
                type: 'deadline',
                priority: 'high',
                message: `Pay advance tax by ${this.getNextAdvanceTaxDate()} to avoid interest`,
                action: '/tax-planner',
            });
        }

        // Recommendation: Upload documents
        const documentsQuery = `
      SELECT COUNT(*) as doc_count
      FROM documents
      WHERE user_id = $1
      AND financial_year = $2
    `;

        const docResult = await sequelize.query(documentsQuery, {
            bind: [userId, financialYear],
            type: sequelize.QueryTypes.SELECT
        });
        const docCount = parseInt(docResult[0]?.doc_count || 0);

        if (docCount === 0) {
            recommendations.push({
                type: 'action',
                priority: 'medium',
                message: 'Upload Form 16 to auto-fill your income details',
                action: '/documents',
            });
        }

        return recommendations;
    }

    /**
     * Get next advance tax date
     */
    getNextAdvanceTaxDate() {
        const month = new Date().getMonth() + 1;
        if (month <= 6) return 'Jun 15';
        if (month <= 9) return 'Sep 15';
        if (month <= 12) return 'Dec 15';
        return 'Mar 15';
    }

    /**
     * Get income breakdown by source
     */
    async getIncomeBreakdown(userId, financialYear) {
        const query = `
      SELECT 
        source_type,
        SUM(
          CASE 
            WHEN source_type = 'salary' THEN (source_data->>'grossSalary')::numeric
            WHEN source_type = 'business' THEN (source_data->>'revenue')::numeric
            WHEN source_type = 'rental' THEN (source_data->>'annualRent')::numeric
            WHEN source_type = 'interest' THEN (source_data->>'amount')::numeric
            ELSE 0
          END
        ) as total_amount
      FROM income_sources
      WHERE user_id = $1
      AND financial_year = $2
      GROUP BY source_type
      ORDER BY total_amount DESC
    `;

        const result = await sequelize.query(query, {
            bind: [userId, financialYear],
            type: sequelize.QueryTypes.SELECT
        });

        const totalIncome = result.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

        return result.map(row => ({
            source: this.formatSourceType(row.source_type),
            amount: Math.round(parseFloat(row.total_amount)),
            percentage: Math.round((parseFloat(row.total_amount) / totalIncome) * 100),
        }));
    }

    /**
     * Format source type for display
     */
    formatSourceType(type) {
        const mapping = {
            salary: 'Salary',
            business: 'Business/Freelance',
            rental: 'Rental Income',
            interest: 'Interest',
            dividend: 'Dividends',
            capital_gains: 'Capital Gains',
            other: 'Other Income',
        };
        return mapping[type] || type;
    }

    /**
     * Get upcoming deadlines
     */
    async getUpcomingDeadlines(financialYear) {
        const deadlines = [
            {
                date: 'Jun 15',
                title: 'Advance Tax (Q1)',
                type: 'advance_tax',
                description: 'First installment of advance tax',
            },
            {
                date: 'Sep 15',
                title: 'Advance Tax (Q2)',
                type: 'advance_tax',
                description: 'Second installment of advance tax',
            },
            {
                date: 'Dec 15',
                title: 'Advance Tax (Q3)',
                type: 'advance_tax',
                description: 'Third installment of advance tax',
            },
            {
                date: 'Mar 15',
                title: 'Advance Tax (Q4)',
                type: 'advance_tax',
                description: 'Final installment of advance tax',
            },
            {
                date: 'Jan 31',
                title: 'Investment Proofs Submission',
                type: 'document',
                description: 'Submit investment proofs to employer',
            },
            {
                date: 'Mar 31',
                title: 'Financial Year End',
                type: 'milestone',
                description: 'Last day to make tax-saving investments',
            },
            {
                date: 'Jul 31',
                title: 'ITR Filing Deadline',
                type: 'filing',
                description: 'Last date to file ITR for individuals',
            },
        ];

        // Filter to show only upcoming deadlines
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;

        return deadlines.filter(deadline => {
            const deadlineMonth = this.getMonthFromDate(deadline.date);
            return deadlineMonth >= currentMonth;
        }).slice(0, 3); // Show next 3 deadlines
    }

    /**
     * Get month number from date string
     */
    getMonthFromDate(dateStr) {
        const months = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
        };
        const month = dateStr.split(' ')[0];
        return months[month] || 1;
    }

    /**
     * Get active filing
     */
    async getActiveFiling(userId, financialYear) {
        const query = `
      SELECT 
        id,
        financial_year,
        assessment_year,
        determined_itr,
        status,
        created_at,
        updated_at
      FROM itr_filings
      WHERE user_id = $1
      AND financial_year = $2
      AND status IN ('draft', 'in_progress')
      ORDER BY updated_at DESC
      LIMIT 1
    `;

        const result = await sequelize.query(query, {
            bind: [userId, financialYear],
            type: sequelize.QueryTypes.SELECT
        });

        if (result.length === 0) {
            return null;
        }

        return {
            id: result[0].id,
            financialYear: result[0].financial_year,
            assessmentYear: result[0].assessment_year,
            determinedITR: result[0].determined_itr,
            status: result[0].status,
            createdAt: result[0].created_at,
            updatedAt: result[0].updated_at,
        };
    }
}

module.exports = new DashboardService();
