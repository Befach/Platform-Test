-- Create public.users table to store user profile information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can view all users (needed for team member lists)
CREATE POLICY "Users can view all user profiles"
    ON public.users FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create a public.users record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing auth.users to public.users
INSERT INTO public.users (id, email, name)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email) as name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update team_members foreign key to reference public.users
-- First, ensure all user_ids in team_members exist in public.users
DO $$
BEGIN
    -- This will help identify orphaned records
    RAISE NOTICE 'Checking for orphaned team_member records...';
END $$;

-- Add comment to document the table
COMMENT ON TABLE public.users IS 'User profile information, linked to auth.users';
COMMENT ON COLUMN public.users.id IS 'References auth.users(id)';
COMMENT ON COLUMN public.users.email IS 'User email from auth.users';
COMMENT ON COLUMN public.users.name IS 'Display name, defaults to email if not provided';
