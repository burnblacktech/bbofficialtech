/**
 * GSTChecker — Admin tool for GST registration lookup.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Badge, Button } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function GSTChecker() {
  const [gstin, setGstin] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => adminService.checkGST(payload),
  });

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(val);
    if (validationError) setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!GSTIN_REGEX.test(gstin)) {
      setValidationError('Enter a valid 15-character GSTIN');
      return;
    }
    mutation.mutate({ gstin, forceRefresh });
  };

  const result = mutation.data?.data;
  const apiError = mutation.error?.response?.data?.error
    || mutation.error?.message
    || null;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>GST Checker</h1>

      {/* Search form */}
      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: P.textMuted, marginBottom: 4 }}>
                GSTIN
              </label>
              <input
                type="text"
                value={gstin}
                onChange={handleInputChange}
                placeholder="e.g. 27AABCU9603R1ZM"
                maxLength={15}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                  border: `1px solid ${validationError ? P.error : P.borderMedium}`,
                  borderRadius: 6,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {validationError && (
                <span style={{ fontSize: 11, color: P.error, marginTop: 2, display: 'block' }}>
                  {validationError}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={mutation.isPending}
              disabled={gstin.length !== 15}
            >
              <Search size={14} style={{ marginRight: 6 }} />
              Lookup
            </Button>
          </div>

          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 12, fontSize: 12, color: P.textMuted, cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
              style={{ accentColor: P.brand }}
            />
            <RefreshCw size={12} />
            Force refresh (bypass cache)
          </label>
        </form>
      </Card>

      {/* Error display */}
      {mutation.isError && (
        <Card style={{ marginBottom: 20, border: `1px solid ${P.errorBorder}`, background: P.errorBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.error }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{apiError || 'GST lookup failed'}</span>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>GST Details</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone={result.fromCache ? 'default' : 'success'}>
                {result.fromCache ? 'Cached' : 'Fresh'}
              </Badge>
              {result.fetchedAt && (
                <span style={{ fontSize: 11, color: P.textLight }}>
                  Fetched {new Date(result.fetchedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="GSTIN" value={result.data?.gstin} mono />
            <Field label="Status" value={result.data?.gstinStatus} badge />
            <Field label="Business Name" value={result.data?.businessName} />
            <Field label="Legal Name" value={result.data?.legalName} />
            <Field label="Taxpayer Type" value={result.data?.taxpayerType} />
            <Field label="Constitution" value={result.data?.constitutionOfBusiness} />
            <Field label="Registration Date" value={result.data?.registrationDate} />
            <Field label="Last Updated" value={result.data?.lastUpdatedDate} />
            <Field label="State Code" value={result.data?.stateCode} />
            <Field label="Cancellation Date" value={result.data?.cancellationDate} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Address" value={result.data?.address} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, mono, badge }) {
  const display = value || '—';
  const statusTone = badge
    ? (display.toLowerCase().includes('active') ? 'success' : display === '—' ? 'default' : 'warning')
    : null;

  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ fontSize: 11, color: P.textLight, marginBottom: 2 }}>{label}</div>
      {badge ? (
        <Badge tone={statusTone}>{display}</Badge>
      ) : (
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: P.textPrimary,
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        }}>
          {display}
        </div>
      )}
    </div>
  );
}
