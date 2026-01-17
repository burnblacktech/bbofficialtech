import React, { useState, useEffect } from 'react';
import { Briefcase, Upload, Edit3, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../atoms/Button';
import DocumentUploadZone from '../molecules/DocumentUploadZone';
import { tokens } from '../../styles/tokens';

const SalaryIncomeModal = ({ onClose, onSave, isProcessing }) => {
    const [inputMethod, setInputMethod] = useState('manual'); // 'manual' | 'upload'

    const [salaryData, setSalaryData] = useState({
        employerName: '',
        employerPAN: '',
        grossSalary: '',
        professionalTax: '',
        standardDeduction: 50000, // Auto-filled
        hraReceived: '',
        hraExempt: 0, // Auto-calculated
        otherAllowances: '',
        netTaxableSalary: 0, // Auto-calculated
        form16Uploaded: false,
        form16Url: '',
    });

    // Auto-calculate HRA exemption
    const calculateHRAExemption = (grossSalary, hraReceived) => {
        if (!grossSalary || !hraReceived) return 0;

        const gross = parseFloat(grossSalary);
        const hra = parseFloat(hraReceived);

        // Simplified HRA calculation (actual is more complex)
        // Exemption = minimum of:
        // 1. Actual HRA received
        // 2. 50% of basic salary (assuming basic = 50% of gross)
        // 3. Rent paid - 10% of basic salary

        const basicSalary = gross * 0.5; // Assumption
        const fiftyPercentBasic = basicSalary * 0.5;

        // For simplicity, we'll use the minimum of actual HRA and 50% of basic
        const exemption = Math.min(hra, fiftyPercentBasic);

        return Math.round(exemption);
    };

    // Auto-calculate Net Taxable Salary
    useEffect(() => {
        const gross = parseFloat(salaryData.grossSalary) || 0;
        const profTax = parseFloat(salaryData.professionalTax) || 0;
        const stdDeduction = parseFloat(salaryData.standardDeduction) || 0;
        const hraRec = parseFloat(salaryData.hraReceived) || 0;
        const otherAllow = parseFloat(salaryData.otherAllowances) || 0;

        // Calculate HRA exemption
        const hraExempt = calculateHRAExemption(gross, hraRec);

        // Net Taxable = Gross - Professional Tax - Standard Deduction - HRA Exempt + Other Allowances
        const netTaxable = gross - profTax - stdDeduction - hraExempt + otherAllow;

        setSalaryData(prev => ({
            ...prev,
            hraExempt,
            netTaxableSalary: Math.max(0, Math.round(netTaxable)),
        }));
    }, [
        salaryData.grossSalary,
        salaryData.professionalTax,
        salaryData.standardDeduction,
        salaryData.hraReceived,
        salaryData.otherAllowances,
    ]);

    const handleChange = (field, value) => {
        setSalaryData({ ...salaryData, [field]: value });
    };

    const handleForm16Upload = (extractedData) => {
        // Map extracted data from Form 16 to salary fields
        setSalaryData({
            ...salaryData,
            employerName: extractedData.employerName || salaryData.employerName,
            employerPAN: extractedData.employerPAN || salaryData.employerPAN,
            grossSalary: extractedData.grossSalary || salaryData.grossSalary,
            professionalTax: extractedData.professionalTax || salaryData.professionalTax,
            hraReceived: extractedData.hraReceived || salaryData.hraReceived,
            form16Uploaded: true,
            form16Url: extractedData.fileUrl || '',
        });
        setInputMethod('manual'); // Switch to manual for review
        toast.success('Form 16 data extracted! Please review and confirm.');
    };

    const validatePAN = (pan) => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!salaryData.employerName) {
            toast.error('Please enter employer name');
            return;
        }

        if (!salaryData.grossSalary || parseFloat(salaryData.grossSalary) <= 0) {
            toast.error('Please enter valid gross salary');
            return;
        }

        if (salaryData.employerPAN && !validatePAN(salaryData.employerPAN)) {
            toast.error('Invalid PAN format (e.g., ABCDE1234F)');
            return;
        }

        // Construct payload
        const payload = {
            type: 'salary',
            data: {
                ...salaryData,
                amount: salaryData.netTaxableSalary, // This is the taxable amount
                description: `Salary from ${salaryData.employerName}`,
            },
        };

        onSave(payload);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Input Method Toggle */}
            <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <button
                    type="button"
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${inputMethod === 'upload'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                    onClick={() => setInputMethod('upload')}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={24} />
                        <span className="font-medium text-sm">Upload Form 16</span>
                        <span className="text-xs text-gray-500">Auto-fill instantly</span>
                    </div>
                </button>
                <button
                    type="button"
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${inputMethod === 'manual'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                    onClick={() => setInputMethod('manual')}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Edit3 size={24} />
                        <span className="font-medium text-sm">Manual Entry</span>
                        <span className="text-xs text-gray-500">Enter details yourself</span>
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-1">
                {inputMethod === 'upload' ? (
                    <div className="animate-fade-in">
                        <DocumentUploadZone
                            documentType="form16"
                            title="Upload Form 16"
                            description="PDF or image supported. We'll extract salary details automatically."
                            onExtractedData={handleForm16Upload}
                        />
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                            <strong>Tip:</strong> Form 16 is provided by your employer. It contains all salary details including deductions.
                        </div>
                    </div>
                ) : (
                    <form id="salary-form" onSubmit={handleSubmit} className="space-y-5">
                        {salaryData.form16Uploaded && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                                <Briefcase size={16} />
                                <span>Form 16 uploaded! Review the auto-filled details below.</span>
                            </div>
                        )}

                        {/* Employer Details */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Briefcase size={18} />
                                Employer Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Acme Corporation"
                                        value={salaryData.employerName}
                                        onChange={(e) => handleChange('employerName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employer PAN (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                                        placeholder="ABCDE1234F"
                                        value={salaryData.employerPAN}
                                        onChange={(e) => handleChange('employerPAN', e.target.value.toUpperCase())}
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Salary Components */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calculator size={18} />
                                Salary Components
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gross Salary (Annual) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            value={salaryData.grossSalary}
                                            onChange={(e) => handleChange('grossSalary', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Professional Tax
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            value={salaryData.professionalTax}
                                            onChange={(e) => handleChange('professionalTax', e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Usually ₹2,400 per year</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Standard Deduction
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg bg-gray-50"
                                            value={salaryData.standardDeduction}
                                            readOnly
                                        />
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">✓ Auto-filled (₹50,000)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        HRA Received
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            value={salaryData.hraReceived}
                                            onChange={(e) => handleChange('hraReceived', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {salaryData.hraReceived > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            HRA Exempt
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-3 py-2 border rounded-lg bg-green-50 text-green-700 font-semibold"
                                                value={salaryData.hraExempt}
                                                readOnly
                                            />
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">✓ Auto-calculated</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Other Allowances
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            value={salaryData.otherAllowances}
                                            onChange={(e) => handleChange('otherAllowances', e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">LTA, Special Allowance, etc.</p>
                                </div>
                            </div>
                        </div>

                        {/* Net Taxable Salary - Highlighted */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Net Taxable Salary</p>
                                    <p className="text-3xl font-bold text-blue-700">
                                        ₹{salaryData.netTaxableSalary.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-600">
                                    <p>Gross: ₹{(parseFloat(salaryData.grossSalary) || 0).toLocaleString('en-IN')}</p>
                                    <p>- Deductions: ₹{(
                                        (parseFloat(salaryData.professionalTax) || 0) +
                                        (parseFloat(salaryData.standardDeduction) || 0) +
                                        salaryData.hraExempt
                                    ).toLocaleString('en-IN')}</p>
                                    <p>+ Allowances: ₹{(parseFloat(salaryData.otherAllowances) || 0).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isProcessing || inputMethod === 'upload'}
                >
                    {isProcessing ? 'Saving...' : 'Save Salary Income'}
                </Button>
            </div>
        </div>
    );
};

export default SalaryIncomeModal;
