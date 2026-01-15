/**
 * ITR Determination Wizard
 * Multi-step wizard to determine appropriate ITR form
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import incomeService from '../../../services/incomeService';
import PANVerificationStep from './PANVerificationStep';
import ProfileQuestionsStep from './ProfileQuestionsStep';
import IncomeSourceStep from './IncomeSourceStep';
import ITRRecommendationStep from './ITRRecommendationStep';
import { tokens } from '../../../styles/tokens';

const STEPS = {
    PAN_VERIFICATION: 'pan',
    PROFILE_QUESTIONS: 'profile',
    INCOME_SOURCES: 'income',
    RECOMMENDATION: 'recommendation',
};

const ITRDeterminationWizard = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [currentStep, setCurrentStep] = useState(STEPS.PAN_VERIFICATION);
    const [isLoading, setIsLoading] = useState(true);
    const [wizardData, setWizardData] = useState({
        pan: user?.panNumber || profile?.panNumber || '',
        panName: user?.fullName || '',
        isPanVerified: !!(user?.panNumber || profile?.panNumber),
        profile: {
            isResident: true,
            age: 30,
            isDirector: false,
            hasForeignAssets: false,
            totalIncome: 0,
        },
        incomeSources: [],
        additionalInfo: {
            housePropertyCount: 0,
            hasPropertyLosses: false,
            businessTurnover: 0,
            wantsPresumptive: false,
            maintainsBooks: false,
        },
        determinationResult: null,
    });

    // Pre-fill income sources from dashboard
    useEffect(() => {
        const prefillData = async () => {
            try {
                // If user has PAN, we might want to start at Step 2 or just show Step 1 as verified
                // For now, let's keep it at Step 1 but show it's pre-filled.

                const summary = await incomeService.getIncomeSummary();
                if (summary && summary.breakdown) {
                    const sources = [];
                    if (summary.breakdown.salary > 0) sources.push('salary');
                    if (summary.breakdown.business > 0) sources.push('business');
                    if (summary.breakdown.houseProperty > 0) sources.push('house_property');
                    if (summary.breakdown.capitalGains > 0) sources.push('capital_gains');
                    if (summary.breakdown.otherSources > 0) sources.push('other');

                    setWizardData(prev => ({
                        ...prev,
                        incomeSources: sources,
                        profile: {
                            ...prev.profile,
                            totalIncome: summary.totalIncome || 0,
                        },
                    }));
                }
            } catch (error) {
                console.error('Failed to prefill ITR wizard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        prefillData();
    }, [incomeService]);

    const updateWizardData = (data) => {
        setWizardData(prev => ({ ...prev, ...data }));
    };

    const goToNextStep = () => {
        const stepOrder = Object.values(STEPS);
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
            setCurrentStep(stepOrder[currentIndex + 1]);
        }
    };

    const goToPreviousStep = () => {
        const stepOrder = Object.values(STEPS);
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(stepOrder[currentIndex - 1]);
        }
    };

    const getStepNumber = () => {
        const stepOrder = Object.values(STEPS);
        return stepOrder.indexOf(currentStep) + 1;
    };

    const renderStep = () => {
        if (isLoading) {
            return (
                <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
                    <p>Loading your profile details...</p>
                </div>
            );
        }

        switch (currentStep) {
            case STEPS.PAN_VERIFICATION:
                return (
                    <PANVerificationStep
                        data={wizardData}
                        onNext={(data) => {
                            updateWizardData(data);
                            goToNextStep();
                        }}
                        onCancel={() => navigate('/dashboard')}
                    />
                );

            case STEPS.PROFILE_QUESTIONS:
                return (
                    <ProfileQuestionsStep
                        data={wizardData}
                        onNext={(data) => {
                            updateWizardData(data);
                            goToNextStep();
                        }}
                        onBack={goToPreviousStep}
                    />
                );

            case STEPS.INCOME_SOURCES:
                return (
                    <IncomeSourceStep
                        data={wizardData}
                        onNext={(data) => {
                            updateWizardData(data);
                            goToNextStep();
                        }}
                        onBack={goToPreviousStep}
                    />
                );

            case STEPS.RECOMMENDATION:
                return (
                    <ITRRecommendationStep
                        data={wizardData}
                        onContinue={(filingId) => {
                            // Navigate to appropriate ITR flow
                            const itr = wizardData.determinationResult?.recommendedITR;
                            navigate(`/filing/${filingId}/itr-${itr?.toLowerCase()}`);
                        }}
                        onBack={goToPreviousStep}
                    />
                );

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
                {/* Progress Indicator */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: tokens.spacing.sm,
                    }}>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}>
                            Step {getStepNumber()} of 4
                        </span>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.accent[600],
                        }}>
                            {Math.round((getStepNumber() / 4) * 100)}% Complete
                        </span>
                    </div>
                    <div style={{
                        height: '8px',
                        backgroundColor: tokens.colors.neutral[200],
                        borderRadius: tokens.borderRadius.full,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${(getStepNumber() / 4) * 100}%`,
                            backgroundColor: tokens.colors.accent[600],
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>

                {/* Step Content */}
                {renderStep()}
            </div>
        </div>
    );
};

export default ITRDeterminationWizard;
