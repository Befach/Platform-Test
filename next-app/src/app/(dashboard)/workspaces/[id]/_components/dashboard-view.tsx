'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceStatsGrid } from '@/components/workspaces/workspace-stats-grid';
import { MultiPhaseProgressBar } from '@/components/workspaces/multi-phase-progress-bar';
import { ActivityFeed } from '@/components/workspaces/activity-feed';
import { ContextualOnboarding } from './contextual-onboarding';

interface DashboardViewProps {
  workspace: any;
  team: any;
  workItems: any[];
  teamSize: number;
  phaseDistribution: any;
  onboardingState: any;
}

export function DashboardView({
  workspace,
  team,
  workItems,
  teamSize,
  phaseDistribution,
  onboardingState,
}: DashboardViewProps) {
  // Calculate stats
  const totalFeatures = workItems?.length || 0;
  const completedFeatures = workItems?.filter((item) => item.status === 'completed').length || 0;
  const inProgressFeatures = workItems?.filter((item) => item.status === 'in_progress').length || 0;
  const completionPercentage = totalFeatures > 0
    ? Math.round((completedFeatures / totalFeatures) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <WorkspaceStatsGrid
        totalFeatures={totalFeatures}
        completedFeatures={completedFeatures}
        inProgressFeatures={inProgressFeatures}
        completionPercentage={completionPercentage}
        teamSize={teamSize}
      />

      {/* Multi-Phase Progress Bar */}
      <MultiPhaseProgressBar
        distribution={phaseDistribution}
        totalItems={totalFeatures}
      />

      {/* Description */}
      {workspace.description && (
        <Card>
          <CardHeader>
            <CardTitle>About this Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{workspace.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Contextual Onboarding + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Contextual Onboarding (2/3 width) */}
        <div className="lg:col-span-2">
          <ContextualOnboarding
            workspaceId={workspace.id}
            onboardingState={onboardingState}
          />
        </div>

        {/* Right Column: Activity Feed (1/3 width) */}
        <div className="lg:col-span-1">
          <ActivityFeed workItems={workItems || []} />
        </div>
      </div>
    </div>
  );
}
