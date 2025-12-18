# Repository File Inventory - Part 2: Backend Source Files

**Generated:** December 2024  
**Purpose:** Complete inventory of backend source code files

---

## Backend Entry Points

### `backend/src/server.js`
**Description**: HTTP/HTTPS server entry point with Express app initialization, database connection, Redis service, job queue, WebSocket manager, and graceful shutdown handling.  
**Functions**: Creates HTTP/HTTPS server, initializes services, handles process signals  
**Status**: ✅ Keep

### `backend/src/app.js`
**Description**: Express application configuration with middleware (CORS, Helmet, Morgan, compression, cookie-parser, session, Passport), route registration, and error handling.  
**Functions**: Configures Express app, registers middleware and routes  
**Status**: ✅ Keep

### `backend/src/index.js`
**Description**: Application entry point that validates environment variables and initializes the server.  
**Functions**: Validates required env vars, initializes application  
**Status**: ✅ Keep

### `backend/api/index.js`
**Description**: Vercel serverless function entry point that exports the Express app for Vercel deployment.  
**Status**: ✅ Keep (If using Vercel)

---

## Backend Configuration

### `backend/src/config/database.js`
**Description**: Sequelize database configuration with connection pooling, retry logic, and connection testing.  
**Functions**: `initializeDatabase()`, `testConnection()`, `getSequelize()`  
**Status**: ✅ Keep

### `backend/src/config/passport.js`
**Description**: Passport.js configuration for JWT and Google OAuth authentication strategies.  
**Functions**: Configures JWT and Google OAuth strategies  
**Status**: ✅ Keep

---

## Backend Controllers

### `backend/src/controllers/UserController.js`
**Description**: User management controller handling profile, dashboard, settings, notifications, password changes, and Aadhaar linking.  
**Functions**: `getUserProfile()`, `updateUserProfile()`, `getUserDashboard()`, `getUserSettings()`, `updateUserSettings()`, `getUserNotifications()`, `changePassword()`, `verifyAadhaar()`, `linkAadhaar()`, `unlinkAadhaar()`, `getAadhaarStatus()`  
**Status**: ✅ Keep

### `backend/src/controllers/ITRController.js`
**Description**: ITR filing controller handling draft creation, updates, tax computation, validation, submission, e-verification, and filing management.  
**Functions**: `createDraft()`, `updateDraft()`, `getDraft()`, `getUserDrafts()`, `computeTax()`, `submitITR()`, `getFiling()`, `getUserFilings()`, `validateDraft()`, `getRefundTracking()`, `getITRVTracking()`  
**Status**: ✅ Keep

### `backend/src/controllers/AuthController.js`
**Description**: Authentication controller handling login, signup, email/mobile verification, password reset, Google OAuth, and token refresh.  
**Functions**: `login()`, `signup()`, `verifyEmail()`, `verifyMobile()`, `forgotPassword()`, `resetPassword()`, `googleAuth()`, `googleCallback()`, `refreshToken()`, `logout()`  
**Status**: ✅ Keep

### `backend/src/controllers/MemberController.js`
**Description**: Family member management controller for CRUD operations on family members.  
**Functions**: `getMembers()`, `createMember()`, `updateMember()`, `deleteMember()`  
**Status**: ✅ Keep

### `backend/src/controllers/BankController.js`
**Description**: Bank account management controller for adding, updating, and managing bank details.  
**Functions**: `getBankAccounts()`, `addBankAccount()`, `updateBankAccount()`, `deleteBankAccount()`, `setPrimaryBankAccount()`  
**Status**: ✅ Keep

### `backend/src/controllers/DocumentController.js`
**Description**: Document management controller for uploading, retrieving, and managing documents.  
**Functions**: `uploadDocument()`, `getDocument()`, `getUserDocuments()`, `deleteDocument()`, `updateDocument()`  
**Status**: ✅ Keep

### `backend/src/controllers/PaymentController.js`
**Description**: Payment processing controller for Razorpay/Stripe integration, invoice generation, and payment verification.  
**Functions**: `createPayment()`, `verifyPayment()`, `getInvoices()`, `getPaymentHistory()`, `refundPayment()`  
**Status**: ✅ Keep

### `backend/src/controllers/CABotController.js`
**Description**: CA Bot controller for AI-powered conversational ITR filing interface using OpenAI GPT-4.  
**Functions**: `chat()`, `getChatHistory()`, `clearChat()`, `getSuggestions()`  
**Status**: ✅ Keep

