/* eslint-disable no-alert */
/* eslint-disable camelcase */
// =====================================================
// HOUSE PROPERTIES DETAILS - ITR-2
// Multiple property management with rental income tracking
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Plus, Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const HousePropertiesDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [formData, setFormData] = useState({
        propertyType: 'let_out',
        annualRentalIncome: '',
        municipalTaxes: '',
        interestOnLoan: '',
        preConstructionInterest: '',
        propertyAddress: '',
    });

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

    const handleAddProperty = () => {
        setFormData({
            propertyType: 'let_out',
            annualRentalIncome: '',
            municipalTaxes: '',
            interestOnLoan: '',
            preConstructionInterest: '',
            propertyAddress: '',
        });
        setEditingProperty(null);
        setShowAddModal(true);
    };

    const handleEditProperty = (property, index) => {
        setFormData({
            propertyType: property.propertyType || 'let_out',
            annualRentalIncome: property.annualRentalIncome || '',
            municipalTaxes: property.municipalTaxes || '',
            interestOnLoan: property.interestOnLoan || '',
            preConstructionInterest: property.preConstructionInterest || '',
            propertyAddress: property.propertyAddress || '',
        });
        setEditingProperty(index);
        setShowAddModal(true);
    };

    const handleSaveProperty = async () => {
        if (!formData.propertyType) {
            toast.error('Please select property type');
            return;
        }

        try {
            const updatedProperties = [...properties];
            const propertyData = {
                propertyType: formData.propertyType,
                annualRentalIncome: formData.annualRentalIncome ? parseFloat(formData.annualRentalIncome) : 0,
                municipalTaxes: formData.municipalTaxes ? parseFloat(formData.municipalTaxes) : 0,
                interestOnLoan: formData.interestOnLoan ? parseFloat(formData.interestOnLoan) : 0,
                preConstructionInterest: formData.preConstructionInterest ? parseFloat(formData.preConstructionInterest) : 0,
                propertyAddress: formData.propertyAddress,
            };

            if (editingProperty !== null) {
                updatedProperties[editingProperty] = propertyData;
            } else {
                updatedProperties.push(propertyData);
            }

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        houseProperty: {
                            properties: updatedProperties,
                        },
                    },
                },
            }, { headers });

            toast.success(editingProperty !== null ? 'Property updated' : 'Property added');
            setShowAddModal(false);
            fetchFiling();
        } catch (error) {
            toast.error('Failed to save property');
        }
    };

    const handleDeleteProperty = async (index) => {
        if (!window.confirm('Remove this property?')) return;

        try {
            const updatedProperties = properties.filter((_, i) => i !== index);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        houseProperty: {
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

    const getPropertyTypeLabel = (type) => {
        // eslint-disable-next-line camelcase
        const labels = {
            self_occupied: 'Self Occupied',
            let_out: 'Let Out',
            deemed_let_out: 'Deemed Let Out',
        };
        return labels[type] || type;
    };

    const calculateNetIncome = (property) => {
        if (property.propertyType === 'self_occupied') {
            return -Math.min(property.interestOnLoan || 0, 200000);
        }
        const nav = (property.annualRentalIncome || 0) - (property.municipalTaxes || 0);
        const stdDeduction = nav * 0.30;
        return nav - stdDeduction - (property.interestOnLoan || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
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
                            House Properties
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us about your house properties and rental income.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="Most people have 1-2 properties. Multiple properties are common for ITR-2 filers."
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
                            <p className="text-sm mt-1">Click "Add property" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {properties.map((property, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded ${property.propertyType === 'self_occupied'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {getPropertyTypeLabel(property.propertyType)}
                                                </span>
                                            </div>
                                            {property.propertyAddress && (
                                                <p className="text-sm text-slate-600 mb-2">
                                                    {property.propertyAddress}
                                                </p>
                                            )}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Annual Rent:</span>
                                                    <span className="ml-2 font-medium">
                                                        ₹{(property.annualRentalIncome || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Interest:</span>
                                                    <span className="ml-2 font-medium">
                                                        ₹{(property.interestOnLoan || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-500">Net Income:</span>
                                                    <span className={`ml-2 font-medium ${calculateNetIncome(property) < 0 ? 'text-red-600' : 'text-green-600'
                                                        }`}>
                                                        ₹{calculateNetIncome(property).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditProperty(property, index)}
                                                className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProperty(index)}
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
                        onClick={handleAddProperty}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add property
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>

                {/* Add/Edit Property Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingProperty !== null ? 'Edit Property' : 'Add Property'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Property Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Property Type *
                                    </label>
                                    <select
                                        value={formData.propertyType}
                                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="self_occupied">Self Occupied</option>
                                        <option value="let_out">Let Out</option>
                                        <option value="deemed_let_out">Deemed Let Out</option>
                                    </select>
                                </div>

                                {/* Annual Rental Income */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Annual Rental Income
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.annualRentalIncome}
                                        onChange={(e) => setFormData({ ...formData, annualRentalIncome: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 600000"
                                    />
                                </div>

                                {/* Municipal Taxes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Municipal Taxes Paid
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.municipalTaxes}
                                        onChange={(e) => setFormData({ ...formData, municipalTaxes: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 20000"
                                    />
                                </div>

                                {/* Interest on Loan */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Interest on Housing Loan
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.interestOnLoan}
                                        onChange={(e) => setFormData({ ...formData, interestOnLoan: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 150000"
                                    />
                                    {formData.propertyType === 'self_occupied' && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Maximum deduction: ₹2,00,000
                                        </p>
                                    )}
                                </div>

                                {/* Pre-construction Interest */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Pre-construction Interest
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.preConstructionInterest}
                                        onChange={(e) => setFormData({ ...formData, preConstructionInterest: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g., 50000"
                                    />
                                </div>

                                {/* Property Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Property Address
                                    </label>
                                    <textarea
                                        value={formData.propertyAddress}
                                        onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="Enter property address"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProperty}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    {editingProperty !== null ? 'Update' : 'Add Property'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HousePropertiesDetails;
