// =====================================================
// SECTION 80GG UI COMPONENT - RENT PAID (NO HRA)
// BurnBlack premium design for rent deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Home,
  FileText,
  AlertCircle,
  Upload,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80GG = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    rentPaid: '',
    landlordName: '',
    landlordPan: '',
    propertyAddress: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  // Fetch 80GG deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80GG', filingId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/itr/deductions/80GG?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { data: { deductions: [], totalAmount: 0, remainingLimit: 60000 } };
      }
    },
    enabled: !!filingId,
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || 0;
  const limit = 60000; // Max ₹60,000 or lower of (rent - 10% income) or 25% income

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/api/itr/deductions/80GG', {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GG: parseFloat(data.rentPaid) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GG', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GG deduction added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.put(`/api/itr/deductions/80GG/${id}`, {
          filingId,
          ...data,
        });
        return response.data;
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80GG: parseFloat(data.rentPaid) || 0 });
        }
        return { success: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GG', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80GG deduction updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/api/itr/deductions/80GG/${id}?filingId=${filingId}`);
        return response.data;
      } catch (error) {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['section80GG', filingId]);
      toast.success('80GG deduction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.rentPaid || parseFloat(formData.rentPaid) <= 0) {
      errors.rentPaid = 'Valid rent amount is required';
    }
    if (!formData.landlordName.trim()) errors.landlordName = 'Landlord name is required';
    if (!formData.propertyAddress.trim()) errors.propertyAddress = 'Property address is required';
    const rentAmount = parseFloat(formData.rentPaid);
    if (rentAmount > 100000 && !formData.landlordPan) {
      errors.landlordPan = 'Landlord PAN is required for rent > ₹1,00,000/year';
    }
    if (formData.landlordPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.landlordPan)) {
      errors.landlordPan = 'Invalid PAN format';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingDeduction) {
      updateDeductionMutation.mutate({
        id: editingDeduction.id,
        data: {
          ...formData,
          rentPaid: parseFloat(formData.rentPaid),
        },
      });
    } else {
      addDeductionMutation.mutate({
        ...formData,
        rentPaid: parseFloat(formData.rentPaid),
      });
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      rentPaid: deduction.rentPaid?.toString() || '',
      landlordName: deduction.landlordName || '',
      landlordPan: deduction.landlordPan || '',
      propertyAddress: deduction.propertyAddress || '',
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
      rentPaid: '',
      landlordName: '',
      landlordPan: '',
      propertyAddress: '',
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
      formDataObj.append('section', '80GG');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Rent receipt uploaded successfully');
        queryClient.invalidateQueries(['section80GG', filingId]);
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

  const remainingLimit = Math.max(0, limit - totalAmount);
  const utilizationPercentage = Math.min((totalAmount / limit) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-lg text-gray-900 mb-1">Section 80GG - Rent Paid</h3>
            <p className="text-body-sm text-gray-600">
              For individuals not receiving HRA (Max: ₹60,000 or lower of formula)
            </p>
          </div>
          <div className="text-right">
            <div className="text-body-xs text-gray-500 mb-1">Total Claimed</div>
            <div className="text-heading-xl font-bold text-gold-600">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-body-xs text-gray-500 mt-1">Limit: ₹60,000</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-body-sm font-medium text-gray-700">Utilization</span>
            <span className="text-heading-sm font-bold text-gray-900">
              ₹{totalAmount.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gold-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-body-xs text-gray-600">{utilizationPercentage.toFixed(1)}% utilized</span>
            <span className="text-body-xs text-green-600 font-medium">
              ₹{remainingLimit.toLocaleString('en-IN')} remaining
            </span>
          </div>
        </div>

        {/* Important Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-body-xs text-blue-800">
              <strong>Note:</strong> This deduction is available only if you don't receive HRA. The
              deduction is lower of: (Rent paid - 10% of total income), ₹60,000, or 25% of total
              income. Landlord PAN required if rent exceeds ₹1,00,000/year.
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-heading-md text-gray-900">
              {editingDeduction ? 'Edit Rent Details' : 'Add Rent Details'}
            </h4>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Paid (₹) *
                </label>
                <input
                  type="number"
                  value={formData.rentPaid}
                  onChange={(e) => setFormData({ ...formData, rentPaid: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.rentPaid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.rentPaid && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.rentPaid}</p>
                )}
                {parseFloat(formData.rentPaid) > 100000 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Landlord PAN required for rent &gt; ₹1,00,000/year
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landlord Name *
                </label>
                <input
                  type="text"
                  value={formData.landlordName}
                  onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.landlordName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Landlord's full name"
                />
                {formErrors.landlordName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.landlordName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landlord PAN {parseFloat(formData.rentPaid) > 100000 && '*'}
                </label>
                <input
                  type="text"
                  value={formData.landlordPan}
                  onChange={(e) =>
                    setFormData({ ...formData, landlordPan: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.landlordPan ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ABCDE1234F"
                />
                {formErrors.landlordPan && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.landlordPan}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address *
                </label>
                <textarea
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.propertyAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Complete address of the rented property"
                />
                {formErrors.propertyAddress && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.propertyAddress}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addDeductionMutation.isPending || updateDeductionMutation.isPending}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
              >
                {editingDeduction ? 'Update' : 'Add'} Rent Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deductions List */}
      {!showAddForm && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-heading-md text-gray-900">Your Rent Details</h4>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              <Plus className="w-4 h-4" />
              Add Rent Details
            </button>
          </div>

          {deductions.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No rent details added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                Add Rent Details
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {deductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-heading-sm font-semibold text-gray-900">
                          {deduction.propertyAddress}
                        </h5>
                      </div>
                      <div className="text-body-sm text-gray-600 space-y-1">
                        <p>Rent Paid: ₹{deduction.rentPaid?.toLocaleString('en-IN')}</p>
                        <p>Landlord: {deduction.landlordName}</p>
                        {deduction.landlordPan && <p>PAN: {deduction.landlordPan}</p>}
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
                        <Upload className="w-5 h-5 text-gray-500 hover:text-gold-500" />
                      </label>
                      <button
                        onClick={() => handleEdit(deduction)}
                        className="p-1 text-gray-500 hover:text-gold-500"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(deduction.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
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
        title="Delete Rent Deduction"
        message="Are you sure you want to delete this rent deduction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80GG;

