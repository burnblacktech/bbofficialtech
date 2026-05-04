/**
 * Session Management — View and revoke active sessions
 */

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, LogOut, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../pages/Filing/filing-flow.css';

export default function SessionManagement() {
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

  const revokeAll = async () => {
    try {
      await api.post('/auth/sessions/logout-all');
      toast.success('All sessions revoked');
      setSessions([]);
    } catch { toast.error('Failed'); }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="step-title">Active Sessions</h1>
        {sessions.length > 1 && (
          <button className="ds-btn ds-btn-md ds-btn-secondary" onClick={revokeAll} style={{ fontSize: 12 }}>
            <LogOut size={14} /> Revoke All
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}><Loader2 size={24} className="animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <div className="step-card"><p style={{ color: '#6b7280', fontSize: 14 }}>No active sessions</p></div>
      ) : (
        sessions.map(s => (
          <div key={s.id} className="step-card" style={{ marginBottom: 8 }}>
            <div className="ds-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.deviceType === 'mobile' ? <Smartphone size={18} color="#6b7280" /> : <Monitor size={18} color="#6b7280" />}
                <div>
                  <div className="ds-item__name">{s.browser || 'Unknown'} on {s.os || 'Unknown'}</div>
                  <div className="ds-item__detail">{s.ipAddress} · {s.isCurrent ? 'Current session' : new Date(s.lastActive || s.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              {!s.isCurrent && (
                <button className="ds-btn ds-btn-sm ds-btn-danger" onClick={() => revoke(s.id)}><LogOut size={14} /></button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
