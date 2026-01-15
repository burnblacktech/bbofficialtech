import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

/**
 * Dividend Income Form Component
 * For dividend from equity shares and mutual funds (taxable from AY 2020-21)
 */
const DividendIncomeForm = ({ data, onChange, onSave }) => {
    const [dividendData, setDividendData] = useState(data || {
        equityDividend: 0,
        mutualFundDividend: 0,
        otherDividend: 0,
        tdsDeducted: 0,
    });

    const handleChange = (field, value) => {
        const updated = { ...dividendData, [field]: value };
        setDividendData(updated);

        const totals = calculateTotals(updated);
        onChange({ ...updated, ...totals });
    };

    const calculateTotals = (data) => {
        const equityDividend = parseFloat(data.equityDividend) || 0;
        const mutualFundDividend = parseFloat(data.mutualFundDividend) || 0;
        const otherDividend = parseFloat(data.otherDividend) || 0;
        const tdsDeducted = parseFloat(data.tdsDeducted) || 0;

        const totalDividend = equityDividend + mutualFundDividend + otherDividend;

        return {
            total: totalDividend,
            totalDividend,
            tds: tdsDeducted,
        };
    };

    const totals = calculateTotals(dividendData);

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Dividend income is taxable from AY 2020-21 onwards.
                    TDS @ 10% if dividend exceeds ₹5,000.
                </p>
            </div>

            {/* Dividend Sources */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Equity Shares Dividend
                    </label>
                    <input
                        type="number"
                        value={dividendData.equityDividend}
                        onChange={(e) => handleChange('equityDividend', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Mutual Fund Dividend
                    </label>
                    <input
                        type="number"
                        value={dividendData.mutualFundDividend}
                        onChange={(e) => handleChange('mutualFundDividend', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Other Dividend Income
                    </label>
                    <input
                        type="number"
                        value={dividendData.otherDividend}
                        onChange={(e) => handleChange('otherDividend', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        TDS Deducted
                    </label>
                    <input
                        type="number"
                        value={dividendData.tdsDeducted}
                        onChange={(e) => handleChange('tdsDeducted', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Summary</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Total Dividend Income</span>
                        <span className="text-lg font-bold text-slate-900">₹{totals.totalDividend.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">TDS Deducted</span>
                        <span className="font-bold">₹{totals.tds.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ ...dividendData, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default DividendIncomeForm;
