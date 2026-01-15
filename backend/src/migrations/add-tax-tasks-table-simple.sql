/**
 * Simplified Migration: Add tax_tasks table
 */

-- Create tax_tasks table
CREATE TABLE IF NOT EXISTS tax_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date VARCHAR(20) NOT NULL,
    type VARCHAR(50),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tax_tasks_user ON tax_tasks(user_id);
