-- S12 Phase 6: Analytics Tables
-- Creates tables for financial storytelling and insights

BEGIN;

-- =====================================================
-- 1. FINANCIAL SNAPSHOTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filing_id UUID NOT NULL REFERENCES public.itr_filings(id) ON DELETE CASCADE,
    assessment_year TEXT NOT NULL,
    
    -- Income breakdown
    total_income DECIMAL(15, 2) DEFAULT 0,
    salary_income DECIMAL(15, 2) DEFAULT 0,
    business_income DECIMAL(15, 2) DEFAULT 0,
    rental_income DECIMAL(15, 2) DEFAULT 0,
    capital_gains DECIMAL(15, 2) DEFAULT 0,
    other_income DECIMAL(15, 2) DEFAULT 0,
    
    -- Tax details
    total_tax_paid DECIMAL(15, 2) DEFAULT 0,
    tds_paid DECIMAL(15, 2) DEFAULT 0,
    advance_tax_paid DECIMAL(15, 2) DEFAULT 0,
    effective_tax_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Deductions
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    section_80c DECIMAL(15, 2) DEFAULT 0,
    section_80d DECIMAL(15, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, assessment_year)
);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_id ON public.financial_snapshots(user_id);

-- =====================================================
-- 2. FINANCIAL MILESTONES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    milestone_date DATE NOT NULL,
    amount DECIMAL(15, 2),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_milestones_user_date ON public.financial_milestones(user_id, milestone_date);
CREATE INDEX IF NOT EXISTS idx_financial_milestones_type ON public.financial_milestones(milestone_type);

-- =====================================================
-- 3. USER INSIGHTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assessment_year TEXT,
    insight_type TEXT NOT NULL,
    insight_text TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_insights_user_year ON public.user_insights(user_id, assessment_year);
CREATE INDEX IF NOT EXISTS idx_user_insights_type ON public.user_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_user_insights_priority ON public.user_insights(priority);

COMMIT;
