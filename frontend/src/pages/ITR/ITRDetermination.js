// =====================================================
// ITR DETERMINATION - The "Ceremony" Screen
// Step 3 in S26 Canonical Journey
// Explicitly tells the user which ITR they are filing and why
// =====================================================

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Info, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const ITRDetermination = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const { pan, dob, ay, prefillData, selectedSources } = location.state || {};

    // Logic to determine ITR type (Simplified S22 logic for frontend ceremony)
    const determination = useMemo(() => {
        if (!selectedSources) return null;

        const hasSalary = selectedSources.includes('salary');
        const hasCapitalGains = selectedSources.includes('capitalGains');
        const hasRental = selectedSources.includes('rental');
        const hasBusinessPresumptive = selectedSources.includes('business_presumptive');
        const hasBusinessFull = selectedSources.includes('business_full');
        const hasOther = selectedSources.includes('other');

        let type = 'ITR-1';
        const reasons = [];

        if (hasBusinessFull) {
            type = 'ITR-3';
            reasons.push('Business or Professional Income (Full Books required)');
        } else if (hasBusinessPresumptive) {
            type = 'ITR-4';
            reasons.push('Business or Professional Income (Presumptive Scheme)');
        } else if (hasCapitalGains) {
            type = 'ITR-2';
            reasons.push('Income from Capital Gains (Shares/Property)');
        } else if (hasRental) {
            type = 'ITR-2';
            reasons.push('Income from House Property');
        } else if (hasSalary) {
            type = 'ITR-1';
            reasons.push('Salary or Pension Income');
        }

        if (reasons.length === 0 && hasOther) {
            reasons.push('Income from Other Sources');
        }

        return { type, reasons };
    }, [selectedSources]);

    if (!pan || !selectedSources) {
        // Redirect back if journey state is lost
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Journey Interrupted</h2>
                    <p className="text-slate-600 mb-6">We lost your progress. Please start again from the beginning.</p>
                    <button
                        onClick={() => navigate('/itr/start')}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Restart Journey
                    </button>
                </div>
            </div>
        );
    }

    const handleCreateFiling = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Official Filing Creation Moment
            const response = await axios.post(`${API_BASE_URL}/filings`, {
                assessmentYear: ay,
                taxpayerPan: pan,
            }, { headers });

            const filingId = response.data.data?.id || response.data.id;

            if (filingId) {
                // Initialize the filing with the selected intent and prefill data
                const incomeIntent = {
                    salary: selectedSources.includes('salary'),
                    capitalGains: selectedSources.includes('capitalGains'),
                    rental: selectedSources.includes('rental'),
                    businessPresumptive: selectedSources.includes('business_presumptive'),
                    businessFull: selectedSources.includes('business_full'),
                    other: selectedSources.includes('other'),
                };

                await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                    jsonPayload: {
                        prefill: prefillData,
                        itrType: determination.type, // Explicitly tag the determined ITR type
                        income: {
                            salary: incomeIntent.salary ? {
                                intent: true,
                                prefill: prefillData?.income?.salary || 0,
                            } : null,
                            capitalGains: incomeIntent.capitalGains ? { intent: true } : null,
                            houseProperty: incomeIntent.rental ? { intent: true } : null,
                            presumptive: incomeIntent.businessPresumptive ? { intent: true } : null,
                            business: incomeIntent.businessFull ? { intent: true } : null,
                            otherSources: incomeIntent.other ? {
                                intent: true,
                                prefill: {
                                    interest: prefillData?.income?.interestIncome || 0,
                                    dividend: prefillData?.income?.dividendIncome || 0,
                                    other: prefillData?.income?.otherIncome || 0,
                                },
                            } : null,
                        },
                    },
                }, { headers });

                toast.success(`Filing created for ${determination.type}!`);

                if (determination.type === 'ITR-3') {
                    navigate('/itr/itr3-ceremony', { state: { filingId, pan, ay } });
                } else {
                    navigate(`/filing/${filingId}/overview`);
                }
            }
        } catch (error) {
            console.error('Filing creation failed:', error);
            toast.error(error.response?.data?.error || 'Could not start filing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Authority Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-200">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-serif font-medium text-slate-900 mb-3">
                        Your Return Type
                    </h1>
                    <p className="text-lg text-slate-600">
                        Based on your income profile, our engine has determined your correct ITR form.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
                    <div className="bg-primary-900 px-8 py-10 text-white text-center">
                        <p className="text-primary-300 uppercase tracking-widest text-sm font-bold mb-2">You will be filing</p>
                        <h2 className="text-6xl font-serif font-bold mb-4">{determination.type}</h2>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm backdrop-blur-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary-400" />
                            <span>AY {ay} Verified</span>
                        </div>
                    </div>

                    <div className="px-8 py-10">
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Why {determination.type}?
                            </h3>
                            <ul className="space-y-4">
                                {determination.reasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-medium">{reason}</p>
                                            <p className="text-sm text-slate-500">Auto-detected for PAN {pan}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 mb-10">
                            <p className="text-blue-800 text-sm leading-relaxed">
                                <strong>Don't worry about the form.</strong> We've custom-tailored the journey for {determination.type}. You only need to answer simple questions about your income.
                            </p>
                        </div>

                        <button
                            onClick={handleCreateFiling}
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-7 h-7 animate-spin" />
                                    Preparing your {determination.type}...
                                </>
                            ) : (
                                <>
                                    Start My Filing
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-400 text-sm">
                    Verified Identity: {pan} ({dob}) • AY {ay} Lock Active
                </p>
            </div>
        </div>
    );
};

export default ITRDetermination;
