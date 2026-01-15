/**
 * Example: FilingEntrySelector Demo
 * Shows how to use the FilingEntrySelector component
 */

import React, { useState } from 'react';
import FilingEntrySelector from '../components/organisms/FilingEntrySelector';
import UploadZone from '../components/molecules/UploadZone';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import { tokens } from '../styles/tokens';

const FilingDemo = () => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleMethodSelect = (method) => {
        console.log('Selected method:', method);
        setSelectedMethod(method);
    };

    const handleFilesUpload = (files) => {
        console.log('Uploaded files:', files);
        setUploadedFiles(files);
    };

    const handleBack = () => {
        setSelectedMethod(null);
        setUploadedFiles([]);
    };

    if (!selectedMethod) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: tokens.colors.neutral[50],
                padding: tokens.spacing.xl,
            }}>
                <FilingEntrySelector
                    onSelect={handleMethodSelect}
                    verifiedPansCount={2} // Example: user has 2 verified PANs
                />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    style={{ marginBottom: tokens.spacing.lg }}
                >
                    ← Back
                </Button>

                {selectedMethod === 'upload' && (
                    <Card padding="lg">
                        <h2 style={{
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.semibold,
                            marginBottom: tokens.spacing.md,
                        }}>
                            📄 Upload Your Form 16
                        </h2>
                        <p style={{
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.neutral[600],
                            marginBottom: tokens.spacing.lg,
                        }}>
                            We'll automatically extract your PAN, salary details, and TDS information.
                        </p>
                        <UploadZone
                            onUpload={handleFilesUpload}
                            accept=".pdf"
                            maxSize={10 * 1024 * 1024}
                            multiple={true}
                        />
                        {uploadedFiles.length > 0 && (
                            <Button
                                variant="primary"
                                fullWidth
                                style={{ marginTop: tokens.spacing.lg }}
                            >
                                Continue with {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                            </Button>
                        )}
                    </Card>
                )}

                {selectedMethod === 'verified' && (
                    <Card padding="lg">
                        <h2 style={{
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.semibold,
                            marginBottom: tokens.spacing.md,
                        }}>
                            🔄 Select Your PAN
                        </h2>
                        <p style={{
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.neutral[600],
                        }}>
                            Choose which PAN you want to file for...
                        </p>
                    </Card>
                )}

                {selectedMethod === 'manual' && (
                    <Card padding="lg">
                        <h2 style={{
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.semibold,
                            marginBottom: tokens.spacing.md,
                        }}>
                            💬 Let's Get Started
                        </h2>
                        <p style={{
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.neutral[600],
                        }}>
                            I'll guide you through each step...
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default FilingDemo;
