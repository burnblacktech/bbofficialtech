/**
 * PaymentHistory — Shows all user payment orders with receipt download
 */

import { useQuery } from '@tanstack/react-query';
import { Download, Receipt, Loader2, AlertCircle } from 'lucide-react';
import { Page, Card, Badge, Button, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmt = (paise) => `₹${(Number(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const STATUS_TONE = {
  paid: 'success',
  created: 'default',
  failed: 'error',
  refunded: 'warning',
  expired: 'default',
};

export default function PaymentHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payments/history').then((r) => r.data.data),
  });

  const handleDownloadReceipt = async (orderId) => {
    try {
      const res = await api.get(`/payments/${orderId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  return (
    <Page title="Payment History" subtitle="All your filing payments and invoices" maxWidth={800}>
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: '#999' }} />
        </div>
      )}

      {error && (
        <Alert tone="error" icon={<AlertCircle size={16} />} title="Error">
          Failed to load payment history. Please try again.
        </Alert>
      )}

      {data && data.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#666' }}>
            <Receipt size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No payments yet</p>
          </div>
        </Card>
      )}

      {data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((order) => (
            <Card key={order.orderId} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{order.planName}</span>
                    <Badge tone={STATUS_TONE[order.status] || 'default'}>{order.status}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {order.assessmentYear && <span>AY {order.assessmentYear}</span>}
                    <span>{fmt(order.totalAmount)}</span>
                    {order.discount > 0 && <span style={{ color: '#16A34A' }}>Discount: {fmt(order.discount)}</span>}
                    {order.invoiceNumber && <span>#{order.invoiceNumber}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {order.paidAt
                      ? new Date(order.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {order.status === 'paid' && (
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(order.orderId)}>
                    <Download size={14} style={{ marginRight: 4 }} /> Receipt
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