### `backend/src/controllers/ServiceTicketController.js`
**Description**: Service ticket controller for support ticket creation, management, and assignment.  
**Functions**: `createTicket()`, `getTickets()`, `getTicket()`, `updateTicket()`, `addMessage()`, `assignTicket()`, `closeTicket()`  
**Status**: ✅ Keep

### `backend/src/controllers/AdminController.js`
**Description**: Admin dashboard controller for user management, analytics, and platform administration.  
**Functions**: `getDashboard()`, `getUsers()`, `getUser()`, `updateUser()`, `deleteUser()`, `getAnalytics()`  
**Status**: ✅ Keep

### `backend/src/controllers/AdminAuditController.js`
**Description**: Admin audit controller for viewing audit logs and system activity.  
**Functions**: `getAuditLogs()`, `getUserActivity()`, `getSystemActivity()`  
**Status**: ✅ Keep

### `backend/src/controllers/AdminFinancialController.js`
**Description**: Admin financial controller for payment analytics, revenue tracking, and financial reports.  
**Functions**: `getFinancialDashboard()`, `getRevenue()`, `getPayments()`, `getInvoices()`  
**Status**: ✅ Keep

### `backend/src/controllers/AdminSettingsController.js`
**Description**: Admin settings controller for platform configuration and feature flags.  
**Functions**: `getSettings()`, `updateSettings()`, `getFeatureFlags()`, `updateFeatureFlags()`  
**Status**: ✅ Keep

### `backend/src/controllers/AdminSupportController.js`
**Description**: Admin support controller for managing service tickets and support operations.  
**Functions**: `getTickets()`, `assignTicket()`, `updateTicket()`, `getTicketStats()`  
**Status**: ✅ Keep

### `backend/src/controllers/AssessmentNoticeController.js`
**Description**: Assessment notice controller for managing tax assessment notices and responses.  
**Functions**: `getNotices()`, `getNotice()`, `respondToNotice()`, `uploadResponse()`  
**Status**: ✅ Keep

### `backend/src/controllers/TaxDemandController.js`
**Description**: Tax demand controller for managing tax demands, payments, and disputes.  
**Functions**: `getDemands()`, `getDemand()`, `payDemand()`, `disputeDemand()`, `getPaymentHistory()`  
**Status**: ✅ Keep

### `backend/src/controllers/ITRVController.js`
**Description**: ITR-V processing controller for tracking ITR-V status and processing.  
**Functions**: `getITRVStatus()`, `getITRVHistory()`, `submitITRV()`  
**Status**: ✅ Keep

### `backend/src/controllers/BrokerController.js`
**Description**: Broker integration controller for processing broker files (Zerodha, Angel One, Upstox).  
**Functions**: `uploadBrokerFile()`, `processBrokerFile()`, `getBrokerData()`  
**Status**: ✅ Keep

### `backend/src/controllers/HelpController.js`
**Description**: Help articles controller for knowledge base and FAQ management.  
**Functions**: `getArticles()`, `getArticle()`, `searchArticles()`, `getCategories()`  
**Status**: ✅ Keep

### `backend/src/controllers/ToolsController.js`
**Description**: Tools controller for tax calculators, deadlines, and utility tools.  
**Functions**: `calculateTax()`, `getDeadlines()`, `getTaxSlabs()`, `getExemptions()`  
**Status**: ✅ Keep

### `backend/src/controllers/ScenarioController.js`
**Description**: Scenario controller for tax scenario planning and comparison.  
**Functions**: `createScenario()`, `getScenarios()`, `compareScenarios()`, `deleteScenario()`  
**Status**: ✅ Keep

### `backend/src/controllers/FilingAnalyticsController.js`
**Description**: Filing analytics controller for filing statistics and insights.  
**Functions**: `getFilingStats()`, `getUserFilingStats()`, `getFilingTrends()`  
**Status**: ✅ Keep

### `backend/src/controllers/PublicController.js`
**Description**: Public API controller for unauthenticated endpoints (landing page data, public info).  
**Functions**: `getPublicInfo()`, `getPricing()`, `getFeatures()`  
**Status**: ✅ Keep

### `backend/src/controllers/eriController.js`
**Description**: ERI (Electronic Return Intermediary) controller for ITR submission to Income Tax Department.  
**Functions**: `submitToERI()`, `getERIStatus()`, `downloadAcknowledgment()`  
**Status**: ✅ Keep

