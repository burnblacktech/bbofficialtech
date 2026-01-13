import React, { createContext, useContext, useState, useCallback } from 'react';
import documentService from '../services/api/documentService';
import { enterpriseLogger } from '../utils/logger';
import toast from 'react-hot-toast';

const DocumentContext = createContext();

export const useDocumentContext = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocumentContext must be used within a DocumentProvider');
    }
    return context;
};

export const DocumentProvider = ({ children }) => {
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResults, setUploadResults] = useState([]);
    const [error, setError] = useState(null);

    const categories = [
        { key: 'FORM_16', label: 'Form 16', icon: '📄', description: 'Salary certificate from employer' },
        { key: 'BANK_STATEMENT', label: 'Bank Statement', icon: '🏦', description: 'Bank account statements' },
        { key: 'INVESTMENT_PROOF', label: 'Investment Proof', icon: '📈', description: 'FD, Mutual Funds, 80C, etc.' },
        { key: 'RENT_RECEIPTS', label: 'Rent Receipts', icon: '🏠', description: 'House rent receipts for HRA' },
        { key: 'CAPITAL_GAINS', label: 'Capital Gains', icon: '💰', description: 'P&L statements from brokers' },
        { key: 'BUSINESS_INCOME', label: 'Business Income', icon: '🏢', description: 'Invoices, business expenses' },
        { key: 'HOUSE_PROPERTY', label: 'House Property', icon: '🏘️', description: 'Property tax, interest certificates' },
        { key: 'OTHER', label: 'Other', icon: '📎', description: 'Other supporting documents' },
    ];

    const loadDocuments = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await documentService.getUserDocuments(filters);
            setDocuments(response.data || []);
            enterpriseLogger.info('Documents loaded in context', { count: response.data?.length });
        } catch (err) {
            setError('Failed to load documents');
            enterpriseLogger.error('Load documents error', { error: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const response = await documentService.getDocumentStats();
            setStats(response.data);
        } catch (err) {
            enterpriseLogger.error('Load stats error', { error: err.message });
        }
    }, []);

    const uploadFiles = async (files, category, filingId = null, memberId = null) => {
        setUploading(true);
        setUploadProgress(0);
        setUploadResults([]);
        const results = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const response = await documentService.uploadFile(file, {
                        category,
                        filingId,
                        memberId,
                        onProgress: (progressEvent) => {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(((i / files.length) * 100) + (percent / files.length));
                        },
                    });
                    results.push({ file, result: response.data, success: true });
                } catch (err) {
                    results.push({ file, error: err.message, success: false });
                }
            }
            setUploadResults(results);
            await loadDocuments({ filingId, memberId });
            await loadStats();
            return results;
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const deleteDocument = async (documentId) => {
        try {
            await documentService.deleteDocument(documentId);
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            await loadStats();
            toast.success('Document deleted');
            return true;
        } catch (err) {
            toast.error('Failed to delete document');
            return false;
        }
    };

    const downloadDocument = async (documentId, originalFilename) => {
        try {
            window.open(`${process.env.REACT_APP_API_URL || ''}/api/documents/${documentId}/download`, '_blank');
            toast.success('Download started');
            return true;
        } catch (err) {
            toast.error('Failed to start download');
            return false;
        }
    };

    const clearUploadResults = () => setUploadResults([]);
    const clearError = () => setError(null);

    const getFilteredDocuments = (category = 'ALL') => {
        if (category === 'ALL') return documents;
        return documents.filter(doc => doc.category === category);
    };

    const getDocumentsByFiling = (filingId) => {
        return documents.filter(doc => doc.filingId === filingId);
    };

    const getDocumentsByMember = (memberId) => {
        return documents.filter(doc => doc.memberId === memberId);
    };

    const getStorageUsagePercentage = () => {
        if (!stats) return 0;
        return Math.min(100, Math.round((stats.totalSize / (100 * 1024 * 1024)) * 100)); // Assuming 100MB limit for now
    };

    const value = {
        documents,
        stats,
        categories,
        loading,
        uploading,
        uploadProgress,
        uploadResults,
        error,
        loadDocuments,
        loadStats,
        uploadFiles,
        deleteDocument,
        downloadDocument,
        clearUploadResults,
        clearError,
        getFilteredDocuments,
        getDocumentsByFiling,
        getDocumentsByMember,
        getStorageUsagePercentage,
        getSuccessfulUploads: () => uploadResults.filter(r => r.success),
        getFailedUploads: () => uploadResults.filter(r => !r.success),
    };

    return (
        <DocumentContext.Provider value={value}>
            {children}
        </DocumentContext.Provider>
    );
};
