// =====================================================
// SECTION 80E UI COMPONENT - EDUCATION LOAN INTEREST
// BurnBlack premium design for education loan interest deduction
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  GraduationCap,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Building,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { deductionService } from '../services/deduction.service';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '../../../components/UI/ConfirmationDialog/ConfirmationDialog';

const Section80E = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, deductionId: null });
  const [formData, setFormData] = useState({
    lenderName: '',
    loanAccountNumber: '',
    interestPaid: '',
    loanPurpose: '',
    studentName: '',
    courseName: '',
    institutionName: '',
    loanStartDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const loanPurposes = [
    'Higher Education (Self)',
    'Higher Education (Spouse)',
    'Higher Education (Child)',
    'Higher Education (Legal Ward)',
  ];

  // Fetch 80E deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80E', filingId],
    queryFn: () => deductionService.getDeductions(filingId, '80E'),
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: async (data) => {
      try {
        return await deductionService.createDeduction(filingId, '80E', data);
      } catch (error) {
        const amount = parseFloat(data.interestPaid) || 0;
        if (onUpdate) {
          onUpdate({ section80E: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80E', filingId]);
      resetForm();
      setShowAddForm(false);
      toast.success('80E deduction added successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80E: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add deduction');
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ deductionId, data }) => {
      try {
        return await deductionService.updateDeductionBySection(filingId, '80E', deductionId, data);
      } catch (error) {
        const amount = parseFloat(data.interestPaid) || 0;
        if (onUpdate) {
          onUpdate({ section80E: amount });
        }
        return { success: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80E', filingId]);
      resetForm();
      setEditingDeduction(null);
      toast.success('80E deduction updated successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80E: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update deduction');
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (deductionId) => {
      try {
        return await deductionService.deleteDeductionBySection(filingId, '80E', deductionId);
      } catch (error) {
        if (onUpdate) {
          onUpdate({ section80E: 0 });
        }
        return { success: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80E', filingId]);
      toast.success('80E deduction deleted successfully');
      if (typeof onUpdate === 'function') {
        onUpdate({ section80E: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete deduction');
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || deductions.reduce((sum, d) => sum + (parseFloat(d.interestPaid) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    if (!formData.lenderName.trim()) {
      setFormErrors({ lenderName: 'Lender name is required' });
      return;
    }
    if (!formData.loanAccountNumber.trim()) {
      setFormErrors({ loanAccountNumber: 'Loan account number is required' });
      return;
    }
    if (!formData.interestPaid || parseFloat(formData.interestPaid) <= 0) {
      setFormErrors({ interestPaid: 'Valid interest amount is required' });
      return;
    }
    if (!formData.loanPurpose) {
      setFormErrors({ loanPurpose: 'Loan purpose is required' });
      return;
    }
    if (!formData.studentName.trim()) {
      setFormErrors({ studentName: 'Student name is required' });
      return;
    }

    try {
      if (editingDeduction) {
        await updateDeductionMutation.mutateAsync({
          deductionId: editingDeduction.id,
          data: formData,
        });
      } else {
        await addDeductionMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving 80E deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      lenderName: deduction.lenderName || '',
      loanAccountNumber: deduction.loanAccountNumber || '',
      interestPaid: deduction.interestPaid?.toString() || '',
      loanPurpose: deduction.loanPurpose || '',
      studentName: deduction.studentName || '',
      courseName: deduction.courseName || '',
      institutionName: deduction.institutionName || '',
      loanStartDate: deduction.loanStartDate || '',
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
      lenderName: '',
      loanAccountNumber: '',
      interestPaid: '',
      loanPurpose: '',
      studentName: '',
      courseName: '',
      institutionName: '',
      loanStartDate: '',
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
      formDataObj.append('section', '80E');

      const response = await apiClient.post('/api/documents/upload-proof', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Interest certificate uploaded successfully');
        queryClient.invalidateQueries(['section80E', filingId]);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-100 rounded-xl">
              <GraduationCap className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-slate-900">Section 80E</h2>
              <p className="text-body-sm text-slate-600">Education Loan Interest (No upper limit)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Loan</span>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-body-sm font-medium text-slate-700">Total Interest Deduction</span>
            <span className="text-heading-lg font-bold text-gold-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-4">
          {deductions.map((deduction) => (
            <div
              key={deduction.id}
              className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 bg-gold-100 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-gold-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-heading-md text-slate-900">{deduction.studentName}</h3>
                      {deduction.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-body-sm text-slate-600">Lender: </span>
                        <span className="text-body-sm font-medium text-slate-900">{deduction.lenderName}</span>
                      </div>
                      <div>
                        <span className="text-body-sm text-slate-600">Loan Account: </span>
                        <span className="text-body-sm font-medium text-slate-900">{deduction.loanAccountNumber}</span>
                      </div>
                      <div>
                        <span className="text-body-sm text-slate-600">Purpose: </span>
                        <span className="text-body-sm font-medium text-slate-900">{deduction.loanPurpose}</span>
                      </div>
                      {deduction.courseName && (
                        <div>
                          <span className="text-body-sm text-slate-600">Course: </span>
                          <span className="text-body-sm font-medium text-slate-900">{deduction.courseName}</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="text-heading-md font-bold text-gold-600">
                          ₹{parseFloat(deduction.interestPaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-body-xs text-slate-600">Interest Paid</div>
                      </div>
                      {deduction.proofDocument && (
                        <div className="flex items-center space-x-2 text-body-sm text-slate-600">
                          <FileText className="h-4 w-4" />
                          <span>Interest certificate uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleProofUpload(e, deduction.id)}
                      className="hidden"
                    />
                    <div className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                      <Upload className="h-4 w-4" />
                    </div>
                  </label>
                  <button
                    onClick={() => handleEdit(deduction)}
                    className="p-2 text-gold-600 hover:bg-gold-50 rounded-xl transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.id)}
                    className="p-2 text-error-600 hover:bg-error-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
          <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-heading-md text-slate-900 mb-2">No Education Loans</h3>
          <p className="text-body-sm text-slate-600 mb-4">
            Add education loan interest details to claim deduction under Section 80E
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
          >
            Add Loan
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-elevation-4 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-xl text-slate-900">
                {editingDeduction ? 'Edit' : 'Add'} 80E Deduction
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <AlertCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Lender Name */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Lender Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.lenderName ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter lender/bank name"
                />
                {formErrors.lenderName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.lenderName}</p>
                )}
              </div>

              {/* Loan Account Number */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Loan Account Number <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.loanAccountNumber}
                  onChange={(e) => setFormData({ ...formData, loanAccountNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.loanAccountNumber ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter loan account number"
                />
                {formErrors.loanAccountNumber && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.loanAccountNumber}</p>
                )}
              </div>

              {/* Interest Paid */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Interest Paid (₹) <span className="text-error-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.interestPaid}
                  onChange={(e) => setFormData({ ...formData, interestPaid: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.interestPaid ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter interest paid during the year"
                />
                {formErrors.interestPaid && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.interestPaid}</p>
                )}
                <p className="mt-1 text-body-xs text-slate-500">
                  Full interest amount is deductible (no upper limit)
                </p>
              </div>

              {/* Loan Purpose */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Loan Purpose <span className="text-error-600">*</span>
                </label>
                <select
                  value={formData.loanPurpose}
                  onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.loanPurpose ? 'border-error-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select loan purpose</option>
                  {loanPurposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
                {formErrors.loanPurpose && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.loanPurpose}</p>
                )}
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Student Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    formErrors.studentName ? 'border-error-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter student name"
                />
                {formErrors.studentName && (
                  <p className="mt-1 text-body-xs text-error-600">{formErrors.studentName}</p>
                )}
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter course name"
                />
              </div>

              {/* Institution Name */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Enter institution name"
                />
              </div>

              {/* Loan Start Date */}
              <div>
                <label className="block text-label-md text-slate-700 mb-1">
                  Loan Start Date
                </label>
                <input
                  type="date"
                  value={formData.loanStartDate}
                  onChange={(e) => setFormData({ ...formData, loanStartDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-xl p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-heading-sm text-info-900 mb-1">Section 80E Deduction</h3>
                    <ul className="text-body-sm text-info-700 space-y-1 list-disc list-inside">
                      <li>Full interest amount is deductible (no upper limit)</li>
                      <li>Only for higher education loans</li>
                      <li>Available for maximum 8 years from the year interest starts being paid</li>
                      <li>Interest certificate from lender is required as proof</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-xl shadow-elevation-1 text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeductionMutation.isPending || updateDeductionMutation.isPending}
                  className="flex-1 py-2 px-4 border border-transparent rounded-xl shadow-elevation-1 text-body-regular font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                  {addDeductionMutation.isPending || updateDeductionMutation.isPending
                    ? 'Saving...'
                    : editingDeduction
                    ? 'Update'
                    : 'Add Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, deductionId: null })}
        onConfirm={confirmDelete}
        title="Delete Deduction"
        message="Are you sure you want to delete this deduction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Section80E;

