// =====================================================
// PAYMENT MODAL - END USER PAYMENT FLOW
// Secure payment interface for ITR filing and expert review services
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Typography } from '../DesignSystem/DesignSystem';
import { ModalTransition, FadeInUp } from '../DesignSystem/Animations';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  FileText,
  UserCheck,
  Clock,
} from 'lucide-react';

const PaymentModal = ({
  isOpen,
  onClose,
  filingData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    expertReview: false,
    expertReviewAmount: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentBypassed, setPaymentBypassed] = useState(false);

  // Fetch pricing from admin panel
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // Mock API call to get pricing
        const response = await fetch('/api/admin/pricing');
        const pricing = await response.json();

        setPaymentData(prev => ({
          ...prev,
          amount: pricing.endUserFilingFee,
          expertReviewAmount: pricing.expertReviewFee,
          totalAmount: pricing.endUserFilingFee,
        }));
      } catch (error) {
        console.error('Error fetching pricing:', error);
      }
    };

    if (isOpen) {
      fetchPricing();
    }
  }, [isOpen]);

  const handleExpertReviewChange = (checked) => {
    setPaymentData(prev => ({
      ...prev,
      expertReview: checked,
      totalAmount: prev.amount + (checked ? prev.expertReviewAmount : 0),
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleProceedToPayment = () => {
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    // Prevent duplicate payment attempts
    if (loading) {
      return;
    }
    setLoading(true);

    try {
      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          amount: paymentData.totalAmount * 100, // Convert to paise
          currency: 'INR',
          receipt: `filing_${filingData.id}_${Date.now()}`,
          notes: {
            filingId: filingData.id,
            expertReview: paymentData.expertReview,
            service: 'ITR Filing',
          },
        }),
      });

      const orderData = await orderResponse.json();

      // Check if payment is bypassed (development mode)
      if (orderData.bypassed) {
        // Bypass mode: Skip Razorpay and directly verify payment
        try {
          const verifyResponse = await fetch('/api/payments/verify-signature', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              razorpay_order_id: orderData.order.id,
              razorpay_payment_id: `bypass_${Date.now()}`,
              razorpay_signature: 'bypassed',
              filingId: filingData.id,
              expertReview: paymentData.expertReview,
              amount: paymentData.totalAmount,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            onPaymentSuccess({
              paymentId: `bypass_${Date.now()}`,
              orderId: orderData.order.id,
              amount: paymentData.totalAmount,
              expertReview: paymentData.expertReview,
              filingId: filingData.id,
              bypassed: true,
            });
          } else {
            onPaymentError('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          onPaymentError('Payment verification failed');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Check if Razorpay key is available
      if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
        // No Razorpay key - show error or allow bypass
        onPaymentError('Payment gateway not configured. Please contact support.');
        setLoading(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'BurnBlack',
        description: 'ITR Filing Service',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                filingId: filingData.id,
                expertReview: paymentData.expertReview,
                amount: paymentData.totalAmount,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onPaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: paymentData.totalAmount,
                expertReview: paymentData.expertReview,
                filingId: filingData.id,
              });
            } else {
              onPaymentError('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onPaymentError('Payment verification failed');
          }
        },
        prefill: {
          name: filingData.userName,
          email: filingData.userEmail,
          contact: filingData.userPhone,
        },
        theme: {
          color: '#0b0b0b',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            // Handle payment cancellation
            if (onPaymentError) {
              onPaymentError('Payment was cancelled');
            }
          },
        },
      };

      // Check if Razorpay SDK is available
      if (!window.Razorpay) {
        onPaymentError('Payment gateway SDK not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Set payment timeout (5 minutes)
      const paymentTimeout = setTimeout(() => {
        setLoading(false);
        onPaymentError('Payment timeout. Please try again.');
      }, 5 * 60 * 1000); // 5 minutes

      // Wrap handler to clear timeout
      const originalHandler = options.handler;
      options.handler = async (response) => {
        clearTimeout(paymentTimeout);
        await originalHandler(response);
      };
      
      // Wrap modal dismiss to clear timeout
      const originalOndismiss = options.modal.ondismiss;
      options.modal.ondismiss = () => {
        clearTimeout(paymentTimeout);
        if (originalOndismiss) originalOndismiss();
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment initialization failed';
      onPaymentError(errorMessage);
    } finally {
      // Loading state managed by modal dismiss handler for Razorpay flow
      // Only set to false if we're not opening Razorpay modal
      if (!orderData?.order?.id || orderData.bypassed) {
        // Already handled above
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ModalTransition isOpen={isOpen} className="z-50">
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <Typography.H3>Final Step: Secure Payment</Typography.H3>
                  <Typography.Small className="text-neutral-600">
                    Complete your ITR filing with secure payment
                  </Typography.Small>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showPaymentForm ? (
              <div className="space-y-6">
                {/* Service Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span>Service Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Typography.Small className="text-neutral-600">
                          ITR Filing for Assessment Year {filingData.assessmentYear}
                        </Typography.Small>
                        <Typography.Small className="font-medium">
                          {formatCurrency(paymentData.amount)}
                        </Typography.Small>
                      </div>
                      <div className="flex items-center justify-between">
                        <Typography.Small className="text-neutral-600">
                          PAN: {filingData.pan}
                        </Typography.Small>
                        <Typography.Small className="text-neutral-600">
                          Filing ID: {filingData.id}
                        </Typography.Small>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expert Review Option */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-secondary-600" />
                      <span>Expert Review (Optional)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="expertReview"
                          checked={paymentData.expertReview}
                          onChange={(e) => handleExpertReviewChange(e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <label htmlFor="expertReview" className="text-sm font-medium text-neutral-700 cursor-pointer">
                            Add Expert Review Service
                          </label>
                          <Typography.Small className="text-neutral-600 mt-1">
                            Get your ITR filing reviewed by our tax experts before submission.
                            Includes detailed feedback and optimization suggestions.
                          </Typography.Small>
                          <div className="mt-2 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-neutral-500" />
                            <Typography.Small className="text-neutral-500">
                              Review completed within 24 hours
                            </Typography.Small>
                          </div>
                        </div>
                        <div className="text-right">
                          <Typography.Small className="font-medium">
                            {formatCurrency(paymentData.expertReviewAmount)}
                          </Typography.Small>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Typography.Small className="text-neutral-600">
                          ITR Filing Service
                        </Typography.Small>
                        <Typography.Small className="font-medium">
                          {formatCurrency(paymentData.amount)}
                        </Typography.Small>
                      </div>
                      {paymentData.expertReview && (
                        <div className="flex items-center justify-between">
                          <Typography.Small className="text-neutral-600">
                            Expert Review Service
                          </Typography.Small>
                          <Typography.Small className="font-medium">
                            {formatCurrency(paymentData.expertReviewAmount)}
                          </Typography.Small>
                        </div>
                      )}
                      <div className="border-t border-neutral-200 pt-3">
                        <div className="flex items-center justify-between">
                          <Typography.Small className="font-medium text-neutral-700">
                            Total Amount
                          </Typography.Small>
                          <Typography.Small className="font-bold text-lg">
                            {formatCurrency(paymentData.totalAmount)}
                          </Typography.Small>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Notice */}
                <div className="flex items-start space-x-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <Typography.Small className="font-medium text-primary-700 mb-1">
                      Secure Payment
                    </Typography.Small>
                    <Typography.Small className="text-primary-600">
                      Your payment is processed securely through Razorpay. We do not store your payment information.
                    </Typography.Small>
                  </div>
                </div>

                {/* Proceed Button */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="razorpay"
                          name="paymentMethod"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={(e) => handlePaymentMethodChange(e.target.value)}
                          className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                        />
                        <label htmlFor="razorpay" className="flex items-center space-x-2 cursor-pointer">
                          <CreditCard className="w-4 h-4 text-primary-600" />
                          <Typography.Small className="font-medium">
                            Razorpay (UPI, Cards, Net Banking)
                          </Typography.Small>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Typography.Small className="text-neutral-600">
                          ITR Filing Service
                        </Typography.Small>
                        <Typography.Small className="font-medium">
                          {formatCurrency(paymentData.amount)}
                        </Typography.Small>
                      </div>
                      {paymentData.expertReview && (
                        <div className="flex items-center justify-between">
                          <Typography.Small className="text-neutral-600">
                            Expert Review Service
                          </Typography.Small>
                          <Typography.Small className="font-medium">
                            {formatCurrency(paymentData.expertReviewAmount)}
                          </Typography.Small>
                        </div>
                      )}
                      <div className="border-t border-neutral-200 pt-3">
                        <div className="flex items-center justify-between">
                          <Typography.Small className="font-medium text-neutral-700">
                            Total Amount
                          </Typography.Small>
                          <Typography.Small className="font-bold text-lg">
                            {formatCurrency(paymentData.totalAmount)}
                          </Typography.Small>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Button */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="px-6 py-3 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Processing...' : 'Pay Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </ModalTransition>
  );
};

export default PaymentModal;
