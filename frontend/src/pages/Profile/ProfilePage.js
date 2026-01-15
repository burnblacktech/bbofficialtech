/**
 * Profile Page
 * User profile and settings management
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    Shield,
    Bell,
    Lock,
    Edit,
    Save,
    X,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import Tabs from '../../components/molecules/Tabs';
import { tokens } from '../../styles/tokens';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || 'Vivek Kumar',
        email: user?.email || 'vivek@example.com',
        phone: '+91 9876543210',
        dob: '15/03/1990',
        pan: 'ABCDE1234F',
        address: '123, MG Road, Mumbai, Maharashtra - 400001',
    });

    const tabs = [
        { id: 'personal', label: 'Personal Info' },
        { id: 'security', label: 'Security' },
        { id: 'notifications', label: 'Notifications' },
    ];

    const handleSave = () => {
        setIsEditing(false);
        // Save logic here
    };

    const renderPersonalInfo = () => (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing.lg,
            }}>
                <h2 style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900],
                }}>
                    Personal Information
                </h2>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit size={14} style={{ marginRight: tokens.spacing.xs }} />
                        Edit
                    </Button>
                ) : (
                    <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            <X size={14} style={{ marginRight: tokens.spacing.xs }} />
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSave}>
                            <Save size={14} style={{ marginRight: tokens.spacing.xs }} />
                            Save
                        </Button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                <FormField label="Full Name" icon={User}>
                    <Input
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        disabled={!isEditing}
                        fullWidth
                    />
                </FormField>

                <FormField label="Email Address" icon={Mail}>
                    <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                        fullWidth
                    />
                </FormField>

                <FormField label="Phone Number" icon={Phone}>
                    <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        fullWidth
                    />
                </FormField>

                <FormField label="Date of Birth" icon={Calendar}>
                    <Input
                        value={profileData.dob}
                        onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                        disabled={!isEditing}
                        fullWidth
                    />
                </FormField>

                <FormField label="PAN Number" icon={CreditCard}>
                    <Input
                        value={profileData.pan}
                        disabled
                        fullWidth
                    />
                    <p style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[500],
                        marginTop: tokens.spacing.xs,
                    }}>
                        PAN cannot be changed. Contact support if needed.
                    </p>
                </FormField>

                <FormField label="Address" icon={MapPin}>
                    <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: tokens.spacing.sm,
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[900],
                            backgroundColor: isEditing ? tokens.colors.neutral.white : tokens.colors.neutral[50],
                            border: `1px solid ${tokens.colors.neutral[300]}`,
                            borderRadius: tokens.borderRadius.md,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                        }}
                    />
                </FormField>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div>
            <h2 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing.lg,
            }}>
                Security Settings
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                <Card padding="md" style={{ border: `1px solid ${tokens.colors.neutral[200]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                                <Lock size={18} color={tokens.colors.accent[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Password
                                </h3>
                            </div>
                            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                Last changed 3 months ago
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change Password
                        </Button>
                    </div>
                </Card>

                <Card padding="md" style={{ border: `1px solid ${tokens.colors.neutral[200]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                                <Shield size={18} color={tokens.colors.success[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Two-Factor Authentication
                                </h3>
                                <Badge variant="success" size="sm">Enabled</Badge>
                            </div>
                            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                Extra security for your account
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Manage
                        </Button>
                    </div>
                </Card>

                <Card padding="md" style={{ border: `1px solid ${tokens.colors.neutral[200]}` }}>
                    <div>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.sm,
                        }}>
                            Active Sessions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                            <div style={{
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.neutral[50],
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[900] }}>
                                        Chrome on Windows
                                    </p>
                                    <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                                        Mumbai, India • Active now
                                    </p>
                                </div>
                                <Badge variant="success" size="sm">Current</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div>
            <h2 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing.lg,
            }}>
                Notification Preferences
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {[
                    { title: 'Filing Reminders', description: 'Get notified about filing deadlines', enabled: true },
                    { title: 'Refund Updates', description: 'Track your refund status', enabled: true },
                    { title: 'Document Uploads', description: 'Notifications when documents are processed', enabled: true },
                    { title: 'Marketing Emails', description: 'Tips and updates about tax filing', enabled: false },
                ].map((item, index) => (
                    <Card key={index} padding="md" style={{ border: `1px solid ${tokens.colors.neutral[200]}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    {item.description}
                                </p>
                            </div>
                            <label style={{
                                position: 'relative',
                                display: 'inline-block',
                                width: '44px',
                                height: '24px',
                            }}>
                                <input
                                    type="checkbox"
                                    defaultChecked={item.enabled}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: item.enabled ? tokens.colors.accent[600] : tokens.colors.neutral[300],
                                    borderRadius: tokens.borderRadius.full,
                                    transition: '0.3s',
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        height: '18px',
                                        width: '18px',
                                        left: item.enabled ? '23px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: tokens.colors.neutral.white,
                                        borderRadius: tokens.borderRadius.full,
                                        transition: '0.3s',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return renderPersonalInfo();
            case 'security':
                return renderSecurity();
            case 'notifications':
                return renderNotifications();
            default:
                return null;
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Profile Settings
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Profile Card */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.lg }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: tokens.borderRadius.full,
                            background: `linear-gradient(135deg, ${tokens.colors.accent[600]}, ${tokens.colors.accent[700]})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral.white,
                        }}>
                            {profileData.fullName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                {profileData.fullName}
                            </h2>
                            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                {profileData.email}
                            </p>
                            <Badge variant="success">Verified Account</Badge>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {/* Tab Content */}
                <Card padding="lg">
                    {renderTabContent()}
                </Card>
            </div>
        </div>
    );
};

export default Profile;
