/**
 * CAFilingReview.jsx
 * V3.2 Page
 * Split View 70/30
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/core/APIClient';
import { ArrowLeft, Loader } from 'lucide-react';
import CASnapshotPanel from '../../components/CA/CASnapshotPanel';
import CAIntelligencePanel from '../../components/CA/CAIntelligencePanel';
import CAConfidencePanel from '../../components/CA/CAConfidencePanel';

import RequestInfoModal from '../../components/CA/RequestInfoModal';
import { toast } from 'react-hot-toast'; // Assuming toast exists

const CAFilingReview = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/ca/filing/${filingId}`);
                setData(response.data.data);
            } catch (error) {
                console.error('Fetch error', error);
                // Handle error (toast etc)
            } finally {
                setLoading(false);
            }
        };
        fetchFiling();
    }, [filingId]);

    const handleRequestInfo = async (payload) => {
        try {
            setRequestLoading(true);
            await apiClient.post(`/ca/filing/${filingId}/request-info`, payload);
            toast.success('Request sent to client');
            setIsRequestModalOpen(false);
            // Refresh data or update status locally
            setData(prev => ({ ...prev, meta: { ...prev.meta, status: 'ACTION_REQUIRED' } }));
        } catch (error) {
            console.error('Request failed', error);
            toast.error('Failed to send request');
        } finally {
            setRequestLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p className="text-slate-500">Filing not found</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/ca/inbox')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{data.client.name}</h1>
                        <p className="text-xs text-slate-500">PAN: {data.client.pan} • AY {data.meta.assessmentYear}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase">
                            {data.meta.status}
                        </span>

                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg"
                        >
                            Request Info
                        </button>

                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
                            Approve Filing
                        </button>
                    </div>
                </div>
            </header>

            <RequestInfoModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSubmit={handleRequestInfo}
                loading={requestLoading}
            />

            {/* Main Content Split */}
            <main className="flex-1 flex overflow-hidden">

                {/* LEFT: Snapshot (70%) - Scrollable */}
                <div className="w-[70%] overflow-y-auto p-8 border-r border-slate-200">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-base font-bold text-slate-900 mb-6">Filing Snapshot</h2>
                        <CASnapshotPanel snapshot={data.snapshot} />

                        {/* Notes Section Placeholder */}
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">CA Notes</h3>
                            <textarea
                                disabled
                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 resize-none"
                                placeholder="Internal notes will appear here..."
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Intelligence (30%) - Fixed/Scrollable */}
                <div className="w-[30%] bg-white overflow-y-auto p-6">
                    <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wide">Intelligence</h2>

                    <CAConfidencePanel intelligence={data.intelligence} />
                    <CAIntelligencePanel intelligence={data.intelligence} />

                </div>

            </main>
        </div>
    );
};

export default CAFilingReview;
