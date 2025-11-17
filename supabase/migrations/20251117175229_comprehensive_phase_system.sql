-- =====================================================
-- Comprehensive Phase-Based Permission System
-- =====================================================
-- This migration adds explicit phase assignment to work items
-- and creates supporting tables for audit trail, access requests,
-- and performance optimization.
--
-- Key Changes:
-- 1. Add phase column to work_items (explicit user selection)
-- 2. Create audit trail for phase changes
-- 3. Create access request workflow
-- 4. Create workload cache for performance
-- 5. Update RLS policies for explicit phase enforcement
-- =====================================================

-- =====================================================
-- STEP 1: Add phase column to work_items
-- =====================================================

-- Add phase column (nullable first for migration)
ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS phase TEXT
CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete'));

-- Backfill existing work items with calculated phase
-- Uses the existing calculate_work_item_phase function
UPDATE work_items
SET phase = calculate_work_item_phase(id, status, owner)
WHERE phase IS NULL;

-- Make phase NOT NULL after backfill
ALTER TABLE work_items
ALTER COLUMN phase SET NOT NULL;

-- Add index for phase filtering (performance optimization)
CREATE INDEX IF NOT EXISTS idx_work_items_phase
ON work_items(workspace_id, phase);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_work_items_workspace_phase_status
ON work_items(workspace_id, phase, status);

-- Add index for team-level queries
CREATE INDEX IF NOT EXISTS idx_work_items_team_phase
ON work_items(team_id, phase);

COMMENT ON COLUMN work_items.phase IS 'Explicit phase assignment (user-selected, RLS-enforced)';

-- =====================================================
-- STEP 2: Create phase_assignment_history table
-- =====================================================
-- Tracks all phase changes for audit trail and compliance

