// =====================================================
// ITR-3 ENTRY CEREMONY
// Non-negotiable truth-casting gate for Professional Mode
// Enforces informed consent before starting complex filing
// =====================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ScrollText,
    Clock,
    FileSpreadsheet,
    ShieldAlert,
    ArrowRight,
    CheckSquare,
    ChevronRight,
    Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ITR3EntryCeremony = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [acknowledged, setAcknowledged] = useState(false);
    const { filingId, pan, ay } = location.state || {};

    if (!filingId) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6 text-center">
                <div className="max-w-md bg-white p-8 rounded-[var(--s29-radius-large)] shadow-xl border border-[var(--s29-border-light)]">
                    <ShieldAlert className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Unauthorized Access</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">This professional ceremony requires a valid filing session.</p>
                    <button onClick={() => navigate('/itr/start')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">
                        Return to Start
                    </button>
                </div>
            </div>
        );
    }

    const requirements = [
        {
            icon: FileSpreadsheet,
            title: 'Financial Statements',
            desc: 'You must have your Balance Sheet and Profit & Loss statement ready.',
            color: 'text-blue-600 bg-blue-50',
        },
        {
            icon: Clock,
            title: 'Time Commitment',
            desc: 'This filing typically takes 60-90 minutes of focused data entry.',
            color: 'text-orange-600 bg-orange-50',
        },
        {
            icon: ScrollText,
            title: 'Asset Disclosures',
            desc: 'Detailed schedules for fixed assets and personal liabilities are mandatory.',
            color: 'text-purple-600 bg-purple-50',
        },
    ];

    const handleProceed = () => {
        if (!acknowledged) {
            toast.error('Please acknowledge the professional requirements to proceed.');
            return;
        }
        navigate(`/filing/${filingId}/income-story`);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8">
            <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] border border-[var(--s29-border-light)] transition-all">
                {/* Header Section */}
                <div className="bg-[var(--s29-bg-page)] px-8 py-12 text-center border-b border-[var(--s29-border-light)]">
                    <div className="w-16 h-16 bg-[var(--s29-primary)] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--s29-text-main)] mb-4">
                        Entering Professional Mode
                    </h1>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--s29-primary)] text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-md">
                        ITR-3 • AY {ay} • PAN {pan}
                    </div>
                    <p className="mt-6 text-[var(--s29-text-muted)] max-w-xl mx-auto leading-relaxed">
                        ITR-3 is a legally complex filing for business owners and professionals with audited or detailed books. We optimize for <span className="text-[var(--s29-text-main)] font-bold italic">truth</span> and <span className="text-[var(--s29-text-main)] font-bold italic">responsibility</span> here.
                    </p>
                </div>

                {/* Requirements Grid */}
                <div className="px-8 py-10">
                    <h3 className="text-xs font-bold text-[var(--s29-text-muted)] uppercase tracking-[0.2em] mb-8 text-center">
                        Minimum Prerequisites
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {requirements.map((req, idx) => (
                            <div key={idx} className="p-6 rounded-3xl border border-[var(--s29-border-light)] bg-white hover:border-[var(--s29-primary-light)] hover:shadow-md transition-all group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${req.color}`}>
                                    <req.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-[var(--s29-text-main)] mb-2">{req.title}</h4>
                                <p className="text-sm text-[var(--s29-text-muted)] leading-relaxed">{req.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Doctrine Box */}
                    <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 mb-12 shadow-sm">
                        <div className="flex gap-4">
                            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <h5 className="font-bold text-amber-900 mb-1">Expectation Setting</h5>
                                <p className="text-sm text-amber-800 leading-relaxed italic">
                                    "Trying to make ITR-3 'simple' is bad design. Good design here means clarity, pacing, and informed consent. We will not rush or hide legal requirements."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Acknowledgment */}
                    <button
                        onClick={() => setAcknowledged(!acknowledged)}
                        className={`w-full flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left mb-8 ${acknowledged ? 'bg-[var(--s29-primary)] border-[var(--s29-primary)] text-white shadow-lg' : 'bg-white border-[var(--s29-border-light)] text-[var(--s29-text-muted)] hover:border-[var(--s29-primary-light)]'}`}
                    >
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors ${acknowledged ? 'bg-white/20' : 'bg-slate-100'}`}>
                            {acknowledged && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium text-lg leading-tight">
                            I understand this is a professional filing requiring business books and financial statements. I am ready to proceed with truth and responsibility.
                        </span>
                    </button>

                    {/* Final Action */}
                    <button
                        onClick={handleProceed}
                        className={`w-full py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl ${acknowledged ? 'bg-[var(--s29-primary)] text-white hover:bg-[var(--s29-primary-dark)] active:scale-[0.98] shadow-[var(--s29-primary-light)]/50' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                    >
                        I understand. Proceed with ITR-3
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    <p className="text-center mt-8 text-xs text-[var(--s29-text-muted)] font-medium">
                        You can pause your filing and export your progress to a CA at any time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ITR3EntryCeremony;
