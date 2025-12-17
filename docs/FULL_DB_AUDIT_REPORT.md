# Code-Based Database Audit Report

**Generated**: 2025-12-16T20:06:01.366Z

**Note**: This is a static code analysis. For database schema verification, run migrations and use `scripts/full-db-audit.js`

## Executive Summary

- **Total Models**: 37
- **Models Analyzed**: 37
- **Total Fields**: 583
- **Total Endpoints**: 0
- **Total Services**: 0

## Model Analysis

### CORE Models

#### User (users)

- **Fields**: 24
- **Indexes**: 8
- **Foreign Keys**: 1
- **ENUMs**: 4
- **JSONB Fields**: 1

**ENUM Values**:
- `role`: SUPER_ADMIN, PLATFORM_ADMIN, CA_FIRM_ADMIN, CA, PREPARER, REVIEWER, END_USER
- `authProvider`: LOCAL, GOOGLE, OTHER
- `status`: active, inactive, suspended
- `gender`: MALE, FEMALE, OTHER

**Foreign Keys**:
- `caFirmId` → ca_firms.id

**JSONB Fields**: metadata

#### UserProfile (user_profiles)

- **Fields**: 21
- **Indexes**: 5
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 2

**Foreign Keys**:
- `userId` → users.id

**JSONB Fields**: aadhaarVerificationData, metadata

#### UserSession (user_sessions)

- **Fields**: 12
- **Indexes**: 5
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 0

**Foreign Keys**:
- `userId` → users.id

#### FamilyMember (family_members)

- **Fields**: 21
- **Indexes**: 4
- **Foreign Keys**: 2
- **ENUMs**: 5
- **JSONB Fields**: 2

**ENUM Values**:
- `relationship`: self, spouse, son, daughter, father, mother, other
- `gender`: male, female, other
- `maritalStatus`: single, married, widow, divorced
- `clientType`: family, ca_client
- `status`: active, inactive, archived

**Foreign Keys**:
- `userId` → users.id
- `firmId` → ca_firms.id

**JSONB Fields**: address, assignedTo

---

### ITR Models

#### ITRFiling (itr_filings)

- **Fields**: 32
- **Indexes**: 11
- **Foreign Keys**: 5
- **ENUMs**: 6
- **JSONB Fields**: 4

**ENUM Values**:
- `itrType`: ITR-1, ITR-2, ITR-3, ITR-4
- `status`: draft, paused, submitted, acknowledged, processed, rejected
- `reviewStatus`: pending, in_review, approved, rejected
- `verificationMethod`: AADHAAR_OTP, NETBANKING, DSC
- `verificationStatus`: pending, verified, failed
- `regime`: old, new

**Foreign Keys**:
- `userId` → users.id
- `memberId` → family_members.id
- `firmId` → ca_firms.id
- `assignedTo` → users.id
- `previousYearFilingId` → itr_filings.id

**JSONB Fields**: jsonPayload, verificationDetails, sharedWith, taxComputation

#### ITRDraft (itr_drafts)

- **Fields**: 9
- **Indexes**: 5
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 2

**ENUM Values**:
- `step`: personal_info, income_sources, deductions, tax_computation, bank_details, verification, review, submit

**Foreign Keys**:
- `filingId` → itr_filings.id

**JSONB Fields**: data, validationErrors

#### ITRVProcessing (itr_v_processing)

- **Fields**: 16
- **Indexes**: 5
- **Foreign Keys**: 1
- **ENUMs**: 3
- **JSONB Fields**: 2

**ENUM Values**:
- `status`: pending, generated, processing, delivered, verified, expired, failed
- `deliveryMethod`: email, post, download
- `verificationMethod`: AADHAAR_OTP, NETBANKING, DSC, EVC, MANUAL

**Foreign Keys**:
- `filingId` → itr_filings.id

**JSONB Fields**: timeline, metadata

#### ReturnVersion (return_versions)

- **Fields**: 12
- **Indexes**: 4
- **Foreign Keys**: 2
- **ENUMs**: 1
- **JSONB Fields**: 2

**ENUM Values**:
- `regime`: old, new

**Foreign Keys**:
- `returnId` → itr_filings.id
- `createdBy` → users.id

