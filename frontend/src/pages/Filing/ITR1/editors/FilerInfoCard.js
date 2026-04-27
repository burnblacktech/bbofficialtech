/**
 * FilerInfoCard — Compact identity strip showing filer name, masked PAN,
 * assessment year, ITR type, and filing status.
 *
 * Pure render component — no state, no hooks.
 */
import { User, Shield, Calendar, FileText } from 'lucide-react';
import '../../filing-flow.css';

const STATUS_MAP = { O: 'Original', R: 'Revised', B: 'Belated', U: 'Updated' };

/**
 * Mask a PAN string: first 5 chars + **** + last char.
 * Returns the raw value (or '—') for null/undefined/short strings.
 */
export function maskPan(pan) {
  if (!pan || typeof pan !== 'string' || pan.length < 6) return pan || '—';
  return pan.slice(0, 5) + '****' + pan.slice(-1);
}

export default function FilerInfoCard({ payload, filing, itrType }) {
  const pi = payload?.personalInfo || {};
  const firstName = pi.firstName || '';
  const lastName = pi.lastName || '';
  const pan = pi.pan || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const filingStatus = STATUS_MAP[pi.filingStatus] || pi.filingStatus || '—';
  const ay = filing?.assessmentYear || '—';
  const missing = !fullName || !pan;

  if (missing) {
    return (
      <div className="step-card info" style={{ padding: '10px 16px', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Complete your personal info to see your filing details
        </span>
      </div>
    );
  }

  const items = [
    { icon: <User size={14} />, label: fullName },
    { icon: <Shield size={14} />, label: maskPan(pan), mono: true },
    { icon: <Calendar size={14} />, label: `AY ${ay}` },
    { icon: <FileText size={14} />, label: itrType || '—' },
    { label: filingStatus, badge: true },
  ];

  return (
    <div
      className="step-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 16px',
        marginBottom: 12,
        flexWrap: 'wrap',
      }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            fontWeight: item.badge ? 600 : 500,
            fontFamily: item.mono ? 'var(--font-mono)' : undefined,
            color: item.badge ? 'var(--brand-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}
