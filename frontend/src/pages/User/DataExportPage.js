/**
 * DataExportPage — Export data or delete account
 */

import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { Page, Card, Button, Alert, Section } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DataExportPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/account/export/download', { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(res.data);
      a.download = 'burnblack_data_export.json';
      a.click();
      toast.success('Data exported');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.post('/account/delete');
      toast.success('Account deletion scheduled. You have 24 hours to cancel.');
      setShowDeleteConfirm(false);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <Page title="Your Data" subtitle="Export or delete your account data" maxWidth={520}>
      <Card variant="active">
        <Section title="Export Your Data" icon={<Download size={14} />}>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>
            Download all your filings, documents, and profile data as a JSON file.
            This includes all assessment years, tax computations, and uploaded documents.
          </p>
          <Button variant="primary" loading={exporting} onClick={handleExport}>
            <Download size={14} /> Download My Data
          </Button>
        </Section>
      </Card>

      <Card>
        <Section title="Delete Account" icon={<Trash2 size={14} />}>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>
            Permanently delete your account and all associated data. Your PII (name, email, phone, PAN)
            will be anonymized. Filing records are retained for the legally required period (7 years).
          </p>

          {!showDeleteConfirm ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} /> Delete My Account
            </Button>
          ) : (
            <Alert tone="error" icon={<AlertTriangle size={16} />} title="Are you sure?">
              <p style={{ margin: '0 0 12px' }}>
                This action cannot be undone after 24 hours. You will receive an email with a cancellation link.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
                  <Trash2 size={12} /> Yes, Delete Everything
                </Button>
              </div>
            </Alert>
          )}
        </Section>
      </Card>

      <Alert tone="info" icon={<Shield size={14} />} title="Data Security">
        Your data is encrypted at rest and in transit. We never share your data with third parties.
        Tax filing records are retained for 7 years as required by Indian tax law.
      </Alert>
    </Page>
  );
}
