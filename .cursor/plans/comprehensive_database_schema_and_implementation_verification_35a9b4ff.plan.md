---
name: Comprehensive Database Schema and Implementation Verification
overview: Perform a comprehensive audit of database schema, model definitions, API endpoints, and frontend services to identify mismatches, missing fields, type inconsistencies, and implementation gaps across the entire stack.
todos:
  - id: create-schema-verification-script
    content: Create automated script to compare Sequelize models with actual database schema
    status: completed
  - id: verify-user-model
    content: Verify User model fields match database schema (including gender field)
    status: completed
    dependencies:
      - create-schema-verification-script
  - id: verify-family-member-model
    content: Verify FamilyMember model fields match database schema
    status: completed
    dependencies:
      - create-schema-verification-script
  - id: verify-itr-models
    content: Verify ITRFiling and ITRDraft models match database schema
    status: completed
    dependencies:
      - create-schema-verification-script
  - id: verify-all-other-models
    content: Verify all remaining models (30+ models) match database schema
    status: completed
    dependencies:
      - create-schema-verification-script
  - id: audit-api-endpoints
    content: Audit all API endpoints to verify they handle all model fields correctly
    status: completed
  - id: audit-frontend-services
    content: Audit all frontend services to verify field mappings are correct
    status: completed
  - id: verify-enum-consistency
    content: Verify ENUM values are consistent across frontend, backend, and database
    status: completed
  - id: verify-foreign-keys
    content: Verify all foreign key relationships exist and are correct
    status: completed
  - id: verify-indexes
    content: Verify all indexes exist as defined in models
    status: completed
  - id: fix-schema-issues
    content: Create migration scripts and fix all identified schema mismatches
    status: completed
    dependencies:
      - verify-user-model
      - verify-family-member-model
      - verify-itr-models
      - verify-all-other-models
  - id: fix-api-endpoint-issues
    content: Update API endpoints to handle all missing fields
    status: completed
    dependencies:
      - audit-api-endpoints
  - id: fix-frontend-service-issues
    content: Update frontend services to send/receive all required fields
    status: completed
    dependencies:
      - audit-frontend-services
---

# Comprehensive Database Schema and Implementation Verification

## Objective

Verify database schema consistency across:

1. **Database Tables** ↔ **Sequelize Models**
2. **Models** ↔ **API Endpoints** (field handling)
3. **API Endpoints** ↔ **Frontend Services** (field mapping)
4. **Data Types** (consistency across stack)
5. **Validation Rules** (frontend vs backend)
6. **ENUM Values** (consistency)
7. **Foreign Keys** (relationships)
8. **Indexes** (performance optimization)
9. **Default Values** (consistency)
10. **Nullable Constraints** (consistency)

## Verification Areas

### 1. Model-to-Database Schema Verification

**Scope**: Compare all Sequelize model definitions with actual database tables

**Models to Verify** (40+ models):

- User, FamilyMember, ITRFiling, ITRDraft
- CAFirm, CABooking, CAMarketplaceInquiry, CAFirmReview
- Document, DocumentTemplate
- ServiceTicket, ServiceTicketMessage
- Invoice, TaxPayment, TaxDemand
- AssessmentNotice, ITRVProcessing, RefundTracking
- BankAccount, ForeignAsset
- Notification, HelpArticle
- Scenario, Consent, DataSource
- Assignment, ReturnVersion
- UserProfile, UserSession, AuditLog
- PasswordResetToken, AccountLinkingToken, Invite
- PricingPlan, Coupon, UserSegment, PlatformSettings

**Checks**:

- [ ] All model fields exist in database tables
- [ ] All database columns have corresponding model fields
- [ ] Field types match (STRING vs VARCHAR, INTEGER vs INT, etc.)
- [ ] Field lengths match (STRING(255) vs VARCHAR(100))
- [ ] Nullable constraints match (allowNull: true/false)
- [ ] Default values match
- [ ] ENUM types and values match
- [ ] Foreign key relationships exist
- [ ] Indexes exist as defined in models

### 2. API Endpoint Field Handling Verification

**Scope**: Verify all API endpoints properly handle model fields

