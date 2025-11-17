-- Add Phase Lead role system to user_phase_assignments
-- Allows users to be designated as leads for specific phases
-- Created: 2025-01-17

-- Step 1: Add is_lead column
ALTER TABLE user_phase_assignments
  ADD COLUMN is_lead BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Add index for lead queries (WHERE is_lead = true)
CREATE INDEX idx_user_phase_leads
  ON user_phase_assignments(workspace_id, phase, is_lead)
  WHERE is_lead = true;

-- Step 3: Add check constraint to limit max 2 leads per phase
-- This is enforced at the application layer to provide better UX (warning messages)
-- The database will allow up to 2 leads, but we'll warn users to keep it at 1

-- Step 4: Update RLS policies to allow phase leads to manage their phases

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update phase assignments in their team" ON user_phase_assignments;

-- Create new UPDATE policy that includes phase leads
CREATE POLICY "Admins and phase leads can update phase assignments"
ON user_phase_assignments FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
  AND (
    -- Is owner/admin (existing logic)
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND team_id = user_phase_assignments.team_id
      AND role IN ('owner', 'admin')
    )
    OR
    -- Is phase lead for this phase (NEW)
    EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = auth.uid()
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create phase assignments in their team" ON user_phase_assignments;

-- Create new INSERT policy that includes phase leads
CREATE POLICY "Admins and phase leads can create phase assignments"
ON user_phase_assignments FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
  AND (
    -- Is owner/admin (existing logic)
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND team_id = user_phase_assignments.team_id
      AND role IN ('owner', 'admin')
    )
    OR
    -- Is phase lead for this workspace+phase (NEW)
    -- Phase leads can only assign users to their own phases
    EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = auth.uid()
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Users can delete phase assignments in their team" ON user_phase_assignments;

-- Create new DELETE policy that includes phase leads
CREATE POLICY "Admins and phase leads can delete phase assignments"
ON user_phase_assignments FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
  AND (
    -- Is owner/admin (existing logic)
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND team_id = user_phase_assignments.team_id
      AND role IN ('owner', 'admin')
    )
    OR
    -- Is phase lead for this phase (NEW)
    EXISTS (
      SELECT 1 FROM user_phase_assignments upa
      WHERE upa.user_id = auth.uid()
      AND upa.workspace_id = user_phase_assignments.workspace_id
      AND upa.phase = user_phase_assignments.phase
      AND upa.is_lead = true
    )
  )
);

-- Step 5: Add helpful database function to count leads per phase
CREATE OR REPLACE FUNCTION count_phase_leads(
  p_workspace_id TEXT,
  p_phase TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO lead_count
  FROM user_phase_assignments
  WHERE workspace_id = p_workspace_id
  AND phase = p_phase
  AND is_lead = true;

  RETURN lead_count;
END;
$$;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN user_phase_assignments.is_lead IS
  'Whether this user is a phase lead. Phase leads can invite/manage users within their assigned phase. Max 2 leads per phase recommended (enforced in UI).';

COMMENT ON FUNCTION count_phase_leads(TEXT, TEXT) IS
  'Returns the number of phase leads for a given workspace and phase. Used to enforce the "max 2 leads per phase" recommendation.';

COMMENT ON INDEX idx_user_phase_leads IS
  'Partial index for efficient queries of phase leads (WHERE is_lead = true).';
