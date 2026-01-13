// =====================================================
// OTHER INCOME DETAILS
// Handles Interest, Dividends, and Other Sources
// Includes Form 16A OCR Integration
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, Plus, Check, Info, UploadCloud } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import FileUpload from '../../components/Documents/FileUpload';
import documentService from '../../services/api/documentService';

const API_BASE_URL = getApiBaseUrl();

const OtherIncomeDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        interestIncome: '',
        dividendIncome: '',
        otherIncome: '',
    });

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const data = response.data.data || response.data;
            setFiling(data);

            const income = data.jsonPayload?.income || {};
            setFormData({
                interestIncome: income.interestIncome || '',
                dividendIncome: income.dividendIncome || '',
                otherIncome: income.otherIncome || '',
            });
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        interestIncome: formData.interestIncome ? parseFloat(formData.interestIncome) : 0,
                        dividendIncome: formData.dividendIncome ? parseFloat(formData.dividendIncome) : 0,
                        otherIncome: formData.otherIncome ? parseFloat(formData.otherIncome) : 0,
                        otherSources: {
                            ...filing.jsonPayload?.income?.otherSources,
                            complete: true,
                            intent: true,
                        },
                    },
                },
            }, { headers });

            toast.success('Other income saved');
            navigate(`/filing/${filingId}/income-story`);
        } catch (error) {
            toast.error('Failed to save other income');
        }
    };

    const handleForm16AUpload = async (results) => {
        const success = results.find(r => r.success);
        if (!success) return;

        const file = success.file;
        try {
            toast.loading('Extracting data from Form 16A...', { id: 'ocr' });
            const result = await documentService.processForm16A(file);
            if (result.success && result.extractedData) {
                const data = result.extractedData;
                const extractedAmount = data.financial?.amountPaid || 0;
                setFormData(prev => ({
                    ...prev,
                    interestIncome: (parseFloat(prev.interestIncome) || 0) + extractedAmount,
                }));
                toast.success(`Success! Added ₹${extractedAmount} to interest income.`, { id: 'ocr' });
            } else {
                toast.error('Could not extract data. Please enter manually.', { id: 'ocr' });
            }
        } catch (err) {
            toast.error('Failed to process Form 16A', { id: 'ocr' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Other Income
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Include income from interest, dividends, or any other sources.
                    </p>
                </div>

                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="Commonly includes FD interest, savings interest, and dividends."
                    />
                </div>

                {/* Form 16A Upload */}
                <div className="mb-8">
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-primary-600 rounded-lg">
                                <UploadCloud className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Add via Form 16A</h2>
                                <p className="text-sm text-slate-600">Drop your TDS certificates (Form 16A) for automatic interest capture</p>
                            </div>
                        </div>
                        <FileUpload
                            onUploadComplete={handleForm16AUpload}
                            category="FORM_16A"
                            filingId={filingId}
                            maxFiles={5}
                            className="bg-white border-2 border-dashed border-primary-200"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Interest Income
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                value={formData.interestIncome}
                                onChange={(e) => setFormData({ ...formData, interestIncome: e.target.value })}
                                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. 50000"
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Includes savings bank interest, FD interest, etc.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Dividend Income
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                value={formData.dividendIncome}
                                onChange={(e) => setFormData({ ...formData, dividendIncome: e.target.value })}
                                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. 15000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Any Other Income
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                value={formData.otherIncome}
                                onChange={(e) => setFormData({ ...formData, otherIncome: e.target.value })}
                                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. 10000"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-4 px-6 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-3 bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 shadow-md hover:shadow-lg transition-all"
                    >
                        Save & continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtherIncomeDetails;
