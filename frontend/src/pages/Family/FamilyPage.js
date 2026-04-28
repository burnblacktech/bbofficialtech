/**
 * FamilyPage — Multi-PAN family member management
 * Member cards with filing status, masked PAN, relationship,
 * PAN verification status, "Start Filing" for members without current AY filing
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, CheckCircle, AlertCircle, Loader2, Shield, FileText } from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

const RELATIONSHIPS = [
  { value: '', label: 'Select relationship...' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
];

const FILING_STATUS_TONE = {
  draft: 'warning',
  ready: 'info',
  submitted: 'brand',
  accepted: 'success',
  failed: 'error',
};

function maskPAN(pan) {
  if (!pan || pan.length < 10) return pan || '—';
  return `${pan.slice(0, 5)}****${pan.slice(9)}`;
}

export default function FamilyPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pan: '', relationship: '', name: '' });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => (await api.get('/family/members')).data.data,
  });

  const addMut = useMutation({
    mutationFn: async () => (await api.post('/family/members', form)).data.data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      toast.success(`${data.fullName} added`);
      if (data.notice) toast(data.notice, { icon: '⚠️' });
      setShowAdd(false);
      setForm({ pan: '', relationship: '', name: '' });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to add member'),
  });

  const removeMut = useMutation({
    mutationFn: async (id) => api.delete(`/family/members/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Member removed');
    },
  });

  const totalMembers = members.length + 1; // +1 for primary user
  const canAdd = members.length < 3; // max 4 total including primary

  return (
    <Page title="Family Filing" subtitle="File taxes for your entire family from one account" maxWidth={640}
      actions={<Badge tone="default">{totalMembers}/4 members</Badge>}>

      {/* Primary user card */}
      <Card style={{ padding: '16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>You (Primary)</span>
              <Badge tone="brand">Primary</Badge>
            </div>
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>Account holder</div>
          </div>
        </div>
      </Card>

      {/* Family member cards */}
      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>
      ) : (
        members.map(m => (
          <Card key={m.id} style={{ padding: '16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>{m.fullName}</span>
                  {m.panVerified ? (
                    <Badge tone="success" icon={<CheckCircle size={10} />}>Verified</Badge>
                  ) : (
                    <Badge tone="warning" icon={<AlertCircle size={10} />}>Unverified</Badge>
                  )}
                </div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                  {maskPAN(m.pan)} · {m.relationship}
                </div>
                {/* Filing status */}
                {m.latestFiling ? (
                  <div style={{ marginTop: 6 }}>
                    <Badge tone={FILING_STATUS_TONE[m.latestFiling.status] || 'default'}>
                      {m.latestFiling.status?.charAt(0).toUpperCase() + m.latestFiling.status?.slice(1)} — AY {m.latestFiling.assessmentYear}
                    </Badge>
                  </div>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => navigate('/filing/start')}>
                      <FileText size={12} /> Start Filing
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(`Remove ${m.fullName}?`)) removeMut.mutate(m.id); }}> {/* eslint-disable-line no-alert */}
                <Trash2 size={13} />
              </Button>
            </div>
          </Card>
        ))
      )}

      {members.length === 0 && !isLoading && (
        <Card variant="muted" style={{ textAlign: 'center', padding: 24 }}>
          <Users size={28} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: P.textMuted }}>
            No family members added yet. Add spouse, parents, or children to file for them.
          </div>
        </Card>
      )}

      {/* Add member button */}
      {!showAdd && canAdd && (
        <Button variant="outline" block onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
          <Plus size={14} /> Add Family Member
        </Button>
      )}

      {/* Add member inline form */}
      {showAdd && (
        <Card variant="active" style={{ marginTop: 8 }}>
          <Section title="Add Family Member" icon={<Plus size={14} />}>
            <Grid cols={2}>
              <Input
                label="PAN Number" required value={form.pan}
                onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F" maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              <Input label="Relationship" required type="select" value={form.relationship}
                onChange={e => setForm({ ...form, relationship: e.target.value })}>
                {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Input>
            </Grid>
            <Input
              label="Full Name (optional)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="As per PAN card" hint="Will be auto-filled from PAN verification"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" loading={addMut.isPending} onClick={() => addMut.mutate()}
                disabled={!form.pan || !form.relationship || form.pan.length !== 10}>
                <Shield size={14} /> Verify & Add
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setForm({ pan: '', relationship: '', name: '' }); }}>
                Cancel
              </Button>
            </div>
          </Section>
        </Card>
      )}

      <Alert tone="info" icon={<Shield size={14} />} style={{ marginTop: 12 }}>
        Family members' PANs are verified securely. Maximum 4 members (including yourself) per Family Pack.
      </Alert>
    </Page>
  );
}
