import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      // Still redirect even on error - user intent is to logout
    }

    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Sign out failed:', error)
    // Redirect anyway since user wants to logout
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export async function POST(request: Request) {
  return GET(request)
}