### `backend/src/controllers/SubscriptionController.js`
**Description**: Subscription controller for CA firm subscriptions and plan management.  
**Functions**: `getPlans()`, `subscribe()`, `cancelSubscription()`, `updateSubscription()`, `getSubscription()`  
**Status**: ✅ Keep

---

## Backend Routes

### `backend/src/routes/index.js`
**Description**: Main route aggregator that imports and registers all route modules.  
**Status**: ✅ Keep

### `backend/src/routes/router.js`
**Description**: Router configuration with route definitions and middleware application.  
**Status**: ✅ Keep

### `backend/src/routes/api.js`
**Description**: API route definitions for versioning and base API paths.  
**Status**: ✅ Keep

### `backend/src/routes/auth.js`
**Description**: Authentication routes (login, signup, OAuth, password reset, profile).  
**Status**: ✅ Keep

### `backend/src/routes/itr.js`
**Description**: ITR routes (drafts, filings, tax computation, submission, validation, tracking).  
**Status**: ✅ Keep

### `backend/src/routes/user.js`
**Description**: User routes (profile, dashboard, settings, notifications).  
**Status**: ✅ Keep

### `backend/src/routes/members.js`
**Description**: Family member routes (CRUD operations).  
**Status**: ✅ Keep

### `backend/src/routes/bank.js`
**Description**: Bank account routes (add, update, delete, set primary).  
**Status**: ✅ Keep

### `backend/src/routes/documents.js`
**Description**: Document routes (upload, get, list, delete).  
**Status**: ✅ Keep

### `backend/src/routes/payments.js`
**Description**: Payment routes (create payment, verify, invoices, refunds).  
**Status**: ✅ Keep

### `backend/src/routes/cabot.js`
**Description**: CA Bot routes (chat, history, suggestions).  
**Status**: ✅ Keep

### `backend/src/routes/tickets.js`
**Description**: Service ticket routes (create, get, update, assign, close).  
**Status**: ✅ Keep

### `backend/src/routes/admin.js`
**Description**: Admin routes (dashboard, users, analytics, settings).  
**Status**: ✅ Keep

### `backend/src/routes/admin/*.js`
**Description**: Admin sub-routes for specific admin features.  
**Status**: ✅ Keep

### `backend/src/routes/analytics.js`
**Description**: Analytics routes for tracking events and metrics.  
**Status**: ✅ Keep

### `backend/src/routes/assessment-notices.js`
**Description**: Assessment notice routes (get, respond, upload).  
**Status**: ✅ Keep

### `backend/src/routes/tax-demands.js`
**Description**: Tax demand routes (get, pay, dispute).  
**Status**: ✅ Keep

### `backend/src/routes/itrv.js`
**Description**: ITR-V routes (status, history, submit).  
**Status**: ✅ Keep

### `backend/src/routes/broker.js`
**Description**: Broker integration routes (upload, process files).  
**Status**: ✅ Keep

### `backend/src/routes/help.js`
**Description**: Help article routes (get, search, categories).  
**Status**: ✅ Keep

### `backend/src/routes/tools.js`
**Description**: Tools routes (calculators, deadlines, tax slabs).  
**Status**: ✅ Keep

### `backend/src/routes/public.js`
**Description**: Public routes (landing page, pricing, features).  
**Status**: ✅ Keep

### `backend/src/routes/eri.js`
**Description**: ERI routes (submit, status, download acknowledgment).  
**Status**: ✅ Keep

### `backend/src/routes/subscriptions.js`
**Description**: Subscription routes (plans, subscribe, cancel, update).  
**Status**: ✅ Keep

### `backend/src/routes/ca-firms.js`
**Description**: CA firm routes (register, get, update, marketplace).  
**Status**: ✅ Keep

### `backend/src/routes/ca-marketplace.js`
**Description**: CA marketplace routes (browse, search, book, reviews).  
**Status**: ✅ Keep

### `backend/src/routes/firm-onboarding.js`
**Description**: CA firm onboarding routes (registration, verification).  
**Status**: ✅ Keep

### `backend/src/routes/support.js`
**Description**: Support routes (tickets, inquiries).  
**Status**: ✅ Keep

### `backend/src/routes/notifications.js`
**Description**: Notification routes (get, mark read, preferences).  
**Status**: ✅ Keep

### `backend/src/routes/ocr.js`
**Description**: OCR routes (Form 16 extraction, document processing).  
**Status**: ✅ Keep

### `backend/src/routes/drafts.js`
**Description**: Draft management routes (legacy, may be consolidated into itr.js).  
**Status**: ⚠️ Review (Check if still used)

