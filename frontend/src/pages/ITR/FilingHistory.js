// =====================================================
// FILING HISTORY PAGE - VIEW ALL ITR FILINGS
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useITR } from '../../contexts/ITRContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/DesignSystem/StatusBadge';
import { LoadingState } from '../../components/DesignSystem';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import InvoiceBadge from '../../components/ITR/InvoiceBadge';
import PauseResumeButton from '../../components/ITR/PauseResumeButton';
import { FileText, Eye, Download, Calendar, User, Building2, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import itrService from '../../services/api/itrService';
import { enterpriseLogger } from '../../utils/logger';

const FilingHistory = () => {
  const { user } = useAuth();
  const { loadFilings: loadFilingsFromContext } = useITR();
  const navigate = useNavigate();

  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ongoing', 'completed'
  const [assessmentYearFilter, setAssessmentYearFilter] = useState('all');

  const userRole = user?.role || 'END_USER';
  const isEndUser = userRole === 'END_USER';
  const isCA = ['CA', 'CA_FIRM_ADMIN', 'PREPARER', 'REVIEWER'].includes(userRole);
  const isAdmin = ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(userRole);

  useEffect(() => {
    loadFilings();
  }, []);

  const loadFilings = async () => {
    try {
      setLoading(true);
      const response = await itrService.getUserITRs({ status: filter !== 'all' ? filter : undefined });
      setFilings(response.filings || []);
    } catch (error) {
      console.error('Error loading filings:', error);
      toast.error('Failed to load filing history');
    } finally {
      setLoading(false);
    }
  };

  const handlePaused = (updatedFiling) => {
    setFilings(prev => prev.map(f => f.id === updatedFiling.id ? updatedFiling : f));
    loadFilings();
  };

  const handleResumed = (updatedFiling) => {
    setFilings(prev => prev.map(f => f.id === updatedFiling.id ? updatedFiling : f));
    // Navigate to computation page
    navigate(`/itr/computation?filingId=${updatedFiling.id}`, {
      state: { filing: updatedFiling },
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'success';
      case 'draft':
        return 'warning';
      case 'processing':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const ongoingStatuses = ['draft', 'paused'];
  const completedStatuses = ['submitted', 'acknowledged', 'processed', 'rejected'];

  // Get unique assessment years for filter
  const assessmentYears = [...new Set(filings.map(f => f.assessmentYear).filter(Boolean))].sort().reverse();

  const filteredFilings = filings.filter(filing => {
    // Tab filter
    if (activeTab === 'ongoing' && !ongoingStatuses.includes(filing.status)) {
      return false;
    }
    if (activeTab === 'completed' && !completedStatuses.includes(filing.status)) {
      return false;
    }

    // Status filter
    const matchesFilter = filter === 'all' || filing.status === filter;

    // Assessment year filter
    const matchesYear = assessmentYearFilter === 'all' || filing.assessmentYear === assessmentYearFilter;

    // Search filter
    const matchesSearch = filing.itrType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         filing.assessmentYear?.toString().includes(searchTerm) ||
                         (isCA && filing.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (isAdmin && filing.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesYear && matchesSearch;
  });

  const handleViewFiling = (filing) => {
    navigate(`/itr/computation?filingId=${filing.id}`, {
      state: { filing, viewMode: 'readonly' },
    });
  };

  const handleDownloadAcknowledgment = async (filing) => {
    try {
      if (!filing.acknowledgmentNumber && !filing.ackNumber) {
        toast.error('Acknowledgment not available for this filing');
        return;
      }

      // Download ITR-V/acknowledgment PDF (downloadAcknowledgment handles download internally)
      await itrService.downloadAcknowledgment(filing.id);
      toast.success('Acknowledgment downloaded successfully');
    } catch (error) {
      enterpriseLogger.error('Error downloading acknowledgment', { error });
      toast.error(error.response?.data?.error || 'Failed to download acknowledgment');
    }
  };

  const handleDownloadITR = async (filing) => {
    try {
      // Download filed ITR PDF
      const response = await itrService.downloadITR(filing.id);

      if (response.success) {
        toast.success('ITR downloaded successfully');
      } else {
        toast.error(response.error || 'Failed to download ITR');
      }
    } catch (error) {
      enterpriseLogger.error('Error downloading ITR', { error });
      toast.error(error.response?.data?.error || 'Failed to download ITR');
    }
  };

  const handleViewComputation = (filing) => {
    navigate(`/itr/computation?filingId=${filing.id}`, {
      state: { filing, viewMode: 'readonly' },
    });
  };

  const handleFileRevisedReturn = (filing) => {
    // Navigate to start filing with previous year data
    navigate('/itr/select-person', {
      state: {
        previousFilingId: filing.id,
        isRevisedReturn: true,
      },
    });
  };

  if (loading) {
    return (
      <div>
        <LoadingState message="Loading filing history..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Filing History
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage all your ITR filings
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by ITR type or assessment year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Tabs for Ongoing/Completed */}
              {isEndUser && (
                <div className="flex gap-2 border-b border-gray-200">
                  {['all', 'ongoing', 'completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-gold-500 text-gold-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Assessment Year Filter */}
                <select
                  value={assessmentYearFilter}
                  onChange={(e) => setAssessmentYearFilter(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Years</option>
                  {assessmentYears.map((year) => (
                    <option key={year} value={year}>
                      AY {year}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                {['all', 'draft', 'paused', 'submitted', 'processed', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'primary' : 'secondary'}
                    onClick={() => setFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Filings List */}
        {filteredFilings.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No filings found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {searchTerm || filter !== 'all'
                  ? 'No filings match your current filters'
                  : 'You haven\'t filed any ITR yet'
                }
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/itr/select-person')}
              >
                Start New Filing
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFilings.map((filing) => (
              <Card key={filing.id}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filing Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {filing.itrType} - AY {filing.assessmentYear}
                        </h3>
                        <FilingStatusBadge filing={filing} showInvoice={false} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(filing.createdAt).toLocaleDateString()}</span>
                        </div>

                        {filing.updatedAt && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>Updated: {new Date(filing.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* CA View: Client Info */}
                        {isCA && filing.client && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Client: {filing.client.name}</span>
                          </div>
                        )}

                        {/* Admin View: User Info */}
                        {isAdmin && filing.user && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>User: {filing.user.name}</span>
                          </div>
                        )}

                        {/* CA View: Review Status */}
                        {isCA && filing.reviewStatus && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>Review: {filing.reviewStatus}</span>
                          </div>
                        )}
                      </div>

                      {/* Invoice Badge */}
                      {filing.invoice && (
                        <div className="mt-2">
                          <InvoiceBadge invoice={filing.invoice} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {/* Pause/Resume Button (only for own filings) */}
                      {isEndUser && (filing.status === 'draft' || filing.status === 'paused') && (
                        <PauseResumeButton
                          filing={filing}
                          onPaused={handlePaused}
                          onResumed={handleResumed}
                        />
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => handleViewFiling(filing)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>

                      {/* Download buttons for completed filings */}
                      {completedStatuses.includes(filing.status) && (
                        <div className="flex flex-col gap-2">
                          {(filing.acknowledgmentNumber || filing.ackNumber) && (
                            <Button
                              variant="secondary"
                              onClick={() => handleDownloadAcknowledgment(filing)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download ITR-V
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => handleDownloadITR(filing)}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download ITR
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleViewComputation(filing)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Computation
                          </Button>
                          {filing.status === 'submitted' && (
                            <Button
                              variant="secondary"
                              onClick={() => handleFileRevisedReturn(filing)}
                              className="flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              File Revised Return
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};

export default FilingHistory;
