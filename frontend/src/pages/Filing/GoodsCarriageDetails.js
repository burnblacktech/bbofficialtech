/* eslint-disable no-alert */
// =====================================================
// GOODS CARRIAGE DETAILS - ITR-4 (Section 44AE)
// Presumptive income for goods carriages (trucks)
// ₹7,500 per vehicle per month
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Plus, Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const GoodsCarriageDetails = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [formData, setFormData] = useState({
        registrationNumber: '',
        vehicleType: 'heavy_goods',
        monthsOwned: 12,
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

    const vehicles = filing?.jsonPayload?.income?.goodsCarriage?.vehicles || [];

    const handleAddVehicle = () => {
        setFormData({
            registrationNumber: '',
            vehicleType: 'heavy_goods',
            monthsOwned: 12,
        });
        setEditingVehicle(null);
        setShowAddModal(true);
    };

    const handleEditVehicle = (vehicle, index) => {
        setFormData({
            registrationNumber: vehicle.registrationNumber || '',
            vehicleType: vehicle.vehicleType || 'heavy_goods',
            monthsOwned: vehicle.monthsOwned || 12,
        });
        setEditingVehicle(index);
        setShowAddModal(true);
    };

    const handleSaveVehicle = async () => {
        if (!formData.registrationNumber || !formData.monthsOwned) {
            toast.error('Please fill registration number and months owned');
            return;
        }

        if (vehicles.length >= 10 && editingVehicle === null) {
            toast.error('Maximum 10 vehicles allowed for Section 44AE');
            return;
        }

        try {
            const updatedVehicles = [...vehicles];
            const vehicleData = {
                registrationNumber: formData.registrationNumber.toUpperCase(),
                vehicleType: formData.vehicleType,
                monthsOwned: parseInt(formData.monthsOwned),
                presumptiveIncome: 7500 * parseInt(formData.monthsOwned),
            };

            if (editingVehicle !== null) {
                updatedVehicles[editingVehicle] = vehicleData;
            } else {
                updatedVehicles.push(vehicleData);
            }

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        goodsCarriage: {
                            vehicles: updatedVehicles,
                        },
                    },
                },
            }, { headers });

            toast.success(editingVehicle !== null ? 'Vehicle updated' : 'Vehicle added');
            setShowAddModal(false);
            fetchFiling();
        } catch (error) {
            toast.error('Failed to save vehicle');
        }
    };

    const handleDeleteVehicle = async (index) => {
        if (!window.confirm('Remove this vehicle?')) return;

        try {
            const updatedVehicles = vehicles.filter((_, i) => i !== index);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        goodsCarriage: {
                            vehicles: updatedVehicles,
                        },
                    },
                },
            }, { headers });

            toast.success('Vehicle removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove vehicle');
        }
    };

    const totalIncome = vehicles.reduce((sum, v) => sum + (v.presumptiveIncome || 0), 0);

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
                            Goods Carriage (Section 44AE)
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/presumptive-income`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Presumptive income for goods carriages at ₹7,500 per vehicle per month.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="info"
                        message="Section 44AE: ₹7,500 per vehicle per month. Maximum 10 vehicles allowed."
                    />
                </div>

                {/* Vehicles List */}
                <Card>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Your goods carriages ({vehicles.length}/10)
                    </h2>

                    {vehicles.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No vehicles added yet</p>
                            <p className="text-sm mt-1">Click "Add vehicle" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {vehicles.map((vehicle, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Truck className="w-5 h-5 text-slate-400" />
                                                <h3 className="font-medium text-slate-900">
                                                    {vehicle.registrationNumber}
                                                </h3>
                                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                    {vehicle.vehicleType === 'heavy_goods' ? 'Heavy Goods' : 'Light Goods'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Months Owned:</span>
                                                    <span className="ml-2 font-medium">{vehicle.monthsOwned}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Presumptive Income:</span>
                                                    <span className="ml-2 font-medium text-green-600">
                                                        ₹{(vehicle.presumptiveIncome || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditVehicle(vehicle, index)}
                                                    className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVehicle(index)}
                                                    className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddVehicle}
                        disabled={vehicles.length >= 10}
                        className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors
                            ${vehicles.length >= 10 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}
                    >
                        <Plus className="w-5 h-5" />
                        Add vehicle {vehicles.length >= 10 && '(Maximum reached)'}
                    </button>
                </Card>

                {/* Summary */}
                {vehicles.length > 0 && (
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Vehicles:</span>
                                <span className="font-medium text-slate-900">{vehicles.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Presumptive Income:</span>
                                <span className="font-medium text-green-600">
                                    ₹{totalIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                                Calculation: ₹7,500 × {vehicles.reduce((sum, v) => sum + v.monthsOwned, 0)} total months
                            </div>
                        </div>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/presumptive-income`)}
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

                {/* Add/Edit Vehicle Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingVehicle !== null ? 'Edit Vehicle' : 'Add Vehicle'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Registration Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Vehicle Registration Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.registrationNumber}
                                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                                        placeholder="e.g., MH01AB1234"
                                    />
                                </div>

                                {/* Vehicle Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="heavy_goods">Heavy Goods Vehicle</option>
                                        <option value="light_goods">Light Goods Vehicle</option>
                                    </select>
                                </div>

                                {/* Months Owned */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Months Owned in FY *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={formData.monthsOwned}
                                        onChange={(e) => setFormData({ ...formData, monthsOwned: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Enter number of months (1-12) the vehicle was owned during the financial year
                                    </p>
                                </div>

                                {/* Presumptive Income Preview */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-sm text-slate-600 mb-1">Presumptive Income (Auto-calculated)</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        ₹{(7500 * (parseInt(formData.monthsOwned) || 0)).toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        ₹7,500 × {formData.monthsOwned || 0} months
                                    </div>
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
                                    onClick={handleSaveVehicle}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    {editingVehicle !== null ? 'Update' : 'Add Vehicle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default GoodsCarriageDetails;
