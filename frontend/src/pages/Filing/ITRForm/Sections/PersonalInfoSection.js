/**
 * Personal Information Section
 * Pre-filled from user profile with editable fields
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ArrowRight } from 'lucide-react';
import Card from '../../../../components/atoms/Card';
import Input from '../../../../components/atoms/Input';
import Button from '../../../../components/atoms/Button';
import FormField from '../../../../components/atoms/FormField';
import { tokens } from '../../../../styles/tokens';

const PersonalInfoSection = ({ data, filingData, onUpdate, onNext, onComplete }) => {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        pan: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
        },
        aadhaarLinked: false,
    });

    // Pre-fill from user profile
    useEffect(() => {
        setFormData({
            fullName: data.fullName || user?.fullName || '',
            pan: data.pan || filingData?.pan || user?.panNumber || '',
            dateOfBirth: data.dateOfBirth || user?.dateOfBirth || '',
            email: data.email || user?.email || '',
            phone: data.phone || user?.phone || '',
            address: data.address || profile?.address || {
                line1: '',
                line2: '',
                city: '',
                state: '',
                pincode: '',
            },
            aadhaarLinked: data.aadhaarLinked || false,
        });
    }, [data, user, profile, filingData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        onUpdate({ [field]: value });
    };

    const handleAddressChange = (field, value) => {
        const newAddress = { ...formData.address, [field]: value };
        setFormData(prev => ({ ...prev, address: newAddress }));
        onUpdate({ address: newAddress });
    };

    const handleNext = () => {
        onComplete();
        onNext();
    };

    const isValid = formData.fullName && formData.pan && formData.dateOfBirth && formData.email;

    return (
        <div>
            <h1 style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                marginBottom: tokens.spacing.xs,
            }}>
                Personal Information
            </h1>
            <p style={{
                fontSize: tokens.typography.fontSize.base,
                color: tokens.colors.neutral[600],
                marginBottom: tokens.spacing.xl,
            }}>
                Verify and update your personal details for ITR filing
            </p>

            <Card padding="lg">
                <div style={{ display: 'grid', gap: tokens.spacing.lg }}>
                    {/* Basic Info */}
                    <FormField label="Full Name" required>
                        <Input
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            placeholder="As per PAN card"
                        />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md }}>
                        <FormField label="PAN Number" required>
                            <Input
                                value={formData.pan}
                                onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                disabled
                                style={{ backgroundColor: tokens.colors.neutral[50] }}
                            />
                        </FormField>

                        <FormField label="Date of Birth" required>
                            <Input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                            />
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md }}>
                        <FormField label="Email" required>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="your.email@example.com"
                            />
                        </FormField>

                        <FormField label="Phone Number">
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="10-digit mobile number"
                                maxLength={10}
                            />
                        </FormField>
                    </div>

                    {/* Address */}
                    <div style={{
                        borderTop: `1px solid ${tokens.colors.neutral[100]}`,
                        paddingTop: tokens.spacing.lg,
                        marginTop: tokens.spacing.md,
                    }}>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            marginBottom: tokens.spacing.md,
                        }}>
                            Residential Address
                        </h3>

                        <div style={{ display: 'grid', gap: tokens.spacing.md }}>
                            <FormField label="Address Line 1">
                                <Input
                                    value={formData.address.line1}
                                    onChange={(e) => handleAddressChange('line1', e.target.value)}
                                    placeholder="Flat/House No., Building Name"
                                />
                            </FormField>

                            <FormField label="Address Line 2">
                                <Input
                                    value={formData.address.line2}
                                    onChange={(e) => handleAddressChange('line2', e.target.value)}
                                    placeholder="Street, Area, Locality"
                                />
                            </FormField>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: tokens.spacing.md }}>
                                <FormField label="City">
                                    <Input
                                        value={formData.address.city}
                                        onChange={(e) => handleAddressChange('city', e.target.value)}
                                        placeholder="City"
                                    />
                                </FormField>

                                <FormField label="State">
                                    <Input
                                        value={formData.address.state}
                                        onChange={(e) => handleAddressChange('state', e.target.value)}
                                        placeholder="State"
                                    />
                                </FormField>

                                <FormField label="Pincode">
                                    <Input
                                        value={formData.address.pincode}
                                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Aadhaar Status */}
                    <div style={{
                        padding: tokens.spacing.md,
                        backgroundColor: formData.aadhaarLinked ? `${tokens.colors.success[600]}10` : `${tokens.colors.warning[600]}10`,
                        borderRadius: tokens.borderRadius.md,
                        fontSize: tokens.typography.fontSize.sm,
                    }}>
                        {formData.aadhaarLinked ? (
                            <span style={{ color: tokens.colors.success[700] }}>✓ Aadhaar linked with PAN</span>
                        ) : (
                            <span style={{ color: tokens.colors.warning[700] }}>⚠ Aadhaar not linked (Required for e-verification)</span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Navigation */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: tokens.spacing.xl,
            }}>
                <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={!isValid}
                    icon={<ArrowRight size={16} />}
                    iconPosition="right"
                >
                    Continue to Income Details
                </Button>
            </div>
        </div>
    );
};

export default PersonalInfoSection;
