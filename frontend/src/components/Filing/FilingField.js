/**
 * FilingField — The ONLY field component allowed inside filing editors.
 * Enforces: fixed label size, fixed input size, fixed spacing.
 * No escape hatches. Every field looks identical.
 *
 * Usage:
 *   <FilingField label="Gross Salary" value={v} onChange={set} type="currency" />
 *   <FilingField label="PAN" value={v} onChange={set} type="code" />
 *   <FilingField label="State" value={v} onChange={set} type="select" options={[...]} />
 */

const TYPES = {
  text: { maxWidth: 220, inputMode: undefined },
  currency: { maxWidth: 200, inputMode: 'numeric', prefix: '₹', mono: true },
  code: { maxWidth: 180, inputMode: undefined, mono: true, uppercase: true },
  phone: { maxWidth: 180, inputMode: 'tel' },
  email: { maxWidth: 240, inputMode: 'email' },
  date: { maxWidth: 170, inputMode: undefined },
  select: { maxWidth: 240 },
  wide: { maxWidth: 300 },
};

export default function FilingField({
  label, value, onChange, onBlur, error, hint, type = 'text',
  options, placeholder, disabled, locked, required,
}) {
  const config = TYPES[type] || TYPES.text;
  const isSelect = type === 'select';

  return (
    <div style={{ marginBottom: 6, maxWidth: config.maxWidth }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: 4,
          lineHeight: 1,
        }}>
          {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {isSelect ? (
        <select
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled || locked}
          style={{
            width: '100%',
            maxWidth: config.maxWidth,
            padding: '8px 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: 'var(--font-primary)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--border-light)'}`,
            borderRadius: 6,
            background: disabled || locked ? 'var(--bg-muted)' : 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
            appearance: 'none',
            cursor: disabled || locked ? 'not-allowed' : 'pointer',
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div style={{ position: 'relative' }}>
          {config.prefix && (
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--text-light)', fontFamily: 'var(--font-mono)',
            }}>{config.prefix}</span>
          )}
          <input
            type={type === 'date' ? 'date' : 'text'}
            inputMode={config.inputMode}
            value={value || ''}
            onChange={e => {
              let v = e.target.value;
              if (config.uppercase) v = v.toUpperCase();
              if (type === 'currency') v = v.replace(/[^0-9.]/g, '');
              onChange?.(v);
            }}
            onBlur={onBlur}
            disabled={disabled || locked}
            placeholder={placeholder}
            style={{
              width: '100%',
              maxWidth: config.maxWidth,
              padding: config.prefix ? '8px 10px 8px 24px' : '8px 10px',
              fontSize: 16,
              fontWeight: 500,
              fontFamily: config.mono ? 'var(--font-mono)' : 'var(--font-primary)',
              fontVariantNumeric: config.mono ? 'tabular-nums' : undefined,
              letterSpacing: config.mono ? '-0.01em' : undefined,
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--border-light)'}`,
              borderRadius: 6,
              background: disabled || locked ? 'var(--bg-muted)' : 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
              textTransform: config.uppercase ? 'uppercase' : undefined,
            }}
          />
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 2 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

/**
 * FilingGrid — Wraps fields in a consistent 3-column grid.
 * Use inside bordered-subsection__body.
 */
export function FilingGrid({ cols = 3, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(140px, 1fr))`,
      gap: '6px 14px',
      alignItems: 'start',
    }}>
      {children}
    </div>
  );
}

/**
 * FilingSection — A bordered section with header.
 */
export function FilingSection({ title, children, badge }) {
  return (
    <div style={{
      border: '1px solid var(--border-light)',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 14px',
        background: 'var(--bg-muted)',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--text-muted)',
        }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '10px 14px' }}>
        {children}
      </div>
    </div>
  );
}
