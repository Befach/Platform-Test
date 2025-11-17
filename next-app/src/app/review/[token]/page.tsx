import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PublicReviewPageClient } from './review-client'

export default async function PublicReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Fetch review link by token (no auth required - public access)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/review-links/by-token/${token}`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔗</div>
            <h1 className="text-2xl font-bold">Review Link Not Found</h1>
            <p className="text-muted-foreground">
              {response.status === 410
                ? 'This review link has expired'
                : 'This review link is not valid or has been deactivated'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Error Loading Review</h1>
          <p className="text-muted-foreground">
            An error occurred while loading this review page
          </p>
        </div>
      </div>
    )
  }

  const reviewData = await response.json()

  return (
    <PublicReviewPageClient
      reviewLink={reviewData}
      workItems={reviewData.work_items || []}
      workspace={reviewData.workspaces}
    />
  )
}
