import React, { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { ITR_VALIDATION_RULES } from '../../../utils/validationRules';

/**
 * Other Income Form Component
 * For gifts, lottery, gambling, and other miscellaneous income
 */
const OtherIncomeForm = ({ data, onChange, onSave }) => {
    const [otherData, setOtherData] = useState(data || {
        gifts: 0,
        lottery: 0,
        gambling: 0,
        miscellaneous: 0,
        tdsDeducted: 0,
    });

    const handleChange = (field, value) => {
        const updated = { ...otherData, [field]: value };
        setOtherData(updated);

        const totals = calculateTotals(updated);
        onChange({ ...updated, ...totals });
    };

    const calculateTotals = (data) => {
        const gifts = parseFloat(data.gifts) || 0;
        const lottery = parseFloat(data.lottery) || 0;
        const gambling = parseFloat(data.gambling) || 0;
        const miscellaneous = parseFloat(data.miscellaneous) || 0;
        const tdsDeducted = parseFloat(data.tdsDeducted) || 0;

        const totalOther = gifts + lottery + gambling + miscellaneous;

        return {
            total: totalOther,
            gifts,
            lottery,
            gambling,
            miscellaneous,
            tds: tdsDeducted,
        };
    };

    const totals = calculateTotals(otherData);

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                    <strong>Important:</strong> Gifts from non-relatives exceeding ₹50,000 are taxable.
                    Lottery/gambling income is taxed at flat 30% rate.
                </p>
            </div>

            {/* Income Sources */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Gifts Received (from non-relatives)
                        <span className="text-xs text-slate-500 ml-1">
                            (Taxable if {'>'} ₹50,000)
                        </span>
                    </label>
                    <input
                        type="number"
                        value={otherData.gifts}
                        onChange={(e) => handleChange('gifts', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                    {parseFloat(otherData.gifts) > ITR_VALIDATION_RULES.GIFT_EXEMPTION_LIMIT && (
                        <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Exceeds ₹50,000 exemption limit - fully taxable
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Lottery Winnings
                        <span className="text-xs text-red-600 ml-1">
                            (Taxed @ 30%)
                        </span>
                    </label>
                    <input
                        type="number"
                        value={otherData.lottery}
                        onChange={(e) => handleChange('lottery', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Gambling/Betting Income
                        <span className="text-xs text-red-600 ml-1">
                            (Taxed @ 30%)
                        </span>
                    </label>
                    <input
                        type="number"
                        value={otherData.gambling}
                        onChange={(e) => handleChange('gambling', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Other Miscellaneous Income
                    </label>
                    <input
                        type="number"
                        value={otherData.miscellaneous}
                        onChange={(e) => handleChange('miscellaneous', e.target.value)}
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
                        value={otherData.tdsDeducted}
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
                        <span className="text-slate-600">Gifts</span>
                        <span className="font-bold">₹{totals.gifts.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Lottery</span>
                        <span className="font-bold">₹{totals.lottery.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Gambling</span>
                        <span className="font-bold">₹{totals.gambling.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Miscellaneous</span>
                        <span className="font-bold">₹{totals.miscellaneous.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="font-medium">Total Other Income</span>
                        <span className="text-lg font-bold text-slate-900">₹{totals.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">TDS Deducted</span>
                        <span className="font-bold">₹{totals.tds.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ ...otherData, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default OtherIncomeForm;
