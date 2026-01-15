import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Bell, Shield, CreditCard, Settings } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const SettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <h1 style={{
                    fontSize: tokens.typography.fontSize['3xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Settings
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                }}>
                    Manage your profile and preferences
                </p>
            </div>

            {/* Settings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: tokens.spacing.lg }}>
                {[
                    { icon: User, title: 'My Profile', description: 'Personal information and PAN details', path: '/profile' },
                    { icon: Users, title: 'Family Members', description: 'Manage family members for filing', path: '/add-members' },
                    { icon: Bell, title: 'Notifications', description: 'Email and SMS preferences', path: '/notifications' },
                    { icon: Shield, title: 'Security & Sessions', description: 'Manage active sessions and security', path: '/sessions' },
                    { icon: Settings, title: 'Preferences', description: 'UI and locale settings', path: '/preferences' },
                ].map((setting) => {
                    const Icon = setting.icon;
                    return (
                        <div
                            key={setting.title}
                            onClick={() => navigate(setting.path)}
                            style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = tokens.colors.accent[600];
                                e.currentTarget.style.boxShadow = tokens.shadows.md;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.accent[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: tokens.spacing.md,
                            }}>
                                <Icon size={24} color={tokens.colors.accent[600]} />
                            </div>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                {setting.title}
                            </h3>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.neutral[600],
                            }}>
                                {setting.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SettingsPage;
