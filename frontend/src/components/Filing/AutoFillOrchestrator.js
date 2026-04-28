// =====================================================
// AUTO-FILL ORCHESTRATOR — One-click auto-fill flow
// State machine: idle → verifying_pan → fetching_26as → fetching_ais → mapping → review → done | error
// Progress overlay, summary screen, conflict resolution, error fallback
// =====================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, Loader2, AlertTriangle, Upload, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STAGES = [
  { key: 'verifying_pan', label: 'Verifying PAN', idx: 0 },
  { key: 'fetching_26as', label: 'Fetching 26AS', idx: 1 },
  { key: 'fetching_ais', label: 'Fetching AIS', idx: 2 },
  { key: 'mapping', label: 'Mapping fields', idx: 3 },
];

const fmt = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;

const motionProps = (props) => (prefersReducedMotion() ? {} : props);

export default function AutoFillOrchestrator({
  filingId,
  payload,
  onComplete,
  onError,
  onFallbackImport,
}) {
  const [stage, setStage] = useState('idle');
  const [summary, setSummary] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [mappedPayload, setMappedPayload] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  // Start the auto-fill pipeline
  const startAutoFill = useCallback(async () => {
    if (stage !== 'idle' && stage !== 'error') return;

    setStage('verifying_pan');
    setErrorMsg('');
    setSummary(null);
    setConflicts([]);
    setResolutions({});
    setMappedPayload(null);

    const controller = new AbortController();
    abortRef.current = controller;

    // Stage timer must be accessible in both try and catch
    let stageTimer = null;

    try {
      // Simulate stage progression for UX — the backend does the full pipeline
      stageTimer = createStageTimer(setStage);

      const response = await api.post(
        `/filings/${filingId}/auto-fill`,
        {},
        { signal: controller.signal },
      );

      stageTimer.stop();

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Auto-fill failed');
      }

      const { mappedPayload: mp, conflicts: cf, summary: sm } = response.data.data;

      setMappedPayload(mp);
      setSummary(sm);

      if (cf && cf.length > 0) {
        setConflicts(cf);
        // Default all resolutions to 'new' (ITD-sourced value)
        const defaultRes = {};
        cf.forEach((c) => { defaultRes[c.field] = 'new'; });
        setResolutions(defaultRes);
        setStage('review');
      } else {
        setStage('done');
        onComplete?.(mp, sm);
      }
    } catch (err) {
      // Stop the stage timer immediately so it doesn't overwrite the error state
      stageTimer?.stop();

      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      const status = err.response?.status;
      const code = err.response?.data?.error?.code || err.response?.data?.code;
      let msg = 'Auto-fill failed. Please try again.';

      if (status === 400 && code === 'PAN_NOT_VERIFIED') {
        msg = 'PAN must be verified before auto-fill. Please verify your PAN first.';
      } else if (status === 401 && code === 'ITR_SESSION_EXPIRED') {
        msg = 'Your ITD session has expired. Please re-enter your credentials.';
      } else if (status === 503 || code === 'SUREPASS_SERVICE_UNAVAILABLE') {
        msg = 'ITD portal is temporarily unavailable. You can import Form 16 instead.';
      } else if (status === 429) {
        msg = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.message) {
        msg = err.message;
      }

      setErrorMsg(msg);
      setStage('error');
      onError?.(err);
    }
  }, [filingId, stage, onComplete, onError]);

  // Resolve conflicts and complete
  const resolveConflicts = useCallback(async () => {
    try {
      setStage('mapping');

      const resArr = conflicts.map((c) => ({
        field: c.field,
        keepValue: resolutions[c.field] || 'new',
      }));

      const response = await api.post(`/filings/${filingId}/auto-fill/resolve`, {
        resolutions: resArr,
      });

      if (!response.data?.success) {
        throw new Error('Failed to resolve conflicts');
      }

      const { updatedPayload } = response.data.data;
      setMappedPayload(updatedPayload);
      setStage('done');
      onComplete?.(updatedPayload, summary);
      toast.success('Auto-fill complete');
    } catch (err) {
      setErrorMsg('Failed to resolve conflicts. Please try again.');
      setStage('error');
      onError?.(err);
    }
  }, [filingId, conflicts, resolutions, summary, onComplete, onError]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (stage === 'idle') {
      startAutoFill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isProcessing = ['verifying_pan', 'fetching_26as', 'fetching_ais', 'mapping'].includes(stage);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Auto-fill progress"
    >
      <AnimatePresence mode="wait">
        {isProcessing && (
          <ProgressOverlay key="progress" stage={stage} />
        )}
        {stage === 'review' && (
          <ConflictResolutionUI
            key="review"
            conflicts={conflicts}
            resolutions={resolutions}
            setResolutions={setResolutions}
            onResolve={resolveConflicts}
            summary={summary}
          />
        )}
        {stage === 'done' && (
          <SummaryScreen key="done" summary={summary} />
        )}
        {stage === 'error' && (
          <ErrorFallback
            key="error"
            message={errorMsg}
            onRetry={startAutoFill}
            onFallbackImport={onFallbackImport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stage timer: simulates stage progression while API runs ──
function createStageTimer(setStage) {
  const stages = ['verifying_pan', 'fetching_26as', 'fetching_ais', 'mapping'];
  let idx = 0;
  let stopped = false;

  const advance = () => {
    if (stopped || idx >= stages.length - 1) return;
    idx++;
    setStage(stages[idx]);
    timer = setTimeout(advance, 2000 + Math.random() * 1500);
  };

  let timer = setTimeout(advance, 1500 + Math.random() * 1000);

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
  };
}

// ── Progress Overlay ──
function ProgressOverlay({ stage }) {
  const currentIdx = STAGES.find((s) => s.key === stage)?.idx ?? 0;

  return (
    <motion.div
      {...motionProps({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } })}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        maxWidth: 380,
        width: '90vw',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <Loader2
        size={28}
        style={{ color: 'var(--brand-primary)', marginBottom: 14, animation: 'spin 1s linear infinite' }}
      />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        Auto-filling your return
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
        Fetching data from the Income Tax Department...
      </p>

      {/* 4-step indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
        {STAGES.map((s) => {
          const done = s.idx < currentIdx;
          const active = s.idx === currentIdx;
          return (
            <div
              key={s.key}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              aria-label={`${s.label}: ${done ? 'complete' : active ? 'in progress' : 'pending'}`}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: done
                    ? 'var(--color-success)'
                    : active
                      ? 'var(--brand-primary)'
                      : 'var(--bg-muted)',
                  color: done || active ? '#fff' : 'var(--text-light)',
                  fontSize: 11,
                  fontWeight: 600,
                  transition: 'background 0.3s',
                }}
              >
                {done ? <CheckCircle size={13} /> : s.idx + 1}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-primary)' : done ? 'var(--color-success)' : 'var(--text-muted)',
                  transition: 'color 0.3s',
                }}
              >
                {s.label}
                {active && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-light)' }}>...</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Summary Screen ──
function SummaryScreen({ summary }) {
  const { fieldsPopulated = 0, totalIncome = 0, totalTDS = 0 } = summary || {};

  return (
    <motion.div
      {...motionProps({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } })}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        maxWidth: 380,
        width: '90vw',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <CheckCircle size={32} style={{ color: 'var(--color-success)', marginBottom: 12 }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        Auto-fill complete
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px' }}>
        Your tax data has been imported from the ITD portal.
      </p>

      {/* Summary stats */}
      <div
        style={{
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 18,
          textAlign: 'left',
        }}
      >
        <SummaryRow label="Fields populated" value={fieldsPopulated} />
        <SummaryRow label="Total income" value={fmt(totalIncome)} />
        <SummaryRow label="Total TDS" value={fmt(totalTDS)} highlight />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.4 }}>
        Review each section to verify the imported data is correct.
      </p>
    </motion.div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: highlight ? 'var(--color-success)' : 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Conflict Resolution UI ──
function ConflictResolutionUI({ conflicts, resolutions, setResolutions, onResolve, summary }) {
  return (
    <motion.div
      {...motionProps({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } })}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        maxWidth: 440,
        width: '90vw',
        boxShadow: 'var(--shadow-md)',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Resolve conflicts
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          Some fields have different values. Choose which to keep for each.
        </p>
      </div>

      {/* Summary bar */}
      {summary && (
        <div
          style={{
            background: 'var(--bg-muted)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>{summary.fieldsPopulated} fields populated</span>
          <span>Income: {fmt(summary.totalIncome)}</span>
          <span>TDS: {fmt(summary.totalTDS)}</span>
        </div>
      )}

      {/* Conflict list */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
        {conflicts.map((c) => {
          const keepNew = resolutions[c.field] === 'new';
          return (
            <div
              key={c.field}
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {formatFieldLabel(c.field)}
                {c.source && (
                  <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: 6 }}>
                    via {c.source}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <ConflictOption
                  label="Your value"
                  value={c.existingValue}
                  selected={!keepNew}
                  onClick={() => setResolutions((p) => ({ ...p, [c.field]: 'existing' }))}
                />
                <ConflictOption
                  label="ITD value"
                  value={c.newValue}
                  selected={keepNew}
                  recommended
                  onClick={() => setResolutions((p) => ({ ...p, [c.field]: 'new' }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="ff-btn ff-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onResolve}>
        <CheckCircle size={14} /> Apply &amp; continue
      </button>
    </motion.div>
  );
}

function ConflictOption({ label, value, selected, recommended, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${selected ? 'var(--brand-primary)' : 'var(--border-light)'}`,
        background: selected ? 'var(--brand-primary-light)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s',
      }}
      aria-pressed={selected}
    >
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-light)', marginBottom: 2 }}>
        {label}
        {recommended && (
          <span style={{ marginLeft: 4, color: 'var(--color-success)', fontSize: 9, fontWeight: 600 }}>
            RECOMMENDED
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          wordBreak: 'break-word',
        }}
      >
        {formatValue(value)}
      </div>
    </button>
  );
}

// ── Error Fallback ──
function ErrorFallback({ message, onRetry, onFallbackImport }) {
  return (
    <motion.div
      {...motionProps({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } })}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        maxWidth: 380,
        width: '90vw',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <AlertTriangle size={28} style={{ color: 'var(--color-warning)', marginBottom: 12 }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        Auto-fill unavailable
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px', lineHeight: 1.4 }}>
        {message}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="ff-btn ff-btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onFallbackImport}
        >
          <Upload size={14} /> Import Form 16 instead
        </button>
        <button
          className="ff-btn ff-btn-outline"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onRetry}
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </motion.div>
  );
}

// ── Helpers ──
function formatFieldLabel(field) {
  if (!field) return 'Unknown field';
  // Convert dot-path like "income.salary.grossSalary" to "Gross Salary"
  const last = field.split('.').pop();
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(val) {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') return fmt(val);
  return String(val);
}