### `backend/src/routes/health.js`
**Description**: Health check routes for monitoring and load balancers.  
**Status**: ✅ Keep

---

## Backend Models

### `backend/src/models/index.js`
**Description**: Sequelize models index that exports all models and sets up associations.  
**Functions**: Exports all models, `setupAssociations()`  
**Status**: ✅ Keep

### `backend/src/models/associations.js`
**Description**: Model associations definition (User → ITRFiling, User → FamilyMember, etc.).  
**Status**: ✅ Keep

### `backend/src/models/User.js`
**Description**: User model with authentication, profile, and role fields.  
**Status**: ✅ Keep

### `backend/src/models/UserProfile.js`
**Description**: Extended user profile model with additional user information.  
**Status**: ✅ Keep

### `backend/src/models/ITRFiling.js`
**Description**: ITR filing model storing submitted ITR data, status, acknowledgment number.  
**Status**: ✅ Keep

### `backend/src/models/ITRDraft.js`
**Description**: ITR draft model storing work-in-progress ITR data in JSONB format.  
**Status**: ✅ Keep

### `backend/src/models/FamilyMember.js`
**Description**: Family member model for multi-member ITR filing support.  
**Status**: ✅ Keep

### `backend/src/models/BankAccount.js`
**Description**: Bank account model for storing user bank details.  
**Status**: ✅ Keep

### `backend/src/models/Document.js`
**Description**: Document model for file uploads and document management.  
**Status**: ✅ Keep

### `backend/src/models/ServiceTicket.js`
**Description**: Service ticket model for support ticket management.  
**Status**: ✅ Keep

### `backend/src/models/ServiceTicketMessage.js`
**Description**: Service ticket message model for ticket conversation threads.  
**Status**: ✅ Keep

### `backend/src/models/Notification.js`
**Description**: Notification model for user notifications and alerts.  
**Status**: ✅ Keep

### `backend/src/models/Invoice.js`
**Description**: Invoice model for payment invoicing.  
**Status**: ✅ Keep

### `backend/src/models/Payment.js`
**Description**: Payment model (may be named TaxPayment.js, check actual file).  
**Status**: ✅ Keep

### `backend/src/models/TaxPayment.js`
**Description**: Tax payment model for tracking tax payments and TDS.  
**Status**: ✅ Keep

### `backend/src/models/TaxDemand.js`
**Description**: Tax demand model for assessment demands and notices.  
**Status**: ✅ Keep

### `backend/src/models/AssessmentNotice.js`
**Description**: Assessment notice model for tax department notices.  
**Status**: ✅ Keep

### `backend/src/models/ITRVProcessing.js`
**Description**: ITR-V processing model for tracking ITR-V submission and status.  
**Status**: ✅ Keep

### `backend/src/models/RefundTracking.js`
**Description**: Refund tracking model for ITR refund status.  
**Status**: ✅ Keep

### `backend/src/models/ForeignAsset.js`
**Description**: Foreign asset model for Schedule FA declarations.  
**Status**: ✅ Keep

### `backend/src/models/DiscrepancyResolution.js`
**Description**: Discrepancy resolution model for AIS/TIS discrepancy management.  
**Status**: ✅ Keep

### `backend/src/models/CAFirm.js`
**Description**: CA firm model for CA firm registration and management.  
**Status**: ✅ Keep

### `backend/src/models/CAFirmReview.js`
**Description**: CA firm review model for marketplace reviews.  
**Status**: ✅ Keep

### `backend/src/models/CABooking.js`
**Description**: CA booking model for CA marketplace bookings.  
**Status**: ✅ Keep

### `backend/src/models/CAMarketplaceInquiry.js`
**Description**: CA marketplace inquiry model for CA inquiries.  
**Status**: ✅ Keep

### `backend/src/models/Subscription.js`
**Description**: Subscription model (may be part of CAFirm or separate, check actual file).  
**Status**: ✅ Keep

### `backend/src/models/PricingPlan.js`
**Description**: Pricing plan model for subscription plans.  
**Status**: ✅ Keep

### `backend/src/models/UserSession.js`
**Description**: User session model for session management and tracking.  
**Status**: ✅ Keep

### `backend/src/models/PasswordResetToken.js`
**Description**: Password reset token model for secure password reset flow.  
**Status**: ✅ Keep

### `backend/src/models/AccountLinkingToken.js`
**Description**: Account linking token model for OAuth account linking.  
**Status**: ✅ Keep

