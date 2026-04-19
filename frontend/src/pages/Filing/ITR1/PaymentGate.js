/**
 * PaymentGate — Razorpay checkout modal
 * Triggered when user clicks Download JSON or Submit without paying.
 *
 * Market-breaking pricing:
 *   FREE: Income ≤ ₹5L (ITR-1/4)
 *   ₹149: ITR-1/4 (Starter)
 *   ₹249: ITR-2/3 (Plus)
 *   ₹799: CA-Assisted
 *   ₹449: Family Pack (up to 4 PANs)
 */

import { useState } from 'react';
import { X, Shield, CheckCircle, Tag, Loader2, Zap } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import P from '../../../styles/palette';

const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function PaymentGate({ filingId, itrType, grossIncome, userName, userEmail, onSuccess, onClose }) {
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/create-order', {
        filingId, itrType, grossIncome, couponCode: coupon || undefined,
      });
      const data = res.data.data;

      // Already paid
      if (data.alreadyPaid) {
        toast.success('Already paid — proceeding');
        onSuccess?.();
        return;
      }

      // Free tier
      if (data.free) {
        toast.success('Free filing — no payment needed');
        onSuccess?.();
        return;
      }

      // Open Razorpay checkout
      if (data.discount) setAppliedDiscount(data.discount);
      openRazorpay(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = (orderData) => {
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'BurnBlack',
      description: `${orderData.plan.name} — ${itrType} Filing`,
      order_id: orderData.razorpayOrderId,
      prefill: { name: userName || '', email: userEmail || '' },
      theme: { color: '#D4AF37' },
      handler: async (response) => {
        try {
          await api.post('/payments/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success('Payment successful');
          onSuccess?.();
        } catch {
          toast.error('Payment verification failed — contact support');
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    }
  };

  // Determine plan for display
  const income = Number(grossIncome) || 0;
  const isFree = income <= 500000 && ['ITR-1', 'ITR-4'].includes(itrType);
  const isPlus = ['ITR-2', 'ITR-3'].includes(itrType);
  const price = isFree ? 0 : isPlus ? 249 : 149;
  const priceWithGst = isFree ? 0 : isPlus ? 294 : 176;
  const planName = isFree ? 'Free' : isPlus ? 'Plus' : 'Starter';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <button style={S.close} onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: P.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Zap size={24} style={{ color: P.brand }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: P.textPrimary }}>
            {isFree ? 'Your filing is free' : `${planName} Plan`}
          </h2>
          <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>
            {isFree ? 'Income under ₹5 lakh — file for free' : `${itrType} filing with all features`}
          </p>
        </div>

        {/* Price */}
        {!isFree && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: P.textPrimary, fontFamily: 'var(--font-mono)' }}>
              {fmt(price)}
            </span>
            <span style={{ fontSize: 13, color: P.textMuted, marginLeft: 4 }}>+ GST ({fmt(priceWithGst)} total)</span>
            {appliedDiscount && (
              <div style={{ fontSize: 12, color: P.success, marginTop: 4 }}>
                <Tag size={11} /> Discount applied: -{fmt(appliedDiscount)}
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div style={{ marginBottom: 16 }}>
          {[
            'All document imports (Form 16, 26AS, AIS)',
            'Smart validation — catches errors before ITD',
            'Old vs new regime comparison',
            'JSON download + computation PDF',
            ...(isFree ? [] : ['ERI direct submission to ITD', 'e-Verification via Aadhaar OTP']),
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: P.textSecondary }}>
              <CheckCircle size={14} style={{ color: P.success, flexShrink: 0 }} /> {f}
            </div>
          ))}
        </div>

        {/* Coupon */}
        {!isFree && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              style={{ flex: 1, padding: '8px 12px', border: `1px solid ${P.borderMedium}`, borderRadius: 6, fontSize: 13, textTransform: 'uppercase' }}
              placeholder="Coupon code"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
            />
            <button style={{ padding: '8px 14px', background: P.bgMuted, border: `1px solid ${P.borderMedium}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: P.textSecondary }}
              onClick={() => { if (coupon) toast.success('Coupon will be applied at checkout'); }}>
              Apply
            </button>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none',
            background: P.brand, color: P.brandBlack, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
          {isFree ? 'Continue for Free' : `Pay ${fmt(priceWithGst)}`}
        </button>

        {/* Trust signals */}
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: P.textLight }}>
          <Shield size={10} style={{ verticalAlign: -1 }} /> 256-bit encrypted · Razorpay secure checkout · Instant invoice
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 420, width: '100%',
    position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  close: {
    position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
    cursor: 'pointer', color: P.textLight, padding: 4, minHeight: 'auto', minWidth: 'auto',
  },
};
