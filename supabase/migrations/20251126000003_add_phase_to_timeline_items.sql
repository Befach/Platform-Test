-- Migration: Add phase column to timeline_items table
-- Issue #4: Timeline items don't have phase tracking independent of parent work item
-- Solution: Add phase column with inheritance from parent work item
-- Note: Maps 'ideation' workflow_stage to 'research' phase
--
-- Phase values: 'research' | 'planning' | 'execution' | 'review' | 'complete'

-- Step 1: Add the phase column with default (no constraint yet)
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'planning';

-- Step 2: Populate phase from parent work item, mapping ideation->research
UPDATE timeline_items ti
SET phase = CASE
  WHEN (SELECT workflow_stage FROM work_items wi WHERE wi.id = ti.work_item_id) = 'ideation' THEN 'research'
  WHEN (SELECT workflow_stage FROM work_items wi WHERE wi.id = ti.work_item_id) IN ('research', 'planning', 'execution', 'review', 'complete')
    THEN (SELECT workflow_stage FROM work_items wi WHERE wi.id = ti.work_item_id)
  ELSE 'planning'
END;

-- Step 3: Create index for filtering by phase
CREATE INDEX IF NOT EXISTS idx_timeline_items_phase
  ON timeline_items(phase);

-- Step 4: Now add the check constraint after data is clean
ALTER TABLE timeline_items
  ADD CONSTRAINT timeline_items_phase_check
  CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete'));

-- Step 5: Add comment for documentation
COMMENT ON COLUMN timeline_items.phase IS 'Workflow phase: research, planning, execution, review, complete. Defaults to planning.';