### `backend/src/models/Invite.js`
**Description**: Invite model for user invitations and referrals.  
**Status**: ✅ Keep

### `backend/src/models/Consent.js`
**Description**: Consent model for user consent tracking (GDPR, data usage).  
**Status**: ✅ Keep

### `backend/src/models/Coupon.js`
**Description**: Coupon model for discount codes and promotions.  
**Status**: ✅ Keep

### `backend/src/models/Assignment.js`
**Description**: Assignment model for CA-to-client assignments.  
**Status**: ✅ Keep

### `backend/src/models/ReturnVersion.js`
**Description**: Return version model for ITR version history.  
**Status**: ✅ Keep

### `backend/src/models/Scenario.js`
**Description**: Scenario model for tax scenario planning.  
**Status**: ✅ Keep

### `backend/src/models/HelpArticle.js`
**Description**: Help article model for knowledge base articles.  
**Status**: ✅ Keep

### `backend/src/models/DocumentTemplate.js`
**Description**: Document template model for reusable document templates.  
**Status**: ✅ Keep

### `backend/src/models/PlatformSettings.js`
**Description**: Platform settings model for system-wide configuration.  
**Status**: ✅ Keep

### `backend/src/models/UserSegment.js`
**Description**: User segment model for user segmentation and targeting.  
**Status**: ✅ Keep

### `backend/src/models/DataSource.js`
**Description**: Data source model for tracking data source (Form 16, manual, broker, etc.).  
**Status**: ✅ Keep

### `backend/src/models/AuditLog.js`
**Description**: Audit log model for tracking system actions and changes.  
**Status**: ✅ Keep

---

## Backend Services

### `backend/src/services/index.js`
**Description**: Services index that exports all service modules.  
**Status**: ✅ Keep

### `backend/src/services/core/RedisService.js`
**Description**: Redis service for caching, session storage, and rate limiting.  
**Functions**: `get()`, `set()`, `del()`, `exists()`, `expire()`, `increment()`  
**Status**: ✅ Keep

### `backend/src/services/core/JobQueue.js`
**Description**: Job queue service using Bull for background job processing.  
**Functions**: `addJob()`, `processJob()`, `getJobStatus()`, `cancelJob()`  
**Status**: ✅ Keep

### `backend/src/services/core/ValidationEngine.js`
**Description**: Validation engine for ITR data validation and business rule checking.  
**Functions**: `validateDraft()`, `validateField()`, `validateSection()`, `getValidationErrors()`  
**Status**: ✅ Keep

### `backend/src/services/core/TaxComputationEngine.js`
**Description**: Tax computation engine for calculating income tax based on FY 2024-25 rules.  
**Functions**: `computeTax()`, `calculateIncomeTax()`, `calculateDeductions()`, `calculateRebates()`, `calculateFinalTax()`  
**Status**: ✅ Keep

### `backend/src/services/core/FileStorageService.js`
**Description**: File storage service for AWS S3 and local file uploads.  
**Functions**: `uploadFile()`, `getFile()`, `deleteFile()`, `getSignedUrl()`  
**Status**: ✅ Keep

### `backend/src/services/core/EmailService.js`
**Description**: Email service for sending emails via Resend/SendGrid.  
**Functions**: `sendEmail()`, `sendVerificationEmail()`, `sendPasswordResetEmail()`, `sendNotificationEmail()`  
**Status**: ✅ Keep

### `backend/src/services/core/SMSService.js`
**Description**: SMS service for sending SMS via Twilio.  
**Functions**: `sendSMS()`, `sendOTP()`, `sendNotificationSMS()`  
**Status**: ✅ Keep

### `backend/src/services/core/LoggerService.js`
**Description**: Logger service wrapper (may be in utils/logger.js).  
**Status**: ⚠️ Review (Check if duplicate)

### `backend/src/services/core/NotificationService.js`
**Description**: Notification service for SSE (Server-Sent Events) and WebSocket notifications.  
**Functions**: `sendNotification()`, `broadcastNotification()`, `getNotificationHistory()`  
**Status**: ✅ Keep

### `backend/src/services/business/ServiceTicketService.js`
**Description**: Service ticket business logic for ticket creation, assignment, and management.  
**Functions**: `createTicket()`, `updateTicket()`, `assignTicket()`, `closeTicket()`, `getTicketStats()`, `autoAssignTicket()`  
**Status**: ✅ Keep

