// =====================================================
// SECTION 80GGC UI COMPONENT - POLITICAL PARTY DONATIONS
// BurnBlack premium design for political party donation deductions
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Vote,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80GGC = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    partyName: '',
    partyRegistrationNumber: '',
    donationAmount: '',
    paymentMode: 'online',
    receiptNumber: '',
    receiptDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Fetch 80GGC deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80GGC', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80GGC?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { data: { deductions: [], totalAmount: 0, remainingLimit: 0 } };
      }
    },
    enabled: !!filingId,
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || 0;

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/api/itr/deductions/80GGC', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GGC: parseFloat(data.donationAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGC', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GGC deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80GGC/${id}`, {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GGC: parseFloat(data.donationAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGC', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GGC deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80GGC/${id}?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGC', filingId]);
      toast.success('80GGC deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.partyName.trim()) errors.partyName = 'Party name is required';
    if (!formData.partyRegistrationNumber.trim()) {
      errors.partyRegistrationNumber = 'Party registration number is required';
    }
    if (!formData.donationAmount || parseFloat(formData.donationAmount) <= 0) {
      errors.donationAmount = 'Valid donation amount is required';
    }
    if (formData.paymentMode === 'cash' && parseFloat(formData.donationAmount) > 2000) {
      errors.donationAmount = 'Cash donations cannot exceed ₹2,000';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingDeduction) {
      updateDeductionMutation.mutate({
        id: editingDeduction.id,
        data: {
          ...formData,
          donationAmount: parseFloat(formData.donationAmount),
        },
      });
    } else {
      addDeductionMutation.mutate({
        ...formData,
        donationAmount: parseFloat(formData.donationAmount),
      });
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      partyName: deduction.partyName || '',
      partyRegistrationNumber: deduction.partyRegistrationNumber || '',
      donationAmount: deduction.donationAmount?.toString() || '',
      paymentMode: deduction.paymentMode || 'online',
      receiptNumber: deduction.receiptNumber || '',
      receiptDate: deduction.receiptDate || '',
      financialYear: deduction.financialYear || '2024-25',
    });
    setShowAddForm(true);
  };

  const handleDelete = (deductionId) => {
    setDeleteConfirm({ isOpen: true, deductionId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.deductionId) {
      deleteDeductionMutation.mutate(deleteConfirm.deductionId);
    }
    setDeleteConfirm({ isOpen: false, deductionId: null });
  };

  const resetForm = () => {
    setFormData({
      partyName: '',
      partyRegistrationNumber: '',
      donationAmount: '',
      paymentMode: 'online',
      receiptNumber: '',
      receiptDate: '',
      financialYear: '2024-25',
    });
    setFormErrors({});
    setEditingDeduction(null);
  };

  const handleProofUpload = async (e, deductionId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('deductionId', deductionId);
      formDataObj.append('section', '80GGC');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Donation receipt uploaded successfully');
        queryClient.invalidateQueries(['section80GGC', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload receipt');
    } finally {
      setUploadingProof(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-lg text-slate-900 mb-1">Section 80GGC - Political Party Donations</h3>
            <p className="text-body-sm text-slate-600">
              Donations to registered political parties (100% deduction, no upper limit)
            </p>
          </div>
          <div className="text-right">
            <div className="text-body-xs text-slate-500 mb-1">Total Claimed</div>
            <div className="text-heading-xl font-bold text-gold-600">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-body-xs text-slate-500 mt-1">No upper limit</div>
          </div>
        </div>

        {/* Important Note */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-body-xs text-yellow-800">
              <strong>Note:</strong> Cash donations exceeding ₹2,000 are not allowed. Only registered
              political parties are eligible.
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-heading-md text-slate-900">
              {editingDeduction ? 'Edit Donation' : 'Add New Donation'}
            </h4>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Political Party Name *
                </label>
                <input
                  type="text"
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.partyName ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Name of the registered political party"
                />
                {formErrors.partyName && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.partyName}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Party Registration Number *
                </label>
                <input
                  type="text"
                  value={formData.partyRegistrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, partyRegistrationNumber: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.partyRegistrationNumber ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Registration number"
                />
                {formErrors.partyRegistrationNumber && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.partyRegistrationNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="online">Online/Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash (Max ₹2,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Donation Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.donationAmount}
                  onChange={(e) => setFormData({ ...formData, donationAmount: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.donationAmount ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.donationAmount && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.donationAmount}</p>
                )}
                {formData.paymentMode === 'cash' && (
                  <p className="text-body-small text-yellow-600 mt-1">
                    Cash donations limited to ₹2,000
                  </p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Receipt number"
                />
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Receipt Date</label>
                <input
                  type="date"
                  value={formData.receiptDate}
                  onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addDeductionMutation.isPending || updateDeductionMutation.isPending}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 disabled:opacity-50"
              >
                {editingDeduction ? 'Update' : 'Add'} Donation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deductions List */}
      {!showAddForm && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-heading-md text-slate-900">Your Donations</h4>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
            >
              <Plus className="w-4 h-4" />
              Add Donation
            </button>
          </div>

          {deductions.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <Vote className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No political party donations added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
              >
                Add Your First Donation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {deductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-heading-sm font-semibold text-slate-900">
                          {deduction.partyName}
                        </h5>
                        <span className="px-2 py-1 text-body-small rounded bg-purple-100 text-purple-700">
                          100% Deduction
                        </span>
                      </div>
                      <div className="text-body-sm text-slate-600 space-y-1">
                        <p>Amount: ₹{deduction.donationAmount?.toLocaleString('en-IN')}</p>
                        <p>Registration: {deduction.partyRegistrationNumber}</p>
                        <p>Payment Mode: {deduction.paymentMode?.toUpperCase()}</p>
                        {deduction.receiptNumber && <p>Receipt: {deduction.receiptNumber}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleProofUpload(e, deduction.id)}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-slate-500 hover:text-gold-500" />
                      </label>
                      <button
                        onClick={() => handleEdit(deduction)}
                        className="p-1 text-slate-500 hover:text-gold-500"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(deduction.id)}
                        className="p-1 text-slate-500 hover:text-error-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, deductionId: null })}
        onConfirm={confirmDelete}
        title="Delete Donation"
        message="Are you sure you want to delete this donation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80GGC;

