// =====================================================
// MAIN APP COMPONENT - CLEAN ROUTE STRUCTURE
// Clear separation of public and protected routes
// Code splitting with React.lazy() for optimal performance
// =====================================================

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Core components (keep synchronous - needed immediately)
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ErrorBoundary as DesignSystemErrorBoundary } from './components/DesignSystem';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteLoader from './components/UI/RouteLoader';
import { ITRProvider } from './contexts/ITRContext';
import { FILING_ROUTES, getAllFilingRoutes } from './routes/filingRoutes';

// Performance monitoring
import { initWebVitals } from './utils/webVitals';
import { reportPerformance } from './utils/performanceMonitor';

// Styles (keep synchronous)
import './styles/GlobalStyles.css';

// Lazy load all route components for code splitting
// Public routes
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const HomeRedirect = lazy(() => import('./pages/HomeRedirect'));

// Auth components
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/Auth/SignupPage'));
const MobileOTPSignup = lazy(() => import('./pages/Auth/MobileOTPSignup'));
const EmailVerification = lazy(() => import('./pages/Auth/EmailVerification'));
const MobileVerification = lazy(() => import('./pages/Auth/MobileVerification'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const GoogleOAuthSuccess = lazy(() => import('./pages/Auth/GoogleOAuthSuccess'));
const GoogleOAuthError = lazy(() => import('./pages/Auth/GoogleOAuthError'));
const GoogleOAuthLinkRequired = lazy(() => import('./pages/Auth/GoogleOAuthLinkRequired'));

// Onboarding / gates


// CA Registration components
const RegisterCAFirm = lazy(() => import('./pages/CA/RegisterCAFirm'));
const RegistrationSuccess = lazy(() => import('./pages/CA/RegistrationSuccess'));
const CAMarketplace = lazy(() => import('./pages/CA/Marketplace'));
const CAProfile = lazy(() => import('./pages/CA/CAProfile'));
const CACheckout = lazy(() => import('./pages/CA/Checkout'));
const CASubscriptionPlans = lazy(() => import('./pages/CA/SubscriptionPlans'));
const CAAnalytics = lazy(() => import('./pages/CA/CAAnalytics'));
const CAClientManagement = lazy(() => import('./pages/CA/CAClientManagement'));

// Admin components
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUserManagement = lazy(() => import('./pages/Admin/AdminUserManagement'));
const AdminUserDetails = lazy(() => import('./pages/Admin/AdminUserDetails'));
const AdminFilings = lazy(() => import('./pages/Admin/AdminFilings'));
const AdminFilingDetails = lazy(() => import('./pages/Admin/AdminFilingDetails'));
const AdminDocuments = lazy(() => import('./pages/Admin/AdminDocuments'));
const AdminCAFirms = lazy(() => import('./pages/Admin/AdminCAFirms'));
const AdminTicketQueue = lazy(() => import('./pages/Admin/AdminTicketQueue'));
const AdminTransactionManagement = lazy(() => import('./pages/Admin/AdminTransactionManagement'));
const AdminRefundManagement = lazy(() => import('./pages/Admin/AdminRefundManagement'));
const AdminCouponManagement = lazy(() => import('./pages/Admin/AdminCouponManagement'));
const AdminPricingPlans = lazy(() => import('./pages/Admin/AdminPricingPlans'));
const AdminCAPayouts = lazy(() => import('./pages/Admin/AdminCAPayouts'));
const AdminCAPerformance = lazy(() => import('./pages/Admin/AdminCAPerformance'));
const AdminCAVerificationQueue = lazy(() => import('./pages/Admin/AdminCAVerificationQueue'));
const AdminUserSegments = lazy(() => import('./pages/Admin/AdminUserSegments'));
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));
const AdminSystemHealth = lazy(() => import('./pages/Admin/AdminSystemHealth'));
const AdminKnowledgeBase = lazy(() => import('./pages/Admin/AdminKnowledgeBase'));
const AdminControlPanel = lazy(() => import('./pages/Admin/AdminControlPanel'));
const PlatformCompliance = lazy(() => import('./pages/Admin/PlatformCompliance'));
const InvoiceManagement = lazy(() => import('./pages/Admin/InvoiceManagement'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminAuditLogs = lazy(() => import('./pages/Admin/AdminAuditLogs'));
const AdminActivityLogs = lazy(() => import('./pages/Admin/AdminActivityLogs'));
const AdminSecurityLogs = lazy(() => import('./pages/Admin/AdminSecurityLogs'));

// CA Firm components
const CAFirmAdminDashboard = lazy(() => import('./pages/Dashboard/CAFirmAdminDashboard'));
const CAStaffDashboard = lazy(() => import('./pages/Dashboard/CAStaffDashboard'));
const FirmDashboard = lazy(() => import('./pages/Firm/FirmDashboard'));
const ClientList = lazy(() => import('./pages/Firm/ClientList'));
const ClientOnboardingForm = lazy(() => import('./pages/Firm/ClientOnboardingForm'));
const CAReviewQueue = lazy(() => import('./pages/Firm/CAReviewQueue'));

const CAReviewQueue = lazy(() => import('./pages/Firm/CAReviewQueue'));

// CA Workspace V3
const CAInbox = lazy(() => import('./pages/CA/CAInbox'));
const CAFilingReview = lazy(() => import('./pages/CA/CAFilingReview'));

// User pages
const UserDashboard = lazy(() => import('./pages/Dashboard/UserDashboard'));

// ITR Components (Restored)
const FilingHistory = lazy(() => import('./pages/ITR/FilingHistory'));
// const FilingPersonSelector = lazy(() => import('./components/ITR/FilingPersonSelector')); // Loaded via filingRoutes
// const ITRFormRecommender = lazy(() => import('./components/ITR/ITRFormRecommender')); // Loaded via filingRoutes
// const ITRComputation = lazy(() => import('./pages/ITR/ITRComputation')); // Loaded via filingRoutes
// const DetermineITR = lazy(() => import('./pages/ITR/DetermineITR')); // Loaded via filingRoutes

const RefundTracking = lazy(() => import('./pages/ITR/RefundTracking'));
const ITRVTracking = lazy(() => import('./pages/ITR/ITRVTracking'));
const AssessmentNotices = lazy(() => import('./pages/ITR/AssessmentNotices'));
const TaxDemands = lazy(() => import('./pages/ITR/TaxDemands'));
const FilingAnalytics = lazy(() => import('./pages/ITR/FilingAnalytics'));
const EVerification = lazy(() => import('./pages/ITR/EVerification'));
const Acknowledgment = lazy(() => import('./pages/Acknowledgment'));
const PreviousYearSelector = lazy(() => import('./features/itr/components/previous-year-selector'));
const PreviousYearPreview = lazy(() => import('./features/itr/components/previous-year-preview'));
const PreviousYearReview = lazy(() => import('./features/itr/components/previous-year-review'));
const AddMembers = lazy(() => import('./pages/Members/AddMembers'));
const UserSettings = lazy(() => import('./pages/User/UserSettings'));
const ProfileSettings = lazy(() => import('./pages/User/ProfileSettings'));
const Preferences = lazy(() => import('./pages/Settings/Preferences'));
const NotificationsCenter = lazy(() => import('./pages/Notifications/NotificationsCenter'));
const Documents = lazy(() => import('./pages/User/Documents'));
const SessionManagement = lazy(() => import('./pages/User/SessionManagement'));

// Help pages
const HelpCenter = lazy(() => import('./pages/Help/HelpCenter'));
const FAQs = lazy(() => import('./pages/Help/FAQs'));
const TaxGlossary = lazy(() => import('./pages/Help/TaxGlossary'));
const ContactSupport = lazy(() => import('./pages/Help/ContactSupport'));
const ArticleView = lazy(() => import('./pages/Help/ArticleView'));
const ReportBug = lazy(() => import('./pages/Help/ReportBug'));
const FeatureRequest = lazy(() => import('./pages/Help/FeatureRequest'));
const FinancialProfilePage = lazy(() => import('./pages/FinancialProfile/FinancialProfilePage'));
const ServiceTicketManagement = lazy(() => import('./pages/Service/ServiceTicketManagement'));
const ToolsPage = lazy(() => import('./pages/Tools/ToolsPage'));

// Legal pages
const TermsPage = lazy(() => import('./pages/Legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/Legal/PrivacyPage'));

function ITRDetermineRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to="/itr/determine"
      replace
      state={{
        ...(location.state || {}),
        redirectedFrom: location.pathname,
      }}
    />
  );
}

function AcknowledgmentRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const filingId = params.get('filingId') || location.state?.filingId || null;
  if (!filingId) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <Navigate
      to={`/acknowledgment/${filingId}`}
      replace
      state={{
        ...(location.state || {}),
        filingId,
      }}
    />
  );
}

// Main App Component
const AppContent = () => {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteLoader message="Loading landing page..." />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteLoader message="Loading login..." />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<RouteLoader message="Loading signup..." />}>
              <SignupPage />
            </Suspense>
          }
        />
        <Route
          path="/signup/mobile"
          element={
            <Suspense fallback={<RouteLoader message="Loading mobile signup..." />}>
              <MobileOTPSignup />
            </Suspense>
          }
        />
        <Route
          path="/email-verification"
          element={
            <Suspense fallback={<RouteLoader message="Loading email verification..." />}>
              <EmailVerification />
            </Suspense>
          }
        />
        <Route
          path="/mobile-verification"
          element={
            <Suspense fallback={<RouteLoader message="Loading mobile verification..." />}>
              <MobileVerification />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<RouteLoader message="Loading forgot password..." />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<RouteLoader message="Loading reset password..." />}>
              <ResetPassword />
            </Suspense>
          }
        />
        <Route
          path="/auth/google/success"
          element={
            <Suspense fallback={<RouteLoader message="Processing authentication..." />}>
              <GoogleOAuthSuccess />
            </Suspense>
          }
        />
        <Route
          path="/auth/google/error"
          element={
            <Suspense fallback={<RouteLoader message="Loading authentication error..." />}>
              <GoogleOAuthError />
            </Suspense>
          }
        />
        <Route
          path="/auth/google/link-required"
          element={
            <Suspense fallback={<RouteLoader message="Loading account linking..." />}>
              <GoogleOAuthLinkRequired />
            </Suspense>
          }
        />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<RouteLoader message="Loading admin login..." />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<RouteLoader message="Loading terms..." />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<RouteLoader message="Loading privacy policy..." />}>
              <PrivacyPage />
            </Suspense>
          }
        />

        {/* CA Registration Routes */}
        <Route
          path="/ca/register"
          element={
            <Suspense fallback={<RouteLoader message="Loading CA registration..." />}>
              <RegisterCAFirm />
            </Suspense>
          }
        />
        <Route
          path="/ca/registration-success"
          element={
            <Suspense fallback={<RouteLoader message="Loading..." />}>
              <RegistrationSuccess />
            </Suspense>
          }
        />

        {/* CA Marketplace Routes (Public) */}
        <Route
          path="/ca/marketplace"
          element={
            <Layout>
              <Suspense fallback={<RouteLoader message="Loading marketplace..." />}>
                <CAMarketplace />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/ca/plans"
          element={
            <Layout>
              <Suspense fallback={<RouteLoader message="Loading subscription plans..." />}>
                <CASubscriptionPlans />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/ca/:firmId"
          element={
            <Layout>
              <Suspense fallback={<RouteLoader message="Loading CA profile..." />}>
                <CAProfile />
              </Suspense>
            </Layout>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Smart redirector - determines correct dashboard based on role */}
          <Route
            path="/home"
            element={
              <Suspense fallback={<RouteLoader message="Redirecting..." />}>
                <HomeRedirect />
              </Suspense>
            }
          />

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading dashboard..." />}>
                  <UserDashboard />
                </Suspense>
              </Layout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin dashboard..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading dashboard..." />}>
                    <AdminDashboard />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading user management..." />}>
                    <AdminUserManagement />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading user details..." />}>
                    <AdminUserDetails />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/filings"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading filings..." />}>
                    <AdminFilings />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/filings/:filingId"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading filing details..." />}>
                    <AdminFilingDetails />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading documents..." />}>
                    <AdminDocuments />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          {/* Fix broken sidebar routes */}
          <Route
            path="/admin/ca-firms"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading CA firms..." />}>
                    <AdminCAFirms />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading tickets..." />}>
                    <AdminTicketQueue />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading pricing plans..." />}>
                    <AdminPricingPlans />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          {/* Add routes for existing pages */}
          <Route
            path="/admin/analytics"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading analytics..." />}>
                    <AdminAnalytics />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading reports..." />}>
                    <AdminReports />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/users/segments"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading user segments..." />}>
                    <AdminUserSegments />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/cas/verification"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading CA verification..." />}>
                    <AdminCAVerificationQueue />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/cas/performance"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading CA performance..." />}>
                    <AdminCAPerformance />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/cas/payouts"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading CA payouts..." />}>
                    <AdminCAPayouts />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading transactions..." />}>
                    <AdminTransactionManagement />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading refunds..." />}>
                    <AdminRefundManagement />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading coupons..." />}>
                    <AdminCouponManagement />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading invoices..." />}>
                    <InvoiceManagement />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/system/health"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading system health..." />}>
                    <AdminSystemHealth />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/compliance"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading compliance..." />}>
                    <PlatformCompliance />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/knowledge-base"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading knowledge base..." />}>
                    <AdminKnowledgeBase />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/control-panel"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading control panel..." />}>
                    <AdminControlPanel />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading settings..." />}>
                    <AdminSettings />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/audit/logs"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading audit logs..." />}>
                    <AdminAuditLogs />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/audit/admin-activity"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading admin activity..." />}>
                    <AdminActivityLogs />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/admin/audit/security"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading security logs..." />}>
                    <AdminSecurityLogs />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/firm/dashboard"
            element={
              <Suspense fallback={<RouteLoader message="Loading admin panel..." />}>
                <AdminLayout>
                  <Suspense fallback={<RouteLoader message="Loading firm dashboard..." />}>
                    <CAFirmAdminDashboard />
                  </Suspense>
                </AdminLayout>
              </Suspense>
            }
          />
          <Route
            path="/ca/clients"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading clients..." />}>
                  <CAStaffDashboard />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/ca/clients/manage"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading client management..." />}>
                  <CAClientManagement />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/ca/analytics"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading analytics..." />}>
                  <CAAnalytics />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/ca/checkout"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading checkout..." />}>
                  <CACheckout />
                </Suspense>
              </Layout>
            }
          />


          {/* V3 CA Workspace */}
          <Route
            path="/ca/inbox"
            element={
              <Suspense fallback={<RouteLoader message="Loading inbox..." />}>
                <CAInbox />
              </Suspense>
            }
          />
          <Route
            path="/ca/filing/:filingId"
            element={
              <Suspense fallback={<RouteLoader message="Loading filing review..." />}>
                <CAFilingReview />
              </Suspense>
            }
          />

          {/* ITR Features */}
          <Route
            path="/itr/previous-year-selector"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading previous year selector..." />}>
                  <PreviousYearSelector />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/previous-year-preview"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading previous year preview..." />}>
                  <PreviousYearPreview />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/previous-year-review"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading previous year review..." />}>
                  <PreviousYearReview />
                </Suspense>
              </Layout>
            }
          />

          {/* Centralized Filing Routes */}
          {getAllFilingRoutes().map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Layout>
                  <Suspense fallback={<RouteLoader message={`Loading ${route.title || 'filing'}...`} />}>
                    <route.component />
                  </Suspense>
                </Layout>
              }
            />
          ))}

          <Route
            path="/filing-history"
            element={
              <Layout>
                <ITRProvider>
                  <Suspense fallback={<RouteLoader message="Loading filing history..." />}>
                    <FilingHistory />
                  </Suspense>
                </ITRProvider>
              </Layout>
            }
          />
          <Route
            path="/itr/refund-tracking"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading refund tracking..." />}>
                  <RefundTracking />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/itrv-tracking"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading ITR-V tracking..." />}>
                  <ITRVTracking />
                </Suspense>
              </Layout>
            }
          />

          <Route
            path="/itr/assessment-notices"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading assessment notices..." />}>
                  <AssessmentNotices />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/tax-demands"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading tax demands..." />}>
                  <TaxDemands />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/analytics"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading filing analytics..." />}>
                  <FilingAnalytics />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/e-verify"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading e-verification..." />}>
                  <EVerification />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/itr/acknowledgment"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading acknowledgment..." />}>
                  <AcknowledgmentRedirect />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/acknowledgment/:filingId"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading acknowledgment..." />}>
                  <Acknowledgment />
                </Suspense>
              </Layout>
            }
          />

          {/* User Management Routes */}
          <Route
            path="/documents"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading documents..." />}>
                  <Documents />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/add-members"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading members..." />}>
                  <AddMembers />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading profile..." />}>
                  <ProfileSettings />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/preferences"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading preferences..." />}>
                  <Preferences />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/notifications"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading notifications..." />}>
                  <NotificationsCenter />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/sessions"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading sessions..." />}>
                  <SessionManagement />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/financial-profile"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading financial profile..." />}>
                  <FinancialProfilePage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/tools"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading tools..." />}>
                  <ToolsPage />
                </Suspense>
              </Layout>
            }
          />

          {/* Firm Management Routes */}
          <Route
            path="/firm/:firmId/dashboard"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading firm dashboard..." />}>
                  <FirmDashboard />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/clients"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading clients..." />}>
                  <ClientList />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/clients/new"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading client onboarding..." />}>
                  <ClientOnboardingForm />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/firm/:firmId/review-queue"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading review queue..." />}>
                  <CAReviewQueue />
                </Suspense>
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
                <Suspense fallback={<RouteLoader message="Loading help center..." />}>
                  <HelpCenter />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/faqs"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading FAQs..." />}>
                  <FAQs />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/glossary"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading glossary..." />}>
                  <TaxGlossary />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/contact"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading contact support..." />}>
                  <ContactSupport />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/articles/:articleId"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading article..." />}>
                  <ArticleView />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/report-bug"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading bug report..." />}>
                  <ReportBug />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help/feature-request"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading feature request..." />}>
                  <FeatureRequest />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/service/tickets"
            element={
              <Layout>
                <Suspense fallback={<RouteLoader message="Loading service tickets..." />}>
                  <ServiceTicketManagement />
                </Suspense>
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
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();

    // Report performance metrics on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        reportPerformance();
      }, 2000); // Wait 2 seconds after load for all metrics to be collected
    });
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
