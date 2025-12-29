import React from 'react';
import SectionCard from '../../DesignSystem/SectionCard';
import { IndianRupee, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';
import SmartInsightsPanel from '../intelligence/SmartInsightsPanel';

// V1 Step 5: Tax Outcome (Early & Honest)
const TaxOutcomeSection = ({
    taxComputation,
    onTaxComputed,
    assessmentYear,
    ...props
}) => {
    // If no computation, show empty state or basic calc
    const tax = taxComputation?.taxLiability || 0;
    const refund = taxComputation?.refundAmount || 0;
    const payable = taxComputation?.amountPayable || 0;

    return (
        <SectionCard
            {...props}
            title="Here's how your tax looks"
            description="Based on your income and savings."
            icon={IndianRupee}
        >
            <div className="space-y-6">

                {/* Outcome Summary Card */}
                <div className={`p-6 rounded-2xl border ${refund > 0
                    ? 'bg-success-50 border-success-200'
                    : payable > 0
                        ? 'bg-warning-50 border-warning-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${refund > 0 ? 'bg-success-100 text-success-700' : payable > 0 ? 'bg-warning-100 text-warning-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                            {refund > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wide mb-1">
                                {refund > 0 ? 'Good News' : payable > 0 ? 'Action Required' : 'All Settled'}
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900 leading-tight">
                                {refund > 0
                                    ? `The government owes you ${formatIndianCurrency(refund)}`
                                    : payable > 0
                                        ? `You need to pay ${formatIndianCurrency(payable)} more`
                                        : 'You have no tax due, and no refund.'}
                            </h3>
                            {payable > 0 && (
                                <p className="text-sm text-slate-600 mt-2">
                                    We'll guide you to the payment gateway in the next step.
                                </p>
                            )}
                            {refund > 0 && (
                                <p className="text-sm text-slate-600 mt-2">
                                    This amount will be credited to your bank account after filing.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Breakdown - Simplified */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">Total Income declared</p>
                        <p className="text-lg font-semibold">{formatIndianCurrency(taxComputation?.totalIncome || 0)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">Total Savings & Deductions</p>
                        <p className="text-lg font-semibold">{formatIndianCurrency(taxComputation?.totalDeductions || 0)}</p>
                    </div>
                </div>
            </div>

            {/* V2.4: Smart Insights Panel */}
            <SmartInsightsPanel computation={taxComputation} />

            <div className="text-center pt-4">
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Based on the details you provided, this calculation is accurate.
                </p>
            </div>

        </div>
        </SectionCard >
    );
};

export default TaxOutcomeSection;
