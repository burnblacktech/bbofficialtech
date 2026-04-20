/**
 * AdminCoupons — Coupon management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, XCircle, Loader2 } from 'lucide-react';
import { Card, Button, Input, Grid, Badge, Section, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percent', discountValue: '', maxUses: '', validFrom: '', validUntil: '' });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons', filter],
    queryFn: async () => {
      const params = {};
      if (filter) params.active = filter;
      return (await api.get('/admin/coupons', { params })).data.data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => (await api.post('/admin/coupons', {
      ...form, code: form.code.toUpperCase(),
      discountValue: parseInt(form.discountValue),
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
    })).data.data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Coupon created'); setShowCreate(false); setForm({ code: '', discountType: 'percent', discountValue: '', maxUses: '', validFrom: '', validUntil: '' }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deactivateMut = useMutation({
    mutationFn: async (id) => api.post(`/admin/coupons/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Coupon deactivated'); },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Coupons</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={13} /> Create Coupon</Button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'true', 'false'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? P.brand : P.borderMedium}`, background: filter === f ? P.brandLight : 'transparent', color: filter === f ? P.brandDark : P.textMuted, minHeight: 'auto' }}>
            {f === '' ? 'All' : f === 'true' ? 'Active' : 'Expired'}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <Card variant="active" style={{ marginBottom: 16 }}>
          <Section title="Create Coupon" icon={<Tag size={14} />}>
            <Grid cols={2}>
              <Input label="Code" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LAUNCH50" maxLength={30} style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} hint="3-30 uppercase alphanumeric" />
              <Input label="Discount Type" required type="select" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </Input>
            </Grid>
            <Grid cols={2}>
              <Input label={form.discountType === 'percent' ? 'Discount (1-100%)' : 'Discount (₹ in paise)'} required type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === 'percent' ? '50' : '10000'} />
              <Input label="Max Uses (blank = unlimited)" type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} placeholder="100" />
            </Grid>
            <Grid cols={2}>
              <Input label="Valid From" required type="date" value={form.validFrom} onChange={v => setForm({ ...form, validFrom: v })} />
              <Input label="Valid Until" required type="date" value={form.validUntil} onChange={v => setForm({ ...form, validUntil: v })} />
            </Grid>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" loading={createMut.isPending} onClick={() => createMut.mutate()} disabled={!form.code || !form.discountValue || !form.validFrom || !form.validUntil}>
                <Tag size={13} /> Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </Section>
        </Card>
      )}

      {/* Coupon list */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: P.textMuted }}>No coupons found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                {['Code', 'Type', 'Value', 'Uses', 'Valid', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: P.textMuted, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const isExpired = new Date(c.validUntil) < new Date();
                const isActive = c.isActive && !isExpired;
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.code}</td>
                    <td style={{ padding: '8px 12px' }}>{c.discountType}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${(c.discountValue / 100).toLocaleString('en-IN')}`}</td>
                    <td style={{ padding: '8px 12px' }}>{c.currentUses}/{c.maxUses || '∞'}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: P.textMuted }}>{new Date(c.validFrom).toLocaleDateString('en-IN')} — {new Date(c.validUntil).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '8px 12px' }}><Badge tone={isActive ? 'success' : 'error'}>{isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}</Badge></td>
                    <td style={{ padding: '8px 12px' }}>
                      {isActive && <Button variant="ghost" size="sm" onClick={() => deactivateMut.mutate(c.id)}><XCircle size={13} /></Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
