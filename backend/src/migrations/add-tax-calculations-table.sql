/**
 * Database Migration: Add tax_calculations table
 * Purpose: Store tax calculations for both old and new regimes
 * Date: 2026-01-14
 * 
 * Run this SQL directly in Supabase SQL Editor
 */

-- Create tax_calculations table
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filing_id UUID REFERENCES filings(id) ON DELETE SET NULL,
    financial_year VARCHAR(10) NOT NULL,
    
    -- Income Details
    gross_income DECIMAL(12, 2) NOT NULL,
    standard_deduction DECIMAL(12, 2) DEFAULT 50000,
    
    -- Deductions (Old Regime)
    deduction_80c DECIMAL(12, 2) DEFAULT 0,
    deduction_80d DECIMAL(12, 2) DEFAULT 0,
    deduction_80e DECIMAL(12, 2) DEFAULT 0,
    deduction_80g DECIMAL(12, 2) DEFAULT 0,
    deduction_80tta DECIMAL(12, 2) DEFAULT 0,
    deduction_hra DECIMAL(12, 2) DEFAULT 0,
    deduction_home_loan DECIMAL(12, 2) DEFAULT 0,
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    
    -- Tax Calculations - Old Regime
    taxable_income_old DECIMAL(12, 2),
    tax_old_regime DECIMAL(12, 2),
    cess_old_regime DECIMAL(12, 2),
    total_tax_old DECIMAL(12, 2),
    
    -- Tax Calculations - New Regime
    taxable_income_new DECIMAL(12, 2),
    tax_new_regime DECIMAL(12, 2),
    cess_new_regime DECIMAL(12, 2),
    total_tax_new DECIMAL(12, 2),
    
    -- Recommendation
    recommended_regime VARCHAR(10) CHECK (recommended_regime IN ('old', 'new')),
    tax_savings DECIMAL(12, 2),
    
    -- Metadata
    calculation_data JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user 
    ON tax_calculations(user_id);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_fy 
    ON tax_calculations(financial_year);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_fy 
    ON tax_calculations(user_id, financial_year);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tax_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tax_calculations_updated_at ON tax_calculations;
CREATE TRIGGER tax_calculations_updated_at
    BEFORE UPDATE ON tax_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_calculations_updated_at();

-- Grant permissions
GRANT ALL ON tax_calculations TO authenticated;
GRANT ALL ON tax_calculations TO service_role;

-- Verify table creation
SELECT 'tax_calculations table created successfully' AS status;
