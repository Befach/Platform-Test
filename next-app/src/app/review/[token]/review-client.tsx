'use client'

import { useState } from 'react'
import { MessageCircle, Calendar, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from './feedback-dialog'
import { getItemIcon } from '@/lib/constants/work-item-types'

interface WorkItem {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  priority: string
  timeline_phase: string | null
  created_at: string
}

interface PublicReviewPageClientProps {
  reviewLink: any
  workItems: WorkItem[]
  workspace: {
    id: string
    name: string
    description: string | null
  }
}

export function PublicReviewPageClient({
  reviewLink,
  workItems,
  workspace,
}: PublicReviewPageClientProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null)

  const openFeedbackDialog = (workItem: WorkItem) => {
    setSelectedWorkItem(workItem)
    setFeedbackDialogOpen(true)
  }

  const getTimelineColor = (phase: string | null) => {
    switch (phase) {
      case 'MVP':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'SHORT':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'LONG':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
              {workspace.description && (
                <p className="text-muted-foreground mt-1">{workspace.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 border-blue-200">
                {reviewLink.type === 'public' && '🌐 Public Review'}
                {reviewLink.type === 'invite' && '✉️ Invited Review'}
                {reviewLink.type === 'embed' && '📦 Embedded Review'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle>Welcome to our Product Review</CardTitle>
            <CardDescription className="text-base">
              We value your feedback! Please review the features below and share your thoughts.
              Your input helps us build better products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{workItems.length} Features to Review</span>
              </div>
              {reviewLink.expires_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>
                    Valid until {new Date(reviewLink.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Items Grid */}
        {workItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No Features Available</h3>
              <p className="text-muted-foreground">
                There are currently no features available for review
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workItems.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{getItemIcon(item.type)}</span>
                    {item.timeline_phase && (
                      <Badge variant="outline" className={getTimelineColor(item.timeline_phase)}>
                        {item.timeline_phase}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.description && (
                    <CardDescription className="line-clamp-3">
                      {item.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Feedback Button */}
                  <Button
                    onClick={() => openFeedbackDialog(item)}
                    className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    variant="outline"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Leave Feedback
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Thank you for taking the time to review our features. Your feedback is invaluable to
            us!
          </p>
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        workItem={selectedWorkItem}
        reviewLinkId={reviewLink.id}
      />
    </div>
  )
}
