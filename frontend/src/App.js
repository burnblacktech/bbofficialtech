// =====================================================
// MAIN APP COMPONENT - CLEAN ROUTE STRUCTURE
// Clear separation of public and protected routes
// =====================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core components
import Layout from './components/Layout.js';
import LandingPage from './pages/Landing/LandingPage';
import HomeRedirect from './pages/HomeRedirect';

// Auth components
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import MobileOTPSignup from './pages/Auth/MobileOTPSignup';
import EmailVerification from './pages/Auth/EmailVerification';
import MobileVerification from './pages/Auth/MobileVerification';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import GoogleOAuthSuccess from './pages/Auth/GoogleOAuthSuccess';

// CA Registration components
import RegisterCAFirm from './pages/CA/RegisterCAFirm';
import RegistrationSuccess from './pages/CA/RegistrationSuccess';
import CAMarketplace from './pages/CA/Marketplace';
import CAProfile from './pages/CA/CAProfile';

// Admin components
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserManagement from './pages/Admin/AdminUserManagement';
import AdminUserDetails from './pages/Admin/AdminUserDetails';
import AdminFilings from './pages/Admin/AdminFilings';
import AdminFilingDetails from './pages/Admin/AdminFilingDetails';
import AdminDocuments from './pages/Admin/AdminDocuments';
import AdminLayout from './components/Admin/AdminLayout';
// Additional Admin pages
import AdminCAFirms from './pages/Admin/AdminCAFirms';
import AdminTicketQueue from './pages/Admin/AdminTicketQueue';
import AdminTransactionManagement from './pages/Admin/AdminTransactionManagement';
import AdminRefundManagement from './pages/Admin/AdminRefundManagement';
import AdminCouponManagement from './pages/Admin/AdminCouponManagement';
import AdminPricingPlans from './pages/Admin/AdminPricingPlans';
import AdminCAPayouts from './pages/Admin/AdminCAPayouts';
import AdminCAPerformance from './pages/Admin/AdminCAPerformance';
import AdminCAVerificationQueue from './pages/Admin/AdminCAVerificationQueue';
import AdminUserSegments from './pages/Admin/AdminUserSegments';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminReports from './pages/Admin/AdminReports';
import AdminSystemHealth from './pages/Admin/AdminSystemHealth';
import AdminKnowledgeBase from './pages/Admin/AdminKnowledgeBase';
import AdminControlPanel from './pages/Admin/AdminControlPanel';
import PlatformCompliance from './pages/Admin/PlatformCompliance';
import InvoiceManagement from './pages/Admin/InvoiceManagement';
import AdminSettings from './pages/Admin/AdminSettings';

// CA Firm components
import CAFirmAdminDashboard from './pages/Dashboard/CAFirmAdminDashboard';
import CAStaffDashboard from './pages/Dashboard/CAStaffDashboard';
import FirmDashboard from './pages/Firm/FirmDashboard';
import ClientList from './pages/Firm/ClientList';
import ClientOnboardingForm from './pages/Firm/ClientOnboardingForm';
import CAReviewQueue from './pages/Firm/CAReviewQueue';

// User pages
import UserDashboard from './pages/Dashboard/UserDashboard';
import StartFiling from './pages/ITR/StartFiling';
import FilingHistory from './pages/ITR/FilingHistory';
import FilingPersonSelector from './components/ITR/FilingPersonSelector';
import ITRComputation from './pages/ITR/ITRComputation';
import RefundTracking from './pages/ITR/RefundTracking';
import EVerification from './pages/ITR/EVerification';
import ITRFormSelection from './pages/ITR/ITRFormSelection';
import ITRModeSelection from './pages/ITR/ITRModeSelection';
import ITRDirectSelection from './pages/ITR/ITRDirectSelection';
import IncomeSourceSelector from './pages/ITR/IncomeSourceSelector';
import DocumentUploadHub from './pages/ITR/DocumentUploadHub';
import DataSourceSelector from './components/ITR/DataSourceSelector';
import PreviousYearSelector from './features/itr/components/previous-year-selector';
import PreviousYearPreview from './features/itr/components/previous-year-preview';
import PreviousYearReview from './features/itr/components/previous-year-review';
import AddMembers from './pages/Members/AddMembers';
import UserSettings from './pages/User/UserSettings';
import ProfileSettings from './pages/User/ProfileSettings';
import Preferences from './pages/Settings/Preferences';
import NotificationsCenter from './pages/Notifications/NotificationsCenter';
import Documents from './pages/User/Documents';
import SessionManagement from './pages/User/SessionManagement';

