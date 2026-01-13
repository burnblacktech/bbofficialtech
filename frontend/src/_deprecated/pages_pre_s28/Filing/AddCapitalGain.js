// =====================================================
// ADD CAPITAL GAIN - Multi-step Form (ITR-2)
// Progressive Entry: Asset → Purchase → Sale → Impact
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const AddCapitalGain = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const assetType = searchParams.get('type') || 'equity';

    const [step, setStep] = useState(1);
    const [filing, setFiling] = useState(null);
    const [formData, setFormData] = useState({
        assetType,
        assetName: '',
        broker: '',
        purchaseDate: '',
        purchaseValue: '',
        purchaseExpenses: '',
        saleDate: '',
        saleValue: '',
        saleExpenses: '',
    });

    const [taxCalculation, setTaxCalculation] = useState(null);

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    useEffect(() => {
        if (step === 4 && formData.saleDate && formData.saleValue) {
            calculateTax();
        }
    }, [step, formData]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            setFiling(response.data.data || response.data);
        } catch (err) {
            toast.error('Failed to load filing');
        }
    };

    const calculateTax = () => {
        const purchaseDate = new Date(formData.purchaseDate + '-01');
        const saleDate = new Date(formData.saleDate + '-01');

        // Calculate holding period in months
        const holdingMonths = (saleDate.getFullYear() - purchaseDate.getFullYear()) * 12
            + (saleDate.getMonth() - purchaseDate.getMonth());

        // Determine if STCG or LTCG (12 months for equity)
        const isLongTerm = holdingMonths >= 12;

        // Calculate gain
        const totalCost = parseFloat(formData.purchaseValue) + parseFloat(formData.purchaseExpenses || 0);
        const totalSale = parseFloat(formData.saleValue) - parseFloat(formData.saleExpenses || 0);
        const gain = totalSale - totalCost;

        // Calculate tax
        let taxAmount = 0;
        let taxRate = 0;

        if (isLongTerm) {
            // LTCG: 10% above ₹1 lakh exemption
            taxRate = 10;
            const exemption = 100000;
            if (gain > exemption) {
                taxAmount = (gain - exemption) * 0.10;
            }
        } else {
            // STCG: 15% flat
            taxRate = 15;
            taxAmount = gain * 0.15;
        }

        setTaxCalculation({
            holdingMonths,
            isLongTerm,
            gain,
            taxType: isLongTerm ? 'LTCG' : 'STCG',
            section: isLongTerm ? '112A' : '111A',
            taxRate,
            taxAmount,
            totalCost,
            totalSale,
        });
    };

    const handleNext = () => {
        // Validation for each step
        if (step === 1 && !formData.assetName) {
            toast.error('Please enter asset name');
            return;
        }
        if (step === 2 && (!formData.purchaseDate || !formData.purchaseValue)) {
            toast.error('Please enter purchase date and price');
            return;
        }
        if (step === 3 && (!formData.saleDate || !formData.saleValue)) {
            toast.error('Please enter sale date and price');
            return;
        }

        setStep(step + 1);
    };

    const handleBack = () => {
        if (step === 1) {
            navigate(`/filing/${filingId}/capital-gains-story`);
        } else {
            setStep(step - 1);
        }
    };

    const handleSave = async () => {
        try {
            const event = {
                id: uuidv4(),
                ...formData,
                ...taxCalculation,
                purchaseValue: parseFloat(formData.purchaseValue),
                purchaseExpenses: parseFloat(formData.purchaseExpenses || 0),
                saleValue: parseFloat(formData.saleValue),
                saleExpenses: parseFloat(formData.saleExpenses || 0),
            };

            const existingEvents = filing?.jsonPayload?.income?.capitalGains?.events || [];

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        capitalGains: {
                            ...filing.jsonPayload?.income?.capitalGains,
                            intent: true,
                            events: [...existingEvents, event],
                        },
                    },
                },
            }, { headers });

            toast.success('Sale added successfully');
            navigate(`/filing/${filingId}/capital-gains-story`);
        } catch (error) {
            toast.error('Failed to save sale');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s < step ? 'bg-green-500 text-white' :
                                    s === step ? 'bg-primary-600 text-white' :
                                        'bg-slate-200 text-slate-400'
                                    }`}>
                                    {s < step ? <Check className="w-5 h-5" /> : s}
                                </div>
                                {s < 4 && (
                                    <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-sm text-slate-600">
                        Step {step} of 4
                    </div>
                </div>

                {/* Step 1: Asset Details */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Stocks or mutual funds
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Tell us about what you sold
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Asset name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.assetName}
                                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g., Reliance shares, HDFC Mutual Fund"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Where did you buy/sell? (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.broker}
                                    onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g., Zerodha, Groww, HDFC Securities"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    ℹ️ We'll calculate if this is short-term or long-term based on how long you held it.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Purchase Details */}
                {step === 2 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Purchase details
                        </h2>
                        <p className="text-slate-600 mb-6">
                            When did you buy this?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Purchase date *
                                </label>
                                <input
                                    type="month"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Purchase price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.purchaseValue}
                                        onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="50,000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Any expenses? (Optional)
                                </label>
                                <p className="text-xs text-slate-500 mb-2">Brokerage, fees, etc.</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.purchaseExpenses}
                                        onChange={(e) => setFormData({ ...formData, purchaseExpenses: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="1,000"
                                    />
                                </div>
                            </div>

                            {formData.purchaseValue && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <p className="text-sm text-slate-700">
                                        💡 Total cost: {formatCurrency(
                                            parseFloat(formData.purchaseValue) + parseFloat(formData.purchaseExpenses || 0),
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Sale Details */}
                {step === 3 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Sale details
                        </h2>
                        <p className="text-slate-600 mb-6">
                            When did you sell this?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Sale date *
                                </label>
                                <input
                                    type="month"
                                    value={formData.saleDate}
                                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    max="2024-03"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Sale price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.saleValue}
                                        onChange={(e) => setFormData({ ...formData, saleValue: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="150,000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Any expenses? (Optional)
                                </label>
                                <p className="text-xs text-slate-500 mb-2">Brokerage, fees, etc.</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.saleExpenses}
                                        onChange={(e) => setFormData({ ...formData, saleExpenses: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="500"
                                    />
                                </div>
                            </div>

                            {formData.saleValue && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <p className="text-sm text-slate-700">
                                        💡 Total received: {formatCurrency(
                                            parseFloat(formData.saleValue) - parseFloat(formData.saleExpenses || 0),
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Tax Impact */}
                {step === 4 && taxCalculation && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Your tax on this sale
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Here's what you'll pay
                        </p>

                        <div className="space-y-6">
                            <div className={`border-2 rounded-lg p-4 ${taxCalculation.isLongTerm ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                                }`}>
                                <p className={`font-medium ${taxCalculation.isLongTerm ? 'text-green-800' : 'text-orange-800'
                                    }`}>
                                    ✅ This is a {taxCalculation.isLongTerm ? 'long-term' : 'short-term'} gain
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    You held this for {taxCalculation.holdingMonths} months
                                    {!taxCalculation.isLongTerm && ' (Less than 12 months)'}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium text-slate-900 mb-3">Calculation</h3>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Sale price:</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(formData.saleValue))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Purchase cost:</span>
                                        <span className="font-medium">{formatCurrency(taxCalculation.totalCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Sale expenses:</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(formData.saleExpenses || 0))}</span>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 mt-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-slate-900">Your gain:</span>
                                            <span className="text-slate-900">{formatCurrency(taxCalculation.gain)}</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 mt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">
                                                Tax rate (Section {taxCalculation.section}):
                                            </span>
                                            <span className="font-medium">{taxCalculation.taxRate}%</span>
                                        </div>
                                    </div>
                                    <div className="border-t-2 border-slate-400 pt-2 mt-2">
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span className="text-slate-900">Tax to pay:</span>
                                            <span className="text-primary-600">{formatCurrency(taxCalculation.taxAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    ℹ️ This will be added to your total tax. You can pay this when filing your return.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={handleBack}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-5 h-5" />
                            Save & Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCapitalGain;
