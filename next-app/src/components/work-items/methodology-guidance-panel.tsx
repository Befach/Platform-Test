'use client'

/**
 * Methodology Guidance Panel
 *
 * Expandable panel showing comprehensive Design Thinking methodology
 * guidance for the current work item phase. Includes framework info,
 * recommended tools, case studies, and AI-powered suggestions.
 *
 * Features:
 * - Phase-specific methodology recommendations
 * - Tool cards with duration and participant info
 * - Case study cards with expandable details
 * - AI suggestion button with loading state
 * - Collapsible sections for clean UX
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Clock,
  Users,
  Sparkles,
  Loader2,
  ExternalLink,
  Building2,
  Target,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import {
  getMethodologyGuidance,
  type MethodologyGuidance,
  type DesignThinkingTool,
  type DesignThinkingFramework,
  type CaseStudy,
  type AlternativeFramework,
  getFrameworkById,
} from '@/lib/design-thinking'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface MethodologyGuidancePanelProps {
  /** Current phase */
  phase: WorkspacePhase
  /** Work item ID for AI suggestions */
  workItemId?: string
  /** Team ID for API calls */
  teamId?: string
  /** Workspace ID for API calls */
  workspaceId?: string
  /** Work item context for AI */
  workItemContext?: {
    name?: string
    purpose?: string
    type?: string
    progress_percent?: number
  }
  /** Callback when panel is closed */
  onClose?: () => void
  /** Additional class names */
  className?: string
}

