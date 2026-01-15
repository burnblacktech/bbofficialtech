/**
 * Profile Questions Step
 * Second step: Collect basic profile information
 */

import React, { useState } from 'react';
import { User, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Card from '../../../components/atoms/Card';
import FormField from '../../../components/molecules/FormField';
import { tokens } from '../../../styles/tokens';

const ProfileQuestionsStep = ({ data, onNext, onBack }) => {
    const [profile, setProfile] = useState(data.profile || {
        isResident: true,
        age: 30,
        isDirector: false,
        hasForeignAssets: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ profile });
    };

    const RadioOption = ({ name, value, label, description, checked, onChange }) => (
        <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: tokens.spacing.md,
            border: `2px solid ${checked ? tokens.colors.accent[600] : tokens.colors.neutral[200]}`,
            borderRadius: tokens.borderRadius.md,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: checked ? `${tokens.colors.accent[600]}10` : tokens.colors.neutral.white,
        }}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                style={{
                    marginTop: '4px',
                    marginRight: tokens.spacing.sm,
                    accentColor: tokens.colors.accent[600],
                }}
            />
            <div>
                <div style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    {label}
                </div>
                {description && (
                    <div style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        {description}
                    </div>
                )}
            </div>
        </label>
    );

    return (
        <Card padding="xl">
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: `${tokens.colors.accent[600]}15`,
                    borderRadius: tokens.borderRadius.full,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: tokens.spacing.md,
                }}>
                    <User size={32} color={tokens.colors.accent[600]} />
                </div>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Tell us about yourself
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.neutral[600],
                }}>
                    This helps us determine the right ITR form for you
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Residency Status */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <FormField
                        label="Are you a resident of India?"
                        required
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                            <RadioOption
                                name="isResident"
                                value="true"
                                label="Yes, I'm a resident"
                                description="You lived in India for 182+ days in this financial year"
                                checked={profile.isResident === true}
                                onChange={() => setProfile({ ...profile, isResident: true })}
                            />
                            <RadioOption
                                name="isResident"
                                value="false"
                                label="No, I'm a non-resident"
                                description="You lived outside India for most of the year"
                                checked={profile.isResident === false}
                                onChange={() => setProfile({ ...profile, isResident: false })}
                            />
                        </div>
                    </FormField>
                </div>

                {/* Age Category */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <FormField
                        label="What is your age?"
                        required
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                            <RadioOption
                                name="age"
                                value="30"
                                label="Below 60 years"
                                checked={profile.age < 60}
                                onChange={() => setProfile({ ...profile, age: 30 })}
                            />
                            <RadioOption
                                name="age"
                                value="65"
                                label="60-80 years (Senior Citizen)"
                                description="Higher tax exemption limit"
                                checked={profile.age >= 60 && profile.age < 80}
                                onChange={() => setProfile({ ...profile, age: 65 })}
                            />
                            <RadioOption
                                name="age"
                                value="85"
                                label="Above 80 years (Super Senior Citizen)"
                                description="Highest tax exemption limit"
                                checked={profile.age >= 80}
                                onChange={() => setProfile({ ...profile, age: 85 })}
                            />
                        </div>
                    </FormField>
                </div>

                {/* Director Status */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <FormField
                        label="Are you a director in any company?"
                        required
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                            <RadioOption
                                name="isDirector"
                                value="false"
                                label="No"
                                checked={profile.isDirector === false}
                                onChange={() => setProfile({ ...profile, isDirector: false })}
                            />
                            <RadioOption
                                name="isDirector"
                                value="true"
                                label="Yes"
                                description="This affects ITR-1 eligibility"
                                checked={profile.isDirector === true}
                                onChange={() => setProfile({ ...profile, isDirector: true })}
                            />
                        </div>
                    </FormField>
                </div>

                {/* Foreign Assets */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <FormField
                        label="Do you have any foreign assets or income?"
                        required
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                            <RadioOption
                                name="hasForeignAssets"
                                value="false"
                                label="No"
                                checked={profile.hasForeignAssets === false}
                                onChange={() => setProfile({ ...profile, hasForeignAssets: false })}
                            />
                            <RadioOption
                                name="hasForeignAssets"
                                value="true"
                                label="Yes"
                                description="Foreign bank accounts, property, or income"
                                checked={profile.hasForeignAssets === true}
                                onChange={() => setProfile({ ...profile, hasForeignAssets: true })}
                            />
                        </div>
                    </FormField>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: tokens.spacing.sm,
                    justifyContent: 'space-between',
                }}>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={onBack}
                    >
                        <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                        Back
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                    >
                        Continue
                        <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default ProfileQuestionsStep;
