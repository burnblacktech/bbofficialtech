# Repository File Inventory - Part 3: Frontend Source Files

**Generated:** December 2024  
**Purpose:** Complete inventory of frontend source code files

---

## Frontend Entry Points

### `frontend/src/index.js`
**Description**: React application entry point with React Router, React Query, Toast notifications, global error handling, and WebSocket service initialization.  
**Functions**: Renders App component, sets up QueryClient, initializes WebSocket  
**Status**: ✅ Keep

### `frontend/src/App.js`
**Description**: Main App component with route definitions, lazy loading, protected routes, error boundaries, and code splitting.  
**Functions**: Defines all application routes, handles navigation, implements route protection  
**Status**: ✅ Keep

### `frontend/src/index.css`
**Description**: Global CSS styles and Tailwind CSS imports.  
**Status**: ✅ Keep

---

## Frontend Pages

### `frontend/src/pages/Acknowledgment.js`
**Description**: ITR submission acknowledgment page displaying filing confirmation, acknowledgment number, and next steps.  
**Status**: ✅ Keep

### `frontend/src/pages/HomeRedirect.js`
**Description**: Home redirect component that routes users to appropriate dashboard based on role.  
**Status**: ✅ Keep

### `frontend/src/pages/Landing/LandingPage.js`
**Description**: Landing page component for marketing and user acquisition.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/LoginPage.js`
**Description**: Login page with email/password and Google OAuth authentication.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/SignupPage.js`
**Description**: User signup page with email/password registration.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/MobileOTPSignup.js`
**Description**: Mobile OTP-based signup page.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/EmailVerification.js`
**Description**: Email verification page for account activation.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/MobileVerification.js`
**Description**: Mobile verification page for phone number verification.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/ForgotPassword.js`
**Description**: Forgot password page for password reset initiation.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/ResetPassword.js`
**Description**: Password reset page with token validation.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/GoogleOAuthSuccess.js`
**Description**: Google OAuth success callback handler page.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/GoogleOAuthError.js`
**Description**: Google OAuth error page for failed authentication.  
**Status**: ✅ Keep

### `frontend/src/pages/Auth/GoogleOAuthLinkRequired.js`
**Description**: Google OAuth account linking page.  
**Status**: ✅ Keep

### `frontend/src/pages/Onboarding/CompleteProfileGate.js`
**Description**: Profile completion gate page that enforces PAN verification and DOB before ITR computation.  
**Status**: ✅ Keep

### `frontend/src/pages/Dashboard/UserDashboard.js`
**Description**: User dashboard with filing resume hub, recent activity, quick actions, and filing statistics.  
**Status**: ✅ Keep

### `frontend/src/pages/Dashboard/AdminDashboard.js`
**Description**: Admin dashboard with user management, analytics, and platform administration.  
**Status**: ✅ Keep

### `frontend/src/pages/Dashboard/CADashboard.js`
**Description**: CA dashboard with client management, filing assignments, and CA-specific features.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/DetermineITR.js`
**Description**: Canonical ITR determination page that wraps DataSourceSelector for auto-detection and manual selection.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/ITRComputation.js`
**Description**: Main ITR computation page with guided data collection, section navigation, tax computation, and draft management.  
**Functions**: `handleSaveDraft()`, `handleSaveAndExit()`, `handleComputeTax()`, `goNextSection()`, `goPrevSection()`, `canProceedFromSection()`  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/ITRReview.js`
**Description**: ITR review and pre-submission validation page with validation checks, fix links, and submission handling.  
**Functions**: `handleSubmit()`, `handleFixSection()`, `runValidation()`  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/sectionFlow.js`
**Description**: Section flow configuration defining section order, required fields, and progressive disclosure rules per ITR type.  
**Functions**: `ITR_SECTION_FLOW`, `ITR_REQUIRED_FIELDS`, `normalizeITR()`, `hasAuditApplicabilitySignal()`, `shouldShowSection()`  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/PANVerification.js`
**Description**: PAN verification page with Surepass integration for PAN validation.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/EVerification.js`
**Description**: E-verification page for ITR e-verification (Aadhaar OTP, Net Banking, etc.).  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/ITRVTracking.js`
**Description**: ITR-V tracking page for monitoring ITR-V submission and processing status.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/RefundTracking.js`
**Description**: Refund tracking page for ITR refund status and history.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/TaxDemands.js`
**Description**: Tax demands page for viewing and managing tax assessment demands.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/AssessmentNotices.js`
**Description**: Assessment notices page for viewing and responding to tax department notices.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/FilingAnalytics.js`
**Description**: Filing analytics page with filing statistics, trends, and insights.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/DocumentUploadHub.js`
**Description**: Document upload hub for managing all ITR-related documents.  
**Status**: ✅ Keep

### `frontend/src/pages/ITR/ITRDirectSelection.js`
**Description**: Direct ITR selection page (legacy, may be redirected to DetermineITR).  
**Status**: ⚠️ Review (Check if still used)

### `frontend/src/pages/ITR/ITRModeSelection.js`
**Description**: ITR mode selection page (legacy, may be redirected to DetermineITR).  
**Status**: ⚠️ Review (Check if still used)

### `frontend/src/pages/ITR/IncomeSourceSelector.js`
**Description**: Income source selector page (legacy, may be redirected to DetermineITR).  
**Status**: ⚠️ Review (Check if still used)

### `frontend/src/pages/User/UserProfile.js`
**Description**: User profile page for viewing and editing user information.  
**Status**: ✅ Keep

### `frontend/src/pages/User/ProfileSettings.js`
**Description**: Profile settings page with returnTo support for navigation back to ITR review.  
**Status**: ✅ Keep

### `frontend/src/pages/User/SessionManagement.js`
**Description**: Session management page for viewing and managing active sessions.  
**Status**: ✅ Keep

### `frontend/src/pages/User/Services.js`
**Description**: User services page for accessing platform services.  
**Status**: ✅ Keep

### `frontend/src/pages/User/Members.js`
**Description**: Family members management page for CRUD operations on family members.  
**Status**: ✅ Keep

### `frontend/src/pages/User/FamilyManagement.js`
**Description**: Family management page (may be duplicate of Members.js).  
**Status**: ⚠️ Review

### `frontend/src/pages/User/Notifications.js`
**Description**: Notifications page for viewing and managing user notifications.  
**Status**: ✅ Keep

### `frontend/src/pages/User/Documents.js`
**Description**: Documents page for viewing and managing user documents.  
**Status**: ✅ Keep

### `frontend/src/pages/Admin/*.js`
**Description**: Admin pages for user management, analytics, settings, support, audit, documents, filings, and reports.  
**Status**: ✅ Keep

### `frontend/src/pages/CA/*.js`
**Description**: CA pages for firm registration, marketplace, profile, and CA-specific features.  
**Status**: ✅ Keep

### `frontend/src/pages/CABot/*.js`
**Description**: CA Bot pages for conversational ITR filing interface.  
**Status**: ✅ Keep

### `frontend/src/pages/Help/*.js`
**Description**: Help pages for knowledge base, FAQs, and support articles.  
**Status**: ✅ Keep

### `frontend/src/pages/Legal/*.js`
**Description**: Legal pages for terms of service, privacy policy, etc.  
**Status**: ✅ Keep

### `frontend/src/pages/Tools/*.js`
**Description**: Tools pages for tax calculators, deadlines, investment planning, knowledge base.  
**Status**: ✅ Keep

### `frontend/src/pages/Settings/*.js`
**Description**: Settings pages for user preferences and account settings.  
**Status**: ✅ Keep

### `frontend/src/pages/Invite/*.js`
**Description**: Invite pages for user invitations and referrals.  
**Status**: ✅ Keep

### `frontend/src/pages/Upgrade/*.js`
**Description**: Upgrade pages for subscription and plan upgrades.  
**Status**: ✅ Keep

### `frontend/src/pages/Service/*.js`
**Description**: Service pages for service ticket management and support.  
**Status**: ✅ Keep

### `frontend/src/pages/FinancialProfile/*.js`
**Description**: Financial profile pages for comprehensive financial information.  
**Status**: ✅ Keep

### `frontend/src/pages/Firm/*.js`
**Description**: CA firm pages for firm management and administration.  
**Status**: ✅ Keep

### `frontend/src/pages/Documents/*.js`
**Description**: Document pages for document management and viewing.  
**Status**: ✅ Keep

### `frontend/src/pages/Notifications/*.js`
**Description**: Notification pages for notification management.  
**Status**: ✅ Keep

---

## Frontend Components

### `frontend/src/components/Layout/index.js`
**Description**: Main layout component integrating Header, Sidebar, and Footer with responsive design.  
**Status**: ✅ Keep

### `frontend/src/components/Layout/Header.js`
**Description**: Application header with navigation, user menu, and mobile menu toggle.  
**Status**: ✅ Keep

### `frontend/src/components/Layout/Sidebar.js`
**Description**: Sidebar navigation with menu items, active state tracking, and responsive collapse.  
**Status**: ✅ Keep

### `frontend/src/components/Layout/Footer.js`
**Description**: Application footer with links, copyright, and legal information.  
**Status**: ✅ Keep

### `frontend/src/components/Layout/OnboardingWizard.js`
**Description**: Onboarding wizard component for first-time user experience with multi-step flow.  
**Status**: ✅ Keep

### `frontend/src/components/Layout/JourneyCompletion.jsx`
**Description**: Journey completion component for CA-assisted filing completion flow.  
**Status**: ✅ Keep

### `frontend/src/components/ErrorBoundary.js`
**Description**: React error boundary component for catching and handling React errors gracefully.  
**Status**: ✅ Keep

### `frontend/src/components/index.js`
**Description**: Components index file for centralized exports.  
**Status**: ✅ Keep

### `frontend/src/components/ITR/*.js`
**Description**: ITR components including DataSourceSelector, ITRFormRecommender, ComputationSidebar, TaxComputationBar, EVerificationModal, RecommendationPanel, and various ITR-specific UI components.  
**Status**: ✅ Keep

### `frontend/src/components/DesignSystem/*.js`
**Description**: Design system components including Button, FormInputs, LoadingState, ErrorMessage, EmptyState, StatusBadge, SectionCard, IncomeCard, Toast, Skeleton, ResponsiveSection, FixedViewportContainer.  
**Status**: ✅ Keep

### `frontend/src/components/UI/*.js`
**Description**: UI components including Alert, Tooltip, Toast, Select, Checkbox, CurrencyInput, FileUpload, DropdownMenu, ConfirmationDialog, BottomSheet, BreakdownList, ComparisonTable, ContextualHelpPanel, Disclaimer, DocumentVerification, FieldVerification, HelpIcon, InlineValidation, SectionVerification, SmartDefaults, VerificationState, TaxTermGlossary, AuditTrail, AISuggestionCard, AutoFillIndicator, FirstTimeTooltip, EditConfirmationDialog, progress, Skeleton, Skeletons, SourceChip, Dialog, AnimatedNumber.  
**Status**: ✅ Keep

### `frontend/src/components/Forms/*.js`
**Description**: Form components including PersonalInfoForm, ValidatedSelect, ValidatedNumberInput, and other form inputs.  
**Status**: ✅ Keep

### `frontend/src/components/Dashboard/*.js`
**Description**: Dashboard components including EnhancedDashboard, DataIntegrationDashboard, and dashboard-specific widgets.  
**Status**: ✅ Keep

### `frontend/src/components/CABot/CABot.tsx`
**Description**: CA Bot conversational interface component with voice support, language switching, and adaptive responses.  
**Status**: ✅ Keep

### `frontend/src/components/CA/*.js`
**Description**: CA components including CANotes, ClientCommunication, DocumentChecklist.  
**Status**: ✅ Keep

### `frontend/src/components/Documents/*.js`
**Description**: Document components including DocumentUpload and document management UI.  
**Status**: ✅ Keep

### `frontend/src/components/Admin/*.js`
**Description**: Admin components for admin dashboard and management interfaces.  
**Status**: ✅ Keep

### `frontend/src/components/auth/*.js`
**Description**: Authentication components including ProtectedRoute and auth-related UI.  
**Status**: ✅ Keep

### `frontend/src/components/common/*.js`
**Description**: Common components shared across the application.  
**Status**: ✅ Keep

### `frontend/src/components/Help/*.js`
**Description**: Help components for help articles and support UI.  
**Status**: ✅ Keep

### `frontend/src/components/Members/*.js`
**Description**: Family member components for member management UI.  
**Status**: ✅ Keep

### `frontend/src/components/Notifications/*.js`
**Description**: Notification components for notification display and management.  
**Status**: ✅ Keep

### `frontend/src/components/Payment/*.js`
**Description**: Payment components for payment processing UI.  
**Status**: ✅ Keep

### `frontend/src/components/Performance/*.jsx`
**Description**: Performance monitoring components.  
**Status**: ✅ Keep

### `frontend/src/components/Settings/*.jsx`
**Description**: Settings components for settings UI.  
**Status**: ✅ Keep

### `frontend/src/components/Staff/*.js`
**Description**: Staff management components for CA firm staff.  
**Status**: ✅ Keep

### `frontend/src/components/Firm/*.js`
**Description**: CA firm components for firm management UI.  
**Status**: ✅ Keep

### `frontend/src/components/Discrepancy/*.jsx`
**Description**: Discrepancy components for AIS/TIS discrepancy management.  
**Status**: ✅ Keep

### `frontend/src/components/BreakdownInput.js`
**Description**: Breakdown input component for itemized input fields.  
**Status**: ✅ Keep

---

## Frontend Features

### `frontend/src/features/itr/*.js`
**Description**: ITR feature components, hooks, and services for ITR-specific functionality.  
**Status**: ✅ Keep

### `frontend/src/features/income/*.js`
**Description**: Income feature components for salary, business, profession, capital gains, house property, other sources, foreign, agricultural, presumptive, director-partner, exempt income.  
**Status**: ✅ Keep

### `frontend/src/features/deductions/*.js`
**Description**: Deduction feature components for Section 80C, 80D, 80G, 80TTA, 80U, 80E, 80EE, 80CCC, 80CCD, 80DD, 80DDB, 80GGC, 80GGA, 80GG with itemized management.  
**Status**: ✅ Keep

### `frontend/src/features/personal-info/*.js`
**Description**: Personal info feature components for personal information management.  
**Status**: ✅ Keep

### `frontend/src/features/bank-details/*.js`
**Description**: Bank details feature components for bank account management.  
**Status**: ✅ Keep

### `frontend/src/features/foreign-assets/*.js`
**Description**: Foreign assets feature components for Schedule FA declarations.  
**Status**: ✅ Keep

### `frontend/src/features/discrepancy/*.js`
**Description**: Discrepancy feature components for AIS/TIS discrepancy detection and resolution.  
**Status**: ✅ Keep

### `frontend/src/features/submission/*.js`
**Description**: Submission feature components for ITR submission, validation, and e-verification.  
**Status**: ✅ Keep

### `frontend/src/features/computation/*.js`
**Description**: Computation feature components for tax computation UI and logic.  
**Status**: ✅ Keep

### `frontend/src/features/tax-optimizer/*.js`
**Description**: Tax optimizer feature components for tax optimization suggestions.  
**Status**: ✅ Keep

### `frontend/src/features/taxes-paid/*.js`
**Description**: Taxes paid feature components for TDS and advance tax management.  
**Status**: ✅ Keep

### `frontend/src/features/refund/*.js`
**Description**: Refund feature components for refund tracking and management.  
**Status**: ✅ Keep

### `frontend/src/features/pdf-export/*.js`
**Description**: PDF export feature components for generating ITR PDFs.  
**Status**: ✅ Keep

### `frontend/src/features/notifications/*.js`
**Description**: Notification feature hooks and services for notification management.  
**Status**: ✅ Keep

### `frontend/src/features/help/*.js`
**Description**: Help feature hooks and services for help articles.  
**Status**: ✅ Keep

### `frontend/src/features/ca-marketplace/*.js`
**Description**: CA marketplace feature hooks and services for CA marketplace functionality.  
**Status**: ✅ Keep

### `frontend/src/features/admin/*.js`
**Description**: Admin feature components, hooks, and services for admin dashboard and management.  
**Status**: ✅ Keep

### `frontend/src/features/tools/*.js`
**Description**: Tools feature components for calculators, deadlines, investment planning, knowledge base, document readers.  
**Status**: ✅ Keep

---

## Frontend Services

### `frontend/src/services/index.js`
**Description**: Services index file that exports all frontend services organized by category.  
**Status**: ✅ Keep

### `frontend/src/services/core/APIClient.js`
**Description**: Centralized API client with axios configuration, request/response interceptors, retry logic, error handling, and URL normalization.  
**Functions**: `get()`, `post()`, `put()`, `delete()`, `patch()`, `request()`  
**Status**: ✅ Keep

### `frontend/src/services/core/CacheService.js`
**Description**: Cache service for client-side caching with TTL support.  
**Functions**: `get()`, `set()`, `delete()`, `clear()`, `has()`  
**Status**: ✅ Keep

### `frontend/src/services/core/ErrorHandler.js`
**Description**: Error handler service for consistent error handling and user-friendly error messages.  
**Functions**: `handleError()`, `handleAPIError()`, `handleValidationError()`  
**Status**: ✅ Keep

### `frontend/src/services/api/authService.js`
**Description**: Authentication service for login, signup, OAuth, password reset, and profile management.  
**Functions**: `login()`, `signup()`, `logout()`, `refreshToken()`, `getProfile()`, `updateProfile()`, `completeOnboarding()`  
**Status**: ✅ Keep

### `frontend/src/services/api/itrService.js`
**Description**: ITR service for draft management, tax computation, submission, and filing operations.  
**Functions**: `createITR()`, `updateDraft()`, `getDraft()`, `getUserDrafts()`, `computeTax()`, `submitITR()`, `getFilingById()`, `getUserFilings()`  
**Status**: ✅ Keep

### `frontend/src/services/api/documentService.js`
**Description**: Document service for document upload, retrieval, and management.  
**Functions**: `uploadDocument()`, `getDocument()`, `getUserDocuments()`, `deleteDocument()`  
**Status**: ✅ Keep

### `frontend/src/services/api/paymentService.js`
**Description**: Payment service for payment processing and invoice management.  
**Functions**: `createPayment()`, `verifyPayment()`, `getInvoices()`, `getPaymentHistory()`  
**Status**: ✅ Keep

### `frontend/src/services/api/memberService.js`
**Description**: Member service for family member CRUD operations.  
**Functions**: `getMembers()`, `createMember()`, `updateMember()`, `deleteMember()`  
**Status**: ✅ Keep

### `frontend/src/services/api/bankService.js`
**Description**: Bank service for bank account management.  
**Functions**: `getBankAccounts()`, `addBankAccount()`, `updateBankAccount()`, `deleteBankAccount()`  
**Status**: ✅ Keep

### `frontend/src/services/personalInfoService.js`
**Description**: Personal info service for personal information management.  
**Functions**: `getPersonalInfo()`, `updatePersonalInfo()`, `validatePersonalInfo()`  
**Status**: ✅ Keep

### `frontend/src/services/ITRAutoDetector.js`
**Description**: ITR auto-detector service for recommending ITR form based on user input.  
**Functions**: `detectITRType()`, `getRecommendation()`, `getConfidence()`  
**Status**: ✅ Keep

### `frontend/src/services/CABotService.js`
**Description**: CA Bot service for conversational ITR filing with OpenAI GPT-4 integration.  
**Functions**: `sendMessage()`, `getChatHistory()`, `clearChat()`, `getSuggestions()`  
**Status**: ✅ Keep

### `frontend/src/services/form16ExtractionService.js`
**Description**: Form 16 extraction service for OCR and data extraction from Form 16 PDFs.  
**Functions**: `extractForm16()`, `uploadForm16()`, `getExtractionStatus()`  
**Status**: ✅ Keep

### `frontend/src/services/bankStatementService.js`
**Description**: Bank statement service for processing bank statements.  
**Functions**: `uploadBankStatement()`, `processBankStatement()`  
**Status**: ✅ Keep

### `frontend/src/services/BrokerAPIService.js`
**Description**: Broker API service for processing Zerodha, Angel One, Upstox files.  
**Functions**: `uploadBrokerFile()`, `processBrokerFile()`, `getBrokerData()`  
**Status**: ✅ Keep

### `frontend/src/services/BankAPIService.js`
**Description**: Bank API service for bank integration.  
**Status**: ✅ Keep

### `frontend/src/services/DeductionOCRService.js`
**Description**: Deduction OCR service for extracting deduction information from documents.  
**Status**: ✅ Keep

### `frontend/src/services/DataIntegrationService.js`
**Description**: Data integration service for integrating data from multiple sources.  
**Status**: ✅ Keep

### `frontend/src/services/FinancialProfileService.js`
**Description**: Financial profile service for comprehensive financial information management.  
**Status**: ✅ Keep

### `frontend/src/services/AISForm26ASService.js`
**Description**: AIS/Form 26AS service for fetching and processing AIS data.  
**Status**: ✅ Keep

### `frontend/src/services/DocumentProcessingService.js`
**Description**: Document processing service for OCR and document analysis.  
**Status**: ✅ Keep

### `frontend/src/services/AutoPopulationITRService.js`
**Description**: Auto-population service for automatically filling ITR data from various sources.  
**Status**: ✅ Keep

### `frontend/src/services/AutoPopulationService.js`
**Description**: Auto-population service (may be duplicate of AutoPopulationITRService).  
**Status**: ⚠️ Review

### `frontend/src/services/taxComputation.js`
**Description**: Tax computation service for client-side tax calculations.  
**Status**: ✅ Keep

### `frontend/src/services/taxSavingsService.js`
**Description**: Tax savings service for calculating tax savings and optimization suggestions.  
**Status**: ✅ Keep

### `frontend/src/services/everificationService.js`
**Description**: E-verification service for ITR e-verification.  
**Functions**: `initiateVerification()`, `verifyOTP()`, `verifyNetBanking()`, `getVerificationStatus()`  
**Status**: ✅ Keep

### `frontend/src/services/VerificationStatusService.js`
**Description**: Verification status service for tracking verification status.  
**Status**: ✅ Keep

### `frontend/src/services/surepassService.js`
**Description**: Surepass service for PAN verification via Surepass API.  
**Status**: ✅ Keep

### `frontend/src/services/eriService.js`
**Description**: ERI service for ITR submission to Income Tax Department.  
**Status**: ✅ Keep

### `frontend/src/services/FieldLockService.js`
**Description**: Field lock service for managing field editability and locking.  
**Status**: ✅ Keep

### `frontend/src/services/filingListService.js`
**Description**: Filing list service for managing filing lists and filters.  
**Status**: ✅ Keep

### `frontend/src/services/userDashboardService.js`
**Description**: User dashboard service for dashboard data and statistics.  
**Status**: ✅ Keep

### `frontend/src/services/userPreferencesService.js`
**Description**: User preferences service for managing user preferences.  
**Status**: ✅ Keep

### `frontend/src/services/websocketService.js`
**Description**: WebSocket service for real-time communication and notifications.  
**Status**: ✅ Keep

### `frontend/src/services/realtimeSync.js`
**Description**: Real-time sync service for synchronizing data across clients.  
**Status**: ✅ Keep

### `frontend/src/services/SSENotificationClient.js`
**Description**: SSE (Server-Sent Events) notification client for real-time notifications.  
**Status**: ✅ Keep

### `frontend/src/services/itrJsonExportService.js`
**Description**: ITR JSON export service for generating ITR JSON files.  
**Status**: ✅ Keep

### `frontend/src/services/FormDataService.js`
**Description**: Form data service for managing form data and validation.  
**Status**: ✅ Keep

### `frontend/src/services/documentService.js`
**Description**: Document service (may be duplicate of api/documentService).  
**Status**: ⚠️ Review

### `frontend/src/services/auditService.js`
**Description**: Audit service for frontend audit logging.  
**Status**: ✅ Keep

### `frontend/src/services/AIRecommendationEngine.js`
**Description**: AI recommendation engine for tax optimization and deduction suggestions.  
**Status**: ✅ Keep

### `frontend/src/services/CapitalGainsOCRService.js`
**Description**: Capital gains OCR service for extracting capital gains data from documents.  
**Status**: ✅ Keep

### `frontend/src/services/RentReceiptOCRService.js`
**Description**: Rent receipt OCR service for extracting rent receipt data.  
**Status**: ✅ Keep

### `frontend/src/services/EnterpriseDebugger.js`
**Description**: Enterprise debugger service for debugging and error tracking.  
**Status**: ✅ Keep

---

## Frontend Contexts

### `frontend/src/contexts/index.js`
**Description**: Contexts index file exporting all context providers and hooks.  
**Status**: ✅ Keep

### `frontend/src/contexts/AuthContext.js`
**Description**: Authentication context providing user state, login, logout, and authentication methods.  
**Functions**: `useAuth()`, `login()`, `logout()`, `refreshUser()`  
**Status**: ✅ Keep

### `frontend/src/contexts/ITRContext.js`
**Description**: ITR context providing ITR state, draft management, and ITR operations.  
**Functions**: `useITR()`, `setDraft()`, `updateDraft()`, `getDraft()`  
**Status**: ✅ Keep

### `frontend/src/contexts/AppContext.js`
**Description**: Application context providing app-wide state and configuration.  
**Functions**: `useApp()`  
**Status**: ✅ Keep

### `frontend/src/contexts/NotificationContext.js`
**Description**: Notification context providing notification state and management.  
**Functions**: `useNotificationContext()`, `addNotification()`, `removeNotification()`  
**Status**: ✅ Keep

---

## Frontend Hooks

### `frontend/src/hooks/index.js`
**Description**: Hooks index file exporting all custom hooks.  
**Status**: ✅ Keep

### `frontend/src/hooks/useTaxComputation.js`
**Description**: Hook for tax computation with React Query integration.  
**Status**: ✅ Keep

### `frontend/src/hooks/useUserDashboard.js`
**Description**: Hook for user dashboard data fetching and management.  
**Status**: ✅ Keep

### `frontend/src/hooks/useDashboard.js`
**Description**: Dashboard hook (may be duplicate of useUserDashboard).  
**Status**: ⚠️ Review

### `frontend/src/hooks/useDashboardRealtime.js`
**Description**: Real-time dashboard hook for live dashboard updates.  
**Status**: ✅ Keep

### `frontend/src/hooks/useAdminDashboardRealtime.js`
**Description**: Admin real-time dashboard hook.  
**Status**: ✅ Keep

### `frontend/src/hooks/useAutoSave.js`
**Description**: Auto-save hook for automatically saving form data.  
**Status**: ✅ Keep

### `frontend/src/hooks/useDraftManagement.js`
**Description**: Draft management hook for ITR draft operations.  
**Status**: ✅ Keep

### `frontend/src/hooks/useErrorRecovery.js`
**Description**: Error recovery hook for handling and recovering from errors.  
**Status**: ✅ Keep

### `frontend/src/hooks/useMemoryOptimization.js`
**Description**: Memory optimization hook for optimizing component memory usage.  
**Status**: ✅ Keep

### `frontend/src/hooks/useChatbot.js`
**Description**: Chatbot hook for CA Bot integration.  
**Status**: ✅ Keep

### `frontend/src/hooks/useChat.js`
**Description**: Chat hook (may be duplicate of useChatbot).  
**Status**: ⚠️ Review

### `frontend/src/hooks/useOnboarding.js`
**Description**: Onboarding hook for onboarding state management.  
**Status**: ✅ Keep

### `frontend/src/hooks/useFilingList.js`
**Description**: Filing list hook for managing filing lists.  
**Status**: ✅ Keep

### `frontend/src/hooks/useFilingStatistics.js`
**Description**: Filing statistics hook for filing statistics data.  
**Status**: ✅ Keep

### `frontend/src/hooks/useBulkUpdateFilings.js`
**Description**: Bulk update filings hook for batch operations.  
**Status**: ✅ Keep

### `frontend/src/hooks/useIntakeStore.js`
**Description**: Intake store hook for intake data management.  
**Status**: ✅ Keep

### `frontend/src/hooks/useDataPrefetch.js`
**Description**: Data prefetch hook for prefetching data.  
**Status**: ✅ Keep

### `frontend/src/hooks/useDebounce.js`
**Description**: Debounce hook for debouncing function calls.  
**Status**: ✅ Keep

### `frontend/src/hooks/useRealtimeSync.js`
**Description**: Real-time sync hook for real-time data synchronization.  
**Status**: ✅ Keep

### `frontend/src/hooks/useRealTimeValidation.js`
**Description**: Real-time validation hook for live form validation.  
**Status**: ✅ Keep

### `frontend/src/hooks/useSmartPolling.js`
**Description**: Smart polling hook for intelligent data polling.  
**Status**: ✅ Keep

---

## Frontend Utils

### `frontend/src/utils/index.js`
**Description**: Utils index file re-exporting all utilities.  
**Status**: ✅ Keep

### `frontend/src/utils/cn.js`
**Description**: Utility for merging Tailwind CSS classes and Indian currency/number formatting.  
**Functions**: `cn()`, `formatIndianCurrency()`, `formatIndianNumber()`, `parseIndianNumber()`, `numberToWords()`  
**Status**: ✅ Keep

### `frontend/src/utils/api-validation.js`
**Description**: API response validation utility.  
**Functions**: `validateResponse()`, `validateData()`  
**Status**: ✅ Keep

### `frontend/src/utils/sanitize.js`
**Description**: Input sanitization utility for XSS prevention.  
**Functions**: `sanitize()`, `sanitizeHTML()`, `sanitizeInput()`  
**Status**: ✅ Keep

### `frontend/src/utils/storageService.js`
**Description**: Local storage service for persistent storage.  
**Functions**: `get()`, `set()`, `remove()`, `clear()`  
**Status**: ✅ Keep

### `frontend/src/utils/validationService.js`
**Description**: Client-side validation service.  
**Functions**: `validate()`, `validateField()`, `validateForm()`  
**Status**: ✅ Keep

### `frontend/src/utils/errorHandler.js`
**Description**: Global error handler utility.  
**Functions**: `setupGlobalErrorHandler()`, `handleError()`  
**Status**: ✅ Keep

### `frontend/src/utils/analyticsEvents.js`
**Description**: Analytics events utility for tracking user actions.  
**Functions**: `trackEvent()`, `trackPageView()`, `trackError()`  
**Status**: ✅ Keep

### `frontend/src/utils/webVitals.js`
**Description**: Web vitals utility for performance monitoring.  
**Functions**: `initWebVitals()`, `reportWebVital()`  
**Status**: ✅ Keep

### `frontend/src/utils/performanceMonitor.js`
**Description**: Performance monitor utility for tracking performance metrics.  
**Functions**: `reportPerformance()`, `trackAPICall()`, `trackRenderTime()`  
**Status**: ✅ Keep

### `frontend/src/utils/logger.js`
**Description**: Frontend logger utility for client-side logging.  
**Functions**: `log()`, `error()`, `warn()`, `info()`  
**Status**: ✅ Keep

### `frontend/src/utils/dateUtils.js`
**Description**: Date utility functions for date formatting and calculations.  
**Functions**: `formatDate()`, `getFinancialYear()`, `getAssessmentYear()`  
**Status**: ✅ Keep

### `frontend/src/utils/currencyUtils.js`
**Description**: Currency utility functions (may be in cn.js).  
**Status**: ⚠️ Review

### `frontend/src/utils/formatUtils.js`
**Description**: Format utility functions for various formatting needs.  
**Status**: ✅ Keep

### `frontend/src/utils/routerUtils.js`
**Description**: Router utility functions for navigation helpers.  
**Status**: ✅ Keep

### `frontend/src/utils/queryUtils.js`
**Description**: Query utility functions for React Query helpers.  
**Status**: ✅ Keep

### `frontend/src/utils/permissionUtils.js`
**Description**: Permission utility functions for role-based access control.  
**Status**: ✅ Keep

### `frontend/src/utils/constants.js`
**Description**: Constants utility (may be in constants/index.js).  
**Status**: ⚠️ Review

---

## Frontend Constants

### `frontend/src/constants/index.js`
**Description**: Constants index file with API endpoints, ITR types, deduction types, income types, validation patterns, tax slabs, section limits, HTTP status codes, error messages, success messages.  
**Status**: ✅ Keep

### `frontend/src/constants/designTokens.js`
**Description**: Design tokens constants for colors, typography, spacing, shadows.  
**Status**: ✅ Keep

### `frontend/src/constants/navigation.js`
**Description**: Navigation constants for route definitions and navigation structure.  
**Status**: ✅ Keep

### `frontend/src/constants/roles.js`
**Description**: User roles constants for RBAC.  
**Status**: ✅ Keep

### `frontend/src/constants/panVerification.js`
**Description**: PAN verification constants and configuration.  
**Status**: ✅ Keep

### `frontend/src/constants/fieldEditability.js`
**Description**: Field editability constants for determining which fields can be edited.  
**Status**: ✅ Keep

---

## Frontend Store

### `frontend/src/store/index.js`
**Description**: Store index file for state management.  
**Status**: ✅ Keep

### `frontend/src/store/authStore.js`
**Description**: Authentication store for auth state management.  
**Status**: ✅ Keep

### `frontend/src/store/intakeStore.js`
**Description**: Intake store for intake data management.  
**Status**: ✅ Keep

---

## Frontend Styles

### `frontend/src/styles/GlobalStyles.css`
**Description**: Global CSS styles for the application.  
**Status**: ✅ Keep

### `frontend/src/styles/*.css`
**Description**: Additional CSS files for component-specific styles.  
**Status**: ✅ Keep

---

## Frontend Other Files

### `frontend/src/lib/*.js`
**Description**: Legacy lib directory (may be consolidated into utils).  
**Status**: ⚠️ Review (Check if still used)

### `frontend/src/mocks/*.js`
**Description**: Mock data files for testing and development.  
**Status**: ✅ Keep (Development/Testing)

### `frontend/src/__tests__/*.js`
**Description**: Test files for integration and validation tests.  
**Status**: ✅ Keep

### `frontend/src/hocs/*.js`
**Description**: Higher-order components for component composition.  
**Status**: ✅ Keep

### `frontend/scripts/replace-console-calls.js`
**Description**: Script to replace console calls in production builds.  
**Status**: ✅ Keep

---

**Next:** See [Part 4: Scripts Directory](REPOSITORY_INVENTORY_PART4_SCRIPTS.md)

