// =====================================================
// SECTION 80C UI COMPONENT - BURNBLACK PREMIUM DESIGN
// EPF, PPF, LIC, ELSS with crystal-clear UX
// =====================================================

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Shield,
  IndianRupee,
  Calendar,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { deductionService } from '../services/deduction.service';

const Section80C = ({ filingId, onUpdate }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    deductionType: '',
    instrumentName: '',
    amount: '',
    providerName: '',
    providerCode: '',
    policyNumber: '',
    startDate: '',
    endDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});

  // 80C Deduction Types with BurnBlack styling
  const deductionTypes = [
    {
      id: 'EPF',
      name: 'Employee Provident Fund',
      icon: Building,
      color: 'emerald',
      description: 'Employer matched contributions',
    },
    {
      id: 'PPF',
      name: 'Public Provident Fund',
      icon: Shield,
      color: 'gold',
      description: '15-year tax saving scheme',
    },
    {
      id: 'LIC',
      name: 'Life Insurance Premium',
      icon: Shield,
      color: 'royal',
      description: 'Life insurance policy premiums',
    },
    {
      id: 'ELSS',
      name: 'Equity Linked Savings Scheme',
      icon: TrendingUp,
      color: 'emerald',
      description: 'Tax saving mutual funds',
    },
    {
      id: 'ULIP',
      name: 'Unit Linked Insurance Plan',
      icon: IndianRupee,
      color: 'gold',
      description: 'Insurance + investment combo',
    },
    {
      id: 'HOME_LOAN_PRINCIPAL',
      name: 'Home Loan Principal',
      icon: Building,
      color: 'royal',
      description: 'Principal amount repayment',
    },
  ];

  // Fetch 80C deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80C', filingId],
    queryFn: () => deductionService.getDeductions(filingId, '80C'),
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: (data) => deductionService.createDeduction(filingId, '80C', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80C', filingId]);
      resetForm();
      setShowAddForm(false);
      if (typeof onUpdate === 'function') {
        // Let parent draft data keep totals consistent
        onUpdate({ section80C: result?.data?.totalAmount ?? 0 });
      }
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: ({ deductionId, data }) => deductionService.updateDeductionBySection(filingId, '80C', deductionId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80C', filingId]);
      resetForm();
      setEditingDeduction(null);
      if (typeof onUpdate === 'function') {
        onUpdate({ section80C: result?.data?.totalAmount ?? 0 });
      }
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: (deductionId) => deductionService.deleteDeductionBySection(filingId, '80C', deductionId),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['section80C', filingId]);
      toast.success('Deduction deleted successfully');
      setDeletingId(null);
      if (typeof onUpdate === 'function') {
        onUpdate({ section80C: result?.data?.totalAmount ?? 0 });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete deduction');
      setDeletingId(null);
    },
  });

  const deductions = deductionsData?.data?.deductions || [];
  const totalAmount = deductionsData?.data?.totalAmount || 0;
  const remainingLimit = deductionsData?.data?.remainingLimit || 150000;
  const utilizationPercentage = Math.round((totalAmount / 150000) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    // Basic validation
    const errors = {};
    if (!formData.deductionType) errors.deductionType = 'Deduction type is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
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
      console.error('Error saving 80C deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      deductionType: deduction.deductionType,
      instrumentName: deduction.instrumentName || '',
      amount: deduction.amount.toString(),
      providerName: deduction.providerName || '',
      providerCode: deduction.providerCode || '',
      policyNumber: deduction.policyNumber || '',
      startDate: deduction.startDate || '',
      endDate: deduction.endDate || '',
      financialYear: deduction.financialYear || '2024-25',
    });
    setShowAddForm(true);
  };

  const handleDelete = (deductionId) => {
    setDeletingId(deductionId);
    // Show confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">Delete deduction?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              deleteDeductionMutation.mutate(deductionId);
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-body-regular hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => {
              setDeletingId(null);
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-slate-200 text-gray-800 rounded text-body-regular hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  const resetForm = () => {
    setFormData({
      deductionType: '',
      instrumentName: '',
      amount: '',
      providerName: '',
      providerCode: '',
      policyNumber: '',
      startDate: '',
      endDate: '',
      financialYear: '2024-25',
    });
    setFormErrors({});
    setEditingDeduction(null);
  };

  const getDeductionTypeInfo = (type) => {
    return deductionTypes.find(d => d.id === type) || { name: type, icon: FileText, color: 'neutral' };
  };

  return (
    <div className="bg-burnblack-50 min-h-screen p-4 lg:p-6">
      {/* Header with BurnBlack Gradient */}
      <div className="bg-gradient-burnblack-gold rounded-2xl p-6 mb-6 shadow-gold-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gold-500 rounded-xl shadow-elevation-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-heading-2 font-bold text-white">Section 80C Deductions</h1>
              <p className="text-gold-100">Investment & Savings (Limit: ₹1,50,000)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-xl font-semibold shadow-elevation-3 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Deduction</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-burnblack-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gold-100 font-medium">Utilization</span>
            <span className="text-white font-bold">₹{totalAmount.toLocaleString()} / ₹1,50,000</span>
          </div>
          <div className="w-full bg-burnblack-700 rounded-xl h-3">
            <div
              className="bg-gradient-gold-emerald h-3 rounded-xl transition-all duration-500"
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-body-regular">
            <span className="text-gold-200">{utilizationPercentage}% utilized</span>
            <span className="text-emerald-300">₹{remainingLimit.toLocaleString()} remaining</span>
          </div>
        </div>
      </div>

      {/* Deductions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {deductions.map((deduction) => {
          const typeInfo = getDeductionTypeInfo(deduction.deductionType);
          const IconComponent = typeInfo.icon;

          return (
            <div
              key={deduction.id}
              className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${typeInfo.color}-100 rounded-xl`}>
                  <IconComponent className={`h-6 w-6 text-${typeInfo.color}-600`} />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(deduction)}
                    className="p-2 text-royal-600 hover:bg-royal-50 rounded-xl transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.id)}
                    className="p-2 text-crimson-600 hover:bg-crimson-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-burnblack-800 text-heading-4">
                    {typeInfo.name}
                  </h3>
                  <p className="text-neutral-600 text-body-regular">{typeInfo.description}</p>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3">
                  <div className="text-heading-2 font-bold text-emerald-600">
                    ₹{deduction.amount.toLocaleString()}
                  </div>
                  <div className="text-body-regular text-neutral-600">Investment Amount</div>
                </div>

                {deduction.instrumentName && (
                  <div>
                    <div className="text-body-regular text-neutral-600">Instrument</div>
                    <div className="font-medium text-burnblack-700">{deduction.instrumentName}</div>
                  </div>
                )}

                {deduction.providerName && (
                  <div>
                    <div className="text-body-regular text-neutral-600">Provider</div>
                    <div className="font-medium text-burnblack-700">{deduction.providerName}</div>
                  </div>
                )}

                {deduction.isVerified ? (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-body-regular font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sunset-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-body-regular font-medium">Pending Verification</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Options */}
      {!showAddForm && deductions.length === 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
          <h3 className="text-heading-4 font-semibold text-burnblack-800 mb-4">Quick Add Popular Deductions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {deductionTypes.slice(0, 6).map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, deductionType: type.id }));
                    setShowAddForm(true);
                  }}
                  className={`p-4 border-2 border-dashed border-${type.color}-300 bg-${type.color}-50 hover:bg-${type.color}-100 rounded-xl transition-all duration-200 text-left`}
                >
                  <IconComponent className={`h-6 w-6 text-${type.color}-600 mb-2`} />
                  <div className="font-medium text-burnblack-700 text-body-regular">{type.name}</div>
                  <div className={`text-xs text-${type.color}-600 mt-1`}>{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-burnblack-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-3 font-bold text-burnblack-800">
                {editingDeduction ? 'Edit' : 'Add'} 80C Deduction
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deduction Type */}
              <div>
                <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                  Deduction Type *
                </label>
                <select
                  value={formData.deductionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, deductionType: e.target.value }))}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  required
                >
                  <option value="">Select deduction type</option>
                  {deductionTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formErrors.deductionType && (
                  <p className="text-crimson-600 text-body-regular mt-1">{formErrors.deductionType}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500">₹</span>
                  </div>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-3 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="0"
                    required
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-crimson-600 text-body-regular mt-1">{formErrors.amount}</p>
                )}
                <p className="text-body-regular text-neutral-600 mt-1">
                  Remaining limit: ₹{remainingLimit.toLocaleString()}
                </p>
              </div>

              {/* Instrument Name */}
              <div>
                <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                  Instrument/Policy Name
                </label>
                <input
                  type="text"
                  value={formData.instrumentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, instrumentName: e.target.value }))}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  placeholder="e.g., LIC Policy, ELSS Fund Name"
                />
              </div>

              {/* Provider Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                    Provider Name
                  </label>
                  <input
                    type="text"
                    value={formData.providerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="e.g., LIC, HDFC, SBI"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                    Policy/Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Policy/Account number"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-burnblack-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeductionMutation.isLoading || updateDeductionMutation.isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-burnblack-gold text-white rounded-xl hover:shadow-gold-glow transition-all duration-200 disabled:opacity-50"
                >
                  {addDeductionMutation.isLoading || updateDeductionMutation.isLoading
                    ? 'Saving...'
                    : editingDeduction
                      ? 'Update Deduction'
                      : 'Add Deduction'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Loading deductions...</p>
        </div>
      )}
    </div>
  );
};

export default Section80C;
