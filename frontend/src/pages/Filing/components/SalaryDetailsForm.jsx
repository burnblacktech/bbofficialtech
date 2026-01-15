import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import ValidatedNumberInput from '../../../components/common/ValidatedNumberInput';

/**
 * Salary Details Form Component
 * Inline form for editing salary income within the unified dashboard
 */
const SalaryDetailsForm = ({ data, onChange, onSave }) => {
    const [employers, setEmployers] = useState(data?.employers || [
        {
            id: Date.now(),
            name: '',
            grossSalary: '',  // Blank default instead of 0
            tdsDeducted: '',
            standardDeduction: '',  // Blank instead of 50000
            professionalTax: '',
        },
    ]);

    const handleEmployerChange = (index, field, value) => {
        const updated = [...employers];
        updated[index][field] = value;
        setEmployers(updated);

        // Calculate totals and notify parent
        const totals = calculateTotals(updated);
        onChange({ employers: updated, ...totals });
    };

    const addEmployer = () => {
        setEmployers([
            ...employers,
            {
                id: Date.now(),
                name: '',
                grossSalary: '',
                tdsDeducted: '',
                standardDeduction: '',
                professionalTax: '',
            },
        ]);
    };

    const removeEmployer = (index) => {
        const updated = employers.filter((_, i) => i !== index);
        setEmployers(updated);

        const totals = calculateTotals(updated);
        onChange({ employers: updated, ...totals });
    };

    const calculateTotals = (employersList) => {
        const totalGross = employersList.reduce((sum, emp) => sum + (parseFloat(emp.grossSalary) || 0), 0);
        const totalTDS = employersList.reduce((sum, emp) => sum + (parseFloat(emp.tdsDeducted) || 0), 0);
        const totalStandardDeduction = employersList.reduce((sum, emp) => sum + (parseFloat(emp.standardDeduction) || 0), 0);
        const totalProfessionalTax = employersList.reduce((sum, emp) => sum + (parseFloat(emp.professionalTax) || 0), 0);

        const netSalary = totalGross - totalStandardDeduction - totalProfessionalTax;

        return {
            total: netSalary,
            grossTotal: totalGross,
            tds: totalTDS,
            standardDeduction: totalStandardDeduction,
            professionalTax: totalProfessionalTax,
        };
    };

    const totals = calculateTotals(employers);

    return (
        <div className="p-4 space-y-4">
            {/* Employers List */}
            {employers.map((employer, index) => (
                <div key={employer.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-900">
                            Employer {index + 1}
                        </h4>
                        {employers.length > 1 && (
                            <button
                                onClick={() => removeEmployer(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Employer Name
                            </label>
                            <input
                                type="text"
                                value={employer.name}
                                onChange={(e) => handleEmployerChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., ABC Corporation"
                            />
                        </div>

                        <ValidatedNumberInput
                            name="grossSalary"
                            label="Gross Salary"
                            value={employer.grossSalary}
                            onChange={(field, value) => handleEmployerChange(index, field, value)}
                            placeholder="Enter gross salary"
                            helpText="Annual gross salary from this employer"
                            showCurrency={true}
                        />

                        <ValidatedNumberInput
                            name="tdsDeducted"
                            label="TDS Deducted"
                            value={employer.tdsDeducted}
                            onChange={(field, value) => handleEmployerChange(index, field, value)}
                            placeholder="Enter TDS amount"
                            helpText="Tax deducted at source"
                            showCurrency={true}
                        />

                        <ValidatedNumberInput
                            name="standardDeduction"
                            label="Standard Deduction"
                            value={employer.standardDeduction}
                            onChange={(field, value) => handleEmployerChange(index, field, value)}
                            placeholder="Enter amount"
                            helpText="Max ₹50,000 per year"
                            max={50000}
                            showCurrency={true}
                        />

                        <ValidatedNumberInput
                            name="professionalTax"
                            label="Professional Tax"
                            value={employer.professionalTax}
                            onChange={(field, value) => handleEmployerChange(index, field, value)}
                            placeholder="Enter amount"
                            helpText="State professional tax paid"
                            max={2500}
                            showCurrency={true}
                        />
                    </div>

                    {/* Form 16 Upload */}
                    <div className="mt-3">
                        <button className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Form 16
                        </button>
                    </div>
                </div>
            ))}

            {/* Add Employer Button */}
            <button
                onClick={addEmployer}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 border-2 border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
            >
                <Plus className="w-4 h-4" />
                Add Another Employer
            </button>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-slate-600">Total Gross Salary</p>
                        <p className="font-bold text-slate-900">₹{totals.grossTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Total TDS</p>
                        <p className="font-bold text-slate-900">₹{totals.tds.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Standard Deduction</p>
                        <p className="font-bold text-slate-900">₹{totals.standardDeduction.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Net Salary Income</p>
                        <p className="font-bold text-emerald-600">₹{totals.total.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => onSave({ employers, ...totals })}
                className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
                Save & Close
            </button>
        </div>
    );
};

export default SalaryDetailsForm;
