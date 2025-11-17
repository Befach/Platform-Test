'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkspaceSwitcher } from '@/components/workspaces/workspace-switcher';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  GitBranch,
  Home,
  Lock,
  Map,
  MessageSquare,
  Search,
  Settings,
  Target,
  Users,
  Calendar,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
  team_id: string;
  teams?: {
    subscription_plan: 'free' | 'pro' | 'enterprise';
  };
}

interface WorkspaceSidebarProps {
  workspaceId: string;
  workspaceName: string;
  teamPlan: 'free' | 'pro' | 'enterprise';
  enabledModules: string[];
  currentView?: string;
  workspaces: Workspace[];
}

interface NavSection {
  id: string;
  name: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavItem {
  id: string;
  name: string;
  view: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  requiresPro?: boolean;
  enabled: boolean;
}

export function WorkspaceSidebar({
  workspaceId,
  workspaceName,
  teamPlan,
  enabledModules,
  currentView = 'dashboard',
  workspaces,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['work-items']);
  const [sidebarBehavior, setSidebarBehavior] = useState<'expanded' | 'collapsed' | 'hover'>('expanded');
  const [isHovering, setIsHovering] = useState(false);

  const activeView = currentView || searchParams?.get('view') || 'dashboard';

  // Load sidebar behavior and collapsed state from localStorage
  useEffect(() => {
    const behavior = localStorage.getItem('workspace-sidebar-behavior') as 'expanded' | 'collapsed' | 'hover';
    const savedCollapsed = localStorage.getItem('workspace-sidebar-collapsed');

    if (behavior) {
      setSidebarBehavior(behavior);

      // Set initial collapsed state based on behavior
      if (behavior === 'collapsed' || behavior === 'hover') {
        setCollapsed(true);
      } else if (behavior === 'expanded') {
        setCollapsed(false);
      }
    } else if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Determine if sidebar should be expanded based on hover behavior
  const shouldBeExpanded = sidebarBehavior === 'hover' ? isHovering : !collapsed;

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('workspace-sidebar-collapsed', JSON.stringify(newState));
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Define navigation structure (workflow-focused, not module-focused)
  const navSections: NavSection[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Home,
      items: [
        {
          id: 'dashboard',
          name: 'Dashboard',
          view: 'dashboard',
          icon: Home,
          enabled: true,
        },
      ],
    },
    {
      id: 'work-items',
      name: 'Work Items',
      icon: Target,
      items: [
        {
          id: 'mind-map',
          name: 'Mind Map',
          view: 'mind-map',
          icon: Map,
          enabled: enabledModules.includes('mind_map'),
        },
        {
          id: 'features',
          name: 'Work Board',
          view: 'features',
          icon: FileText,
          enabled: enabledModules.includes('features'),
        },
        {
          id: 'timeline',
          name: 'Timeline',
          view: 'timeline',
          icon: Calendar,
          enabled: enabledModules.includes('timeline'),
        },
        {
          id: 'dependencies',
          name: 'Dependencies',
          view: 'dependencies',
          icon: GitBranch,
          enabled: enabledModules.includes('dependencies'),
        },
      ],
    },
    {
      id: 'collaboration',
      name: 'Collaboration',
      icon: Users,
      items: [
        {
          id: 'team-analytics',
          name: 'Team Analytics',
          view: 'team-analytics',
          icon: Users,
          enabled: true,
        },
        {
          id: 'review',
          name: 'Review & Feedback',
          view: 'review',
          icon: MessageSquare,
          comingSoon: true,
          requiresPro: true,
          enabled: enabledModules.includes('review'),
        },
        {
          id: 'execution',
          name: 'Team Activity',
          view: 'execution',
          icon: Users,
          comingSoon: true,
          enabled: enabledModules.includes('execution'),
        },
      ],
    },
    {
      id: 'insights',
      name: 'Insights',
      icon: BarChart3,
      items: [
        {
          id: 'research',
          name: 'AI Research',
          view: 'research',
          icon: Search,
          comingSoon: true,
          enabled: enabledModules.includes('research'),
        },
        {
          id: 'analytics',
          name: 'Analytics',
          view: 'analytics',
          icon: BarChart3,
          comingSoon: true,
          enabled: enabledModules.includes('analytics'),
        },
        {
          id: 'ai',
          name: 'AI Assistant',
          view: 'ai',
          icon: Bot,
          comingSoon: true,
          enabled: enabledModules.includes('ai'),
        },
      ],
    },
    {
      id: 'workspace',
      name: 'Workspace',
      icon: Settings,
      items: [
        {
          id: 'settings',
          name: 'Settings',
          view: 'settings',
          icon: Settings,
          enabled: true,
        },
      ],
    },
  ];

  const navigateToView = (view: string) => {
    router.push(`/workspaces/${workspaceId}?view=${view}`);
  };

  const isActive = (view: string) => activeView === view;

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-white transition-all duration-300',
        shouldBeExpanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={() => sidebarBehavior === 'hover' && setIsHovering(true)}
      onMouseLeave={() => sidebarBehavior === 'hover' && setIsHovering(false)}
    >
      {/* Header with Workspace Switcher */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex-1 min-w-0">
          <WorkspaceSwitcher
            currentWorkspaceId={workspaceId}
            currentWorkspaceName={workspaceName}
            teamPlan={teamPlan}
            workspaces={workspaces}
            collapsed={!shouldBeExpanded}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-2">
          {navSections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                {shouldBeExpanded && section.id !== 'overview' && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-4 w-4" />
                      <span>{section.name}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>
                )}

                {/* Section Items */}
                {(isExpanded || !shouldBeExpanded || section.id === 'overview') && (
                  <div className={cn(shouldBeExpanded && section.id !== 'overview' && 'ml-2')}>
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.view);
                      const locked = item.requiresPro && teamPlan === 'free';

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.enabled && !item.comingSoon && !locked) {
                              navigateToView(item.view);
                            }
                          }}
                          disabled={item.comingSoon || !item.enabled || locked}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                            active && 'bg-blue-50 font-medium text-blue-600',
                            !active && 'text-slate-700 hover:bg-slate-100',
                            (item.comingSoon || !item.enabled || locked) &&
                              'cursor-not-allowed opacity-50'
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {shouldBeExpanded && (
                            <>
                              <span className="flex-1 truncate text-left">{item.name}</span>
                              {item.comingSoon && (
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 text-xs bg-amber-100 text-amber-700"
                                >
                                  Soon
                                </Badge>
                              )}
                              {locked && (
                                <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sidebar Toggle Footer */}
      {sidebarBehavior !== 'hover' && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-slate-700"
          >
            {collapsed ? (
              <>
                <ChevronRight className="h-4 w-4" />
                {shouldBeExpanded && <span className="text-xs">Expand</span>}
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                {shouldBeExpanded && <span className="text-xs">Collapse</span>}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
