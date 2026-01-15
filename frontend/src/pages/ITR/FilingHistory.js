/**
 * Filing History Page
 * View all past ITR filings with status and details
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  IndianRupee,
  Filter,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import { tokens } from '../../styles/tokens';

const FilingHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filings = [
    {
      id: 1,
      year: '2023-24',
      filedDate: '2024-07-15',
      status: 'verified',
      itrForm: 'ITR-1',
      income: 850000,
      refund: 12450,
      refundStatus: 'received',
      acknowledgementNo: 'ITR1234567890',
    },
    {
      id: 2,
      year: '2022-23',
      filedDate: '2023-07-20',
      status: 'verified',
      itrForm: 'ITR-1',
      income: 780000,
      refund: 8200,
      refundStatus: 'received',
      acknowledgementNo: 'ITR0987654321',
    },
    {
      id: 3,
      year: '2021-22',
      filedDate: '2022-07-25',
      status: 'verified',
      itrForm: 'ITR-1',
      income: 720000,
      refund: 5600,
      refundStatus: 'received',
      acknowledgementNo: 'ITR1122334455',
    },
    {
      id: 4,
      year: '2020-21',
      filedDate: '2021-07-30',
      status: 'verified',
      itrForm: 'ITR-1',
      income: 650000,
      taxPaid: 2500,
      refundStatus: 'tax-paid',
      acknowledgementNo: 'ITR5544332211',
    },
  ];

  const getStatusIcon = (status) => {
    if (status === 'verified') return <CheckCircle size={16} />;
    if (status === 'pending') return <Clock size={16} />;
    return <AlertCircle size={16} />;
  };

  const getStatusColor = (status) => {
    if (status === 'verified') return 'success';
    if (status === 'pending') return 'warning';
    return 'error';
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tokens.colors.neutral[50],
      padding: tokens.spacing.lg,
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing.lg,
        }}>
          <div>
            <h1 style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing.xs,
            }}>
              Filing History
            </h1>
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600],
            }}>
              View and manage your past ITR filings
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Filter size={16} style={{ marginRight: tokens.spacing.xs }} />
            Filter
          </Button>
        </div>

        {/* Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.xl,
        }}>
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
              <FileText size={20} color={tokens.colors.accent[600]} />
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                Total Filings
              </span>
            </div>
            <p style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
            }}>
              {filings.length}
            </p>
          </Card>

          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
              <IndianRupee size={20} color={tokens.colors.success[600]} />
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                Total Refunds
              </span>
            </div>
            <p style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.success[700],
            }}>
              {formatCurrency(filings.reduce((sum, f) => sum + (f.refund || 0), 0))}
            </p>
          </Card>

          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
              <CheckCircle size={20} color={tokens.colors.info[600]} />
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                Verified
              </span>
            </div>
            <p style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
            }}>
              {filings.filter(f => f.status === 'verified').length}
            </p>
          </Card>
        </div>

        {/* Filing Timeline */}
        <div>
          <h2 style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing.md,
          }}>
            Filing Timeline
          </h2>

          <div style={{ position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '24px',
              top: '24px',
              bottom: '24px',
              width: '2px',
              backgroundColor: tokens.colors.neutral[200],
            }} />

            {/* Filing Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
              {filings.map((filing, index) => (
                <div key={filing.id} style={{ position: 'relative', paddingLeft: '60px' }}>
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '24px',
                    width: '16px',
                    height: '16px',
                    borderRadius: tokens.borderRadius.full,
                    backgroundColor: filing.status === 'verified' ? tokens.colors.success[600] : tokens.colors.warning[600],
                    border: `3px solid ${tokens.colors.neutral.white}`,
                    boxShadow: tokens.shadows.sm,
                  }} />

                  <Card padding="lg">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: tokens.spacing.md,
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                          <h3 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                            margin: 0,
                          }}>
                            AY {filing.year}
                          </h3>
                          <Badge variant={getStatusColor(filing.status)}>
                            {getStatusIcon(filing.status)}
                            <span style={{ marginLeft: tokens.spacing.xs }}>
                              {filing.status}
                            </span>
                          </Badge>
                        </div>
                        <div style={{
                          fontSize: tokens.typography.fontSize.sm,
                          color: tokens.colors.neutral[600],
                          display: 'flex',
                          gap: tokens.spacing.md,
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
                            <Calendar size={14} />
                            Filed on {filing.filedDate}
                          </span>
                          <span>•</span>
                          <span>{filing.itrForm}</span>
                          <span>•</span>
                          <span>ACK: {filing.acknowledgementNo}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={14} />
                        </Button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: tokens.spacing.md,
                      padding: tokens.spacing.md,
                      backgroundColor: tokens.colors.neutral[50],
                      borderRadius: tokens.borderRadius.md,
                    }}>
                      <div>
                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                          Total Income
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                          {formatCurrency(filing.income)}
                        </p>
                      </div>

                      {filing.refund && (
                        <div>
                          <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                            Refund
                          </p>
                          <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                            {formatCurrency(filing.refund)}
                          </p>
                        </div>
                      )}

                      {filing.taxPaid && (
                        <div>
                          <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                            Tax Paid
                          </p>
                          <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.error[600] }}>
                            {formatCurrency(filing.taxPaid)}
                          </p>
                        </div>
                      )}

                      <div>
                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                          Refund Status
                        </p>
                        <Badge variant={filing.refundStatus === 'received' ? 'success' : 'neutral'} size="sm">
                          {filing.refundStatus === 'received' ? 'Received' : 'Tax Paid'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilingHistory;
