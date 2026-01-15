import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ValidatedNumberInput from '../../../components/common/ValidatedNumberInput';

/**
 * Section 80C Details Form Component
 * Inline form for editing Section 80C deductions
 */
const Section80CForm = ({ data, onChange, onSave }) => {
    const [investments, setInvestments] = useState(data?.investments || []);

    const investmentTypes = [
        { id: 'ppf', label: 'PPF (Public Provident Fund)', limit: 150000 },
        { id: 'elss', label: 'ELSS (Equity Linked Savings Scheme)', limit: 150000 },
        { id: 'lic', label: 'LIC Premium', limit: 150000 },
        { id: 'nsc', label: 'NSC (National Savings Certificate)', limit: 150000 },
        { id: 'homeLoan', label: 'Home Loan Principal', limit: 150000 },
        { id: 'tuitionFees', label: 'Tuition Fees', limit: 150000 },
        { id: 'sukanya', label: 'Sukanya Samriddhi Account', limit: 150000 },
        { id: 'fd', label: '5-Year Bank FD', limit: 150000 },
    ];

    const handleInvestmentChange = (type, amount) => {
        const updated = investments.filter(inv => inv.type !== type);
        if (amount > 0) {
            updated.push({ type, amount: parseFloat(amount) || 0 });
        }
        setInvestments(updated);

        const total = calculateTotal(updated);
        onChange({ investments: updated, total });
    };

    const calculateTotal = (investmentsList) => {
        const sum = investmentsList.reduce((acc, inv) => acc + inv.amount, 0);
        return Math.min(sum, 150000); // Cap at 1.5L
    };

    const getInvestmentAmount = (type) => {
        const inv = investments.find(i => i.type === type);
        return inv ? inv.amount : '';  // Return blank instead of 0
    };

    const total = calculateTotal(investments);
    const remaining = 150000 - total;

    return (
        <div className="p-4 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Section 80C Limit:</strong> Maximum deduction of ₹1,50,000 per year
                </p>
            </div>

            {/* Investment Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {investmentTypes.map((type) => (
                    <div key={type.id} className="bg-white rounded-lg border border-slate-200 p-3">
                        <ValidatedNumberInput
                            name={type.id}
                            label={type.label}
                            value={getInvestmentAmount(type.id)}
                            onChange={(field, value) => handleInvestmentChange(type.id, value)}
                            placeholder="Enter amount"
                            max={type.limit}
                            showCurrency={true}
                        />
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700">Total Section 80C</h4>
                    <p className="text-2xl font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(total / 150000) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                        {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : 'Limit reached ✓'}
                    </span>
                    <span className="text-slate-600">
                        {((total / 150000) * 100).toFixed(0)}% utilized
                    </span>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ investments, total })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default Section80CForm;
