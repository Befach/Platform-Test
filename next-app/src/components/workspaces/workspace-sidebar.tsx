'use client';

import { Badge } from '@/components/ui/badge';
// cn removed - not currently used
import {
  BarChart3,
  Bot,
  CheckSquare,
  ChevronDown,
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
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Workspace type removed - not currently used

interface WorkspaceSidebarProps {
  workspaceId: string;
  workspaceName: string;
  teamPlan: 'free' | 'pro' | 'enterprise';
  enabledModules: string[];
  currentView?: string;
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
  workspaceName: _workspaceName,
  teamPlan,
  enabledModules,
  currentView = 'dashboard',
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['work-items']);

  const activeView = currentView || searchParams?.get('view') || 'dashboard';

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
          id: 'canvas',
          name: 'Canvas',
          view: 'canvas',
          icon: Map,
          enabled: enabledModules.includes('mind_map'),
        },
        {
          id: 'work-items',
          name: 'Work Board',
          view: 'work-items',
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
        {
          id: 'product-tasks',
          name: 'Product Tasks',
          view: 'product-tasks',
          icon: CheckSquare,
          enabled: true, // Always enabled - standalone tasks
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
    <Sidebar collapsible="icon">
      <SidebarContent>
        {navSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const SectionIcon = section.icon;

          // Overview section (no collapsible)
          if (section.id === 'overview') {
            return (
              <SidebarGroup key={section.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.view);
                      const locked = item.requiresPro && teamPlan === 'free';

                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => {
                              if (item.enabled && !item.comingSoon && !locked) {
                                navigateToView(item.view);
                              }
                            }}
                            disabled={item.comingSoon || !item.enabled || locked}
                            isActive={active}
                            tooltip={item.name}
                          >
                            <ItemIcon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                          {(item.comingSoon || locked) && (
                            <SidebarMenuBadge>
                              {item.comingSoon && <span className="text-xs">Soon</span>}
                              {locked && <Lock className="h-3 w-3" />}
                            </SidebarMenuBadge>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Collapsible sections
          return (
            <Collapsible
              key={section.id}
              open={isExpanded}
              onOpenChange={() => toggleSection(section.id)}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-4 w-4" />
                      <span>{section.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isActive(item.view);
                        const locked = item.requiresPro && teamPlan === 'free';

                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => {
                                if (item.enabled && !item.comingSoon && !locked) {
                                  navigateToView(item.view);
                                }
                              }}
                              disabled={item.comingSoon || !item.enabled || locked}
                              isActive={active}
                              tooltip={item.name}
                            >
                              <ItemIcon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </SidebarMenuButton>
                            {(item.comingSoon || locked) && (
                              <SidebarMenuBadge>
                                {item.comingSoon && (
                                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                    Soon
                                  </Badge>
                                )}
                                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {/* Sidebar Footer with Toggle */}
      <SidebarFooter className="p-2">
        <div className="flex justify-end group-data-[collapsible=icon]:justify-center">
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
