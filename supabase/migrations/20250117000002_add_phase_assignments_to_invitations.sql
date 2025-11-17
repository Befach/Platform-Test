-- Add phase_assignments column to invitations table
-- This stores which phases the invited user will have access to
-- Created: 2025-01-17

-- Add JSONB column for phase assignments
ALTER TABLE invitations
ADD COLUMN phase_assignments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN invitations.phase_assignments IS
'Array of phase assignments for the invited user. Format: [{ workspace_id, phase, can_edit }]';

-- Create index for faster queries
CREATE INDEX idx_invitations_phase_assignments
ON invitations USING gin (phase_assignments);

-- Example phase_assignments structure:
-- [
--   {
--     "workspace_id": "workspace_1234567890",
--     "phase": "planning",
--     "can_edit": true
--   },
--   {
--     "workspace_id": "workspace_1234567890",
--     "phase": "execution",
--     "can_edit": true
--   }
-- ]
