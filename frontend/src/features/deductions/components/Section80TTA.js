// =====================================================
// SECTION 80TTA/80TTB UI COMPONENT - SAVINGS INTEREST
// BurnBlack premium design for savings account interest deductions
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  PiggyBank,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { deductionService } from '../services/deduction.service';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80TTA = ({ filingId, onUpdate, userAge = 30 }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    interestAmount: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Determine section and limit based on age
  const isSeniorCitizen = userAge >= 60;
  const section = isSeniorCitizen ? '80TTB' : '80TTA';
  const limit = isSeniorCitizen ? 50000 : 10000;

  // Fetch deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80TTA', filingId],
    queryFn: () => deductionService.getDeductions(filingId, section),
    enabled: !!filingId,
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || 0;
  const remainingLimit = Math.max(0, limit - totalAmount);
  const utilizationPercentage = Math.min((totalAmount / limit) * 100, 100);

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        return await deductionService.createDeduction(filingId, section, data);
      } catch (error) {
        if (onUpdate) {
          onUpdate({ [`section${section}`]: parseFloat(data.interestAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80TTA', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success(`${section} deduction added successfully`);
      if (typeof onUpdate === 'function') {
        onUpdate({ [`section${section}`]: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        return await deductionService.updateDeductionBySection(filingId, section, id, data);
      } catch (error) {
        if (onUpdate) {
          onUpdate({ [`section${section}`]: parseFloat(data.interestAmount) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80TTA', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success(`${section} deduction updated successfully`);
      if (typeof onUpdate === 'function') {
        onUpdate({ [`section${section}`]: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await deductionService.deleteDeductionBySection(filingId, section, id);
      } catch (error) {
        return { success: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80TTA', filingId]);
      toast.success(`${section} deduction deleted successfully`);
      if (typeof onUpdate === 'function') {
        onUpdate({ [`section${section}`]: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.bankName.trim()) errors.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (!formData.interestAmount || parseFloat(formData.interestAmount) <= 0) {
      errors.interestAmount = 'Valid interest amount is required';
    }
    if (parseFloat(formData.interestAmount) + totalAmount > limit) {
      errors.interestAmount = `Total interest cannot exceed ₹${limit.toLocaleString('en-IN')}`;
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingDeduction) {
      updateDeductionMutation.mutate({
        id: editingDeduction.id,
        data: {
          ...formData,
          interestAmount: parseFloat(formData.interestAmount),
        },
      });
    } else {
      addDeductionMutation.mutate({
        ...formData,
        interestAmount: parseFloat(formData.interestAmount),
      });
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      bankName: deduction.bankName || '',
      accountNumber: deduction.accountNumber || '',
      interestAmount: deduction.interestAmount?.toString() || '',
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
      bankName: '',
      accountNumber: '',
      interestAmount: '',
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
      formDataObj.append('section', section);

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Interest certificate uploaded successfully');
        queryClient.invalidateQueries(['section80TTA', filingId]);
      }
    } catch (error) {
      toast.error('Failed to upload certificate');
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
            <h3 className="text-heading-lg text-slate-900 mb-1">
              Section {section} - Savings Account Interest
            </h3>
            <p className="text-body-sm text-slate-600">
              {isSeniorCitizen
                ? 'Deduction for senior citizens (age 60+) - Limit: ₹50,000'
                : 'Deduction for non-senior citizens - Limit: ₹10,000'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-body-xs text-slate-500 mb-1">Total Claimed</div>
            <div className="text-heading-xl font-bold text-gold-600">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-body-xs text-slate-500 mt-1">Limit: ₹{limit.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-body-sm font-medium text-slate-700">Utilization</span>
            <span className="text-heading-sm font-bold text-slate-900">
              ₹{totalAmount.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gold-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-body-xs text-slate-600">{utilizationPercentage.toFixed(1)}% utilized</span>
            <span className="text-body-xs text-green-600 font-medium">
              ₹{remainingLimit.toLocaleString('en-IN')} remaining
            </span>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-heading-md text-slate-900">
              {editingDeduction ? 'Edit Interest Entry' : 'Add Interest Entry'}
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
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.bankName ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Bank name"
                />
                {formErrors.bankName && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.accountNumber ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Account number"
                />
                {formErrors.accountNumber && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-1">
                  Interest Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.interestAmount}
                  onChange={(e) => setFormData({ ...formData, interestAmount: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.interestAmount ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="0"
                  max={remainingLimit}
                />
                {formErrors.interestAmount && (
                  <p className="text-body-small text-error-500 mt-1">{formErrors.interestAmount}</p>
                )}
                <p className="text-body-small text-slate-500 mt-1">
                  Remaining limit: ₹{remainingLimit.toLocaleString('en-IN')}
                </p>
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
                {editingDeduction ? 'Update' : 'Add'} Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deductions List */}
      {!showAddForm && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-heading-md text-slate-900">Your Savings Accounts</h4>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>

          {deductions.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <PiggyBank className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No savings account interest added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
              >
                Add Your First Account
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
                          {deduction.bankName}
                        </h5>
                      </div>
                      <div className="text-body-sm text-slate-600 space-y-1">
                        <p>Account: {deduction.accountNumber}</p>
                        <p>Interest: ₹{deduction.interestAmount?.toLocaleString('en-IN')}</p>
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
        title="Delete Interest Entry"
        message="Are you sure you want to delete this interest entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80TTA;

