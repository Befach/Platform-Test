import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { CreateTimelineItemDialog } from '@/components/features/create-timeline-item-dialog'
import { TimelineItemsList } from '@/components/features/timeline-items-list'
import { FeatureEditButton } from '@/components/features/feature-edit-button'

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string; featureId: string }>
}) {
  const { id: workspaceId, featureId } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get work item details with workspace phase
  const { data: feature, error: featureError } = await supabase
    .from('work_items')
    .select(`
      *,
      workspace:workspace_id (
        id,
        name,
        icon,
        phase,
        team_id,
        teams:team_id (
          id,
          name
        )
      ),
      assigned_to_user:assigned_to (
        id,
        name,
        email
      ),
      created_by_user:created_by (
        id,
        name,
        email
      )
    `)
    .eq('id', featureId)
    .single()

  if (featureError || !feature) {
    notFound()
  }

  // Check if user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', feature.workspace.team_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Get timeline items
  const { data: timelineItems } = await supabase
    .from('timeline_items')
    .select('*')
    .eq('work_item_id', featureId)
    .order('order_index', { ascending: true })

  // Group timeline items by timeline
  const mvpItems = timelineItems?.filter((item) => item.timeline === 'MVP') || []
  const shortItems = timelineItems?.filter((item) => item.timeline === 'SHORT') || []
  const longItems = timelineItems?.filter((item) => item.timeline === 'LONG') || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/workspaces/${workspaceId}/features`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Features
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{feature.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {feature.workspace.icon} {feature.workspace.name} • {feature.workspace.teams.name}
                </p>
              </div>
            </div>
            <FeatureEditButton
              featureId={featureId}
              workspaceId={workspaceId}
              phase={feature.workspace.phase}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Feature Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Feature Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground">
                  {feature.description || 'No description provided'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={getStatusColor(feature.status)}
                  variant="outline"
                >
                  {feature.status.replace('_', ' ')}
                </Badge>
                <Badge
                  className={getPriorityColor(feature.priority)}
                  variant="outline"
                >
                  {feature.priority}
                </Badge>
                {feature.assigned_to_user && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Assigned: {feature.assigned_to_user.name || feature.assigned_to_user.email}
                  </Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Created by {feature.created_by_user.name || feature.created_by_user.email} on{' '}
                {new Date(feature.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Items */}
        <div className="space-y-6">
          {/* MVP Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>🎯 MVP Timeline</CardTitle>
                <CardDescription>
                  Minimum Viable Product - Core features needed for launch
                </CardDescription>
              </div>
              <CreateTimelineItemDialog
                featureId={featureId}
                timeline="MVP"
                orderIndex={mvpItems.length}
              />
            </CardHeader>
            <CardContent>
              {mvpItems.length > 0 ? (
                <TimelineItemsList items={mvpItems} featureId={featureId} workspaceId={workspaceId} teamId={feature.workspace.team_id} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No MVP items yet. Add your first core feature!
                </div>
              )}
            </CardContent>
          </Card>

          {/* SHORT Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>⚡ Short Term Timeline</CardTitle>
                <CardDescription>
                  Features planned for the near future (1-3 months)
                </CardDescription>
              </div>
              <CreateTimelineItemDialog
                featureId={featureId}
                timeline="SHORT"
                orderIndex={shortItems.length}
              />
            </CardHeader>
            <CardContent>
              {shortItems.length > 0 ? (
                <TimelineItemsList items={shortItems} featureId={featureId} workspaceId={workspaceId} teamId={feature.workspace.team_id} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No short-term items yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* LONG Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>🔮 Long Term Timeline</CardTitle>
                <CardDescription>
                  Future enhancements and aspirational features
                </CardDescription>
              </div>
              <CreateTimelineItemDialog
                featureId={featureId}
                timeline="LONG"
                orderIndex={longItems.length}
              />
            </CardHeader>
            <CardContent>
              {longItems.length > 0 ? (
                <TimelineItemsList items={longItems} featureId={featureId} workspaceId={workspaceId} teamId={feature.workspace.team_id} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No long-term items yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
