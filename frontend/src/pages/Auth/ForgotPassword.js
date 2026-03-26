/**
 * Forgot Password — Request reset link via email
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.toLowerCase());
      setSent(true);
      toast.success('Reset link sent!');
    } catch { setSent(true); /* soft landing — don't reveal if user exists */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgPage, padding: 16 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: P.logoBackground, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/bb-logo.svg" alt="BB" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: P.textPrimary }}>BurnBlack</span>
        </div>

        <div className="step-card" style={{ padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Check Your Email</div>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>If an account exists, we've sent a reset link. Check spam too.</p>
              <button className="ff-btn ff-btn-outline" onClick={() => { setSent(false); setError(''); }} style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>Try Again</button>
              <Link to="/login" className="ff-btn ff-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Back to Login</Link>
            </div>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="ff-btn ff-btn-ghost" style={{ marginBottom: 12, padding: '4px 0' }}>
                <ArrowLeft size={14} /> Back to login
              </button>
              <h2 className="step-title">Reset Password</h2>
              <p className="step-desc">Enter your email and we'll send a reset link</p>

              {error && <div className="ff-errors" style={{ marginBottom: 12 }}><div className="ff-errors-title">{error}</div></div>}

              <form onSubmit={handleSubmit}>
                <div className="ff-field">
                  <label className="ff-label">Email Address</label>
                  <input className="ff-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <button className="ff-btn ff-btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 12 }}>
                Remember your password? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