### `backend/src/services/business/TaxComputationService.js`
**Description**: Tax computation business logic wrapper around TaxComputationEngine.  
**Status**: ⚠️ Review (Check if duplicate of TaxComputationEngine)

### `backend/src/services/business/EVerificationService.js`
**Description**: E-verification service for ITR e-verification (Aadhaar OTP, Net Banking, etc.).  
**Functions**: `initiateVerification()`, `verifyOTP()`, `verifyNetBanking()`, `getVerificationStatus()`  
**Status**: ✅ Keep

### `backend/src/services/business/RefundTrackingService.js`
**Description**: Refund tracking service for ITR refund status tracking.  
**Functions**: `getRefundStatus()`, `getRefundHistory()`, `updateRefundStatus()`  
**Status**: ✅ Keep

### `backend/src/services/business/DataMatchingService.js`
**Description**: Data matching service for AIS/TIS discrepancy detection and resolution.  
**Functions**: `matchData()`, `detectDiscrepancies()`, `resolveDiscrepancy()`  
**Status**: ✅ Keep

### `backend/src/services/business/TaxAuditChecker.js`
**Description**: Tax audit checker for determining audit applicability based on income and turnover.  
**Functions**: `checkAuditApplicability()`, `getAuditType()`, `getAuditRequirements()`  
**Status**: ✅ Keep

### `backend/src/services/business/Form16ExtractionService.js`
**Description**: Form 16 extraction service for OCR and data extraction from Form 16 PDFs.  
**Functions**: `extractForm16()`, `parseForm16PDF()`, `validateForm16Data()`  
**Status**: ✅ Keep

### `backend/src/services/business/BrokerFileProcessor.js`
**Description**: Broker file processor for parsing Zerodha, Angel One, Upstox files.  
**Functions**: `processZerodhaFile()`, `processAngelOneFile()`, `processUpstoxFile()`, `parseBrokerData()`  
**Status**: ✅ Keep

### `backend/src/services/business/DeductionDetectionService.js`
**Description**: Deduction detection service for AI-powered deduction type identification.  
**Functions**: `detectDeductionType()`, `suggestDeductions()`, `validateDeduction()`  
**Status**: ✅ Keep

### `backend/src/services/business/ITRAutoDetectorService.js`
**Description**: ITR auto-detector service for recommending ITR form based on user input.  
**Functions**: `detectITRType()`, `getRecommendation()`, `getConfidence()`  
**Status**: ✅ Keep

### `backend/src/services/business/ERIService.js`
**Description**: ERI service for ITR submission to Income Tax Department via ERI API.  
**Functions**: `submitITR()`, `getSubmissionStatus()`, `downloadAcknowledgment()`, `getITRVStatus()`  
**Status**: ✅ Keep

### `backend/src/services/ERIService.js`
**Description**: ERI service (may be duplicate, check if consolidated).  
**Status**: ⚠️ Review

### `backend/src/services/integration/*.js`
**Description**: Integration services for third-party APIs (payment gateways, OCR, etc.).  
**Status**: ✅ Keep

### `backend/src/services/utils/AuditService.js`
**Description**: Audit service for logging system actions and changes.  
**Functions**: `logAction()`, `getAuditLogs()`, `getUserActivity()`  
**Status**: ✅ Keep

### `backend/src/services/utils/NotificationService.js`
**Description**: Notification utility service (may be duplicate of core/NotificationService).  
**Status**: ⚠️ Review

### `backend/src/services/websocket/WebSocketManager.js`
**Description**: WebSocket manager for real-time communication and notifications.  
**Functions**: `initialize()`, `broadcast()`, `sendToUser()`, `getConnectedUsers()`  
**Status**: ✅ Keep

---

## Backend Middleware

### `backend/src/middleware/auth.js`
**Description**: JWT authentication middleware for protecting routes.  
**Functions**: `authenticate()`, `optionalAuth()`  
**Status**: ✅ Keep

### `backend/src/middleware/cookieAuth.js`
**Description**: Cookie-based authentication middleware.  
**Status**: ✅ Keep

### `backend/src/middleware/rbac.js`
**Description**: Role-based access control middleware for permission checking.  
**Functions**: `requireRole()`, `requirePermission()`, `checkPermission()`  
**Status**: ✅ Keep

### `backend/src/middleware/errorHandler.js`
**Description**: Global error handler middleware for error formatting and logging.  
**Functions**: `globalErrorHandler()`, `AppError` class  
**Status**: ✅ Keep

