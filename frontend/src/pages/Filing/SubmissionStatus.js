// =====================================================
// SUBMISSION STATUS - S25 ERI Outcome Screen
// "What happened to my return?"
// Pure projection from /api/filings/:filingId/submission-status
// Frozen v1 API Contract
// =====================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Clock, Download, ArrowRight, Loader2, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const SubmissionStatus = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmissionStatus = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/submission-status`, { headers });
                setData(response.data.data);
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Failed to load submission status';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissionStatus();

        // Poll every 30 seconds if in progress or retrying
        const interval = setInterval(() => {
            if (data?.status?.state === 'IN_PROGRESS' || data?.status?.state === 'RETRYING') {
                fetchSubmissionStatus();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [filingId, data?.status?.state]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                <p className="text-[var(--s29-text-muted)] font-medium">Checking submission status...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-[var(--s29-radius-large)] shadow-xl border border-[var(--s29-border-light)]">
                    <AlertCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Error</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const { meta, status, eri, userMessage, actions } = data;

    // Render based on status state
    const renderStatusContent = () => {
        const stateConfig = {
            'IN_PROGRESS': {
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-100',
                textColor: 'text-blue-900',
                bodyColor: 'text-blue-800',
                detailColor: 'text-blue-700',
                icon: <Clock className="w-8 h-8 text-blue-600 animate-pulse" />,
                iconBg: 'bg-blue-100',
            },
            'SUCCESS': {
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-100',
                textColor: 'text-emerald-900',
                bodyColor: 'text-emerald-800',
                detailColor: 'text-emerald-700',
                icon: <CheckCircle className="w-10 h-10 text-emerald-600" />,
                iconBg: 'bg-emerald-100',
            },
            'RETRYING': {
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-100',
                textColor: 'text-amber-900',
                bodyColor: 'text-amber-800',
                detailColor: 'text-amber-700',
                icon: <AlertCircle className="w-8 h-8 text-amber-600" />,
                iconBg: 'bg-amber-100',
            },
            'FAILED': {
                bgColor: 'bg-red-50',
                borderColor: 'border-red-100',
                textColor: 'text-red-900',
                bodyColor: 'text-red-800',
                detailColor: 'text-red-700',
                icon: <XCircle className="w-8 h-8 text-red-600" />,
                iconBg: 'bg-red-100',
            },
        };

        const config = stateConfig[status.state] || stateConfig['IN_PROGRESS'];

        return (
            <div className={`${config.bgColor} border ${config.borderColor} rounded-[var(--s29-radius-large)] p-8 mb-8 shadow-sm transition-all relative overflow-hidden`}>
                {status.state === 'SUCCESS' && (
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100/30 rounded-full blur-3xl" />
                )}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <div className={`w-20 h-20 ${config.iconBg} rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50`}>
                        {config.icon}
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-bold ${config.textColor} mb-3`}>
                            {userMessage.headline}
                        </h2>
                        <p className={`${config.bodyColor} mb-6 leading-relaxed max-w-2xl`}>
                            {userMessage.body}
                        </p>
                        <div className={'inline-grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 p-5 bg-white/40 rounded-[var(--s29-radius-main)] border border-white/50 backdrop-blur-sm'}>
                            <div className="text-xs text-[var(--s29-text-muted)] space-y-1">
                                <span className="block font-bold uppercase tracking-widest text-[10px]">Submitted at</span>
                                <p className="text-[var(--s29-text-main)] font-medium">{new Date(meta.submittedAt).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-xs text-[var(--s29-text-muted)] space-y-1 mt-2 sm:mt-0">
                                <span className="block font-bold uppercase tracking-widest text-[10px]">ERI Attempts</span>
                                <p className="text-[var(--s29-text-main)] font-medium">{eri.attempts} of 3</p>
                            </div>
                            {eri.acknowledgementRef && (
                                <div className="text-xs text-[var(--s29-text-muted)] space-y-1 mt-2 col-span-1 sm:col-span-2">
                                    <span className="block font-bold uppercase tracking-widest text-[10px]">Ack Reference Number</span>
                                    <p className="text-[var(--s29-text-main)] font-mono font-bold text-sm tracking-wider break-all">{eri.acknowledgementRef}</p>
                                </div>
                            )}
                            {eri.nextRetryAt && (
                                <div className="text-xs text-amber-900 space-y-1 mt-2 col-span-1 sm:col-span-2">
                                    <span className="block font-bold uppercase tracking-widest text-[10px]">Next Automated Retry</span>
                                    <p className="font-medium bg-amber-100/50 inline-block px-2 py-0.5 rounded">{new Date(eri.nextRetryAt).toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                            Filing Outcome
                        </span>
                        <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mt-2">
                            Submission Status
                        </h1>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-[var(--s29-border-light)] shadow-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.state === 'SUCCESS' ? 'bg-emerald-500' : status.state === 'FAILED' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
                        <span className="text-xs font-bold text-[var(--s29-text-main)] uppercase tracking-wider">{status.label}</span>
                    </div>
                </header>

                {/* Status Content */}
                {renderStatusContent()}

                {/* Actions */}
                <div className="bg-white rounded-[var(--s29-radius-large)] shadow-sm border border-[var(--s29-border-light)] p-8 mb-8">
                    <h2 className="text-sm font-bold text-[var(--s29-text-muted)] uppercase tracking-widest mb-6">
                        Post-Filing Controls
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {actions.downloadJson && meta.snapshotId && (
                            <a
                                href={`/api/filings/${filingId}/export/json`}
                                className="flex items-center justify-between p-5 bg-[var(--s29-bg-page)] border border-[var(--s29-border-light)] rounded-[var(--s29-radius-main)] hover:border-[var(--s29-primary)] hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[var(--s29-border-light)] group-hover:bg-[var(--s29-primary)] group-hover:text-white transition-colors">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--s29-text-main)]">Tax Return Draft</p>
                                        <p className="text-xs text-[var(--s29-text-muted)]">Download JSON for your records</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-[var(--s29-text-muted)] group-hover:text-[var(--s29-primary)] transition-colors" />
                            </a>
                        )}
                        {status.state === 'SUCCESS' && (
                            <button
                                onClick={() => window.open(`/api/filings/${filingId}/export/pdf`, '_blank')}
                                className="flex items-center justify-between p-5 bg-[var(--s29-bg-page)] border border-[var(--s29-border-light)] rounded-[var(--s29-radius-main)] hover:border-[var(--s29-primary)] hover:shadow-md transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[var(--s29-border-light)] group-hover:bg-[var(--s29-primary)] group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--s29-text-main)]">Acknowledgement (V)</p>
                                        <p className="text-xs text-[var(--s29-text-muted)]">Official ITR-V Receipt</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-[var(--s29-text-muted)] group-hover:text-[var(--s29-primary)] transition-colors" />
                            </button>
                        )}
                        {actions.contactCA && (
                            <div className="col-span-full p-5 bg-amber-50 border border-amber-100 rounded-[var(--s29-radius-main)] flex gap-4">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800 leading-relaxed font-medium italic">
                                    "Your specific filing requirements suggest a professional review would be beneficial. Our CA panel is ready to assist you in finalizing this return."
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex-1 bg-white border border-[var(--s29-border-light)] text-[var(--s29-text-main)] py-4 px-6 rounded-[var(--s29-radius-main)] font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        Review Overview
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 bg-[var(--s29-primary)] text-white py-4 px-6 rounded-[var(--s29-radius-main)] font-bold hover:bg-[var(--s29-primary-dark)] shadow-lg shadow-[var(--s29-primary-light)]/30 transition-all flex items-center justify-center gap-2"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default SubmissionStatus;
