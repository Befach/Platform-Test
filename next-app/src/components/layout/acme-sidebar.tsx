'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Map,
  List,
  Calendar,
  Network,
  BarChart3,
  Users,
  Database,
  FileText,
  FileEdit,
  MoreHorizontal,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Check,
  ChevronsUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

interface Workspace {
  id: string
  name: string
  team_id: string
}

interface SidebarProps {
  workspaceId: string
  workspaceName: string
  workspaces: Workspace[]
  userEmail?: string
  userName?: string
}

interface NavItem {
  icon: typeof LayoutDashboard
  label: string
  href: string
}

export function AcmeSidebar({ workspaceId, workspaceName, workspaces, userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: `/workspaces/${workspaceId}?view=dashboard` },
    { icon: Map, label: 'Mind Map', href: `/workspaces/${workspaceId}?view=mind-map` },
    { icon: List, label: 'Features', href: `/workspaces/${workspaceId}?view=features` },
    { icon: Calendar, label: 'Timeline', href: `/workspaces/${workspaceId}?view=timeline` },
    { icon: Network, label: 'Dependencies', href: `/workspaces/${workspaceId}?view=dependencies` },
    { icon: BarChart3, label: 'Analytics', href: `/workspaces/${workspaceId}?view=analytics` },
    { icon: Users, label: 'Team', href: `/workspaces/${workspaceId}?view=team` }
  ]

  // Documents section items
  const documentsNavItems: NavItem[] = [
    { icon: Database, label: 'Data Library', href: `/workspaces/${workspaceId}/data-library` },
    { icon: FileText, label: 'Reports', href: `/workspaces/${workspaceId}/reports` },
    { icon: FileEdit, label: 'Word Assistant', href: `/workspaces/${workspaceId}/assistant` }
  ]

  const isActive = (href: string) => {
    // For view-based routes, check if the current view matches
    if (href.includes('?view=')) {
      const viewName = href.split('?view=')[1]
      const currentView = searchParams.get('view')
      return pathname.includes(workspaceId) && currentView === viewName
    }
    return pathname === href
  }

  const getUserInitials = () => {
    if (userName) {
      return userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (userEmail) {
      return userEmail.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Sidebar collapsible="icon">
      {/* Workspace Selector Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <div className="flex h-6 w-6 items-center justify-center rounded border bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-xs font-semibold">{workspaceName.charAt(0)}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{workspaceName}</span>
                    <span className="truncate text-xs text-muted-foreground">Workspace</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => router.push(`/workspaces/${workspace.id}?view=dashboard`)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded border bg-background">
                        <span className="text-[10px] font-semibold">{workspace.name.charAt(0)}</span>
                      </div>
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    {workspace.id === workspaceId && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Create Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              className="w-full justify-start gap-2"
              onClick={() => {
                // TODO: Open create dialog
                console.log('Quick Create clicked')
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Quick Create</span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Documents Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* More Option */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Actions and User Profile */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Search className="h-4 w-4" />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <HelpCircle className="h-4 w-4" />
              <span>Get Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        {/* User Profile */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName || 'User'}</span>
                    <span className="truncate text-xs text-muted-foreground">{userEmail || 'user@example.com'}</span>
                  </div>
                  <MoreHorizontal className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuItem>
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
