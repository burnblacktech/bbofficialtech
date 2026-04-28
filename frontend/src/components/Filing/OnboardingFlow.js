// =====================================================
// ONBOARDING FLOW — First-time user experience
// Welcome overlay, contextual tooltips, inactivity nudge
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Edit3, Send, Sparkles, X } from 'lucide-react';

const LS_KEY = 'bb_onboarding_tooltips_dismissed';

function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}

function persistDismissed(set) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

const STEPS = [
  { icon: FileText, title: 'Import your data', desc: 'Auto-fill from 26AS/AIS or upload Form 16' },
  { icon: Edit3, title: 'Review & edit', desc: 'Check each section — we highlight what needs attention' },
  { icon: Send, title: 'Submit', desc: 'E-file directly or download JSON for the ITD portal' },
];

export default function OnboardingFlow({ isFirstFiling = false, onStartAutoFill, onSkip }) {
  const [showWelcome, setShowWelcome] = useState(isFirstFiling);
  const [showNudge, setShowNudge] = useState(false);
  const [dismissed, setDismissed] = useState(getDismissed);
  const nudgeTimer = useRef(null);
  const interacted = useRef(false);

  const resetNudgeTimer = useCallback(() => {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    if (!interacted.current && !showWelcome) {
      nudgeTimer.current = setTimeout(() => setShowNudge(true), 30000);
    }
  }, [showWelcome]);

  useEffect(() => {
    if (!isFirstFiling) return;
    const handler = () => { interacted.current = true; setShowNudge(false); };
    window.addEventListener('click', handler);
    resetNudgeTimer();
    return () => { window.removeEventListener('click', handler); clearTimeout(nudgeTimer.current); };
  }, [isFirstFiling, resetNudgeTimer]);

  const handleSkip = () => { setShowWelcome(false); interacted.current = true; onSkip?.(); };
  const handleAutoFill = () => { setShowWelcome(false); interacted.current = true; onStartAutoFill?.(); };

  const dismissTooltip = (id) => {
    setDismissed((prev) => { const next = new Set(prev); next.add(id); persistDismissed(next); return next; });
  };

  if (!isFirstFiling) return null;

  return (
    <>
      {/* Welcome overlay */}
      {showWelcome && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 28,
            maxWidth: 420, width: '90vw', textAlign: 'center', boxShadow: 'var(--shadow-md)',
          }}>
            <Sparkles size={28} style={{ color: 'var(--brand-primary)', marginBottom: 12 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Welcome to BurnBlack
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              File your ITR in 3 simple steps
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, textAlign: 'left' }}>
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', flexShrink: 0,
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="ff-btn ff-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={handleAutoFill}>
              <Sparkles size={14} /> Auto-fill my return
            </button>
            <button onClick={handleSkip}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                color: 'var(--text-muted)', fontFamily: 'inherit', padding: '4px 0',
              }}>
              Skip tour
            </button>
          </div>
        </div>
      )}

      {/* Inactivity nudge */}
      {showNudge && !showWelcome && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 90,
          background: 'var(--bg-card)', border: '1px solid var(--brand-primary)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px', boxShadow: 'var(--shadow-md)',
          maxWidth: 280, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Sparkles size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Need help getting started?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Try auto-fill to import your tax data, or click any section to begin.
            </div>
            <button className="ff-btn ff-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={handleAutoFill}>
              Auto-fill my return
            </button>
          </div>
          <button onClick={() => setShowNudge(false)} aria-label="Dismiss"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-light)' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
