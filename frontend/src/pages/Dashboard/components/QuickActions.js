import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../design-system';
import { FileText, Calculator, Upload, Clock, ArrowRight } from 'lucide-react';

const ACTIONS = [
  { icon: FileText, label: 'File ITR', desc: 'Start your return filing', path: '/filing/start', primary: true },
  { icon: Calculator, label: 'Tax Calculator', desc: 'Estimate your liability', path: '/finance' },
  { icon: Upload, label: 'Upload Form 16', desc: 'Import salary details', path: '/vault' },
  { icon: Clock, label: 'View History', desc: 'Past filings & status', path: '/filings/history' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="dash-v2__section-label">Quick Actions</div>
      <div className="dash-v2__actions-grid">
        {ACTIONS.map(({ icon: Icon, label, desc, path, primary }) => (
          <Card
            key={label}
            className="dash-v2__action-card"
            onClick={() => navigate(path)}
            style={primary ? { background: 'var(--bb-brand)', borderColor: 'var(--bb-brand)' } : undefined}
          >
            <div style={{ padding: 'var(--bb-space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ padding: 8, borderRadius: 'var(--bb-radius-md)', background: primary ? 'rgba(255,255,255,0.15)' : 'var(--bb-bg-elevated)' }}>
                  <Icon size={16} color={primary ? 'var(--bb-fg-inverse)' : 'var(--bb-fg-primary)'} />
                </div>
                <ArrowRight size={14} color={primary ? 'var(--bb-fg-inverse)' : 'var(--bb-fg-muted)'} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 'var(--bb-fs-sm)', fontWeight: 500, color: primary ? 'var(--bb-fg-inverse)' : 'var(--bb-fg-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--bb-fs-xs)', color: primary ? 'rgba(15,15,15,0.7)' : 'var(--bb-fg-muted)' }}>{desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
