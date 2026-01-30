'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Lightbulb,
  Sparkles,
  GitBranch,
  Calendar,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AppSidebarProps {
  workspaceId?: string
  workspaceName?: string
  teamId?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, shortcut: 'G H' },
  { name: 'Canvas', href: '/canvas', icon: Lightbulb, shortcut: 'G M' },
  { name: 'Features', href: '/features', icon: Sparkles, shortcut: 'G F' },
  { name: 'Dependencies', href: '/dependencies', icon: GitBranch, shortcut: 'G D' },
  { name: 'Timeline', href: '/timeline', icon: Calendar, shortcut: 'G T' },
  { name: 'Reviews', href: '/reviews', icon: Users, shortcut: 'G R' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: 'G A' },
]

export function AppSidebar({ workspaceId, workspaceName, teamId: _teamId }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (!workspaceId) return false
    const fullPath = `/workspaces/${workspaceId}${href}`
    return pathname?.startsWith(fullPath)
  }

  const getFullHref = (href: string) => {
    if (!workspaceId) return href
    return `/workspaces/${workspaceId}${href}`
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                  {workspaceName || 'Workspace'}
                </h2>
                <p className="text-xs text-sidebar-foreground/60 truncate">Product Lifecycle</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="flex-shrink-0"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={getFullHref(item.href)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? `${item.name} (${item.shortcut})` : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
                      {item.shortcut}
                    </kbd>
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Settings */}
        <div className="p-2 border-t border-sidebar-border">
          <Link
            href={workspaceId ? `/workspaces/${workspaceId}/settings` : '/settings'}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>

        {/* Keyboard Shortcut Hint */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60 text-center">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Cmd+K</kbd>{' '}
              for quick navigation
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
