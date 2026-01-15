/**
 * Refund Tracking Page
 * Track ITR refund status with timeline visualization
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  CheckCircle,
  Clock,
  Building2,
  FileText,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import { tokens } from '../../styles/tokens';

const RefundTracking = () => {
  const navigate = useNavigate();

  const refunds = [
    {
      year: '2023-24',
      amount: 12450,
      status: 'credited',
      filedDate: '2024-07-15',
      processedDate: '2024-08-20',
      creditedDate: '2024-08-25',
      bankAccount: 'HDFC Bank ****1234',
      timeline: [
        { step: 'ITR Filed', date: '2024-07-15', status: 'complete' },
        { step: 'ITR Verified', date: '2024-07-20', status: 'complete' },
        { step: 'Refund Processed', date: '2024-08-20', status: 'complete' },
        { step: 'Amount Credited', date: '2024-08-25', status: 'complete' },
      ],
    },
    {
      year: '2022-23',
      amount: 8200,
      status: 'credited',
      filedDate: '2023-07-20',
      processedDate: '2023-08-25',
      creditedDate: '2023-08-30',
      bankAccount: 'HDFC Bank ****1234',
      timeline: [
        { step: 'ITR Filed', date: '2023-07-20', status: 'complete' },
        { step: 'ITR Verified', date: '2023-07-25', status: 'complete' },
        { step: 'Refund Processed', date: '2023-08-25', status: 'complete' },
        { step: 'Amount Credited', date: '2023-08-30', status: 'complete' },
      ],
    },
  ];

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tokens.colors.neutral[50],
      padding: tokens.spacing.lg,
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: tokens.spacing.lg }}>
          <h1 style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing.xs,
          }}>
            Refund Tracking
          </h1>
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600],
          }}>
            Track your ITR refund status and payment details
          </p>
        </div>

        {/* Total Refunds Summary */}
        <Card padding="lg" style={{
          marginBottom: tokens.spacing.xl,
          background: `linear-gradient(135deg, ${tokens.colors.success[600]}, ${tokens.colors.success[700]})`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral.white,
                opacity: 0.9,
                marginBottom: tokens.spacing.xs,
              }}>
                Total Refunds Received
              </p>
              <p style={{
                fontSize: tokens.typography.fontSize['3xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.colors.neutral.white,
              }}>
                {formatCurrency(refunds.reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: tokens.borderRadius.full,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IndianRupee size={32} color={tokens.colors.neutral.white} />
            </div>
          </div>
        </Card>

        {/* Refund Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          {refunds.map((refund) => (
            <Card key={refund.year} padding="lg">
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: tokens.spacing.lg,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                    <h2 style={{
                      fontSize: tokens.typography.fontSize.xl,
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: tokens.colors.neutral[900],
                      margin: 0,
                    }}>
                      AY {refund.year}
                    </h2>
                    <Badge variant="success">
                      <CheckCircle size={14} />
                      <span style={{ marginLeft: tokens.spacing.xs }}>Credited</span>
                    </Badge>
                  </div>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                    Refund Amount: <span style={{ fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[700] }}>
                      {formatCurrency(refund.amount)}
                    </span>
                  </p>
                </div>
                <div style={{
                  padding: tokens.spacing.md,
                  backgroundColor: tokens.colors.success[50],
                  borderRadius: tokens.borderRadius.lg,
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                    Credited to
                  </p>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                    {refund.bankAccount}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: '40px' }}>
                {/* Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '12px',
                  bottom: '12px',
                  width: '2px',
                  backgroundColor: tokens.colors.success[200],
                }} />

                {/* Timeline Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
                  {refund.timeline.map((step, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      {/* Timeline Dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-32px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: tokens.borderRadius.full,
                        backgroundColor: step.status === 'complete' ? tokens.colors.success[600] : tokens.colors.neutral[300],
                        border: `3px solid ${tokens.colors.neutral.white}`,
                        boxShadow: tokens.shadows.sm,
                      }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                          <h3 style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            margin: 0,
                          }}>
                            {step.step}
                          </h3>
                          {step.status === 'complete' && (
                            <CheckCircle size={14} color={tokens.colors.success[600]} />
                          )}
                        </div>
                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                          {step.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Dates */}
              <div style={{
                marginTop: tokens.spacing.lg,
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius.md,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: tokens.spacing.md,
              }}>
                <div>
                  <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                    Filed Date
                  </p>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                    {refund.filedDate}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                    Processed Date
                  </p>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                    {refund.processedDate}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                    Credited Date
                  </p>
                  <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[700] }}>
                    {refund.creditedDate}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RefundTracking;
