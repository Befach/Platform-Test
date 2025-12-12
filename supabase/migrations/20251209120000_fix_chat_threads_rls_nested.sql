-- =============================================================================
-- Migration: Fix Chat Threads RLS Nested Policy Issue
-- Purpose: Fix RLS policies that fail due to nested team_members query
-- Problem: chat_threads RLS policy uses subquery on team_members which has RLS
-- Solution: Use SECURITY DEFINER helper function user_is_team_member()
-- =============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "chat_threads_team_access" ON chat_threads;
DROP POLICY IF EXISTS "chat_messages_thread_access" ON chat_messages;

-- Create new policy using SECURITY DEFINER function
-- The user_is_team_member() function (defined in 20251201000001_optimize_rls_auth_initplan.sql)
-- runs with elevated privileges and can query team_members without being blocked by its RLS
CREATE POLICY "chat_threads_team_access" ON chat_threads
  FOR ALL USING (user_is_team_member(team_id));

-- For messages, we need to check via the thread's team_id
-- Create a helper function with SECURITY DEFINER for this
CREATE OR REPLACE FUNCTION user_can_access_chat_thread(p_thread_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_threads ct
    JOIN team_members tm ON tm.team_id = ct.team_id
    WHERE ct.id = p_thread_id
    AND tm.user_id = (select auth.uid())
  );
$$;

CREATE POLICY "chat_messages_thread_access" ON chat_messages
  FOR ALL USING (user_can_access_chat_thread(thread_id));
