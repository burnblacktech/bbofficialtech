// =====================================================
// VERSION HISTORY COMPONENT
// Enhanced version history with comparison and restore
// =====================================================

import React, { useState } from 'react';
import { Clock, RotateCcw, Download, Share2, GitCompare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../../components/common/Button';
import VersionComparison from './version-comparison';
import { draftService } from '../services/draft.service';
import toast from 'react-hot-toast';

const VersionHistory = ({ filingId, draftType = 'itr_filing' }) => {
  const [showComparison, setShowComparison] = useState(false);
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['draftHistory', filingId, draftType],
    queryFn: () => draftService.getVersionHistory(filingId, draftType),
    enabled: !!filingId,
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId) => draftService.restoreVersion(filingId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['draft', filingId, draftType]);
      queryClient.invalidateQueries(['draftHistory', filingId, draftType]);
      toast.success('Version restored successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore version');
    },
  });

  const handleExport = (version) => {
    const dataStr = JSON.stringify(version.draft_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `draft-v${version.version}-${filingId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Version exported successfully');
  };

  const handleShare = (version) => {
    // Generate shareable link
    const shareUrl = `${window.location.origin}/draft/share/${version.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
        <p className="text-body-md text-gray-600 mt-4">Loading version history...</p>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-body-md text-gray-600">No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800">Version History</h3>
          <p className="text-body-sm text-gray-600 mt-1">
            {versions.length} version(s) available
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowComparison(!showComparison)}>
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Versions
        </Button>
      </div>

      {showComparison && (
        <VersionComparison versions={versions} onRestore={restoreVersion.mutate} />
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-heading-sm font-semibold text-gray-800">
                      Version {version.version}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-success-100 text-success-700 text-body-xs font-medium rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm text-gray-600">
                    {new Date(version.created_at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {version.created_by && (
                    <p className="text-body-sm text-gray-500 mt-1">
                      by {version.created_by}
                    </p>
                  )}
                  {version.description && (
                    <p className="text-body-sm text-gray-700 mt-2">{version.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(version)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(version)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {index !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreVersion.mutate(version.id)}
                      loading={restoreVersion.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;

