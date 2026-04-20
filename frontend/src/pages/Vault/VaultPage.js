/**
 * VaultPage — Year-round document storage
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, Calendar, Loader2, Filter, FolderOpen } from 'lucide-react';
import { Page, Card, Button, Input, Grid, Section, Badge, Alert } from '../../components/ds';
import api from '../../services/api';
import { getFileableAYs } from '../../utils/assessmentYear';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

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

export default function VaultPage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [filter, setFilter] = useState({ fy: '', category: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: '', fy: FY_OPTIONS[0]?.value || '', expiryDate: '' });

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

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadForm.category);
      formData.append('fy', uploadForm.fy);
      if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);
      return (await api.post('/vault/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-docs'] });
      qc.invalidateQueries({ queryKey: ['vault-summary'] });
      toast.success('Document uploaded');
      setShowUpload(false);
      setUploadForm({ category: '', fy: FY_OPTIONS[0]?.value || '', expiryDate: '' });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Upload failed'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => api.delete(`/vault/documents/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vault-docs'] }); toast.success('Deleted'); },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && uploadForm.category) uploadMut.mutate(file);
    e.target.value = '';
  };

  const fmtSize = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  return (
    <Page title="Document Vault" subtitle="Upload and organize tax documents year-round" maxWidth={720}>
      {/* Summary */}
      {summary && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Badge tone="brand">{summary.totalDocuments} documents</Badge>
          <Badge tone="default">{fmtSize(summary.totalSizeBytes)}</Badge>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button variant="primary" onClick={() => setShowUpload(true)}><Upload size={14} /> Upload Document</Button>
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
        <Card variant="active">
          <Section title="Upload Document" icon={<Upload size={14} />}>
            <Grid cols={2}>
              <Input label="Category" required type="select" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Input>
              <Input label="Financial Year" required type="select" value={uploadForm.fy} onChange={e => setUploadForm({ ...uploadForm, fy: e.target.value })}>
                {FY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Input>
            </Grid>
            <Input label="Expiry Date (optional)" type="date" value={uploadForm.expiryDate} onChange={v => setUploadForm({ ...uploadForm, expiryDate: v })} hint="For insurance renewals, investment maturity, etc. You'll get a reminder 30 days before." />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" disabled={!uploadForm.category} loading={uploadMut.isPending} onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Choose File
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={handleFileSelect} style={{ display: 'none' }} />
            <div style={{ fontSize: 11, color: P.textLight, marginTop: 6 }}>Accepted: PDF, JPEG, PNG, HEIC · Max 10MB</div>
          </Section>
        </Card>
      )}

      {/* Document list */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color={P.textMuted} /></div>
      ) : docs.length === 0 ? (
        <Card variant="muted" style={{ textAlign: 'center', padding: 40 }}>
          <FolderOpen size={36} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: P.textSecondary }}>No documents yet</div>
          <div style={{ fontSize: 13, color: P.textMuted, marginTop: 4 }}>Upload your tax documents to keep them organized and ready for filing.</div>
        </Card>
      ) : (
        <div>
          {docs.map(doc => {
            const cat = CATEGORIES.find(c => c.value === doc.category);
            const isUsed = (doc.usedInFilings || []).length > 0;
            return (
              <Card key={doc.id} style={{ padding: '12px 16px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={16} style={{ color: cat?.color || P.textMuted }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary }}>{doc.fileName}</div>
                      <div style={{ fontSize: 11, color: P.textMuted }}>
                        {fmtSize(doc.fileSize)} · {doc.financialYear}
                        {doc.expiryDate && ` · Expires ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge tone={cat?.value === 'salary' ? 'success' : 'default'}>{cat?.label || doc.category}</Badge>
                    {isUsed && <Badge tone="brand">Used</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this document?')) deleteMut.mutate(doc.id); }}> {/* eslint-disable-line no-alert */}
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
