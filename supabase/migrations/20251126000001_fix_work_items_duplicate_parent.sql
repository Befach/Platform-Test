-- Migration: Fix duplicate parent fields on work_items table
-- Issue #1: Both parent_id and parent_work_item_id exist, causing confusion
-- Solution: Consolidate into parent_id only

-- Step 1: Migrate any data from parent_work_item_id to parent_id where parent_id is NULL
UPDATE work_items
SET parent_id = parent_work_item_id
WHERE parent_id IS NULL AND parent_work_item_id IS NOT NULL;

-- Step 2: Drop the redundant parent_work_item_id column
ALTER TABLE work_items DROP COLUMN IF EXISTS parent_work_item_id;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN work_items.parent_id IS 'Parent work item ID for hierarchical relationships (epics > features > stories)';
