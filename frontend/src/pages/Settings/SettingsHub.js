/**
 * SettingsHub — Unified settings page with 5 tab sections
 * Profile, Security, Sessions, Data & Privacy, Notification Preferences
 * URL hash drives active tab (/settings#security), preserved on refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Shield, Monitor, Smartphone, Download, Trash2, Bell,
  Save, Eye, EyeOff, CheckCircle, LogOut, AlertTriangle, Loader2, Lock,
} from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'sessions', label: 'Sessions', icon: Monitor },
  { key: 'data', label: 'Data & Privacy', icon: Download },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const getTabFromHash = useCallback(() => {
    const hash = location.hash.replace('#', '');
    return TABS.find(t => t.key === hash)?.key || 'profile';
  }, [location.hash]);

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, [getTabFromHash]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const switchTab = (key) => {
    setActiveTab(key);
    navigate(`/settings#${key}`, { replace: true });
  };

  return (
    <Page title="Settings" subtitle="Manage your account preferences" maxWidth={720}>
      {/* Tab navigation */}
      {isMobile ? (
        <MobileAccordion activeTab={activeTab} switchTab={switchTab} user={user} refreshProfile={refreshProfile} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${P.borderLight}`, paddingBottom: 0 }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', fontSize: 13, fontWeight: activeTab === key ? 600 : 500,
                  color: activeTab === key ? P.brand : P.textMuted,
                  background: 'none', border: 'none', borderBottom: activeTab === key ? `2px solid ${P.brand}` : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 150ms', minHeight: 'auto',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <TabContent tab={activeTab} user={user} refreshProfile={refreshProfile} />
        </>
      )}
    </Page>
  );
}

/* ── Mobile Accordion Layout ── */
function MobileAccordion({ activeTab, switchTab, user, refreshProfile }) {
  return (
    <div>
      {TABS.map(({ key, label, icon: Icon }) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <button
            onClick={() => switchTab(activeTab === key ? 'profile' : key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 600,
              color: activeTab === key ? P.brand : P.textPrimary,
              background: activeTab === key ? P.brandLight : P.bgCard,
              border: `1px solid ${P.borderLight}`, borderRadius: 8,
              cursor: 'pointer', minHeight: 'auto',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={16} /> {label}
            </span>
            <span style={{ transform: activeTab === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }}>▾</span>
          </button>
          {activeTab === key && (
            <div style={{ padding: '12px 0' }}>
              <TabContent tab={key} user={user} refreshProfile={refreshProfile} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Tab Content Router ── */
function TabContent({ tab, user, refreshProfile }) {
  switch (tab) {
    case 'profile': return <ProfileSection user={user} refreshProfile={refreshProfile} />;
    case 'security': return <SecuritySection />;
    case 'sessions': return <SessionsSection />;
    case 'data': return <DataPrivacySection />;
    case 'notifications': return <NotificationPrefsSection />;
    default: return <ProfileSection user={user} refreshProfile={refreshProfile} />;
  }
}

/* ── Profile Section ── */
function ProfileSection({ user, refreshProfile }) {
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
              label="Full Name" value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              locked={nameLocked}
              hint={nameLocked ? 'Verified via PAN — cannot be changed' : undefined}
            />
            <Input label="Email" value={user?.email || ''} locked type="email" />
          </Grid>
          <Grid cols={2}>
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" />
            <Input
              label="Date of Birth" type="date" value={form.dateOfBirth}
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
              label="PAN Number" value={form.panNumber}
              onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
              locked={panVerified} placeholder="ABCDE1234F" maxLength={10}
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

/* ── Security Section ── */
function SecuritySection() {
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
              label="Current Password" type={showPw ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: 26, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', minHeight: 'auto', minWidth: 'auto' }}>
              <PwIcon size={16} />
            </button>
          </div>
          <Grid cols={2}>
            <Input
              label="New Password" type={showPw ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Min 8 characters"
            />
            <Input
              label="Confirm Password" type={showPw ? 'text' : 'password'}
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

/* ── Sessions Section ── */
function SessionsSection() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions || []);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const revoke = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      toast.success('Session revoked');
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { toast.error('Failed to revoke'); }
  };

  return (
    <div>
      <Card variant="active">
        <Section title="Active Sessions" icon={<Monitor size={14} />}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: P.textMuted, fontSize: 13 }}>No active sessions</div>
          ) : (
            sessions.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${P.borderLight}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.deviceType === 'mobile' ? <Smartphone size={16} color={P.textMuted} /> : <Monitor size={16} color={P.textMuted} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary }}>
                      {s.browser || 'Unknown'} on {s.os || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 11, color: P.textLight }}>
                      {s.ipAddress}{s.isCurrent ? ' · Current session' : ` · ${new Date(s.lastActive || s.createdAt).toLocaleDateString('en-IN')}`}
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button variant="ghost" size="sm" onClick={() => revoke(s.id)}>
                    <LogOut size={13} /> Revoke
                  </Button>
                )}
              </div>
            ))
          )}
        </Section>
      </Card>
    </div>
  );
}

/* ── Data & Privacy Section ── */
function DataPrivacySection() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/account/export/download', { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(res.data);
      a.download = 'burnblack_data_export.json';
      a.click();
      toast.success('Data exported');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.post('/account/delete');
      toast.success('Account deletion scheduled. You have 24 hours to cancel.');
      setShowDeleteConfirm(false);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <Card variant="active">
        <Section title="Export Your Data" icon={<Download size={14} />}>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
            Download all your filings, documents, and profile data as a JSON file.
          </p>
          <Button variant="primary" loading={exporting} onClick={handleExport}>
            <Download size={14} /> Download My Data
          </Button>
        </Section>
      </Card>

      <Card>
        <Section title="Delete Account" icon={<Trash2 size={14} />}>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
            Permanently delete your account and all associated data. PII will be anonymized.
            Filing records are retained for 7 years as required by law.
          </p>
          {!showDeleteConfirm ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} /> Delete My Account
            </Button>
          ) : (
            <Alert tone="error" icon={<AlertTriangle size={16} />} title="Are you sure?">
              <p style={{ margin: '0 0 12px' }}>
                This action cannot be undone after 24 hours. You will receive an email with a cancellation link.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
                  <Trash2 size={12} /> Yes, Delete Everything
                </Button>
              </div>
            </Alert>
          )}
        </Section>
      </Card>
    </div>
  );
}

/* ── Notification Preferences Section ── */
function NotificationPrefsSection() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get('/account/notification-preferences');
        setPrefs(res.data.data || { email: true, sms: false, deadlineReminders: true, filingUpdates: true, securityAlerts: true, marketingTips: false });
      } catch {
        setPrefs({ email: true, sms: false, deadlineReminders: true, filingUpdates: true, securityAlerts: true, marketingTips: false });
      } finally { setLoading(false); }
    };
    fetchPrefs();
  }, []);

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/account/notification-preferences', prefs);
      toast.success('Notification preferences saved');
    } catch { toast.error('Failed to save preferences'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 24 }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>;
  }

  const PREF_ITEMS = [
    { key: 'deadlineReminders', label: 'Filing Deadline Reminders', desc: 'Get notified before filing deadlines' },
    { key: 'filingUpdates', label: 'Filing Status Updates', desc: 'Updates when your filing status changes' },
    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Login attempts and session changes' },
    { key: 'marketingTips', label: 'Tax Tips & Insights', desc: 'Helpful tax-saving tips and updates' },
    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'sms', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
  ];

  return (
    <div>
      <Card variant="active">
        <Section title="Notification Preferences" icon={<Bell size={14} />}>
          {PREF_ITEMS.map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary }}>{label}</div>
                <div style={{ fontSize: 11, color: P.textLight }}>{desc}</div>
              </div>
              <button
                onClick={() => togglePref(key)}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: prefs?.[key] ? P.brand : P.borderMedium,
                  position: 'relative', transition: 'background 200ms', minHeight: 'auto', padding: 0,
                }}
                role="switch"
                aria-checked={!!prefs?.[key]}
                aria-label={label}
              >
                <span style={{
                  position: 'absolute', top: 2, left: prefs?.[key] ? 20 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </Section>
      </Card>
      <Button variant="primary" block loading={saving} onClick={handleSave}>
        <Save size={14} /> Save Preferences
      </Button>
    </div>
  );
}
