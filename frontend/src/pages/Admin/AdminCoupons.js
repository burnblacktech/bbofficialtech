/**
 * AdminCoupons — Coupon management
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, XCircle, Loader2, Eye, X } from 'lucide-react';
import { Card, Button, Input, Grid, Badge, Section } from '../../components/ds';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  });
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [usagePanel, setUsagePanel] = useState(null); // coupon object
  const [usagePage, setUsagePage] = useState(1);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons', filter],
    queryFn: async () => {
      const params = {};
      if (filter) params.active = filter;
      const res = await adminService.getCoupons(params);
      return res.data || res;
    },
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['admin-coupon-usage', usagePanel?.id, usagePage],
    queryFn: () =>
      adminService
        .getCouponUsage(usagePanel.id, { page: usagePage, limit: 10 })
        .then((r) => r.data || r),
    enabled: !!usagePanel?.id,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        discountValue: parseInt(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      };
      return adminService.createCoupon(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setShowCreate(false);
      setForm({ code: '', discountType: 'percent', discountValue: '', maxUses: '', validFrom: '', validUntil: '' });
    },
    onError: (e) => toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => adminService.deactivateCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deactivated');
      setConfirmDeactivate(null);
    },
    onError: () => {
      toast.error('Failed to deactivate');
      setConfirmDeactivate(null);
    },
  });

  const handleDeactivateClick = useCallback((coupon) => {
    setConfirmDeactivate(coupon);
  }, []);

  const validateForm = () => {
    if (!form.code || !/^[A-Z0-9]{3,30}$/.test(form.code.toUpperCase())) return false;
    if (!form.discountValue || parseInt(form.discountValue) <= 0) return false;
    if (form.discountType === 'percent' && parseInt(form.discountValue) > 100) return false;
    if (!form.validFrom || !form.validUntil) return false;
    if (form.validFrom >= form.validUntil) return false;
    return true;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Coupons</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> Create Coupon
        </Button>
      </div>

      {/* Active/Expired filter toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'true', 'false'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${filter === f ? P.brand : P.borderMedium}`,
              background: filter === f ? P.brandLight : 'transparent',
              color: filter === f ? P.brandDark : P.textMuted,
              minHeight: 'auto',
            }}
          >
            {f === '' ? 'All' : f === 'true' ? 'Active' : 'Expired'}
          </button>
        ))}
      </div>

      {/* Create coupon form */}
      {showCreate && (
        <Card variant="active" style={{ marginBottom: 16 }}>
          <Section title="Create Coupon" icon={<Tag size={14} />}>
            <Grid cols={2}>
              <Input
                label="Code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="LAUNCH50"
                maxLength={30}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                hint="3-30 uppercase alphanumeric"
              />
              <Input
                label="Discount Type"
                required
                type="select"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </Input>
            </Grid>
            <Grid cols={2}>
              <Input
                label={form.discountType === 'percent' ? 'Discount (1-100%)' : 'Discount (₹ in paise)'}
                required
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percent' ? '50' : '10000'}
              />
              <Input
                label="Max Uses (blank = unlimited)"
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="100"
              />
            </Grid>
            <Grid cols={2}>
              <Input
                label="Valid From"
                required
                type="date"
                value={form.validFrom}
                onChange={(v) => setForm({ ...form, validFrom: v })}
              />
              <Input
                label="Valid Until"
                required
                type="date"
                value={form.validUntil}
                onChange={(v) => setForm({ ...form, validUntil: v })}
              />
            </Grid>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button
                variant="primary"
                loading={createMut.isPending}
                onClick={() => createMut.mutate()}
                disabled={!validateForm()}
              >
                <Tag size={13} /> Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </Section>
        </Card>
      )}

      {/* Coupon list table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Loader2 size={20} className="animate-spin" color={P.textMuted} />
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: P.textMuted }}>No coupons found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                {['Code', 'Type', 'Value', 'Uses', 'Valid', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: P.textMuted,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = new Date(c.validUntil) < new Date();
                const isActive = c.isActive && !isExpired;
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {c.code}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{c.discountType}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      {c.discountType === 'percent'
                        ? `${c.discountValue}%`
                        : `₹${(c.discountValue / 100).toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {c.currentUses}/{c.maxUses || '∞'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: P.textMuted }}>
                      {new Date(c.validFrom).toLocaleDateString('en-IN')} —{' '}
                      {new Date(c.validUntil).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge tone={isActive ? 'success' : 'error'}>
                        {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setUsagePanel(c); setUsagePage(1); }}
                        title="View usage"
                      >
                        <Eye size={13} />
                      </Button>
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateClick(c)}
                          title="Deactivate"
                        >
                          <XCircle size={13} />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Deactivation confirmation dialog */}
      {confirmDeactivate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirmDeactivate(null)}
        >
          <Card
            style={{ width: 400, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deactivate Coupon</div>
            <p style={{ fontSize: 13, color: P.textSecondary, marginBottom: 16 }}>
              Are you sure you want to deactivate coupon{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {confirmDeactivate.code}
              </span>
              ? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setConfirmDeactivate(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={deactivateMut.isPending}
                onClick={() => deactivateMut.mutate(confirmDeactivate.id)}
                style={{ background: P.error, borderColor: P.error }}
              >
                Deactivate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Usage detail drawer/panel */}
      {usagePanel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setUsagePanel(null)}
        >
          <div
            style={{
              width: 480,
              maxWidth: '90vw',
              height: '100vh',
              background: P.bgCard,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              overflow: 'auto',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Usage: {usagePanel.code}
                </div>
                <div style={{ fontSize: 12, color: P.textMuted }}>
                  {usagePanel.currentUses} uses of {usagePanel.maxUses || '∞'}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUsagePanel(null)}>
                <X size={16} />
              </Button>
            </div>

            {usageLoading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Loader2 size={20} className="animate-spin" color={P.textMuted} />
              </div>
            ) : (usageData?.orders || []).length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: P.textMuted, fontSize: 13 }}>
                No orders found for this coupon
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                      {['Order', 'User', 'Discount', 'Total', 'Paid At'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '6px 4px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 10,
                            color: P.textMuted,
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(usageData?.orders || []).map((o) => (
                      <tr key={o.orderId} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', color: P.textMuted }}>
                          {o.orderId?.slice(0, 8)}…
                        </td>
                        <td style={{ padding: '6px 4px' }}>{o.email || o.userId?.slice(0, 8)}</td>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', color: P.success }}>
                          ₹{((o.discount || 0) / 100).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)' }}>
                          ₹{((o.totalAmount || 0) / 100).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '6px 4px', color: P.textLight }}>
                          {o.paidAt ? new Date(o.paidAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {usageData?.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usagePage <= 1}
                      onClick={() => setUsagePage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    <span style={{ fontSize: 12, color: P.textMuted, lineHeight: '32px' }}>
                      {usagePage} / {usageData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usagePage >= usageData.totalPages}
                      onClick={() => setUsagePage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