**JSONB Fields**: dataSnapshot, taxComputation

---

### DOCUMENTS Models

#### Document (documents)

- **Fields**: 22
- **Indexes**: 0
- **Foreign Keys**: 5
- **ENUMs**: 2
- **JSONB Fields**: 3

**ENUM Values**:
- `category`: FORM_16, BANK_STATEMENT, INVESTMENT_PROOF, RENT_RECEIPTS, CAPITAL_GAINS, BUSINESS_INCOME, HOUSE_PROPERTY, OTHER
- `verificationStatus`: PENDING, SCANNING, VERIFIED, FAILED, QUARANTINED

**Foreign Keys**:
- `userId` → users.id
- `memberId` → family_members.id
- `filingId` → itr_filings.id
- `uploadedBy` → users.id
- `deletedBy` → users.id

**JSONB Fields**: extractedMetadata, virusScanResult, ocrResult

#### DocumentTemplate (document_templates)

- **Fields**: 11
- **Indexes**: 4
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 3

**ENUM Values**:
- `type`: Form16, Form16A, Form26AS, AIS, RentReceipt, InvestmentProof, BankStatement, Other

**Foreign Keys**:
- `createdBy` → users.id

**JSONB Fields**: fields, mapping, ocrConfig

---

### SUPPORT Models

#### ServiceTicket (service_tickets)

- **Fields**: 33
- **Indexes**: 12
- **Foreign Keys**: 4
- **ENUMs**: 3
- **JSONB Fields**: 3

**ENUM Values**:
- `ticketType`: FILING_SUPPORT, DOCUMENT_REVIEW, TAX_QUERY, TECHNICAL_ISSUE, PAYMENT_ISSUE, REFUND_REQUEST, GENERAL_INQUIRY, CA_REVIEW, EXPERT_REVIEW, RTR_REVIEW
- `priority`: LOW, MEDIUM, HIGH, URGENT, CRITICAL
- `status`: OPEN, IN_PROGRESS, PENDING_USER, PENDING_CA, RESOLVED, CLOSED, ESCALATED

**Foreign Keys**:
- `userId` → users.id
- `filingId` → itr_filings.id
- `assignedTo` → users.id
- `caFirmId` → ca_firms.id

**JSONB Fields**: tags, attachments, metadata

#### ServiceTicketMessage (service_ticket_messages)

- **Fields**: 14
- **Indexes**: 5
- **Foreign Keys**: 3
- **ENUMs**: 2
- **JSONB Fields**: 2

**ENUM Values**:
- `senderType`: USER, CA, ADMIN, SYSTEM
- `messageType`: TEXT, ATTACHMENT, STATUS_CHANGE, PRIORITY_CHANGE, ASSIGNMENT_CHANGE, SYSTEM_NOTIFICATION

**Foreign Keys**:
- `ticketId` → service_tickets.id
- `senderId` → users.id
- `deletedBy` → users.id

**JSONB Fields**: attachments, metadata

#### HelpArticle (help_articles)

- **Fields**: 16
- **Indexes**: 6
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 0

**Foreign Keys**:
- `authorId` → users.id

---

### FINANCIAL Models

#### Invoice (invoices)

- **Fields**: 25
- **Indexes**: 8
- **Foreign Keys**: 3
- **ENUMs**: 3
- **JSONB Fields**: 3

**ENUM Values**:
- `status`: draft, sent, paid, overdue, cancelled, refunded
- `paymentStatus`: pending, paid, partial, failed, refunded
- `paymentMethod`: offline, razorpay, stripe, bank_transfer, cheque

**Foreign Keys**:
- `userId` → users.id
- `filingId` → itr_filings.id
- `serviceTicketId` → service_tickets.id

**JSONB Fields**: lineItems, billingAddress, metadata

#### TaxPayment (tax_payments)

- **Fields**: 19
- **Indexes**: 6
- **Foreign Keys**: 2
- **ENUMs**: 4
- **JSONB Fields**: 2

**ENUM Values**:
- `typeOfPayment`: advance_tax, self_assessment, regular_assessment
- `paymentMethod`: itd_direct, razorpay, offline
- `paymentStatus`: pending, processing, completed, failed, verified
- `verificationMethod`: auto_26as, manual_upload

