// =====================================================
// TAX PAYMENT MODAL COMPONENT
// Modal for initiating tax payments (Razorpay and ITD)
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, ExternalLink, Loader, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useCreatePaymentOrder, useInitiateITDPayment, useVerifyPayment, useTaxPayment } from '../hooks/use-tax-payment';
import taxPaymentService from '../services/tax-payment.service';
import toast from 'react-hot-toast';

const TaxPaymentModal = ({
  isOpen,
  onClose,
  filingId,
  paymentId,
  challanNumber,
  amount,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [paymentStatus, setPaymentStatus] = useState(null);

  const createPaymentOrder = useCreatePaymentOrder();
  const initiateITDPayment = useInitiateITDPayment();
  const verifyPayment = useVerifyPayment();
  const { data: paymentData, isLoading: isLoadingPayment } = useTaxPayment(paymentId);

  useEffect(() => {
    if (paymentData) {
      setPaymentStatus(paymentData.paymentStatus);
    }
  }, [paymentData]);

  const handleRazorpayPayment = async () => {
    try {
      const result = await createPaymentOrder.mutateAsync({
        filingId,
        paymentId,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create payment order');
        return;
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: result.amount,
        currency: result.currency || 'INR',
        name: 'BurnBlack',
        description: `Tax Payment - Challan ${challanNumber}`,
        orderId: result.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResult = await verifyPayment.mutateAsync({
              paymentId,
              razorpayOrderId: response.razorpay_order_id || response.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || response.razorpayPaymentId,
              razorpaySignature: response.razorpay_signature || response.razorpaySignature,
            });

            if (verifyResult.success) {
              setPaymentStatus('completed');
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  paymentId,
                  status: 'completed',
                  razorpayPaymentId: response.razorpay_payment_id,
                });
              }
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus('failed');
          }
        },
        theme: {
          color: '#D4AF37', // Gold theme (brand primary)
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Failed to initiate Razorpay payment:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const handleITDPayment = async () => {
    try {
      const result = await initiateITDPayment.mutateAsync({
        filingId,
        paymentId,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to initiate ITD payment');
        return;
      }

      // Open ITD payment gateway in new window
      const paymentWindow = window.open(result.paymentUrl, '_blank', 'width=800,height=600');

      // Monitor payment window (poll for payment status)
      const checkPaymentStatus = setInterval(async () => {
        try {
          const statusResult = await taxPaymentService.getPaymentStatus(paymentId);
          if (statusResult.success && statusResult.payment) {
            const status = statusResult.payment.paymentStatus;
            if (status === 'completed' || status === 'verified') {
              clearInterval(checkPaymentStatus);
              setPaymentStatus('completed');
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  paymentId,
                  status: 'completed',
                });
              }
              paymentWindow?.close();
            } else if (status === 'failed') {
              clearInterval(checkPaymentStatus);
              setPaymentStatus('failed');
              paymentWindow?.close();
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000); // Check every 3 seconds

      // Clear interval after 5 minutes
      setTimeout(() => {
        clearInterval(checkPaymentStatus);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to initiate ITD payment:', error);
      toast.error('Failed to initiate ITD payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-elevation-4 max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg text-slate-900">Pay Tax</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-slate-600">Challan Number:</span>
              <span className="text-body-sm font-medium text-slate-900">{challanNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-slate-600">Amount:</span>
              <span className="text-heading-md font-bold text-slate-900">{formatCurrency(amount)}</span>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-body-sm text-green-900">Payment completed successfully!</p>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-error-600 mr-2" />
                <p className="text-body-sm text-error-900">Payment failed. Please try again.</p>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {!paymentStatus || paymentStatus === 'pending' || paymentStatus === 'processing' ? (
            <>
              <div className="mb-6">
                <label className="block text-body-sm font-medium text-slate-700 mb-3">
                  Select Payment Method
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedMethod('razorpay')}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      selectedMethod === 'razorpay'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-gold-600" />
                      <div>
                        <div className="text-body-md font-medium text-slate-900">Razorpay</div>
                        <div className="text-body-xs text-slate-600">Net Banking, UPI, Cards, Wallets</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedMethod('itd_direct')}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      selectedMethod === 'itd_direct'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <div className="text-body-md font-medium text-slate-900">ITD Direct Gateway</div>
                        <div className="text-body-xs text-slate-600">Pay directly on Income Tax Portal</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-body-sm text-info-900 mb-1">
                      {selectedMethod === 'razorpay'
                        ? 'Seamless Payment'
                        : 'Direct Payment'}
                    </p>
                    <p className="text-body-xs text-info-700">
                      {selectedMethod === 'razorpay'
                        ? 'Pay securely using Razorpay. Your payment will be processed instantly.'
                        : 'You will be redirected to the Income Tax Department payment gateway. Complete payment there and return.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-xl text-body-regular font-medium text-slate-700 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedMethod === 'razorpay' ? handleRazorpayPayment : handleITDPayment}
                  disabled={createPaymentOrder.isPending || initiateITDPayment.isPending}
                  className="flex-1 py-2 px-4 bg-gold-500 text-white rounded-xl text-body-regular font-medium hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center"
                >
                  {createPaymentOrder.isPending || initiateITDPayment.isPending ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedMethod === 'razorpay' ? (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pay via ITD
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="py-2 px-4 bg-gold-500 text-white rounded-xl text-body-regular font-medium hover:bg-gold-600"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxPaymentModal;

