import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix2',
      hypothesisId: 'H9',
      location: 'middleware.ts:entry',
      message: 'Middleware hit',
      data: {
        path: request.nextUrl.pathname,
        method: request.method,
        hasAccessToken: request.cookies.has('sb-access-token'),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
