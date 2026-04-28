/**
 * AdminFilingCreate — Create filings on behalf of users (single + batch)
 * Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Plus, Users, ArrowLeft } from 'lucide-react';
import { Card, Button, Input, Grid, Section, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import { useNavigate } from 'react-router-dom';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AY_OPTIONS = ['2024-25', '2025-26', '2026-27'];
const ITR_OPTIONS = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];

export default function AdminFilingCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('single'); // 'single' | 'batch'
  const [pan, setPan] = useState('');
  const [batchPans, setBatchPans] = useState('');
  const [assessmentYear, setAssessmentYear] = useState(AY_OPTIONS[0]);
  const [itrType, setItrType] = useState(ITR_OPTIONS[0]);
  const [batchResult, setBatchResult] = useState(null);

  const panValid = PAN_REGEX.test(pan);

  const parseBatchPans = () => {
    return batchPans
      .split(/[,\n]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
  };

  const batchPanList = parseBatchPans();
  const batchValid = batchPanList.length > 0 && batchPanList.length <= 50;

  const createMut = useMutation({
    mutationFn: () =>
      adminService.createFiling({ pan: pan.toUpperCase(), assessmentYear, itrType }),
    onSuccess: () => {
      toast.success('Filing created successfully');
      setPan('');
    },
    onError: (e) => {
      const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to create filing';
      toast.error(msg);
    },
  });

  const batchMut = useMutation({
    mutationFn: () =>
      adminService.batchCreateFilings({ pans: batchPanList, assessmentYear, itrType }),
    onSuccess: (res) => {
      const data = res.data || res;
      setBatchResult(data);
      const s = data.succeeded?.length || 0;
      const f = data.failed?.length || 0;
      if (f === 0) toast.success(`All ${s} filings created`);
      else toast.success(`${s} succeeded, ${f} failed`);
    },
    onError: (e) => {
      const msg = e.response?.data?.error || e.response?.data?.message || 'Batch creation failed';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (mode === 'single') createMut.mutate();
    else batchMut.mutate();
  };

  const isLoading = createMut.isPending || batchMut.isPending;
  const canSubmit = mode === 'single' ? panValid : batchValid;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/filing-mgmt')}>
          <ArrowLeft size={14} />
        </Button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Create Filing</h1>
      </div>

      <Card variant="active" style={{ marginBottom: 16 }}>
        <Section title="Filing Details" icon={<FileText size={14} />}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'single', label: 'Single PAN', icon: <Plus size={12} /> },
              { key: 'batch', label: 'Batch PANs', icon: <Users size={12} /> },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setBatchResult(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${mode === m.key ? P.brand : P.borderMedium}`,
                  background: mode === m.key ? P.brandLight : 'transparent',
                  color: mode === m.key ? P.brandDark : P.textMuted,
                  minHeight: 'auto',
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <Grid cols={2}>
            <Input
              label="Assessment Year"
              required
              type="select"
              value={assessmentYear}
              onChange={(e) => setAssessmentYear(e.target.value)}
            >
              {AY_OPTIONS.map((ay) => (
                <option key={ay} value={ay}>AY {ay}</option>
              ))}
            </Input>
            <Input
              label="ITR Type"
              required
              type="select"
              value={itrType}
              onChange={(e) => setItrType(e.target.value)}
            >
              {ITR_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Input>
          </Grid>

          {mode === 'single' ? (
            <Input
              label="PAN Number"
              required
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
              hint="10 characters: 5 letters, 4 digits, 1 letter"
              error={pan && !panValid ? 'Invalid PAN format' : undefined}
            />
          ) : (
            <Input
              label='PAN Numbers (comma or newline separated, max 50)'
              required
              type="textarea"
              value={batchPans}
              onChange={(e) => { setBatchPans(e.target.value.toUpperCase()); setBatchResult(null); }}
              placeholder={'ABCDE1234F, XYZAB5678C\nMNOPQ9012R'}
              rows={4}
              style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', resize: 'vertical' }}
              hint={`${batchPanList.length} PAN(s) detected`}
              error={batchPanList.length > 50 ? 'Maximum 50 PANs per batch' : undefined}
            />
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button
              variant="primary"
              loading={isLoading}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              <Plus size={13} /> {mode === 'single' ? 'Create Filing' : `Create ${batchPanList.length} Filing(s)`}
            </Button>
          </div>
        </Section>
      </Card>

      {/* Batch results summary */}
      {batchResult && (
        <Card style={{ marginBottom: 16 }}>
          <Section title="Batch Results" icon={<Users size={14} />}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 13 }}>
                <Badge tone="success">{batchResult.succeeded?.length || 0} succeeded</Badge>
              </div>
              <div style={{ fontSize: 13 }}>
                <Badge tone="error">{batchResult.failed?.length || 0} failed</Badge>
              </div>
            </div>

            {(batchResult.failed || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.error, marginBottom: 6 }}>
                  Failed PANs:
                </div>
                {batchResult.failed.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: `1px solid ${P.borderLight}`,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{f.pan}</span>
                    <span style={{ color: P.textMuted }}>{f.message || f.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {(batchResult.succeeded || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.success, marginBottom: 6 }}>
                  Succeeded PANs:
                </div>
                {batchResult.succeeded.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: `1px solid ${P.borderLight}`,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.pan}</span>
                    <span style={{ color: P.textMuted }}>{s.filingId?.slice(0, 8)}…</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </Card>
      )}
    </div>
  );
}
