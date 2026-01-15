import React from 'react';
import { ArrowRight, Clock, AlertCircle, CheckCircle, Info, Sparkles, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ActiveFilingCard = ({ filing }) => {
    const navigate = useNavigate();

    if (!filing) return null;

    const getStatusConfig = (state, readiness) => {
        if (state === 'submitted_to_eri' || state === 'eri_success') {
            return {
                label: 'Submission Successful',
                color: 'text-success-700',
                bg: 'bg-success-50',
                borderColor: 'border-success-100',
                icon: CheckCircle,
                action: 'View Receipt',
                description: 'Your tax return has been successfully filed with the ERI.',
            };
        }
        if (state === 'eri_failed') {
            return {
                label: 'Submission Failed',
                color: 'text-error-700',
                bg: 'bg-error-50',
                borderColor: 'border-error-100',
                icon: AlertCircle,
                action: 'Resolve & Retry',
                description: 'There was an issue with your submission. Please check the errors.',
            };
        }

        // Draft states
        const checklist = readiness?.completionChecklist || {};
        const totalItems = Object.keys(checklist).length || 1;
        const completedItems = Object.values(checklist).filter(Boolean).length;
        const completionPct = Math.round((completedItems / totalItems) * 100);

        return {
            label: 'Draft in Progress',
            color: 'text-primary-700',
            bg: 'bg-primary-50',
            borderColor: 'border-primary-100',
            icon: Clock,
            action: 'Continue Filing',
            progress: completionPct,
            description: completionPct > 80 ? 'Almost there! Just a few more details to review.' : 'Continue where you left off to maximize your refund.',
        };
    };

    const config = getStatusConfig(filing.lifecycleState, filing.readiness);
    const StatusIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-xl border-2 ${config.borderColor} p-4 shadow-md hover:shadow-lg transition-all relative overflow-hidden group`}
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -right-12 w-48 h-48 ${config.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold tracking-wider">
                                AY {filing.assessmentYear}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-0.5">
                            Individual Income Tax Return
                        </h3>
                        <p className="text-slate-500 text-xs">
                            Last activity on {new Date(filing.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {config.progress !== undefined ? (
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <div>
                                <p className="text-xs font-medium text-slate-600 mb-0.5">Current Progress</p>
                                <p className="text-xs text-slate-500">{config.description}</p>
                            </div>
                            <span className="text-base font-bold text-slate-900">{config.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${config.progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-aurora-gradient rounded-full"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-body-regular text-slate-600 italic">
                            {config.description}
                        </p>
                    </div>
                )}

                <button
                    onClick={() => navigate(`/filing/${filing.id}/overview`)}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-elevation-2"
                >
                    {config.action}
                    <ArrowRight className="w-4 h-4" />
                </button>

                {config.progress > 90 && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Ready for Review</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActiveFilingCard;
