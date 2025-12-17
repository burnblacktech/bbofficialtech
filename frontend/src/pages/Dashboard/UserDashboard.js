// =====================================================
// USER DASHBOARD - WORLD-CLASS UX DESIGN
// Empty state and active state with guided momentum
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Users, TrendingUp, FileText, Settings, History, Pause, Play, ArrowRight, BarChart3, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import itrService from '../../services/api/itrService';
import apiClient from '../../services/core/APIClient';
import FilingStatusBadge from '../../components/ITR/FilingStatusBadge';
import InvoiceBadge from '../../components/ITR/InvoiceBadge';

// Components
import FilingLaunchpad from '../../components/Dashboard/FilingLaunchpad';
import QuickActionCard from '../../components/Dashboard/QuickActionCard';
import FilingStatusTracker from '../../components/Dashboard/FilingStatusTracker';
import DashboardWidgets from '../../components/Dashboard/DashboardWidgets';
import WelcomeModal from '../../components/UI/WelcomeModal';
import { DashboardSkeleton } from '../../components/UI/Skeletons';
import { getErrorMessage } from '../../utils/errorUtils';

// Hooks
import { useUserDashboardStats, useUserFilings, useUserRefunds } from '../../hooks/useUserDashboard';
import useDashboardRealtime from '../../hooks/useDashboardRealtime';