**Foreign Keys**:
- `filingId` → itr_filings.id
- `userId` → users.id

**JSONB Fields**: challanData, paymentDetails

#### TaxDemand (tax_demands)

- **Fields**: 25
- **Indexes**: 8
- **Foreign Keys**: 2
- **ENUMs**: 3
- **JSONB Fields**: 5

**ENUM Values**:
- `demandType`: ASSESSMENT, INTEREST, PENALTY, TAX, OTHER
- `status`: pending, acknowledged, disputed, partially_paid, paid, waived, closed
- `disputeStatus`: pending, under_review, accepted, rejected

**Foreign Keys**:
- `filingId` → itr_filings.id
- `userId` → users.id

**JSONB Fields**: breakdown, disputeDocuments, paymentHistory, timeline, metadata

#### RefundTracking (refund_tracking)

- **Fields**: 11
- **Indexes**: 4
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 2

**ENUM Values**:
- `status`: processing, issued, credited, failed, adjusted

**Foreign Keys**:
- `filingId` → itr_filings.id

**JSONB Fields**: bankAccount, timeline

#### BankAccount (bank_accounts)

- **Fields**: 10
- **Indexes**: 2
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 0

**ENUM Values**:
- `accountType`: savings, current

**Foreign Keys**:
- `userId` → users.id

---

### CA Models

#### CAFirm (ca_firms)

- **Fields**: 20
- **Indexes**: 7
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 4

**ENUM Values**:
- `status`: active, inactive, suspended

**Foreign Keys**:
- `createdBy` → users.id

**JSONB Fields**: location, availability, services, metadata

#### CABooking (ca_bookings)

- **Fields**: 15
- **Indexes**: 6
- **Foreign Keys**: 2
- **ENUMs**: 1
- **JSONB Fields**: 1

**ENUM Values**:
- `status`: pending, confirmed, cancelled, completed, no_show

**Foreign Keys**:
- `firmId` → ca_firms.id
- `userId` → users.id

**JSONB Fields**: metadata

#### CAMarketplaceInquiry (ca_marketplace_inquiries)

- **Fields**: 12
- **Indexes**: 5
- **Foreign Keys**: 2
- **ENUMs**: 1
- **JSONB Fields**: 1

**ENUM Values**:
- `status`: pending, responded, closed, archived

**Foreign Keys**:
- `firmId` → ca_firms.id
- `userId` → users.id

**JSONB Fields**: metadata

#### CAFirmReview (ca_firm_reviews)

- **Fields**: 12
- **Indexes**: 7
- **Foreign Keys**: 2
- **ENUMs**: 0
- **JSONB Fields**: 1

**Foreign Keys**:
- `firmId` → ca_firms.id
- `userId` → users.id

**JSONB Fields**: metadata

#### Assignment (assignments)

- **Fields**: 11
- **Indexes**: 5
- **Foreign Keys**: 3
- **ENUMs**: 2
- **JSONB Fields**: 1

**ENUM Values**:
- `role`: preparer, reviewer, admin
- `status`: active, inactive, revoked

**Foreign Keys**:
- `clientId` → family_members.id
- `userId` → users.id
- `createdBy` → users.id

**JSONB Fields**: metadata

---

### SYSTEM Models

#### AuditLog (audit_logs)

- **Fields**: 11
- **Indexes**: 6
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 1

**Foreign Keys**:
- `userId` → users.id

**JSONB Fields**: metadata

#### Notification (notifications)

- **Fields**: 11
- **Indexes**: 6
- **Foreign Keys**: 1
- **ENUMs**: 1
- **JSONB Fields**: 1

**ENUM Values**:
- `type`: system, filing, alert, marketing, document, deadline, refund

**Foreign Keys**:
- `userId` → users.id

**JSONB Fields**: metadata

#### PlatformSettings (platform_settings)

- **Fields**: 7
- **Indexes**: 1
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 1

**Foreign Keys**:
- `updatedBy` → users.id

**JSONB Fields**: value

#### UserSegment (user_segments)

