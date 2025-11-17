'use client';

import { DashboardView } from './dashboard-view';
import { FeaturesView } from './features-view';
import { TimelineView } from './timeline-view';
import { MindMapView } from './mind-map-view';
import { DependenciesView } from './dependencies-view';
import { SettingsView } from './settings-view';
import { TeamAnalyticsView } from './team-analytics-view';

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

      case 'mind-map':
        return (
          <MindMapView
            workspace={workspace}
            mindMaps={mindMaps}
            currentUserId={currentUserId}
          />
        );

      case 'dependencies':
        return (
          <DependenciesView
            workspace={workspace}
            workItems={workItems}
            timelineItems={timelineItems}
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
      {/* Header remains consistent across views */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">{team?.name}</p>
          </div>
          {/* View breadcrumb or actions can go here */}
        </div>
      </header>

      {/* View-specific content */}
      <main className="px-8 py-6">
        {renderView()}
      </main>
    </div>
  );
}
