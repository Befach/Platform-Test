import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side (browser) usage
 * This client automatically handles cookies and auth state
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
