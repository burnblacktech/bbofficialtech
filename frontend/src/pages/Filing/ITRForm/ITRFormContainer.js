/**
 * ITR Form Container
 * Main container for ITR form filling with section navigation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Circle, Save, ArrowLeft } from 'lucide-react';
import { tokens } from '../../../styles/tokens';
import toast from 'react-hot-toast';
import newFilingService from '../../../services/newFilingService';

// Section components (to be created)
import PersonalInfoSection from './Sections/PersonalInfoSection';
import IncomeSection from './Sections/IncomeSection';
import DeductionsSection from './Sections/DeductionsSection';
import TaxComputationSection from './Sections/TaxComputationSection';
import BankDetailsSection from './Sections/BankDetailsSection';
import ReviewSubmitSection from './Sections/ReviewSubmitSection';

const SECTIONS = [
    { id: 'personal', label: 'Personal Information', component: PersonalInfoSection },
    { id: 'income', label: 'Income Details', component: IncomeSection },
    { id: 'deductions', label: 'Deductions', component: DeductionsSection },
    { id: 'tax', label: 'Tax Computation', component: TaxComputationSection },
    { id: 'bank', label: 'Bank Details', component: BankDetailsSection },
    { id: 'review', label: 'Review & Submit', component: ReviewSubmitSection },
];

const ITRFormContainer = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [currentSection, setCurrentSection] = useState('personal');
    const [formData, setFormData] = useState({});
    const [sectionStatus, setSectionStatus] = useState({});

    // Fetch filing data
    const { data: filing, isLoading } = useQuery({
        queryKey: ['filing', filingId],
        queryFn: () => newFilingService.getFiling(filingId),
        enabled: !!filingId,
    });

    // Auto-save mutation
    const autoSaveMutation = useMutation({
        mutationFn: (data) => newFilingService.updateFiling(filingId, data),
        onSuccess: () => {
            toast.success('Progress saved', { duration: 2000 });
        },
        onError: () => {
            toast.error('Failed to save progress');
        },
    });

    // Load form data from filing
    useEffect(() => {
        if (filing?.data) {
            setFormData(filing.data.formData || {});
            setSectionStatus(filing.data.sectionStatus || {});
        }
    }, [filing]);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (Object.keys(formData).length > 0) {
                autoSaveMutation.mutate({ formData, sectionStatus });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [formData, sectionStatus]);

    const updateFormData = (section, data) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...(prev[section] || {}), ...data },
        }));
    };

    const markSectionComplete = (sectionId) => {
        setSectionStatus(prev => ({
            ...prev,
            [sectionId]: 'complete',
        }));
    };

    const goToSection = (sectionId) => {
        // Save current progress before switching
        autoSaveMutation.mutate({ formData, sectionStatus });
        setCurrentSection(sectionId);
    };

    const goToNextSection = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === currentSection);
        if (currentIndex < SECTIONS.length - 1) {
            markSectionComplete(currentSection);
            goToSection(SECTIONS[currentIndex + 1].id);
        }
    };

    const goToPreviousSection = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === currentSection);
        if (currentIndex > 0) {
            goToSection(SECTIONS[currentIndex - 1].id);
        }
    };

    const getCurrentSectionComponent = () => {
        const section = SECTIONS.find(s => s.id === currentSection);
        if (!section) return null;

        const Component = section.component;
        return (
            <Component
                data={formData[currentSection] || {}}
                filingData={filing?.data}
                onUpdate={(data) => updateFormData(currentSection, data)}
                onNext={goToNextSection}
                onBack={goToPreviousSection}
                onComplete={() => markSectionComplete(currentSection)}
            />
        );
    };

    const completedSections = Object.values(sectionStatus).filter(s => s === 'complete').length;
    const progress = Math.round((completedSections / SECTIONS.length) * 100);

    if (isLoading) {
        return (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
                <p>Loading your ITR form...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            display: 'flex',
        }}>
            {/* Sidebar Navigation */}
            <div style={{
                width: '280px',
                backgroundColor: tokens.colors.neutral.white,
                borderRight: `1px solid ${tokens.colors.neutral[200]}`,
                padding: tokens.spacing.lg,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
            }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        color: tokens.colors.neutral[600],
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: tokens.typography.fontSize.sm,
                        marginBottom: tokens.spacing.lg,
                        padding: 0,
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <h2 style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.bold,
                    marginBottom: tokens.spacing.xs,
                }}>
                    ITR-{filing?.data?.determinedITR || '1'}
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    marginBottom: tokens.spacing.lg,
                }}>
                    FY 2024-25
                </p>

                {/* Progress */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: tokens.spacing.xs,
                    }}>
                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                            Progress
                        </span>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.accent[600],
                        }}>
                            {progress}%
                        </span>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: tokens.colors.neutral[100],
                        borderRadius: tokens.borderRadius.full,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            backgroundColor: tokens.colors.accent[600],
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>

                {/* Section Navigation */}
                <nav>
                    {SECTIONS.map((section, index) => {
                        const isComplete = sectionStatus[section.id] === 'complete';
                        const isCurrent = currentSection === section.id;

                        return (
                            <button
                                key={section.id}
                                onClick={() => goToSection(section.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: tokens.spacing.sm,
                                    padding: tokens.spacing.md,
                                    marginBottom: tokens.spacing.xs,
                                    backgroundColor: isCurrent ? `${tokens.colors.accent[600]}10` : 'transparent',
                                    border: isCurrent ? `1px solid ${tokens.colors.accent[600]}` : '1px solid transparent',
                                    borderRadius: tokens.borderRadius.md,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrent) {
                                        e.currentTarget.style.backgroundColor = tokens.colors.neutral[50];
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrent) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {isComplete ? (
                                    <CheckCircle2 size={20} color={tokens.colors.success[600]} />
                                ) : (
                                    <Circle size={20} color={tokens.colors.neutral[400]} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        fontWeight: isCurrent ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                                        color: isCurrent ? tokens.colors.accent[700] : tokens.colors.neutral[700],
                                    }}>
                                        {section.label}
                                    </div>
                                    <div style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.neutral[500],
                                    }}>
                                        Step {index + 1}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Auto-save indicator */}
                {autoSaveMutation.isLoading && (
                    <div style={{
                        marginTop: tokens.spacing.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[500],
                    }}>
                        <Save size={14} />
                        Saving...
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: tokens.spacing.xl }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {getCurrentSectionComponent()}
                </div>
            </div>
        </div>
    );
};

export default ITRFormContainer;
