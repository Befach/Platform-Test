'use client';

import { DashboardView } from './dashboard-view';
import { FeaturesView } from './features-view';
import { TimelineView } from './timeline-view';
import { MindMapView } from './mind-map-view';
import { DependenciesView } from './dependencies-view';
import { CanvasView } from './canvas-view';
import { SettingsView } from './settings-view';
import { TeamAnalyticsView } from './team-analytics-view';
import { ProductTasksView } from './product-tasks-view';

interface WorkspaceContentProps {
  view: string;
  workspace: any;
  team: any;
  workItems: any[];
  timelineItems: any[];
  linkedItems: any[];
  mindMaps: any[];
  tags: any[];
  teamSize: number;
  phaseDistribution: any;
  onboardingState: any;
  currentUserId: string;
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
  teamSize,
  phaseDistribution,
  onboardingState,
  currentUserId,
}: WorkspaceContentProps) {
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

      case 'features':
        return (
          <FeaturesView
            workspace={workspace}
            team={team}
            workItems={workItems}
            timelineItems={timelineItems}
            linkedItems={linkedItems}
            tags={tags}
            currentUserId={currentUserId}
          />
        );

      case 'timeline':
        return (
          <TimelineView
            workspace={workspace}
            workItems={workItems}
            timelineItems={timelineItems}
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
    <div className="flex-1 overflow-auto">
      {/* View-specific content */}
      <main className="px-8 py-6">
        {renderView()}
      </main>
    </div>
  );
}
