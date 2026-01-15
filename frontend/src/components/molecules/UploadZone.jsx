/**
 * UploadZone Component (Molecule)
 * Drag-and-drop file upload area
 */

import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import Button from '../atoms/Button';

const UploadZone = ({
    onUpload,
    accept = '.pdf',
    maxSize = 10 * 1024 * 1024, // 10MB
    multiple = false,
    disabled = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const validateFile = (file) => {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const acceptedTypes = accept.split(',').map(t => t.trim());

        if (!acceptedTypes.includes(fileExtension)) {
            return `File type not accepted. Please upload ${accept} files.`;
        }

        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
            return `File size exceeds ${maxSizeMB}MB limit.`;
        }

        return null;
    };

    const handleFiles = (newFiles) => {
        setError('');
        const fileArray = Array.from(newFiles);

        // Validate each file
        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // Update files
        const updatedFiles = multiple ? [...files, ...fileArray] : fileArray;
        setFiles(updatedFiles);
        onUpload?.(updatedFiles);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    };

    const handleFileInput = (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles.length > 0) {
            handleFiles(selectedFiles);
        }
    };

    const removeFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onUpload?.(updatedFiles);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const containerStyles = {
        border: `2px dashed ${error ? tokens.colors.error[600] :
                isDragging ? tokens.colors.accent[600] :
                    tokens.colors.neutral[300]
            }`,
        borderRadius: tokens.borderRadius.xl,
        padding: tokens.spacing['2xl'],
        textAlign: 'center',
        backgroundColor: isDragging ? tokens.colors.accent[50] : tokens.colors.neutral[50],
        transition: tokens.transitions.base,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
    };

    return (
        <div>
            <div
                style={containerStyles}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <Upload
                    size={48}
                    style={{
                        color: isDragging ? tokens.colors.accent[600] : tokens.colors.neutral[400],
                        marginBottom: tokens.spacing.md,
                    }}
                />

                <p
                    style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.medium,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.sm,
                    }}
                >
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>

                <p
                    style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                        marginBottom: tokens.spacing.md,
                    }}
                >
                    or click to browse
                </p>

                <p
                    style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[500],
                    }}
                >
                    Accepted: {accept} • Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
                    {multiple && ' • Multiple files allowed'}
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    disabled={disabled}
                    style={{ display: 'none' }}
                />
            </div>

            {error && (
                <p
                    style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.error[600],
                        marginTop: tokens.spacing.sm,
                    }}
                >
                    ⚠️ {error}
                </p>
            )}

            {files.length > 0 && (
                <div style={{ marginTop: tokens.spacing.lg }}>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.neutral[50],
                                borderRadius: tokens.borderRadius.lg,
                                marginBottom: tokens.spacing.sm,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                                <File size={20} color={tokens.colors.accent[600]} />
                                <div>
                                    <p
                                        style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            color: tokens.colors.neutral[900],
                                        }}
                                    >
                                        {file.name}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: tokens.typography.fontSize.xs,
                                            color: tokens.colors.neutral[500],
                                        }}
                                    >
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: tokens.spacing.sm,
                                    color: tokens.colors.neutral[500],
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UploadZone;
