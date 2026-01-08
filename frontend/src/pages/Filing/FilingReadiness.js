// =====================================================
// FILING READINESS - Screen 5
// "Is Your Filing Ready?"
// Pure projection from /api/filings/:filingId/readiness
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Download, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const FilingReadiness = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Checking readiness...</div>
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

    const { completionChecklist, legalStatus, caRequirement, actions, snapshot } = data;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        Is Your Filing Ready?
                    </h1>
                    <p className="text-slate-600">
                        Here's what's left before you can submit.
                    </p>
                </div>

                {/* Reassurance: Safety Guarantee */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="safety"
                        message="If something is missing, submission will be blocked automatically. Incomplete filings cannot be submitted."
                    />
                </div>

                {/* Legal Status */}
                <div className={`rounded-xl shadow-sm border p-6 mb-6 ${legalStatus.safeToSubmit
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        {legalStatus.safeToSubmit ? (
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                            <XCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                        )}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                                {legalStatus.safeToSubmit ? 'Ready to Submit' : 'Not Ready Yet'}
                            </h3>
                            <p className="text-sm text-slate-700">
                                {legalStatus.reason}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Completion Checklist */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Completion Checklist
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 py-2">
                            {completionChecklist.salaryDetails ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                            <span className={completionChecklist.salaryDetails ? 'text-slate-900' : 'text-slate-500'}>
                                Salary Details
                            </span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            {completionChecklist.bankAccounts ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                            <span className={completionChecklist.bankAccounts ? 'text-slate-900' : 'text-slate-500'}>
                                Bank Accounts
                            </span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            {completionChecklist.verification ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                            <span className={completionChecklist.verification ? 'text-slate-900' : 'text-slate-500'}>
                                Verification
                            </span>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            {completionChecklist.capitalGainsDetails ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                            <span className={completionChecklist.capitalGainsDetails ? 'text-slate-900' : 'text-slate-500'}>
                                Capital Gains Details
                            </span>
                        </div>
                        {completionChecklist.presumptiveDetails !== undefined && (
                            <div className="flex items-center gap-3 py-2">
                                {completionChecklist.presumptiveDetails ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-slate-300" />
                                )}
                                <span className={completionChecklist.presumptiveDetails ? 'text-slate-900' : 'text-slate-500'}>
                                    Business Income (Presumptive)
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 py-2">
                            {completionChecklist.taxPayment ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-slate-300" />
                            )}
                            <span className={completionChecklist.taxPayment ? 'text-slate-900' : 'text-slate-500'}>
                                Tax Payment Status
                            </span>
                        </div>
                    </div>
                </div>

                {/* CA Requirement */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">
                        CA Requirement
                    </h2>
                    <p className="text-sm text-slate-600">
                        {caRequirement.explanation}
                    </p>
                </div>

                {/* Final Submission Moment Reassurance (Only if can submit) */}
                {actions.canSubmit && (
                    <div className="mb-6">
                        <ReassuranceBanner
                            type="safety"
                            message="Once submitted, this filing becomes legally final. You will receive an acknowledgement from the Income Tax Department. If anything fails, we will notify you — nothing is lost."
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Available Actions
                    </h2>
                    <div className="space-y-3">
                        {actions.canDownloadJSON && snapshot && (
                            <a
                                href={snapshot.downloadUrl}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Download className="w-5 h-5 text-slate-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">Download JSON</p>
                                        <p className="text-sm text-slate-500">
                                            For manual filing or CA review
                                        </p>
                                    </div>
                                </div>
                                <span className="text-primary-600 font-medium">Download</span>
                            </a>
                        )}
                        {actions.canSubmit && (
                            <button
                                onClick={() => {
                                    // Navigate to S25 submission status screen
                                    navigate(`/filing/${filingId}/submission-status`);
                                }}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                                <span className="font-medium">Submit Return</span>
                            </button>
                        )}
                        {!actions.canSubmit && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                                <p className="text-sm text-slate-600">
                                    Complete missing information to enable submission
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Snapshot Info */}
                {snapshot && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                        <p>
                            <span className="font-medium">Snapshot ID:</span> {snapshot.id}
                        </p>
                        <p className="mt-1">
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(snapshot.createdAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-breakdown`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back to Tax Breakdown
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        Back to Overview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilingReadiness;
