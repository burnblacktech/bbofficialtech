// =====================================================
// USER DASHBOARD - CONSUMER PRODUCT V1
// "Your Financial Year, Explained"
// 3 Things Only: FY Card, CTA, Reassurance.
// =====================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Play, ArrowRight, Calendar, CheckCircle, Clock } from 'lucide-react';
import { DashboardSkeleton } from '../../components/UI/Skeletons';
import { trackEvent } from '../../utils/analyticsEvents';

// Hooks
import { useUserDrafts, useUserFilings } from '../../hooks/useUserDashboard';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || user?.userId;

  // Minimal Data Fetching
  const { data: draftsData, isLoading: draftsLoading } = useUserDrafts(userId);
  const { data: filingsData, isLoading: filingsLoading } = useUserFilings(userId);

  const loading = draftsLoading || filingsLoading;

  // Derived State
  const drafts = Array.isArray(draftsData) ? draftsData : [];
  // Find the most recent active draft
  const activeDraft = drafts
    .filter(d => ['draft', 'paused'].includes(d?.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  // Check if filed
  const currentAY = '2025-26'; // Hardcoded for V1 Context
  const isFiled = filingsData?.completed?.some(f => f.assessmentYear === currentAY);

  // Status Logic
  let status = 'Not Started';
  let statusColor = 'text-slate-500';
  let statusBg = 'bg-slate-100';

  if (isFiled) {
    status = 'Filed';
    statusColor = 'text-success-700';
    statusBg = 'bg-success-50';
  } else if (activeDraft) {
    status = 'In Progress';
    statusColor = 'text-primary-700';
    statusBg = 'bg-primary-50';
  }

  // Analytics
  useEffect(() => {
    trackEvent('dashboard_view_v1', { userId, status });
  }, [userId, status]);

  const handlePrimaryAction = () => {
    if (isFiled) {
      navigate('/filing-history'); // Or download ack
    } else if (activeDraft) {
      // Resume
      trackEvent('itr_resume_clicked', { draftId: activeDraft.id });
      navigate(`/itr/computation?draftId=${activeDraft.id}`);
    } else {
      // Start - "What kind of year did you have?"
      trackEvent('itr_start_clicked', { source: 'dashboard_v1' });
      // TODO: Navigate to new "Year Type Selection" screen (Step 1)
      // For now, allow direct start or standard start
      navigate('/itr/start');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
        <div className="max-w-xl w-full">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 flex flex-col items-center">
      <div className="max-w-2xl w-full mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 mb-4">
          Hello, {user?.fullName?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-lg text-slate-600">
          Let's make sense of your financial year.
        </p>
      </div>

      {/* 1️⃣ Financial Year Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessment Year</p>
              <p className="text-base font-medium text-slate-900">{currentAY}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${statusBg} ${statusColor}`}>
            {status === 'Filed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {status}
          </div>
        </div>

        {/* 2️⃣ Primary CTA */}
        <div className="p-8 text-center bg-slate-50/50">
          {!isFiled && (
            <button
              onClick={handlePrimaryAction}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.99] transition-all ${activeDraft
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
            >
              {activeDraft ? (
                <>
                  Resume My Filing <Play className="w-5 h-5 fill-current" />
                </>
              ) : (
                <>
                  Start My Filing <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          {isFiled && (
            <div className="text-center py-4">
              <p className="text-slate-600 mb-4">You have successfully closed this financial year.</p>
              <button
                onClick={() => navigate('/filing-history')}
                className="text-primary-600 font-medium hover:underline"
              >
                View Acknowledgment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3️⃣ Calm Reassurance */}
      {!isFiled && (
        <div className="max-w-md text-center">
          <p className="text-sm text-slate-500 leading-relaxed">
            You can explore your tax scenario freely. <br />
            We’ll only ask for personal details like PAN or Bank Account <br />
            <span className="font-medium text-slate-700">right before submission</span>.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
