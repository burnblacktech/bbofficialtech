/**
 * Landing Page — Hero + inline auth (login/signup on right side)
 * No separate login/signup page needed for the primary flow.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { Shield, CheckCircle, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login, loginWithOAuth } = useAuth();
  const [tab, setTab] = useState('login');

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logoRow}>
            <div style={S.logoBox}><img src="/bb-logo.svg" alt="BB" style={S.logoImg} /></div>
            <span style={S.logoText}>BurnBlack</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main style={S.hero}>
        <div style={S.heroInner}>
          {/* Left: Value prop */}
          <div style={S.heroLeft}>
            <div style={S.badge}><Shield size={14} /> Built by Tax Professionals</div>
            <h1 style={S.h1}>File Your ITR<br />Like a CA Would</h1>
            <p style={S.heroDesc}>
              Upload your documents, verify the numbers, download your filing.
              Real-time computation, old vs new regime comparison, CA-grade accuracy.
            </p>
            <div style={S.features}>
              <Feature text="ITR-1 through ITR-4 — auto-detected" />
              <Feature text="Import Form 16, 26AS, AIS — auto-fill" />
              <Feature text="Smart Tax Brain catches errors before ITD" />
              <Feature text="256-bit encryption, data stays in India" />
              <Feature text="Free for income up to ₹5 lakh" />
            </div>
          </div>

          {/* Right: Inline auth */}
          <div style={S.authCard}>
            <div style={S.authTabs}>
              <button style={{ ...S.authTab, ...(tab === 'login' ? S.authTabActive : {}) }} onClick={() => setTab('login')}>Sign In</button>
              <button style={{ ...S.authTab, ...(tab === 'signup' ? S.authTabActive : {}) }} onClick={() => setTab('signup')}>Create Account</button>
            </div>
            {tab === 'login' ? <LoginForm login={login} navigate={navigate} /> : <SignupForm loginWithOAuth={loginWithOAuth} navigate={navigate} onSwitch={() => setTab('login')} />}
          </div>
        </div>
      </main>

      {/* How it works */}
      <section style={{ background: P.bgCard, borderTop: `1px solid ${P.borderLight}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: P.textPrimary, margin: '0 0 8px' }}>How It Works</h2>
          <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 32px' }}>Three steps. Five minutes. Done.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { step: '1', title: 'Select Income Sources', desc: 'Tell us what income you have — salary, property, capital gains, business. We pick the right ITR form.' },
              { step: '2', title: 'Upload Documents', desc: 'Import Form 16, 26AS, AIS. We auto-fill 80% of your filing. Just verify the numbers.' },
              { step: '3', title: 'Download & File', desc: 'Download your ITR JSON, upload to the ITD portal, and e-verify. Or let us submit directly via ERI.' },
            ].map(s => (
              <div key={s.step} style={{ padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: P.brand, color: P.brandBlack, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, margin: '0 auto 12px' }}>{s.step}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.textPrimary, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: P.textMuted, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: P.bgPage, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: P.textPrimary, margin: '0 0 8px' }}>Simple Pricing</h2>
          <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 32px' }}>No hidden fees. Pay only when you download.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { name: 'Free', price: '₹0', desc: 'Income ≤ ₹5L', features: ['ITR-1 / ITR-4', 'Form 16 import', 'Regime comparison', 'JSON download'] },
              { name: 'Starter', price: '₹149', desc: 'Salaried individuals', features: ['ITR-1 / ITR-4', 'All document imports', 'ERI submission', 'e-Verification'], popular: true },
              { name: 'Plus', price: '₹249', desc: 'Capital gains, business', features: ['All ITR types', 'Capital gains computation', 'Tax Brain insights', 'Email support'] },
              { name: 'Family', price: '₹449', desc: 'Up to 4 family members', features: ['All ITR types', 'Cross-member optimization', 'Family dashboard', 'Priority support'] },
            ].map(p => (
              <div key={p.name} style={{ background: P.bgCard, border: `1px solid ${p.popular ? P.brand : P.borderLight}`, borderRadius: 12, padding: 20, position: 'relative' }}>
                {p.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: P.brand, color: P.brandBlack, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: P.textMuted, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: P.textPrimary, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{p.price}</div>
                <div style={{ fontSize: 11, color: P.textLight, marginBottom: 12 }}>{p.desc} · + GST</div>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: P.textSecondary, marginBottom: 4 }}>
                    <CheckCircle size={12} style={{ color: P.success, flexShrink: 0 }} /> {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section style={{ background: P.bgCard, borderTop: `1px solid ${P.borderLight}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', text: '256-bit encryption' },
            { icon: '🇮🇳', text: 'Data stays in India' },
            { icon: '✅', text: 'ITD-compliant JSON' },
            { icon: '🏛️', text: 'Registered ERI (ERIP013662)' },
            { icon: '⚡', text: '5-minute filing' },
          ].map(t => (
            <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: P.textSecondary }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span> {t.text}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <span>&copy; 2026 BurnBlack Technologies (HJR Consultancy India Pvt Ltd)</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/tax-calculator" style={{ color: P.textLight, fontSize: 12, textDecoration: 'none' }}>Tax Calculator</Link>
            <a href="/terms" style={{ color: P.textLight, fontSize: 12, textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ color: P.textLight, fontSize: 12, textDecoration: 'none' }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <CheckCircle size={14} style={{ color: P.success, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: P.textSecondary }}>{text}</span>
    </div>
  );
}

function LoginForm({ login, navigate }) {
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      localStorage.setItem('rememberedEmail', email);
      const result = await login({ email: sanitizeEmail(email), password: sanitizePassword(password) });
      if (!result.success) setError('Email or password doesn\'t match.');
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
      {error && <div style={S.errorBox}><AlertCircle size={14} /> {error}</div>}
      <div className="ff-field">
        <label className="ff-label">Email</label>
        <input className="ff-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="ff-field" style={{ position: 'relative' }}>
        <label className="ff-label">Password</label>
        <input className="ff-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="current-password" />
        <button type="button" onClick={() => setShowPw(!showPw)} style={S.eyeBtn}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Link to="/forgot-password" style={{ fontSize: 12, color: P.brand, fontWeight: 500 }}>Forgot password?</Link>
      </div>
      <button className="ff-btn ff-btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
      </button>
      <div style={S.divider}><span style={S.dividerText}>or</span></div>
      <button type="button" className="ff-btn ff-btn-outline" onClick={() => authService.googleLoginRedirect()} style={{ width: '100%', justifyContent: 'center' }}>
        <GoogleIcon /> Continue with Google
      </button>
    </form>
  );
}

