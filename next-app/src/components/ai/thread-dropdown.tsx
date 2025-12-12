'use client'

/**
 * Thread Dropdown Component
 *
 * A dropdown selector for chat threads, similar to Claude Code's conversation switcher.
 * Uses Popover for custom rendering support.
 * Features:
 * - Current thread title display
 * - Quick "New Chat" option
 * - Infinite scroll for thread history
 * - Relative timestamps
 * - Archive/delete thread actions
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Plus,
  Loader2,
  MoreVertical,
  Archive,
  Pencil,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatThread } from '@/hooks/use-chat-threads'

// =============================================================================
// TYPES
// =============================================================================

interface ThreadDropdownProps {
  threads: ChatThread[]
  currentThreadId: string | null
  currentThread: ChatThread | null
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onSelectThread: (threadId: string | null) => void
  onNewThread: () => void
  onArchiveThread?: (threadId: string) => void
  onRenameThread?: (threadId: string, newTitle: string) => void
  loadMore: () => void
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format relative time (e.g., "2 min ago", "3 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Generate auto-title from first message content
 */
export function generateThreadTitle(content: string): string {
  if (!content) return 'New Chat'

  // Clean and truncate
  const cleaned = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length <= 50) return cleaned
  return cleaned.slice(0, 47) + '...'
}

// =============================================================================
// INFINITE SCROLL TRIGGER
// =============================================================================

interface InfiniteScrollTriggerProps {
  onVisible: () => void
  isLoading: boolean
}

function InfiniteScrollTrigger({ onVisible, isLoading }: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onVisible()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [onVisible, isLoading])

  return (
    <div ref={ref} className="flex justify-center py-2">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  )
}

// =============================================================================
// THREAD ITEM
// =============================================================================

interface ThreadItemProps {
  thread: ChatThread
  isSelected: boolean
  onSelect: () => void
  onArchive?: () => void
  onClose: () => void
}

function ThreadItem({ thread, isSelected, onSelect, onArchive, onClose }: ThreadItemProps) {
  const handleSelect = () => {
    onSelect()
    onClose()
  }

  return (
    <div
      className={cn(
        'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted/50'
      )}
      onClick={handleSelect}
    >
      <div className="flex-1 min-w-0 mr-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">
            {thread.title || 'New Chat'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-5.5">
          {formatRelativeTime(thread.updated_at)}
        </span>
      </div>

      {/* Actions menu (visible on hover) */}
      {onArchive && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement rename dialog
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
              className="text-destructive"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ThreadDropdown({
  threads,
  currentThreadId,
  currentThread,
  isLoading,
  isLoadingMore,
  hasMore,
  onSelectThread,
  onNewThread,
  onArchiveThread,
  loadMore,
  className,
}: ThreadDropdownProps) {
  const [open, setOpen] = useState(false)

  const handleNewChat = useCallback(() => {
    onNewThread()
    setOpen(false)
  }, [onNewThread])

  const displayTitle = currentThread?.title || 'New Chat'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[200px] h-9 justify-between', className)}
        >
          <div className="flex items-center gap-2 truncate">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{displayTitle}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start">
        {/* New Chat Option */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Chat</span>
        </div>

        <Separator />

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <div className="py-6 px-3 text-center text-sm text-muted-foreground">
            No previous chats
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="p-1 space-y-0.5">
              {threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isSelected={thread.id === currentThreadId}
                  onSelect={() => onSelectThread(thread.id)}
                  onArchive={
                    onArchiveThread
                      ? () => onArchiveThread(thread.id)
                      : undefined
                  }
                  onClose={() => setOpen(false)}
                />
              ))}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <InfiniteScrollTrigger
                  onVisible={loadMore}
                  isLoading={isLoadingMore}
                />
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default ThreadDropdown
