// =====================================================
// INTEREST INCOME DETAILS - Granular Bank/FD Tracking
// Multiple banks, FDs, TDS tracking, auto-calculations
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Building2, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const InterestIncomeDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [interestSources, setInterestSources] = useState([{
        id: Date.now(),
        type: 'savings', // savings, fd, rd, other
        bankName: '',
        accountNumber: '',
        interestEarned: '',
        tdsDeducted: '' }]);

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

            // Load existing interest data
            const existingInterest = data.jsonPayload?.income?.interest?.sources || [];
            if (existingInterest.length > 0) {
                setInterestSources(existingInterest);
            }
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const addSource = () => {
        setInterestSources([...interestSources, {
            id: Date.now(),
            type: 'savings',
            bankName: '',
            accountNumber: '',
            interestEarned: '',
            tdsDeducted: '' }]);
    };

    const removeSource = (id) => {
        if (interestSources.length === 1) {
            toast.error('At least one source is required');
            return;
        }
        setInterestSources(interestSources.filter(s => s.id !== id));
    };

    const updateSource = (id, field, value) => {
        setInterestSources(interestSources.map(s =>
            s.id === id ? { ...s, [field]: value } : s,
        ));
    };

    const calculateTotals = () => {
        const totalInterest = interestSources.reduce((sum, s) =>
            sum + (parseFloat(s.interestEarned) || 0), 0,
        );
        const totalTDS = interestSources.reduce((sum, s) =>
            sum + (parseFloat(s.tdsDeducted) || 0), 0,
        );
        return { totalInterest, totalTDS };
    };

    const handleSave = async () => {
        try {
            // Validation
            const hasEmpty = interestSources.some(s =>
                !s.bankName || !s.interestEarned,
            );
            if (hasEmpty) {
                toast.error('Please fill bank name and interest amount for all sources');
                return;
            }

            const { totalInterest, totalTDS } = calculateTotals();

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        interest: {
                            sources: interestSources,
                            totalInterest,
                            totalTDS,
                            complete: true } } } }, { headers });

            toast.success('Interest income saved successfully');
            navigate(`/filing/${filingId}/overview`);
        } catch (error) {
            toast.error('Failed to save interest income');
        }
    };

    const { totalInterest, totalTDS } = calculateTotals();

    if (loading) {

  return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Overview</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Interest Income</h1>
                    <p className="text-slate-600">
                        Add interest earned from savings accounts, fixed deposits, and other sources
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Include all interest income</p>
                        <p>Savings bank interest, FD interest, RD interest, and any other interest earned during the financial year</p>
                    </div>
                </div>

                {/* Interest Sources */}
                <div className="space-y-4 mb-6">
                    {interestSources.map((source, index) => (
                        <div key={source.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Source #{index + 1}
                                    </h3>
                                </div>
                                {interestSources.length > 1 && (
                                    <button
                                        onClick={() => removeSource(source.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Type
                                    </label>
                                    <select
                                        value={source.type}
                                        onChange={(e) => updateSource(source.id, 'type', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="savings">Savings Account</option>
                                        <option value="fd">Fixed Deposit</option>
                                        <option value="rd">Recurring Deposit</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Bank Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={source.bankName}
                                        onChange={(e) => updateSource(source.id, 'bankName', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g., HDFC Bank"
                                    />
                                </div>

                                {/* Account Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Account Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={source.accountNumber}
                                        onChange={(e) => updateSource(source.id, 'accountNumber', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Last 4 digits"
                                    />
                                </div>

                                {/* Interest Earned */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Interest Earned *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={source.interestEarned}
                                            onChange={(e) => updateSource(source.id, 'interestEarned', e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* TDS Deducted */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        TDS Deducted (if any)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={source.tdsDeducted}
                                            onChange={(e) => updateSource(source.id, 'tdsDeducted', e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">TDS is usually deducted if interest exceeds ₹40,000 (₹50,000 for senior citizens)</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Source Button */}
                <button
                    onClick={addSource}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Source
                </button>

                {/* Summary */}
                <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Total Interest Income</p>
                            <p className="text-2xl font-bold text-emerald-600">₹{totalInterest.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Total TDS Deducted</p>
                            <p className="text-2xl font-bold text-slate-900">₹{totalTDS.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterestIncomeDetails;
