/* eslint-disable no-alert */
// =====================================================
// ITR-3 DEPRECIATION SCHEDULE
// Manual entry for depreciation as per IT Act
// CA inputs from their accounting software
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, Plus, Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const ITR3DepreciationSchedule = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState(null);
    const [formData, setFormData] = useState({
        blockName: '',
        openingWDV: '',
        additions: '',
        deletions: '',
        depreciationRate: '',
        depreciationAmount: '',
        closingWDV: '',
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

    const depreciationBlocks = filing?.jsonPayload?.business?.depreciation?.blocks || [];

    const handleAddBlock = () => {
        setFormData({
            blockName: '',
            openingWDV: '',
            additions: '',
            deletions: '',
            depreciationRate: '',
            depreciationAmount: '',
            closingWDV: '',
        });
        setEditingBlock(null);
        setShowAddModal(true);
    };

    const handleEditBlock = (block, index) => {
        setFormData({
            blockName: block.blockName || '',
            openingWDV: block.openingWDV || '',
            additions: block.additions || '',
            deletions: block.deletions || '',
            depreciationRate: block.depreciationRate || '',
            depreciationAmount: block.depreciationAmount || '',
            closingWDV: block.closingWDV || '',
        });
        setEditingBlock(index);
        setShowAddModal(true);
    };

    const handleSaveBlock = async () => {
        if (!formData.blockName || !formData.depreciationAmount) {
            toast.error('Please fill block name and depreciation amount');
            return;
        }

        try {
            const updatedBlocks = [...depreciationBlocks];
            const blockData = {
                blockName: formData.blockName,
                openingWDV: parseFloat(formData.openingWDV) || 0,
                additions: parseFloat(formData.additions) || 0,
                deletions: parseFloat(formData.deletions) || 0,
                depreciationRate: parseFloat(formData.depreciationRate) || 0,
                depreciationAmount: parseFloat(formData.depreciationAmount) || 0,
                closingWDV: parseFloat(formData.closingWDV) || 0,
            };

            if (editingBlock !== null) {
                updatedBlocks[editingBlock] = blockData;
            } else {
                updatedBlocks.push(blockData);
            }

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    business: {
                        ...filing.jsonPayload?.business,
                        depreciation: {
                            blocks: updatedBlocks,
                        },
                    },
                },
            }, { headers });

            toast.success(editingBlock !== null ? 'Block updated' : 'Block added');
            setShowAddModal(false);
            fetchFiling();
        } catch (error) {
            toast.error('Failed to save depreciation block');
        }
    };

    const handleDeleteBlock = async (index) => {
        if (!window.confirm('Remove this depreciation block?')) return;

        try {
            const updatedBlocks = depreciationBlocks.filter((_, i) => i !== index);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    business: {
                        ...filing.jsonPayload?.business,
                        depreciation: {
                            blocks: updatedBlocks,
                        },
                    },
                },
            }, { headers });

            toast.success('Depreciation block removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove depreciation block');
        }
    };

    const totalDepreciation = depreciationBlocks.reduce((sum, b) => sum + (b.depreciationAmount || 0), 0);

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Depreciation Schedule
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Enter depreciation as per IT Act (from your accounting software).
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="info"
                        message="Enter depreciation details from your accounting software. No auto-calculation - just input the values."
                    />
                </div>

                {/* Depreciation Blocks Table */}
                <Card>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Depreciation Blocks
                    </h2>

                    {depreciationBlocks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No depreciation blocks added yet</p>
                            <p className="text-sm mt-1">Click "Add block" to get started</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-2">Block Name</th>
                                    <th className="text-right py-3 px-2">Opening WDV</th>
                                    <th className="text-right py-3 px-2">Additions</th>
                                    <th className="text-right py-3 px-2">Deletions</th>
                                    <th className="text-right py-3 px-2">Rate %</th>
                                    <th className="text-right py-3 px-2">Depreciation</th>
                                    <th className="text-right py-3 px-2">Closing WDV</th>
                                    <th className="text-center py-3 px-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {depreciationBlocks.map((block, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-2 font-medium">{block.blockName}</td>
                                        <td className="py-3 px-2 text-right">₹{block.openingWDV.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-right">₹{block.additions.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-right">₹{block.deletions.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-right">{block.depreciationRate}%</td>
                                        <td className="py-3 px-2 text-right font-medium text-red-600">
                                            ₹{block.depreciationAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-3 px-2 text-right">₹{block.closingWDV.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditBlock(block, index)}
                                                    className="p-1 text-slate-600 hover:text-primary-600"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBlock(index)}
                                                    className="p-1 text-slate-600 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-slate-50">
                                    <td className="py-3 px-2" colSpan="5">Total Depreciation</td>
                                    <td className="py-3 px-2 text-right text-red-600">
                                        ₹{totalDepreciation.toLocaleString('en-IN')}
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tbody>
                        </table>
                    )}

                    <button
                        onClick={handleAddBlock}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add depreciation block
                    </button>
                </Card>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/business/reconciliation`)}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue to Reconciliation →
                    </button>
                </div>

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingBlock !== null ? 'Edit Depreciation Block' : 'Add Depreciation Block'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Block Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.blockName}
                                        onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Plant & Machinery, Computers, Furniture"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Opening WDV
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.openingWDV}
                                            onChange={(e) => setFormData({ ...formData, openingWDV: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Additions
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.additions}
                                            onChange={(e) => setFormData({ ...formData, additions: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Deletions
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deletions}
                                            onChange={(e) => setFormData({ ...formData, deletions: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Depreciation Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.depreciationRate}
                                            onChange={(e) => setFormData({ ...formData, depreciationRate: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Depreciation Amount *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.depreciationAmount}
                                            onChange={(e) => setFormData({ ...formData, depreciationAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Closing WDV
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.closingWDV}
                                            onChange={(e) => setFormData({ ...formData, closingWDV: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBlock}
                                    className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                                >
                                    {editingBlock !== null ? 'Update' : 'Add Block'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ITR3DepreciationSchedule;
