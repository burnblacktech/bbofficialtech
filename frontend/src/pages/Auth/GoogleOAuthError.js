/**
 * Google OAuth Error — Shows error message and redirects to login
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, Button, Alert } from '../../components/ds';
import '../Filing/filing-flow.css';

export default function GoogleOAuthError() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const message = params.get('message') || 'Google authentication failed. Please try again.';

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 16px' }}>
      <Card style={{ textAlign: 'center', padding: 16 }}>
        <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Authentication Failed</div>
        <Alert variant="error">{message}</Alert>
      </Card>
      <Button variant="primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
        <ArrowLeft size={16} /> Back to Login
      </Button>
    </div>
  );
}
