/**
 * Email Verification — Verify email after signup
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) verify(token);
  }, [token]); // eslint-disable-line

  const verify = async (t) => {
    setLoading(true);
    setStatus('verifying');
    try {
      const res = await authService.verifyEmail(t);
      if (res.success) { setStatus('success'); toast.success('Email verified!'); setTimeout(() => navigate('/dashboard'), 2000); }
      else { setStatus('error'); }
    } catch (e) {
      setStatus(e.response?.data?.error?.includes('expired') ? 'expired' : 'error');
      toast.error(e.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setLoading(true);
    try { await authService.resendVerificationEmail(); toast.success('Verification email sent!'); }
    catch { toast.error('Failed to resend'); }
    finally { setLoading(false); }
  };

  const icons = { pending: Mail, verifying: RefreshCw, success: CheckCircle, error: AlertCircle, expired: AlertCircle };
  const colors = { pending: '#D4AF37', verifying: '#D4AF37', success: '#16a34a', error: '#DC2626', expired: '#CA8A04' };
  const titles = { pending: 'Check Your Email', verifying: 'Verifying...', success: 'Email Verified!', error: 'Verification Failed', expired: 'Link Expired' };
  const Icon = icons[status];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgPage, padding: 16 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: P.logoBackground, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/bb-logo.svg" alt="BB" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: P.textPrimary }}>BurnBlack</span>
        </div>

        <div className="step-card" style={{ textAlign: 'center', padding: 16 }}>
          <Icon size={40} color={colors[status]} className={status === 'verifying' ? 'animate-spin' : ''} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{titles[status]}</div>

          {status === 'pending' && <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>We sent a verification link to your email. Click it to verify your account.</p>}
          {status === 'success' && <p style={{ fontSize: 14, color: '#6b7280' }}>Redirecting to dashboard...</p>}
          {status === 'error' && <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>The link may be invalid. Try resending.</p>}
          {status === 'expired' && <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>This link has expired. Request a new one.</p>}

          {(status === 'pending' || status === 'error' || status === 'expired') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button className="ff-btn ff-btn-primary" onClick={resend} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : 'Resend Verification Email'}
              </button>
              <Link to="/login" className="ff-btn ff-btn-outline" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Back to Login</Link>
            </div>
          )}
          {status === 'success' && (
            <Link to="/dashboard" className="ff-btn ff-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', marginTop: 12 }}>Go to Dashboard</Link>
          )}
        </div>
      </div>
    </div>
  );
}
