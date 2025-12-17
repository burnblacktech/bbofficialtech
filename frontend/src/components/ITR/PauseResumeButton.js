// =====================================================
// PAUSE/RESUME BUTTON COMPONENT
// Button to pause or resume a filing
// =====================================================

import React, { useState } from 'react';
import { Pause, Play, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import itrService from '../../services/api/itrService';

const PauseResumeButton = ({ filing, onPaused, onResumed, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!filing) {
    return null;
  }

  const handlePause = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to pause this filing? Your progress will be saved.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await itrService.pauseFiling(filing.id);
      if (response.success) {
        toast.success('Filing paused successfully');
        if (onPaused) {
          onPaused(response.filing);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to pause filing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      const response = await itrService.resumeFiling(filing.id);
      if (response.success) {
        toast.success('Filing resumed successfully');
        if (onResumed) {
          onResumed(response.filing);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resume filing');
    } finally {
      setIsLoading(false);
    }
  };

  if (filing.status === 'draft') {
    return (
      <button
        onClick={handlePause}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 bg-warning-500 text-white rounded-xl hover:bg-warning-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Pause className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Pausing...' : 'Pause Filing'}</span>
      </button>
    );
  }

  if (filing.status === 'paused') {
    return (
      <button
        onClick={handleResume}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 bg-success-500 text-white rounded-xl hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Resuming...' : 'Resume Filing'}</span>
      </button>
    );
  }

  return null;
};

export default PauseResumeButton;

