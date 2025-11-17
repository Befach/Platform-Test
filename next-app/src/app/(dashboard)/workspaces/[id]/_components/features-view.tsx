'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Features</h2>
          <p className="text-muted-foreground">
            Manage your product features and roadmap items
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workItems?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statusCounts.in_progress}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statusCounts.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>On Hold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {statusCounts.on_hold}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>All Features</CardTitle>
          <CardDescription>
            Track and manage your product roadmap
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workItems && workItems.length > 0 ? (
            <FeaturesViewWrapper
              initialWorkItems={workItems}
              timelineItems={timelineItems || []}
              workspaceId={workspace.id}
              currentUserId={currentUserId}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">
                No features yet
              </h3>
              <p className="text-muted-foreground mb-4">
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
