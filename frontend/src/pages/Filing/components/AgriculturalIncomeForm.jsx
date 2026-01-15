import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { ITR_VALIDATION_RULES } from '../../../utils/validationRules';

/**
 * Agricultural Income Form Component
 * Required for ITR-2 if agricultural income > ₹5,000
 */
const AgriculturalIncomeForm = ({ data, onChange, onSave }) => {
    const [agriData, setAgriData] = useState(data || {
        landLocation: 'rural', // rural or urban
        areaOfLand: '',
        cropType: '',
        grossIncome: 0,
        expenses: 0,
    });

    const handleChange = (field, value) => {
        const updated = { ...agriData, [field]: value };
        setAgriData(updated);

        const totals = calculateTotals(updated);
        onChange({ ...updated, ...totals });
    };

    const calculateTotals = (data) => {
        const grossIncome = parseFloat(data.grossIncome) || 0;
        const expenses = parseFloat(data.expenses) || 0;
        const netIncome = grossIncome - expenses;

        return {
            total: netIncome,
            grossIncome,
            expenses,
            netIncome,
        };
    };

    const totals = calculateTotals(agriData);

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs text-emerald-800">
                    <strong>Note:</strong> Agricultural income is exempt from tax but must be reported if exceeds ₹5,000.
                    It is used for rate calculation if total income {'>'} ₹5 lakhs.
                </p>
            </div>

            {/* Warning for Urban Land */}
            {agriData.landLocation === 'urban' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                        ⚠️ <strong>Warning:</strong> Agricultural income from urban land is NOT exempt and will be taxed as business income.
                    </p>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Land Location
                    </label>
                    <select
                        value={agriData.landLocation}
                        onChange={(e) => handleChange('landLocation', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="rural">Rural Area (Exempt)</option>
                        <option value="urban">Urban Area (Taxable)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Area of Land (in acres)
                    </label>
                    <input
                        type="text"
                        value={agriData.areaOfLand}
                        onChange={(e) => handleChange('areaOfLand', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 2.5 acres"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Type of Crop/Produce
                    </label>
                    <input
                        type="text"
                        value={agriData.cropType}
                        onChange={(e) => handleChange('cropType', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Rice, Wheat, Vegetables"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Gross Agricultural Income
                    </label>
                    <input
                        type="number"
                        value={agriData.grossIncome}
                        onChange={(e) => handleChange('grossIncome', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Expenses Incurred
                    </label>
                    <input
                        type="number"
                        value={agriData.expenses}
                        onChange={(e) => handleChange('expenses', e.target.value)}
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
                        <span className="text-slate-600">Gross Agricultural Income</span>
                        <span className="font-bold">₹{totals.grossIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Expenses</span>
                        <span className="font-bold text-red-600">-₹{totals.expenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="font-medium">Net Agricultural Income</span>
                        <span className="text-lg font-bold text-emerald-600">₹{totals.netIncome.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {agriData.landLocation === 'rural' && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded">
                        <p className="text-xs text-emerald-800">
                            ✓ This income is exempt from tax
                        </p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ ...agriData, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default AgriculturalIncomeForm;