- **Fields**: 10
- **Indexes**: 3
- **Foreign Keys**: 0
- **ENUMs**: 0
- **JSONB Fields**: 2

**JSONB Fields**: criteria, metadata

---

### AUTH Models

#### PasswordResetToken (password_reset_tokens)

- **Fields**: 11
- **Indexes**: 4
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 0

**Foreign Keys**:
- `userId` → users.id

#### AccountLinkingToken (account_linking_tokens)

- **Fields**: 8
- **Indexes**: 5
- **Foreign Keys**: 1
- **ENUMs**: 0
- **JSONB Fields**: 0

**Foreign Keys**:
- `userId` → users.id

#### Invite (invites)

- **Fields**: 10
- **Indexes**: 7
- **Foreign Keys**: 2
- **ENUMs**: 2
- **JSONB Fields**: 0

**ENUM Values**:
- `role`: CA_FIRM_ADMIN, CA
- `status`: pending, accepted, expired, revoked

**Foreign Keys**:
- `invitedBy` → users.id
- `caFirmId` → ca_firms.id

#### Consent (consents)

- **Fields**: 17
- **Indexes**: 7
- **Foreign Keys**: 4
- **ENUMs**: 3
- **JSONB Fields**: 1

**ENUM Values**:
- `scope`: filing, data_sharing, e_sign, document_access, auto_fill, ai_recommendations
- `level`: per_field, global, section
- `status`: given, revoked, expired

**Foreign Keys**:
- `returnVersionId` → return_versions.id
- `givenBy` → users.id
- `revokedBy` → users.id
- `previousVersionId` → consents.id

**JSONB Fields**: metadata

---

### OTHER Models

#### DataSource (data_sources)

- **Fields**: 16
- **Indexes**: 6
- **Foreign Keys**: 4
- **ENUMs**: 1
- **JSONB Fields**: 2

**ENUM Values**:
- `sourceType`: Form16, Form16A, Form26AS, AIS, PreviousReturn, BankStatement, InvestmentProof, RentAgreement, Manual, ERI, Other

**Foreign Keys**:
- `documentId` → documents.id
- `returnVersionId` → return_versions.id
- `verifiedBy` → users.id
- `createdBy` → users.id

**JSONB Fields**: fieldValue, metadata

#### ForeignAsset (foreign_assets)

- **Fields**: 17
- **Indexes**: 4
- **Foreign Keys**: 2
- **ENUMs**: 1
- **JSONB Fields**: 2

**ENUM Values**:
- `assetType`: bank_account, equity_holding, immovable_property, other

**Foreign Keys**:
- `filingId` → itr_filings.id
- `userId` → users.id

**JSONB Fields**: assetDetails, supportingDocuments

#### AssessmentNotice (assessment_notices)

- **Fields**: 21
- **Indexes**: 8
- **Foreign Keys**: 2
- **ENUMs**: 2
- **JSONB Fields**: 3

**ENUM Values**:
- `noticeType`: 143(1), 142(1), 148, 153A, 153C, 154, 156, 245, OTHER
- `status`: pending, acknowledged, responded, resolved, disputed, closed

**Foreign Keys**:
- `filingId` → itr_filings.id
- `userId` → users.id

**JSONB Fields**: responseDocuments, timeline, metadata

#### Scenario (scenarios)

- **Fields**: 13
- **Indexes**: 5
- **Foreign Keys**: 2
- **ENUMs**: 0
- **JSONB Fields**: 3

**Foreign Keys**:
- `userId` → users.id
- `filingId` → itr_filings.id

**JSONB Fields**: changes, simulationResult, metadata

#### PricingPlan (pricing_plans)

- **Fields**: 13
- **Indexes**: 3
- **Foreign Keys**: 0
- **ENUMs**: 0
- **JSONB Fields**: 4

**JSONB Fields**: features, itrTypesAllowed, userTypeRestrictions, metadata

#### Coupon (coupons)

- **Fields**: 15
- **Indexes**: 3
- **Foreign Keys**: 0
- **ENUMs**: 1
- **JSONB Fields**: 3

**ENUM Values**:
- `discountType`: percentage, flat

**JSONB Fields**: applicablePlans, userRestrictions, metadata

