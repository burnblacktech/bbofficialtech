/**
 * Database Migration: Add tax_tasks table
 * Purpose: Track completion of tax-related deadlines/tasks
 * Date: 2026-01-14
 */

-- Create tax_tasks table
CREATE TABLE IF NOT EXISTS tax_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date VARCHAR(20) NOT NULL,
    type VARCHAR(50),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tax_tasks_user ON tax_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_tasks_user_completed ON tax_tasks(user_id, is_completed);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tax_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tax_tasks_updated_at ON tax_tasks;
CREATE TRIGGER tax_tasks_updated_at
    BEFORE UPDATE ON tax_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_tasks_updated_at();

-- Grant permissions
GRANT ALL ON tax_tasks TO authenticated;
GRANT ALL ON tax_tasks TO service_role;

SELECT 'tax_tasks table created successfully' AS status;
