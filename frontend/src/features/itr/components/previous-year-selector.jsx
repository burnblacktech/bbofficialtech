// =====================================================
// PREVIOUS YEAR SELECTOR COMPONENT
// Display and select available previous year filings
// =====================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Calendar, FileText, CheckCircle, AlertCircle, Loader, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAvailablePreviousYears } from '../hooks/use-previous-year-copy';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PreviousYearSelector = ({ userId: propUserId, memberId: propMemberId = null, currentAssessmentYear: propAssessmentYear = '2024-25', onSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedFilingId, setSelectedFilingId] = useState(null);

  // Get userId from props, location state, auth context, or localStorage
  const userId = propUserId || location.state?.userId || user?.id || user?.user_id || localStorage.getItem('userId');
  const memberId = propMemberId || location.state?.memberId || null;
  const currentAssessmentYear = propAssessmentYear || location.state?.currentAssessmentYear || '2024-25';

  const { data, isLoading, error, refetch } = useAvailablePreviousYears(
    userId,
    memberId,
    currentAssessmentYear,
  );

  const previousYears = data?.previousYears || [];

  const handleSelect = (filingId) => {
    setSelectedFilingId(filingId);
  };

  const handleProceed = () => {
    if (!selectedFilingId) {
      toast.error('Please select a previous year filing');
      return;
    }

    if (onSelect) {
      onSelect(selectedFilingId);
    } else {
      // Navigate to preview page
      navigate('/itr/previous-year-preview', {
        state: {
          sourceFilingId: selectedFilingId,
          userId,
          memberId,
          currentAssessmentYear,
          selectedPerson: location.state?.selectedPerson,
          dataSource: location.state?.dataSource,
        },
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      acknowledged: { color: 'bg-green-100 text-green-800', label: 'Acknowledged' },
      processed: { color: 'bg-purple-100 text-purple-800', label: 'Processed' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-gold-500 mr-3" />
            <span className="text-body-md text-gray-600">Loading previous year filings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-heading-sm text-error-900 mb-1">Error Loading Previous Years</h3>
                <p className="text-body-sm text-error-700 mb-4">{error.message || 'Failed to load previous year filings'}</p>
                <button
                  onClick={() => refetch()}
                  className="text-sm font-medium text-error-600 hover:text-error-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (previousYears.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-heading-2xl text-gray-900 mb-2">Copy from Previous Year</h1>
            <p className="text-body-md text-gray-600">
              Select a previous year filing to copy data from
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-heading-md text-gray-900 mb-2">No Previous Filings Found</h3>
            <p className="text-body-sm text-gray-600 mb-6">
              You don't have any submitted or acknowledged ITR filings from previous years.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/itr/computation', { state: { dataSource: 'manual' } })}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-body-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-heading-2xl text-gray-900 mb-2">Copy from Previous Year</h1>
          <p className="text-body-md text-gray-600">
            Select a previous year filing to copy data from. You can choose which sections to copy later.
          </p>
        </div>

        {/* Previous Year List */}
        <div className="space-y-4 mb-8">
          {previousYears.map((filing) => {
            const isSelected = selectedFilingId === filing.filingId;

            return (
              <button
                key={filing.filingId}
                onClick={() => handleSelect(filing.filingId)}
                className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 text-green-600">
                    <Copy className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-heading-md text-gray-900">
                        Assessment Year {filing.assessmentYear}
                      </h3>
                      {getStatusBadge(filing.status)}
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-gold-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center text-body-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        {filing.itrType}
                      </div>
                      <div className="flex items-center text-body-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Submitted: {formatDate(filing.submittedAt)}
                      </div>
                    </div>
                    {filing.summary && (
                      <div className="text-body-xs text-gray-500">
                        {filing.summary.name} • PAN: {filing.summary.pan}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        {selectedFilingId && (
          <div className="mb-8 bg-info-50 border border-info-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-heading-sm text-info-900 mb-1">What happens next?</h3>
                <p className="text-body-sm text-info-700">
                  You'll be able to preview the data from this filing, select which sections to copy,
                  review and edit the values, and then apply them to your current filing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!selectedFilingId}
            className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousYearSelector;

