import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import FilingEntrySelector from '../organisms/FilingEntrySelector';
import UploadZone from '../molecules/UploadZone';
import FormField from '../molecules/FormField';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import { tokens } from '../../styles/tokens';

const API_BASE_URL = getApiBaseUrl();

/**
 * StartFilingModal Component
 * Enhanced modal using new design system with FilingEntrySelector
 */
const StartFilingModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [creating, setCreating] = useState(false);

    // Filing method selection
    const [filingMethod, setFilingMethod] = useState(null); // 'upload', 'verified', 'manual'

    // User's verified PANs
    const [verifiedPans, setVerifiedPans] = useState([]);
    const [selectedPan, setSelectedPan] = useState(null);

    // New PAN verification
    const [newPan, setNewPan] = useState('');
    const [newPanDob, setNewPanDob] = useState('');

    // Form 16 upload
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // Assessment year
    const [assessmentYear, setAssessmentYear] = useState('2025-26');

    // Load verified PANs on mount
    useEffect(() => {
        if (isOpen) {
            fetchVerifiedPans();
        }
    }, [isOpen]);

    const fetchVerifiedPans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.get(`${API_BASE_URL}/user/verified-pans`, { headers });
            const pans = response.data.data || [];
            setVerifiedPans(pans);

            // Auto-select default PAN
            const defaultPan = pans.find(p => p.isDefault) || pans[0];
            if (defaultPan) {
                setSelectedPan(defaultPan.pan);
            }
        } catch (error) {
            console.error('Error fetching PANs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMethodSelect = (method) => {
        setFilingMethod(method);
    };

    const handleBack = () => {
        setFilingMethod(null);
        setUploadedFiles([]);
        setNewPan('');
        setNewPanDob('');
    };

    const handleVerifyNewPan = async () => {
        if (!newPan || newPan.length !== 10) {
            toast.error('Please enter a valid 10-character PAN');
            return;
        }

        try {
            setVerifying(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(
                `${API_BASE_URL}/user/verified-pans`,
                {
                    pan: newPan.toUpperCase(),
                    label: 'Self',
                },
                { headers },
            );

            if (response.data.success) {
                toast.success('PAN verified successfully!');
                setSelectedPan(newPan.toUpperCase());
                handleStartFiling();
            } else {
                toast.error(response.data.error || 'PAN verification failed');
            }
        } catch (error) {
            console.error('PAN verification error:', error);
            toast.error(error.response?.data?.error || 'Failed to verify PAN');
        } finally {
            setVerifying(false);
        }
    };

    const handleStartFiling = async () => {
        if (!selectedPan) {
            toast.error('Please select or verify a PAN');
            return;
        }

        try {
            setCreating(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(
                `${API_BASE_URL}/filings`,
                {
                    taxpayerPan: selectedPan,
                    assessmentYear,
                },
                { headers },
            );

            let filing = null;
            if (response.data.success && response.data.data) {
                filing = response.data.data;
            } else if (response.data.filing) {
                filing = response.data.filing;
            } else if (response.data.id) {
                filing = response.data;
            }

            if (filing && filing.id) {
                toast.success('Filing ready!');
                navigate(`/filing/${filing.id}/unified`);
                onClose();
            } else {
                toast.error('Failed to create filing');
            }
        } catch (error) {
            console.error('Create filing error:', error);
            toast.error(error.response?.data?.error || 'Failed to create filing');
        } finally {
            setCreating(false);
        }
    };

    const assessmentYears = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.xl,
                        boxShadow: tokens.shadows['2xl'],
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: tokens.spacing.lg,
                        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.xl,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                        }}>
                            {filingMethod ? 'Complete Your Details' : 'Start New Filing'}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                padding: tokens.spacing.sm,
                                borderRadius: tokens.borderRadius.lg,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                transition: tokens.transitions.base,
                            }}
                        >
                            <X size={20} color={tokens.colors.neutral[500]} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: tokens.spacing.lg }}>
                        {loading ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: `${tokens.spacing['2xl']} 0`,
                            }}>
                                <Loader2
                                    size={32}
                                    color={tokens.colors.accent[600]}
                                    style={{ animation: 'spin 0.6s linear infinite', marginBottom: tokens.spacing.md }}
                                />
                                <p style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    color: tokens.colors.neutral[600],
                                }}>
                                    Loading...
                                </p>
                            </div>
                        ) : !filingMethod ? (
                            <FilingEntrySelector
                                onSelect={handleMethodSelect}
                                verifiedPansCount={verifiedPans.length}
                            />
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBack}
                                    style={{ marginBottom: tokens.spacing.lg }}
                                >
                                    ← Back
                                </Button>

                                {/* Upload Form 16 */}
                                {filingMethod === 'upload' && (
                                    <div>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.lg,
                                            fontWeight: tokens.typography.fontWeight.semibold,
                                            marginBottom: tokens.spacing.md,
                                        }}>
                                            📄 Upload Your Form 16
                                        </h3>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            color: tokens.colors.neutral[600],
                                            marginBottom: tokens.spacing.lg,
                                        }}>
                                            We'll automatically extract your PAN, salary details, and TDS information.
                                        </p>
                                        <UploadZone
                                            onUpload={setUploadedFiles}
                                            accept=".pdf"
                                            maxSize={10 * 1024 * 1024}
                                            multiple={true}
                                        />
                                        {uploadedFiles.length > 0 && (
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                loading={creating}
                                                onClick={handleStartFiling}
                                                style={{ marginTop: tokens.spacing.lg }}
                                            >
                                                Continue with {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Verified PANs */}
                                {filingMethod === 'verified' && (
                                    <div>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.lg,
                                            fontWeight: tokens.typography.fontWeight.semibold,
                                            marginBottom: tokens.spacing.md,
                                        }}>
                                            Select Your PAN
                                        </h3>
                                        <div style={{ display: 'grid', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
                                            {verifiedPans.map((pan) => (
                                                <Card
                                                    key={pan.pan}
                                                    onClick={() => setSelectedPan(pan.pan)}
                                                    hoverable
                                                    style={{
                                                        border: selectedPan === pan.pan
                                                            ? `2px solid ${tokens.colors.accent[600]}`
                                                            : `1px solid ${tokens.colors.neutral[200]}`,
                                                        backgroundColor: selectedPan === pan.pan
                                                            ? tokens.colors.accent[50]
                                                            : tokens.colors.neutral.white,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{
                                                                fontSize: tokens.typography.fontSize.sm,
                                                                fontWeight: tokens.typography.fontWeight.semibold,
                                                                marginBottom: tokens.spacing.xs,
                                                            }}>
                                                                {pan.label}
                                                            </p>
                                                            {pan.name && (
                                                                <p style={{
                                                                    fontSize: tokens.typography.fontSize.sm,
                                                                    color: tokens.colors.neutral[700],
                                                                    marginBottom: tokens.spacing.xs,
                                                                }}>
                                                                    {pan.name}
                                                                </p>
                                                            )}
                                                            <p style={{
                                                                fontSize: tokens.typography.fontSize.xs,
                                                                color: tokens.colors.neutral[500],
                                                            }}>
                                                                {pan.pan}
                                                            </p>
                                                        </div>
                                                        {pan.isDefault && <Badge variant="success">Default</Badge>}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>

                                        <FormField label="Assessment Year" required>
                                            <select
                                                value={assessmentYear}
                                                onChange={(e) => setAssessmentYear(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: tokens.spacing.md,
                                                    borderRadius: tokens.borderRadius.lg,
                                                    border: `1px solid ${tokens.colors.neutral[300]}`,
                                                    fontSize: tokens.typography.fontSize.base,
                                                }}
                                            >
                                                {assessmentYears.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </FormField>

                                        <Button
                                            variant="primary"
                                            fullWidth
                                            loading={creating}
                                            onClick={handleStartFiling}
                                        >
                                            Start Filing
                                        </Button>
                                    </div>
                                )}

                                {/* Manual Entry */}
                                {filingMethod === 'manual' && (
                                    <div>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.lg,
                                            fontWeight: tokens.typography.fontWeight.semibold,
                                            marginBottom: tokens.spacing.md,
                                        }}>
                                            Enter Your PAN
                                        </h3>
                                        <FormField label="PAN Number" required hint="10-character alphanumeric">
                                            <Input
                                                value={newPan}
                                                onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                                                placeholder="ABCDE1234F"
                                                maxLength={10}
                                                fullWidth
                                            />
                                        </FormField>

                                        <FormField label="Date of Birth" required>
                                            <Input
                                                type="date"
                                                value={newPanDob}
                                                onChange={(e) => setNewPanDob(e.target.value)}
                                                fullWidth
                                            />
                                        </FormField>

                                        <FormField label="Assessment Year" required>
                                            <select
                                                value={assessmentYear}
                                                onChange={(e) => setAssessmentYear(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: tokens.spacing.md,
                                                    borderRadius: tokens.borderRadius.lg,
                                                    border: `1px solid ${tokens.colors.neutral[300]}`,
                                                    fontSize: tokens.typography.fontSize.base,
                                                }}
                                            >
                                                {assessmentYears.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </FormField>

                                        <Button
                                            variant="primary"
                                            fullWidth
                                            loading={verifying}
                                            onClick={handleVerifyNewPan}
                                        >
                                            Verify & Start Filing
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StartFilingModal;
