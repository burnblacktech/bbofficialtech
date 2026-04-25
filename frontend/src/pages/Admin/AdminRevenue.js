/**
 * AdminRevenue — Revenue metrics and plan breakdown
 */

import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Tag, Users } from 'lucide-react';
import { Card, Row, Divider, Badge } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function AdminRevenue() {
  const { data } = useQuery({ queryKey: ['admin-revenue'], queryFn: async () => (await api.get('/admin/revenue')).data.data });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Revenue</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <RevCard label="Today" value={fmt(data?.summary?.today)} />
        <RevCard label="This Week" value={fmt(data?.summary?.thisWeek)} />
        <RevCard label="This Month" value={fmt(data?.summary?.thisMonth)} />
        <RevCard label="All Time" value={fmt(data?.summary?.allTime)} highlight />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By Plan */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Revenue by Plan</div>
          {(data?.byPlan || []).map(p => (
            <div key={p.planId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.planId}</div>
                <div style={{ fontSize: 11, color: P.textMuted }}>{p.orderCount} orders</div>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: P.success }}>{fmt(p.totalRevenue)}</span>
            </div>
          ))}
        </Card>

        {/* Metrics */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Key Metrics</div>
          <Row label="Payment Success Rate" bold>
            <Badge tone={data?.paymentSuccessRate >= 90 ? 'success' : 'warning'}>{data?.paymentSuccessRate || 0}%</Badge>
          </Row>
          <Row label="Avg Revenue Per User" value={fmt(data?.avgRevenuePerUser)} bold />
          <Divider />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 4 }}>Coupon Usage</div>
          <Row label="Orders with Coupons" value={data?.couponStats?.totalCouponOrders || 0} />
          {(data?.couponStats?.byCoupon || []).map(c => (
            <Row key={c.couponCode} label={c.couponCode}>
              <span style={{ fontSize: 12 }}>{c.usageCount}× · {fmt(c.totalDiscount)} off</span>
            </Row>
          ))}
        </Card>
      </div>
    </div>
  );
}

function RevCard({ label, value, highlight }) {
  return (
    <Card style={{ padding: 14, background: highlight ? P.brandLight : undefined, borderColor: highlight ? P.brand : undefined }}>
      <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: highlight ? P.brandDark : P.textPrimary }}>{value}</div>
    </Card>
  );
}
