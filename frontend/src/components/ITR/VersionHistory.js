// =====================================================
// VERSION HISTORY COMPONENT
// Displays version list with timestamps and changes
// =====================================================

import React, { useState, useEffect } from 'react';
import { History, Clock, User, RotateCcw, GitCompare, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const VersionHistory = ({ returnId, onRevert }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [comparingVersions, setComparingVersions] = useState(null);

  useEffect(() => {
    if (returnId) {
      fetchVersions();
    }
  }, [returnId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/itr/returns/${returnId}/versions`);
      if (response.data.success) {
        setVersions(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (versionId1, versionId2) => {
    try {
      const response = await apiClient.get(`/itr/versions/${versionId1}/compare/${versionId2}`);
      if (response.data.success) {
        setComparingVersions(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to compare versions');
    }
  };

  const handleRevert = async (versionId) => {
    if (!window.confirm('Are you sure you want to revert to this version? This will create a new version with this data.')) {
      return;
    }

    try {
      const response = await apiClient.post(`/itr/returns/${returnId}/revert/${versionId}`);
      if (response.data.success) {
        toast.success('Return reverted successfully');
        fetchVersions();
        if (onRevert) {
          onRevert(response.data.data);
        }
      }
    } catch (error) {
      toast.error('Failed to revert version');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-2" />
            <p className="text-body-regular text-slate-600">Loading version history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8 text-slate-500">
          <History className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p>No version history available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
          <History className="w-5 h-5 mr-2 text-blue-600" />
          Version History
        </h3>
        <span className="text-body-regular text-slate-500">{versions.length} versions</span>
      </div>

      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`border rounded-xl p-4 ${
              version.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-slate-900">
                    Version {version.versionNumber}
                  </span>
                  {version.isCurrent && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-body-small font-medium">
                      Current
                    </span>
                  )}
                  <span className="text-body-small text-slate-500">
                    {new Date(version.createdAt).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {version.changeSummary && (
                  <p className="text-body-regular text-slate-600 mb-2">{version.changeSummary}</p>
                )}

                <div className="flex items-center space-x-4 text-body-small text-slate-500">
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {version.creator?.firstName || 'Unknown'} {version.creator?.lastName || ''}
                  </span>
                  <span className="capitalize">{version.regime} Regime</span>
                  <span>AY {version.assessmentYear}</span>
                </div>

                {expandedVersion === version.id && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4 text-body-regular">
                      <div>
                        <span className="text-slate-600">Tax Liability:</span>
                        <span className="ml-2 font-semibold">
                          ₹{version.taxComputation?.finalTaxLiability?.toLocaleString('en-IN') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Taxable Income:</span>
                        <span className="ml-2 font-semibold">
                          ₹{version.taxComputation?.taxableIncome?.toLocaleString('en-IN') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {index > 0 && (
                  <button
                    onClick={() => handleCompare(versions[index - 1].id, version.id)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Compare with previous version"
                  >
                    <GitCompare className="w-4 h-4" />
                  </button>
                )}
                {!version.isCurrent && (
                  <button
                    onClick={() => handleRevert(version.id)}
                    className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                    title="Revert to this version"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {expandedVersion === version.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {comparingVersions && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Version Comparison</h4>
            <button
              onClick={() => setComparingVersions(null)}
              className="text-body-regular text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          <div className="space-y-2 text-body-regular">
            <p className="text-slate-600">
              Comparing Version {comparingVersions.version1.versionNumber} vs Version {comparingVersions.version2.versionNumber}
            </p>
            <p className="text-slate-600">
              {comparingVersions.summary.fieldsChanged} fields changed across {comparingVersions.summary.sectionsAffected.length} sections
            </p>
            {comparingVersions.changes.length > 0 && (
              <div className="mt-3 max-h-60 overflow-y-auto">
                {comparingVersions.changes.slice(0, 10).map((change, idx) => (
                  <div key={idx} className="py-1 text-body-small">
                    <span className="font-medium">{change.field}:</span>
                    <span className="text-error-600 ml-2">{JSON.stringify(change.oldValue)}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{JSON.stringify(change.newValue)}</span>
                  </div>
                ))}
                {comparingVersions.changes.length > 10 && (
                  <p className="text-body-small text-slate-500 mt-2">
                    ... and {comparingVersions.changes.length - 10} more changes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;