CREATE TABLE IF NOT EXISTS phase_assignment_history (
  id TEXT PRIMARY KEY DEFAULT ('phase_history_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000)::int),
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  from_phase TEXT CHECK (from_phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  to_phase TEXT NOT NULL CHECK (to_phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  changed_by TEXT NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_phase_transition CHECK (from_phase IS NULL OR from_phase != to_phase)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_phase_history_work_item
ON phase_assignment_history(work_item_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase_history_team
ON phase_assignment_history(team_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase_history_workspace
ON phase_assignment_history(workspace_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase_history_user
ON phase_assignment_history(changed_by, changed_at DESC);

COMMENT ON TABLE phase_assignment_history IS 'Audit trail for all work item phase changes';

-- Enable RLS
ALTER TABLE phase_assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phase_assignment_history
CREATE POLICY "Users can view phase history in their teams" ON phase_assignment_history
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert phase history" ON phase_assignment_history
  FOR INSERT
  WITH CHECK (true); -- Managed by trigger, not direct inserts

-- =====================================================
-- STEP 3: Create phase_access_requests table
-- =====================================================
-- Allows users to request access to restricted phases

CREATE TABLE IF NOT EXISTS phase_access_requests (
  id TEXT PRIMARY KEY DEFAULT ('access_req_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000)::int),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  -- Request metadata
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expected_duration TEXT, -- e.g., "2 weeks", "1 month"

  -- Review metadata
  reviewed_by TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  -- Foreign keys
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT valid_review CHECK (
    (status = 'pending' AND reviewed_by IS NULL) OR
    (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_user
ON phase_access_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_access_requests_workspace
ON phase_access_requests(workspace_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_requests_pending
ON phase_access_requests(status, requested_at) WHERE status = 'pending';

COMMENT ON TABLE phase_access_requests IS 'User requests for phase access (self-service permission workflow)';

-- Enable RLS
ALTER TABLE phase_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phase_access_requests
CREATE POLICY "Users can view their own access requests" ON phase_access_requests
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create access requests" ON phase_access_requests
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Phase leads and admins can review requests" ON phase_access_requests
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM user_phase_assignments
      WHERE user_id = auth.uid()
        AND workspace_id = phase_access_requests.workspace_id
        AND phase = phase_access_requests.phase
        AND is_lead = true
    )
  );

-- =====================================================
-- STEP 4: Create phase_workload_cache table
-- =====================================================
-- Performance optimization: cache work item counts per phase

CREATE TABLE IF NOT EXISTS phase_workload_cache (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),

  -- Counts by status
  total_count INTEGER DEFAULT 0 NOT NULL,
  not_started_count INTEGER DEFAULT 0 NOT NULL,
  in_progress_count INTEGER DEFAULT 0 NOT NULL,
  completed_count INTEGER DEFAULT 0 NOT NULL,
  on_hold_count INTEGER DEFAULT 0 NOT NULL,

  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  PRIMARY KEY (workspace_id, phase)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_workload_cache_team
ON phase_workload_cache(team_id, phase);

COMMENT ON TABLE phase_workload_cache IS 'Cached work item counts per phase for performance';

-- Enable RLS
ALTER TABLE phase_workload_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view workload in their teams" ON phase_workload_cache
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 5: Create trigger for phase history
-- =====================================================
-- Automatically log phase changes to audit trail

CREATE OR REPLACE FUNCTION log_phase_change() RETURNS TRIGGER AS $$
BEGIN
  -- Only log if phase actually changed
  IF (TG_OP = 'INSERT') OR (OLD.phase IS DISTINCT FROM NEW.phase) THEN
    INSERT INTO phase_assignment_history (
      work_item_id,
      from_phase,
      to_phase,
      changed_by,
      changed_at,
      team_id,
      workspace_id,
      metadata
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.phase END,
      NEW.phase,
      auth.uid(),
      NOW(),
      NEW.team_id,
      NEW.workspace_id,
      jsonb_build_object(
        'operation', TG_OP,
        'old_status', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
        'new_status', NEW.status,
        'old_owner', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.owner END,
        'new_owner', NEW.owner
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS work_item_phase_change_trigger ON work_items;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER work_item_phase_change_trigger
  AFTER INSERT OR UPDATE OF phase ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION log_phase_change();

COMMENT ON FUNCTION log_phase_change IS 'Automatically logs work item phase changes to audit trail';

-- =====================================================
-- STEP 6: Create function to update workload cache
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_phase_workload_cache(p_workspace_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Delete existing cache for this workspace
  DELETE FROM phase_workload_cache WHERE workspace_id = p_workspace_id;

  -- Recalculate and insert new counts
  INSERT INTO phase_workload_cache (
    workspace_id,
    phase,
    total_count,
    not_started_count,
    in_progress_count,
    completed_count,
    on_hold_count,
    team_id
  )
  SELECT
    w.id as workspace_id,
    phases.phase,
    COALESCE(COUNT(wi.id), 0) as total_count,
    COALESCE(SUM(CASE WHEN wi.status = 'not_started' THEN 1 ELSE 0 END), 0) as not_started_count,
    COALESCE(SUM(CASE WHEN wi.status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_count,
    COALESCE(SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_count,
    COALESCE(SUM(CASE WHEN wi.status = 'on_hold' THEN 1 ELSE 0 END), 0) as on_hold_count,
    w.team_id
  FROM workspaces w
  CROSS JOIN (
    SELECT unnest(ARRAY['research', 'planning', 'execution', 'review', 'complete']) as phase
  ) phases
  LEFT JOIN work_items wi ON wi.workspace_id = w.id AND wi.phase = phases.phase
  WHERE w.id = p_workspace_id
  GROUP BY w.id, phases.phase, w.team_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_phase_workload_cache IS 'Recalculates work item counts per phase for a workspace';

-- Create trigger to auto-update cache when work items change
CREATE OR REPLACE FUNCTION auto_refresh_workload_cache() RETURNS TRIGGER AS $$
BEGIN
  -- Refresh cache for the affected workspace
  PERFORM refresh_phase_workload_cache(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.workspace_id
      ELSE NEW.workspace_id
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS work_item_workload_cache_trigger ON work_items;

CREATE TRIGGER work_item_workload_cache_trigger
  AFTER INSERT OR UPDATE OF phase, status OR DELETE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_refresh_workload_cache();

-- =====================================================
-- STEP 7: Update RLS policies for explicit phase
-- =====================================================
-- Replace calculated phase with explicit phase column

-- Drop old INSERT policy that uses calculate_work_item_phase()
DROP POLICY IF EXISTS "Users can create work items in assigned phases" ON work_items;

-- Create new INSERT policy using explicit phase column
CREATE POLICY "Users can create work items in assigned phases" ON work_items
  FOR INSERT
  WITH CHECK (
    -- User must be team member
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND (
      -- Either: User has edit access to the selected phase
      EXISTS (
        SELECT 1 FROM user_phase_assignments
        WHERE user_id = auth.uid()
          AND workspace_id = work_items.workspace_id
          AND phase = work_items.phase
          AND can_edit = true
      )
      OR
      -- Or: User is owner/admin (bypass all phase restrictions)
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
          AND team_id = work_items.team_id
          AND role IN ('owner', 'admin')
      )
    )
  );

-- Update UPDATE policy to check phase permissions
DROP POLICY IF EXISTS "Users can update work items in their team" ON work_items;

CREATE POLICY "Users can update work items in assigned phases" ON work_items
  FOR UPDATE
  USING (
    -- User must be team member
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND (
      -- User has edit access to CURRENT phase
      EXISTS (
        SELECT 1 FROM user_phase_assignments
        WHERE user_id = auth.uid()
          AND workspace_id = work_items.workspace_id
          AND phase = work_items.phase
          AND can_edit = true
      )
      OR
      -- Or user is owner/admin
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
          AND team_id = work_items.team_id
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    -- For phase changes: check permissions on NEW phase
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM user_phase_assignments
        WHERE user_id = auth.uid()
          AND workspace_id = work_items.workspace_id
          AND phase = work_items.phase -- NEW phase after update
          AND can_edit = true
      )
      OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
          AND team_id = work_items.team_id
          AND role IN ('owner', 'admin')
      )
    )
  );

-- =====================================================
-- STEP 8: Create helper function to get phase lead info
-- =====================================================

CREATE OR REPLACE FUNCTION get_phase_lead_info(
  p_workspace_id TEXT,
  p_phase TEXT
) RETURNS TABLE (
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  is_lead BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    upa.user_id,
    COALESCE(u.name, u.email) as user_name,
    u.email as user_email,
    upa.is_lead
  FROM user_phase_assignments upa
  JOIN public.users u ON u.id = upa.user_id
  WHERE upa.workspace_id = p_workspace_id
    AND upa.phase = p_phase
    AND upa.is_lead = true
  ORDER BY upa.assigned_at ASC
  LIMIT 1; -- Return first/primary lead
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_phase_lead_info IS 'Get phase lead contact information for tooltips';

-- =====================================================
-- STEP 9: Initialize workload cache for existing workspaces
-- =====================================================

DO $$
DECLARE
  workspace_record RECORD;
BEGIN
  FOR workspace_record IN SELECT id FROM workspaces
  LOOP
    PERFORM refresh_phase_workload_cache(workspace_record.id);
  END LOOP;
END $$;

-- =====================================================
-- STEP 10: Add helpful comments
-- =====================================================

COMMENT ON INDEX idx_work_items_phase IS 'Fast lookup of work items by workspace and phase';
COMMENT ON INDEX idx_work_items_workspace_phase_status IS 'Composite index for common filtered queries';
COMMENT ON INDEX idx_phase_history_work_item IS 'Fast lookup of phase change history per work item';
COMMENT ON INDEX idx_access_requests_pending IS 'Fast lookup of pending access requests';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Added explicit phase column to work_items
-- ✅ Created audit trail table (phase_assignment_history)
-- ✅ Created access request workflow (phase_access_requests)
-- ✅ Created workload cache for performance (phase_workload_cache)
-- ✅ Updated RLS policies for explicit phase enforcement
-- ✅ Created triggers for automatic audit logging
-- ✅ Created helper functions for phase lead info
-- ✅ Initialized cache for existing workspaces
-- =====================================================
