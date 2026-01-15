import React, { useState } from 'react';
import { Building2, FileText, PieChart, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../atoms/Button';
import DocumentUploadZone from '../molecules/DocumentUploadZone';
import { tokens } from '../../styles/tokens';

const BusinessIncomeModal = ({ onClose, onSave, isProcessing }) => {
    const [activeTab, setActiveTab] = useState('presumptive'); // 'presumptive' | 'regular'

    // Presumptive State
    const [presumptiveData, setPresumptiveData] = useState({
        section: '44AD', // 44AD or 44ADA
        businessName: '',
        grossReceipts: '',
        netProfit: '', // This is the Deemed Income
        presumptiveRate: 6, // Default 6% for digital
    });

    // Regular State
    const [regularData, setRegularData] = useState({
        uploadMethod: 'upload', // 'upload' | 'manual'
        businessName: '',
        profitLossFile: null,
        manualData: {
            revenue: '',
            expenses: '',
            netProfit: '',
        },
    });

    const handlePresumptiveChange = (field, value) => {
        const newData = { ...presumptiveData, [field]: value };

        // Auto-calculate profit if receipts change (simple logic)
        if (field === 'grossReceipts' && value) {
            const receipts = parseFloat(value);
            const minProfit = (receipts * (newData.presumptiveRate / 100)).toFixed(0);
            if (!newData.netProfit) {
                newData.netProfit = minProfit;
            }
        }

        setPresumptiveData(newData);
    };

    const handleRegularChange = (field, value) => {
        setRegularData({ ...regularData, [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (activeTab === 'presumptive') {
            if (!presumptiveData.businessName || !presumptiveData.grossReceipts) {
                toast.error('Please fill in business details');
                return;
            }

            // Construct Payload for Presumptive
            const payload = {
                type: 'business',
                subType: activeTab,
                data: {
                    ...presumptiveData,
                    amount: parseFloat(presumptiveData.netProfit || 0), // Taxable amount
                    description: `${presumptiveData.businessName} (${presumptiveData.section})`,
                },
            };
            onSave(payload);

        } else {
            // Regular Business Payload
            if (regularData.uploadMethod === 'upload' && !regularData.profitLossFile) {
                toast.error('Please upload your P&L statement');
                return;
            }

            const payload = {
                type: 'business',
                subType: activeTab,
                data: {
                    businessName: regularData.businessName,
                    method: regularData.uploadMethod,
                    file: regularData.profitLossFile,
                    manualDetails: regularData.manualData,
                    // For now, use 0 or manual profit as amount until OCR processes it
                    amount: parseFloat(regularData.manualData.netProfit || 0),
                    description: regularData.businessName || 'Business Income',
                },
            };
            onSave(payload);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`flex-1 pb-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'presumptive'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('presumptive')}
                >
                    <PieChart size={18} />
                    Small Business (Presumptive)
                </button>
                <button
                    className={`flex-1 pb-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'regular'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('regular')}
                >
                    <Building2 size={18} />
                    Regular Business
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                {activeTab === 'presumptive' ? (
                    <form id="presumptive-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
                            <Briefcase className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong>Section 44AD/ADA Benefit:</strong> Declare a flat % of your receipts as profit. No detailed audits required!
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business / Profession Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Acme Consultancy"
                                    value={presumptiveData.businessName}
                                    onChange={(e) => handlePresumptiveChange('businessName', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={presumptiveData.section}
                                    onChange={(e) => handlePresumptiveChange('section', e.target.value)}
                                >
                                    <option value="44AD">Business (Trading/Mfg) - 44AD</option>
                                    <option value="44ADA">Professional (Services) - 44ADA</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Presumptive Rate</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={presumptiveData.presumptiveRate}
                                    onChange={(e) => handlePresumptiveChange('presumptiveRate', e.target.value)}
                                >
                                    {presumptiveData.section === '44ADA' ? (
                                        <option value="50">50% (Professionals)</option>
                                    ) : (
                                        <>
                                            <option value="6">6% (Digital Receipts)</option>
                                            <option value="8">8% (Cash Receipts)</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Gross Receipts (Yearly)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg active:ring-2 active:ring-blue-500"
                                        placeholder="0"
                                        value={presumptiveData.grossReceipts}
                                        onChange={(e) => handlePresumptiveChange('grossReceipts', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deemed Profit (Taxable)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg font-semibold text-green-700 bg-green-50"
                                        value={presumptiveData.netProfit}
                                        onChange={(e) => handlePresumptiveChange('netProfit', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Min {presumptiveData.presumptiveRate}% of receipts</p>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="reg-method"
                                    checked={regularData.uploadMethod === 'upload'}
                                    onChange={() => handleRegularChange('uploadMethod', 'upload')}
                                />
                                <span className="text-sm font-medium">Upload P&L (Recommended)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="reg-method"
                                    checked={regularData.uploadMethod === 'manual'}
                                    onChange={() => handleRegularChange('uploadMethod', 'manual')}
                                />
                                <span className="text-sm font-medium">Manual Entry</span>
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="e.g. My Retail Shop"
                                value={regularData.businessName}
                                onChange={(e) => handleRegularChange('businessName', e.target.value)}
                            />
                        </div>

                        {regularData.uploadMethod === 'upload' ? (
                            <div className="animate-fade-in">
                                <DocumentUploadZone
                                    documentType="pnl"
                                    title="Upload P&L Statement"
                                    description="Excel, PDF supported. We will extract revenue and expenses."
                                    onUploadComplete={(file) => setRegularData({ ...regularData, profitLossFile: file })}
                                    onExtractedData={(data) => {
                                        toast.success('P&L Processed!');
                                        // Potential auto-fill logic here
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="₹"
                                            value={regularData.manualData.revenue}
                                            onChange={(e) => setRegularData({
                                                ...regularData,
                                                manualData: { ...regularData.manualData, revenue: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Expenses</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="₹"
                                            value={regularData.manualData.expenses}
                                            onChange={(e) => setRegularData({
                                                ...regularData,
                                                manualData: { ...regularData.manualData, expenses: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Profit / Loss</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg font-bold" placeholder="₹"
                                            value={regularData.manualData.netProfit}
                                            onChange={(e) => setRegularData({
                                                ...regularData,
                                                manualData: { ...regularData.manualData, netProfit: e.target.value },
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : 'Save Business Income'}
                </Button>
            </div>
        </div>
    );
};

export default BusinessIncomeModal;
