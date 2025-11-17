'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check, AlertCircle } from 'lucide-react'

export default function SetupUsersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const setupUsersTable = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup-users-table', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to setup users table')
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to setup users table')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Setup Public Users Table</CardTitle>
          <CardDescription>
            This will create the public.users table and migrate existing auth.users data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">What this does:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Creates public.users table linked to auth.users</li>
              <li>Adds email and name fields for display</li>
              <li>Sets up RLS policies for secure access</li>
              <li>Creates automatic trigger for new user signup</li>
              <li>Migrates existing auth.users to public.users</li>
            </ul>
          </div>

          <Button
            onClick={setupUsersTable}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up users table...
              </>
            ) : (
              'Setup Users Table'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Error:</p>
                <p className="text-red-700 text-sm">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  You may need to run this SQL directly in the Supabase dashboard.
                </p>
              </div>
            </div>
          )}

          {result && result.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Success!</p>
                <p className="text-green-700 text-sm">{result.message}</p>
                <p className="text-xs text-green-600 mt-2">
                  Team member names should now display correctly.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Manual Setup (if button doesn't work):</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Go to your Supabase dashboard → SQL Editor and run:
            </p>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
{`-- Copy this entire block into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view all user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.users (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', email) as name FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, public.users.name);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
