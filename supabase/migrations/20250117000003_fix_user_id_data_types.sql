-- Fix user_id data types in user_phase_assignments table
-- This migration changes TEXT to UUID to match auth.users table
-- Created: 2025-01-17

-- Step 1: Drop existing foreign key constraints
ALTER TABLE user_phase_assignments
  DROP CONSTRAINT IF EXISTS user_phase_assignments_user_id_fkey;

ALTER TABLE user_phase_assignments
  DROP CONSTRAINT IF EXISTS user_phase_assignments_assigned_by_fkey;

-- Step 2: Change user_id from TEXT to UUID
-- Note: This assumes existing IDs are valid UUIDs or can be cast
ALTER TABLE user_phase_assignments
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Step 3: Change assigned_by from TEXT to UUID (can be NULL)
ALTER TABLE user_phase_assignments
  ALTER COLUMN assigned_by TYPE UUID USING
    CASE
      WHEN assigned_by IS NULL OR assigned_by = '' THEN NULL
      ELSE assigned_by::uuid
    END;

-- Step 4: Re-add foreign key constraints with proper CASCADE behavior
ALTER TABLE user_phase_assignments
  ADD CONSTRAINT user_phase_assignments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE user_phase_assignments
  ADD CONSTRAINT user_phase_assignments_assigned_by_fkey
    FOREIGN KEY (assigned_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_phase_assignments_user_id
  ON user_phase_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_phase_assignments_assigned_by
  ON user_phase_assignments(assigned_by);

-- Add comment
COMMENT ON COLUMN user_phase_assignments.user_id IS
  'User ID (UUID) - references auth.users(id). Changed from TEXT to UUID for type safety.';

COMMENT ON COLUMN user_phase_assignments.assigned_by IS
  'User ID who assigned this phase (UUID) - references auth.users(id). Can be NULL.';
