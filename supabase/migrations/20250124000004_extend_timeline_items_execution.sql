-- Migration: Extend Timeline Items with Execution Tracking
-- Date: 2025-01-24
-- Purpose: Add status, progress, assignment, dates, and blocker tracking to timeline items
-- Note: Status/progress lives on timeline items (MVP/SHORT/LONG), NOT on work items

-- Step 1: Add status tracking
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started'
  CHECK (status IN ('not_started', 'planning', 'in_progress', 'blocked', 'review', 'completed', 'on_hold', 'cancelled'));

-- Step 2: Add progress tracking
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS progress_percent NUMERIC DEFAULT 0
  CHECK (progress_percent >= 0 AND progress_percent <= 100);

-- Step 3: Add assignment
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Add date tracking
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS planned_start_date DATE,
  ADD COLUMN IF NOT EXISTS planned_end_date DATE,
  ADD COLUMN IF NOT EXISTS actual_start_date DATE,
  ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Step 5: Add blocker tracking
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS blockers JSONB DEFAULT '[]'::jsonb;

-- Step 6: Add effort tracking
ALTER TABLE timeline_items
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_items_status ON timeline_items(status);
CREATE INDEX IF NOT EXISTS idx_timeline_items_assigned_to ON timeline_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_timeline_items_dates ON timeline_items(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_timeline_items_blocked ON timeline_items(is_blocked) WHERE is_blocked = true;

-- Step 8: Create aggregate functions for work item status

-- Function: Calculate work item aggregate status from timeline items
CREATE OR REPLACE FUNCTION calculate_work_item_status(p_work_item_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_all_completed BOOLEAN;
  v_any_in_progress BOOLEAN;
  v_any_blocked BOOLEAN;
  v_has_items BOOLEAN;
BEGIN
  -- Check if there are any timeline items
  SELECT COUNT(*) > 0 INTO v_has_items
  FROM timeline_items
  WHERE work_item_id = p_work_item_id;

  -- If no timeline items, return not_started
  IF NOT v_has_items THEN
    RETURN 'not_started';
  END IF;

  -- Check if all timeline items are completed
  SELECT COUNT(*) = COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO v_all_completed
  FROM timeline_items
  WHERE work_item_id = p_work_item_id;

  -- Check if any are in progress
  SELECT COUNT(CASE WHEN status = 'in_progress' THEN 1 END) > 0
  INTO v_any_in_progress
  FROM timeline_items
  WHERE work_item_id = p_work_item_id;

  -- Check if any are blocked
  SELECT COUNT(CASE WHEN status = 'blocked' THEN 1 END) > 0
  INTO v_any_blocked
  FROM timeline_items
  WHERE work_item_id = p_work_item_id;

  IF v_all_completed THEN
    RETURN 'completed';
  ELSIF v_any_blocked THEN
    RETURN 'blocked';
  ELSIF v_any_in_progress THEN
    RETURN 'in_progress';
  ELSE
    RETURN 'not_started';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate work item aggregate progress from timeline items
CREATE OR REPLACE FUNCTION calculate_work_item_progress(p_work_item_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_progress NUMERIC;
BEGIN
  SELECT AVG(progress_percent)
  INTO v_avg_progress
  FROM timeline_items
  WHERE work_item_id = p_work_item_id;

  RETURN COALESCE(v_avg_progress, 0);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN timeline_items.status IS '8-state workflow: not_started → planning → in_progress → blocked → review → completed (also: on_hold, cancelled)';
COMMENT ON COLUMN timeline_items.progress_percent IS 'Progress percentage (0-100). Work item overall progress is calculated as average of timeline item progress.';
COMMENT ON COLUMN timeline_items.assigned_to IS 'User assigned to work on this timeline item (tactical execution assignment)';
COMMENT ON COLUMN timeline_items.is_blocked IS 'True if this timeline item is blocked. See blockers JSONB for blocker details.';
COMMENT ON COLUMN timeline_items.blockers IS 'Array of blocker objects: {id, reason, blocked_by_work_item_id, created_at, resolved_at}';
