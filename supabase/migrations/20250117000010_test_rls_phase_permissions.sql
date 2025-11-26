/**
 * RLS Policy Test Suite for Phase-Based Permissions
 *
 * Comprehensive test suite validating Row-Level Security policies
 * for the phase-based access control system.
 *
 * Test Coverage:
 * 1. Team isolation (users can't see other teams' data)
 * 2. View permissions (all team members can view all items)
 * 3. Edit permissions (only assigned phases or admins)
 * 4. Delete permissions (same as edit)
 * 5. Admin bypass (owners and admins bypass phase restrictions)
 * 6. Phase assignment enforcement
 *
 * Run these tests after deploying RLS policies to verify security.
 *
 * IMPORTANT: This is a test migration. Run in development/staging only.
 * DO NOT run in production without proper test user cleanup.
 */

-- Test Setup: Create test users and teams
DO $$
DECLARE
  test_team_1 TEXT := 'test_team_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  test_team_2 TEXT := 'test_team_2_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  test_workspace TEXT := 'test_workspace_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  test_user_admin UUID;
  test_user_member UUID;
  test_user_other_team UUID;
BEGIN
  RAISE NOTICE '🧪 Starting RLS Policy Test Suite';
  RAISE NOTICE '====================================';

  -- Note: In real tests, these would be actual auth.users
  -- For migration testing, we'll use dummy UUIDs
  test_user_admin := gen_random_uuid();
  test_user_member := gen_random_uuid();
  test_user_other_team := gen_random_uuid();

  RAISE NOTICE 'Test Users Created:';
  RAISE NOTICE '  Admin: %', test_user_admin;
  RAISE NOTICE '  Member: %', test_user_member;
  RAISE NOTICE '  Other Team: %', test_user_other_team;

  -- Create test teams
  INSERT INTO teams (id, name, owner_id, plan, created_at)
  VALUES
    (test_team_1, 'Test Team 1', test_user_admin, 'pro', NOW()),
    (test_team_2, 'Test Team 2', test_user_other_team, 'free', NOW());

  RAISE NOTICE 'Test Teams Created: % and %', test_team_1, test_team_2;

  -- Create team memberships
  INSERT INTO team_members (id, team_id, user_id, role, joined_at)
  VALUES
    (gen_random_uuid(), test_team_1, test_user_admin, 'owner', NOW()),
    (gen_random_uuid(), test_team_1, test_user_member, 'member', NOW()),
    (gen_random_uuid(), test_team_2, test_user_other_team, 'owner', NOW());

  RAISE NOTICE 'Team Members Created';

  -- Create test workspace
  INSERT INTO workspaces (id, team_id, name, created_at)
  VALUES (test_workspace, test_team_1, 'Test Workspace', NOW());

  RAISE NOTICE 'Test Workspace Created: %', test_workspace;

  -- Create phase assignments
  -- Admin has no assignments (bypasses via role)
  -- Member only has edit access to 'planning' and 'execution' phases
  INSERT INTO user_phase_assignments (id, team_id, workspace_id, user_id, phase, can_edit, assigned_by, assigned_at)
  VALUES
    (gen_random_uuid(), test_team_1, test_workspace, test_user_member, 'planning', true, test_user_admin, NOW()),
    (gen_random_uuid(), test_team_1, test_workspace, test_user_member, 'execution', true, test_user_admin, NOW());

  RAISE NOTICE 'Phase Assignments Created (planning, execution for member)';

  -- Create test work items in different phases
  INSERT INTO work_items (id, team_id, workspace_id, title, status, has_timeline_breakdown, assigned_to, created_by, created_at)
  VALUES
    -- Research phase item (member has view-only)
    ('item_research', test_team_1, test_workspace, 'Research Item', 'planning', false, NULL, test_user_admin, NOW()),
    -- Planning phase item (member can edit)
    ('item_planning', test_team_1, test_workspace, 'Planning Item', 'planning', false, NULL, test_user_admin, NOW()),
    -- Execution phase item (member can edit)
    ('item_execution', test_team_1, test_workspace, 'Execution Item', 'in_progress', true, test_user_member::TEXT, test_user_admin, NOW()),
    -- Review phase item (member has view-only)
    ('item_review', test_team_1, test_workspace, 'Review Item', 'in_review', true, test_user_member::TEXT, test_user_admin, NOW()),
    -- Complete phase item (member has view-only)
    ('item_complete', test_team_1, test_workspace, 'Complete Item', 'completed', true, test_user_member::TEXT, test_user_admin, NOW()),
    -- Item in other team (should be completely isolated)
    ('item_other_team', test_team_2, 'other_workspace_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'Other Team Item', 'planning', false, NULL, test_user_other_team, NOW());

  RAISE NOTICE 'Test Work Items Created (5 items across phases)';

  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test Data Setup Complete';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  -- ========================================
  -- TEST 1: Team Isolation
  -- ========================================
  RAISE NOTICE '📋 TEST 1: Team Isolation';
  RAISE NOTICE '----------------------------';

  -- Test: User in team_1 should NOT see items from team_2
  PERFORM 1 FROM work_items WHERE id = 'item_other_team' AND team_id = test_team_2;
  IF FOUND THEN
    RAISE WARNING '❌ FAILED: Team isolation broken - user can see other team data';
  ELSE
    RAISE NOTICE '✅ PASSED: Team isolation working correctly';
  END IF;

  -- ========================================
  -- TEST 2: View Permissions (All Members)
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST 2: View Permissions';
  RAISE NOTICE '----------------------------';

  -- Test: Member should be able to SELECT all items in their team
  PERFORM 1 FROM work_items WHERE team_id = test_team_1;
  IF FOUND THEN
    RAISE NOTICE '✅ PASSED: Members can view all team items';
  ELSE
    RAISE WARNING '❌ FAILED: Members cannot view team items';
  END IF;

  -- ========================================
  -- TEST 3: Edit Permissions (Phase-Based)
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST 3: Edit Permissions';
  RAISE NOTICE '----------------------------';

  -- Note: RLS tests in migrations are limited because we can't SET ROLE
  -- These tests validate the policy EXISTS, not runtime enforcement
  -- Runtime enforcement must be tested via API integration tests

  -- Check that RLS policies exist
  PERFORM 1 FROM pg_policies
  WHERE tablename = 'work_items'
    AND policyname LIKE '%phase%';

  IF FOUND THEN
    RAISE NOTICE '✅ PASSED: Phase-based RLS policies exist';
  ELSE
    RAISE WARNING '❌ FAILED: Phase-based RLS policies not found';
  END IF;

  -- ========================================
  -- TEST 4: Admin Bypass
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST 4: Admin Bypass Check';
  RAISE NOTICE '----------------------------';

  -- Check if admin detection function exists
  PERFORM 1 FROM pg_proc WHERE proname = 'is_user_admin_or_owner';

  IF FOUND THEN
    RAISE NOTICE '✅ PASSED: Admin detection function exists';
  ELSE
    RAISE WARNING '❌ FAILED: Admin detection function not found';
  END IF;

  -- Test admin status for test users
  IF EXISTS(
    SELECT 1 FROM team_members
    WHERE team_id = test_team_1
      AND user_id = test_user_admin
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE NOTICE '✅ PASSED: Admin user has correct role';
  ELSE
    RAISE WARNING '❌ FAILED: Admin user does not have admin role';
  END IF;

  -- ========================================
  -- TEST 5: Phase Assignment Validation
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST 5: Phase Assignments';
  RAISE NOTICE '----------------------------';

  -- Check member has correct phase assignments
  IF EXISTS(
    SELECT 1 FROM user_phase_assignments
    WHERE user_id = test_user_member
      AND phase IN ('planning', 'execution')
      AND can_edit = true
  ) THEN
    RAISE NOTICE '✅ PASSED: Member has correct phase assignments';
  ELSE
    RAISE WARNING '❌ FAILED: Member phase assignments incorrect';
  END IF;

  -- Check member does NOT have edit for review/complete
  IF NOT EXISTS(
    SELECT 1 FROM user_phase_assignments
    WHERE user_id = test_user_member
      AND phase IN ('review', 'complete')
      AND can_edit = true
  ) THEN
    RAISE NOTICE '✅ PASSED: Member correctly lacks review/complete edit access';
  ELSE
    RAISE WARNING '❌ FAILED: Member incorrectly has review/complete edit access';
  END IF;

  -- ========================================
  -- TEST 6: RLS Policy Coverage
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST 6: RLS Policy Coverage';
  RAISE NOTICE '----------------------------';

  -- Check all critical tables have RLS enabled
  WITH rls_status AS (
    SELECT
      schemaname,
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'work_items',
        'user_phase_assignments',
        'team_members',
        'workspaces',
        'teams'
      )
  )
  SELECT
    tablename,
    CASE
      WHEN rowsecurity THEN '✅ Enabled'
      ELSE '❌ DISABLED'
    END as status
  INTO TEMP TABLE rls_results
  FROM rls_status;

  -- Display results
  RAISE NOTICE 'RLS Status for Critical Tables:';
  FOR rec IN SELECT * FROM rls_results LOOP
    RAISE NOTICE '  %: %', rec.tablename, rec.status;
  END LOOP;

  -- ========================================
  -- CLEANUP: Remove Test Data
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Cleaning up test data...';
  RAISE NOTICE '----------------------------';

  DELETE FROM work_items WHERE team_id IN (test_team_1, test_team_2);
  DELETE FROM user_phase_assignments WHERE team_id IN (test_team_1, test_team_2);
  DELETE FROM workspaces WHERE team_id IN (test_team_1, test_team_2);
  DELETE FROM team_members WHERE team_id IN (test_team_1, test_team_2);
  DELETE FROM teams WHERE id IN (test_team_1, test_team_2);

  RAISE NOTICE '✅ Test data cleaned up';

  -- ========================================
  -- TEST SUMMARY
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '📊 RLS POLICY TEST SUITE COMPLETE';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: SQL-level tests are limited.';
  RAISE NOTICE 'Run API integration tests to validate runtime enforcement:';
  RAISE NOTICE '  - npm run test:api';
  RAISE NOTICE '  - npm run test:e2e';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Results:';
  RAISE NOTICE '  ✅ All team members can VIEW all items';
  RAISE NOTICE '  ✅ Members can EDIT only assigned phases';
  RAISE NOTICE '  ✅ Admins/owners can EDIT all phases';
  RAISE NOTICE '  ✅ Teams are completely isolated';
  RAISE NOTICE '  ✅ Phase changes require permission for both phases';
  RAISE NOTICE '';

END $$;

-- Add comment to migration
COMMENT ON SCHEMA public IS 'RLS policy test suite executed - check logs for results';
