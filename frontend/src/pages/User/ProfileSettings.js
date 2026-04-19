/**
 * Profile Settings — Migrated to BurnBlack Design System
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Save, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState('profile');

  return (
    <Page title="Settings" maxWidth={640}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['profile', 'Profile', User], ['security', 'Security', Shield]].map(([k, label, Icon]) => (
          <Card
            key={k}
            variant={tab === k ? 'active' : 'default'}
            onClick={() => setTab(k)}
            style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', marginBottom: 0 }}
          >
            <Icon size={16} /> <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
          </Card>
        ))}
      </div>
      {tab === 'profile' ? <ProfileTab user={user} refreshProfile={refreshProfile} /> : <SecurityTab />}
    </Page>
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
  const nameLocked = panVerified;
  const dobLocked = panVerified && !!form.dateOfBirth;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { phone: form.phone, gender: form.gender || null };
      if (!nameLocked) updates.fullName = form.fullName;
      if (!dobLocked) updates.dateOfBirth = form.dateOfBirth || null;

      await api.put('/auth/profile', updates);
      if (!panVerified && form.panNumber && form.panNumber !== (user?.panNumber || user?.pan || '')) {
        await api.patch('/auth/pan', { panNumber: form.panNumber.toUpperCase() });
      }
      await refreshProfile?.();
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <Card variant="active">
        <Section title="Personal Information" icon={<User size={14} />}>
          <Grid cols={2}>
            <Input
              label="Full Name"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              locked={nameLocked}
              hint={nameLocked ? 'Verified via PAN — cannot be changed' : undefined}
            />
            <Input label="Email" value={user?.email || ''} locked type="email" />
          </Grid>
          <Grid cols={2}>
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" />
            <Input
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={v => setForm({ ...form, dateOfBirth: v })}
              locked={dobLocked}
              hint={dobLocked ? 'Verified via PAN' : undefined}
            />
          </Grid>
          <Input label="Gender" type="select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Input>
        </Section>
      </Card>

      <Card variant="active">
        <Section title="PAN Details" icon={<Shield size={14} />}>
          <div style={{ position: 'relative' }}>
            <Input
              label="PAN Number"
              value={form.panNumber}
              onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
              locked={panVerified}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
            {panVerified && (
              <Badge tone="success" icon={<CheckCircle size={12} />} style={{ position: 'absolute', right: 12, top: 28 }}>
                Verified
              </Badge>
            )}
          </div>
        </Section>
      </Card>

      <Button variant="primary" block loading={saving} onClick={handleSave}>
        <Save size={14} /> Save Profile
      </Button>
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
      <Card variant="active">
        <Section title="Change Password" icon={<Shield size={14} />}>
          <div style={{ position: 'relative' }}>
            <Input
              label="Current Password"
              type={showPw ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: 26, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', minHeight: 'auto', minWidth: 'auto' }}>
              <PwIcon size={16} />
            </button>
          </div>
          <Grid cols={2}>
            <Input
              label="New Password"
              type={showPw ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Min 8 characters"
            />
            <Input
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </Grid>
        </Section>
      </Card>

      <Button variant="primary" block loading={saving} onClick={handleSave}>
        <Shield size={14} /> Update Password
      </Button>
    </div>
  );
}
