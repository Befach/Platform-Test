-- =============================================================================
-- Migration: Type-Specific Phase System
-- Created: 2025-12-16
--
-- This migration transforms the unified phase system into a type-aware system
-- where different work item types have different phase workflows:
--
-- Feature:     design → build → refine → launch
-- Concept:     ideation → research → validated | rejected
-- Bug:         triage → investigating → fixing → verified
-- Enhancement: design → build → refine → launch (same as Feature)
--
-- Also adds versioning support for enhancement linking.
-- =============================================================================

-- =============================================================================
-- STEP 1: Drop existing phase CHECK constraint
-- =============================================================================
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_phase_check;

-- Also drop any legacy constraints that might exist
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_phase_check_new;

-- =============================================================================
-- STEP 2: Add type-aware CHECK constraint
-- =============================================================================
-- This constraint ensures each work item type can only have valid phases
ALTER TABLE work_items ADD CONSTRAINT work_items_phase_check CHECK (
  -- Feature phases (unchanged from current system)
  (type = 'feature' AND phase IN ('design', 'build', 'refine', 'launch'))
  OR
  -- Concept phases (NEW - ideation flow)
  (type = 'concept' AND phase IN ('ideation', 'research', 'validated', 'rejected'))
  OR
  -- Bug phases (SIMPLIFIED - triage flow)
  (type = 'bug' AND phase IN ('triage', 'investigating', 'fixing', 'verified'))
  OR
  -- Enhancement phases (same as Feature)
  (type = 'enhancement' AND phase IN ('design', 'build', 'refine', 'launch'))
  OR
  -- Allow NULL phase temporarily during creation
  (phase IS NULL)
);

-- =============================================================================
-- STEP 3: Add versioning columns for enhancement linking
-- =============================================================================
-- enhances_work_item_id: Links this item to the parent it enhances
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS enhances_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL;

-- version: Auto-incremented version number (1, 2, 3...)
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- version_notes: Changelog/release notes for this version
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- =============================================================================
-- STEP 4: Add review configuration columns
-- =============================================================================
-- review_enabled: Per-item toggle for review process (defaults vary by type)
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS review_enabled BOOLEAN DEFAULT true;

-- review_status: Current review state
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS review_status TEXT;

-- Add CHECK constraint for review_status values
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_review_status_check;
ALTER TABLE work_items ADD CONSTRAINT work_items_review_status_check
  CHECK (review_status IS NULL OR review_status IN ('pending', 'approved', 'needs_revision', 'rejected'));

-- =============================================================================
-- STEP 5: Create indexes for new columns
-- =============================================================================
-- Index for finding all enhancements of a work item
CREATE INDEX IF NOT EXISTS idx_work_items_enhances
  ON work_items(enhances_work_item_id)
  WHERE enhances_work_item_id IS NOT NULL;

-- Composite index for type-phase queries (common in UI filtering)
CREATE INDEX IF NOT EXISTS idx_work_items_type_phase
  ON work_items(type, phase);

-- Index for review status filtering
CREATE INDEX IF NOT EXISTS idx_work_items_review_status
  ON work_items(review_status)
  WHERE review_status IS NOT NULL;

-- =============================================================================
-- STEP 6: Data migration - Map existing items to new phases
-- =============================================================================
-- Migrate existing concepts from unified phases to concept-specific phases
-- design → ideation (concepts start fresh in ideation)
UPDATE work_items
SET phase = 'ideation'
WHERE type = 'concept' AND phase = 'design';

-- build → research (concepts in build are researching)
UPDATE work_items
SET phase = 'research'
WHERE type = 'concept' AND phase = 'build';

-- refine → research (concepts in refine are still researching/validating)
UPDATE work_items
SET phase = 'research'
WHERE type = 'concept' AND phase = 'refine';

-- launch → validated (concepts that were "launched" are validated)
UPDATE work_items
SET phase = 'validated'
WHERE type = 'concept' AND phase = 'launch';

-- Migrate existing bugs from unified phases to bug-specific phases
-- design → triage (bugs in design are being triaged)
UPDATE work_items
SET phase = 'triage'
WHERE type = 'bug' AND phase = 'design';

-- build → fixing (bugs in build are being fixed)
UPDATE work_items
SET phase = 'fixing'
WHERE type = 'bug' AND phase = 'build';

-- refine → fixing (bugs in refine are still being fixed/tested)
UPDATE work_items
SET phase = 'fixing'
WHERE type = 'bug' AND phase = 'refine';

-- launch → verified (bugs that were "launched" are verified)
UPDATE work_items
SET phase = 'verified'
WHERE type = 'bug' AND phase = 'launch';

-- =============================================================================
-- STEP 7: Set default review_enabled based on type
-- =============================================================================
-- Bugs default to review disabled (optional review)
UPDATE work_items
SET review_enabled = false
WHERE type = 'bug' AND review_enabled IS NULL;

-- All other types default to review enabled
UPDATE work_items
SET review_enabled = true
WHERE type != 'bug' AND review_enabled IS NULL;

-- =============================================================================
-- STEP 8: Add RLS policies for new columns
-- =============================================================================
-- The existing RLS policies on work_items already cover team_id access
-- No additional policies needed as the new columns inherit from the table policy

-- =============================================================================
-- STEP 9: Create helper function for getting next version number
-- =============================================================================
CREATE OR REPLACE FUNCTION get_next_version(parent_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM work_items
  WHERE enhances_work_item_id = parent_id OR id = parent_id;

  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 10: Add comment documentation
-- =============================================================================
COMMENT ON COLUMN work_items.enhances_work_item_id IS
  'Links this work item to a parent work item it enhances. Used for versioning/enhancement tracking.';

COMMENT ON COLUMN work_items.version IS
  'Version number in the enhancement chain. Auto-incremented when creating enhancements.';

COMMENT ON COLUMN work_items.version_notes IS
  'Changelog or release notes describing what changed in this version.';

COMMENT ON COLUMN work_items.review_enabled IS
  'Whether the detached review process is enabled for this item. Defaults to true for features/concepts, false for bugs.';

COMMENT ON COLUMN work_items.review_status IS
  'Current status of the review process: pending, approved, needs_revision, or rejected.';

COMMENT ON FUNCTION get_next_version(TEXT) IS
  'Returns the next version number for an enhancement chain. Pass the parent work item ID.';
