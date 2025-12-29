/**
 * CARequestCard.jsx
 * User-facing card for CA Requests
 */
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../../services/core/APIClient'; // Generic client
import { toast } from 'react-hot-toast';

const CARequestCard = ({ computation, filingId, onResolve }) => {
    const caContext = computation?.caContext;
    if (!caContext || !caContext.requests || caContext.requests.length === 0) return null;

    // Show only PENDING requests
    const pendingRequests = caContext.requests.filter(r => r.status !== 'RESOLVED');

    if (pendingRequests.length === 0) return null;

    const handleResolve = async (requestId) => {
        try {
            await apiClient.post(`/itr/filing/${filingId}/requests/${requestId}/resolve`);
            toast.success('Marked as Resolved');
            if (onResolve) onResolve(); // Refresh parent
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600 mt-1">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-bold text-amber-900">Action Required</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Your CA needs a bit more information before filing.
                    </p>

                    <div className="mt-4 space-y-3">
                        {pendingRequests.map((req, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded">
                                            {req.category}
                                        </span>
                                        <p className="text-sm text-slate-800 mt-2 font-medium">
                                            {req.reason}
                                        </p>
                                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                            <span>Requested by {req.raisedByName}</span>
                                            {req.blocking && <span className="text-red-600 font-bold">• Blocking</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleResolve(req.id)}
                                        className="text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 font-medium whitespace-nowrap"
                                    >
                                        Mark as Done
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CARequestCard;
