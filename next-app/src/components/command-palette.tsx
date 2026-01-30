'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  FileText,
  Lightbulb,
  GitBranch,
  Calendar,
  Users,
  BarChart3,
  Plus,
  Settings,
  Home,
  Sparkles,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface CommandPaletteProps {
  workspaceId?: string
  teamId?: string
}

export function CommandPalette({ workspaceId, teamId: _teamId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  const openCreateDialog = (type: string) => {
    // Trigger create dialog via custom event
    window.dispatchEvent(new CustomEvent('open-create-dialog', { detail: { type } }))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Navigation Commands */}
            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => navigateTo('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>Go to Dashboard</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">G</span>H
                </kbd>
              </Command.Item>

              {workspaceId && (
                <>
                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/features`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Go to Features</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>F
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/canvas`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Go to Canvas</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>M
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/dependencies`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>Go to Dependencies</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>D
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/timeline`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Go to Timeline</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>T
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/reviews`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Users className="h-4 w-4" />
                    <span>Go to Reviews</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>R
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/analytics`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Go to Analytics</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">G</span>A
                    </kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => navigateTo(`/workspaces/${workspaceId}/settings`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Workspace Settings</span>
                  </Command.Item>
                </>
              )}
            </Command.Group>

            {/* Action Commands */}
            {workspaceId && (
              <Command.Group heading="Actions">
                <Command.Item
                  onSelect={() => openCreateDialog('feature')}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Feature</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    C
                  </kbd>
                </Command.Item>

                <Command.Item
                  onSelect={() => openCreateDialog('dependency')}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>Add Dependency</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => openCreateDialog('review-link')}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Users className="h-4 w-4" />
                  <span>Generate Review Link</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Help */}
            <Command.Group heading="Help">
              <Command.Item
                onSelect={() => navigateTo('/help/shortcuts')}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Keyboard Shortcuts</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ?
                </kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>Press <kbd className="px-1 rounded bg-muted">Esc</kbd> to close</span>
            <span>Navigate with <kbd className="px-1 rounded bg-muted">↑</kbd> <kbd className="px-1 rounded bg-muted">↓</kbd></span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