function SignupForm({ loginWithOAuth, navigate, onSwitch }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', agreeTerms: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Valid email required'); return; }
    if (form.password.length < 8) { setError('Password must be 8+ characters'); return; }
    if (!form.agreeTerms) { setError('Please agree to Terms & Privacy Policy'); return; }
    setLoading(true);
    try {
      const res = await authService.register({ fullName: form.fullName, email: form.email.toLowerCase(), phone: form.phone.replace(/\D/g, ''), password: form.password });
      if (res.success) {
        toast.success('Account created!');
        const lr = await authService.login({ email: form.email.toLowerCase(), password: form.password });
        if (lr.success) { await loginWithOAuth(lr.user, lr.accessToken, lr.refreshToken); navigate('/dashboard'); }
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
      {error && <div style={S.errorBox}><AlertCircle size={14} /> {error}</div>}
      <div className="ff-field">
        <label className="ff-label">Full Name</label>
        <input className="ff-input" type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="As per PAN card" />
      </div>
      <div className="ff-field">
        <label className="ff-label">Email</label>
        <input className="ff-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="ff-field" style={{ position: 'relative' }}>
        <label className="ff-label">Password</label>
        <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
        <button type="button" onClick={() => setShowPw(!showPw)} style={S.eyeBtn}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: P.textMuted, marginBottom: 12, cursor: 'pointer', lineHeight: 1.4 }}>
        <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} style={{ marginTop: 2, accentColor: P.brand, minWidth: 14, minHeight: 14 }} />
        <span>I agree to the <a href="/terms" style={{ color: P.brand }}>Terms</a> and <a href="/privacy" style={{ color: P.brand }}>Privacy Policy</a></span>
      </label>
      <button className="ff-btn ff-btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <>Create Account <ArrowRight size={16} /></>}
      </button>
      <div style={S.divider}><span style={S.dividerText}>or</span></div>
      <button type="button" className="ff-btn ff-btn-outline" onClick={() => authService.googleLoginRedirect()} style={{ width: '100%', justifyContent: 'center' }}>
        <GoogleIcon /> Continue with Google
      </button>
    </form>
  );
}

function GoogleIcon() {
  return <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}

const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: P.bgPage },
  nav: { background: P.brandBlack, borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 50 },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBox: { width: 36, height: 36, background: P.brandBlackSoft, borderRadius: 10, overflow: 'hidden', border: '1px solid #333' },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain', padding: 5 },
  logoText: { fontSize: 18, fontWeight: 700, color: P.brand },
  hero: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' },
  heroInner: { maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'center' },
  heroLeft: { maxWidth: 520 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: P.brandLight, color: P.brandDark, borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 16 },
  h1: { fontSize: 38, fontWeight: 900, color: P.textPrimary, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px' },
  heroDesc: { fontSize: 15, color: P.textMuted, lineHeight: 1.6, margin: '0 0 20px' },
  features: { marginTop: 0 },
  authCard: { background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  authTabs: { display: 'flex', borderBottom: `1px solid ${P.borderLight}` },
  authTab: { flex: 1, padding: '12px 0', background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: P.textMuted, cursor: 'pointer', transition: 'all 0.15s', borderBottom: '2px solid transparent' },
  authTabActive: { color: P.brand, fontWeight: 700, borderBottomColor: P.brand },
  errorBox: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: P.errorBg, border: `1px solid ${P.errorBorder}`, borderRadius: 6, fontSize: 12, color: P.error, marginBottom: 12 },
  eyeBtn: { position: 'absolute', right: 12, top: 30, background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, padding: 0, minHeight: 'auto' },
  divider: { position: 'relative', textAlign: 'center', margin: '14px 0', borderTop: `1px solid ${P.borderLight}` },
  dividerText: { position: 'relative', top: -9, background: P.bgCard, padding: '0 10px', fontSize: 11, color: P.textLight },
  footer: { padding: '16px 24px', borderTop: `1px solid ${P.borderLight}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: P.textMuted },
};

// Mobile responsive
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  S.heroInner.gridTemplateColumns = '1fr';
  S.heroInner.gap = 24;
  S.h1.fontSize = 28;
  S.heroLeft.maxWidth = '100%';
}