**Key Endpoints to Check**:

- `/api/auth/profile` (GET/PUT) - User fields
- `/api/itr/drafts` (GET/POST/PUT) - ITR draft fields
- `/api/itr/filings` (GET/POST/PUT) - ITR filing fields
- `/api/members` (GET/POST/PUT) - FamilyMember fields
- `/api/documents` (GET/POST/PUT) - Document fields
- `/api/tickets` (GET/POST/PUT) - ServiceTicket fields
- `/api/invoices` (GET/POST/PUT) - Invoice fields
- `/api/bank-accounts` (GET/POST/PUT) - BankAccount fields
- `/api/ca-firms` (GET/POST/PUT) - CAFirm fields

**Checks**:

- [ ] GET endpoints return all model fields (or documented subset)
- [ ] POST/PUT endpoints accept all updatable fields
- [ ] Required fields are validated
- [ ] Field types are validated (string, number, date, enum)
- [ ] ENUM values are validated
- [ ] Foreign key relationships are validated
- [ ] JSONB fields are properly parsed/stringified
- [ ] Date fields are properly formatted
- [ ] UUID fields are validated

### 3. Frontend Service Field Mapping Verification

**Scope**: Verify frontend services send/receive correct fields

**Services to Check**:

- `authService.js` - User authentication and profile
- `itrService.js` - ITR drafts and filings
- `memberService.js` - Family members
- `documentService.js` - Documents
- `bankAccountService.js` - Bank accounts
- `paymentService.js` - Payments and invoices
- `supportService.js` - Service tickets
- `personalInfoService.js` - Personal information
- Other services in `frontend/src/services/api/`

**Checks**:

- [ ] Services send all required fields in POST/PUT requests
- [ ] Services handle all fields returned from GET requests
- [ ] Field names match between frontend and backend (camelCase vs snake_case)
- [ ] Data transformations are correct (dates, numbers, enums)
- [ ] Error handling for missing fields
- [ ] Default values are applied correctly

### 4. Data Type Consistency Verification

**Scope**: Ensure data types are consistent across stack

**Checks**:

- [ ] UUID fields: String in frontend, UUID in backend, UUID in DB
- [ ] Date fields: ISO string in frontend, Date in backend, TIMESTAMP/DATE in DB
- [ ] Number fields: Number in frontend, INTEGER/DECIMAL in backend, numeric in DB
- [ ] Boolean fields: Boolean across all layers
- [ ] ENUM fields: String values match across all layers
- [ ] JSONB fields: Object in frontend, JSONB in backend, JSONB in DB
- [ ] String lengths: Consistent max lengths

### 5. ENUM Value Consistency Verification

**Scope**: Verify ENUM values match across frontend, backend, and database

**ENUMs to Check**:

- User.role: 'SUPER_ADMIN', 'PLATFORM_ADMIN', 'CA_FIRM_ADMIN', 'CA', 'PREPARER', 'REVIEWER', 'END_USER'
- User.gender: 'MALE', 'FEMALE', 'OTHER'
- User.status: 'active', 'inactive', 'suspended'
- FamilyMember.gender: 'male', 'female', 'other' (lowercase - note inconsistency)
- FamilyMember.relationship: 'self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'
- ITRFiling.status: 'draft', 'submitted', 'acknowledged', 'processed', 'rejected', 'paused'
- ITRFiling.itr_type: 'ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'
- ServiceTicket.status: (check all status values)
- Other ENUMs in models

**Checks**:

- [ ] ENUM values match between model definition and database
- [ ] ENUM values match between frontend validation and backend
- [ ] Case sensitivity is consistent (uppercase vs lowercase)
- [ ] All valid values are documented

### 6. Foreign Key Relationship Verification

**Scope**: Verify all foreign key relationships exist and are correct

**Key Relationships**:

- User → CAFirm (ca_firm_id)
- ITRFiling → User (user_id)
- ITRFiling → FamilyMember (member_id)
- ITRDraft → ITRFiling (filing_id)
- FamilyMember → User (user_id)
- FamilyMember → CAFirm (firm_id)
- Assignment → User (user_id)
- Assignment → FamilyMember (client_id)
- Document → User (user_id)
- ServiceTicket → User (user_id)
- Invoice → User (user_id)
- Other relationships

