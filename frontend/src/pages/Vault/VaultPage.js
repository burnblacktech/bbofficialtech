/**
 * VaultPage — Year-round document storage with card grid layout
 * 2 columns desktop, 1 mobile. Category color-coded badges,
 * expiry warnings, file size validation, filter by category/FY
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, Loader2, FolderOpen, AlertTriangle, Clock } from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge } from '../../components/ds';
import api from '../../services/api';
import { getFileableAYs } from '../../utils/assessmentYear';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

// Map vault categories to import document types
const CATEGORY_TO_IMPORT_TYPE = {
  salary: 'form16',
  tax_document: '26as',
};

const CATEGORIES = [
  { value: 'salary', label: 'Salary', color: '#059669' },
  { value: 'investments', label: 'Investments', color: '#7c3aed' },
  { value: 'insurance', label: 'Insurance', color: '#0891b2' },
  { value: 'rent', label: 'Rent', color: '#CA8A04' },
  { value: 'donations', label: 'Donations', color: '#dc2626' },
  { value: 'medical', label: 'Medical', color: '#0D9488' },
  { value: 'capital_gains', label: 'Capital Gains', color: '#6b7280' },
  { value: 'business', label: 'Business', color: '#D4AF37' },
  { value: 'other', label: 'Other', color: '#999' },
];

const FY_OPTIONS = getFileableAYs().map(ay => {
  const y = parseInt(ay.value);
  return { value: `${y - 1}-${String(y).slice(2)}`, label: `FY ${y - 1}-${String(y).slice(2)}` };
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function fmtSize(bytes) {
  if (!bytes) return '0 KB';
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function isExpiringSoon(expiryDate) {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate) - new Date();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

export default function VaultPage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [filter, setFilter] = useState({ fy: '', category: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: '', fy: FY_OPTIONS[0]?.value || '', expiryDate: '', description: '' });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['vault-docs', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.fy) params.set('fy', filter.fy);
      if (filter.category) params.set('category', filter.category);
      return (await api.get(`/vault/documents?${params}`)).data.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['vault-summary'],
    queryFn: async () => (await api.get('/vault/summary')).data.data,
  });

  // Check for active draft filings (used for import suggestion)
  const { data: filings = [] } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => {
      try {
        return (await api.get('/filings')).data.data || [];
      } catch { return []; }
    },
    staleTime: 60000,
  });

  const activeDraftFiling = filings.find(f => f.status === 'draft');

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadForm.category);
      formData.append('fy', uploadForm.fy);
      if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      return (await api.post('/vault/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
    },
    onSuccess: (uploadedDoc) => {
      qc.invalidateQueries({ queryKey: ['vault-docs'] });
      qc.invalidateQueries({ queryKey: ['vault-summary'] });
      toast.success('Document uploaded');
      setShowUpload(false);

      // Auto-suggest import if category maps to a known import type and draft filing exists
      const importType = CATEGORY_TO_IMPORT_TYPE[uploadForm.category];
      if (importType && activeDraftFiling) {
        // Check if user previously dismissed suggestion for this document
        const dismissed = uploadedDoc?.metadata?.dismissedImportSuggestions || [];
        if (!dismissed.includes(activeDraftFiling.id)) {
          toast(
            (t) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Import this document into your filing?</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      // Navigate to import flow — use window.location for simplicity
                      window.location.href = `/filing/${activeDraftFiling.id}/import?type=${importType}`;
                    }}
                    style={{ fontSize: 12, padding: '4px 12px', background: P.brand || '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Import
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      // Store dismissal in vault document metadata (best-effort)
                      if (uploadedDoc?.id) {
                        api.patch(`/vault/documents/${uploadedDoc.id}`, {
                          metadata: { dismissedImportSuggestions: [...dismissed, activeDraftFiling.id] },
                        }).catch(() => { /* best-effort */ });
                      }
                    }}
                    style={{ fontSize: 12, padding: '4px 12px', background: P.bgMuted || '#f3f4f6', color: P.textSecondary || '#6b7280', border: `1px solid ${P.borderLight || '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ),
            { duration: 10000, position: 'bottom-center' },
          );
        }
      }

      setUploadForm({ category: '', fy: FY_OPTIONS[0]?.value || '', expiryDate: '', description: '' });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Upload failed'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => api.delete(`/vault/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-docs'] });
      qc.invalidateQueries({ queryKey: ['vault-summary'] });
      toast.success('Document deleted');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must not exceed 10MB');
      e.target.value = '';
      return;
    }
    if (uploadForm.category) uploadMut.mutate(file);
    e.target.value = '';
  };

  return (
    <Page title="Document Vault" subtitle="Upload and organize tax documents year-round" maxWidth={800}>
      {/* Summary strip */}
      {summary && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Badge tone="brand">{summary.totalDocuments} documents</Badge>
          <Badge tone="default">{fmtSize(summary.totalSizeBytes)}</Badge>
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => setShowUpload(true)}>
          <Upload size={14} /> Upload Document
        </Button>
        <Input type="select" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })} style={{ width: 160 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Input>
        <Input type="select" value={filter.fy} onChange={e => setFilter({ ...filter, fy: e.target.value })} style={{ width: 140 }}>
          <option value="">All Years</option>
          {FY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Input>
      </div>

      {/* Upload form */}
      {showUpload && (
        <Card variant="active" style={{ marginBottom: 16 }}>
          <Section title="Upload Document" icon={<Upload size={14} />}>
            <Grid cols={2}>
              <Input label="Category" required type="select" value={uploadForm.category}
                onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Input>
              <Input label="Financial Year" required type="select" value={uploadForm.fy}
                onChange={e => setUploadForm({ ...uploadForm, fy: e.target.value })}>
                {FY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Input>
            </Grid>
            <Grid cols={2}>
              <Input label="Expiry Date (optional)" type="date" value={uploadForm.expiryDate}
                onChange={v => setUploadForm({ ...uploadForm, expiryDate: v })}
                hint="For insurance renewals, investment maturity, etc." />
              <Input label="Description (optional)" value={uploadForm.description}
                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Brief description" />
            </Grid>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" disabled={!uploadForm.category} loading={uploadMut.isPending}
                onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Choose File
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={handleFileSelect} style={{ display: 'none' }} />
            <div style={{ fontSize: 11, color: P.textLight, marginTop: 6 }}>Accepted: PDF, JPEG, PNG, HEIC · Max 10MB</div>
          </Section>
        </Card>
      )}

      {/* Document grid */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color={P.textMuted} /></div>
      ) : docs.length === 0 ? (
        <Card variant="muted" style={{ textAlign: 'center', padding: 40 }}>
          <FolderOpen size={36} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: P.textSecondary }}>No documents yet</div>
          <div style={{ fontSize: 13, color: P.textMuted, marginTop: 4 }}>
            Upload your tax documents to keep them organized and ready for filing.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))', gap: 12 }}
          className="vault-grid">
          <style>{`
            .vault-grid { grid-template-columns: repeat(2, 1fr) !important; }
            @media (max-width: 767px) { .vault-grid { grid-template-columns: 1fr !important; } }
          `}</style>
          {docs.map(doc => {
            const cat = CATEGORIES.find(c => c.value === doc.category);
            const isUsed = (doc.usedInFilings || []).length > 0;
            const expiringSoon = isExpiringSoon(doc.expiryDate);
            return (
              <Card key={doc.id} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <FileText size={20} style={{ color: cat?.color || P.textMuted, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      <Badge tone={cat?.value === 'salary' ? 'success' : 'default'}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cat?.color || P.textMuted, marginRight: 4 }} />
                        {cat?.label || doc.category}
                      </Badge>
                      {isUsed && <Badge tone="brand">Used in Filing</Badge>}
                      {expiringSoon && <Badge tone="warning" icon={<AlertTriangle size={10} />}>Expiring Soon</Badge>}
                    </div>
                    <div style={{ fontSize: 11, color: P.textLight, marginTop: 4 }}>
                      {fmtSize(doc.fileSize)} · {doc.financialYear} · {new Date(doc.createdAt || doc.uploadDate).toLocaleDateString('en-IN')}
                      {doc.expiryDate && ` · Expires ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (window.confirm('Delete this document?')) deleteMut.mutate(doc.id); /* eslint-disable-line no-alert */
                  }}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
