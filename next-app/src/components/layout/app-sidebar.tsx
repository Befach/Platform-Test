'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Boxes,
  List,
  Calendar,
  BarChart3,
  Users,
  Database,
  FileText,
  FileEdit,
  Settings,
  Plus,
  Check,
  ChevronsUpDown,
  Target,
  Bot,
  Palette,
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
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { CreateWorkspaceDialog } from '@/components/workspaces/create-workspace-dialog'

// Separate component for footer so it can use useSidebar hook
function SidebarUserFooter({
  userName,
  userEmail,
  getUserInitials,
}: {
  userName?: string
  userEmail?: string
  getUserInitials: () => string
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarFooter className="p-2">
      {/* Layout: Expanded = row (avatar left, toggle right), Collapsed = column (toggle top, avatar bottom) */}
      <div className={cn(
        'flex items-center',
        isCollapsed ? 'flex-col gap-2' : 'flex-row justify-between'
      )}>
        {/* Toggle Button - first when collapsed (appears on top) */}
        {isCollapsed && <SidebarTrigger className="h-8 w-8" />}

        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" title={userName || userEmail || 'User profile'}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{userName || 'User'}</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/signout" className="text-red-500 w-full">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle Button - last when expanded (appears on right) */}
        {!isCollapsed && <SidebarTrigger className="h-8 w-8" />}
      </div>
    </SidebarFooter>
  )
}

interface Workspace {
  id: string
  name: string
  team_id: string
}

interface SidebarProps {
  workspaceId: string
  workspaceName: string
  workspaces: Workspace[]
  teamId: string
  userEmail?: string
  userName?: string
}

interface NavItem {
  icon: typeof LayoutDashboard
  label: string
  href: string
}

export function AppSidebar({ workspaceId: defaultWorkspaceId, workspaceName: defaultWorkspaceName, workspaces, teamId, userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)

  // Determine active workspace
  const activeWorkspaceId = (params.id as string) || defaultWorkspaceId
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const workspaceName = activeWorkspace?.name || defaultWorkspaceName
  const workspaceId = activeWorkspaceId

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: `/workspaces/${workspaceId}?view=dashboard` },
    { icon: Bot, label: 'AI Assistant', href: `/workspaces/${workspaceId}/ai` },
    { icon: Boxes, label: 'Canvas', href: `/workspaces/${workspaceId}?view=canvas` },
    { icon: Palette, label: 'Endless Canvas', href: `/workspaces/${workspaceId}/canvas` },
    { icon: Target, label: 'Strategy', href: `/workspaces/${workspaceId}/strategies` },
    { icon: List, label: 'Work Board', href: `/workspaces/${workspaceId}?view=work-items` },
    { icon: Calendar, label: 'Timeline', href: `/workspaces/${workspaceId}?view=timeline` },
    { icon: BarChart3, label: 'Analytics', href: `/workspaces/${workspaceId}?view=analytics` },
    { icon: Users, label: 'Project Team', href: `/workspaces/${workspaceId}?view=team-analytics` }
  ]

  // Documents section items
  const documentsNavItems: NavItem[] = [
    { icon: Database, label: 'Data Library', href: `/workspaces/${workspaceId}/data-library` },
    { icon: FileText, label: 'Reports', href: `/workspaces/${workspaceId}/reports` },
    { icon: FileEdit, label: 'Word Assistant', href: `/workspaces/${workspaceId}/assistant` }
  ]

  // Organization section items
  const organizationNavItems: NavItem[] = [
    { icon: Users, label: 'Members', href: `/team/members` },
    { icon: Settings, label: 'Settings', href: `/team/settings` }
  ]

  const isActive = (href: string) => {
    // For view-based routes, check if the current view matches
    if (href.includes('?view=')) {
      const viewName = href.split('?view=')[1]
      const currentView = searchParams.get('view')
      return pathname.includes(workspaceId) && currentView === viewName
    }
    // For nested routes (like /canvas, /canvas/[id]), check if pathname starts with href
    return pathname === href || pathname.startsWith(href + '/')
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
    <Sidebar collapsible="icon" className="rounded-2xl">
      {/* Workspace Selector Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm font-bold">{workspaceName.charAt(0)}</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{workspaceName}</span>
                    <span className="truncate text-xs">Workspace</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch Workspace
                </DropdownMenuLabel>
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => router.push(`/workspaces/${workspace.id}?view=dashboard`)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <span className="text-xs font-medium">{workspace.name.charAt(0)}</span>
                    </div>
                    {workspace.name}
                    {workspace.id === workspaceId && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onSelect={(e) => {
                    e.preventDefault()
                    setCreateWorkspaceOpen(true)
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add workspace</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Documents Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organization Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {organizationNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Avatar and Toggle Button */}
      <SidebarUserFooter
        userName={userName}
        userEmail={userEmail}
        getUserInitials={getUserInitials}
      />

      <SidebarRail />

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        teamId={teamId}
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onSuccess={() => {
          router.refresh()
          setCreateWorkspaceOpen(false)
        }}
      />
    </Sidebar>
  )
}