### `backend/src/middleware/validateRequest.js`
**Description**: Request validation middleware for input validation.  
**Functions**: `validate()`, `validateSchema()`  
**Status**: ✅ Keep

### `backend/src/middleware/auditLogger.js`
**Description**: Audit logging middleware for tracking API requests.  
**Functions**: `auditLog()`  
**Status**: ✅ Keep

### `backend/src/middleware/dataIsolation.js`
**Description**: Data isolation middleware for ensuring users can only access their own data.  
**Functions**: `enforceDataIsolation()`  
**Status**: ✅ Keep

### `backend/src/middleware/progressiveRateLimit.js`
**Description**: Progressive rate limiting middleware with increasing delays.  
**Functions**: `rateLimit()`  
**Status**: ✅ Keep

### `backend/src/middleware/redisRateLimitStore.js`
**Description**: Redis-based rate limit store for distributed rate limiting.  
**Functions**: `increment()`, `reset()`  
**Status**: ✅ Keep

---

## Backend Utils

### `backend/src/utils/logger.js`
**Description**: Enterprise logger using Winston with structured logging and multiple transports.  
**Functions**: `info()`, `error()`, `warn()`, `debug()`, `log()`  
**Status**: ✅ Keep

### `backend/src/utils/responseFormatter.js`
**Description**: Response formatter utility for consistent API response structure.  
**Functions**: `successResponse()`, `errorResponse()`, `validationErrorResponse()`, `notFoundResponse()`, `paginatedResponse()`  
**Status**: ✅ Keep

### `backend/src/utils/validationUtils.js`
**Description**: Validation utility functions for common validations.  
**Functions**: `validateITRType()`, `validateRequiredFields()`, `validatePagination()`, `validateEmail()`, `validatePAN()`  
**Status**: ✅ Keep

### `backend/src/utils/dbQuery.js`
**Description**: Database query utility for raw SQL queries with parameter binding.  
**Functions**: `query()`, `transaction()`  
**Status**: ✅ Keep

### `backend/src/utils/dbPoolMonitor.js`
**Description**: Database connection pool monitor for tracking pool usage and health.  
**Functions**: `getPoolStats()`, `monitorPool()`  
**Status**: ✅ Keep

### `backend/src/utils/encryption.js`
**Description**: Encryption utility for sensitive data encryption/decryption.  
**Functions**: `encrypt()`, `decrypt()`, `hash()`  
**Status**: ✅ Keep

### `backend/src/utils/fileUtils.js`
**Description**: File utility functions for file operations and validation.  
**Functions**: `validateFile()`, `getFileType()`, `getFileSize()`, `sanitizeFileName()`  
**Status**: ✅ Keep

### `backend/src/utils/dateUtils.js`
**Description**: Date utility functions for date formatting and calculations.  
**Functions**: `formatDate()`, `getFinancialYear()`, `getAssessmentYear()`, `isDateValid()`  
**Status**: ✅ Keep

### `backend/src/utils/currencyUtils.js`
**Description**: Currency utility functions for Indian currency formatting.  
**Functions**: `formatCurrency()`, `parseCurrency()`, `formatIndianCurrency()`  
**Status**: ✅ Keep

---

## Backend Constants and Common

### `backend/src/constants/assessmentYears.js`
**Description**: Assessment year constants and utilities.  
**Functions**: `DEFAULT_ASSESSMENT_YEAR`, `getDefaultAssessmentYear()`, `isValidAssessmentYear()`, `getFinancialYear()`  
**Status**: ✅ Keep

### `backend/src/common/featureFlags.js`
**Description**: Feature flags configuration for enabling/disabling features.  
**Functions**: `isEnabled()`, `getFlag()`, `setFlag()`  
**Status**: ✅ Keep

### `backend/src/common/rules/itr1.rules.json`
**Description**: ITR-1 business rules and validation rules in JSON format.  
**Status**: ✅ Keep

### `backend/src/common/rules/itr2.rules.json`
**Description**: ITR-2 business rules and validation rules in JSON format.  
**Status**: ✅ Keep

### `backend/src/common/rules/itr3.rules.json`
**Description**: ITR-3 business rules and validation rules in JSON format.  
**Status**: ✅ Keep

### `backend/src/common/rules/itr4.rules.json`
**Description**: ITR-4 business rules and validation rules in JSON format.  
**Status**: ✅ Keep

### `backend/src/common/taxSlabs/2024-25.json`
**Description**: Tax slabs for FY 2024-25 in JSON format.  
**Status**: ✅ Keep

