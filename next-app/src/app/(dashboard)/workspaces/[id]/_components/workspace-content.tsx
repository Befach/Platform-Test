'use client';

import { DashboardView } from './dashboard-view';
import { WorkItemsView } from './work-items-view';
import { TimelineView } from './timeline-view';
import { CanvasView } from './canvas-view';
import { SettingsView } from './settings-view';
import { TeamAnalyticsView } from './team-analytics-view';
import { ProductTasksView } from './product-tasks-view';
import { PermissionsProvider } from '@/providers/permissions-provider';
import type { Department } from '@/lib/types/department';
import type { Team } from '@/lib/types/team';
import type { Database } from '@/lib/supabase/types';

/** Work Item with status field (extended from DB type for component compatibility) */
interface WorkItem {
  id: string;
  name: string;
  type: string;
  status: string;
  phase?: string | null;
  priority?: string | null;
  owner?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

/** Timeline Item with title field (extended from DB type) */
interface TimelineItem {
  id: string;
  work_item_id: string;
  title: string;
  name?: string;
  description?: string | null;
  timeline: string;
  phase?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

/** Linked Item with normalized fields */
interface LinkedItem {
  id: string;
  source_item_id?: string;
  target_item_id?: string;
  source_id: string;
  target_id: string;
  relationship_type?: string;
  link_type?: string;
  team_id?: string;
  [key: string]: unknown;
}

/** Workspace row from the database */
type Workspace = Database['public']['Tables']['workspaces']['Row'];

/** Tag type for workspace content */
interface Tag {
  id: string;
  name: string;
  color?: string;
}

/** Phase distribution for dashboard display (new 4-phase system) */
interface PhaseDistribution {
  design: { count: number; percentage: number };
  build: { count: number; percentage: number };
  refine: { count: number; percentage: number };
  launch: { count: number; percentage: number };
}

/** Onboarding state structure (contextual onboarding format) */
interface OnboardingState {
  hasWorkItems: boolean;
  hasMindMaps: boolean;
  hasTimeline: boolean;
  hasDependencies: boolean;
  teamSize: number;
  completionPercentage: number;
}

interface WorkspaceContentProps {
  view: string;
  workspace: Workspace;
  team: Team;
  workItems: WorkItem[];
  timelineItems: TimelineItem[];
  linkedItems: LinkedItem[];
  tags: Tag[];
  departments: Department[];
  teamSize: number;
  phaseDistribution: PhaseDistribution;
  onboardingState: OnboardingState;
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
  tags,
  departments,
  teamSize,
  phaseDistribution,
  onboardingState,
  currentUserId,
  userEmail,
  userName,
}: WorkspaceContentProps) {
  // Normalize work items for child components (add phase fallback)
  const normalizedWorkItems = workItems.map(item => ({
    ...item,
    phase: item.phase ?? 'design',
    priority: item.priority ?? undefined,
  }));

  // Normalize timeline items for child components
  const normalizedTimelineItems = timelineItems.map(item => ({
    ...item,
    description: item.description ?? null,
  }));

  // Normalize linked items for child components
  const normalizedLinkedItems = linkedItems.map(item => ({
    ...item,
    source_id: item.source_id || item.source_item_id || '',
    target_id: item.target_id || item.target_item_id || '',
  }));

  // Normalize workspace for child components
  const normalizedWorkspace = {
    ...workspace,
    phase: workspace.phase ?? 'development',
  };

  // Render content based on view parameter
  const renderView = () => {
    switch (view) {
      case 'dashboard':
      case 'overview':
        return (
          <DashboardView
            workspace={workspace}
            team={team}
            workItems={normalizedWorkItems as Parameters<typeof DashboardView>[0]['workItems']}
            teamSize={teamSize}
            phaseDistribution={phaseDistribution}
            onboardingState={onboardingState}
          />
        );

      case 'work-items':
        return (
          <WorkItemsView
            workspace={workspace as Parameters<typeof WorkItemsView>[0]['workspace']}
            team={team as unknown as Parameters<typeof WorkItemsView>[0]['team']}
            workItems={workItems as Parameters<typeof WorkItemsView>[0]['workItems']}
            timelineItems={normalizedTimelineItems as Parameters<typeof WorkItemsView>[0]['timelineItems']}
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
            workspace={workspace as Parameters<typeof TimelineView>[0]['workspace']}
            workItems={workItems as Parameters<typeof TimelineView>[0]['workItems']}
            timelineItems={timelineItems as Parameters<typeof TimelineView>[0]['timelineItems']}
            linkedItems={linkedItems as Parameters<typeof TimelineView>[0]['linkedItems']}
            departments={departments}
            currentUserId={currentUserId}
          />
        );

      case 'canvas':
      case 'mind-map':
      case 'dependencies':
        return (
          <CanvasView
            workspace={workspace as Parameters<typeof CanvasView>[0]['workspace']}
            workItems={workItems as Parameters<typeof CanvasView>[0]['workItems']}
            linkedItems={normalizedLinkedItems as Parameters<typeof CanvasView>[0]['linkedItems']}
          />
        );

      case 'settings':
        return (
          <SettingsView
            workspace={normalizedWorkspace as Parameters<typeof SettingsView>[0]['workspace']}
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
            workItems={normalizedWorkItems as Parameters<typeof DashboardView>[0]['workItems']}
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
