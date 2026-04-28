/**
 * JsonViewer — Collapsible tree view for JSON payloads with copy-to-clipboard.
 * Used in FilingBrowserDetail to inspect raw jsonPayload.
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, X, Check } from 'lucide-react';
import { Button } from '../../../components/ds';
import P from '../../../styles/palette';

function JsonNode({ keyName, value, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isObject ? Object.entries(value) : [];
  const label = isArray ? `[${entries.length}]` : `{${entries.length}}`;

  if (!isObject) {
    const color =
      typeof value === 'string' ? '#16A34A'
        : typeof value === 'number' ? '#2563EB'
          : typeof value === 'boolean' ? '#CA8A04'
            : P.textMuted;
    const display = typeof value === 'string' ? `"${value}"` : String(value);
    return (
      <div style={{ paddingLeft: depth * 16, display: 'flex', gap: 4, fontSize: 12, lineHeight: 1.8 }}>
        {keyName !== null && (
          <span style={{ color: P.textMuted }}>{keyName}:</span>
        )}
        <span style={{ color, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{display}</span>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1.8,
          userSelect: 'none',
        }}
      >
        {expanded
          ? <ChevronDown size={12} color={P.textMuted} />
          : <ChevronRight size={12} color={P.textMuted} />}
        {keyName !== null && <span style={{ color: P.textMuted }}>{keyName}:</span>}
        {!expanded && (
          <span style={{ color: P.textLight, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {label}
          </span>
        )}
      </div>
      {expanded && entries.map(([k, v]) => (
        <JsonNode key={k} keyName={isArray ? Number(k) : k} value={v} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function JsonViewer({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = JSON.stringify(data, null, 2);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: P.bgCard,
          borderRadius: 12,
          width: '90%',
          maxWidth: 720,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${P.borderLight}`,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>JSON Payload</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: P.textMuted,
                minHeight: 'auto',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', padding: 16, flex: 1 }}>
          {data && typeof data === 'object' ? (
            <JsonNode keyName={null} value={data} depth={0} />
          ) : (
            <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
