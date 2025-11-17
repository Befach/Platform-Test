'use client';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { CreateFeatureDialog } from '@/components/features/create-feature-dialog';
import { FeaturesViewWrapper } from '@/components/features/features-view-wrapper';

interface FeaturesViewProps {
  workspace: any;
  team: any;
  workItems: any[];
  timelineItems: any[];
  linkedItems: any[];
  tags: any[];
  currentUserId: string;
}

export function FeaturesView({
  workspace,
  team,
  workItems,
  timelineItems,
  linkedItems,
  tags,
  currentUserId,
}: FeaturesViewProps) {
  // Get feature counts by status
  const statusCounts = {
    planned: workItems?.filter((f) => f.status === 'planned').length || 0,
    in_progress: workItems?.filter((f) => f.status === 'in_progress').length || 0,
    completed: workItems?.filter((f) => f.status === 'completed').length || 0,
    on_hold: workItems?.filter((f) => f.status === 'on_hold').length || 0,
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header with Create Button */}
      <div className="flex items-start justify-between gap-6 pb-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Work Board</h2>
          <p className="text-muted-foreground text-base">
            Track and manage all your product work items
          </p>
        </div>
        <CreateFeatureDialog
          workspaceId={workspace.id}
          teamId={workspace.team_id}
          currentUserId={currentUserId}
          workspacePhase={workspace.phase}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-6">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <CardDescription className="text-sm font-medium">
              Total Work Items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums tracking-tight">
              {workItems?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-4">
            <CardDescription className="text-sm font-medium">
              In Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums tracking-tight text-blue-600">
              {statusCounts.in_progress}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500/50 transition-colors">
          <CardHeader className="pb-4">
            <CardDescription className="text-sm font-medium">
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums tracking-tight text-green-600">
              {statusCounts.completed}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-500/50 transition-colors">
          <CardHeader className="pb-4">
            <CardDescription className="text-sm font-medium">
              On Hold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums tracking-tight text-orange-600">
              {statusCounts.on_hold}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Items List */}
      <Card className="border-2">
        <CardContent className="p-0">
          {workItems && workItems.length > 0 ? (
            <div className="p-6">
              <FeaturesViewWrapper
                initialWorkItems={workItems}
                timelineItems={timelineItems || []}
                workspaceId={workspace.id}
                currentUserId={currentUserId}
              />
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="text-7xl mb-6">📋</div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">
                No work items yet
              </h3>
              <p className="text-muted-foreground text-base mb-6 max-w-md mx-auto">
                Get started by creating your first work item
              </p>
              <CreateFeatureDialog
                workspaceId={workspace.id}
                teamId={workspace.team_id}
                currentUserId={currentUserId}
                workspacePhase={workspace.phase}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
