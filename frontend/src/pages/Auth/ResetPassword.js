/**
 * Reset Password — Set new password with token
 */

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, pw);
      setDone(true);
      toast.success('Password reset!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e2) {
      setError(e2.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  const PwIcon = show ? EyeOff : Eye;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgPage, padding: 16 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: P.logoBackground, borderRadius: 10, overflow: 'hidden' }}>
            <img src="/bb-logo.svg" alt="BB" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: P.textPrimary }}>BurnBlack</span>
        </div>

        <div className="step-card" style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Password Updated</div>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Redirecting to login...</p>
              <Link to="/login" className="ff-btn ff-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="step-title">New Password</h2>
              <p className="step-desc">Choose a strong password for your account</p>

              {error && <div className="ff-errors" style={{ marginBottom: 12 }}><div className="ff-errors-title">{error}</div></div>}

              <form onSubmit={handleSubmit}>
                <div className="ff-field" style={{ position: 'relative' }}>
                  <label className="ff-label">New Password</label>
                  <input className="ff-input" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: 30, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><PwIcon size={16} /></button>
                </div>
                <div className="ff-field">
                  <label className="ff-label">Confirm Password</label>
                  <input className="ff-input" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
                  {confirm && pw !== confirm && <div className="ff-hint" style={{ color: '#ef4444' }}>Passwords don't match</div>}
                </div>
                <button className="ff-btn ff-btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : 'Update Password'}
                </button>
              </form>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 12 }}>
                <Link to="/login" style={{ color: '#D4AF37', fontWeight: 600 }}>Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
