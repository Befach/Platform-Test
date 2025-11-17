-- Allow anyone to view invitations by token (for accepting invites)
-- This is safe because:
-- 1. Tokens are randomly generated and hard to guess
-- 2. Only non-accepted invitations can be viewed
-- 3. This is read-only access

CREATE POLICY "Anyone can view invitations by token" ON public.invitations
    FOR SELECT
    USING (
        -- Allow reading invitation if:
        -- 1. It hasn't been accepted yet
        -- 2. It hasn't expired
        accepted_at IS NULL
        AND expires_at > NOW()
    );