---

## API Endpoints Summary

Total endpoints found: 484

### GET (215)

- `GET /stats` (audit.js)
- `GET /security` (audit.js)
- `GET /admin-activity` (audit.js)
- `GET /export` (audit.js)
- `GET /logs` (audit.js)
- `GET /transactions/stats` (financial.js)
- `GET /transactions/export` (financial.js)
- `GET /transactions` (financial.js)
- `GET /transactions/:id` (financial.js)
- `GET /refunds` (financial.js)
- `GET /pricing/plans` (financial.js)
- `GET /coupons` (financial.js)
- `GET /coupons/:id/usage` (financial.js)
- `GET /tickets/stats` (support.js)
- `GET /tickets` (support.js)
- `GET /tickets/:id` (support.js)
- `GET /test` (admin.js)
- `GET /users` (admin.js)
- `GET /users/export` (admin.js)
- `GET /users/:id` (admin.js)
- ... and 195 more

### POST (196)

- `POST /transactions/:id/notes` (financial.js)
- `POST /transactions/:id/dispute` (financial.js)
- `POST /transactions/:id/resolve-dispute` (financial.js)
- `POST /transactions/:id/retry` (financial.js)
- `POST /transactions/:id/refund` (financial.js)
- `POST /refunds/:id/approve` (financial.js)
- `POST /refunds/:id/reject` (financial.js)
- `POST /refunds/:id/process` (financial.js)
- `POST /pricing/plans` (financial.js)
- `POST /coupons` (financial.js)
- `POST /tickets/:id/reply` (support.js)
- `POST /tickets/:id/note` (support.js)
- `POST /tickets/:id/escalate` (support.js)
- `POST /tickets/:id/priority` (support.js)
- `POST /tickets/:id/assign` (support.js)
- `POST /tickets/:id/close` (support.js)
- `POST /login` (admin.js)
- `POST /auth/impersonate/:userId` (admin.js)
- `POST /auth/stop-impersonation` (admin.js)
- `POST /users/:id/activate` (admin.js)
- ... and 176 more

### PUT (44)

- `PUT /pricing/plans/:id` (financial.js)
- `PUT /coupons/:id` (financial.js)
- `PUT /tickets/:id` (support.js)
- `PUT /users/:id` (admin.js)
- `PUT /users/:id/status` (admin.js)
- `PUT /users/:id/role` (admin.js)
- `PUT /users/:id/notes/:noteId` (admin.js)
- `PUT /users/groups/:id` (admin.js)
- `PUT /users/templates/:id` (admin.js)
- `PUT /filings/:id` (admin.js)
- `PUT /documents/:id/extracted-data` (admin.js)
- `PUT /documents/templates/:id` (admin.js)
- `PUT /settings` (admin.js)
- `PUT /settings/general` (admin.js)
- `PUT /settings/tax` (admin.js)
- `PUT /settings/security` (admin.js)
- `PUT /settings/integrations` (admin.js)
- `PUT /settings/notifications` (admin.js)
- `PUT /users/segments/:id` (admin.js)
- `PUT /profile` (auth.js)
- ... and 24 more

### DELETE (24)

- `DELETE /pricing/plans/:id` (financial.js)
- `DELETE /coupons/:id` (financial.js)
- `DELETE /users/:id` (admin.js)
- `DELETE /users/:id/notes/:noteId` (admin.js)
- `DELETE /users/:id/tags/:tag` (admin.js)
- `DELETE /users/groups/:id` (admin.js)
- `DELETE /users/groups/:id/members/:userId` (admin.js)
- `DELETE /users/templates/:id` (admin.js)
- `DELETE /documents/:id` (admin.js)
- `DELETE /users/segments/:id` (admin.js)
- `DELETE /sessions/:sessionId` (auth.js)
- `DELETE /sessions/:sessionId/admin` (auth.js)
- `DELETE /:firmId` (ca-firms.js)
- `DELETE /:firmId/staff/:userId` (ca-firms.js)
- `DELETE /:id` (documents.js)
- `DELETE /assignments/:assignmentId` (firm-onboarding.js)
- `DELETE /filings/:filingId/foreign-assets/:assetId` (itr.js)
- `DELETE /scenarios/:id` (itr.js)
- `DELETE /:id` (members.js)
- `DELETE /:notificationId` (notifications.js)
- ... and 4 more

