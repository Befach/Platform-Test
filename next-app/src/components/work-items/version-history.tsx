'use client'

/**
 * Version History Component
 *
 * Displays the version chain for a work item in a timeline format.
 * Shows all versions from original to current with navigation.
 *
 * @module components/work-items/version-history
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  GitBranch,
  ArrowRight,
  Clock,
  Loader2,
  Plus,
  ExternalLink,
  Check,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTypePhaseConfig, type WorkItemType } from '@/lib/constants/workspace-phases'
import {
  useWorkItemVersions,
  type WorkItemVersion,
  canEnhance,
} from '@/hooks/use-work-item-versions'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for VersionHistory
 */
export interface VersionHistoryProps {
  /** Work item ID to show versions for */
  workItemId: string
  /** Current version number */
  currentVersion: number
  /** ID of work item this enhances */
  enhancesWorkItemId?: string | null
  /** Work item type */
  type?: WorkItemType
  /** Current phase (for enhance eligibility) */
  phase?: string
  /** Team ID for navigation */
  teamId?: string
  /** Additional class names */
  className?: string
  /** Callback when new version is created */
  onVersionCreated?: (newVersionId: string) => void
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Single version card in the timeline
 */
function VersionCard({
  version,
  isCurrent,
  isLatest,
  type = 'feature',
}: {
  version: WorkItemVersion
  isCurrent: boolean
  isLatest: boolean
  type?: WorkItemType
}) {
  const phaseConfig = getTypePhaseConfig(type, version.phase)
  const PhaseIcon = phaseConfig?.icon

  const formattedDate = new Date(version.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={cn(
        'relative flex items-start gap-4 pb-8 last:pb-0',
        'before:absolute before:left-[11px] before:top-8 before:h-full before:w-0.5 before:bg-border last:before:hidden'
      )}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
          isCurrent
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/30 bg-background'
        )}
      >
        {isCurrent ? (
          <Check className="h-3 w-3" />
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">
            {version.version}
          </span>
        )}
      </div>

      {/* Version content */}
      <Card className={cn('flex-1', isCurrent && 'ring-2 ring-primary')}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {isCurrent ? (
                    version.title
                  ) : (
                    <Link
                      href={`/work-items/${version.id}`}
                      className="hover:underline"
                    >
                      {version.title}
                    </Link>
                  )}
                </CardTitle>
                {isLatest && (
                  <Badge variant="outline" className="text-xs">
                    Latest
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="text-xs bg-primary">Current</Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                {formattedDate}
              </CardDescription>
            </div>

            {/* Phase badge */}
            {phaseConfig && (
              <Badge className={cn('text-xs', phaseConfig.bgColor, phaseConfig.textColor)}>
                {PhaseIcon && <PhaseIcon className="h-3 w-3 mr-1" />}
                {phaseConfig.name}
              </Badge>
            )}
          </div>
        </CardHeader>

        {version.version_notes && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{version.version_notes}</p>
          </CardContent>
        )}

        {!isCurrent && (
          <CardContent className="pt-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/work-items/${version.id}`}>
                View version
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

/**
 * Create new version dialog
 */
function CreateVersionDialog({
  workItemId,
  onVersionCreated,
}: {
  workItemId: string
  onVersionCreated?: (newVersionId: string) => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [versionNotes, setVersionNotes] = useState('')

  const handleCreate = useCallback(async () => {
    if (!versionNotes.trim()) {
      toast({
        title: 'Version notes required',
        description: 'Please explain what will change in this new version',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/work-items/${workItemId}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_notes: versionNotes }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create new version')
      }

      toast({
        title: 'New version created!',
        description: `Version ${result.work_item.version} is ready for development`,
      })

      setOpen(false)
      setVersionNotes('')
      router.refresh()
      onVersionCreated?.(result.work_item.id)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not create new version'
      toast({
        title: 'Creation failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [workItemId, versionNotes, toast, router, onVersionCreated])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create New Version
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Enhanced Version</DialogTitle>
          <DialogDescription>
            Create a new version that builds upon this work item. The new version
            will start fresh in the Design phase while preserving context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="version-notes">What&apos;s changing in this version?</Label>
            <Textarea
              id="version-notes"
              placeholder="E.g., Adding mobile support based on user feedback..."
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Explain the purpose of this new version for future reference.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting || !versionNotes.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Version History component
 *
 * @example
 * ```tsx
 * <VersionHistory
 *   workItemId={workItem.id}
 *   currentVersion={workItem.version}
 *   enhancesWorkItemId={workItem.enhances_work_item_id}
 *   type="feature"
 *   phase="launch"
 * />
 * ```
 */
export function VersionHistory({
  workItemId,
  currentVersion,
  enhancesWorkItemId,
  type = 'feature',
  phase,
  className,
  onVersionCreated,
}: VersionHistoryProps) {
  const { versionChain, isLoading, error, hasVersionHistory } = useWorkItemVersions({
    workItemId,
    currentVersion,
    enhancesWorkItemId,
  })

  // Check if user can create a new enhanced version
  const showCreateButton = phase && canEnhance(phase, type)

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <Card className="p-4 text-center text-muted-foreground">
          <p>Could not load version history</p>
        </Card>
      </div>
    )
  }

  // No version history
  if (!hasVersionHistory || !versionChain || versionChain.versions.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Version History</h3>
          </div>
          {showCreateButton && (
            <CreateVersionDialog
              workItemId={workItemId}
              onVersionCreated={onVersionCreated}
            />
          )}
        </div>
        <Card className="p-6 text-center">
          <GitBranch className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            This is the original version. No enhanced versions have been created yet.
          </p>
          {showCreateButton && (
            <p className="text-sm text-muted-foreground mt-2">
              Use &ldquo;Create New Version&rdquo; to iterate on this work item.
            </p>
          )}
        </Card>
      </div>
    )
  }

  // Render version timeline
  const latestVersion = versionChain.versions[versionChain.versions.length - 1]

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
          <Badge variant="secondary" className="text-xs">
            {versionChain.totalVersions} version{versionChain.totalVersions !== 1 ? 's' : ''}
          </Badge>
        </div>
        {showCreateButton && (
          <CreateVersionDialog
            workItemId={workItemId}
            onVersionCreated={onVersionCreated}
          />
        )}
      </div>

      {/* Version timeline */}
      <div className="space-y-0">
        {versionChain.versions.map((version) => (
          <VersionCard
            key={version.id}
            version={version}
            isCurrent={version.id === workItemId}
            isLatest={version.id === latestVersion.id}
            type={type}
          />
        ))}
      </div>
    </div>
  )
}

export default VersionHistory
