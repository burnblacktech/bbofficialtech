// =====================================================
// SUBSCRIPTION PLANS - CA FIRM PLAN SELECTION
// Dynamic subscription plan selection for CA firms
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  Building2,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Crown,
  TrendingUp,
  Headphones,
  FileText,
  BarChart3,
  Settings,
  Code,
} from 'lucide-react';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  // Fetch subscription plans from admin panel
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);

      try {
        // Mock API call to get subscription plans
        const response = await fetch('/api/subscriptions/plans');
        const plansData = await response.json();

        setPlans(plansData);
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to mock data
        setPlans([
          {
            id: 1,
            name: 'Basic Plan',
            clientLimit: 50,
            monthlyPrice: 5000,
            annualPrice: 50000,
            features: [
              'Up to 50 clients',
              'Basic ITR filing support',
              'Email support',
              'Standard templates',
              'Basic analytics',
            ],
            popular: false,
            recommended: false,
          },
          {
            id: 2,
            name: 'Pro Plan',
            clientLimit: 200,
            monthlyPrice: 15000,
            annualPrice: 150000,
            features: [
              'Up to 200 clients',
              'Advanced ITR filing support',
              'Priority support',
              'Custom templates',
              'Bulk operations',
              'Advanced analytics',
              'Team collaboration',
            ],
            popular: true,
            recommended: false,
          },
          {
            id: 3,
            name: 'Enterprise Plan',
            clientLimit: 1000,
            monthlyPrice: 50000,
            annualPrice: 500000,
            features: [
              'Unlimited clients',
              'Full platform access',
              'Dedicated support',
              'Custom integrations',
              'White-label options',
              'Advanced analytics',
              'API access',
              'Custom workflows',
            ],
            popular: false,
            recommended: true,
          },
        ]);
      }

      setLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleProceedToCheckout = () => {
    if (selectedPlan) {
      navigate('/ca/checkout', {
        state: {
          plan: selectedPlan,
          billingCycle: billingCycle,
        },
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic plan':
        return <Users className="w-6 h-6" />;
      case 'pro plan':
        return <Zap className="w-6 h-6" />;
      case 'enterprise plan':
        return <Crown className="w-6 h-6" />;
      default:
        return <Building2 className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic plan':
        return 'text-primary-600 bg-primary-100';
      case 'pro plan':
        return 'text-secondary-600 bg-secondary-100';
      case 'enterprise plan':
        return 'text-warning-600 bg-warning-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('clients')) return <Users className="w-4 h-4" />;
    if (feature.includes('support')) return <Headphones className="w-4 h-4" />;
    if (feature.includes('analytics')) return <BarChart3 className="w-4 h-4" />;
    if (feature.includes('templates')) return <FileText className="w-4 h-4" />;
    if (feature.includes('API')) return <Code className="w-4 h-4" />;
    if (feature.includes('integrations')) return <Settings className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography.H1 className="mb-4">Loading Plans...</Typography.H1>
            <Typography.Body>Please wait while we load subscription plans.</Typography.Body>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Typography.H1 className="mb-4">Choose Your Subscription Plan</Typography.H1>
          <Typography.Body className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Select the perfect plan for your CA firm. All plans include secure ITR filing,
            client management, and dedicated support.
          </Typography.Body>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-xl p-1 border border-neutral-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Annual
              <span className="ml-1 px-2 py-0.5 bg-success-100 text-success-600 text-body-small rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <StaggerItem key={plan.id}>
              <motion.div
                whileHover={{ y: -5 }}
                className={`relative bg-white rounded-xl shadow-elevation-3 border-2 transition-all duration-200 ${
                  selectedPlan?.id === plan.id
                    ? 'border-primary-500 shadow-primary-200'
                    : plan.popular
                    ? 'border-secondary-500 shadow-secondary-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-secondary-500 text-white px-4 py-1 rounded-full text-body-regular font-medium flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-warning-500 text-white px-4 py-1 rounded-full text-body-regular font-medium flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Recommended</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 ${getPlanColor(plan.name)} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      {getPlanIcon(plan.name)}
                    </div>
                    <Typography.H3 className="mb-2">{plan.name}</Typography.H3>
                    <Typography.Small className="text-neutral-600">
                      Up to {plan.clientLimit} clients
                    </Typography.Small>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center space-x-1">
                      <Typography.H2 className="text-heading-1 font-bold">
                        {formatCurrency(billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice)}
                      </Typography.H2>
                      <Typography.Small className="text-neutral-600">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </Typography.Small>
                    </div>
                    {billingCycle === 'annual' && (
                      <Typography.Small className="text-success-600 font-medium">
                        Save {formatCurrency(plan.monthlyPrice * 12 - plan.annualPrice)} per year
                      </Typography.Small>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-success-600">
                          {getFeatureIcon(feature)}
                        </div>
                        <Typography.Small className="text-neutral-700">
                          {feature}
                        </Typography.Small>
                      </div>
                    ))}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'bg-primary-500 text-white'
                        : plan.popular
                        ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <FadeInUp>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span>Selected Plan: {selectedPlan.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography.Small className="text-neutral-600 mb-1">
                      Billing Cycle: {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                    </Typography.Small>
                    <Typography.H4>
                      {formatCurrency(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice)}
                      <span className="text-body-regular font-normal text-neutral-600">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </Typography.H4>
                  </div>
                  <div className="text-right">
                    <Typography.Small className="text-neutral-600 mb-1">
                      Client Limit
                    </Typography.Small>
                    <Typography.H4 className="text-primary-600">
                      {selectedPlan.clientLimit} clients
                    </Typography.H4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {/* Security Notice */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <Typography.Small className="font-medium text-neutral-700 mb-1">
                  Secure Subscription
                </Typography.Small>
                <Typography.Small className="text-neutral-600">
                  Your subscription is processed securely. You can cancel or change your plan at any time.
                  All plans include a 30-day money-back guarantee.
                </Typography.Small>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proceed Button */}
        <div className="text-center">
          <button
            onClick={handleProceedToCheckout}
            disabled={!selectedPlan}
            className="px-8 py-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default SubscriptionPlans;
