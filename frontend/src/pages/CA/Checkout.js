// =====================================================
// CHECKOUT - CA FIRM SUBSCRIPTION CHECKOUT
// Secure checkout process for CA firm subscriptions
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, FadeInUp } from '../../components/DesignSystem/Animations';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Lock,
  FileText,
  Headphones,
  BarChart3,
  Settings,
  Code,
} from 'lucide-react';

const Checkout = () => {
  const [formData, setFormData] = useState({
    firmName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    gstNumber: '',
    panNumber: '',
    registrationNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const { plan, billingCycle } = location.state || {};

  useEffect(() => {
    if (!plan) {
      navigate('/ca/subscription-plans');
    }
  }, [plan, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firmName.trim()) {
      newErrors.firmName = 'Firm name is required';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.pincode.trim()) {
      newErrors['address.pincode'] = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.address.pincode)) {
      newErrors['address.pincode'] = 'Pincode must be 6 digits';
    }

    if (!formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'PAN number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create subscription order
      const orderResponse = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: billingCycle,
          amount: billingCycle === 'monthly' ? plan.monthlyPrice * 100 : plan.annualPrice * 100,
          currency: 'INR',
          firmDetails: formData,
          receipt: `subscription_${plan.id}_${Date.now()}`,
        }),
      });

      const orderData = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BurnBlack',
        description: `${plan.name} Subscription`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/subscriptions/verify-signature', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                billingCycle: billingCycle,
                firmDetails: formData,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              navigate('/ca/success', {
                state: {
                  type: 'subscription',
                  plan: plan,
                  billingCycle: billingCycle,
                  paymentId: response.razorpay_payment_id,
                },
              });
            } else {
              setErrors({ submit: 'Payment verification failed' });
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setErrors({ submit: 'Payment verification failed' });
          }
        },
        prefill: {
          name: formData.contactPerson,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#0b0b0b',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({ submit: 'Checkout failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  if (!plan) {
    return null;
  }

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/ca/subscription-plans')}
              className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <Typography.H1 className="mb-2">Complete Your Subscription</Typography.H1>
              <Typography.Body className="text-neutral-600">
                Enter your firm details to complete the subscription
              </Typography.Body>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  <span>Firm Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firmName" className="block text-sm font-medium text-neutral-700 mb-2">
                        Firm Name *
                      </label>
                      <input
                        type="text"
                        id="firmName"
                        name="firmName"
                        value={formData.firmName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.firmName ? 'border-error-300' : 'border-neutral-300'
                        }`}
                        placeholder="Enter firm name"
                      />
                      {errors.firmName && (
                        <Typography.Small className="text-error-600 mt-1">
                          {errors.firmName}
                        </Typography.Small>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contactPerson" className="block text-sm font-medium text-neutral-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.contactPerson ? 'border-error-300' : 'border-neutral-300'
                        }`}
                        placeholder="Enter contact person name"
                      />
                      {errors.contactPerson && (
                        <Typography.Small className="text-error-600 mt-1">
                          {errors.contactPerson}
                        </Typography.Small>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.email ? 'border-error-300' : 'border-neutral-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <Typography.Small className="text-error-600 mt-1">
                          {errors.email}
                        </Typography.Small>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.phone ? 'border-error-300' : 'border-neutral-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                      {errors.phone && (
                        <Typography.Small className="text-error-600 mt-1">
                          {errors.phone}
                        </Typography.Small>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-3">
                      Address *
                    </Typography.Small>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors['address.street'] ? 'border-error-300' : 'border-neutral-300'
                          }`}
                          placeholder="Street address"
                        />
                        {errors['address.street'] && (
                          <Typography.Small className="text-error-600 mt-1">
                            {errors['address.street']}
                          </Typography.Small>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors['address.city'] ? 'border-error-300' : 'border-neutral-300'
                            }`}
                            placeholder="City"
                          />
                          {errors['address.city'] && (
                            <Typography.Small className="text-error-600 mt-1">
                              {errors['address.city']}
                            </Typography.Small>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors['address.state'] ? 'border-error-300' : 'border-neutral-300'
                            }`}
                            placeholder="State"
                          />
                          {errors['address.state'] && (
                            <Typography.Small className="text-error-600 mt-1">
                              {errors['address.state']}
                            </Typography.Small>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            name="address.pincode"
                            value={formData.address.pincode}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors['address.pincode'] ? 'border-error-300' : 'border-neutral-300'
                            }`}
                            placeholder="Pincode"
                          />
                          {errors['address.pincode'] && (
                            <Typography.Small className="text-error-600 mt-1">
                              {errors['address.pincode']}
                            </Typography.Small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="panNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        id="panNumber"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.panNumber ? 'border-error-300' : 'border-neutral-300'
                        }`}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                      {errors.panNumber && (
                        <Typography.Small className="text-error-600 mt-1">
                          {errors.panNumber}
                        </Typography.Small>
                      )}
                    </div>

                    <div>
                      <label htmlFor="gstNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => navigate('/ca/subscription-plans')}
                      className="px-6 py-3 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Processing...' : 'Proceed to Payment'}</span>
                    </button>
                  </div>

                  {/* Error Message */}
                  {errors.submit && (
                    <div className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-error-600" />
                      <Typography.Small className="text-error-700">
                        {errors.submit}
                      </Typography.Small>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Plan Details */}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-2">
                      {plan.name}
                    </Typography.Small>
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-4 h-4 text-success-600">
                            {getFeatureIcon(feature)}
                          </div>
                          <Typography.Small className="text-neutral-600">
                            {feature}
                          </Typography.Small>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <Typography.Small className="text-neutral-500">
                          +{plan.features.length - 3} more features
                        </Typography.Small>
                      )}
                    </div>
                  </div>

                  {/* Billing */}
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Typography.Small className="text-neutral-600">
                        Billing Cycle
                      </Typography.Small>
                      <Typography.Small className="font-medium">
                        {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                      </Typography.Small>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Typography.Small className="text-neutral-600">
                        Client Limit
                      </Typography.Small>
                      <Typography.Small className="font-medium">
                        {plan.clientLimit} clients
                      </Typography.Small>
                    </div>
                    <div className="border-t border-neutral-200 pt-2">
                      <div className="flex items-center justify-between">
                        <Typography.Small className="font-medium text-neutral-700">
                          Total Amount
                        </Typography.Small>
                        <Typography.Small className="font-bold text-lg">
                          {formatCurrency(billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice)}
                        </Typography.Small>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start space-x-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <Shield className="w-4 h-4 text-primary-600 mt-0.5" />
                    <Typography.Small className="text-primary-700">
                      Your payment is processed securely through Razorpay. We do not store your payment information.
                    </Typography.Small>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Checkout;
