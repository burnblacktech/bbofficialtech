/**
 * AdminRevenue — Revenue metrics and plan breakdown
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, Tag, Users } from 'lucide-react';
import { Card, Row, Divider, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function AdminRevenue() {
  const { data } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminService.getRevenue().then((r) => r.data),
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Revenue</h1>

      {/* Revenue summary cards — today, this week, this month, all time */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <RevCard label="Today" value={fmt(data?.summary?.today)} />
        <RevCard label="This Week" value={fmt(data?.summary?.thisWeek)} />
        <RevCard label="This Month" value={fmt(data?.summary?.thisMonth)} />
        <RevCard label="All Time" value={fmt(data?.summary?.allTime)} highlight />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Plan breakdown table */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Revenue by Plan</div>
          {(data?.byPlan || []).length === 0 ? (
            <div style={{ fontSize: 13, color: P.textMuted, padding: '12px 0' }}>No plan data</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                  <th style={{ padding: '6px 0', textAlign: 'left', fontWeight: 600, fontSize: 11, color: P.textMuted, textTransform: 'uppercase' }}>Plan</th>
                  <th style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, fontSize: 11, color: P.textMuted, textTransform: 'uppercase' }}>Orders</th>
                  <th style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, fontSize: 11, color: P.textMuted, textTransform: 'uppercase' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(data?.byPlan || []).map((p) => (
                  <tr key={p.planId} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>{p.planId}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{p.orderCount}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: P.success }}>{fmt(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Key metrics + coupon stats */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Key Metrics</div>
          <Row label="Payment Success Rate" bold>
            <Badge tone={(data?.paymentSuccessRate || 0) >= 90 ? 'success' : 'warning'}>
              {data?.paymentSuccessRate || 0}%
            </Badge>
          </Row>
          <Row label="Avg Revenue Per User" value={fmt(data?.avgRevenuePerUser)} bold />
          <Divider />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 4 }}>
            <Tag size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            Coupon Usage
          </div>
          <Row label="Orders with Coupons" value={data?.couponStats?.totalCouponOrders || 0} />
          <Row label="Total Discount Given" value={fmt(data?.couponStats?.totalDiscount)} />
          <Divider />
          {(data?.couponStats?.byCoupon || []).length === 0 ? (
            <div style={{ fontSize: 12, color: P.textMuted, padding: '4px 0' }}>No coupon usage</div>
          ) : (
            (data?.couponStats?.byCoupon || []).map((c) => (
              <Row key={c.couponCode} label={c.couponCode}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  {c.usageCount}× · {fmt(c.totalDiscount)} off
                </span>
              </Row>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function RevCard({ label, value, highlight }) {
  return (
    <Card
      style={{
        padding: 14,
        background: highlight ? P.brandLight : undefined,
        borderColor: highlight ? P.brand : undefined,
      }}
    >
      <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: highlight ? P.brandDark : P.textPrimary,
        }}
      >
        {value}
      </div>
    </Card>
  );
}
