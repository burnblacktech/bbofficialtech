/**
 * DocumentUploadZone Component
 * Reusable drag-and-drop file upload component with OCR processing
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import { tokens } from '../../styles/tokens';

const DocumentUploadZone = ({
    documentType = 'form16',
    onUploadComplete,
    onExtractedData,
    acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB = 10,
    title = 'Upload Document',
    description = 'Drag and drop or click to upload',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Upload failed');
            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Document uploaded successfully!');
            setUploadedFile(data.data);
            onUploadComplete?.(data.data);

            // If OCR data is available, pass it to parent
            if (data.data.ocrData) {
                onExtractedData?.(data.data.ocrData);
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Upload failed');
        },
    });

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndUpload(file);
        }
    }, []);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndUpload(file);
        }
    }, []);

    const validateAndUpload = (file) => {
        // Check file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!acceptedFormats.includes(fileExtension)) {
            toast.error(`Invalid file type. Accepted: ${acceptedFormats.join(', ')}`);
            return;
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
            return;
        }

        // Upload
        uploadMutation.mutate(file);
    };

    return (
        <Card padding="lg" style={{ border: `2px dashed ${isDragging ? tokens.colors.accent[600] : tokens.colors.neutral[300]}` }}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    textAlign: 'center',
                    padding: tokens.spacing.xl,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById(`file-input-${documentType}`).click()}
            >
                <input
                    id={`file-input-${documentType}`}
                    type="file"
                    accept={acceptedFormats.map(f => `.${f}`).join(',')}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {uploadMutation.isPending ? (
                    <div>
                        <Loader
                            size={48}
                            color={tokens.colors.accent[600]}
                            style={{ margin: '0 auto', marginBottom: tokens.spacing.md, animation: 'spin 1s linear infinite' }}
                        />
                        <p style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.sm }}>
                            Processing...
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                            Extracting data from your document
                        </p>
                    </div>
                ) : uploadedFile ? (
                    <div>
                        <CheckCircle
                            size={48}
                            color={tokens.colors.success[600]}
                            style={{ margin: '0 auto', marginBottom: tokens.spacing.md }}
                        />
                        <p style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.sm, color: tokens.colors.success[600] }}>
                            Upload Complete!
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.md }}>
                            {uploadedFile.fileName}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setUploadedFile(null);
                            }}
                        >
                            Upload Another
                        </Button>
                    </div>
                ) : (
                    <div>
                        <Upload
                            size={48}
                            color={tokens.colors.accent[600]}
                            style={{ margin: '0 auto', marginBottom: tokens.spacing.md }}
                        />
                        <p style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.sm }}>
                            {title}
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.md }}>
                            {description}
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500] }}>
                            Supported: {acceptedFormats.join(', ').toUpperCase()} • Max {maxSizeMB}MB
                        </p>
                    </div>
                )}
            </div>

            {uploadMutation.isError && (
                <div style={{
                    marginTop: tokens.spacing.md,
                    padding: tokens.spacing.sm,
                    backgroundColor: tokens.colors.error[50],
                    borderRadius: tokens.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.sm,
                }}>
                    <AlertCircle size={20} color={tokens.colors.error[600]} />
                    <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.error[700] }}>
                        {uploadMutation.error?.message || 'Upload failed'}
                    </span>
                </div>
            )}
        </Card>
    );
};

export default DocumentUploadZone;
