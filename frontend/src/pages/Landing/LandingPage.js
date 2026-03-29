/**
 * Landing Page — Single frame, no scroll, conversion-focused
 */

import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, ArrowRight, FileText, Zap, Lock } from 'lucide-react';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logoRow}>
            <div style={S.logoBox}><img src="/bb-logo.svg" alt="BB" style={S.logoImg} /></div>
            <span style={S.logoText}>BurnBlack</span>
          </div>
          <div style={S.navRight}>
            <button className="ff-btn ff-btn-ghost" onClick={() => navigate('/login')} style={{ fontSize: 14 }}>Sign In</button>
            <button className="ff-btn ff-btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroLeft}>
            <div style={S.badge}><Shield size={14} /> Built by Tax Professionals</div>
            <h1 style={S.h1}>File Your ITR<br />Like a CA Would</h1>
            <p style={S.heroDesc}>
              Smart guidance, real-time computation, old vs new regime comparison.
              ITR-1 through ITR-4 — all in one place.
            </p>
            <div style={S.heroBtns}>
              <button className="ff-btn ff-btn-primary" onClick={() => navigate('/signup')} style={{ padding: '12px 28px', fontSize: 16 }}>
                Start Filing Free <ArrowRight size={18} />
              </button>
              <button className="ff-btn ff-btn-outline" onClick={() => navigate('/login')} style={{ padding: '12px 28px', fontSize: 16 }}>
                Sign In
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div style={S.heroRight}>
            <FeatureCard icon={FileText} title="All ITR Types" desc="ITR-1 Sahaj to ITR-4 Sugam. Auto-detects the right form." />
            <FeatureCard icon={Zap} title="Real-Time Tax" desc="See your tax change as you type. Old vs New regime compared." />
            <FeatureCard icon={CheckCircle} title="Smart Validation" desc="Catches errors before ITD rejects. CA-grade accuracy." />
            <FeatureCard icon={Lock} title="Secure & Private" desc="256-bit encryption. Your data never leaves India." />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        <span>&copy; 2026 BurnBlack Technologies</span>
        <span style={{ color: P.textLight }}>Built for Indian taxpayers</span>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div style={S.featureCard}>
      <div style={S.featureIcon}><Icon size={20} color={P.brand} /></div>
      <div>
        <div style={S.featureTitle}>{title}</div>
        <div style={S.featureDesc}>{desc}</div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: P.bgPage },

  // Nav
  nav: { background: P.brandBlack, borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 50 },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBox: { width: 36, height: 36, background: P.brandBlackSoft, borderRadius: 10, overflow: 'hidden', border: '1px solid #333' },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain', padding: 5 },
  logoText: { fontSize: 18, fontWeight: 700, color: P.brand },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },

  // Hero
  hero: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' },
  heroInner: { maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' },
  heroLeft: { maxWidth: 480 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: P.brandLight, color: P.brand, borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 16 },
  h1: { fontSize: 40, fontWeight: 800, color: P.textPrimary, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px' },
  heroDesc: { fontSize: 16, color: P.textMuted, lineHeight: 1.6, margin: '0 0 24px' },
  heroBtns: { display: 'flex', gap: 12 },

  heroRight: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  featureCard: { display: 'flex', gap: 12, padding: 16, background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 12, transition: 'box-shadow 0.15s' },
  featureIcon: { width: 40, height: 40, borderRadius: 10, background: P.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontSize: 14, fontWeight: 600, color: P.textPrimary, marginBottom: 2 },
  featureDesc: { fontSize: 12, color: P.textMuted, lineHeight: 1.4 },

  // Footer
  footer: { padding: '16px 24px', borderTop: `1px solid ${P.borderLight}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: P.textMuted },
};

// Responsive override for mobile
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  S.heroInner.gridTemplateColumns = '1fr';
  S.heroInner.gap = 24;
  S.h1.fontSize = 28;
  S.heroRight.gridTemplateColumns = '1fr';
}
