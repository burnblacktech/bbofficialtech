// =====================================================
// HOUSE PROPERTY STORY - Screen 3C (ITR-2)
// "Your homes and rental income"
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Plus, Edit, Trash2, Building2, Landmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const HousePropertyStory = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

    const fetchFiling = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
            setFiling(response.data.data || response.data);
        } catch (err) {
            toast.error('Failed to load filing');
        } finally {
            setLoading(false);
        }
    };

    const properties = filing?.jsonPayload?.income?.houseProperty?.properties || [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm('Remove this property?')) return;

        try {
            const updatedProperties = properties.filter(p => p.id !== propertyId);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        houseProperty: {
                            ...filing.jsonPayload?.income?.houseProperty,
                            properties: updatedProperties,
                        },
                    },
                },
            }, { headers });

            toast.success('Property removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove property');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading your property data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            House Property
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us about your homes and any rent you received.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="Most people have one home. If you're paying a loan, you might get a tax break."
                    />
                </div>

                {/* Properties List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Your properties
                    </h2>

                    {properties.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Home className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No properties added yet</p>
                            <p className="text-sm mt-1">Click "Add a property" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property) => (
                                <div
                                    key={property.id}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-2 bg-slate-100 rounded-lg mt-1">
                                                <Building2 className="w-5 h-5 text-slate-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-slate-900 mb-1">
                                                    {property.propertyName}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${property.type === 'self_occupied'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {property.type === 'self_occupied' ? 'Self Occupied' : 'Let Out'}
                                                    </span>
                                                    {property.interestOnLoan > 0 && (
                                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center gap-1">
                                                            <Landmark className="w-3 h-3" />
                                                            Loan Interest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                                                    {property.type === 'let_out' && (
                                                        <div>
                                                            Rent: <span className="font-medium text-slate-900">{formatCurrency(property.rentReceived)}</span>
                                                        </div>
                                                    )}
                                                    {property.interestOnLoan > 0 && (
                                                        <div>
                                                            Interest: <span className="font-medium text-slate-900">{formatCurrency(property.interestOnLoan)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/filing/${filingId}/income/house-property/edit/${property.id}`)}
                                                className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProperty(property.id)}
                                                className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => navigate(`/filing/${filingId}/income/house-property/add`)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add a property
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back to Income Story
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HousePropertyStory;
