import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import {
  Plus,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react'

interface WorkItem {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

interface ActivityFeedProps {
  workItems: WorkItem[]
}

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  completed: { icon: CheckCircle2, color: 'text-green-600' },
  in_progress: { icon: Clock, color: 'text-blue-600' },
  not_started: { icon: Circle, color: 'text-slate-400' },
  blocked: { icon: AlertCircle, color: 'text-red-600' },
  planning: { icon: Edit3, color: 'text-purple-600' },
  on_hold: { icon: AlertCircle, color: 'text-orange-600' },
  review: { icon: Edit3, color: 'text-yellow-600' },
  cancelled: { icon: AlertCircle, color: 'text-slate-600' },
}

function Circle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

export function ActivityFeed({ workItems }: ActivityFeedProps) {
  // Sort work items by updated_at (most recent first)
  const sortedItems = [...workItems]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10) // Show only last 10 items

  // Determine if item was recently created (within 5 minutes of created_at === updated_at)
  const isNewlyCreated = (item: WorkItem) => {
    const created = new Date(item.created_at).getTime()
    const updated = new Date(item.updated_at).getTime()
    return Math.abs(updated - created) < 5 * 60 * 1000 // 5 minutes
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates to workspace features
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Create features to see activity here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const isNew = isNewlyCreated(item)
              const statusInfo = STATUS_ICONS[item.status] || STATUS_ICONS.not_started
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isNew ? (
                      <Plus className="h-5 w-5 text-blue-600" />
                    ) : (
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      {isNew && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {isNew ? 'Created' : 'Updated'}{' '}
                        {formatDistanceToNow(new Date(item.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {!isNew && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {sortedItems.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Showing last {sortedItems.length} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
