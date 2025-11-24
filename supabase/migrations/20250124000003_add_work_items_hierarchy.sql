-- Migration: Add Hierarchical Structure to Work Items
-- Date: 2025-01-24
-- Purpose: Add parent_id and is_epic fields for epic/sub-task relationships

-- Step 1: Add parent_id column
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES work_items(id) ON DELETE CASCADE;

-- Step 2: Add is_epic flag
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS is_epic BOOLEAN DEFAULT false NOT NULL;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_items_parent_id ON work_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_work_items_is_epic ON work_items(is_epic) WHERE is_epic = true;

-- Step 4: Add check constraint to prevent circular dependencies
-- (A work item cannot be its own parent)
ALTER TABLE work_items
  ADD CONSTRAINT work_items_no_self_parent
  CHECK (id != parent_id OR parent_id IS NULL);

-- Comments for documentation
COMMENT ON COLUMN work_items.parent_id IS 'Parent work item ID for hierarchical relationships. NULL for top-level items. Creates epic → sub-item hierarchy.';
COMMENT ON COLUMN work_items.is_epic IS 'True if this work item is a container (epic) that has child work items. Epics can contain any type.';
