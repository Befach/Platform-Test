'use client'

/**
 * AI Alignment Suggestions Component
 *
 * UI for generating and applying AI-powered strategy alignment suggestions.
 * Allows users to:
 * - Select AI model
 * - Generate alignment suggestions
 * - Review and selectively approve suggestions
 * - See usage/cost information
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Check,
  ArrowRight,
  Sparkles,
  DollarSign,
  Zap,
  Target,
  Flag,
  TrendingUp,
  Lightbulb,
  Rocket,
  Bug,
  FileText,
} from 'lucide-react'
import { ModelSelector } from '@/components/ai/model-selector'
import { getDefaultModel, formatCost } from '@/lib/ai/models'
import { useToast } from '@/hooks/use-toast'
import { useBatchAlignSuggestions } from '@/lib/hooks/use-strategies'
import type { AlignmentStrength } from '@/lib/types/strategy'

interface AlignmentSuggestion {
  workItemId: string
  strategyId: string
  confidence: number
  reason: string
  alignmentStrength: AlignmentStrength
  workItem: {
    id: string
    name: string
    type: string
  } | null
  strategy: {
    id: string
    title: string
    type: string
  } | null
}

interface UsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
}

interface ModelInfo {
  key: string
  name: string
  provider: string
}

interface AIAlignmentSuggestionsProps {
  teamId: string
  workspaceId?: string
  onSuggestionsApplied?: () => void
}

// Strategy type icons
const strategyTypeIcons: Record<string, React.ElementType> = {
  pillar: Flag,
  objective: Target,
  key_result: TrendingUp,
  initiative: Lightbulb,
}

// Work item type icons
const workItemTypeIcons: Record<string, React.ElementType> = {
  concept: Lightbulb,
  feature: Rocket,
  bug: Bug,
  research: FileText,
}

// Strategy type colors
const strategyTypeColors: Record<string, string> = {
  pillar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  objective: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  key_result: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  initiative: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

// Alignment strength colors
const strengthColors: Record<AlignmentStrength, string> = {
  weak: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  strong: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function AIAlignmentSuggestions({
  teamId,
  workspaceId,
  onSuggestionsApplied,
}: AIAlignmentSuggestionsProps) {
  const { toast } = useToast()
  const batchAlignMutation = useBatchAlignSuggestions()

  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AlignmentSuggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [model, setModel] = useState<ModelInfo | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const handleGenerateSuggestions = async () => {
    try {
      setLoading(true)
      setSuggestions([])
      setSelectedSuggestions(new Set())
      setUsage(null)

      // Get the model key from selected model ID
      const { AI_MODELS } = await import('@/lib/ai/models')
      const modelKey =
        Object.entries(AI_MODELS).find(([_, m]) => m.id === selectedModel)?.[0] ||
        'claude-haiku-45'

      const response = await fetch('/api/ai/strategies/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          workspace_id: workspaceId,
          model_key: modelKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate suggestions')
      }

      const data = await response.json()

      setSuggestions(data.suggestions || [])
      setUsage(data.usage)
      setModel(data.model)

      if (data.suggestions.length === 0) {
        toast({
          title: 'No suggestions found',
          description:
            data.message ||
            'All work items may already be aligned, or there are no active strategies.',
        })
      } else {
        toast({
          title: `Found ${data.suggestions.length} alignment suggestions`,
          description: `Analyzed ${data.analyzedWorkItems} work items across ${data.availableStrategies} strategies`,
        })
      }
    } catch (error: unknown) {
      console.error('Error generating AI suggestions:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate suggestions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedSuggestions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set())
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, index) => index)))
    }
  }

  const handleApproveSelected = async () => {
    const approvedSuggestions = Array.from(selectedSuggestions)
      .map((index) => suggestions[index])
      .filter(Boolean)

    if (approvedSuggestions.length === 0) {
      toast({
        title: 'No suggestions selected',
        description: 'Please select at least one suggestion to approve.',
        variant: 'destructive',
      })
      return
    }

    setIsApproving(true)
    try {
      await batchAlignMutation.mutateAsync({
        suggestions: approvedSuggestions.map((s) => ({
          workItemId: s.workItemId,
          strategyId: s.strategyId,
          alignmentStrength: s.alignmentStrength,
          isPrimary: true,
        })),
      })

      // Remove approved suggestions from the list
      const remainingSuggestions = suggestions.filter(
        (_, index) => !selectedSuggestions.has(index)
      )
      setSuggestions(remainingSuggestions)
      setSelectedSuggestions(new Set())

      toast({
        title: 'Alignments created',
        description: `Added ${approvedSuggestions.length} strategy alignment${
          approvedSuggestions.length > 1 ? 's' : ''
        }`,
      })

      onSuggestionsApplied?.()
    } catch (error: unknown) {
      console.error('Error approving suggestions:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create alignments',
        variant: 'destructive',
      })
    } finally {
      setIsApproving(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 border-green-600'
    if (confidence >= 0.6) return 'text-yellow-600 border-yellow-600'
    return 'text-red-600 border-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Generate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            AI Strategy Alignment
          </CardTitle>
          <CardDescription>
            Use AI to suggest alignments between work items and your product strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            showDetails={true}
            disabled={loading}
          />

          <Button
            onClick={handleGenerateSuggestions}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing work items...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Alignment Suggestions
              </>
            )}
          </Button>

          {/* Usage info */}
          {usage && model && (
            <Alert>
              <AlertDescription className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-mono font-medium">{formatCost(usage.costUsd)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {usage.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Suggestions ({suggestions.length})</CardTitle>
                <CardDescription>
                  Review and approve AI-generated strategy alignments
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedSuggestions.size === suggestions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <Button
                  onClick={handleApproveSelected}
                  disabled={selectedSuggestions.size === 0 || isApproving}
                  size="sm"
                >
                  {isApproving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve Selected ({selectedSuggestions.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const WorkItemIcon =
                workItemTypeIcons[suggestion.workItem?.type || 'feature'] || Rocket
              const StrategyIcon =
                strategyTypeIcons[suggestion.strategy?.type || 'objective'] || Target
              const isSelected = selectedSuggestions.has(index)

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleToggleSuggestion(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSuggestion(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />

                      <div className="flex-1 space-y-2">
                        {/* Work Item → Strategy */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <WorkItemIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {suggestion.workItem?.name || 'Unknown'}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {suggestion.workItem?.type || 'feature'}
                            </Badge>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />

                          <div className="flex items-center gap-2">
                            <StrategyIcon
                              className="h-4 w-4"
                              style={{
                                color:
                                  suggestion.strategy?.type === 'pillar'
                                    ? '#6366f1'
                                    : suggestion.strategy?.type === 'objective'
                                    ? '#8b5cf6'
                                    : suggestion.strategy?.type === 'key_result'
                                    ? '#06b6d4'
                                    : '#10b981',
                              }}
                            />
                            <span className="font-medium text-sm">
                              {suggestion.strategy?.title || 'Unknown'}
                            </span>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${
                                strategyTypeColors[suggestion.strategy?.type || 'objective']
                              }`}
                            >
                              {suggestion.strategy?.type?.replace('_', ' ') || 'objective'}
                            </Badge>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0.5 ${getConfidenceColor(
                              suggestion.confidence
                            )}`}
                          >
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Badge>
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${
                              strengthColors[suggestion.alignmentStrength]
                            }`}
                          >
                            {suggestion.alignmentStrength} alignment
                          </Badge>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state after generation with no results */}
      {!loading && suggestions.length === 0 && usage && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No suggestions available</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            All your work items may already be aligned to strategies, or there are no unaligned
            work items to analyze. Try adding more work items or creating new strategies.
          </p>
        </Card>
      )}
    </div>
  )
}
