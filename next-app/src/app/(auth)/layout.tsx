import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated and not on onboarding, redirect to dashboard
  if (user) {
    // Check if they're on the onboarding page
    // If they are, let them through to complete setup
    // This will be handled by the onboarding page itself
  }

  return <>{children}</>
}
