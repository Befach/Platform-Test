import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton Supabase client for client-side (browser) usage
 *
 * Why singleton?
 * - Prevents multiple WebSocket connections per page
 * - Ensures realtime subscriptions share one connection pool
 * - Reduces memory overhead from duplicate clients
 * - Required for subscription deduplication to work correctly
 *
 * This client automatically handles cookies and auth state.
 */
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: Always create a new client (SSR safety)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Client-side: Return singleton instance
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return browserClient
}

/**
 * Reset the singleton client. Must be called explicitly on logout.
 * Synchronous and race-free - no callbacks, no deferred operations.
 */
export function resetClient(): void {
  browserClient = null
}
