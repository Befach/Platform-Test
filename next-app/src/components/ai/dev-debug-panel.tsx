'use client'

/**
 * Dev Mode Debug Panel
 *
 * Shows AI routing information for dev accounts only.
 * Displays: model used, routing reason, token count, RAG status.
 *
 * Only visible to accounts in DEV_EMAILS (harsha@befach.com).
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Bug, Cpu, Brain, Image, Database, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllModels, getChatModels, type ModelConfig } from '@/lib/ai/models-config'
import type { RoutingDebugInfo } from '@/lib/ai/message-analyzer'

// =============================================================================
// TYPES
// =============================================================================

export interface DevDebugPanelProps {
  /** Is the user in dev mode? */
  isDevMode: boolean
  /** Current routing debug info */
  routingInfo?: RoutingDebugInfo | null
  /** Whether RAG context was used */
  ragUsed?: boolean
  /** Number of RAG items */
  ragItemCount?: number
  /** Current dev override model */
  devOverride?: string
  /** Callback when dev override changes */
  onDevOverrideChange?: (modelKey: string | undefined) => void
  /** Token usage from last request */
  tokenUsage?: {
    input: number
    output: number
  }
  /** Processing time in ms */
  processingTimeMs?: number
  /** Whether an image was analyzed */
  imageAnalyzed?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DevDebugPanel({
  isDevMode,
  routingInfo,
  ragUsed = false,
  ragItemCount = 0,
  devOverride,
  onDevOverrideChange,
  tokenUsage,
  processingTimeMs,
  imageAnalyzed = false,
}: DevDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Only render for dev accounts
  if (!isDevMode) return null

  const chatModels = getChatModels()

  // Routing reason badge color
  const getReasonBadgeVariant = (reason: string) => {
    switch (reason) {
      case 'image_detected':
        return 'default'
      case 'tool_required':
        return 'secondary'
      case 'deep_reasoning':
        return 'destructive'
      case 'large_context':
        return 'outline'
      case 'dev_override':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-between px-3 py-1 h-7 text-xs',
            'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
            'border border-yellow-500/30'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Bug className="h-3 w-3" />
            Dev Mode
            {routingInfo && (
              <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                {routingInfo.modelDisplayName}
              </Badge>
            )}
          </span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1">
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3 text-xs">
          {/* Model Override */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Model Override:
            </label>
            <Select
              value={devOverride || 'auto'}
              onValueChange={(value) =>
                onDevOverrideChange?.(value === 'auto' ? undefined : value)
              }
            >
              <SelectTrigger className="h-6 w-36 text-xs">
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (recommended)</SelectItem>
                {chatModels.map((model) => (
                  <SelectItem key={model.key} value={model.key}>
                    {model.icon} {model.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Routing Info */}
          {routingInfo && (
            <>
              <div className="border-t border-yellow-500/20 pt-2 space-y-1.5">
                {/* Model & Reason */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{routingInfo.modelDisplayName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <Badge variant={getReasonBadgeVariant(routingInfo.routingReason)}>
                    {routingInfo.routingReason}
                  </Badge>
                </div>

                {/* Explanation */}
                <div className="text-muted-foreground text-[10px] italic">
                  {routingInfo.explanation}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-1.5 border-t border-yellow-500/20 pt-2">
                {routingInfo.hasImages && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Image className="h-2.5 w-2.5" />
                    {routingInfo.imageCount} image(s)
                  </Badge>
                )}
                {routingInfo.needsTools && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    Tools
                  </Badge>
                )}
                {routingInfo.needsDeepReasoning && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Brain className="h-2.5 w-2.5" />
                    Deep Reasoning
                  </Badge>
                )}
                {routingInfo.isSlowModel && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Slow Model
                  </Badge>
                )}
                {imageAnalyzed && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Image className="h-2.5 w-2.5" />
                    Image Analyzed
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* RAG & Tokens */}
          <div className="flex items-center justify-between border-t border-yellow-500/20 pt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Database className="h-3 w-3" />
              RAG:
            </div>
            {ragUsed ? (
              <Badge variant="secondary" className="text-[10px]">
                {ragItemCount} items
              </Badge>
            ) : (
              <span className="text-muted-foreground">Not used</span>
            )}
          </div>

          {/* Token Usage */}
          {tokenUsage && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tokens:</span>
              <span className="font-mono text-[10px]">
                {tokenUsage.input.toLocaleString()} in / {tokenUsage.output.toLocaleString()} out
              </span>
            </div>
          )}

          {/* Context Tokens */}
          {routingInfo && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Est. Context:</span>
              <span className="font-mono text-[10px]">
                ~{routingInfo.estimatedTokens.toLocaleString()} tokens
              </span>
            </div>
          )}

          {/* Processing Time */}
          {processingTimeMs && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-mono text-[10px]">{processingTimeMs}ms</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// =============================================================================
// COMPACT VERSION (for message bubbles)
// =============================================================================

export interface DevDebugBadgeProps {
  modelName: string
  routingReason: string
  isSlowModel?: boolean
}

export function DevDebugBadge({ modelName, routingReason, isSlowModel }: DevDebugBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="font-medium">{modelName}</span>
      <span className="text-muted-foreground/50">•</span>
      <span>{routingReason}</span>
      {isSlowModel && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <Clock className="h-2.5 w-2.5 text-yellow-500" />
        </>
      )}
    </div>
  )
}
