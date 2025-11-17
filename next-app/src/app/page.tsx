import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Product Lifecycle Platform</h1>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Manage Your Product Roadmap with Confidence
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern, multi-tenant SaaS platform for managing product roadmaps with phase-based workflows, mind mapping, and AI-powered features.
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">Mind Mapping</h3>
              <p className="text-muted-foreground">
                Visual canvas for brainstorming and planning your product features
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Phase-Based Workflow</h3>
              <p className="text-muted-foreground">
                Track progress from research to execution with structured phases
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">
                Smart suggestions, risk analysis, and automated documentation
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold mb-4">Simple, Transparent Pricing</h3>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-muted-foreground">Free Tier</div>
                <div className="text-4xl font-bold my-2">$0</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>5 team members</li>
                  <li>50 AI messages/month</li>
                  <li>Basic features</li>
                </ul>
              </div>
              <div className="text-center border-2 border-blue-600 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">
                  POPULAR
                </div>
                <div className="text-lg font-semibold text-muted-foreground">Pro</div>
                <div className="text-4xl font-bold my-2">$40</div>
                <div className="text-sm text-muted-foreground mb-4">+ $5/user/month</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Unlimited team members</li>
                  <li>1,000 AI messages per user</li>
                  <li>All features unlocked</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>
            <Link href="/signup">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Product Lifecycle Platform. Built with Next.js, Supabase, and modern web technologies.</p>
        </div>
      </footer>
    </div>
  )
}
