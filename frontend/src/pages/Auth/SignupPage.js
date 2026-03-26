/**
 * Signup Page — Clean, single-frame, matches Login
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Valid email required'); return; }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ''))) { setError('Valid 10-digit phone required'); return; }
    if (form.password.length < 8) { setError('Password must be 8+ characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await authService.register({
        fullName: form.fullName, email: form.email.toLowerCase(),
        phone: form.phone.replace(/\D/g, ''), password: form.password,
      });
      if (res.success) {
        toast.success('Account created!');
        try {
          const lr = await authService.login({ email: form.email.toLowerCase(), password: form.password });
          if (lr.success) { await loginWithOAuth(lr.user, lr.accessToken, lr.refreshToken); navigate('/email-verification'); }
        } catch { navigate('/login', { state: { message: 'Account created. Please login.' } }); }
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  const PwIcon = showPw ? EyeOff : Eye;

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.logoRow}>
          <div style={S.logoBox}><img src="/bb-logo.svg" alt="BB" style={S.logoImg} /></div>
          <span style={S.logoText}>BurnBlack</span>
        </div>

        <div className="step-card" style={{ padding: 28 }}>
          <h2 style={S.title}>Create Account</h2>
          <p style={S.subtitle}>Start filing your ITR in minutes</p>

          {error && <div className="ff-errors" style={{ marginBottom: 14 }}><div className="ff-errors-title"><AlertCircle size={14} /> {error}</div></div>}

          <form onSubmit={handleSubmit}>
            <div className="ff-field">
              <label className="ff-label">Full Name *</label>
              <input className="ff-input" type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="As per PAN card" />
            </div>
            <div className="ff-grid-2">
              <div className="ff-field">
                <label className="ff-label">Email *</label>
                <input className="ff-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="ff-field">
                <label className="ff-label">Phone</label>
                <input className="ff-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="ff-grid-2">
              <div className="ff-field" style={{ position: 'relative' }}>
                <label className="ff-label">Password *</label>
                <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={S.eyeBtn}><PwIcon size={16} /></button>
              </div>
              <div className="ff-field">
                <label className="ff-label">Confirm *</label>
                <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat" />
              </div>
            </div>

            <button className="ff-btn ff-btn-primary" type="submit" disabled={loading} style={S.fullBtn}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <div style={S.divider}><span style={S.dividerText}>Or</span></div>

            <button type="button" className="ff-btn ff-btn-outline" onClick={() => authService.googleLoginRedirect()} style={S.fullBtn}>
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>

            <p style={S.footer}>Already have an account? <Link to="/login" style={S.link}>Sign in</Link></p>
          </form>
        </div>
        <p style={S.copy}>&copy; 2025 BurnBlack</p>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgPage, padding: 16 },
  container: { maxWidth: 440, width: '100%' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  logoBox: { width: 36, height: 36, background: P.logoBackground, borderRadius: 10, overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain', padding: 5 },
  logoText: { fontSize: 18, fontWeight: 700, color: P.textPrimary },
  title: { fontSize: 20, fontWeight: 700, color: P.textPrimary, margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: P.textMuted, margin: '0 0 20px' },
  eyeBtn: { position: 'absolute', right: 12, top: 30, background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, padding: 0 },
  fullBtn: { width: '100%', justifyContent: 'center' },
  link: { color: P.brand, fontWeight: 600 },
  divider: { position: 'relative', textAlign: 'center', margin: '16px 0' },
  dividerText: { position: 'relative', background: P.bgCard, padding: '0 12px', fontSize: 12, color: P.textLight, zIndex: 1 },
  footer: { textAlign: 'center', fontSize: 13, color: P.textMuted, marginTop: 16 },
  copy: { textAlign: 'center', fontSize: 12, color: P.textLight, marginTop: 16 },
};
