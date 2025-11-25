// =====================================================
// USER DASHBOARD - WORLD-CLASS UX DESIGN
// Empty state and active state with guided momentum
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Users, TrendingUp, FileText, Settings, History } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import FilingLaunchpad from '../../components/Dashboard/FilingLaunchpad';
import QuickActionCard from '../../components/Dashboard/QuickActionCard';
import FilingStatusTracker from '../../components/Dashboard/FilingStatusTracker';
import DashboardWidgets from '../../components/Dashboard/DashboardWidgets';
import WelcomeModal from '../../components/UI/WelcomeModal';

const UserDashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasFiled, setHasFiled] = useState(false); // In real app, this would come from API
  const [loading, setLoading] = useState(true);

  // Check if user needs welcome modal
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowWelcomeModal(true);
    }
    setLoading(false);
  }, [user]);

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
    navigate('/itr/start');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
          Welcome back, {user?.fullName?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {hasFiled
            ? 'Here\'s your filing status and next steps.'
            : 'Let\'s get your taxes filed quickly and securely.'
          }
        </p>
      </div>

      {/* Dashboard Widgets */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <DashboardWidgets
          stats={{
            totalFilings: hasFiled ? 1 : 0,
            pendingActions: hasFiled ? 0 : 1,
            documentsUploaded: 0,
            taxSaved: 0,
          }}
        />
      </div>

      {/* Primary Component */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        {hasFiled ? (
          <FilingStatusTracker filing={filingData} />
        ) : (
          <FilingLaunchpad onStartFiling={handleStartFiling} />
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
            title="Explore Tax-Saving Options"
            description="Discover investment opportunities to reduce your tax liability"
            icon={TrendingUp}
            color="purple"
            onClick={handleExploreTaxSaving}
            isComingSoon={true}
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
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">More Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <QuickActionCard
            title="Filing History"
            description="View and download your previous tax returns"
            icon={History}
            color="gray"
            onClick={handleViewHistory}
          />

          <QuickActionCard
            title="Document Library"
            description="Access all your uploaded documents and forms"
            icon={FileText}
            color="gray"
            onClick={handleUploadDocuments}
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      {hasFiled && (
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
            <div className="bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 sm:py-4 px-2 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">ITR Filed Successfully</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">Assessment Year 2024-25</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 sm:ml-4 flex-shrink-0">Oct 12</span>
                </div>

                <div className="flex items-center justify-between py-3 sm:py-4 px-2 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Documents Uploaded</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">Form 16 and bank statements</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 sm:ml-4 flex-shrink-0">Oct 10</span>
                </div>

                <div className="flex items-center justify-between py-3 sm:py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Profile Created</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">Welcome to BurnBlack</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 sm:ml-4 flex-shrink-0">Oct 8</span>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default UserDashboard;
