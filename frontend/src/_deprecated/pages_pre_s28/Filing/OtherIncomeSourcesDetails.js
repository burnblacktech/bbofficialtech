// =====================================================
// AGRICULTURAL & DIRECTOR/PARTNER INCOME - ITR-2
// Simple income entry for agricultural and director/partner income
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sprout, Briefcase } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const OtherIncomeSourcesDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        agriculturalIncome: '',
        directorIncome: '',
        partnerIncome: '',
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

            // Pre-populate form
            setFormData({
                agriculturalIncome: data?.jsonPayload?.income?.agricultural || '',
                directorIncome: data?.jsonPayload?.income?.director || '',
                partnerIncome: data?.jsonPayload?.income?.partner || '',
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
                        agricultural: formData.agriculturalIncome ? parseFloat(formData.agriculturalIncome) : 0,
                        director: formData.directorIncome ? parseFloat(formData.directorIncome) : 0,
                        partner: formData.partnerIncome ? parseFloat(formData.partnerIncome) : 0,
                    },
                },
            }, { headers });

            toast.success('Income details saved');
            navigate(`/filing/${filingId}/income-story`);
        } catch (error) {
            toast.error('Failed to save income details');
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
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Other Income Sources
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Agricultural income, director fees, and partner income.
                    </p>
                </div>

                {/* Agricultural Income */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Sprout className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Agricultural Income</h2>
                            <p className="text-sm text-slate-600">Income from agricultural activities</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <ReassuranceBanner
                            type="info"
                            message="Agricultural income is exempt from tax but affects your tax rate. It must be reported."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Agricultural Income Amount
                        </label>
                        <input
                            type="number"
                            value={formData.agriculturalIncome}
                            onChange={(e) => setFormData({ ...formData, agriculturalIncome: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g., 500000"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Enter total agricultural income for the year
                        </p>
                    </div>
                </div>

                {/* Director/Partner Income */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Director/Partner Income</h2>
                            <p className="text-sm text-slate-600">Income as director or partner in a firm</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Director Income */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Director Income
                            </label>
                            <input
                                type="number"
                                value={formData.directorIncome}
                                onChange={(e) => setFormData({ ...formData, directorIncome: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g., 200000"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Director's remuneration or sitting fees
                            </p>
                        </div>

                        {/* Partner Income */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Partner Income
                            </label>
                            <input
                                type="number"
                                value={formData.partnerIncome}
                                onChange={(e) => setFormData({ ...formData, partnerIncome: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g., 300000"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Share of profit from partnership firm
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtherIncomeSourcesDetails;
