/**
 * E-Verification — Placeholder for post-submission e-verification
 */

import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Card, Button, Alert } from '../../components/ds';

export default function EVerification() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 className="step-title">E-Verification</h1>
      <p className="step-desc">Verify your filed ITR with the Income Tax Department</p>

      <Alert variant="info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#D4AF37" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Coming Soon</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              E-verification via Aadhaar OTP, net banking, or DSC will be available after ERI integration is complete.
            </div>
          </div>
        </div>
      </Alert>

      <Button variant="secondary" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>
    </div>
  );
}
