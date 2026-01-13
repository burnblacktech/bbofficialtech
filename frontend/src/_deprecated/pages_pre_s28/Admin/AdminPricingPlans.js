// =====================================================
// ADMIN PRICING PLANS MANAGEMENT PAGE
// Manages pricing plans for ITR filing services
// =====================================================

import { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import Badge from '../../components/DesignSystem/components/Badge';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const AdminPricingPlans = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    features: [],
    itrTypesAllowed: [],
    validityPeriod: 365,
    userTypeRestrictions: [],
  });
  const [newFeature, setNewFeature] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPricingPlans();
  }, [pagination.offset, activeFilter]);

  const loadPricingPlans = async () => {
    setLoading(true);
    try {
      const params = {
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        limit: pagination.limit,
        offset: pagination.offset,
      };
      const data = await adminService.getPricingPlans(params);
      setPlans(data.plans || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setProcessing(true);
    try {
      await adminService.createPricingPlan(formData);
      toast.success('Pricing plan created successfully');
      setShowCreateModal(false);
      resetForm();
      loadPricingPlans();
    } catch (error) {
      console.error('Failed to create pricing plan:', error);
      toast.error('Failed to create pricing plan');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    setProcessing(true);
    try {
      await adminService.updatePricingPlan(selectedPlan.id, formData);
      toast.success('Pricing plan updated successfully');
      setShowEditModal(false);
      setSelectedPlan(null);
      resetForm();
      loadPricingPlans();
    } catch (error) {
      console.error('Failed to update pricing plan:', error);
      toast.error('Failed to update pricing plan');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (planId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) {
      return;
    }

    setProcessing(planId);
    try {
      await adminService.deletePricingPlan(planId);
      toast.success('Pricing plan deleted successfully');
      loadPricingPlans();
    } catch (error) {
      console.error('Failed to delete pricing plan:', error);
      toast.error('Failed to delete pricing plan');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (plan) => {
    setProcessing(plan.id);
    try {
      await adminService.updatePricingPlan(plan.id, {
        isActive: !plan.isActive,
      });
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully`);
      loadPricingPlans();
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
      toast.error('Failed to update plan status');
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      currency: plan.currency || 'INR',
      features: plan.features || [],
      itrTypesAllowed: plan.itrTypesAllowed || [],
      validityPeriod: plan.validityPeriod || 365,
      userTypeRestrictions: plan.userTypeRestrictions || [],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'INR',
      features: [],
      itrTypesAllowed: [],
      validityPeriod: 365,
      userTypeRestrictions: [],
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const filteredPlans = plans.filter((plan) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        plan.name?.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const itrTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
  const userTypes = ['individual', 'ca', 'enterprise'];

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Pricing Plans Management</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Create and manage pricing plans for ITR filing services
            </Typography.Body>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Plans</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <Button variant="outline" onClick={loadPricingPlans}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-neutral-400" />
              </div>
              <Typography.H3 className="mb-2">No pricing plans found</Typography.H3>
              <Typography.Body className="text-neutral-600">
                Create your first pricing plan to get started.
              </Typography.Body>
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <StaggerItem key={plan.id}>
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <Badge variant={plan.isActive ? 'success' : 'secondary'} className="mt-2">
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(plan)}
                        disabled={processing === plan.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        disabled={processing === plan.id}
                        className="text-error-600 hover:text-error-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <Typography.H2 className="text-neutral-900">
                        ₹{parseFloat(plan.price || 0).toLocaleString('en-IN')}
                      </Typography.H2>
                      <Typography.Small className="text-neutral-500">
                        {plan.validityPeriod} days validity
                      </Typography.Small>
                    </div>
                    {plan.description && (
                      <Typography.Body className="text-neutral-600 mb-4">{plan.description}</Typography.Body>
                    )}
                    <div className="space-y-3 flex-1">
                      {plan.features && plan.features.length > 0 && (
                        <div>
                          <Typography.Small className="font-semibold text-neutral-700 mb-1 block">Features:</Typography.Small>
                          <ul className="text-body-regular text-neutral-600 space-y-1">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx}>• {feature}</li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-neutral-500">+ {plan.features.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {plan.itrTypesAllowed && plan.itrTypesAllowed.length > 0 && (
                        <div>
                          <Typography.Small className="font-semibold text-neutral-700 mb-1 block">ITR Types:</Typography.Small>
                          <div className="flex flex-wrap gap-1">
                            {plan.itrTypesAllowed.map((type, idx) => (
                              <Badge key={idx} variant="info" size="sm">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <Button
                        variant={plan.isActive ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(plan)}
                        disabled={processing === plan.id}
                        className="w-full"
                      >
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{showCreateModal ? 'Create Pricing Plan' : 'Edit Pricing Plan'}</CardTitle>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedPlan(null);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Plan Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Basic Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Price (INR) <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Plan description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Validity Period (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.validityPeriod}
                      onChange={(e) => setFormData({ ...formData, validityPeriod: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    Features
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="Add feature..."
                    />
                    <Button variant="outline" onClick={addFeature}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, idx) => (
                      <Badge key={idx} variant="info">
                        {feature}
                        <button
                          onClick={() => removeFeature(idx)}
                          className="ml-2 text-neutral-600 hover:text-neutral-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    ITR Types Allowed
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {itrTypes.map((type) => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.itrTypesAllowed.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                itrTypesAllowed: [...formData.itrTypesAllowed, type],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                itrTypesAllowed: formData.itrTypesAllowed.filter(t => t !== type),
                              });
                            }
                          }}
                          className="mr-2 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-body-regular text-neutral-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-body-regular font-medium text-neutral-700 mb-2">
                    User Type Restrictions
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {userTypes.map((type) => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.userTypeRestrictions.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                userTypeRestrictions: [...formData.userTypeRestrictions, type],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                userTypeRestrictions: formData.userTypeRestrictions.filter(t => t !== type),
                              });
                            }
                          }}
                          className="mr-2 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-body-regular text-neutral-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                      setSelectedPlan(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    disabled={!formData.name || !formData.price || processing}
                  >
                    {processing ? 'Saving...' : showCreateModal ? 'Create Plan' : 'Update Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminPricingPlans;