const UserDashboard = () => {
  const { user, updateUser, justLoggedIn, setJustLoggedIn } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || user?.userId;

  // Last saved/resumable draft (set by ITRComputation Save & Exit)
  const [lastResume, setLastResume] = useState(null);

  // Real-time dashboard updates
  const { connectionStatus, isConnected, lastUpdate, refreshDashboard } = useDashboardRealtime();

  // React Query hooks for dashboard data
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useUserDashboardStats(userId);
  const { data: filingsData, isLoading: filingsLoading, error: filingsError } = useUserFilings(userId);
  const { data: refundsData, isLoading: refundsLoading } = useUserRefunds(userId);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Derived state from React Query data
  const dashboardStats = dashboardData ? {
    totalFilings: dashboardData.overview?.totalFilings || 0,
    pendingActions: dashboardData.draftStats?.activeDrafts || dashboardData.overview?.draftFilings || 0,
    documentsUploaded: dashboardData.overview?.totalDocuments || 0,
    familyMembers: dashboardData.overview?.familyMembers || 0,
    taxSaved: 0, // Not provided by API currently
  } : {
    totalFilings: 0,
    pendingActions: 0,
    documentsUploaded: 0,
    familyMembers: 0,
    taxSaved: 0,
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const ongoingFilings = filingsData?.ongoing || [];
  const completedFilings = filingsData?.completed || [];
  const allFilings = filingsData?.all || [];
  const hasFiled = allFilings.length > 0;
  const refundData = refundsData || {
    pendingRefunds: [],
    creditedRefunds: [],
    totalPendingAmount: 0,
    totalCreditedAmount: 0,
  };

  // Calculate completion rate
  const totalFilingsCount = allFilings.length;
  const completedFilingsCount = completedFilings.length;
  const completionRate = totalFilingsCount > 0
    ? Math.round((completedFilingsCount / totalFilingsCount) * 100)
    : 0;

  const loading = statsLoading || filingsLoading;
  const error = statsError || filingsError;
  const isEmpty = !loading && !hasFiled;

  // Load last resume pointer from localStorage (best-effort)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('itr_last_resume');
      if (raw) {
        setLastResume(JSON.parse(raw));
      }
    } catch (e) {
      // Ignore malformed localStorage
    }
  }, []);

  // Show welcome modal on first login
  useEffect(() => {
    if (justLoggedIn && !user?.onboardingCompleted) {
      setShowWelcomeModal(true);
      setJustLoggedIn(false);
    }
  }, [justLoggedIn, user?.onboardingCompleted, setJustLoggedIn]);

  // Retry function for reloading dashboard data
  const handleRetry = () => {
    refreshDashboard();
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return `${Math.floor(minutesAgo / 60)}h ago`;
  };

  // Mock filing data - in real app, this would come from API
  const filingData = {
    status: 'processing',
    acknowledgementNumber: 'ITR-2024-25-123456789',
    filingDate: '2024-10-12',
    assessmentYear: '2024-25',
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    // Update user context
    if (updateUser) {
      updateUser({ ...user, onboardingCompleted: true });
    }
  };

  const handleStartFiling = () => {
    navigate('/itr/select-person');
  };

  const handleUploadDocuments = () => {
    navigate('/documents');
  };

  const handleManageMembers = () => {
    navigate('/add-members');
  };

  const handleExploreTaxSaving = () => {
    toast.success('Tax-saving options coming soon!');
  };

  const handleViewSettings = () => {
    navigate('/profile');
  };

  const handleViewHistory = () => {
    navigate('/filing-history');
  };

  const handleCheckRefund = () => {
    navigate('/itr/refund-tracking');
  };

  const handleDownloadITRV = async () => {
    // Navigate to filing history or download directly
    if (completedFilings.length > 0) {
      try {
        await itrService.downloadAcknowledgment(completedFilings[0].id);
        toast.success('ITR-V downloaded successfully');
      } catch (error) {
        toast.error('Failed to download ITR-V');
        navigate('/filing-history');
      }
    } else {
      navigate('/filing-history');
    }
  };

  const handleViewFinancialProfile = () => {
    navigate('/financial-profile');
  };

  const calculateProgress = (filing) => {
    // If filing has explicit progress, use it (validated as number)
    if (typeof filing.progress === 'number' && filing.progress >= 0 && filing.progress <= 100) {
      return filing.progress;
    }

    // Fallback: Calculate progress based on status and completion
    if (filing.status === 'submitted' || filing.status === 'acknowledged' || filing.status === 'processed') {
      return 100;
    }

    // For paused filings, check if they have significant progress
    if (filing.status === 'paused') {
      // If paused recently, assume they were making progress
      if (filing.pausedAt) {
        const pausedDate = new Date(filing.pausedAt);
        const now = new Date();
        const daysSincePaused = (now - pausedDate) / (1000 * 60 * 60 * 24);
        // If paused less than 7 days ago, assume 50% progress
        // Otherwise, assume less progress (30%)
        return daysSincePaused < 7 ? 50 : 30;
      }
      return 50;
    }

    // For draft filings, check updatedAt to estimate progress
    if (filing.status === 'draft') {
      if (filing.updatedAt) {
        const updatedDate = new Date(filing.updatedAt);
        const createdDate = filing.createdAt ? new Date(filing.createdAt) : updatedDate;
        const daysSinceUpdate = (new Date() - updatedDate) / (1000 * 60 * 60 * 24);
        const daysSinceCreation = (updatedDate - createdDate) / (1000 * 60 * 60 * 24);

        // If updated recently (within 3 days), assume active work (30-40%)
        // If updated long ago, assume abandoned (10-20%)
        if (daysSinceUpdate < 3) {
          return daysSinceCreation > 7 ? 40 : 30;
        } else {
          return 10;
        }
      }
      return 30;
    }

    return 0;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Show error state with retry option
  if (error && !loading) {
    // Ensure errorMessage is always a string, never an object
    let errorMessage = getErrorMessage(error) || 'Failed to load dashboard data';
    // Defensive check: if somehow we still have an object, convert it to string
    if (typeof errorMessage !== 'string') {
      try {
        errorMessage = JSON.stringify(errorMessage);
      } catch {
        errorMessage = 'Failed to load dashboard data';
      }
    }
    return (
      <div>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-heading-md font-semibold text-black mb-2">Failed to Load Dashboard</h2>
          <p className="text-body-md text-slate-600 mb-6">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium flex items-center gap-2 mx-auto shadow-elevation-3 shadow-primary-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state (no filings) with guidance
  if (isEmpty && !hasFiled && !loading && !error) {
    return (
      <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-card">
            <div className="w-16 h-16 bg-aurora-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elevation-3 shadow-primary-500/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-heading-md font-semibold text-slate-900 mb-2">No Filings Yet</h2>
            <p className="text-body-md text-slate-600 mb-6">
              Get started by filing your Income Tax Return. We'll guide you through the process step by step.
            </p>
            <button
              onClick={handleStartFiling}
              className="px-6 py-3 bg-aurora-gradient text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-elevation-3 shadow-primary-500/20"
            >
              Start Filing
            </button>
          </div>
        </div>
    );
  }

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeComplete}
        user={user}
      />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-heading-lg sm:text-display-sm font-semibold text-black">
                Welcome back, {user?.fullName?.split(' ')[0] || 'there'}!
              </h1>
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-success-600" title="Connected to live updates">
                    <Wifi className="w-4 h-4" />
                    <span className="text-body-small hidden sm:inline">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-warning-600" title="Using polling updates">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-body-small hidden sm:inline">Polling</span>
                  </div>
                )}
                {lastUpdate && (
                  <button
                    onClick={refreshDashboard}
                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Refresh dashboard"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-body-sm sm:text-body-md text-slate-600">
              {hasFiled
                ? 'Here\'s your filing status and next steps.'
                : 'Let\'s get your taxes filed quickly and securely.'
              }
              {lastUpdate && (
                <span className="ml-2 text-body-small text-slate-400">
                  Updated {formatLastUpdate()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Key Metrics Section - Prominent */}
        <div className="space-y-4">
          {/* Primary Metrics Grid */}
          <DashboardWidgets
            stats={{
              totalFilings: dashboardStats.totalFilings || totalFilingsCount,
              pendingActions: dashboardStats.pendingActions || ongoingFilings.length,
              documentsUploaded: dashboardStats.documentsUploaded,
              taxSaved: dashboardStats.taxSaved,
            }}
          />

          {/* Extended Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Rate Card */}
            {hasFiled && (
              <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-elevation-1">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-label-sm font-medium text-slate-600">Completion Rate</p>
                      <p className="text-number-lg font-bold text-black tabular-nums">{completionRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-body-sm text-slate-600 mt-2">
                  {completedFilingsCount} of {totalFilingsCount} filing{totalFilingsCount !== 1 ? 's' : ''} completed
                </p>
              </div>
            )}

            {/* Refund Status Card - Always Visible */}
            <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-elevation-1">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-label-sm font-medium text-slate-600">Refund Status</p>
                    <p className="text-number-lg font-bold text-black tabular-nums">
                      ₹{(refundData.totalPendingAmount + refundData.totalCreditedAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/itr/refund-tracking')}
                  className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
                  aria-label="View all refunds"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl">
                  <p className="text-label-xs text-slate-600 mb-1">Pending</p>
                  <p className="text-number-md font-bold tabular-nums text-black">
                    ₹{refundData.totalPendingAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-body-xs text-slate-600 mt-1">
                    {refundData.pendingRefunds.length} refund{refundData.pendingRefunds.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-success-50 border border-success-200 rounded-xl">
                  <p className="text-label-xs text-slate-600 mb-1">Credited</p>
                  <p className="text-number-md font-bold tabular-nums text-black">
                    ₹{refundData.totalCreditedAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-body-xs text-slate-600 mt-1">
                    {refundData.creditedRefunds.length} refund{refundData.creditedRefunds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Summary - Compact */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-sm font-semibold text-black">Recent Activity</h3>
                {recentActivity.length > 3 && (
                  <button
                    onClick={() => {/* Scroll to full activity section */}}
                    className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'filing_created':
                      case 'filing_submitted':
                        return { icon: FileText, bgColor: 'bg-success-50', iconColor: 'text-success-500' };
                      case 'document_uploaded':
                        return { icon: Upload, bgColor: 'bg-info-50', iconColor: 'text-info-500' };
                      case 'member_added':
                        return { icon: Users, bgColor: 'bg-primary-50', iconColor: 'text-primary-500' };
                      default:
                        return { icon: FileText, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' };
                    }
                  };

                  const { icon: ActivityIcon, bgColor, iconColor } = getActivityIcon(activity.type);
                  const formattedDate = activity.timestamp ? formatRelativeTime(activity.timestamp) : '';

                  return (
                    <div
                      key={activity.id || index}
                      className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <ActivityIcon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-black truncate">
                          {activity.description || activity.title || 'Activity'}
                        </p>
                        {activity.metadata && (
                          <p className="text-body-xs text-slate-600 truncate">
                            {activity.metadata.itrType || activity.metadata.filename || activity.metadata.name || ''}
                          </p>
                        )}
                      </div>
                      {formattedDate && (
                        <span className="text-body-xs text-slate-500 flex-shrink-0">{formattedDate}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Continue Filing Section - Ongoing/Paused Filings */}
      {(() => {
        const hasResumeTarget = !!(lastResume?.draftId || lastResume?.filingId);
        const alreadyInOngoing = !!(lastResume?.filingId && ongoingFilings.some(f => f.id === lastResume.filingId));
        const resumeUrl = lastResume?.draftId
          ? `/itr/computation?draftId=${lastResume.draftId}${lastResume.filingId ? `&filingId=${lastResume.filingId}` : ''}`
          : (lastResume?.filingId ? `/itr/computation?filingId=${lastResume.filingId}` : null);

        if (!hasResumeTarget || alreadyInOngoing || !resumeUrl) return null;

        return (
          <div className="mb-6">
            <h2 className="text-heading-sm font-semibold text-black mb-4">Resume where you left off</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-card-hover hover:border-primary-200 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-50 rounded-xl">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-heading-sm truncate">
                        {lastResume?.itrType ? `${lastResume.itrType}` : 'ITR Draft'}
                        {lastResume?.assessmentYear ? ` - AY ${lastResume.assessmentYear}` : ''}
                      </h3>
                      {lastResume?.savedAt && (
                        <p className="text-body-sm text-slate-600 mt-0.5">
                          Last saved {formatRelativeTime(lastResume.savedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-body-sm text-slate-600">
                    You can continue from exactly where you stopped.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => navigate(resumeUrl)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-elevation-1 shadow-primary-500/20 hover:shadow-elevation-2"
                  >
                    Resume
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {ongoingFilings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-heading-sm font-semibold text-black mb-4">Continue Filing</h2>
          <div className="space-y-4">
            {ongoingFilings.map((filing) => {
              const progress = calculateProgress(filing);
              const isPaused = filing.status === 'paused';

              return (
                <div
                  key={filing.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/itr/computation?filingId=${filing.id}`, {
                    state: { filing },
                  })}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-heading-sm truncate">
                            {filing.itrType} - AY {filing.assessmentYear}
                          </h3>
                          <div className="mt-1">
                            <FilingStatusBadge filing={filing} showInvoice={false} className="text-body-small" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-body-sm text-slate-600 mb-3">
                        {isPaused && filing.pausedAt && (
                          <span className="flex items-center gap-1.5">
                            <Pause className="w-4 h-4" />
                            Paused {formatRelativeTime(filing.pausedAt)}
                          </span>
                        )}
                        {!isPaused && filing.updatedAt && (
                          <span className="flex items-center gap-1.5">
                            Last edited {formatRelativeTime(filing.updatedAt)}
                          </span>
                        )}
                        {progress > 0 && (
                          <span className="font-medium text-primary-600">{progress}% complete</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {progress > 0 && (
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              isPaused
                                ? 'bg-gradient-to-r from-warning-500 to-warning-600'
                                : 'bg-gradient-to-r from-primary-500 to-primary-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      {/* Invoice Badge */}
                      {filing.invoice && (
                        <div className="mt-3">
                          <InvoiceBadge invoice={filing.invoice} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPaused ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/itr/computation?filingId=${filing.id}`, {
                              state: { filing },
                            });
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-success-500 text-white rounded-xl hover:bg-success-600 transition-all shadow-elevation-1 shadow-success-500/20 hover:shadow-elevation-2"
                        >
                          <Play className="w-4 h-4" />
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/itr/computation?filingId=${filing.id}`, {
                              state: { filing },
                            });
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-elevation-1 shadow-primary-500/20 hover:shadow-elevation-2"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filing History Section */}
      {completedFilings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-sm font-semibold text-black">Filing History</h2>
            <button
              onClick={handleViewHistory}
              className="text-primary-600 hover:text-primary-700 text-body-regular font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {completedFilings.slice(0, 5).map((filing) => (
              <div
                key={filing.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/itr/computation?filingId=${filing.id}`, {
                  state: { filing, viewMode: 'readonly' },
                })}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-success-50 rounded-xl group-hover:bg-success-100 transition-colors flex-shrink-0">
                      <FileText className="w-4 h-4 text-success-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {filing.itrType} - AY {filing.assessmentYear}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <FilingStatusBadge filing={filing} showInvoice={false} className="text-body-small" />
                        {filing.submittedAt && (
                          <span className="text-body-small text-slate-500">
                            Submitted {formatRelativeTime(filing.submittedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/itr/computation?filingId=${filing.id}`, {
                          state: { filing, viewMode: 'readonly' },
                        });
                      }}
                      className="px-4 py-2 text-body-regular text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Component - Compact */}
      <div className="mb-4">
        {hasFiled && ongoingFilings.length === 0 ? (
          <FilingStatusTracker filing={filingData} />
        ) : !hasFiled ? (
          <FilingLaunchpad onStartFiling={handleStartFiling} />
        ) : null}
      </div>

      {/* Quick Actions + More Options in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Action Cards */}
        <div>
          <h2 className="text-heading-sm font-semibold text-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              title="Upload Documents"
              description="Upload Form 16, bank statements, and other tax documents"
              icon={Upload}
              color="blue"
              onClick={handleUploadDocuments}
            />

            <QuickActionCard
              title="Manage Family Members"
              description="Add family members for joint filing and tax optimization"
              icon={Users}
              color="green"
              onClick={handleManageMembers}
            />

            <QuickActionCard
              title="Financial Profile"
              description="View your financial history and tax insights"
              icon={BarChart3}
              color="purple"
              onClick={handleViewFinancialProfile}
            />

            <QuickActionCard
              title="Settings & Profile"
              description="Manage your account settings and personal information"
              icon={Settings}
              color="orange"
              onClick={handleViewSettings}
            />
          </div>
        </div>

        {/* Secondary Actions */}
        <div>
          <h2 className="text-heading-sm font-semibold text-black mb-4">More Options</h2>
          <div className="grid grid-cols-1 gap-4">
            <QuickActionCard
              title="Filing History"
              description="View and download your previous tax returns"
              icon={History}
              color="gray"
              onClick={handleViewHistory}
            />

            <QuickActionCard
              title="Check Refund Status"
              description="Track your tax refund status and timeline"
              icon={TrendingUp}
              color="gold"
              onClick={handleCheckRefund}
            />

            <QuickActionCard
              title="Download ITR-V"
              description="Download your ITR-V acknowledgment form"
              icon={FileText}
              color="gray"
              onClick={handleDownloadITRV}
            />
          </div>
        </div>
      </div>

      {/* Full Recent Activity Section - Detailed */}
      {(hasFiled || recentActivity.length > 3) && (
        <div className="mt-6">
          <h2 className="text-heading-sm font-semibold text-black mb-4">All Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5">
            {recentActivity.length > 3 ? (
              <div className="space-y-0">
                {recentActivity.slice(3).map((activity, index) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'filing_created':
                      case 'filing_submitted':
                        return { icon: FileText, bgColor: 'bg-success-50', iconColor: 'text-success-500' };
                      case 'document_uploaded':
                        return { icon: Upload, bgColor: 'bg-info-50', iconColor: 'text-info-500' };
                      case 'member_added':
                        return { icon: Users, bgColor: 'bg-primary-50', iconColor: 'text-primary-500' };
                      default:
                        return { icon: FileText, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' };
                    }
                  };

                  const { icon: ActivityIcon, bgColor, iconColor } = getActivityIcon(activity.type);
                  const formattedDate = activity.timestamp ? formatRelativeTime(activity.timestamp) : '';

                  return (
                    <div
                      key={activity.id || `activity-${index + 3}`}
                      className={`flex items-center justify-between py-3 px-3 ${
                        index < recentActivity.length - 4 ? 'border-b border-gray-100' : ''
                      } hover:bg-slate-50 rounded-xl transition-colors`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                          <ActivityIcon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm font-medium text-black truncate">
                            {activity.description || activity.title || 'Activity'}
                          </p>
                          {activity.metadata && (
                            <p className="text-body-xs text-slate-600 truncate mt-0.5">
                              {activity.metadata.itrType || activity.metadata.filename || activity.metadata.name || ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {formattedDate && (
                        <span className="text-body-sm text-slate-500 ml-3 flex-shrink-0">{formattedDate}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-body-md text-slate-500">No additional activity to display</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboard;
