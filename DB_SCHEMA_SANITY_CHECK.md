# Database Schema Sanity Check

**Generated:** 2025-01-27  
**Scope:** Indexes, relationships, constraints, data types

---

## Executive Summary

**Overall Assessment:** Database schema is well-designed with proper indexes and relationships. Minor improvements needed for new PlatformSettings table and some composite indexes.

---

## 1. Index Verification

### ✅ Properly Indexed

**User Model:**
- ✅ Unique index on `email`
- ✅ Composite unique index on `(email, auth_provider)`
- ✅ Index on `role`
- ✅ Index on `status`
- ✅ Index on `auth_provider`
- ✅ Index on `provider_id`
- ✅ Index on `ca_firm_id`
- ✅ GIN index on `metadata` JSONB field

**ITRFiling Model:**
- ✅ Index on `user_id`
- ✅ Index on `member_id`
- ✅ Index on `itr_type`
- ✅ Index on `assessment_year`
- ✅ Index on `status`
- ✅ Index on `ack_number`
- ✅ Index on `created_at`
- ✅ Unique constraint on `(user_id, member_id, itr_type, assessment_year)`
- ✅ Composite index on `(user_id, assessment_year, status)` for previous year queries
- ✅ Index on `regime`
- ✅ Index on `previous_year_filing_id`

**CAFirm Model:**
- ✅ Index on `status`
- ✅ Index on `created_at`

### ⚠️ Missing Indexes

**PlatformSettings Model (NEW):**
- ✅ Unique index on `key` (already defined)
- ⚠️ Consider index on `updated_by` for audit queries

**ServiceTicket Model:**
- ⚠️ Consider composite index on `(status, created_at)` for common queries
- ⚠️ Consider index on `assigned_to` if not exists

**Document Model:**
- ⚠️ Consider index on `document_type` if filtering by type is common
- ⚠️ Consider index on `uploaded_at` for date range queries

---

## 2. Relationship Consistency

### ✅ Verified Relationships

**User Associations:**
- ✅ `User.belongsTo(CAFirm)` - Correct
- ✅ `User.hasMany(ITRFiling)` - Correct
- ✅ `User.hasMany(FamilyMember)` - Correct
- ✅ `User.hasMany(Assignment)` - Correct
- ✅ `User.hasMany(ServiceTicket)` - Correct (as user)
- ✅ `User.hasMany(ServiceTicket)` - Correct (as assignedTo)
- ✅ `User.hasMany(AuditLog)` - Correct
- ✅ `User.hasMany(Notification)` - Correct

**ITRFiling Associations:**
- ✅ `ITRFiling.belongsTo(User)` - Correct
- ✅ `ITRFiling.belongsTo(FamilyMember)` - Correct
- ✅ `ITRFiling.belongsTo(CAFirm)` - Correct
- ✅ `ITRFiling.belongsTo(User)` - Correct (as assignedTo)
- ✅ `ITRFiling.hasMany(ServiceTicket)` - Correct
- ✅ `ITRFiling.belongsTo(ITRFiling)` - Correct (previous year)
- ✅ `ITRFiling.hasMany(ITRFiling)` - Correct (copied to filings)

**CAFirm Associations:**
- ✅ `CAFirm.hasMany(User)` - Correct
- ✅ `CAFirm.hasMany(FamilyMember)` - Correct (as clients)
- ✅ `CAFirm.hasMany(ITRFiling)` - Correct
- ✅ `CAFirm.hasMany(ServiceTicket)` - Correct
- ✅ `CAFirm.hasMany(CAMarketplaceInquiry)` - Correct
- ✅ `CAFirm.hasMany(CABooking)` - Correct
- ✅ `CAFirm.hasMany(CAFirmReview)` - Correct

### ⚠️ Potential Issues

**Cascade Behaviors:**
- ✅ Most cascade behaviors are appropriate
- ⚠️ Review `onDelete: 'SET NULL'` vs `onDelete: 'CASCADE'` for audit trails
- ✅ User deletion cascades appropriately (filings, drafts, etc.)

---

## 3. Data Type Consistency

### ✅ Consistent Types

**UUIDs:**
- ✅ All IDs use UUID type consistently
- ✅ Foreign keys use UUID type

**Dates:**
- ✅ `createdAt` and `updatedAt` use DATE type
- ✅ `dateOfBirth` uses DATEONLY (appropriate)
- ✅ Timestamps use DATE type

**Financial Fields:**
- ✅ All use DECIMAL(15, 2) consistently
- ✅ Examples: `taxLiability`, `refundAmount`, `balancePayable`

**ENUMs:**
- ✅ Role enum values consistent across models
- ✅ Status enum values consistent
- ✅ ITR type enum values consistent

### ⚠️ Areas for Review

**JSONB Fields:**
- ✅ `User.metadata` - Has GIN index
- ✅ `ITRFiling.jsonPayload` - Consider GIN index if querying inside JSON
- ✅ `ITRFiling.taxComputation` - Consider GIN index if querying
- ✅ `ITRFiling.sharedWith` - Consider GIN index if querying

---

## 4. Missing Constraints

### ✅ Existing Constraints

**Unique Constraints:**
- ✅ User email unique
- ✅ User (email, auth_provider) unique
- ✅ ITRFiling (user_id, member_id, itr_type, assessment_year) unique
- ✅ PlatformSettings key unique

**Check Constraints:**
- ⚠️ Consider adding check constraints for:
  - Status enum values
  - Role enum values
  - Financial amounts >= 0

**NOT NULL Constraints:**
- ✅ Most critical fields have NOT NULL
- ✅ Foreign keys appropriately nullable

---

## 5. Schema Documentation

### Current State
- ✅ Models are well-documented with comments
- ✅ Field comments explain purpose
- ⚠️ Missing ER diagram
- ⚠️ Missing migration documentation

### Recommendations
1. Create ER diagram using database tools
2. Document all relationships
3. Document index purposes
4. Create migration guide for PlatformSettings

---

## 6. New PlatformSettings Table

### Schema Design
```sql
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_platform_settings_key ON platform_settings(key);
CREATE INDEX idx_platform_settings_updated_by ON platform_settings(updated_by);
```

### Migration Required
- ✅ Model created
- ⚠️ Database migration needed
- ⚠️ Seed initial default settings

---

## Priority Recommendations

### P0 (Critical)
1. ✅ Create PlatformSettings model (DONE)
2. ⚠️ Create database migration for PlatformSettings
3. ⚠️ Seed default platform settings

### P1 (High Priority)
1. Add GIN indexes on JSONB fields that are queried
2. Add composite indexes for common query patterns
3. Add check constraints for business rules

### P2 (Medium Priority)
1. Create ER diagram
2. Document all relationships
3. Review cascade behaviors for audit requirements

---

## Summary

**Overall Health:** ✅ **GOOD**

**Strengths:**
- Well-indexed foreign keys
- Proper unique constraints
- Appropriate cascade behaviors
- Consistent data types

**Improvements Needed:**
- PlatformSettings migration
- Some composite indexes
- GIN indexes on queried JSONB fields
- ER diagram documentation

---

**Last Updated:** 2025-01-27

