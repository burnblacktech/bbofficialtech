import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Clock, AlertCircle, CheckCircle, RotateCcw, Trash2, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// =====================================================
// DRAFT MANAGEMENT SYSTEM - AUTOSAVE & VERSIONING
// Based on verified ITR blueprint and enterprise standards
// =====================================================

// Draft Management Hook
export const useDraftManagement = (filingId, draftType = 'itr_filing') => {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Fetch draft data
  const { data: draft, isLoading, error } = useQuery({
    queryKey: ['draft', filingId, draftType],
    queryFn: async () => {
      const response = await api.get(`/drafts/${filingId}?type=${draftType}`);
      return response.data.draft;
    },
    enabled: !!filingId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (draftData) => {
      const response = await api.post('/drafts', {
        filing_id: filingId,
        draft_type: draftType,
        draft_data: draftData,
        version: draft?.version ? draft.version + 1 : 1,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setIsDirty(false);
      setLastSaved(new Date());
      setIsSaving(false);
      queryClient.invalidateQueries(['draft', filingId, draftType]);
      toast.success('Draft saved successfully');
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error('Failed to save draft: ' + error.message);
    },
  });

  // Auto-save functionality
  const autoSave = useCallback((draftData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (isDirty && !isSaving) {
        setIsSaving(true);
        saveDraftMutation.mutate(draftData);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [isDirty, isSaving, saveDraftMutation]);

  // Manual save
  const saveDraft = useCallback((draftData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveDraftMutation.mutate(draftData);
  }, [saveDraftMutation]);

  // Update draft data
  const updateDraft = useCallback((updates) => {
    setIsDirty(true);
    const updatedData = { ...draft?.draft_data, ...updates };
    autoSave(updatedData);
    return updatedData;
  }, [draft?.draft_data, autoSave]);

  // Lock draft
  const lockDraft = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/drafts/${filingId}/lock`);
      return response.data;
    },
    onSuccess: (data) => {
      setIsLocked(true);
      setLockedBy(data.lockedBy);
      toast.success('Draft locked successfully');
    },
    onError: (error) => {
      toast.error('Failed to lock draft: ' + error.message);
    },
  });

  // Unlock draft
  const unlockDraft = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/drafts/${filingId}/unlock`);
      return response.data;
    },
    onSuccess: () => {
      setIsLocked(false);
      setLockedBy(null);
      toast.success('Draft unlocked successfully');
    },
    onError: (error) => {
      toast.error('Failed to unlock draft: ' + error.message);
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    isLoading,
    error,
    isDirty,
    lastSaved,
    isSaving,
    isLocked,
    lockedBy,
    saveDraft,
    updateDraft,
    lockDraft: lockDraft.mutate,
    unlockDraft: unlockDraft.mutate,
    isLocking: lockDraft.isPending,
    isUnlocking: unlockDraft.isPending,
  };
};

// Draft Status Component
export const DraftStatus = ({
  isDirty,
  isSaving,
  lastSaved,
  isLocked,
  lockedBy,
}) => {
  return (
    <div className="flex items-center space-x-4 text-sm">
      {isSaving && (
        <div className="flex items-center text-blue-600">
          <Clock className="w-4 h-4 mr-1 animate-spin" />
          Saving...
        </div>
      )}

      {isDirty && !isSaving && (
        <div className="flex items-center text-gold-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          Unsaved changes
        </div>
      )}

      {!isDirty && !isSaving && lastSaved && (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Saved {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {isLocked && (
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          Locked by {lockedBy}
        </div>
      )}
    </div>
  );
};

// Draft Actions Component
export const DraftActions = ({
  onSave,
  onLock,
  onUnlock,
  onRestore,
  onDelete,
  isSaving,
  isLocked,
  lockedBy,
  currentUser,
  canEdit = true,
}) => {
  const canLock = !isLocked && canEdit;
  const canUnlock = isLocked && lockedBy === currentUser?.user_id;
  const canSave = canEdit && !isLocked;

  return (
    <div className="flex items-center space-x-2">
      {canSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      )}

      {canLock && (
        <button
          onClick={onLock}
          className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          <AlertCircle className="w-4 h-4 mr-1" />
          Lock
        </button>
      )}

      {canUnlock && (
        <button
          onClick={onUnlock}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Unlock
        </button>
      )}

      <button
        onClick={onRestore}
        className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Restore
      </button>

      <button
        onClick={onDelete}
        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </button>
    </div>
  );
};

// Draft History Component
export const DraftHistory = ({ filingId, draftType }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['draftHistory', filingId, draftType],
    queryFn: async () => {
      const response = await api.get(`/drafts/${filingId}/history?type=${draftType}`);
      return response.data.history;
    },
    enabled: !!filingId,
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId) => {
      const response = await api.post(`/drafts/${filingId}/restore`, { versionId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Version restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to restore version: ' + error.message);
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Draft History</h3>

      <div className="space-y-3">
        {history?.map((version) => (
          <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-900">
                Version {version.version}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(version.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                by {version.created_by}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => restoreVersion.mutate(version.id)}
                disabled={restoreVersion.isPending}
                className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restore
              </button>

              <button
                onClick={() => {
                  const dataStr = JSON.stringify(version.draft_data, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `draft-v${version.version}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Draft Import/Export Component
export const DraftImportExport = ({ filingId, draftType, onImport }) => {
  const fileInputRef = useRef(null);

  const handleExport = useCallback(async () => {
    try {
      const response = await api.get(`/drafts/${filingId}/export?type=${draftType}`);
      const dataStr = JSON.stringify(response.data.draft, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `draft-${filingId}-${draftType}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Draft exported successfully');
    } catch (error) {
      toast.error('Failed to export draft: ' + error.message);
    }
  }, [filingId, draftType]);

  const handleImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        onImport(data);
        toast.success('Draft imported successfully');
      } catch (error) {
        toast.error('Failed to import draft: Invalid file format');
      }
    };
    reader.readAsText(file);
  }, [onImport]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExport}
        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <Download className="w-4 h-4 mr-1" />
        Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <Upload className="w-4 h-4 mr-1" />
        Import
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
};

export default {
  useDraftManagement,
  DraftStatus,
  DraftActions,
  DraftHistory,
  DraftImportExport,
};