---

## Backend Scripts

### `backend/src/scripts/migrate.js`
**Description**: Database migration runner script.  
**Functions**: Runs pending migrations  
**Status**: ✅ Keep

### `backend/src/scripts/migrateRobust.js`
**Description**: Robust migration runner with error handling and rollback.  
**Status**: ✅ Keep

### `backend/src/scripts/seed.js`
**Description**: Database seeding script for initial data.  
**Status**: ✅ Keep

### `backend/src/scripts/reset.js`
**Description**: Database reset script (drops and recreates database).  
**Status**: ✅ Keep (Development only)

### `backend/src/scripts/verifyDatabase.js`
**Description**: Database verification script for schema validation.  
**Status**: ✅ Keep

### `backend/src/scripts/createSuperAdmin.js`
**Description**: Script to create super admin user.  
**Status**: ✅ Keep

### `backend/src/scripts/resetAdminPassword.js`
**Description**: Script to reset admin password.  
**Status**: ✅ Keep

### `backend/src/scripts/resetAndCreateAdmin.js`
**Description**: Script to reset and create admin user.  
**Status**: ✅ Keep

### `backend/src/scripts/checkAdminUser.js`
**Description**: Script to check admin user existence.  
**Status**: ✅ Keep

### `backend/src/scripts/testAdminLogin.js`
**Description**: Script to test admin login.  
**Status**: ✅ Keep

### `backend/src/scripts/testConnection.js`
**Description**: Script to test database connection.  
**Status**: ✅ Keep

### `backend/src/scripts/testDirectConnection.js`
**Description**: Script to test direct database connection.  
**Status**: ✅ Keep

### `backend/src/scripts/testLoginQuery.js`
**Description**: Script to test login query.  
**Status**: ✅ Keep

### `backend/src/scripts/test-db-operations.js`
**Description**: Script to test database operations.  
**Status**: ✅ Keep

### `backend/src/scripts/test-eri-connection.js`
**Description**: Script to test ERI API connection.  
**Status**: ✅ Keep

### `backend/src/scripts/checkSupabaseSchema.js`
**Description**: Script to check Supabase schema compatibility.  
**Status**: ✅ Keep

### `backend/src/scripts/checkSupabaseStatus.js`
**Description**: Script to check Supabase service status.  
**Status**: ✅ Keep

### `backend/src/scripts/debugSupabase.js`
**Description**: Script to debug Supabase connection issues.  
**Status**: ✅ Keep

### `backend/src/scripts/checkCurrentSchema.js`
**Description**: Script to check current database schema.  
**Status**: ✅ Keep

### `backend/src/scripts/verifyAndSyncSchema.js`
**Description**: Script to verify and sync database schema.  
**Status**: ✅ Keep

### `backend/src/scripts/verifySchemaCompleteness.js`
**Description**: Script to verify schema completeness.  
**Status**: ✅ Keep

### `backend/src/scripts/runPendingMigrations.js`
**Description**: Script to run pending migrations.  
**Status**: ✅ Keep

### `backend/src/scripts/addMissingUserColumns.js`
**Description**: Script to add missing user table columns.  
**Status**: ⚠️ Review (One-time migration, may be obsolete)

### `backend/src/scripts/fixCAFirmSchema.js`
**Description**: Script to fix CA firm schema issues.  
**Status**: ⚠️ Review (One-time migration, may be obsolete)

### `backend/src/scripts/seed-help-articles.js`
**Description**: Script to seed help articles into database.  
**Status**: ✅ Keep

### `backend/src/scripts/generate-secrets.js`
**Description**: Script to generate secure secrets for JWT, encryption, etc.  
**Status**: ✅ Keep

### `backend/src/scripts/README.md`
**Description**: Documentation for backend scripts.  
**Status**: ✅ Keep

### `backend/src/scripts/migrations/*.js`
**Description**: Database migration scripts for schema changes.  
**Status**: ✅ Keep (All migrations should be kept for history)

---

## Backend Other Files

### `backend/certs/README.md`
**Description**: Documentation for SSL certificates and certificate management.  
**Status**: ✅ Keep

### `backend/scripts/generate-secrets.js`
**Description**: Script to generate secrets (may be duplicate of src/scripts/generate-secrets.js).  
**Status**: ⚠️ Review

---

**Next:** See [Part 3: Frontend Source Files](REPOSITORY_INVENTORY_PART3_FRONTEND.md)