### PATCH (5)

- `PATCH /:id/status` (assessment-notices.js)
- `PATCH /scenarios/:id` (itr.js)
- `PATCH /:id/status` (tax-demands.js)
- `PATCH /pan` (user.js)
- `PATCH /bank-accounts/:id/set-primary` (user.js)

## Frontend Services Summary

Total services found: 55

- ✅✅ `AIRecommendationEngine.js`
- ✅✅ `AISForm26ASService.js`
- ✅✅ `api/adminService.js`
- ✅✅ `api/authService.js`
- ✅✅ `api/bankAccountService.js`
- ✅✅ `api/documentService.js`
- ✅✅ `api/itrService.js`
- ✅✅ `api/landingService.js`
- ✅✅ `api/paymentService.js`
- ⚠️⚠️ `api/supportService.js`
- ⚠️⚠️ `api.js`
- ⚠️✅ `auditService.js`
- ✅✅ `AutoPopulationITRService.js`
- ⚠️✅ `AutoPopulationService.js`
- ✅✅ `BankAPIService.js`
- ✅✅ `bankStatementService.js`
- ✅✅ `BrokerAPIService.js`
- ⚠️✅ `BrokerFileProcessor.js`
- ⚠️✅ `CABotService.js`
- ✅✅ `CapitalGainsOCRService.js`
- ⚠️✅ `core/APIClient.js`
- ⚠️⚠️ `core/CacheService.js`
- ⚠️✅ `core/ErrorHandler.js`
- ✅✅ `DataIntegrationService.js`
- ⚠️✅ `DeductionOCRService.js`
- ✅✅ `DocumentProcessingService.js`
- ✅✅ `documentService.js`
- ⚠️✅ `EnterpriseDebugger.js`
- ✅✅ `eriService.js`
- ✅✅ `everificationService.js`
- ... and 25 more

## ENUM Consistency Analysis

