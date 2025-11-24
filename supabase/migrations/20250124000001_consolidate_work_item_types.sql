-- Migration: Consolidate Work Item Types (13 → 4)
-- Date: 2025-01-24
-- Purpose: Simplify work item types from 13 to 4 core types
-- Note: No existing data, so this is a clean schema change

-- Step 1: Drop old type constraint
ALTER TABLE work_items
  DROP CONSTRAINT IF EXISTS work_items_type_check;

-- Step 2: Add new constraint with 4 core types
ALTER TABLE work_items
  ADD CONSTRAINT work_items_type_check
  CHECK (type IN ('concept', 'feature', 'bug', 'enhancement'));

-- Step 3: Add index on type for performance
CREATE INDEX IF NOT EXISTS idx_work_items_type ON work_items(type);

-- Comments for documentation
COMMENT ON COLUMN work_items.type IS 'Work item type: concept (unvalidated idea), feature (new functionality), bug (something broken), enhancement (make existing better). Use tags for sub-categorization.';