**Checks**:

- [ ] Foreign key constraints exist in database
- [ ] Model associations are defined correctly
- [ ] ON DELETE behavior is appropriate (CASCADE, SET NULL, RESTRICT)
- [ ] Referenced tables exist
- [ ] Referenced columns exist and are correct type

### 7. Index Verification

**Scope**: Verify indexes exist for performance-critical queries

**Checks**:

- [ ] Indexes defined in models exist in database
- [ ] Composite indexes for common query patterns
- [ ] GIN indexes for JSONB columns (metadata, json_payload)
- [ ] Unique indexes for unique constraints
- [ ] Foreign key indexes exist
- [ ] Indexes on frequently filtered columns (status, type, dates)

### 8. Validation Consistency Verification

**Scope**: Verify validation rules match between frontend and backend

**Checks**:

- [ ] Required field validation matches
- [ ] String length validation matches (min/max)
- [ ] Number range validation matches (min/max)
- [ ] Pattern validation matches (email, phone, PAN, Aadhaar)
- [ ] Date validation matches (format, range)
- [ ] ENUM validation matches
- [ ] Custom validation rules match

### 9. Default Value Verification

**Scope**: Verify default values are consistent

**Checks**:

- [ ] Model default values match database defaults
- [ ] Default values are applied correctly in API endpoints
- [ ] Frontend forms use correct default values
- [ ] Default values for ENUMs are valid
- [ ] Timestamp defaults (created_at, updated_at)

### 10. Missing Field Detection

**Scope**: Identify fields used in code but missing from schema

**Checks**:

- [ ] Fields referenced in controllers but not in models
- [ ] Fields sent from frontend but not accepted by backend
- [ ] Fields returned by backend but not handled by frontend
- [ ] Fields in migrations but not in models
- [ ] Fields in models but not in migrations

## Implementation Strategy

### Phase 1: Automated Schema Comparison

1. Create script to compare model definitions with database schema
2. Generate report of mismatches
3. Identify missing fields, type mismatches, constraint differences

### Phase 2: API Endpoint Audit

1. Review all controller methods that create/update records
2. Document which fields are handled
3. Identify missing field handling
4. Check validation logic

### Phase 3: Frontend Service Audit

1. Review all service files
2. Document field mappings
3. Identify missing fields in requests/responses
4. Check data transformations

### Phase 4: Cross-Stack Verification

1. Compare field names (camelCase vs snake_case)
2. Verify data type transformations
3. Check ENUM value consistency
4. Verify validation rule alignment

### Phase 5: Fix Implementation

1. Create migration scripts for missing fields
2. Update models with missing fields
3. Update API endpoints to handle all fields
4. Update frontend services to send/receive all fields
5. Fix validation inconsistencies
6. Fix ENUM value inconsistencies

## Deliverables

1. **Schema Verification Report**: Detailed comparison of models vs database
2. **API Endpoint Audit Report**: Field handling analysis for all endpoints
3. **Frontend Service Audit Report**: Field mapping analysis
4. **Mismatch Report**: List of all inconsistencies found
5. **Migration Scripts**: Scripts to fix schema issues
6. **Code Fixes**: Updated models, controllers, and services

## Files to Create/Modify

1. `scripts/verify-db-schema.js` - Automated schema comparison script
2. `scripts/verify-api-endpoints.js` - API endpoint field audit script
3. `scripts/verify-frontend-services.js` - Frontend service audit script
4. `docs/DB_SCHEMA_VERIFICATION_REPORT.md` - Comprehensive report
5. Migration scripts for any missing fields
6. Updates to models, controllers, and services as needed

## Success Criteria

- [ ] All model fields exist in database tables
- [ ] All database columns have model fields
- [ ] All API endpoints handle all model fields
- [ ] All frontend services send/receive correct fields
- [ ] Data types are consistent across stack
- [ ] ENUM values are consistent
- [ ] Validation rules match
- [ ] Foreign keys are properly defined
- [ ] Indexes exist for performance
- [ ] No missing fields in any layer