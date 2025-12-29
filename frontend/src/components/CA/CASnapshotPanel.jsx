/**
 * CASnapshotPanel.jsx
 * Read-Only Financial Snapshot
 */
import React from 'react';
import { formatIndianCurrency } from '../../lib/format';

const StatRow = ({ label, value, isTotal = false }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'font-bold text-slate-900 border-t border-slate-200 mt-2 pt-3' : 'text-slate-600'}`}>
        <span className={isTotal ? 'text-sm' : 'text-sm'}>{label}</span>
        <span className={isTotal ? 'text-base' : 'text-sm'}>{formatIndianCurrency(value)}</span>
    </div>
);

const CASnapshotPanel = ({ snapshot }) => {
    const { income, deductions, taxOutcome } = snapshot || {};

    return (
        <div className="space-y-6">

            {/* Income Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Income Summary</h3>
                <StatRow label="Gross Income" value={income?.total} isTotal />
                {/* Expandable breakdown could go here */}
            </div>

            {/* Deductions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Deductions</h3>
                <StatRow label="Total Deductions" value={deductions?.total} isTotal />
            </div>

            {/* Tax Outcome Card */}
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6 text-white">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tax Outcome</h3>
                <div className="flex justify-between items-center py-2 text-slate-300">
                    <span className="text-sm">Taxable Income</span>
                    <span className="text-sm">{formatIndianCurrency(taxOutcome?.taxableIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-300">
                    <span className="text-sm">Total Tax</span>
                    <span className="text-sm">{formatIndianCurrency(taxOutcome?.totalTax)}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-medium">
                        {taxOutcome?.refundOrPayable > 0 ? 'Refund Due' : 'Net Payable'}
                    </span>
                    <span className={`text-xl font-bold ${taxOutcome?.refundOrPayable > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                        {formatIndianCurrency(Math.abs(taxOutcome?.refundOrPayable))}
                    </span>
                </div>
            </div>

        </div>
    );
};

export default CASnapshotPanel;
