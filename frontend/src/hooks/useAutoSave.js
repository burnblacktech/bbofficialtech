// =====================================================
// AUTO-SAVE HOOK
// Debounced auto-save with visual indicators and offline support
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for auto-saving form data with debouncing and visual feedback
 * @param {Object} options - Configuration options
 * @param {Function} options.saveFn - Async function to save data
 * @param {Object} options.data - Data to save
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 3000)
 * @param {string} options.localStorageKey - Key for localStorage backup
 * @param {boolean} options.enabled - Whether auto-save is enabled
 * @param {Function} options.onSaveSuccess - Callback on successful save
 * @param {Function} options.onSaveError - Callback on save error
 */
const useAutoSave = ({
  saveFn,
  data,
  debounceMs = 3000,
  localStorageKey = null,
  enabled = true,
  onSaveSuccess = null,
  onSaveError = null,
}) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'offline'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const timeoutRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const sectionChangeTimeoutRef = useRef(null);
  const lastDataRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingChanges) {
        // Trigger save when coming back online
        performSave();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingChanges]);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((dataToSave) => {
    if (localStorageKey && dataToSave) {
      try {
        const backupData = {
          data: dataToSave,
          timestamp: Date.now(),
          version: 1,
        };
        localStorage.setItem(localStorageKey, JSON.stringify(backupData));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [localStorageKey]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (localStorageKey) {
      try {
        const saved = localStorage.getItem(localStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
    return null;
  }, [localStorageKey]);

  // Clear localStorage backup
  const clearLocalStorage = useCallback(() => {
    if (localStorageKey) {
      try {
        localStorage.removeItem(localStorageKey);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }, [localStorageKey]);

  // Perform the actual save
  const performSave = useCallback(async () => {
    if (!enabled || !saveFn || !data) return;

    // Check if data has actually changed
    const dataString = JSON.stringify(data);
    if (dataString === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Always save to localStorage first
    saveToLocalStorage(data);

    // If offline, mark as pending and exit
    if (!isOnline) {
      setSaveStatus('offline');
      setPendingChanges(true);
      return;
    }

    setSaveStatus('saving');
    setPendingChanges(false);

    try {
      await saveFn(data);
      lastDataRef.current = JSON.parse(dataString);
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      retryCountRef.current = 0;

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Reset to idle after a short delay
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2000);
    } catch (error) {
      console.error('Auto-save error:', error);

      // Retry on network errors
      const isRetryable = !error.response || (error.response?.status >= 500);
      if (isRetryable && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(performSave, retryDelay);
        return;
      }

      setSaveStatus('error');
      setPendingChanges(true);

      if (onSaveError) {
        onSaveError(error);
      }

      // Reset to idle after showing error
      setTimeout(() => {
        setSaveStatus((current) => (current === 'error' ? 'idle' : current));
      }, 5000);
    }
  }, [enabled, saveFn, data, isOnline, saveToLocalStorage, onSaveSuccess, onSaveError]);

  // Manual save trigger
  const triggerSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    if (sectionChangeTimeoutRef.current) {
      clearTimeout(sectionChangeTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  // Field blur handler (immediate save)
  const handleFieldBlur = useCallback((fieldName, value) => {
    if (!enabled || !saveFn) return;

    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Immediate save on blur (with small delay to batch rapid blurs)
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    blurTimeoutRef.current = setTimeout(async () => {
      try {
        // Create partial update object
        const updateData = { [fieldName]: value };
        await saveFn(updateData);
        setLastSavedAt(new Date());
        setSaveStatus('saved');
        retryCountRef.current = 0;

        // Update lastDataRef to prevent duplicate saves
        if (data && typeof data === 'object') {
          lastDataRef.current = { ...data, ...updateData };
        }

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        setTimeout(() => {
          setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 1000);
      } catch (error) {
        console.error('Field blur save error:', error);
        setSaveStatus('error');
        if (onSaveError) {
          onSaveError(error);
        }
      }
    }, 300); // Small delay to batch rapid blurs
  }, [enabled, saveFn, data, onSaveSuccess, onSaveError]);

  // Section change handler (immediate save)
  const handleSectionChange = useCallback((newSection, formData) => {
    if (!enabled || !saveFn || !formData) return;

    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Immediate save on section change
    if (sectionChangeTimeoutRef.current) {
      clearTimeout(sectionChangeTimeoutRef.current);
    }

    sectionChangeTimeoutRef.current = setTimeout(async () => {
      try {
        const saveData = { ...formData, currentSection: newSection };
        await saveFn(saveData);
        setLastSavedAt(new Date());
        setSaveStatus('saved');
        setPendingChanges(false);
        retryCountRef.current = 0;

        lastDataRef.current = JSON.parse(JSON.stringify(saveData));

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        setTimeout(() => {
          setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 1000);
      } catch (error) {
        console.error('Section change save error:', error);
        setSaveStatus('error');
        if (onSaveError) {
          onSaveError(error);
        }
      }
    }, 200); // Small delay to ensure section transition completes
  }, [enabled, saveFn, onSaveSuccess, onSaveError]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled || !data) return;

    // Check if data has actually changed
    const dataString = JSON.stringify(data);
    if (dataString === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as having pending changes
    setPendingChanges(true);

    // Set new timeout
    timeoutRef.current = setTimeout(performSave, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      if (sectionChangeTimeoutRef.current) {
        clearTimeout(sectionChangeTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    pendingChanges,
    isOnline,
    triggerSave,
    handleFieldBlur,
    handleSectionChange,
    loadFromLocalStorage,
    clearLocalStorage,
  };
};

export default useAutoSave;

// Status indicator component
export const AutoSaveIndicator = ({
  status,
  lastSavedAt,
  pendingChanges,
  isOnline,
  className = '',
}) => {
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        text: 'Offline - changes saved locally',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '📴',
      };
    }

    switch (status) {
      case 'saving':
        return {
          text: 'Saving...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: '💾',
        };
      case 'saved':
        return {
          text: 'All changes saved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: '✓',
        };
      case 'error':
        return {
          text: 'Failed to save',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: '⚠️',
        };
      case 'offline':
        return {
          text: 'Offline - will sync when online',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: '📴',
        };
      default:
        if (pendingChanges) {
          return {
            text: 'Unsaved changes',
            color: 'text-gray-500',
            bgColor: 'bg-gray-50',
            icon: '○',
          };
        }
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  if (!statusDisplay) {
    if (lastSavedAt) {
      const timeAgo = getTimeAgo(lastSavedAt);
      return (
        <div className={`flex items-center text-xs text-gray-400 ${className}`}>
          <span>Last saved {timeAgo}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex items-center text-xs ${statusDisplay.color} ${className}`}>
      <span className="mr-1">{statusDisplay.icon}</span>
      <span>{statusDisplay.text}</span>
      {status === 'saving' && (
        <span className="ml-1 animate-pulse">...</span>
      )}
    </div>
  );
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
