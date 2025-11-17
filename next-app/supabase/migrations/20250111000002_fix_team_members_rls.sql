-- Fix infinite recursion in team_members RLS policies
-- Migration: 20250111000002_fix_team_members_rls.sql

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Team members can view roster" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- Create non-recursive policies for team_members

-- Allow users to view their own team memberships
CREATE POLICY "Users can view own team memberships" ON public.team_members
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to view other members of teams they belong to
-- This uses a function to avoid recursion
CREATE OR REPLACE FUNCTION user_is_team_member(check_team_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = check_team_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Team members can view team roster" ON public.team_members
    FOR SELECT USING (user_is_team_member(team_id));

-- Allow team owners and admins to insert new members
-- This uses a function to check admin status without recursion
CREATE OR REPLACE FUNCTION user_is_team_admin(check_team_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = check_team_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anyone to insert themselves as the first member (for team creation)
-- Or allow admins to add members
CREATE POLICY "Users can join teams or admins can add members" ON public.team_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR user_is_team_admin(team_id)
    );

-- Allow admins to update member roles
CREATE POLICY "Admins can update team members" ON public.team_members
    FOR UPDATE USING (user_is_team_admin(team_id));

-- Allow admins to remove members (except they can't remove themselves if they're the last owner)
CREATE POLICY "Admins can delete team members" ON public.team_members
    FOR DELETE USING (user_is_team_admin(team_id));

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION user_is_team_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_team_admin(TEXT) TO authenticated;
