/**
 * Profile Settings — MVP: name, email, PAN, password, DOB, gender
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Save, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../pages/Filing/filing-flow.css';

export default function ProfileSettings() {
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState('profile');

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="step-title">Settings</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['profile', 'Profile', User], ['security', 'Security', Shield]].map(([k, label, Icon]) => (
          <div key={k} className={`ff-option ${tab === k ? 'selected' : ''}`} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
            <Icon size={16} /> <span className="ff-option-label">{label}</span>
          </div>
        ))}
      </div>
      {tab === 'profile' ? <ProfileTab user={user} refreshProfile={refreshProfile} /> : <SecurityTab />}
    </div>
  );
}

function ProfileTab({ user, refreshProfile }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender: user?.gender || '',
    panNumber: user?.panNumber || user?.pan || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        panNumber: user.panNumber || user.pan || '',
      });
    }
  }, [user]);

  const panVerified = !!(user?.panVerified);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', {
        fullName: form.fullName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
      });
      // Save PAN separately if changed
      if (form.panNumber && form.panNumber !== (user?.panNumber || user?.pan || '')) {
        await api.patch('/auth/pan', { panNumber: form.panNumber.toUpperCase() });
      }
      refreshProfile?.();
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="step-card editing">
        <div className="ff-section-title">Personal Information</div>
        <div className="ff-grid-2">
          <F l="Full Name" v={form.fullName} c={v => setForm({ ...form, fullName: v })} t="text" />
          <F l="Email" v={user?.email || ''} c={() => {}} t="email" disabled />
        </div>
        <div className="ff-grid-2">
          <F l="Phone" v={form.phone} c={v => setForm({ ...form, phone: v })} t="tel" />
          <F l="Date of Birth" v={form.dateOfBirth} c={v => setForm({ ...form, dateOfBirth: v })} t="date" />
        </div>
        <div className="ff-field">
          <label className="ff-label">Gender</label>
          <select className="ff-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="step-card editing">
        <div className="ff-section-title">PAN Details</div>
        <div className="ff-field" style={{ position: 'relative' }}>
          <label className="ff-label">PAN Number</label>
          <input
            className="ff-input"
            type="text"
            value={form.panNumber}
            onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
            placeholder="ABCDE1234F"
            maxLength={10}
            style={{ textTransform: 'uppercase' }}
            disabled={panVerified}
          />
          {panVerified && (
            <span style={{ position: 'absolute', right: 12, top: 30, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#16a34a' }}>
              <CheckCircle size={14} /> Verified
            </span>
          )}
        </div>
      </div>

      <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Profile</>}
      </button>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/set-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const PwIcon = showPw ? EyeOff : Eye;

  return (
    <div>
      <div className="step-card editing">
        <div className="ff-section-title">Change Password</div>
        <div className="ff-field">
          <label className="ff-label">Current Password</label>
          <div style={{ position: 'relative' }}>
            <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><PwIcon size={16} /></button>
          </div>
        </div>
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">New Password</label>
            <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div className="ff-field">
            <label className="ff-label">Confirm Password</label>
            <input className="ff-input" type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
        </div>
      </div>
      <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
        {saving ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : <><Shield size={16} /> Update Password</>}
      </button>
    </div>
  );
}

const F = ({ l, v, c, t = 'text', disabled }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} disabled={disabled} style={disabled ? { background: '#f3f4f6', color: '#6b7280' } : {}} />
  </div>
);
