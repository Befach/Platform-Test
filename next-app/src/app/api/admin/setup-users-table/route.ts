import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the SQL to create the users table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create public.users table
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create index
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

        -- Create RLS policies
        CREATE POLICY "Users can view all user profiles"
            ON public.users FOR SELECT
            USING (true);

        CREATE POLICY "Users can update own profile"
            ON public.users FOR UPDATE
            USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile"
            ON public.users FOR INSERT
            WITH CHECK (auth.uid() = id);

        -- Create function to handle new user creation
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.users (id, email, name)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Drop existing trigger if exists
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

        -- Create trigger
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
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, public.users.name);
      `
    })

    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Users table created successfully',
      data
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
