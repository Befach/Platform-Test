-- Phase-Based Permission System Migration
-- Created: 2025-01-17
-- Purpose: Enable per-workspace phase assignments for team members
-- Description: This migration creates a granular permission system where team owners/admins
--              can assign specific team members to work on specific phases (research, planning,
--              execution, review, complete) in each workspace. Members can only create/edit/delete
--              work items in phases they're assigned to, while owners/admins bypass restrictions.

-- ============================================================================
-- 1. CREATE user_phase_assignments TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_phase_assignments (
    -- Primary key: timestamp-based TEXT ID (matching project convention)
    id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

    -- Multi-tenancy: team_id for RLS filtering
    team_id TEXT NOT NULL,

    -- Workspace scope: which workspace this assignment applies to
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- User assignment: which user has access to this phase
    user_id TEXT NOT NULL,

    -- Phase: which lifecycle phase this assignment covers
    phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),

    -- Permission level: can this user edit items in this phase?
    can_edit BOOLEAN DEFAULT true NOT NULL,

    -- Audit trail: who assigned this permission and when
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Optional context: why was this user assigned to this phase?
    notes TEXT,

    -- Ensure one assignment per user per phase per workspace
    UNIQUE(workspace_id, user_id, phase),

    -- Foreign key constraints
    CONSTRAINT fk_user_phase_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_phase_assigner FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Team-based filtering (most common query pattern)
CREATE INDEX idx_user_phase_team ON user_phase_assignments(team_id);

-- Workspace-based filtering (get all assignments for a workspace)
CREATE INDEX idx_user_phase_workspace ON user_phase_assignments(workspace_id);

-- User-based filtering (get all phases a user can access)
CREATE INDEX idx_user_phase_user ON user_phase_assignments(user_id);

-- Phase-based filtering (get all users assigned to a phase)
CREATE INDEX idx_user_phase_phase ON user_phase_assignments(phase);

-- Composite index for permission checks (user + workspace + phase)
CREATE INDEX idx_user_phase_permission ON user_phase_assignments(user_id, workspace_id, phase, can_edit);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_phase_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR user_phase_assignments
-- ============================================================================

-- SELECT: All team members can view phase assignments in their team
-- Rationale: Transparency - everyone should know who's working on what
CREATE POLICY "Team members can view phase assignments"
ON user_phase_assignments FOR SELECT
USING (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
);

