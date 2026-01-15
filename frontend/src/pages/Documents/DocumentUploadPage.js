import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  File,
  FileText,
  Image,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import documentService from '../../services/documentService';
import incomeService from '../../services/incomeService';
import deductionService from '../../services/deductionService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';
import AutofillConfirmationModal from './components/AutofillConfirmationModal';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [autofillData, setAutofillData] = useState(null);
  const [showAutofillModal, setShowAutofillModal] = useState(false);

  // Fetch documents using React Query
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getUserDocuments({ financialYear: '2024-25' }),
    staleTime: 2 * 60 * 1000,
  });

  const documents = documentsData?.data || [];

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: ({ file, category }) => documentService.uploadFileWithProgress(file, category),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document uploaded successfully!');
      setUploading(false);
    },
    onError: () => {
      toast.error('Failed to upload document');
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId) => documentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document deleted successfully!');
    },
  });

  const processMutation = useMutation({
    mutationFn: (documentId) => documentService.processForm16(documentId),
    onSuccess: (data) => {
      setAutofillData(data.extractedData);
      setShowAutofillModal(true);
      setProcessingId(null);
    },
    onError: () => {
      toast.error('Failed to analyze document');
      setProcessingId(null);
    },
  });

  const handleAutofillConfirm = async () => {
    try {
      // 1. Save Salary Income
      if (autofillData.financial?.grossSalary) {
        await incomeService.createIncome({
          sourceType: 'salary',
          amount: autofillData.financial.grossSalary,
          financialYear: '2024-25',
          sourceData: {
            employerName: autofillData.employer?.name,
            employerTan: autofillData.employer?.tan,
            employerPan: autofillData.employer?.pan,
            tdsPaid: autofillData.financial.tds || 0,
            standardDeduction: autofillData.financial.standardDeduction || 50000,
          },
        });
      }

      // 2. Save Deductions
      if (autofillData.financial?.deductions80C) {
        await deductionService.createDeduction({
          section: '80C',
          amount: autofillData.financial.deductions80C,
          financialYear: '2024-25',
        });
      }
      if (autofillData.financial?.deductions80D) {
        await deductionService.createDeduction({
          section: '80D',
          amount: autofillData.financial.deductions80D,
          financialYear: '2024-25',
        });
      }

      toast.success('Data applied to your profile successfully!');
      setShowAutofillModal(false);
      navigate('/income');
    } catch (error) {
      toast.error('Failed to apply data');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files);
  };

  const handleFiles = async (files) => {
    setUploading(true);
    const file = files[0];
    let category = 'OTHER';
    if (file.name.toLowerCase().includes('form16')) category = 'FORM_16';
    else if (file.name.toLowerCase().includes('form26')) category = 'BANK_STATEMENT';
    uploadMutation.mutate({ file, category });
  };

  const getStatusIcon = (status) => {
    if (status === 'VERIFIED') return <CheckCircle size={16} color={tokens.colors.success[600]} />;
    if (status === 'SCANNING' || status === 'PENDING') return <Clock size={16} color={tokens.colors.warning[600]} />;
    return <AlertCircle size={16} color={tokens.colors.error[600]} />;
  };

  const getStatusColor = (status) => {
    if (status === 'VERIFIED') return 'success';
    if (status === 'SCANNING' || status === 'PENDING') return 'warning';
    return 'error';
  };

  const getFileIcon = (name) => {
    if (!name) return <File size={24} color={tokens.colors.neutral[600]} />;
    if (name.toLowerCase().endsWith('.pdf')) return <FileText size={24} color={tokens.colors.error[600]} />;
    if (name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) return <Image size={24} color={tokens.colors.info[600]} />;
    return <File size={24} color={tokens.colors.neutral[600]} />;
  };

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tokens.colors.neutral[50], padding: tokens.spacing.lg }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.md }}>
          Document Center
        </h1>

        <Card
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          style={{
            marginBottom: tokens.spacing.lg,
            border: `2px dashed ${dragActive ? tokens.colors.accent[600] : tokens.colors.neutral[300]}`,
            textAlign: 'center', padding: tokens.spacing.xl, opacity: uploading ? 0.6 : 1,
          }}
        >
          <input type="file" id="file-upload" onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <Upload size={48} color={tokens.colors.accent[600]} style={{ margin: '0 auto 16px' }} />
            <h3>{uploading ? 'Uploading...' : 'Upload Tax Documents'}</h3>
            <p style={{ color: tokens.colors.neutral[500], fontSize: tokens.typography.fontSize.sm }}>Drag & drop or click to browse</p>
          </label>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
          {documents.map((doc) => (
            <Card key={doc.id} padding="md">
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: tokens.colors.neutral[100], borderRadius: tokens.borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getFileIcon(doc.filename)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                    <h4 style={{ margin: 0 }}>{doc.filename}</h4>
                    <Badge variant={getStatusColor(doc.verificationStatus)} size="sm">
                      {getStatusIcon(doc.verificationStatus)} {doc.verificationStatus}
                    </Badge>
                  </div>
                  <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500], marginTop: '4px' }}>
                    {doc.category} • {Math.round(doc.sizeBytes / 1024)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                  {doc.category === 'FORM_16' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { setProcessingId(doc.id); processMutation.mutate(doc.id); }}
                      disabled={processingId === doc.id}
                    >
                      <Zap size={14} style={{ marginRight: '4px' }} />
                      {processingId === doc.id ? 'Analyzing...' : 'Magic Autofill'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}>
                    <Download size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(doc.id)}>
                    <Trash2 size={16} color={tokens.colors.error[600]} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AutofillConfirmationModal
        isOpen={showAutofillModal}
        onClose={() => setShowAutofillModal(false)}
        onConfirm={handleAutofillConfirm}
        data={autofillData}
        isLoading={processMutation.isLoading}
      />
    </div>
  );
};

export default DocumentUpload;

