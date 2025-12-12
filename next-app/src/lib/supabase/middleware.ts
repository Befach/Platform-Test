import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93'

async function sendDebug(payload: {
  sessionId?: string
  runId?: string
  hypothesisId?: string
  location: string
  message: string
  data?: Record<string, unknown>
  timestamp?: number
}) {
  const body = {
    sessionId: 'debug-session',
    runId: 'pre-fix2',
    timestamp: Date.now(),
    ...payload,
  }

  try {
    await fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // Swallow; Edge runtime has no fs fallback
  }
}

/**
 * Create a Supabase client for middleware usage
 * This handles refreshing auth tokens and maintaining user sessions
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H9',
    location: 'supabase/middleware:updateSession:getUser',
    message: 'updateSession user check',
    data: {
      hasUser: !!user,
      cookies: request.cookies.getAll().map((c) => c.name),
    },
  })
  // #endregion

  // Protected routes - redirect to login if not authenticated
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/workspaces') ||
                          request.nextUrl.pathname.startsWith('/teams')

  if (!user && isProtectedRoute) {
    // No user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // User is logged in but on auth page, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
