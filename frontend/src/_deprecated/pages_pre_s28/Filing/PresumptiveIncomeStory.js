// =====================================================
// PRESUMPTIVE INCOME STORY (ITR-4)
// Overview of Business/Professional Income (44AD/44ADA)
// =====================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Truck, Plus, Edit, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const PresumptiveIncomeStory = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [presumptiveData, setPresumptiveData] = useState(null);

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                const filing = response.data.data || response.data;
                setPresumptiveData(filing.jsonPayload?.income?.presumptive || {});
            } catch (err) {
                toast.error('Failed to load presumptive income details');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    const handleDelete = async (sectionKey) => {
        // eslint-disable-next-line no-alert
        if (!window.confirm('Are you sure you want to remove this income?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Get current filing to update
            const res = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            const filing = res.data.data || res.data;

            const updatedPresumptive = { ...filing.jsonPayload.income.presumptive };
            delete updatedPresumptive[sectionKey];

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload.income,
                        presumptive: updatedPresumptive,
                    },
                },
            }, { headers });

            setPresumptiveData(updatedPresumptive);
            toast.success('Income removed');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    const hasBusiness = !!presumptiveData?.business;
    const hasProfessional = !!presumptiveData?.professional;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(`/filing/${filingId}/income-story`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Income Story
                </button>

                <div className="mb-10">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">Business & Professional Income</h1>
                    <p className="text-slate-600">Declare your presumptive income under Section 44AD or 44ADA.</p>
                </div>

                <div className="space-y-6">
                    {/* Business Income Card (44AD) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Small Business (44AD)</h3>
                                        <p className="text-sm text-slate-500">For traders, manufacturers, shop-owners, etc.</p>
                                    </div>
                                </div>
                                {hasBusiness ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/filing/${filingId}/presumptive/add?type=business`)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('business')}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/filing/${filingId}/presumptive/add?type=business`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Business
                                    </button>
                                )}
                            </div>

                            {hasBusiness ? (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Business Name</p>
                                        <p className="text-slate-900 font-medium">{presumptiveData.business.businessName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Gross Receipts</p>
                                        <p className="text-slate-900 font-medium">₹{presumptiveData.business.grossReceipts.toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-600">Presumptive Income</p>
                                            <p className="text-lg font-bold text-emerald-600">₹{presumptiveData.business.presumptiveIncome.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No business income added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Professional Income Card (44ADA) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Professional (44ADA)</h3>
                                        <p className="text-sm text-slate-500">For freelancers, doctors, engineers, consultants, etc.</p>
                                    </div>
                                </div>
                                {hasProfessional ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/filing/${filingId}/presumptive/add?type=professional`)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('professional')}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/filing/${filingId}/presumptive/add?type=professional`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Profession
                                    </button>
                                )}
                            </div>

                            {hasProfessional ? (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Profession Name</p>
                                        <p className="text-slate-900 font-medium">{presumptiveData.professional.professionName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Gross Receipts</p>
                                        <p className="text-slate-900 font-medium">₹{presumptiveData.professional.grossReceipts.toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-600">Presumptive Income (50%)</p>
                                            <p className="text-lg font-bold text-emerald-600">₹{presumptiveData.professional.presumptiveIncome.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No professional income added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Goods Carriage Card (44AE) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Goods Carriage (44AE)</h3>
                                        <p className="text-sm text-slate-500">For truck/vehicle owners (₹7,500 per vehicle/month)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/filing/${filingId}/goods-carriage`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Vehicles
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 italic">Click "Add Vehicles" to declare goods carriage income.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Save & Continue
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PresumptiveIncomeStory;
