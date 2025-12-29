import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Building2, Calculator, ArrowRight, HelpCircle } from 'lucide-react';
import itrService from '../../services/api/itrService';
import { trackEvent } from '../../utils/analyticsEvents';
import toast from 'react-hot-toast';

const YearTypeSelection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const yearTypes = [
        {
            id: 'salary',
            title: 'Salary & Interest',
            description: 'Job income, bank interest',
            icon: Briefcase,
            itrType: 1, // ITR-1
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            id: 'presumptive',
            title: 'Presumptive Business',
            description: 'Small business, fixed percentage (No audit)',
            icon: Calculator,
            itrType: 4, // ITR-4
            color: 'bg-blue-50 text-blue-600',
        },
        {
            id: 'capital_gains',
            title: 'Capital Gains',
            description: 'Shares, mutual funds, property sale',
            icon: TrendingUp,
            itrType: 2, // ITR-2
            color: 'bg-purple-50 text-purple-600',
        },
        {
            id: 'business',
            title: 'Business / Freelance',
            description: 'Self-employed, professional, audits',
            icon: Building2,
            itrType: 3, // ITR-3
            color: 'bg-orange-50 text-orange-600',
        },
    ];

    const handleSelection = async (type) => {
        try {
            setLoading(true);
            trackEvent('year_type_selected', { type: type.id, itrType: type.itrType });

            // Create Draft directly
            // Defaulting to current user (Self) for V1
            const response = await itrService.createDraft({
                itrType: type.itrType.toString(),
                year: '2025-26', // Hardcoded for V1 Context
                personId: null, // Implies Self
            });

            if (response && response.draftId) {
                navigate(`/itr/computation?draftId=${response.draftId}`);
            } else {
                throw new Error('Failed to create filing draft');
            }
        } catch (error) {
            console.error('Draft creation failed:', error);
            toast.error('Could not start filing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-12 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 mb-4">
                        Tell us what your year looked like.
                    </h1>
                    <p className="text-lg text-slate-600">
                        We'll choose the right form for you silently.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {yearTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => handleSelection(type)}
                            disabled={loading}
                            className="flex items-start p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-card-hover hover:border-primary-200 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className={`p-4 rounded-xl mr-5 ${type.color} group-hover:scale-110 transition-transform`}>
                                <type.icon className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                                    {type.title}
                                </h3>
                                <p className="text-slate-500 text-base">
                                    {type.description}
                                </p>
                            </div>
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                <ArrowRight className="w-6 h-6" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        className="text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-2 mx-auto"
                        onClick={() => toast('Our AI will help you inside.', { icon: '🤖' })}
                    >
                        <HelpCircle className="w-4 h-4" />
                        Help me choose
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YearTypeSelection;