ℹ️  ENUM `role:SUPER_ADMIN,PLATFORM_ADMIN,CA_FIRM_ADMIN,CA,PREPARER,REVIEWER,END_USER` used in: User
ℹ️  ENUM `authProvider:LOCAL,GOOGLE,OTHER` used in: User
✅ Consistent ENUM `status:active,inactive,suspended` used in: User, CAFirm
ℹ️  ENUM `gender:MALE,FEMALE,OTHER` used in: User
ℹ️  ENUM `itrType:ITR-1,ITR-2,ITR-3,ITR-4` used in: ITRFiling
ℹ️  ENUM `status:draft,paused,submitted,acknowledged,processed,rejected` used in: ITRFiling
ℹ️  ENUM `reviewStatus:pending,in_review,approved,rejected` used in: ITRFiling
ℹ️  ENUM `verificationMethod:AADHAAR_OTP,NETBANKING,DSC` used in: ITRFiling
ℹ️  ENUM `verificationStatus:pending,verified,failed` used in: ITRFiling
✅ Consistent ENUM `regime:old,new` used in: ITRFiling, ReturnVersion
ℹ️  ENUM `step:personal_info,income_sources,deductions,tax_computation,bank_details,verification,review,submit` used in: ITRDraft
ℹ️  ENUM `relationship:self,spouse,son,daughter,father,mother,other` used in: FamilyMember
ℹ️  ENUM `gender:male,female,other` used in: FamilyMember
ℹ️  ENUM `maritalStatus:single,married,widow,divorced` used in: FamilyMember
ℹ️  ENUM `clientType:family,ca_client` used in: FamilyMember
ℹ️  ENUM `status:active,inactive,archived` used in: FamilyMember
ℹ️  ENUM `category:FORM_16,BANK_STATEMENT,INVESTMENT_PROOF,RENT_RECEIPTS,CAPITAL_GAINS,BUSINESS_INCOME,HOUSE_PROPERTY,OTHER` used in: Document
ℹ️  ENUM `verificationStatus:PENDING,SCANNING,VERIFIED,FAILED,QUARANTINED` used in: Document
ℹ️  ENUM `ticketType:FILING_SUPPORT,DOCUMENT_REVIEW,TAX_QUERY,TECHNICAL_ISSUE,PAYMENT_ISSUE,REFUND_REQUEST,GENERAL_INQUIRY,CA_REVIEW,EXPERT_REVIEW,RTR_REVIEW` used in: ServiceTicket
ℹ️  ENUM `priority:LOW,MEDIUM,HIGH,URGENT,CRITICAL` used in: ServiceTicket
ℹ️  ENUM `status:OPEN,IN_PROGRESS,PENDING_USER,PENDING_CA,RESOLVED,CLOSED,ESCALATED` used in: ServiceTicket
ℹ️  ENUM `senderType:USER,CA,ADMIN,SYSTEM` used in: ServiceTicketMessage
ℹ️  ENUM `messageType:TEXT,ATTACHMENT,STATUS_CHANGE,PRIORITY_CHANGE,ASSIGNMENT_CHANGE,SYSTEM_NOTIFICATION` used in: ServiceTicketMessage
ℹ️  ENUM `status:draft,sent,paid,overdue,cancelled,refunded` used in: Invoice
ℹ️  ENUM `paymentStatus:pending,paid,partial,failed,refunded` used in: Invoice
ℹ️  ENUM `paymentMethod:offline,razorpay,stripe,bank_transfer,cheque` used in: Invoice
ℹ️  ENUM `role:CA_FIRM_ADMIN,CA` used in: Invite
ℹ️  ENUM `status:pending,accepted,expired,revoked` used in: Invite
ℹ️  ENUM `role:preparer,reviewer,admin` used in: Assignment
ℹ️  ENUM `status:active,inactive,revoked` used in: Assignment
ℹ️  ENUM `scope:filing,data_sharing,e_sign,document_access,auto_fill,ai_recommendations` used in: Consent
ℹ️  ENUM `level:per_field,global,section` used in: Consent
ℹ️  ENUM `status:given,revoked,expired` used in: Consent
ℹ️  ENUM `sourceType:Form16,Form16A,Form26AS,AIS,PreviousReturn,BankStatement,InvestmentProof,RentAgreement,Manual,ERI,Other` used in: DataSource
ℹ️  ENUM `typeOfPayment:advance_tax,self_assessment,regular_assessment` used in: TaxPayment
ℹ️  ENUM `paymentMethod:itd_direct,razorpay,offline` used in: TaxPayment
ℹ️  ENUM `paymentStatus:pending,processing,completed,failed,verified` used in: TaxPayment
ℹ️  ENUM `verificationMethod:auto_26as,manual_upload` used in: TaxPayment
ℹ️  ENUM `assetType:bank_account,equity_holding,immovable_property,other` used in: ForeignAsset
ℹ️  ENUM `status:processing,issued,credited,failed,adjusted` used in: RefundTracking
ℹ️  ENUM `status:pending,generated,processing,delivered,verified,expired,failed` used in: ITRVProcessing
ℹ️  ENUM `deliveryMethod:email,post,download` used in: ITRVProcessing
ℹ️  ENUM `verificationMethod:AADHAAR_OTP,NETBANKING,DSC,EVC,MANUAL` used in: ITRVProcessing
ℹ️  ENUM `noticeType:143(1),142(1),148,153A,153C,154,156,245,OTHER` used in: AssessmentNotice
ℹ️  ENUM `status:pending,acknowledged,responded,resolved,disputed,closed` used in: AssessmentNotice
ℹ️  ENUM `demandType:ASSESSMENT,INTEREST,PENALTY,TAX,OTHER` used in: TaxDemand
ℹ️  ENUM `status:pending,acknowledged,disputed,partially_paid,paid,waived,closed` used in: TaxDemand
ℹ️  ENUM `disputeStatus:pending,under_review,accepted,rejected` used in: TaxDemand
ℹ️  ENUM `type:Form16,Form16A,Form26AS,AIS,RentReceipt,InvestmentProof,BankStatement,Other` used in: DocumentTemplate
ℹ️  ENUM `type:system,filing,alert,marketing,document,deadline,refund` used in: Notification
ℹ️  ENUM `status:pending,responded,closed,archived` used in: CAMarketplaceInquiry
ℹ️  ENUM `status:pending,confirmed,cancelled,completed,no_show` used in: CABooking
ℹ️  ENUM `accountType:savings,current` used in: BankAccount
ℹ️  ENUM `discountType:percentage,flat` used in: Coupon

