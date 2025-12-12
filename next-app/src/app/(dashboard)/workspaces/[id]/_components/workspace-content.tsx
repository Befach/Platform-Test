'use client';

import { DashboardView } from './dashboard-view';
import { WorkItemsView } from './work-items-view';
import { TimelineView } from './timeline-view';
import { MindMapView } from './mind-map-view';
import { DependenciesView } from './dependencies-view';
import { CanvasView } from './canvas-view';
import { SettingsView } from './settings-view';
import { TeamAnalyticsView } from './team-analytics-view';
import { ProductTasksView } from './product-tasks-view';
import { PermissionsProvider } from '@/providers/permissions-provider';
import type { Department } from '@/lib/types/department';
import { useEffect } from 'react';

interface WorkspaceContentProps {
  view: string;
  workspace: any;
  team: any;
  workItems: any[];
  timelineItems: any[];
  linkedItems: any[];
  mindMaps: any[];
  tags: any[];
  departments: Department[];
  teamSize: number;
  phaseDistribution: any;
  onboardingState: any;
  currentUserId: string;
  userEmail?: string;
  userName?: string;
}

export function WorkspaceContent({
  view,
  workspace,
  team,
  workItems,
  timelineItems,
  linkedItems,
  mindMaps,
  tags,
  departments,
  teamSize,
  phaseDistribution,
  onboardingState,
  currentUserId,
  userEmail,
  userName,
}: WorkspaceContentProps) {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix2',
        hypothesisId: 'H7',
        location: 'workspace-content.tsx:mount',
        message: 'WorkspaceContent mounted',
        data: {
          view,
          workspaceId: workspace?.id,
          teamId: workspace?.team_id,
          workItems: workItems?.length ?? null,
          timelineItems: timelineItems?.length ?? null,
          linkedItems: linkedItems?.length ?? null,
          mindMaps: mindMaps?.length ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }, [view, workspace, workItems, timelineItems, linkedItems, mindMaps])

  // Render content based on view parameter
  const renderView = () => {
    switch (view) {
      case 'dashboard':
      case 'overview':
        return (
          <DashboardView
            workspace={workspace}
            team={team}
            workItems={workItems}
            teamSize={teamSize}
            phaseDistribution={phaseDistribution}
            onboardingState={onboardingState}
          />
        );

      case 'work-items':
        return (
          <WorkItemsView
            workspace={workspace}
            team={team}
            workItems={workItems}
            timelineItems={timelineItems}
            linkedItems={linkedItems}
            tags={tags}
            currentUserId={currentUserId}
            userEmail={userEmail}
            userName={userName}
          />
        );

      case 'timeline':
        return (
          <TimelineView
            workspace={workspace}
            workItems={workItems}
            timelineItems={timelineItems}
            linkedItems={linkedItems}
            departments={departments}
            currentUserId={currentUserId}
          />
        );

      case 'canvas':
      case 'mind-map':
      case 'dependencies':
        return (
          <CanvasView
            workspace={workspace}
            workItems={workItems}
            linkedItems={linkedItems}
          />
        );

      case 'settings':
        return (
          <SettingsView
            workspace={workspace}
            team={team}
            currentUserId={currentUserId}
          />
        );

      case 'team-analytics':
        return (
          <TeamAnalyticsView
            workspace={workspace}
          />
        );

      case 'product-tasks':
        return (
          <ProductTasksView
            workspace={workspace}
          />
        );

      default:
        return (
          <DashboardView
            workspace={workspace}
            team={team}
            workItems={workItems}
            teamSize={teamSize}
            phaseDistribution={phaseDistribution}
            onboardingState={onboardingState}
          />
        );
    }
  };

  return (
    <PermissionsProvider
      workspaceId={workspace.id}
      teamId={workspace.team_id}
    >
      <div className="flex-1 overflow-auto">
        {/* View-specific content */}
        <main className="px-8 py-6">
          {renderView()}
        </main>
      </div>
    </PermissionsProvider>
  );
}