interface AISuggestion {
  primaryFramework: string
  frameworkReason: string
  suggestedMethods: Array<{
    toolId: string
    toolName: string
    reason: string
    priority: 'high' | 'medium' | 'low'
    toolDescription?: string
    duration?: string
    participants?: string
  }>
  nextSteps: string[]
  relevantCaseStudies: Array<CaseStudy | { id: string }>
  phaseSpecificTips: string[]
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Section header with collapse toggle
 */
function SectionHeader({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
}: {
  title: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  badge?: string | number
}) {
  return (
    <CollapsibleTrigger asChild>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
          {badge !== undefined && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </CollapsibleTrigger>
  )
}

/**
 * Tool card showing a Design Thinking tool
 */
function ToolCard({ tool }: { tool: DesignThinkingTool }) {
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm">{tool.name}</h4>
        <div className="flex gap-1.5 shrink-0">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            <Clock className="h-2.5 w-2.5 mr-0.5" />
            {tool.duration}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            <Users className="h-2.5 w-2.5 mr-0.5" />
            {tool.participants}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
        {tool.description}
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {tool.useCases.slice(0, 3).map((useCase, i) => (
          <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
            {useCase}
          </Badge>
        ))}
      </div>
    </div>
  )
}

/**
 * Case study card
 */
function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <h4 className="font-medium text-sm">{caseStudy.company}</h4>
            <span className="text-[10px] text-muted-foreground">{caseStudy.industry}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Less' : 'More'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        <span className="font-medium text-foreground">Challenge: </span>
        {expanded ? caseStudy.challenge : caseStudy.challenge.slice(0, 100) + '...'}
      </p>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 space-y-2"
        >
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Approach: </span>
            {caseStudy.approach}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Outcome: </span>
            {caseStudy.outcome}
          </p>
          <div className="flex gap-1 flex-wrap">
            {caseStudy.frameworks.map((f) => (
              <Badge key={f} variant="secondary" className="text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Alternative framework suggestion
 */
function AlternativeFrameworkCard({ alt }: { alt: AlternativeFramework }) {
  const framework = getFrameworkById(alt.framework)

  return (
    <div className="p-2 rounded-md bg-muted/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{framework.name}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{alt.reason}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        <span className="font-medium">Best when: </span>
        {alt.bestWhen}
      </p>
    </div>
  )
}

/**
 * AI Suggestions section
 */
function AISuggestionsSection({
  workItemId,
  teamId,
  workspaceId,
  phase,
  workItemContext,
}: {
  workItemId?: string
  teamId?: string
  workspaceId?: string
  phase: WorkspacePhase
  workItemContext?: MethodologyGuidancePanelProps['workItemContext']
}) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSuggestions = useCallback(async () => {
    if (!workItemId || !teamId) {
      toast({
        title: 'Missing context',
        description: 'Work item ID and team ID are required for AI suggestions',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/methodology/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_item_id: workItemId,
          team_id: teamId,
          workspace_id: workspaceId,
          current_phase: phase,
          work_item_context: workItemContext,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI suggestions')
      }

      const data = await response.json()
      setSuggestion(data.suggestion)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [workItemId, teamId, workspaceId, phase, workItemContext, toast])

  if (!suggestion) {
    return (
      <div className="text-center py-4">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          Get personalized methodology recommendations based on your work item
        </p>
        <Button
          onClick={fetchSuggestions}
          disabled={loading || !workItemId || !teamId}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Get AI Suggestions
            </>
          )}
        </Button>
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
        {(!workItemId || !teamId) && (
          <p className="text-xs text-muted-foreground mt-2">
            Save the work item first to enable AI suggestions
          </p>
        )}
      </div>
    )
  }

  const framework = getFrameworkById(suggestion.primaryFramework as DesignThinkingFramework)

  return (
    <div className="space-y-4">
      {/* Framework recommendation */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Recommended: {framework?.name || suggestion.primaryFramework}</span>
        </div>
        <p className="text-xs text-muted-foreground">{suggestion.frameworkReason}</p>
      </div>

      {/* Suggested methods */}
      {suggestion.suggestedMethods.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Suggested Methods
          </h4>
          <div className="space-y-2">
            {suggestion.suggestedMethods.map((method, i) => (
              <div key={i} className="p-2 rounded-md border bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{method.toolName}</span>
                  <Badge
                    variant={
                      method.priority === 'high'
                        ? 'default'
                        : method.priority === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-[10px] h-4"
                  >
                    {method.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{method.reason}</p>
                {(method.duration || method.participants) && (
                  <div className="flex gap-2 mt-1.5">
                    {method.duration && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {method.duration}
                      </span>
                    )}
                    {method.participants && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" /> {method.participants}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {suggestion.nextSteps.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Next Steps
          </h4>
          <ul className="space-y-1.5">
            {suggestion.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {suggestion.phaseSpecificTips.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Tips for {phase} Phase
          </h4>
          <ul className="space-y-1.5">
            {suggestion.phaseSpecificTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh button */}
      <Button
        variant="outline"
        size="sm"
        onClick={fetchSuggestions}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Refreshing...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Get New Suggestions
          </>
        )}
      </Button>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Methodology Guidance Panel
 *
 * Shows comprehensive Design Thinking methodology guidance for
 * the current phase. Can be used as a sidebar or modal content.
 */
export function MethodologyGuidancePanel({
  phase,
  workItemId,
  teamId,
  workspaceId,
  workItemContext,
  onClose,
  className,
}: MethodologyGuidancePanelProps) {
  const guidance = getMethodologyGuidance(phase)
  const { recommendation } = guidance
  const framework = getFrameworkById(recommendation.primaryFramework)

  // Section open states
  const [sectionsOpen, setSectionsOpen] = useState({
    questions: true,
    tools: true,
    caseStudies: false,
    alternatives: false,
    aiSuggestions: false,
    nextPhase: false,
  })

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Methodology Guidance</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {framework.name} for {phase} phase
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Framework overview */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <h3 className="font-medium text-sm mb-1">{framework.name}</h3>
          <p className="text-xs text-muted-foreground">{framework.corePhilosophy}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {recommendation.relevantStages.map((stage) => (
              <Badge key={stage} className="text-[10px] capitalize">
                {stage}
              </Badge>
            ))}
          </div>
        </div>

        {/* Guiding Questions */}
        <Collapsible open={sectionsOpen.questions}>
          <SectionHeader
            title="Guiding Questions"
            icon={Lightbulb}
            isOpen={sectionsOpen.questions}
            onToggle={() => toggleSection('questions')}
            badge={recommendation.keyQuestions.length}
          />
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              {recommendation.keyQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{q.question}</p>
                    {q.designThinkingMethod && (
                      <Badge variant="secondary" className="text-[10px] h-4 mt-1">
                        {q.designThinkingMethod}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Recommended Tools */}
        <Collapsible open={sectionsOpen.tools}>
          <SectionHeader
            title="Recommended Tools"
            icon={Target}
            isOpen={sectionsOpen.tools}
            onToggle={() => toggleSection('tools')}
            badge={recommendation.recommendedTools.length}
          />
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              {recommendation.recommendedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Case Studies */}
        <Collapsible open={sectionsOpen.caseStudies}>
          <SectionHeader
            title="Case Studies"
            icon={Building2}
            isOpen={sectionsOpen.caseStudies}
            onToggle={() => toggleSection('caseStudies')}
            badge={recommendation.caseStudies.length}
          />
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              {recommendation.caseStudies.map((cs) => (
                <CaseStudyCard key={cs.id} caseStudy={cs} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Alternative Frameworks */}
        <Collapsible open={sectionsOpen.alternatives}>
          <SectionHeader
            title="Alternative Frameworks"
            icon={BookOpen}
            isOpen={sectionsOpen.alternatives}
            onToggle={() => toggleSection('alternatives')}
            badge={guidance.alternativeFrameworks.length}
          />
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              {guidance.alternativeFrameworks.map((alt, i) => (
                <AlternativeFrameworkCard key={i} alt={alt} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* AI Suggestions */}
        <Collapsible open={sectionsOpen.aiSuggestions}>
          <SectionHeader
            title="AI Suggestions"
            icon={Sparkles}
            isOpen={sectionsOpen.aiSuggestions}
            onToggle={() => toggleSection('aiSuggestions')}
          />
          <CollapsibleContent>
            <div className="pt-2">
              <AISuggestionsSection
                workItemId={workItemId}
                teamId={teamId}
                workspaceId={workspaceId}
                phase={phase}
                workItemContext={workItemContext}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Next Phase Preview */}
        {guidance.nextPhasePreview && (
          <>
            <Separator />
            <Collapsible open={sectionsOpen.nextPhase}>
              <SectionHeader
                title={`Next: ${guidance.nextPhasePreview.phase} Phase`}
                icon={ChevronRight}
                isOpen={sectionsOpen.nextPhase}
                onToggle={() => toggleSection('nextPhase')}
              />
              <CollapsibleContent>
                <div className="pt-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    {guidance.nextPhasePreview.frameworkRationale}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {guidance.nextPhasePreview.tips.slice(0, 2).map((tip, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {tip.slice(0, 40)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </div>
  )
}

export default MethodologyGuidancePanel
