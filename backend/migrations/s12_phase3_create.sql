-- S12 Phase 3: Create Canonical Schema
-- Execute after Phase 2 (drop) completes successfully

BEGIN;

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================

CREATE TABLE public.users (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Authentication
  password_hash TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'local' 
    CHECK (auth_provider IN ('local', 'google')),
  
  -- Authorization
  role TEXT NOT NULL DEFAULT 'END_USER'
    CHECK (role IN ('SUPER_ADMIN', 'CA', 'PREPARER', 'END_USER')),
  ca_firm_id UUID,  -- FK added after ca_firms created
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- =====================================================
-- 2. CREATE CA_FIRMS TABLE
-- =====================================================

CREATE TABLE public.ca_firms (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Authority
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'dissolved')),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_firms_owner_id ON public.ca_firms(owner_id);
CREATE INDEX idx_ca_firms_status ON public.ca_firms(status);

-- Add FK constraint from users to ca_firms
ALTER TABLE public.users 
  ADD CONSTRAINT fk_users_ca_firm_id 
  FOREIGN KEY (ca_firm_id) 
  REFERENCES public.ca_firms(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_users_ca_firm_id ON public.users(ca_firm_id) 
  WHERE ca_firm_id IS NOT NULL;

-- =====================================================
-- 3. CREATE ITR_FILINGS TABLE
-- =====================================================

CREATE TABLE public.itr_filings (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authority
  ca_firm_id UUID NOT NULL REFERENCES public.ca_firms(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- State Machine (Single Source of Truth)
  lifecycle_state TEXT NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_state IN (
      'draft',
      'review_pending',
      'reviewed',
      'approved',
      'submitted_to_eri',
      'eri_success',
      'eri_failed'
    )),
  
  -- Review Trail
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Approval Trail
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Intelligence System
  intelligence_flags JSONB NOT NULL DEFAULT '[]',
  intelligence_overrides JSONB NOT NULL DEFAULT '[]',
  
  -- Filing Data (Minimal)
  assessment_year TEXT NOT NULL,
  taxpayer_pan TEXT NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_itr_filings_ca_firm_id ON public.itr_filings(ca_firm_id);
CREATE INDEX idx_itr_filings_created_by ON public.itr_filings(created_by);
CREATE INDEX idx_itr_filings_lifecycle_state ON public.itr_filings(lifecycle_state);
CREATE INDEX idx_itr_filings_reviewed_by ON public.itr_filings(reviewed_by) 
  WHERE reviewed_by IS NOT NULL;
CREATE INDEX idx_itr_filings_approved_by ON public.itr_filings(approved_by) 
  WHERE approved_by IS NOT NULL;
CREATE INDEX idx_itr_filings_assessment_year ON public.itr_filings(assessment_year);

-- =====================================================
-- 4. CREATE AUDIT_EVENTS TABLE
-- =====================================================

CREATE TABLE public.audit_events (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened?
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Who did it?
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL,
  
  -- Context
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- When?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor_id ON public.audit_events(actor_id);
CREATE INDEX idx_audit_events_event_type ON public.audit_events(event_type);
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_metadata_gin ON public.audit_events USING gin(metadata);

COMMIT;

-- Success message
SELECT 'Canonical schema v1.0 created successfully' as status;
