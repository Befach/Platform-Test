-- Migration: Fix Enhancement Architecture (v2)
-- Date: 2025-12-23
-- Purpose: Change enhancement from a work item type to a flag on features

-- Add is_enhancement column if it doesn't exist
ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS is_enhancement BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_work_items_is_enhancement
ON work_items(is_enhancement) WHERE is_enhancement = TRUE;

-- Migrate enhancement type to feature with flag
UPDATE work_items
SET
  type = 'feature',
  is_enhancement = TRUE
WHERE type = 'enhancement';

-- Drop old constraint
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_phase_check;
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_type_phase_check;

-- Add new constraint with only 3 types
ALTER TABLE work_items ADD CONSTRAINT work_items_type_phase_check CHECK (
  (type = 'feature' AND phase IN ('design', 'build', 'refine', 'launch'))
  OR
  (type = 'concept' AND phase IN ('ideation', 'research', 'validated', 'rejected'))
  OR
  (type = 'bug' AND phase IN ('triage', 'investigating', 'fixing', 'verified'))
  OR
  (phase IS NULL)
);

-- Add column comment
COMMENT ON COLUMN work_items.is_enhancement IS
'Flag indicating this feature is an enhancement/iteration of another work item. See enhances_work_item_id for parent link.';
