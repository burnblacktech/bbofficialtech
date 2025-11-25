// =====================================================
// SECTION 80D UI COMPONENT - HEALTH INSURANCE PREMIUMS
// BurnBlack premium design for health insurance deductions
// =====================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit,
  Heart,
  Shield,
  Users,
  User,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { section80DService } from '../../services/apiService';
import { formValidators } from '../../utils/validators';

const Section80D = ({ filingId }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [formData, setFormData] = useState({
    policyType: '',
    policyName: '',
    policyNumber: '',
    insuranceCompany: '',
    companyPan: '',
    premiumAmount: '',
    premiumFrequency: 'annual',
    policyStartDate: '',
    policyEndDate: '',
    financialYear: '2024-25',
  });
  const [formErrors, setFormErrors] = useState({});

  // Policy Types with BurnBlack styling
  const policyTypes = [
    {
      id: 'self_family',
      name: 'Self & Family',
      icon: Users,
      color: 'emerald',
      limit: 25000,
      description: 'Health insurance for self and family',
    },
    {
      id: 'parents',
      name: 'Parents',
      icon: Heart,
      color: 'gold',
      limit: 25000,
      description: 'Health insurance for parents',
    },
    {
      id: 'senior_citizen_self',
      name: 'Senior Citizen Self',
      icon: User,
      color: 'royal',
      limit: 50000,
      description: 'Health insurance for senior citizen self',
    },
    {
      id: 'senior_citizen_parents',
      name: 'Senior Citizen Parents',
      icon: Heart,
      color: 'crimson',
      limit: 50000,
      description: 'Health insurance for senior citizen parents',
    },
  ];

  // Fetch 80D deductions
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['section80D', filingId],
    queryFn: () => section80DService.getDeductions(filingId),
    enabled: !!filingId,
  });

  // Add deduction mutation
  const addDeductionMutation = useMutation({
    mutationFn: (data) => section80DService.addDeduction(filingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['section80D', filingId]);
      resetForm();
      setShowAddForm(false);
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: ({ deductionId, data }) => section80DService.updateDeduction(deductionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['section80D', filingId]);
      resetForm();
      setEditingDeduction(null);
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: (deductionId) => section80DService.deleteDeduction(deductionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['section80D', filingId]);
    },
  });

  const deductions = deductionsData?.data?.deductions || [];

  // Calculate limits by policy type
  const limitsByType = policyTypes.reduce((acc, type) => {
    acc[type.id] = {
      limit: type.limit,
      used: deductions
        .filter(d => d.policyType === type.id)
        .reduce((sum, d) => sum + d.premiumAmount, 0),
    };
    return acc;
  }, {});

  const totalAmount = deductions.reduce((sum, d) => sum + d.premiumAmount, 0);
  const maxPossibleLimit = 100000; // 25k + 25k + 50k for all categories

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = formValidators.section80D(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
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
      console.error('Error saving 80D deduction:', error);
    }
  };

  const handleEdit = (deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      policyType: deduction.policyType,
      policyName: deduction.policyName || '',
      policyNumber: deduction.policyNumber || '',
      insuranceCompany: deduction.insuranceCompany || '',
      companyPan: deduction.companyPan || '',
      premiumAmount: deduction.premiumAmount.toString(),
      premiumFrequency: deduction.premiumFrequency || 'annual',
      policyStartDate: deduction.policyStartDate || '',
      policyEndDate: deduction.policyEndDate || '',
      financialYear: deduction.financialYear || '2024-25',
    });
    setShowAddForm(true);
  };

  const handleDelete = (deductionId) => {
    if (window.confirm('Are you sure you want to delete this health insurance deduction?')) {
      deleteDeductionMutation.mutate(deductionId);
    }
  };

  const resetForm = () => {
    setFormData({
      policyType: '',
      policyName: '',
      policyNumber: '',
      insuranceCompany: '',
      companyPan: '',
      premiumAmount: '',
      premiumFrequency: 'annual',
      policyStartDate: '',
      policyEndDate: '',
      financialYear: '2024-25',
    });
    setFormErrors({});
    setEditingDeduction(null);
  };

  const getPolicyTypeInfo = (type) => {
    return policyTypes.find(p => p.id === type) || { name: type, icon: Shield, color: 'neutral', limit: 0 };
  };

  return (
    <div className="bg-burnblack-50 min-h-screen p-4 lg:p-6">
      {/* Header with BurnBlack Gradient */}
      <div className="bg-gradient-burnblack-emerald rounded-2xl p-6 mb-6 shadow-emerald-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Section 80D Deductions</h1>
              <p className="text-emerald-100">Health Insurance Premiums</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Policy</span>
          </button>
        </div>

        {/* Total Usage */}
        <div className="bg-burnblack-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-emerald-100 font-medium">Total Premium</span>
            <span className="text-white font-bold">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="text-sm text-emerald-200">
            Maximum possible deduction: ₹{maxPossibleLimit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Policy Type Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {policyTypes.map((type) => {
          const limits = limitsByType[type.id];
          const utilizationPercentage = Math.round((limits.used / limits.limit) * 100);
          const IconComponent = type.icon;

          return (
            <div
              key={type.id}
              className="bg-white rounded-2xl p-4 shadow-soft border border-neutral-200"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 bg-${type.color}-100 rounded-lg`}>
                  <IconComponent className={`h-5 w-5 text-${type.color}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-burnblack-800 text-sm">{type.name}</h3>
                  <p className="text-xs text-neutral-600">Limit: ₹{type.limit.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Used</span>
                  <span className="font-medium">₹{limits.used.toLocaleString()}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-lg h-2">
                  <div
                    className={`bg-${type.color}-500 h-2 rounded-lg transition-all duration-500`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-600 text-center">
                  {utilizationPercentage}% utilized
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deductions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {deductions.map((deduction) => {
          const typeInfo = getPolicyTypeInfo(deduction.policyType);
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
                    className="p-2 text-royal-600 hover:bg-royal-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.id)}
                    className="p-2 text-crimson-600 hover:bg-crimson-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-burnblack-800 text-lg">
                    {typeInfo.name}
                  </h3>
                  <p className="text-neutral-600 text-sm">{typeInfo.description}</p>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-emerald-600">
                    ₹{deduction.premiumAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-neutral-600">Annual Premium</div>
                </div>

                {deduction.policyName && (
                  <div>
                    <div className="text-sm text-neutral-600">Policy Name</div>
                    <div className="font-medium text-burnblack-700">{deduction.policyName}</div>
                  </div>
                )}

                {deduction.insuranceCompany && (
                  <div>
                    <div className="text-sm text-neutral-600">Insurance Company</div>
                    <div className="font-medium text-burnblack-700">{deduction.insuranceCompany}</div>
                  </div>
                )}

                {deduction.policyNumber && (
                  <div>
                    <div className="text-sm text-neutral-600">Policy Number</div>
                    <div className="font-mono text-sm text-burnblack-700">{deduction.policyNumber}</div>
                  </div>
                )}

                {deduction.isVerified ? (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sunset-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pending Verification</span>
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
          <h3 className="text-lg font-semibold text-burnblack-800 mb-4">Quick Add Health Insurance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {policyTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, policyType: type.id }));
                    setShowAddForm(true);
                  }}
                  className={`p-4 border-2 border-dashed border-${type.color}-300 bg-${type.color}-50 hover:bg-${type.color}-100 rounded-xl transition-all duration-200 text-left`}
                >
                  <IconComponent className={`h-6 w-6 text-${type.color}-600 mb-2`} />
                  <div className="font-medium text-burnblack-700 text-sm">{type.name}</div>
                  <div className={`text-xs text-${type.color}-600 mt-1`}>
                    Limit: ₹{type.limit.toLocaleString()}
                  </div>
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
              <h2 className="text-xl font-bold text-burnblack-800">
                {editingDeduction ? 'Edit' : 'Add'} Health Insurance Policy
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Policy Type */}
              <div>
                <label className="block text-sm font-medium text-burnblack-700 mb-2">
                  Policy Type *
                </label>
                <select
                  value={formData.policyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, policyType: e.target.value }))}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select policy type</option>
                  {policyTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} (Limit: ₹{type.limit.toLocaleString()})
                    </option>
                  ))}
                </select>
                {formErrors.policyType && (
                  <p className="text-crimson-600 text-sm mt-1">{formErrors.policyType}</p>
                )}
              </div>

              {/* Premium Amount */}
              <div>
                <label className="block text-sm font-medium text-burnblack-700 mb-2">
                  Premium Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500">₹</span>
                  </div>
                  <input
                    type="number"
                    value={formData.premiumAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, premiumAmount: e.target.value }))}
                    className="w-full pl-8 pr-3 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                    required
                  />
                </div>
                {formErrors.premiumAmount && (
                  <p className="text-crimson-600 text-sm mt-1">{formErrors.premiumAmount}</p>
                )}
                {formData.policyType && (
                  <p className="text-sm text-neutral-600 mt-1">
                    Limit for {getPolicyTypeInfo(formData.policyType).name}: ₹{getPolicyTypeInfo(formData.policyType).limit.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Policy Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    value={formData.policyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyName: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Star Health Red Carpet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Policy number"
                  />
                </div>
              </div>

              {/* Insurance Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    value={formData.insuranceCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Star Health, HDFC ERGO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Company PAN
                  </label>
                  <input
                    type="text"
                    value={formData.companyPan}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyPan: e.target.value.toUpperCase() }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="AAAAA0000A"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Policy Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Policy Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.policyStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyStartDate: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-burnblack-700 mb-2">
                    Policy End Date
                  </label>
                  <input
                    type="date"
                    value={formData.policyEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyEndDate: e.target.value }))}
                    className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Premium Frequency */}
              <div>
                <label className="block text-sm font-medium text-burnblack-700 mb-2">
                  Premium Frequency
                </label>
                <select
                  value={formData.premiumFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, premiumFrequency: e.target.value }))}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
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
                  className="flex-1 px-6 py-3 bg-gradient-burnblack-emerald text-white rounded-xl hover:shadow-emerald-glow transition-all duration-200 disabled:opacity-50"
                >
                  {addDeductionMutation.isLoading || updateDeductionMutation.isLoading
                    ? 'Saving...'
                    : editingDeduction
                      ? 'Update Policy'
                      : 'Add Policy'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Loading health insurance policies...</p>
        </div>
      )}
    </div>
  );
};

export default Section80D;
