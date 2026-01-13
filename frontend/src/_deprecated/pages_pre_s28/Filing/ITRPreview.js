// =====================================================
// ITR PREVIEW - Final Summary before submission
// Shows what goes into the ITR JSON
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Send, CheckCircle2, Download, ShieldCheck, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ITRPreview = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filing, setFiling] = useState(null);

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/overview`, { headers });
            setFiling(response.data.data);
        } catch (err) {
            toast.error('Failed to load filing preview');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold">Preparing ITR Preview...</div>;

    const { identity, incomeSummary } = filing;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-summary`)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Back to Calculation</span>
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Final ITR Review</h1>
                            <p className="text-slate-600">Review your final declaration before we transmit it to the Income Tax Department.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">{identity.itrType} FORM</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* General Info */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Personal Details Snapshot */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Taxpayer Information</h3>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                                    <p className="font-bold text-slate-900 uppercase">{identity.residentialStatus.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assessment Year</p>
                                    <p className="font-bold text-slate-900">2024-25</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">PAN</p>
                                    <p className="font-bold text-slate-900 tracking-widest uppercase">XXXXXXXXXX</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Form Type</p>
                                    <p className="font-bold text-indigo-600">{identity.itrType}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Financial Statement</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-slate-600">Total Income Reported</span>
                                    <span className="font-bold text-slate-900">₹{incomeSummary.totalIncome.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-slate-600">Deductions Applied</span>
                                    <span className="font-bold text-emerald-600">- ₹{incomeSummary.totalDeductions.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-t border-slate-900">
                                    <span className="text-base font-black text-slate-900 uppercase tracking-widest">Taxable Surplus</span>
                                    <span className="text-xl font-black text-slate-900">₹{incomeSummary.netTaxableIncome.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Alert */}
                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex items-start gap-4">
                            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-amber-900 mb-1">Electronic Verification Required</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">After filing, you must e-verify your return within 30 days using Aadhaar OTP or Net Banking to complete the process. We will guide you through this in the next step.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -bottom-4 -right-4 opacity-10">
                                <Send className="w-24 h-24" />
                            </div>
                            <h3 className="text-lg font-bold mb-4">Ready to File?</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">All checks have passed. Your return is mapped correctly as per Section 139(1).</p>

                            <button
                                onClick={() => navigate(`/filing/${filingId}/e-verify`)}
                                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 mb-4"
                            >
                                <Send className="w-5 h-5" />
                                File Now
                            </button>

                            <button className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">
                                <Download className="w-4 h-4" />
                                Download Draft
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Quality Assured</h4>
                                <p className="text-[10px] text-slate-500">24/7 support available</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ITRPreview;