-- INSERT: Only owners and admins can create phase assignments
-- Rationale: Permission management should be restricted to team leadership
CREATE POLICY "Owners and admins can create phase assignments"
ON user_phase_assignments FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- UPDATE: Only owners and admins can modify phase assignments
-- Rationale: Prevent users from escalating their own permissions
CREATE POLICY "Owners and admins can update phase assignments"
ON user_phase_assignments FOR UPDATE
USING (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- DELETE: Only owners and admins can remove phase assignments
-- Rationale: Permission revocation should be controlled by team leadership
CREATE POLICY "Owners and admins can delete phase assignments"
ON user_phase_assignments FOR DELETE
USING (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- ============================================================================
-- 5. CREATE calculate_work_item_phase() FUNCTION
-- ============================================================================

-- This function replicates the TypeScript logic from workspace-phases.ts
-- It calculates which phase a work item belongs to based on its state
CREATE OR REPLACE FUNCTION calculate_work_item_phase(
    p_work_item_id TEXT,
    p_status TEXT,
    p_owner TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_timeline BOOLEAN;
    v_phase TEXT;
BEGIN
    -- Check if work item has timeline breakdown
    SELECT EXISTS(
        SELECT 1 FROM timeline_items
        WHERE work_item_id = p_work_item_id
    ) INTO v_has_timeline;

    -- Phase calculation logic (matching TypeScript version):

    -- 1. Completed items → 'complete'
    IF p_status IN ('completed', 'done') THEN
        RETURN 'complete';
    END IF;

    -- 2. Review status → 'review'
    IF p_status IN ('review', 'in_review', 'pending_review') THEN
        RETURN 'review';
    END IF;

    -- 3. In progress with owner → 'execution'
    IF p_status = 'in_progress' AND p_owner IS NOT NULL THEN
        RETURN 'execution';
    END IF;

    -- 4. Has timeline items → 'planning'
    IF v_has_timeline THEN
        RETURN 'planning';
    END IF;

    -- 5. Default → 'research'
    RETURN 'research';
END;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION calculate_work_item_phase(TEXT, TEXT, TEXT) IS
'Calculates which lifecycle phase a work item belongs to based on its status, owner, and timeline breakdown. Matches TypeScript logic in workspace-phases.ts';

-- ============================================================================
-- 6. UPDATE work_items RLS POLICIES
-- ============================================================================

-- IMPORTANT: Keep existing SELECT policy unchanged
-- Rationale: All team members need to view all work items for context,
--            regardless of phase assignments (read-only transparency)

-- The existing SELECT policy should be:
-- "Team members can view team work items" - NO CHANGES NEEDED

-- ============================================================================
-- 6.1. UPDATE INSERT POLICY FOR work_items
-- ============================================================================

-- Drop old INSERT policy (allows all team members to insert)
DROP POLICY IF EXISTS "Team members can create work items" ON work_items;

-- Create new INSERT policy with phase-based restrictions
CREATE POLICY "Users can create work items in assigned phases"
ON work_items FOR INSERT
WITH CHECK (
    -- User must be a team member
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
    AND (
        -- OPTION A: User is assigned to the calculated phase with edit permission
        -- Note: For new inserts, we calculate phase based on initial status/owner
        EXISTS (
            SELECT 1 FROM user_phase_assignments
            WHERE user_id = auth.uid()
            AND workspace_id = work_items.workspace_id
            AND phase = calculate_work_item_phase(
                work_items.id,
                work_items.status,
                work_items.owner
            )
            AND can_edit = true
        )
        OR
        -- OPTION B: User is owner or admin (bypass phase restrictions)
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND team_id = work_items.team_id
            AND role IN ('owner', 'admin')
        )
    )
);

-- ============================================================================
-- 6.2. UPDATE UPDATE POLICY FOR work_items
-- ============================================================================

-- Drop old UPDATE policy (allows all team members to update)
DROP POLICY IF EXISTS "Team members can update team work items" ON work_items;

-- Create new UPDATE policy with phase-based restrictions
CREATE POLICY "Users can update work items in assigned phases"
ON work_items FOR UPDATE
USING (
    -- User must be a team member
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
    AND (
        -- OPTION A: User is assigned to the current phase with edit permission
        -- Check both OLD and NEW phase (in case update moves item to different phase)
        EXISTS (
            SELECT 1 FROM user_phase_assignments
            WHERE user_id = auth.uid()
            AND workspace_id = work_items.workspace_id
            AND phase IN (
                -- Old phase (current state)
                calculate_work_item_phase(
                    work_items.id,
                    work_items.status,
                    work_items.owner
                ),
                -- New phase (after update) - checked in WITH CHECK below
                calculate_work_item_phase(
                    work_items.id,
                    work_items.status,
                    work_items.owner
                )
            )
            AND can_edit = true
        )
        OR
        -- OPTION B: User is owner or admin (bypass phase restrictions)
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND team_id = work_items.team_id
            AND role IN ('owner', 'admin')
        )
    )
)
WITH CHECK (
    -- Same check for the new values after update
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
    AND (
        EXISTS (
            SELECT 1 FROM user_phase_assignments
            WHERE user_id = auth.uid()
            AND workspace_id = work_items.workspace_id
            AND phase = calculate_work_item_phase(
                work_items.id,
                work_items.status,
                work_items.owner
            )
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

-- ============================================================================
-- 6.3. UPDATE DELETE POLICY FOR work_items
-- ============================================================================

-- Drop old DELETE policy (allows all team members to delete)
DROP POLICY IF EXISTS "Team members can delete team work items" ON work_items;

-- Create new DELETE policy with phase-based restrictions
CREATE POLICY "Users can delete work items in assigned phases"
ON work_items FOR DELETE
USING (
    -- User must be a team member
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    )
    AND (
        -- OPTION A: User is assigned to the current phase with edit permission
        EXISTS (
            SELECT 1 FROM user_phase_assignments
            WHERE user_id = auth.uid()
            AND workspace_id = work_items.workspace_id
            AND phase = calculate_work_item_phase(
                work_items.id,
                work_items.status,
                work_items.owner
            )
            AND can_edit = true
        )
        OR
        -- OPTION B: User is owner or admin (bypass phase restrictions)
        EXISTS (
            SELECT 1 FROM team_members
            WHERE user_id = auth.uid()
            AND team_id = work_items.team_id
            AND role IN ('owner', 'admin')
        )
    )
);

-- ============================================================================
-- 7. ADD TABLE COMMENT
-- ============================================================================

COMMENT ON TABLE user_phase_assignments IS
'Stores phase-based permissions for workspace members. Each row grants a user edit access to a specific lifecycle phase (research, planning, execution, review, complete) in a workspace. Owners and admins always bypass these restrictions.';

-- ============================================================================
-- 8. GRANT PERMISSIONS TO ROLES
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_phase_assignments TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================================

-- Verify table creation:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'user_phase_assignments';
-- Expected: rowsecurity = true

-- Verify indexes:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'user_phase_assignments';
-- Expected: 6 indexes (including primary key)

-- Verify RLS policies:
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename = 'user_phase_assignments';
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- Verify work_items policies updated:
-- SELECT policyname FROM pg_policies
-- WHERE tablename = 'work_items';
-- Expected: 4 policies with "assigned phases" naming

-- Test phase calculation function:
-- SELECT calculate_work_item_phase('test_id', 'completed', NULL); -- Should return 'complete'
-- SELECT calculate_work_item_phase('test_id', 'in_review', NULL); -- Should return 'review'
-- SELECT calculate_work_item_phase('test_id', 'in_progress', 'user123'); -- Should return 'execution'
-- SELECT calculate_work_item_phase('test_id', 'not_started', NULL); -- Should return 'research'

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Emergency Only)
-- ============================================================================

-- To rollback this migration (not recommended):
--
-- -- 1. Restore old work_items policies
-- DROP POLICY IF EXISTS "Users can create work items in assigned phases" ON work_items;
-- DROP POLICY IF EXISTS "Users can update work items in assigned phases" ON work_items;
-- DROP POLICY IF EXISTS "Users can delete work items in assigned phases" ON work_items;
--
-- CREATE POLICY "Team members can create work items" ON work_items FOR INSERT
-- WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
--
-- CREATE POLICY "Team members can update team work items" ON work_items FOR UPDATE
-- USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
--
-- CREATE POLICY "Team members can delete team work items" ON work_items FOR DELETE
-- USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
--
-- -- 2. Drop function
-- DROP FUNCTION IF EXISTS calculate_work_item_phase(TEXT, TEXT, TEXT);
--
-- -- 3. Drop table (cascades to all policies and indexes)
-- DROP TABLE IF EXISTS user_phase_assignments CASCADE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
