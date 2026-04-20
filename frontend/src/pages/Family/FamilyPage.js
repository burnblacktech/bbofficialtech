/**
 * FamilyPage — Multi-PAN family member management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge, Alert, Row } from '../../components/ds';
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

export default function FamilyPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pan: '', relationship: '', name: '', dob: '' });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => (await api.get('/family/members')).data.data,
  });

  const { data: eligibility } = useQuery({
    queryKey: ['family-pack'],
    queryFn: async () => (await api.get('/family/pack-eligibility')).data.data,
  });

  const addMut = useMutation({
    mutationFn: async () => (await api.post('/family/members', form)).data.data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      qc.invalidateQueries({ queryKey: ['family-pack'] });
      toast.success(`${data.fullName} added`);
      if (data.notice) toast(data.notice, { icon: '⚠️' });
      setShowAdd(false);
      setForm({ pan: '', relationship: '', name: '', dob: '' });
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

  return (
    <Page title="Family Filing" subtitle="File taxes for your entire family from one account" maxWidth={640}>
      {/* Family Pack banner */}
      {eligibility?.eligible && (
        <Alert tone="info" icon={<Users size={14} />} title="Family Pack Available">
          You have {eligibility.memberCount} family members. Upgrade to Family Pack (₹449) to file for everyone without per-filing charges.
        </Alert>
      )}

      {/* Member list */}
      <Card>
        <Section title="Family Members" icon={<Users size={14} />} cap={`${members.length + 1}/4`}
          actions={!showAdd && members.length < 3 && <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}><Plus size={12} /> Add</Button>}>

          {/* Primary user (always shown) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${P.borderLight}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>You (Primary)</div>
              <div style={{ fontSize: 12, color: P.textMuted }}>Account holder</div>
            </div>
            <Badge tone="brand">Primary</Badge>
          </div>

          {isLoading ? (
            <div style={{ padding: 20, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>
          ) : members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary }}>{m.fullName}</span>
                  {m.panVerified && <CheckCircle size={12} color={P.success} />}
                </div>
                <div style={{ fontSize: 12, color: P.textMuted }}>
                  {m.pan?.slice(0, 5)}****{m.pan?.slice(9)} · {m.relationship}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(`Remove ${m.fullName}?`)) removeMut.mutate(m.id); }}> {/* eslint-disable-line no-alert */}
                <Trash2 size={13} />
              </Button>
            </div>
          ))}

          {members.length === 0 && !isLoading && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: P.textMuted, fontSize: 13 }}>
              No family members added yet. Add spouse, parents, or children to file for them.
            </div>
          )}
        </Section>
      </Card>

      {/* Add member form */}
      {showAdd && (
        <Card variant="active">
          <Section title="Add Family Member" icon={<Plus size={14} />}>
            <Grid cols={2}>
              <Input label="PAN Number" required value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
              <Input label="Relationship" required type="select" value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>
                {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Input>
            </Grid>
            <Input label="Full Name" hint="Will be auto-filled from PAN verification" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="As per PAN card" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" loading={addMut.isPending} onClick={() => addMut.mutate()} disabled={!form.pan || !form.relationship}>
                <Shield size={14} /> Verify & Add
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </Section>
        </Card>
      )}

      {/* Info */}
      <Alert tone="info" icon={<Shield size={14} />}>
        Family members' PANs are verified via SurePass. You can file ITR for any added member from your dashboard. Maximum 4 members (including yourself) per Family Pack.
      </Alert>
    </Page>
  );
}
