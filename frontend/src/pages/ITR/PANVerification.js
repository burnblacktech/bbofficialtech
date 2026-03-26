/**
 * PAN Verification — Verify PAN and proceed to filing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../Filing/filing-flow.css';

export default function PANVerification() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const existingPan = user?.panNumber || user?.pan || '';
  const isVerified = !!(user?.panVerified);

  const [pan, setPan] = useState(existingPan);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    const upper = pan.toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upper)) {
      toast.error('Invalid PAN format (e.g., ABCDE1234F)');
      return;
    }
    setVerifying(true);
    try {
      await api.patch('/auth/pan', { panNumber: upper });
      refreshProfile?.();
      toast.success('PAN verified');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Verification failed');
    } finally { setVerifying(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 className="step-title">PAN Verification</h1>
      <p className="step-desc">Verify your PAN to start filing</p>

      <div className="step-card editing">
        <div className="ff-field" style={{ position: 'relative' }}>
          <label className="ff-label">PAN Number</label>
          <input
            className="ff-input"
            type="text"
            value={pan}
            onChange={e => setPan(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            style={{ textTransform: 'uppercase' }}
            disabled={isVerified}
          />
          {isVerified && (
            <span style={{ position: 'absolute', right: 12, top: 30, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#16a34a' }}>
              <CheckCircle size={14} /> Verified
            </span>
          )}
        </div>

        {isVerified ? (
          <div className="step-card success" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#16a34a" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>PAN Verified</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{existingPan}</div>
              </div>
            </div>
          </div>
        ) : (
          <button className="ff-btn ff-btn-primary" onClick={handleVerify} disabled={verifying} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><Shield size={16} /> Verify PAN</>}
          </button>
        )}
      </div>

      <button className="ff-btn ff-btn-primary" onClick={() => navigate('/filing/start')} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
        Proceed to Filing <ArrowRight size={16} />
      </button>
    </div>
  );
}
