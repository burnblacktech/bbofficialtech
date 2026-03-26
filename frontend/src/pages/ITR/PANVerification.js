/**
 * PAN Verification — Verifies via SurePass API, shows name + DOB
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Loader2, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import P from '../../styles/palette';
import toast from 'react-hot-toast';
import '../Filing/filing-flow.css';

export default function PANVerification() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const existingPan = user?.panNumber || user?.pan || '';
  const isVerified = !!(user?.panVerified);

  const [pan, setPan] = useState(existingPan);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    const upper = pan.toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upper)) {
      toast.error('Invalid PAN format (e.g., ABCDE1234F)');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-pan', { pan: upper });
      setResult(res.data.data);
      refreshProfile?.();
      toast.success(res.data.message || 'PAN verified');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Verification failed');
    } finally { setVerifying(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button className="ff-btn ff-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, padding: '4px 0' }}>
        <ArrowLeft size={14} /> Dashboard
      </button>
      <h1 className="step-title">PAN Verification</h1>
      <p className="step-desc">Verify your PAN to start filing</p>

      <div className="step-card editing">
        <div className="ff-field" style={{ position: 'relative' }}>
          <label className="ff-label">PAN Number</label>
          <input
            className="ff-input"
            type="text"
            value={pan}
            onChange={e => { setPan(e.target.value.toUpperCase()); setResult(null); }}
            placeholder="ABCDE1234F"
            maxLength={10}
            style={{ textTransform: 'uppercase' }}
            disabled={isVerified && pan === existingPan}
          />
          {isVerified && pan === existingPan && (
            <span style={{ position: 'absolute', right: 12, top: 30, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: P.success }}>
              <CheckCircle size={14} /> Verified
            </span>
          )}
        </div>

        {!isVerified && (
          <button className="ff-btn ff-btn-primary" onClick={handleVerify} disabled={verifying} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying with SurePass...</> : <><Shield size={16} /> Verify PAN</>}
          </button>
        )}
      </div>

      {/* Verification result */}
      {(result || isVerified) && (
        <div className="step-card success">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={20} color={P.success} />
            <span style={{ fontSize: 15, fontWeight: 600, color: P.textPrimary }}>PAN Verified</span>
          </div>
          <div className="ff-row"><span className="ff-row-label">PAN</span><span className="ff-row-value bold">{result?.pan || existingPan}</span></div>
          {result?.name && (
            <>
              <div className="ff-row"><span className="ff-row-label">Name (as per PAN)</span><span className="ff-row-value">{result.name}</span></div>
              {user?.fullName && user.fullName !== result.name && (
                <div className="ff-hint" style={{ color: P.warning, marginTop: 4 }}>
                  Your profile name was "{user.fullName}" — updated to match PAN records.
                </div>
              )}
            </>
          )}
          {result?.dateOfBirth && <div className="ff-row"><span className="ff-row-label">Date of Birth</span><span className="ff-row-value">{result.dateOfBirth}</span></div>}
          {result?.source && <div className="ff-row"><span className="ff-row-label">Source</span><span className="ff-row-value" style={{ fontSize: 11, color: P.textLight }}>{result.source}</span></div>}
        </div>
      )}

      <button className="ff-btn ff-btn-primary" onClick={() => navigate('/filing/start')} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
        Proceed to Filing <ArrowRight size={16} />
      </button>
    </div>
  );
}
