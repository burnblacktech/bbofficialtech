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
import { PageContent } from '../../components/Layout';
import { StatusPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
                <Card>
                    <AlertCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Error</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">Return to Dashboard</button>
                </Card>
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
                icon: <Clock className="w-6 h-6 text-blue-600 animate-pulse" />,
                iconBg: 'bg-blue-100',
            },
            'SUCCESS': {
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-100',
                textColor: 'text-emerald-900',
                bodyColor: 'text-emerald-800',
                detailColor: 'text-emerald-700',
                icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
                iconBg: 'bg-emerald-100',
            },
            'RETRYING': {
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-100',
                textColor: 'text-amber-900',
                bodyColor: 'text-amber-800',
                detailColor: 'text-amber-700',
                icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
                iconBg: 'bg-amber-100',
            },
            'FAILED': {
                bgColor: 'bg-red-50',
                borderColor: 'border-red-100',
                textColor: 'text-red-900',
                bodyColor: 'text-red-800',
                detailColor: 'text-red-700',
                icon: <XCircle className="w-6 h-6 text-red-600" />,
                iconBg: 'bg-red-100',
            },
        };

        const config = stateConfig[status.state] || stateConfig['IN_PROGRESS'];

        return (
            <Card padding="lg" className={`${config.bgColor} border-2 ${config.borderColor} relative overflow-hidden`}>
                {status.state === 'SUCCESS' && (
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100/30 rounded-full blur-3xl opacity-50" />
                )}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className={`w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50`}>
                        {config.icon}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className={`text-xl font-bold ${config.textColor} mb-2`}>
                            {userMessage.headline}
                        </h2>
                        <p className={`text-sm ${config.bodyColor} mb-6 leading-relaxed max-w-2xl`}>
                            {userMessage.body}
                        </p>
                        <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-4 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm">
                            <div className="space-y-1">
                                <span className="block font-bold uppercase tracking-widest text-[10px] text-slate-400">Submitted at</span>
                                <p className="text-xs text-slate-700 font-bold">{new Date(meta.submittedAt).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="block font-bold uppercase tracking-widest text-[10px] text-slate-400">ERI Attempts</span>
                                <p className="text-xs text-slate-700 font-bold">{eri.attempts} of 3</p>
                            </div>
                            {eri.acknowledgementRef && (
                                <div className="space-y-1 col-span-1 sm:col-span-2">
                                    <span className="block font-bold uppercase tracking-widest text-[10px] text-slate-400">Ack Reference Number</span>
                                    <p className="text-xs text-slate-900 font-mono font-bold tracking-wider break-all">{eri.acknowledgementRef}</p>
                                </div>
                            )}
                            {eri.nextRetryAt && (
                                <div className="space-y-1 col-span-1 sm:col-span-2">
                                    <span className="block font-bold uppercase tracking-widest text-[10px] text-amber-600">Next Automated Retry</span>
                                    <p className="text-xs font-bold text-amber-700 bg-amber-100/50 inline-block px-2 py-0.5 rounded">{new Date(eri.nextRetryAt).toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <StatusPage
            title="Filing Outcome"
            subtitle="We’re monitoring this for you. No further action needed."
        >
            <PageContent spacing="section">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.state === 'SUCCESS' ? 'bg-emerald-500' : status.state === 'FAILED' ? 'bg-red-500' : 'bg-gold-500 animate-pulse'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status.label}</span>
                    </div>
                </div>

                {/* Status Content */}
                {renderStatusContent()}

                {/* Actions */}
                <Card padding="lg">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Post-Filing Controls
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {actions.downloadJson && meta.snapshotId && (
                            <a
                                href={`/api/filings/${filingId}/export/json`}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-gold-500 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                                        <Download className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Tax Return Draft</p>
                                        <p className="text-[10px] text-slate-400">Download JSON for your records</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-gold-500 transition-colors" />
                            </a>
                        )}
                        {status.state === 'SUCCESS' && (
                            <button
                                onClick={() => window.open(`/api/filings/${filingId}/export/pdf`, '_blank')}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-gold-500 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Acknowledgement (V)</p>
                                        <p className="text-[10px] text-slate-400">Official ITR-V Receipt</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-gold-500 transition-colors" />
                            </button>
                        )}
                        {actions.contactCA && (
                            <div className="col-span-full p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed font-medium italic">
                                    "Your specific filing requirements suggest a professional review would be beneficial. Our CA panel is ready to assist you."
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Navigation */}
                <Card padding="lg">
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => navigate(`/filing/${filingId}/overview`)}
                        >
                            Review Overview
                        </Button>
                    </div>
                </Card>
            </PageContent>
        </StatusPage>
    );
};

export default SubmissionStatus;
