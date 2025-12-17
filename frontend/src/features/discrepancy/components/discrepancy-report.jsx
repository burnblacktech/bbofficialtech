// =====================================================
// DISCREPANCY REPORT COMPONENT
// Export and report discrepancies
// =====================================================

import React, { useState } from 'react';
import { Download, FileText, Mail, X } from 'lucide-react';
import Button from '../../../components/DesignSystem/components/Button';
import { useExportDiscrepancyPDF } from '../../pdf-export/hooks/use-pdf-export';
import PDFExportButton from '../../pdf-export/components/pdf-export-button';
import apiClient from '../../../services/core/APIClient';
import toast from 'react-hot-toast';

const DiscrepancyReport = ({ discrepancies = [], filingId }) => {
  const exportDiscrepancyPDF = useExportDiscrepancyPDF();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleExportPDF = () => {
    if (filingId) {
      exportDiscrepancyPDF.mutate({
        filingId,
        filename: `discrepancy-report-${filingId}.pdf`,
      });
    }
  };

  const handleExportExcel = () => {
    // Generate Excel report
    const csv = generateCSV(discrepancies);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discrepancy-report-${filingId}.csv`;
    a.click();
  };

  const handleEmailReport = () => {
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!filingId) {
      toast.error('Filing ID is required');
      return;
    }

    setIsSendingEmail(true);
    try {
      await apiClient.post(`/api/itr/filings/${filingId}/discrepancies/email`, {
        email,
      });
      toast.success('Discrepancy report email sent successfully');
      setShowEmailDialog(false);
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const generateCSV = (discrepancies) => {
    const headers = ['Field', 'Manual Value', 'Source Value', 'Difference', 'Severity', 'Source', 'Status'];
    const rows = discrepancies.map((d) => [
      d.field || '',
      d.manualValue || '',
      d.sourceValue || '',
      d.difference || '',
      d.severity || '',
      d.source || '',
      d.status || 'pending',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const stats = {
    total: discrepancies.length,
    critical: discrepancies.filter((d) => d.severity === 'critical').length,
    warning: discrepancies.filter((d) => d.severity === 'warning').length,
    info: discrepancies.filter((d) => d.severity === 'info').length,
    resolved: discrepancies.filter((d) => d.status === 'resolved').length,
    pending: discrepancies.filter((d) => d.status === 'pending').length,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-md text-gray-800">Discrepancy Report</h3>
          <p className="text-body-sm text-slate-600 mt-1">
            Export or share discrepancy report
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-body-sm text-slate-600">Total</p>
          <p className="text-heading-lg font-semibold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-error-50 rounded-xl p-4">
          <p className="text-body-sm text-error-600">Critical</p>
          <p className="text-heading-lg font-semibold text-error-800">{stats.critical}</p>
        </div>
        <div className="bg-warning-50 rounded-xl p-4">
          <p className="text-body-sm text-warning-600">Warning</p>
          <p className="text-heading-lg font-semibold text-warning-800">{stats.warning}</p>
        </div>
        <div className="bg-info-50 rounded-xl p-4">
          <p className="text-body-sm text-info-600">Info</p>
          <p className="text-heading-lg font-semibold text-info-800">{stats.info}</p>
        </div>
        <div className="bg-success-50 rounded-xl p-4">
          <p className="text-body-sm text-success-600">Resolved</p>
          <p className="text-heading-lg font-semibold text-success-800">{stats.resolved}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-body-sm text-slate-600">Pending</p>
          <p className="text-heading-lg font-semibold text-gray-800">{stats.pending}</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <PDFExportButton
          onExport={handleExportPDF}
          isLoading={exportDiscrepancyPDF.isPending}
          disabled={!filingId}
          label="Export as PDF"
          variant="outline"
          size="medium"
          className="w-full"
        />
        <Button variant="outline" onClick={handleExportExcel} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Export as Excel/CSV
        </Button>
        <Button variant="outline" onClick={handleEmailReport} className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Email Report
        </Button>
      </div>

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading-4 font-semibold text-slate-900">Email Discrepancy Report</h3>
              <button
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmail('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-body-regular font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !email}
                  className="flex-1"
                >
                  {isSendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailDialog(false);
                    setEmail('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyReport;

