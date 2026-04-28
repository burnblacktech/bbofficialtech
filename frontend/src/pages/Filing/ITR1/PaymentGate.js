/**
 * PaymentGate — Razorpay checkout modal
 * Triggered when user clicks Download JSON or Submit without paying.
 *
 * Fetches plan from backend on mount instead of computing locally.
 * Handles alreadyPaid/free responses, coupon application, and
 * Razorpay script load errors with retry.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Shield, CheckCircle, Tag, Loader2, Zap, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import P from '../../../styles/palette';

const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function PaymentGate({ filingId, itrType, grossIncome, userName, userEmail, onSuccess, onClose }) {
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [scriptError, setScriptError] = useState(false);

  // Fetch plan from backend on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchPlan() {
      try {
        const res = await api.get('/payments/required-plan', {
          params: { itrType, grossIncome },
        });
        if (!cancelled) setPlan(res.data.data.plan);
      } catch {
        if (!cancelled) toast.error('Failed to load pricing');
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }
    fetchPlan();
    return () => { cancelled = true; };
  }, [itrType, grossIncome]);

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptError(false);
        resolve();
      };
      script.onerror = () => {
        setScriptError(true);
        reject(new Error('Failed to load Razorpay'));
      };
      document.body.appendChild(script);
    });
  }, []);

  const handleRetryScript = useCallback(async () => {
    setScriptError(false);
    try {
      await loadRazorpayScript();
      toast.success('Payment gateway loaded');
    } catch {
      toast.error('Still unable to load payment gateway — check your connection');
    }
  }, [loadRazorpayScript]);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/create-order', {
        filingId, itrType, grossIncome, couponCode: coupon || undefined,
      });
      const data = res.data.data;

      if (data.alreadyPaid) {
        toast.success('Already paid — proceeding');
        onSuccess?.();
        return;
      }
      if (data.free) {
        toast.success('Free filing — no payment needed');
        onSuccess?.();
        return;
      }

      if (data.discount) setAppliedDiscount(data.discount);
      await openRazorpay(data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = async (orderData) => {
    try {
      await loadRazorpayScript();
    } catch {
      toast.error('Failed to load payment gateway — please retry');
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'BurnBlack',
      description: `${orderData.plan.name} — ${itrType} Filing`,
      'order_id': orderData.razorpayOrderId,
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

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const isFree = plan?.price === 0;
  const price = plan?.price || 0;
  const priceWithGst = plan?.priceWithGst || 0;
  const planName = plan?.name || '...';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <button style={S.close} onClick={onClose} aria-label="Close"><X size={18} /></button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: P.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Zap size={24} style={{ color: P.brand }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: P.textPrimary }}>
            {planLoading ? 'Loading...' : isFree ? 'Your filing is free' : `${planName} Plan`}
          </h2>
          <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>
            {isFree ? 'Income under ₹5 lakh — file for free' : `${itrType} filing with all features`}
          </p>
        </div>

        {/* Script error banner */}
        {scriptError && (
          <div style={{ background: P.errorBg, border: `1px solid ${P.errorBorder}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} style={{ color: P.error, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: P.error, flex: 1 }}>Payment gateway failed to load.</span>
            <button onClick={handleRetryScript} style={{ fontSize: 11, fontWeight: 600, color: P.error, background: 'none', border: `1px solid ${P.error}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', minHeight: 'auto' }}>Retry</button>
          </div>
        )}

        {/* Price */}
        {!planLoading && !isFree && (
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
          disabled={loading || planLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none',
            background: P.brand, color: P.brandBlack, fontSize: 15, fontWeight: 700,
            cursor: loading || planLoading ? 'wait' : 'pointer', opacity: loading || planLoading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
          {planLoading ? 'Loading...' : isFree ? 'Continue for Free' : `Pay ${fmt(priceWithGst)}`}
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
