'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Map, FileText, Calendar, GitBranch, MessageSquare, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PHASE_CONFIG } from '@/lib/constants/workspace-phases';
import { cn } from '@/lib/utils';

interface OnboardingState {
  hasWorkItems: boolean;
  hasMindMaps: boolean;
  hasTimeline: boolean;
  hasDependencies: boolean;
  teamSize: number;
  completionPercentage: number;
}

interface ContextualOnboardingProps {
  workspaceId: string;
  onboardingState: OnboardingState;
}

interface GuidanceAction {
  icon: React.ElementType;
  label: string;
  view: string;
  primary?: boolean;
  comingSoon?: boolean;
}

interface Guidance {
  phase: 'research' | 'planning' | 'execution' | 'review' | 'complete';
  title: string;
  actions: GuidanceAction[];
  tip: string | null;
}

function getContextualGuidance(state: OnboardingState): Guidance {
  // No work items at all → Research phase guidance
  if (!state.hasWorkItems && !state.hasMindMaps) {
    return {
      phase: 'research',
      title: 'Start brainstorming',
      actions: [
        { icon: Map, label: 'Create Mind Map', view: 'mind-map', primary: true },
        { icon: FileText, label: 'Add First Feature', view: 'features' },
      ],
      tip: 'Use the mind map to explore ideas visually before structuring them into features.',
    };
  }

  // Has mind maps but few work items → Planning phase guidance
  if (state.hasMindMaps && state.hasWorkItems && !state.hasTimeline) {
    return {
      phase: 'planning',
      title: 'Structure your features',
      actions: [
        { icon: FileText, label: 'View Features', view: 'features', primary: true },
        { icon: Calendar, label: 'Create Timeline', view: 'features' },
      ],
      tip: 'Break features into MVP, SHORT, and LONG phases to prioritize delivery.',
    };
  }

  // Has timeline but no dependencies → Planning phase guidance
  if (state.hasTimeline && !state.hasDependencies) {
    return {
      phase: 'planning',
      title: 'Map dependencies',
      actions: [
        { icon: GitBranch, label: 'Add Dependencies', view: 'dependencies', primary: true },
        { icon: Calendar, label: 'View Timeline', view: 'timeline' },
      ],
      tip: 'Identify which features depend on others to optimize your execution plan.',
    };
  }

  // Active work in progress → Execution phase guidance
  if (state.completionPercentage > 0 && state.completionPercentage < 75) {
    return {
      phase: 'execution',
      title: 'Track progress',
      actions: [
        { icon: Calendar, label: 'View Timeline', view: 'timeline', primary: true },
        { icon: FileText, label: 'Update Features', view: 'features' },
      ],
      tip: 'Keep your team aligned by updating feature statuses and tracking milestones.',
    };
  }

  // Near completion → Review phase guidance
  if (state.completionPercentage >= 75) {
    return {
      phase: 'review',
      title: 'Finalize and review',
      actions: [
        { icon: MessageSquare, label: 'Get Feedback', view: 'review', comingSoon: true },
        { icon: BarChart3, label: 'View Analytics', view: 'analytics', comingSoon: true },
      ],
      tip: 'Gather stakeholder feedback before launching your product.',
    };
  }

  // Has all basics → Execution phase guidance
  if (state.hasWorkItems && state.hasTimeline && state.hasDependencies) {
    return {
      phase: 'execution',
      title: 'Execute your plan',
      actions: [
        { icon: Calendar, label: 'View Timeline', view: 'timeline', primary: true },
        { icon: GitBranch, label: 'Review Dependencies', view: 'dependencies' },
      ],
      tip: 'Use the timeline and dependencies to coordinate your team\'s work.',
    };
  }

  // Default fallback
  return {
    phase: 'planning',
    title: 'Quick actions',
    actions: [
      { icon: FileText, label: 'Features', view: 'features', primary: true },
      { icon: Map, label: 'Mind Map', view: 'mind-map' },
    ],
    tip: null,
  };
}

export function ContextualOnboarding({ workspaceId, onboardingState }: ContextualOnboardingProps) {
  const router = useRouter();
  const guidance = getContextualGuidance(onboardingState);
  const phaseConfig = PHASE_CONFIG[guidance.phase];

  const navigateToView = (view: string) => {
    router.push(`/workspaces/${workspaceId}?view=${view}`);
  };

  return (
    <Card className={cn('border-2', phaseConfig.borderColor)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{phaseConfig.icon}</span>
            <div>
              <CardTitle className="flex items-center gap-2">
                {guidance.title}
                <Badge variant="outline" className={phaseConfig.textColor}>
                  {phaseConfig.name}
                </Badge>
              </CardTitle>
              <CardDescription>
                Next steps to move your project forward
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          {guidance.actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.view}
                variant={action.primary ? 'default' : 'outline'}
                size="lg"
                onClick={() => navigateToView(action.view)}
                disabled={action.comingSoon}
                className="justify-start gap-3 h-auto py-4"
              >
                <ActionIcon className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">{action.label}</div>
                  {action.comingSoon && (
                    <div className="text-xs opacity-60">Coming Soon</div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Contextual Tip */}
        {guidance.tip && (
          <div className={cn('rounded-lg p-3 flex gap-3', phaseConfig.bgColor, 'bg-opacity-10')}>
            <Lightbulb className={cn('h-5 w-5 shrink-0', phaseConfig.textColor)} />
            <p className="text-sm">{guidance.tip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
