// =====================================================
// SUBMISSION STATUS - S25 ERI Outcome Screen
// "What happened to my return?"
// Pure projection from /api/filings/:filingId/submission-status
// Frozen v1 API Contract
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Clock, Download, ArrowRight } from 'lucide-react';
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading submission status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    const { meta, status, eri, userMessage, actions } = data;

    // Render based on status state
    const renderStatusContent = () => {
        const stateConfig = {
            'IN_PROGRESS': {
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-900',
                bodyColor: 'text-blue-800',
                detailColor: 'text-blue-700',
                icon: <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1 animate-pulse" />,
                headline: 'Your return has been submitted',
                body: 'The Income Tax Department is processing your submission. This is normal. We\'re monitoring it.',
            },
            'SUCCESS': {
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-900',
                bodyColor: 'text-green-800',
                detailColor: 'text-green-700',
                icon: <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />,
                headline: 'Your return has been successfully filed',
                body: 'This completes your filing for Assessment Year 2024-25. You can download your acknowledgement anytime.',
            },
            'RETRYING': {
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-900',
                bodyColor: 'text-yellow-800',
                detailColor: 'text-yellow-700',
                icon: <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />,
                headline: 'Submission attempt unsuccessful — we\'re retrying automatically',
                body: 'The tax portal didn\'t respond as expected. This is normal. We\'re retrying automatically — your data is safe.',
            },
            'FAILED': {
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-900',
                bodyColor: 'text-red-800',
                detailColor: 'text-red-700',
                icon: <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />,
            },
        };

        const config = stateConfig[status.state] || stateConfig['IN_PROGRESS'];

        return (
            <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-8 mb-6`}>
                <div className="flex items-start gap-4">
                    {config.icon}
                    <div className="flex-1">
                        <h2 className={`text-2xl font-semibold ${config.textColor} mb-2`}>
                            {userMessage.headline}
                        </h2>
                        <p className={`${config.bodyColor} mb-4`}>
                            {userMessage.body}
                        </p>
                        <div className={`text-sm ${config.detailColor} space-y-1`}>
                            <p>Submitted: {new Date(meta.submittedAt).toLocaleString('en-IN')}</p>
                            <p>Attempts: {eri.attempts}</p>
                            {eri.acknowledgementRef && (
                                <p className="font-medium">Acknowledgment: {eri.acknowledgementRef}</p>
                            )}
                            {eri.nextRetryAt && (
                                <p>Next retry: {new Date(eri.nextRetryAt).toLocaleString('en-IN')}</p>
                            )}
                            {meta.snapshotId && (
                                <p className="text-xs mt-2">Snapshot: {meta.snapshotId}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        Submission Status
                    </h1>
                    <p className="text-slate-600">
                        {status.label}
                    </p>
                </div>

                {/* Status Content */}
                {renderStatusContent()}

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Available Actions
                    </h2>
                    <div className="space-y-3">
                        {actions.downloadJson && meta.snapshotId && (
                            <a
                                href={`/api/filings/${filingId}/export/json`}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Download className="w-5 h-5 text-slate-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">Download JSON</p>
                                        <p className="text-sm text-slate-500">
                                            For manual filing or records
                                        </p>
                                    </div>
                                </div>
                                <span className="text-primary-600 font-medium">Download</span>
                            </a>
                        )}
                        {actions.contactCA && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <p className="text-sm text-slate-700">
                                    CA assistance is required for this filing type. Please contact a CA for help.
                                </p>
                            </div>
                        )}
                        {!actions.downloadJson && !actions.contactCA && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                                <p className="text-sm text-slate-600">
                                    No actions available at this time
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                        Back to Overview
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionStatus;
