// =====================================================
// CHALLAN GENERATOR COMPONENT
// Generate tax payment challan (ITNS 280)
// =====================================================

import React, { useState } from 'react';
import { FileText, Download, CreditCard, Info, ExternalLink } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useTaxesPaid } from '../hooks/use-taxes-paid';
import taxPaymentService from '../services/tax-payment.service';
import { useCreatePaymentOrder, useInitiateITDPayment } from '../hooks/use-tax-payment';
import toast from 'react-hot-toast';

const ChallanGenerator = ({ filingId, taxPayable, onChallanGenerated, onPaymentInitiated }) => {
  const [challanData, setChallanData] = useState({
    assessmentYear: '2024-25',
    typeOfPayment: '100', // 100 = Advance Tax
    majorHead: '0021',
    minorHead: '100',
    amount: taxPayable || 0,
    modeOfPayment: 'online',
    paymentMethod: 'razorpay', // 'razorpay' or 'itd_direct'
  });

  const [generatedChallan, setGeneratedChallan] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const { generateChallan, isPending } = useTaxesPaid(filingId);
  const createPaymentOrder = useCreatePaymentOrder();
  const initiateITDPayment = useInitiateITDPayment();

  const handleGenerate = async () => {
    try {
      // Generate challan via TaxPaymentService
      const result = await taxPaymentService.generateChallan(filingId, challanData);

      if (!result.success) {
        toast.error(result.error || 'Failed to generate challan');
        return;
      }

      setGeneratedChallan(result);
      setPaymentId(result.paymentId);

      if (onChallanGenerated) {
        onChallanGenerated(result);
      }

      toast.success('Challan generated successfully!');
    } catch (error) {
      console.error('Challan generation failed:', error);
      toast.error('Failed to generate challan');
    }
  };

  const handlePayViaRazorpay = async () => {
    if (!paymentId) {
      toast.error('Please generate challan first');
      return;
    }

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
        description: `Tax Payment - Challan ${generatedChallan.challanNumber}`,
        orderId: result.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResult = await taxPaymentService.verifyPayment(paymentId, {
              razorpayOrderId: response.razorpay_order_id || response.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || response.razorpayPaymentId,
              razorpaySignature: response.razorpay_signature || response.razorpaySignature,
            });

            if (verifyResult.success) {
              toast.success('Payment successful!');
              if (onPaymentInitiated) {
                onPaymentInitiated({ paymentId, status: 'completed' });
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          // User details would come from context
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

  const handlePayViaITD = async () => {
    if (!paymentId) {
      toast.error('Please generate challan first');
      return;
    }

    try {
      const result = await initiateITDPayment.mutateAsync({
        filingId,
        paymentId,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to initiate ITD payment');
        return;
      }

      // Redirect to ITD payment gateway
      window.open(result.paymentUrl, '_blank');

      if (onPaymentInitiated) {
        onPaymentInitiated({ paymentId, status: 'processing', paymentUrl: result.paymentUrl });
      }
    } catch (error) {
      console.error('Failed to initiate ITD payment:', error);
      toast.error('Failed to initiate ITD payment');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <FileText className="h-6 w-6 text-gold-600 mr-3" />
        <h3 className="text-heading-md text-gray-800">Generate Tax Payment Challan</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
            <div>
              <p className="text-body-sm font-semibold text-info-900 mb-1">
                Challan ITNS 280
              </p>
              <p className="text-body-sm text-info-700">
                Use this challan to pay advance tax, self-assessment tax, or tax on regular
                assessment. You can pay online through net banking, debit card, or UPI.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Assessment Year
            </label>
            <input
              type="text"
              value={challanData.assessmentYear}
              onChange={(e) => setChallanData({ ...challanData, assessmentYear: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Type of Payment
            </label>
            <select
              value={challanData.typeOfPayment}
              onChange={(e) => setChallanData({ ...challanData, typeOfPayment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="100">Advance Tax (100)</option>
              <option value="300">Self-Assessment Tax (300)</option>
              <option value="400">Tax on Regular Assessment (400)</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={challanData.amount}
              onChange={(e) => setChallanData({ ...challanData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Mode of Payment
            </label>
            <select
              value={challanData.modeOfPayment}
              onChange={(e) => setChallanData({ ...challanData, modeOfPayment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="online">Online Payment</option>
              <option value="offline">Offline Payment</option>
            </select>
          </div>

          {challanData.modeOfPayment === 'online' && (
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">
                Payment Gateway
              </label>
              <select
                value={challanData.paymentMethod}
                onChange={(e) => setChallanData({ ...challanData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              >
                <option value="razorpay">Razorpay (Seamless)</option>
                <option value="itd_direct">ITD Direct Gateway</option>
              </select>
            </div>
          )}
        </div>

        {challanData.modeOfPayment === 'online' && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-success-600 mr-2" />
              <p className="text-body-sm text-success-900">
                {challanData.paymentMethod === 'razorpay'
                  ? 'You can pay seamlessly using Razorpay (Net Banking, UPI, Cards)'
                  : 'You will be redirected to the Income Tax Department payment gateway to complete the payment.'}
              </p>
            </div>
          </div>
        )}

        {generatedChallan && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-body-sm font-semibold text-green-900">Challan Generated</p>
                <p className="text-body-xs text-green-700">Challan Number: {generatedChallan.challanNumber}</p>
              </div>
            </div>
            {challanData.modeOfPayment === 'online' && (
              <div className="flex gap-2 mt-3">
                {challanData.paymentMethod === 'razorpay' ? (
                  <Button
                    onClick={handlePayViaRazorpay}
                    loading={createPaymentOrder.isPending}
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay via Razorpay
                  </Button>
                ) : (
                  <Button
                    onClick={handlePayViaITD}
                    loading={initiateITDPayment.isPending}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Pay via ITD Gateway
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleGenerate} loading={isPending} disabled={!!generatedChallan}>
            <Download className="h-4 w-4 mr-2" />
            {generatedChallan ? 'Regenerate Challan' : 'Generate Challan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallanGenerator;

