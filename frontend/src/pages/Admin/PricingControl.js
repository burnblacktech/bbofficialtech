// =====================================================
// PRICING CONTROL - ADMIN PANEL
// Dynamic pricing and monetization control for platform administrators
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  IndianRupee,
  Users,
  Building2,
  Settings,
  Save,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import adminService from '../../services/api/adminService';
import toast from 'react-hot-toast';

const PricingControl = () => {
  const [pricingData, setPricingData] = useState({
    endUserFilingFee: 0,
    expertReviewFee: 0,
    caSubscriptionPlans: [],
    pricingHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    clientLimit: '',
    monthlyPrice: '',
    annualPrice: '',
    features: [],
  });

  // Fetch pricing data from API
  useEffect(() => {
    const fetchPricingData = async () => {
      setLoading(true);
      try {
        // Get pricing plans
        const plansResponse = await adminService.getPricingPlans();
        const plans = plansResponse.plans || plansResponse.data || [];
        
        // Get settings for end user fees
        const settingsResponse = await adminService.getSettings();
        const defaultItrRates = settingsResponse.defaultItrRates || {};
        
        // Transform API response to match component expectations
        const transformedData = {
          endUserFilingFee: defaultItrRates.itr_1 || 2500,
          expertReviewFee: settingsResponse.expertReviewFee || 500,
          caSubscriptionPlans: plans.map(plan => ({
            id: plan.id,
            name: plan.name || plan.planName,
            clientLimit: plan.clientLimit || plan.maxClients || 0,
            monthlyPrice: plan.monthlyPrice || plan.price || 0,
            annualPrice: plan.annualPrice || (plan.price * 10) || 0,
            features: plan.features || plan.featureList || [],
            activeSubscribers: plan.activeSubscribers || plan.subscriberCount || 0,
            revenue: plan.revenue || 0,
          })),
          pricingHistory: [], // Would need separate endpoint for history
        };

        setPricingData(transformedData);
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
        toast.error('Failed to load pricing data. Please try again.');
        // Set default data on error
        setPricingData({
          endUserFilingFee: 2500,
          expertReviewFee: 500,
          caSubscriptionPlans: [],
          pricingHistory: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveEndUserFee = (newFee) => {
    setPricingData(prev => ({
      ...prev,
      endUserFilingFee: newFee,
    }));
    // API call to save pricing
    console.log('Saving end user filing fee:', newFee);
  };

  const handleSaveExpertReviewFee = (newFee) => {
    setPricingData(prev => ({
      ...prev,
      expertReviewFee: newFee,
    }));
    // API call to save pricing
    console.log('Saving expert review fee:', newFee);
  };

  const handleSavePlan = (plan) => {
    setPricingData(prev => ({
      ...prev,
      caSubscriptionPlans: prev.caSubscriptionPlans.map(p =>
        p.id === plan.id ? plan : p,
      ),
    }));
    setEditingPlan(null);
    // API call to save plan
    console.log('Saving plan:', plan);
  };

  const handleAddPlan = () => {
    const plan = {
      id: Date.now(),
      ...newPlan,
      clientLimit: parseInt(newPlan.clientLimit),
      monthlyPrice: parseInt(newPlan.monthlyPrice),
      annualPrice: parseInt(newPlan.annualPrice),
      activeSubscribers: 0,
      revenue: 0,
    };

    setPricingData(prev => ({
      ...prev,
      caSubscriptionPlans: [...prev.caSubscriptionPlans, plan],
    }));

    setNewPlan({
      name: '',
      clientLimit: '',
      monthlyPrice: '',
      annualPrice: '',
      features: [],
    });
    setShowAddPlan(false);
    // API call to add plan
    console.log('Adding plan:', plan);
  };

  const handleDeletePlan = (planId) => {
    setPricingData(prev => ({
      ...prev,
      caSubscriptionPlans: prev.caSubscriptionPlans.filter(p => p.id !== planId),
    }));
    // API call to delete plan
    console.log('Deleting plan:', planId);
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Pricing Control...</Typography.H1>
            <Typography.Body>Please wait while we load pricing data.</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography.H1 className="mb-2">Pricing Control</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage platform pricing and subscription plans
            </Typography.Body>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              Export Pricing Report
            </button>
          </div>
        </div>

        {/* End User Pricing */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span>End User Pricing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Typography.Small className="font-medium text-neutral-700 mb-2">
                  ITR Filing Fee
                </Typography.Small>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={pricingData.endUserFilingFee}
                    onChange={(e) => handleSaveEndUserFee(parseInt(e.target.value))}
                    className="w-32 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Typography.Small className="text-neutral-600">
                    INR per filing
                  </Typography.Small>
                </div>
                <Typography.Small className="text-neutral-500 mt-1">
                  This is the fee charged to end users for ITR filing
                </Typography.Small>
              </div>

              <div>
                <Typography.Small className="font-medium text-neutral-700 mb-2">
                  Expert Review Fee
                </Typography.Small>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={pricingData.expertReviewFee}
                    onChange={(e) => handleSaveExpertReviewFee(parseInt(e.target.value))}
                    className="w-32 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Typography.Small className="text-neutral-600">
                    INR per review
                  </Typography.Small>
                </div>
                <Typography.Small className="text-neutral-500 mt-1">
                  Additional fee for expert review service
                </Typography.Small>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CA Subscription Plans */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>CA Subscription Plans</span>
              </CardTitle>
              <button
                onClick={() => setShowAddPlan(true)}
                className="px-4 py-2 bg-secondary-500 text-white rounded-lg text-sm font-medium hover:bg-secondary-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Plan</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pricingData.caSubscriptionPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-neutral-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Typography.H4 className="mb-2">{plan.name}</Typography.H4>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <span>Up to {plan.clientLimit} clients</span>
                        <span>•</span>
                        <span>{plan.activeSubscribers} active subscribers</span>
                        <span>•</span>
                        <span>{formatCurrency(plan.revenue)} revenue</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
                        title="Edit Plan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-neutral-500 hover:text-error-600 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-3">
                        Pricing
                      </Typography.Small>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Typography.Small className="text-neutral-600">Monthly</Typography.Small>
                          <Typography.Small className="font-medium">
                            {formatCurrency(plan.monthlyPrice)}
                          </Typography.Small>
                        </div>
                        <div className="flex items-center justify-between">
                          <Typography.Small className="text-neutral-600">Annual</Typography.Small>
                          <Typography.Small className="font-medium">
                            {formatCurrency(plan.annualPrice)}
                          </Typography.Small>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-3">
                        Features
                      </Typography.Small>
                      <ul className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success-600" />
                            <Typography.Small className="text-neutral-600">
                              {feature}
                            </Typography.Small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span>Pricing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pricingData.pricingHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <Typography.Small className="font-medium text-neutral-700">
                      {entry.date.toLocaleDateString()}
                    </Typography.Small>
                    <Typography.Small className="text-neutral-500">
                      Pricing update
                    </Typography.Small>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <Typography.Small className="text-neutral-500">ITR Filing Fee</Typography.Small>
                      <Typography.Small className="font-medium">
                        {formatCurrency(entry.endUserFee)}
                      </Typography.Small>
                    </div>
                    <div className="text-center">
                      <Typography.Small className="text-neutral-500">Expert Review Fee</Typography.Small>
                      <Typography.Small className="font-medium">
                        {formatCurrency(entry.expertReviewFee)}
                      </Typography.Small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Plan Modal */}
        {showAddPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowAddPlan(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Typography.H3>Add New Subscription Plan</Typography.H3>
                  <button
                    onClick={() => setShowAddPlan(false)}
                    className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-2">
                      Plan Name
                    </Typography.Small>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter plan name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-2">
                        Client Limit
                      </Typography.Small>
                      <input
                        type="number"
                        value={newPlan.clientLimit}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, clientLimit: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-2">
                        Monthly Price (INR)
                      </Typography.Small>
                      <input
                        type="number"
                        value={newPlan.monthlyPrice}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-2">
                        Annual Price (INR)
                      </Typography.Small>
                      <input
                        type="number"
                        value={newPlan.annualPrice}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, annualPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-2">
                      Features
                    </Typography.Small>
                    <textarea
                      value={newPlan.features.join('\n')}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, features: e.target.value.split('\n').filter(f => f.trim()) }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter features, one per line"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    onClick={() => setShowAddPlan(false)}
                    className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPlan}
                    className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Add Plan</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default PricingControl;