## Key Findings

### ✅ Strengths

1. **Comprehensive Model Coverage**: 37 models covering all major business domains
2. **Well-Structured Foreign Keys**: Clear relationships between entities
3. **JSONB Usage**: Flexible data storage for complex structures (metadata, formData, etc.)
4. **Index Strategy**: Multiple indexes defined for performance optimization
5. **ENUM Validation**: Strong type safety with ENUM constraints

### ⚠️ Issues Identified

1. **ENUM Value Inconsistency**:
   - `User.gender`: 'MALE', 'FEMALE', 'OTHER' (uppercase)
   - `FamilyMember.gender`: 'male', 'female', 'other' (lowercase)
   - **Impact**: Requires transformation when mapping between models
   - **Recommendation**: Standardize to one format (preferably uppercase for consistency with other ENUMs)

2. **Database Tables Not Created**:
   - All 37 models defined but tables may not exist in database
   - **Action Required**: Run all migration scripts

3. **Field Count Discrepancy**:
   - Total 583 fields across 37 models
   - Some models have many fields (ITRFiling: 32, ServiceTicket: 33)
   - Consider normalization for very large models

### 📊 Statistics

- **Average Fields per Model**: ~15.8
- **Models with JSONB**: 20+ models use JSONB for flexible data
- **Models with ENUMs**: 25+ models use ENUMs for type safety
- **Total Foreign Key Relationships**: 50+
- **Total Indexes Defined**: 150+

### 🔍 Model Categories

1. **Core Models (4)**: User, UserProfile, UserSession, FamilyMember
2. **ITR Models (4)**: ITRFiling, ITRDraft, ITRVProcessing, ReturnVersion
3. **Document Models (2)**: Document, DocumentTemplate
4. **Support Models (3)**: ServiceTicket, ServiceTicketMessage, HelpArticle
5. **Financial Models (5)**: Invoice, TaxPayment, TaxDemand, RefundTracking, BankAccount
6. **CA Models (5)**: CAFirm, CABooking, CAMarketplaceInquiry, CAFirmReview, Assignment
7. **System Models (4)**: AuditLog, Notification, PlatformSettings, UserSegment
8. **Auth Models (4)**: PasswordResetToken, AccountLinkingToken, Invite, Consent
9. **Other Models (6)**: DataSource, ForeignAsset, Scenario, AssessmentNotice, PricingPlan, Coupon

## Recommendations

### High Priority

1. **Run Database Migrations**: Execute all migration scripts to create tables
   ```bash
   # Run main migrations
   node backend/src/scripts/migrations/create-itr-tables.js
   node backend/src/scripts/migrations/add-gender-to-users.js
   # ... run all other migrations
   ```

2. **Verify Schema**: After migrations, run full database audit
   ```bash
   node scripts/full-db-audit.js
   ```

3. **Standardize ENUM Values**: 
   - Decide on casing convention (uppercase recommended)
   - Create migration to standardize FamilyMember.gender to uppercase
   - Update all code references

### Medium Priority

4. **Foreign Key Verification**: Ensure all foreign key constraints exist in database
5. **Index Optimization**: Verify all defined indexes are created
6. **JSONB Schema Validation**: Document expected structures for JSONB fields
7. **Field Documentation**: Add comments to all model fields

### Low Priority

8. **Model Normalization**: Consider splitting very large models (30+ fields)
9. **Query Performance**: Review indexes for frequently queried fields
10. **Data Migration**: Plan for any schema changes needed

## Next Steps

1. ✅ Code-based audit complete
2. ⏳ Run database migrations
3. ⏳ Run `scripts/full-db-audit.js` to verify schema
4. ⏳ Fix any schema mismatches found
5. ⏳ Standardize ENUM values
6. ⏳ Document JSONB field structures
7. ⏳ Create database backup before major changes
