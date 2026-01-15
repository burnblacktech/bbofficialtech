import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { ITR_VALIDATION_RULES } from '../../../utils/validationRules';

/**
 * Interest Income Form Component
 * For interest from savings, FD, RD, bonds, etc.
 */
const InterestIncomeForm = ({ data, onChange, onSave }) => {
    const [interestData, setInterestData] = useState(data || {
        savingsInterest: 0,
        fdInterest: 0,
        rdInterest: 0,
        bondsInterest: 0,
        otherInterest: 0,
        tdsDeducted: 0,
        isSeniorCitizen: false,
    });

    const handleChange = (field, value) => {
        const updated = { ...interestData, [field]: value };
        setInterestData(updated);

        const totals = calculateTotals(updated);
        onChange({ ...updated, ...totals });
    };

    const calculateTotals = (data) => {
        const savingsInterest = parseFloat(data.savingsInterest) || 0;
        const fdInterest = parseFloat(data.fdInterest) || 0;
        const rdInterest = parseFloat(data.rdInterest) || 0;
        const bondsInterest = parseFloat(data.bondsInterest) || 0;
        const otherInterest = parseFloat(data.otherInterest) || 0;
        const tdsDeducted = parseFloat(data.tdsDeducted) || 0;

        const totalInterest = savingsInterest + fdInterest + rdInterest + bondsInterest + otherInterest;

        // Savings interest exemption
        const exemptionLimit = data.isSeniorCitizen ?
            ITR_VALIDATION_RULES.SAVINGS_INTEREST_EXEMPT_SENIOR :
            ITR_VALIDATION_RULES.SAVINGS_INTEREST_EXEMPT;

        const savingsExemption = Math.min(savingsInterest, exemptionLimit);
        const taxableInterest = totalInterest - savingsExemption;

        return {
            total: taxableInterest,
            totalInterest,
            savingsExemption,
            taxableInterest,
            tds: tdsDeducted,
        };
    };

    const totals = calculateTotals(interestData);

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Exemption:</strong> Savings interest up to ₹{interestData.isSeniorCitizen ? '50,000' : '10,000'} is exempt under Section 80TTA/80TTB
                </p>
            </div>

            {/* Senior Citizen Toggle */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                    type="checkbox"
                    id="seniorCitizen"
                    checked={interestData.isSeniorCitizen}
                    onChange={(e) => handleChange('isSeniorCitizen', e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="seniorCitizen" className="text-sm font-medium text-slate-700">
                    I am a Senior Citizen (60+ years)
                </label>
            </div>

            {/* Interest Sources */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Savings Account Interest
                    </label>
                    <input
                        type="number"
                        value={interestData.savingsInterest}
                        onChange={(e) => handleChange('savingsInterest', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Fixed Deposit Interest
                    </label>
                    <input
                        type="number"
                        value={interestData.fdInterest}
                        onChange={(e) => handleChange('fdInterest', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Recurring Deposit Interest
                    </label>
                    <input
                        type="number"
                        value={interestData.rdInterest}
                        onChange={(e) => handleChange('rdInterest', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tax-Free Bonds Interest
                    </label>
                    <input
                        type="number"
                        value={interestData.bondsInterest}
                        onChange={(e) => handleChange('bondsInterest', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Other Interest Income
                    </label>
                    <input
                        type="number"
                        value={interestData.otherInterest}
                        onChange={(e) => handleChange('otherInterest', e.target.value)}
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
                        value={interestData.tdsDeducted}
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
                        <span className="text-slate-600">Total Interest Income</span>
                        <span className="font-bold">₹{totals.totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Savings Interest Exemption</span>
                        <span className="font-bold text-emerald-600">-₹{totals.savingsExemption.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="font-medium">Taxable Interest Income</span>
                        <span className="text-lg font-bold text-slate-900">₹{totals.taxableInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">TDS Deducted</span>
                        <span className="font-bold">₹{totals.tds.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ ...interestData, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default InterestIncomeForm;
