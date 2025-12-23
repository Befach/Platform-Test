'use client'

/**
 * Guiding Questions Tooltip
 *
 * A tooltip component that shows guiding questions when hovering over
 * the phase badge. Provides quick context about Design Thinking methods
 * and links to the full methodology guidance panel.
 *
 * Features:
 * - Shows 2-3 key questions for the current phase
 * - Displays Design Thinking method badges
 * - "See all methods" link to open full panel
 * - Responsive and accessible
 */

import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Lightbulb, BookOpen } from 'lucide-react'
import type { WorkspacePhase, WorkItemType } from '@/lib/constants/workspace-phases'
import { getTypePhaseGuidance, getPhaseGuidance, type GuidingQuestion } from '@/lib/phase/guiding-questions'
import { getFrameworkForPhase } from '@/lib/design-thinking'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface GuidingQuestionsTooltipProps {
  /** Current phase to show guidance for */
  phase: WorkspacePhase | string
  /** Work item type for type-aware guidance */
  type?: WorkItemType
  /** Trigger element (usually the phase badge) */
  children: React.ReactNode
  /** Callback when user wants to open full methodology panel */
  onOpenPanel?: () => void
  /** Additional class names */
  className?: string
  /** Number of questions to show (default: 3) */
  questionCount?: number
  /** Side to show tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left'
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Single question item with method badge
 */
function QuestionItem({
  question,
  method,
}: {
  question: string
  method?: string
}) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm text-foreground leading-tight">{question}</p>
        {method && (
          <Badge
            variant="secondary"
            className="text-[10px] h-4 px-1.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          >
            {method}
          </Badge>
        )}
      </div>
    </div>
  )
}

/**
 * Framework indicator at the top of tooltip
 */
function FrameworkIndicator({ phase, type }: { phase: string; type?: WorkItemType }) {
  // Only show framework for feature phases (design/build/refine/launch)
  // Other types use different workflows
  // Note: Enhancement is now a flag on features, not a separate type
  const featurePhases = ['design', 'build', 'refine', 'launch']
  const isFeaturePhase = featurePhases.includes(phase)

  if (!isFeaturePhase || (type && type !== 'feature')) {
    return null
  }

  const framework = getFrameworkForPhase(phase as WorkspacePhase)

  return (
    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50">
      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        Recommended: <span className="font-medium text-foreground">{framework.name}</span>
      </span>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Tooltip showing guiding questions for a phase
 *
 * Wraps the trigger element (phase badge) and shows guidance on hover.
 *
 * @example
 * ```tsx
 * <GuidingQuestionsTooltip phase="design" onOpenPanel={() => setShowPanel(true)}>
 *   <PhaseBadge phase="design" />
 * </GuidingQuestionsTooltip>
 * ```
 */
export function GuidingQuestionsTooltip({
  phase,
  type = 'feature',
  children,
  onOpenPanel,
  className,
  questionCount = 3,
  side = 'bottom',
}: GuidingQuestionsTooltipProps) {
  const [open, setOpen] = useState(false)

  // Use type-aware guidance
  const guidance = getTypePhaseGuidance(type, phase as string)
  const questions = guidance.questions.slice(0, questionCount)

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild className={cn('cursor-pointer', className)}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align="start"
          className="w-80 p-3 bg-popover"
          sideOffset={8}
        >
          {/* Framework indicator */}
          <FrameworkIndicator phase={phase as string} type={type} />

          {/* Phase summary */}
          <p className="text-xs text-muted-foreground mb-3">
            {guidance.summary}
          </p>

          {/* Questions */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Key Questions
            </h4>
            {questions.map((q, index) => (
              <QuestionItem
                key={index}
                question={q.question}
                method={q.designThinkingMethod}
              />
            ))}
          </div>

          {/* See more link */}
          {onOpenPanel && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                onOpenPanel()
              }}
            >
              <span>View all methodology guidance</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// STANDALONE VERSION (without tooltip wrapper)
// ============================================================================

/**
 * Standalone guiding questions card (for use outside tooltip)
 *
 * Can be used in panels, sidebars, or as an inline component.
 */
export function GuidingQuestionsCard({
  phase,
  type = 'feature',
  onOpenPanel,
  className,
  questionCount = 3,
}: Omit<GuidingQuestionsTooltipProps, 'children' | 'side'>) {
  const guidance = getTypePhaseGuidance(type, phase as string)
  const questions = guidance.questions.slice(0, questionCount)

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Framework indicator */}
      <FrameworkIndicator phase={phase as string} type={type} />

      {/* Phase summary */}
      <p className="text-sm text-muted-foreground mb-4">
        {guidance.summary}
      </p>

      {/* Questions */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Guiding Questions
        </h4>
        {questions.map((q, index) => (
          <QuestionItem
            key={index}
            question={q.question}
            method={q.designThinkingMethod}
          />
        ))}
      </div>

      {/* See more link */}
      {onOpenPanel && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={onOpenPanel}
        >
          <span>View full methodology guidance</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}

export default GuidingQuestionsTooltip
