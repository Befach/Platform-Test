'use client'

/**
 * Workspace Card Component
 *
 * Displays a workspace summary card with:
 * - Basic info (name, description)
 * - Mode badge (development, launch, growth, maintenance)
 * - Type-aware phase distribution (when work items are provided)
 * - Module count and creation date
 */

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  TypeAwarePhaseDistribution,
  DistributionSummary,
  type WorkItemForDistribution,
} from './type-aware-phase-distribution'

// =============================================================================
// TYPES
// =============================================================================

interface WorkspaceCardProps {
  workspace: {
    id: string
    name: string
    description: string | null
    phase: string // Legacy - now represents workspace "mode"
    mode?: string // New mode field if available
    enabled_modules: string[] | null
    created_at: string
  }
  /** Optional work items for showing type-aware distribution */
  workItems?: WorkItemForDistribution[]
  /** Show compact distribution bar (default: true) */
  compact?: boolean
}

// =============================================================================
// MODE CONFIGURATION
// =============================================================================

// Workspace modes (lifecycle context, not phase)
const MODE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  development: {
    label: 'Development',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    emoji: '🔨',
  },
  launch: {
    label: 'Launch',
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🚀',
  },
  growth: {
    label: 'Growth',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    emoji: '📈',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    emoji: '🔧',
  },
}

// Legacy phase to mode mapping
const LEGACY_PHASE_TO_MODE: Record<string, string> = {
  research: 'development',
  planning: 'development',
  execution: 'development',
  review: 'launch',
  complete: 'maintenance',
  design: 'development',
  build: 'development',
  refine: 'launch',
  launch: 'launch',
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WorkspaceCard({
  workspace,
  workItems,
  compact = true,
}: WorkspaceCardProps) {
  // Determine the mode (prefer explicit mode, fallback to mapped phase)
  const mode = workspace.mode || LEGACY_PHASE_TO_MODE[workspace.phase] || 'development'
  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.development

  // Calculate work item counts by type
  const hasWorkItems = workItems && workItems.length > 0

  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{workspace.name}</CardTitle>
              {workspace.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {workspace.description}
                </CardDescription>
              )}
            </div>
            {/* Mode Badge */}
            <Badge className={cn('flex-shrink-0', modeConfig.color)}>
              <span className="mr-1">{modeConfig.emoji}</span>
              {modeConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Type-Aware Phase Distribution */}
          {hasWorkItems && (
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Work Items Distribution
              </div>
              <TypeAwarePhaseDistribution
                workItems={workItems}
                compact={compact}
              />
            </div>
          )}

          {/* Distribution Summary (text) */}
          {hasWorkItems && (
            <div className="text-xs text-muted-foreground mb-3">
              <DistributionSummary workItems={workItems} />
            </div>
          )}

          {/* Footer: Modules and Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              {workspace.enabled_modules && workspace.enabled_modules.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {workspace.enabled_modules.length} modules
                </Badge>
              )}
              {!hasWorkItems && (
                <span className="italic">No work items yet</span>
              )}
            </div>
            <span>
              Created {new Date(workspace.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
