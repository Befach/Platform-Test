-- Add Concept Workflow Fields
-- Migration: Add rejection_reason and archived fields to work_items table
-- Created: 2025-12-23
-- Purpose: Support concept rejection workflow and archival

-- Add rejection_reason column for concepts
ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add archived column for soft deletion
ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for archived items (performance optimization for filtered queries)
CREATE INDEX IF NOT EXISTS idx_work_items_archived
ON work_items(team_id, workspace_id, archived);

-- Add comments for documentation
COMMENT ON COLUMN work_items.rejection_reason IS 'Reason for rejecting a concept (null for non-rejected items)';
COMMENT ON COLUMN work_items.archived IS 'Whether the work item is archived (soft deleted)';
