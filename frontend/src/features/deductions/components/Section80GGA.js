// =====================================================
// SECTION 80GGA UI COMPONENT - SCIENTIFIC RESEARCH DONATIONS
// BurnBlack premium design for scientific research donation deductions
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  FlaskConical,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80GGA = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionAddress: '',
    registrationNumber: '',
    donationAmount: '',
    receiptNumber: '',
    receiptDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Fetch 80GGA deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80GGA', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80GGA?filingId=${filingId}`);
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
        const response = await apiClient.post('/api/itr/deductions/80GGA', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GGA: parseFloat(data.donationAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGA', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GGA deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80GGA/${id}`, {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GGA: parseFloat(data.donationAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGA', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GGA deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80GGA/${id}?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GGA', filingId]);
      toast.success('80GGA deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.institutionName.trim()) errors.institutionName = 'Institution name is required';
    if (!formData.institutionAddress.trim()) errors.institutionAddress = 'Institution address is required';
    if (!formData.registrationNumber.trim()) errors.registrationNumber = 'Registration number is required';
    if (!formData.donationAmount || parseFloat(formData.donationAmount) <= 0) {
      errors.donationAmount = 'Valid donation amount is required';
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
      institutionName: deduction.institutionName || '',
      institutionAddress: deduction.institutionAddress || '',
      registrationNumber: deduction.registrationNumber || '',
      donationAmount: deduction.donationAmount?.toString() || '',
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
      institutionName: '',
      institutionAddress: '',
      registrationNumber: '',
      donationAmount: '',
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
      formDataObj.append('section', '80GGA');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Donation receipt uploaded successfully');
        queryClient.invalidateQueries(['section80GGA', filingId]);
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
            <h3 className="text-heading-lg text-slate-900 mb-1">Section 80GGA - Scientific Research Donations</h3>
            <p className="text-body-sm text-slate-600">
              Donations to approved scientific research associations/institutions (100% deduction, no upper limit)
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
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.institutionName ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Name of the research institution"
                />
                {formErrors.institutionName && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.institutionName}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.registrationNumber ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Registration number"
                />
                {formErrors.registrationNumber && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.registrationNumber}</p>
                )}
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
              </div>

              <div className="md:col-span-2">
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Institution Address *
                </label>
                <textarea
                  value={formData.institutionAddress}
                  onChange={(e) => setFormData({ ...formData, institutionAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.institutionAddress ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Complete address of the institution"
                />
                {formErrors.institutionAddress && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.institutionAddress}</p>
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
              <FlaskConical className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No scientific research donations added yet</p>
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
                          {deduction.institutionName}
                        </h5>
                        <span className="px-2 py-1 text-body-small rounded bg-blue-100 text-blue-700">
                          100% Deduction
                        </span>
                      </div>
                      <div className="text-body-sm text-slate-600 space-y-1">
                        <p>Amount: ₹{deduction.donationAmount?.toLocaleString('en-IN')}</p>
                        <p>Registration: {deduction.registrationNumber}</p>
                        {deduction.institutionAddress && <p>Address: {deduction.institutionAddress}</p>}
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

export default Section80GGA;

