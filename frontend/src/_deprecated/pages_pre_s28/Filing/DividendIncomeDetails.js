// =====================================================
// DIVIDEND INCOME DETAILS - Granular Stock/MF Tracking
// Equity dividends, mutual fund dividends, TDS tracking
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, TrendingUp, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const DividendIncomeDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [dividendSources, setDividendSources] = useState([{
        id: Date.now(),
        type: 'equity', // equity, mutual_fund
        companyName: '',
        dividendReceived: '',
        tdsDeducted: '',
    }]);

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

            // Load existing dividend data
            const existingDividends = data.jsonPayload?.income?.dividends?.sources || [];
            if (existingDividends.length > 0) {
                setDividendSources(existingDividends);
            }
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const addSource = () => {
        setDividendSources([...dividendSources, {
            id: Date.now(),
            type: 'equity',
            companyName: '',
            dividendReceived: '',
            tdsDeducted: '',
        }]);
    };

    const removeSource = (id) => {
        if (dividendSources.length === 1) {
            toast.error('At least one source is required');
            return;
        }
        setDividendSources(dividendSources.filter(s => s.id !== id));
    };

    const updateSource = (id, field, value) => {
        setDividendSources(dividendSources.map(s =>
            s.id === id ? { ...s, [field]: value } : s,
        ));
    };

    const calculateTotals = () => {
        const totalDividend = dividendSources.reduce((sum, s) =>
            sum + (parseFloat(s.dividendReceived) || 0), 0,
        );
        const totalTDS = dividendSources.reduce((sum, s) =>
            sum + (parseFloat(s.tdsDeducted) || 0), 0,
        );
        return { totalDividend, totalTDS };
    };

    const handleSave = async () => {
        try {
            // Validation
            const hasEmpty = dividendSources.some(s =>
                !s.companyName || !s.dividendReceived,
            );
            if (hasEmpty) {
                toast.error('Please fill company/fund name and dividend amount for all sources');
                return;
            }

            const { totalDividend, totalTDS } = calculateTotals();

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        dividends: {
                            sources: dividendSources,
                            totalDividend,
                            totalTDS,
                            complete: true,
                        },
                    },
                },
            }, { headers });

            toast.success('Dividend income saved successfully');
            navigate(`/filing/${filingId}/overview`);
        } catch (error) {
            toast.error('Failed to save dividend income');
        }
    };

    const { totalDividend, totalTDS } = calculateTotals();

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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Dividend Income</h1>
                    <p className="text-slate-600">
                        Add dividends received from equity shares and mutual funds
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Dividends are taxable</p>
                        <p>From FY 2020-21 onwards, dividend income is taxable at your slab rate. TDS @10% is deducted if dividend exceeds ₹5,000 from a single source.</p>
                    </div>
                </div>

                {/* Dividend Sources */}
                <div className="space-y-4 mb-6">
                    {dividendSources.map((source, index) => (
                        <div key={source.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Source #{index + 1}
                                    </h3>
                                </div>
                                {dividendSources.length > 1 && (
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
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="equity">Equity Shares</option>
                                        <option value="mutual_fund">Mutual Funds</option>
                                    </select>
                                </div>

                                {/* Company/Fund Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        {source.type === 'equity' ? 'Company Name' : 'Fund Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={source.companyName}
                                        onChange={(e) => updateSource(source.id, 'companyName', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder={source.type === 'equity' ? 'e.g., Reliance Industries' : 'e.g., HDFC Equity Fund'}
                                    />
                                </div>

                                {/* Dividend Received */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Dividend Received *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={source.dividendReceived}
                                            onChange={(e) => updateSource(source.id, 'dividendReceived', e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* TDS Deducted */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        TDS Deducted (if any)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={source.tdsDeducted}
                                            onChange={(e) => updateSource(source.id, 'tdsDeducted', e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">TDS @ 10% if dividend exceeds ₹5,000 from a single source</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Source Button */}
                <button
                    onClick={addSource}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Source
                </button>

                {/* Summary */}
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Total Dividend Income</p>
                            <p className="text-2xl font-bold text-blue-600">₹{totalDividend.toLocaleString('en-IN')}</p>
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
                        className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DividendIncomeDetails;
