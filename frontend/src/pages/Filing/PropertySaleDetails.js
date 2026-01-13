// =====================================================
// PROPERTY SALE DETAILS
// Handles Capital Gains from Residential/Commercial Property
// Includes Form 16B OCR Integration
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Landmark, Calendar, DollarSign, ArrowLeft, ArrowRight, UploadCloud } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import FileUpload from '../../components/Documents/FileUpload';
import documentService from '../../services/api/documentService';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const PropertySaleDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        assetType: 'property',
        propertyName: '',
        purchaseDate: '',
        purchaseValue: '',
        saleDate: '',
        saleValue: '',
        expenses: '',
        isCoOwned: false,
        share: 100,
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

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

    const handleForm16BUpload = async (results) => {
        const success = results.find(r => r.success);
        if (!success) return;

        const file = success.file;
        try {
            toast.loading('Extracting data from Form 16B...', { id: 'ocr' });
            const result = await documentService.processForm16B(file);
            if (result.success && result.extractedData) {
                const data = result.extractedData;
                setFormData(prev => ({
                    ...prev,
                    saleValue: data.financial?.consideration || prev.saleValue,
                    expenses: (parseFloat(prev.expenses) || 0) + (data.financial?.tds || 0),
                }));
                toast.success('Form 16B data extracted!', { id: 'ocr' });
                setStep(2); // Jump to details
            }
        } catch (err) {
            toast.error('Failed to process Form 16B', { id: 'ocr' });
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const transactions = filing.jsonPayload?.income?.capitalGains?.transactions || [];
            const newTransaction = {
                id: uuidv4(),
                ...formData,
                purchaseValue: parseFloat(formData.purchaseValue),
                saleValue: parseFloat(formData.saleValue),
                expenses: parseFloat(formData.expenses || 0),
            };

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        capitalGains: {
                            ...filing.jsonPayload?.income?.capitalGains,
                            transactions: [...transactions, newTransaction],
                            intent: { declared: true },
                        },
                    },
                },
            }, { headers });

            toast.success('Property sale added');
            navigate(`/filing/${filingId}/capital-gains-story`);
        } catch (error) {
            toast.error('Failed to save details');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-3xl font-serif font-medium text-slate-900">
                        Property Sale Details
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Add details of residential or commercial property sold during the year.
                    </p>
                </div>

                {/* Step Progress */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-primary-600' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <ReassuranceBanner message="Form 16B is the easiest way to add these details accurately." />

                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2 bg-primary-600 rounded-lg">
                                    <UploadCloud className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Upload Form 16B</h2>
                                    <p className="text-sm text-slate-600">The TDS certificate provided by your buyer.</p>
                                </div>
                            </div>
                            <FileUpload
                                onUploadComplete={handleForm16BUpload}
                                category="FORM_16B"
                                filingId={filingId}
                                maxFiles={1}
                                className="bg-white"
                            />
                        </div>

                        <div className="text-center py-4">
                            <div className="flex items-center gap-4 text-slate-300 mb-4">
                                <div className="h-px flex-1 bg-current" />
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">or enter manually</span>
                                <div className="h-px flex-1 bg-current" />
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="text-primary-600 font-semibold hover:underline"
                            >
                                I don't have Form 16B, let me type it in
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <Card>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Property Name/Address</label>
                            <input
                                type="text"
                                value={formData.propertyName}
                                onChange={e => setFormData({ ...formData, propertyName: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g. Apartment in HSR Layout"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase Date</label>
                                <input
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sale Date</label>
                                <input
                                    type="date"
                                    value={formData.saleDate}
                                    onChange={e => setFormData({ ...formData, saleDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={formData.purchaseValue}
                                        onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })}
                                        className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sale Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={formData.saleValue}
                                        onChange={e => setFormData({ ...formData, saleValue: e.target.value })}
                                        className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </Card>
                )}

                {step === 3 && (
                    <Card>
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                            <h3 className="text-yellow-800 font-semibold mb-1 flex items-center gap-2">
                                <Landmark className="w-4 h-4" />
                                Tax Indexation Applied
                            </h3>
                            <p className="text-sm text-yellow-700">We will automatically apply cost inflation index (CII) to minimize your tax liability.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Transfer Expenses (Brokerage, etc.)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                <input
                                    type="number"
                                    value={formData.expenses}
                                    onChange={e => setFormData({ ...formData, expenses: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button
                                onClick={handleSave}
                                className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg"
                            >
                                Confirm & Save Property Sale
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full mt-4 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                            >
                                Back to details
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PropertySaleDetails;
