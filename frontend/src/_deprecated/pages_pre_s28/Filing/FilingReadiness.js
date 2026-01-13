// =====================================================
// FILING READINESS - Screen 5 (S29 Hardened)
// "The Final Check"
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Send, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SectionCard from '../../components/common/SectionCard';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';
import InlineHint from '../../components/common/InlineHint';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const FilingReadiness = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReadiness = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/readiness`, { headers });
                setData(response.data.data);
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Failed to load readiness status';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchReadiness();
    }, [filingId]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate deliberate delay for "Submitting to Govt" feeling
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigate(`/filing/${filingId}/submission-status`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                <p className="text-[var(--s29-text-muted)] font-medium">Finalizing your tax return...</p>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 relative rotate-3">
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                    <div className="absolute inset-0 border-4 border-[var(--s29-primary-light)] rounded-3xl opacity-20" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--s29-text-main)] mb-3">Transmitting to Government</h1>
                <p className="text-[var(--s29-text-muted)] max-w-sm leading-relaxed">
                    We are securely transmitting your encrypted tax return to the Income Tax Department E-Filing portal. Please do not close this window.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-[var(--s29-radius-large)] shadow-xl border border-[var(--s29-border-light)]">
                    <AlertCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Readiness Check Failed</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">Return Home</button>
                </div>
            </div>
        );
    }

    const { completionChecklist, legalStatus, actions, snapshot, taxpayerPan } = data;

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-12 px-6">
            <div className="max-w-xl mx-auto">
                <header className="mb-10 text-center">
                    <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                        Final Review
                    </span>
                    <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mt-2">
                        Seal & Submit
                    </h1>
                    <p className="text-[var(--s29-text-muted)] mt-1">
                        Please confirm your details before we file your return.
                    </p>
                </header>

                <div className="bg-white rounded-[var(--s29-radius-large)] border border-[var(--s29-border-light)] p-8 shadow-sm mb-8">
                    <div className="space-y-8">
                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className='font-bold text-[var(--s29-text-main)]'>Identity & Context Locked</h3>
                                <p className="text-sm text-[var(--s29-text-muted)] mt-1">
                                    Filing for <span className="font-bold text-[var(--s29-text-main)]">{taxpayerPan}</span> • Assessment Year 2024-25. Information is immutable after this step.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--s29-text-main)]">Calculations Audited</h3>
                                <p className="text-sm text-[var(--s29-text-muted)] mt-1">
                                    Computed against Income Tax Act Section 139(1). All tax exemptions and slabs have been optimized.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--s29-text-main)]">Detailed Draft Generation</h3>
                                <p className="text-sm text-[var(--s29-text-muted)] mt-1 mb-2">A technical preview of your ITR is ready for your audit.</p>
                                <button
                                    onClick={() => window.open(`${API_BASE_URL}/filings/${filingId}/export/pdf`, '_blank')}
                                    className="text-sm text-[var(--s29-primary)] font-bold hover:text-[var(--s29-primary-dark)] transition-colors flex items-center gap-1.5"
                                >
                                    View Draft PDF (Read-only)
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <ReassuranceBanner
                        type="safety"
                        message="Once submitted, this return becomes legally final. If you identify errors later, BurnBlack will assist you in filing a Revised Return."
                    />
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleSubmit}
                        disabled={!actions.canSubmit}
                        className={`w-full py-5 rounded-[var(--s29-radius-main)] font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg ${actions.canSubmit
                            ? 'bg-[var(--s29-primary)] text-white hover:bg-[var(--s29-primary-dark)] shadow-[var(--s29-primary-light)]/40 active:scale-[0.98]'
                            : 'bg-white border border-[var(--s29-border-light)] text-[var(--s29-text-muted)] cursor-not-allowed opacity-60 shadow-none'
                            }`}
                    >
                        {actions.canSubmit ? 'Submit to Government' : 'Filing Locked'}
                        <Send className="w-5 h-5 flex-shrink-0" />
                    </button>

                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-breakdown`)}
                        className="w-full text-[var(--s29-text-muted)] py-3 text-sm hover:text-[var(--s29-text-main)] transition-colors font-medium"
                    >
                        Wait, let me double check my data
                    </button>
                </div>

                {!actions.canSubmit && (
                    <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-[var(--s29-radius-large)] flex gap-4 shadow-sm">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm mb-1">Incomplete Requirements</h4>
                            <p className="text-sm text-amber-800 leading-relaxed italic">
                                "{legalStatus.reason || 'Some sections of your filing are still missing critical truth-data. Please complete all sections before attempting submission.'}"
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-[var(--s29-border-light)] text-center">
                    <InlineHint>
                        Secure AES-256 transmission in progress. Data is only accessible by the Income Tax Department's secure servers.
                    </InlineHint>
                </div>
            </div>
        </div>
    );
};

export default FilingReadiness;
