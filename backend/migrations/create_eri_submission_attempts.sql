-- =====================================================
-- S21: ERI SUBMISSION ATTEMPTS TABLE
-- Tracks retry attempts separately from filing
-- =====================================================

CREATE TABLE IF NOT EXISTS eri_submission_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id UUID NOT NULL REFERENCES itr_filings(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMP,
    next_attempt_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_code VARCHAR(100),
    response_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_eri_attempts_filing ON eri_submission_attempts(filing_id);
CREATE INDEX IF NOT EXISTS idx_eri_attempts_next ON eri_submission_attempts(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_eri_attempts_status ON eri_submission_attempts(status);

-- Add constraint to ensure attempt_number is positive
ALTER TABLE eri_submission_attempts 
ADD CONSTRAINT check_attempt_number_positive 
CHECK (attempt_number > 0);
