// =====================================================
// FAMILY PENSION DETAILS
// Pension received by family members of deceased employees
// Max Standard Deduction: ₹15,000 or 1/3rd of pension (whichever is lower)
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Heart, Info, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const FamilyPensionDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);
    const [formData, setFormData] = useState({
        amountReceived: '',
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

            const existingData = data.jsonPayload?.income?.familyPension;
            if (existingData) {
                setFormData({ amountReceived: existingData.amountReceived || '' });
            }
        } catch (err) {
            toast.error('Failed to load family pension details');
        } finally {
            setLoading(false);
        }
    };

    const calculateDeduction = () => {
        const amount = parseFloat(formData.amountReceived) || 0;
        const oneThird = amount / 3;
        return Math.min(oneThird, 15000);
    };

    const handleSave = async () => {
        const taxableAmount = (parseFloat(formData.amountReceived) || 0) - calculateDeduction();
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        familyPension: {
                            amountReceived: parseFloat(formData.amountReceived) || 0,
                            standardDeduction: calculateDeduction(),
                            taxableAmount: taxableAmount,
                            complete: true,
                        },
                    },
                },
            }, { headers });

            toast.success('Family pension details saved');
            navigate(`/filing/${filingId}/overview`);
        } catch (error) {
            toast.error('Failed to save details');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400">Loading...</div>;

    const standardDeduction = calculateDeduction();
    const taxableAmount = (parseFloat(formData.amountReceived) || 0) - standardDeduction;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Overview</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Family Pension</h1>
                    <p className="text-slate-600">Enter pension income received as a legal heir of a deceased employee.</p>
                </div>

                <Card>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Pension Details</h2>
                            <p className="text-sm text-slate-500">Reportable under 'Income from Other Sources'</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mb-10">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gross Family Pension Received</label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-2xl">₹</span>
                    <input
                        type="number"
                        value={formData.amountReceived}
                        onChange={(e) => setFormData({ amountReceived: e.target.value })}
                        placeholder="0"
                        className="w-full pl-12 pr-6 py-6 bg-slate-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all font-black text-slate-900 text-3xl outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standard Deduction</span>
                    <span className="text-2xl font-bold text-emerald-600">₹ {standardDeduction.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 mt-1 italic">Lower of 1/3rd or ₹15,000</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taxable Amount</span>
                    <span className="text-2xl font-bold text-slate-900">₹ {taxableAmount.toLocaleString('en-IN')}</span>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-12 flex items-start gap-4">
                <Info className="w-5 h-5 text-blue-500 mt-1" />
                <p className="text-sm text-blue-700 leading-relaxed font-medium">Standard deduction for family pension is automatically calculated as per Section 57(iia) of the Income Tax Act.</p>
            </div>

            {/* Footer */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate(`/filing/${filingId}/overview`)}
                    className="flex-1 py-5 px-8 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-[2] py-5 px-8 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Save className="w-5 h-5" />
                    Save Details
                </button>
            </div>
        </div>
    );
};

export default FamilyPensionDetails;