// Help pages
import HelpCenter from './pages/Help/HelpCenter';
import FAQs from './pages/Help/FAQs';
import TaxGlossary from './pages/Help/TaxGlossary';
import ContactSupport from './pages/Help/ContactSupport';
import ArticleView from './pages/Help/ArticleView';
import ReportBug from './pages/Help/ReportBug';
import FeatureRequest from './pages/Help/FeatureRequest';
import FinancialProfilePage from './pages/FinancialProfile/FinancialProfilePage';
import ServiceTicketManagement from './pages/Service/ServiceTicketManagement';
import ToolsPage from './pages/Tools/ToolsPage';

// Legal pages
import TermsPage from './pages/Legal/TermsPage';
import PrivacyPage from './pages/Legal/PrivacyPage';
// Design System Components (Development only)
// import StyleGuide from './components/DesignSystem/StyleGuide'; // Temporarily disabled

// CABot Page (Development/Testing)
// import CABotPage from './pages/CABot/CABotPage'; // Temporarily disabled

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Error boundaries
import ErrorBoundary from './components/ErrorBoundary';

// Context providers
import { ITRProvider } from './contexts/ITRContext';

// Styles
import './styles/GlobalStyles.css';

// Main App Component
const AppContent = () => {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/mobile" element={<MobileOTPSignup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/mobile-verification" element={<MobileVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/success" element={<GoogleOAuthSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* CA Registration Routes */}
        <Route path="/ca/register" element={<RegisterCAFirm />} />
        <Route path="/ca/registration-success" element={<RegistrationSuccess />} />

        {/* CA Marketplace Routes (Public) */}
        <Route
          path="/ca/marketplace"
          element={
            <Layout>
              <CAMarketplace />
            </Layout>
          }
        />
        <Route
          path="/ca/:firmId"
          element={
            <Layout>
              <CAProfile />
            </Layout>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Smart redirector - determines correct dashboard based on role */}
          <Route path="/home" element={<HomeRedirect />} />

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <UserDashboard />
              </Layout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminLayout>
                <AdminUserManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminLayout>
                <AdminUserDetails />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/filings"
            element={
              <AdminLayout>
                <AdminFilings />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/filings/:filingId"
            element={
              <AdminLayout>
                <AdminFilingDetails />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <AdminLayout>
                <AdminDocuments />
              </AdminLayout>
            }
          />
          {/* Fix broken sidebar routes */}
          <Route
            path="/admin/ca-firms"
            element={
              <AdminLayout>
                <AdminCAFirms />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <AdminLayout>
                <AdminTicketQueue />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <AdminLayout>
                <AdminPricingPlans />
              </AdminLayout>
            }
          />
          {/* Add routes for existing pages */}
          <Route
            path="/admin/analytics"
            element={
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users/segments"
            element={
              <AdminLayout>
                <AdminUserSegments />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/cas/verification"
            element={
              <AdminLayout>
                <AdminCAVerificationQueue />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/cas/performance"
            element={
              <AdminLayout>
                <AdminCAPerformance />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/cas/payouts"
            element={
              <AdminLayout>
                <AdminCAPayouts />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminLayout>
                <AdminTransactionManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <AdminLayout>
                <AdminRefundManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <AdminLayout>
                <AdminCouponManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <AdminLayout>
                <InvoiceManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/system/health"
            element={
              <AdminLayout>
                <AdminSystemHealth />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/compliance"
            element={
              <AdminLayout>
                <PlatformCompliance />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/knowledge-base"
            element={
              <AdminLayout>
                <AdminKnowledgeBase />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/control-panel"
            element={
              <AdminLayout>
                <AdminControlPanel />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            }
          />
          <Route
            path="/firm/dashboard"
            element={
              <AdminLayout>
                <CAFirmAdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/ca/clients"
            element={
              <Layout>
                <CAStaffDashboard />
              </Layout>
            }
          />

          {/* ITR Filing Routes */}
          <Route
            path="/itr/select-person"
            element={
              <Layout>
                <FilingPersonSelector />
              </Layout>
            }
          />
          <Route
            path="/itr/data-source"
            element={
              <Layout>
                <DataSourceSelector />
              </Layout>
            }
          />
          <Route
            path="/itr/select-form"
            element={
              <Layout>
                <ITRFormSelection />
              </Layout>
            }
          />
          <Route
            path="/itr/mode-selection"
            element={
              <Layout>
                <ITRModeSelection />
              </Layout>
            }
          />
          <Route
            path="/itr/direct-selection"
            element={
              <Layout>
                <ITRDirectSelection />
              </Layout>
            }
          />
          <Route
            path="/itr/income-sources"
            element={
              <Layout>
                <IncomeSourceSelector />
              </Layout>
            }
          />
          <Route
            path="/itr/document-upload"
            element={
              <Layout>
                <DocumentUploadHub />
              </Layout>
            }
          />
          <Route
            path="/itr/computation"
            element={
              <Layout>
                <ITRComputation />
              </Layout>
            }
          />
          <Route
            path="/itr/filing/:filingId/*"
            element={
              <Layout>
                <ITRComputation />
              </Layout>
            }
          />
          <Route
            path="/itr/previous-year-selector"
            element={
              <Layout>
                <PreviousYearSelector />
              </Layout>
            }
          />
          <Route
            path="/itr/previous-year-preview"
            element={
              <Layout>
                <PreviousYearPreview />
              </Layout>
            }
          />
          <Route
            path="/itr/previous-year-review"
            element={
              <Layout>
                <PreviousYearReview />
              </Layout>
            }
          />
          {/* Legacy route - redirects to select-person */}
          <Route
            path="/itr/start"
            element={
              <Layout>
                <StartFiling />
              </Layout>
            }
          />
          <Route
            path="/filing-history"
            element={
              <Layout>
                <ITRProvider>
                  <FilingHistory />
                </ITRProvider>
              </Layout>
            }
          />
          <Route
            path="/itr/refund-tracking"
            element={
              <Layout>
                <RefundTracking />
              </Layout>
            }
          />
          <Route
            path="/itr/e-verify"
            element={
              <Layout>
                <EVerification />
              </Layout>
            }
          />

          {/* User Management Routes */}
          <Route
            path="/documents"
            element={
              <Layout>
                <Documents />
              </Layout>
            }
          />
          <Route
            path="/add-members"
            element={
              <Layout>
                <AddMembers />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfileSettings />
              </Layout>
            }
          />
          <Route
            path="/preferences"
            element={
              <Layout>
                <Preferences />
              </Layout>
            }
          />
          <Route
            path="/notifications"
            element={
              <Layout>
                <NotificationsCenter />
              </Layout>
            }
          />
          <Route
            path="/sessions"
            element={
              <Layout>
                <SessionManagement />
              </Layout>
            }
          />
          <Route
            path="/financial-profile"
            element={
              <Layout>
                <FinancialProfilePage />
              </Layout>
            }
          />
          <Route
            path="/tools"
            element={
              <Layout>
                <ToolsPage />
              </Layout>
            }
          />

          {/* Firm Management Routes */}
          <Route
            path="/firm/:firmId/dashboard"
            element={
              <Layout>
                <FirmDashboard />
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/clients"
            element={
              <Layout>
                <ClientList />
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/clients/new"
            element={
              <Layout>
                <ClientOnboardingForm />
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/review-queue"
            element={
              <Layout>
                <CAReviewQueue />
              </Layout>
            }
          />

          {/* CA Bot Route - Temporarily disabled */}
          {/* <Route
            path="/ca-bot"
            element={
              <CABotProvider>
                <Layout>
                  <CABotPage />
                </Layout>
              </CABotProvider>
            }
          /> */}

          {/* Help & Support Routes */}
          <Route
            path="/help"
            element={
              <Layout>
                <HelpCenter />
              </Layout>
            }
          />
          <Route
            path="/help/faqs"
            element={
              <Layout>
                <FAQs />
              </Layout>
            }
          />
          <Route
            path="/help/glossary"
            element={
              <Layout>
                <TaxGlossary />
              </Layout>
            }
          />
              <Route
                path="/help/contact"
                element={
                  <Layout>
                    <ContactSupport />
                  </Layout>
                }
              />
              <Route
                path="/help/articles/:articleId"
                element={
                  <Layout>
                    <ArticleView />
                  </Layout>
                }
              />
              <Route
                path="/help/report-bug"
                element={
                  <Layout>
                    <ReportBug />
                  </Layout>
                }
              />
              <Route
                path="/help/feature-request"
                element={
                  <Layout>
                    <FeatureRequest />
                  </Layout>
                }
              />
          </Route>

        {/* Catch all - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Mobile Navigation */}
    </div>
  );
};

// Root App Component
const App = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
