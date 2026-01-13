// =====================================================
// ADD HOUSE PROPERTY - Form (ITR-2)
// Captured fields: Property name/type, Rent, Interest
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Home, Building2, Landmark, HelpCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const AddHouseProperty = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        propertyName: '',
        type: 'self_occupied', // 'self_occupied' or 'let_out'
        rentReceived: '',
        interestOnLoan: '',
    });

    const [impact, setImpact] = useState(null);

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    useEffect(() => {
        if (step === 3) {
            calculateImpact();
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
        } finally {
            setLoading(false);
        }
    };

    const calculateImpact = () => {
        const rent = parseFloat(formData.rentReceived || 0);
        const interest = parseFloat(formData.interestOnLoan || 0);

        let netIncome = 0;
        let standardDeduction = 0;

        if (formData.type === 'let_out') {
            // Net income from let out = Rent - 30% Standard Deduction - Interest
            standardDeduction = rent * 0.3;
            netIncome = rent - standardDeduction - interest;
        } else {
            // Net income from self occupied = -Interest (capped at 2L)
            netIncome = -Math.min(interest, 200000);
        }

        setImpact({
            rent,
            interest,
            standardDeduction,
            netIncome,
            isLoss: netIncome < 0,
        });
    };

    const handleNext = () => {
        if (step === 1 && !formData.propertyName) {
            toast.error('Please enter a name for this property');
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step === 1) {
            navigate(`/filing/${filingId}/house-properties`);
        } else {
            setStep(step - 1);
        }
    };

    const handleSave = async () => {
        try {
            const property = {
                id: uuidv4(),
                ...formData,
                ...impact,
            };

            const existingProperties = filing?.jsonPayload?.income?.houseProperty?.properties || [];

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        houseProperty: {
                            ...filing.jsonPayload?.income?.houseProperty,
                            intent: true,
                            properties: [...existingProperties, property],
                        },
                    },
                },
            }, { headers });

            toast.success('Property details saved');
            navigate(`/filing/${filingId}/house-properties`);
        } catch (error) {
            toast.error('Failed to save property');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-3xl font-serif font-medium text-slate-900">
                        Add Property Details
                    </h1>
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <>
                        <Card>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Give this property a name (e.g., Home in Bangalore)
                                </label>
                                <input
                                    type="text"
                                    value={formData.propertyName}
                                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="My Apartment"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-4">
                                    Is this home:
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'self_occupied' })}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${formData.type === 'self_occupied'
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Home className={`w-6 h-6 mb-2 ${formData.type === 'self_occupied' ? 'text-primary-600' : 'text-slate-400'}`} />
                                        <div className="font-semibold text-slate-900">Self Occupied</div>
                                        <div className="text-xs text-slate-500 mt-1">You or your family live here</div>
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'let_out' })}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${formData.type === 'let_out'
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Building2 className={`w-6 h-6 mb-2 ${formData.type === 'let_out' ? 'text-primary-600' : 'text-slate-400'}`} />
                                        <div className="font-semibold text-slate-900">Let Out</div>
                                        <div className="text-xs text-slate-500 mt-1">Someone else lives here and pays rent</div>
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <button
                            onClick={handleNext}
                            disabled={!formData.propertyName}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            Next: Financials
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Step 2: Financial Details */}
                {step === 2 && (
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-900">Financial Details</h2>

                        {formData.type === 'let_out' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Total rent received during the year
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={formData.rentReceived}
                                        onChange={(e) => setFormData({ ...formData, rentReceived: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Interest paid on home loan
                                </label>
                                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" title="Interest part of your EMI" />
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-2 text-slate-400">₹</span>
                                <input
                                    type="number"
                                    value={formData.interestOnLoan}
                                    onChange={(e) => setFormData({ ...formData, interestOnLoan: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic">
                                Disclosure: You can usually find this in your loan interest certificate from the bank.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 px-6 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                Calculate Impact
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </Card>
                )}

                {/* Step 3: Impact */}
                {step === 3 && impact && (
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-900">Tax Impact</h2>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            {formData.type === 'let_out' && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Gross Rent:</span>
                                        <span className="font-medium">{formatCurrency(impact.rent)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Standard Deduction (30%):</span>
                                        <span className="text-green-600">-{formatCurrency(impact.standardDeduction)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Interest on Loan:</span>
                                <span className="text-green-600">-{formatCurrency(impact.interest)}</span>
                            </div>

                            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-lg font-bold">
                                <span className="text-slate-900">
                                    {impact.isLoss ? 'Net Loss from House:' : 'Net Taxable Income:'}
                                </span>
                                <span className={impact.isLoss ? 'text-green-600' : 'text-slate-900'}>
                                    {formatCurrency(impact.netIncome)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                {impact.isLoss
                                    ? 'Good news! This loss will reduce your total taxable income, lowering your overall tax.'
                                    : 'This income will be added to your total earnings for tax calculation.'}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 px-6 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Check className="w-5 h-5" />
                                Save & Continue
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AddHouseProperty;
