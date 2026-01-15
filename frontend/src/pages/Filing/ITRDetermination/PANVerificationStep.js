/**
 * PAN Verification Step
 * First step: Verify PAN and fetch user details
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, ArrowRight, X, CheckCircle } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Card from '../../../components/atoms/Card';
import Input from '../../../components/atoms/Input';
import FormField from '../../../components/molecules/FormField';
import { tokens } from '../../../styles/tokens';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import memberService from '../../../services/memberService';
import { useNavigate } from 'react-router-dom';

const PANVerificationStep = ({ data, onNext, onCancel }) => {
    const navigate = useNavigate();
    const [pan, setPan] = useState(data.pan || '');
    const [error, setError] = useState('');
    const [isFamilyFiling, setIsFamilyFiling] = useState(false);
    const [familyMemberData, setFamilyMemberData] = useState({
        firstName: '',
        lastName: '',
        relationship: 'spouse',
        dateOfBirth: '',
    });

    // Member creation mutation
    const createMemberMutation = useMutation({
        mutationFn: async (memberData) => {
            // Verify PAN first
            await api.post('/api/user/verify-pan', { pan: memberData.panNumber });
            // Then create member
            return memberService.createMember(memberData);
        },
        onSuccess: (response) => {
            toast.success('Family member added & verified!');
            onNext({
                pan: pan.toUpperCase(),
                panName: `${familyMemberData.firstName} ${familyMemberData.lastName}`,
                filingFor: 'family',
                memberId: response.data.id,
            });
        },
        onError: (error) => {
            console.error('Member creation error:', error);
            setError(error.response?.data?.message || 'Failed to add family member');
            toast.error('Failed to add family member');
        },
    });

    // PAN verification mutation
    const verifyPANMutation = useMutation({
        mutationFn: async (panNumber) => {
            const response = await api.post('/api/user/verify-pan', {
                pan: panNumber,
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success('PAN verified successfully!');
            onNext({
                pan: pan.toUpperCase(),
                panName: response.data?.name || '',
            });
        },
        onError: (error) => {
            console.error('PAN verification error:', error);
            setError(error.response?.data?.message || 'Failed to verify PAN');
            toast.error('PAN verification failed');
        },
    });

    const validatePAN = (panNumber) => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(panNumber.toUpperCase());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!pan) {
            setError('PAN is required');
            return;
        }

        if (!validatePAN(pan)) {
            setError('Invalid PAN format (e.g., ABCDE1234F)');
            return;
        }

        if (isFamilyFiling) {
            // Validate family fields
            if (!familyMemberData.firstName || !familyMemberData.lastName) {
                setError('First and Last Name are required for family members');
                return;
            }

            createMemberMutation.mutate({
                ...familyMemberData,
                panNumber: pan.toUpperCase(),
                panVerified: true, // We verify as part of this flow
            });
        } else {
            verifyPANMutation.mutate(pan.toUpperCase());
        }
    };

    const handleSkipVerification = () => {
        // Allow skip for testing/demo
        if (validatePAN(pan)) {
            onNext({
                pan: pan.toUpperCase(),
                panName: 'User', // Default name
            });
        } else {
            setError('Please enter a valid PAN format');
        }
    };

    return (
        <Card padding="xl">
            <div style={{ textAlign: 'center', marginBottom: tokens.spacing.xl }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: `${tokens.colors.accent[600]}15`,
                    borderRadius: tokens.borderRadius.full,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    marginBottom: tokens.spacing.md,
                }}>
                    <Shield size={40} color={tokens.colors.accent[600]} />
                </div>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Verify Your PAN
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.neutral[600],
                }}>
                    We'll use your PAN to determine the right ITR form for you
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <div style={{ marginBottom: tokens.spacing.md }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.sm,
                            cursor: 'pointer',
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[700],
                            fontWeight: tokens.typography.fontWeight.medium,
                        }}>
                            <input
                                type="checkbox"
                                checked={isFamilyFiling}
                                onChange={(e) => setIsFamilyFiling(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: tokens.colors.accent[600] }}
                            />
                            File for a family member? (Add them instantly)
                        </label>
                    </div>

                    {isFamilyFiling && (
                        <div style={{
                            marginBottom: tokens.spacing.lg,
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.colors.neutral[50],
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.neutral[200]}`,
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
                                <FormField label="First Name" required>
                                    <Input
                                        value={familyMemberData.firstName}
                                        onChange={(e) => setFamilyMemberData({ ...familyMemberData, firstName: e.target.value })}
                                        placeholder="First Name"
                                    />
                                </FormField>
                                <FormField label="Last Name" required>
                                    <Input
                                        value={familyMemberData.lastName}
                                        onChange={(e) => setFamilyMemberData({ ...familyMemberData, lastName: e.target.value })}
                                        placeholder="Last Name"
                                    />
                                </FormField>
                            </div>
                            <FormField label="Relationship" required>
                                <select
                                    value={familyMemberData.relationship}
                                    onChange={(e) => setFamilyMemberData({ ...familyMemberData, relationship: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        borderRadius: tokens.borderRadius.md,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                >
                                    <option value="spouse">Spouse</option>
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="brother">Brother</option>
                                    <option value="sister">Sister</option>
                                    <option value="son">Son</option>
                                    <option value="daughter">Daughter</option>
                                    <option value="other">Other</option>
                                </select>
                            </FormField>
                        </div>
                    )}

                    <FormField
                        label="PAN Number"
                        required
                        error={error}
                        hint={isFamilyFiling ? `Enter ${familyMemberData.relationship}'s PAN` : (data.isPanVerified ? 'Verified in your profile' : 'Enter your 10-digit PAN (e.g., ABCDE1234F)')}
                    >
                        <div style={{ position: 'relative' }}>
                            <Input
                                type='text'
                                value={pan}
                                onChange={(e) => {
                                    setPan(e.target.value);
                                    setError('');
                                }}
                                placeholder='ABCDE1234F'
                                maxLength={10}
                                style={{
                                    textTransform: 'uppercase',
                                    paddingRight: data.isPanVerified ? '100px' : '10px',
                                }}
                                error={!!error}
                                disabled={verifyPANMutation.isPending || createMemberMutation.isPending || (data.isPanVerified && !isFamilyFiling)}
                            />
                            {!isFamilyFiling && data.isPanVerified && (
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    backgroundColor: tokens.colors.success[100],
                                    color: tokens.colors.success[700],
                                    padding: '2px 8px',
                                    borderRadius: tokens.borderRadius.full,
                                    fontSize: tokens.typography.fontSize.xs,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    <CheckCircle size={12} />
                                    Verified
                                </div>
                            )}
                        </div>
                    </FormField>
                </div>

                <div style={{
                    display: 'flex',
                    gap: tokens.spacing.sm,
                    justifyContent: 'space-between',
                }}>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={onCancel}
                        disabled={verifyPANMutation.isLoading}
                    >
                        <X size={20} style={{ marginRight: tokens.spacing.xs }} />
                        Cancel
                    </Button>
                    <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={handleSkipVerification}
                            disabled={verifyPANMutation.isLoading}
                        >
                            Skip Verification
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={verifyPANMutation.isPending || createMemberMutation.isPending}
                        >
                            {(verifyPANMutation.isPending || createMemberMutation.isPending) ? 'Verifying...' : (isFamilyFiling ? 'Add & Verify' : (data.isPanVerified ? 'Confirm & Continue' : 'Verify PAN'))}
                            {!(verifyPANMutation.isPending || createMemberMutation.isPending) && (
                                <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Info Box */}
            <div style={{
                marginTop: tokens.spacing.lg,
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.info[50],
                border: `1px solid ${tokens.colors.info[200]}`,
                borderRadius: tokens.borderRadius.md,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.info[700],
                    margin: 0,
                }}>
                    💡 <strong>Why verify PAN?</strong> We can prefill your data from Income Tax portal (Form 26AS, AIS) to make filing faster and more accurate.
                </p>
            </div>
        </Card>
    );
};

export default PANVerificationStep;
