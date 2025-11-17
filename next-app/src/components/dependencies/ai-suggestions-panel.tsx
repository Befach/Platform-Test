'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, X, ArrowRight, Sparkles, DollarSign, Zap } from 'lucide-react'
import { ModelSelector } from '@/components/ai/model-selector'
import { getDefaultModel, formatCost, type AIModel } from '@/lib/ai/models'
import { toast } from 'sonner'

interface AISuggestion {
  sourceId: string
  targetId: string
  connectionType: 'dependency' | 'blocks' | 'complements' | 'relates_to'
  reason: string
  confidence: number
  strength: number
  sourceWorkItem: {
    id: string
    name: string
    type: string
  } | null
  targetWorkItem: {
    id: string
    name: string
    type: string
  } | null
}

interface AISuggestionsPanelProps {
  workspaceId: string
  onApprove: (suggestions: AISuggestion[]) => Promise<void>
  disabled?: boolean
}

export function AISuggestionsPanel({
  workspaceId,
  onApprove,
  disabled = false,
}: AISuggestionsPanelProps) {
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [usage, setUsage] = useState<{
    promptTokens: number
    completionTokens: number
    totalTokens: number
    costUsd: number
  } | null>(null)
  const [model, setModel] = useState<{
    key: string
    name: string
    provider: string
  } | null>(null)

  const handleGenerateSuggestions = async () => {
    try {
      setLoading(true)
      setSuggestions([])
      setSelectedSuggestions(new Set())
      setUsage(null)

      const response = await fetch('/api/ai/dependencies/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          model_key: Object.entries(
            await import('@/lib/ai/models').then((m) => m.AI_MODELS)
          ).find(([_, model]) => model.id === selectedModel)?.[0] || 'claude-haiku-45',
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
        toast.info('No new dependency suggestions found', {
          description: 'All potential dependencies may already exist, or there are not enough work items to analyze.',
        })
      } else {
        toast.success(`Found ${data.suggestions.length} dependency suggestions`, {
          description: `Analyzed ${data.analyzedWorkItems} work items using ${data.model.name}`,
        })
      }
    } catch (error: any) {
      console.error('Error generating AI suggestions:', error)
      toast.error('Failed to generate suggestions', {
        description: error.message,
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
      toast.error('No suggestions selected')
      return
    }

    try {
      await onApprove(approvedSuggestions)

      // Remove approved suggestions from the list
      const remainingSuggestions = suggestions.filter((_, index) => !selectedSuggestions.has(index))
      setSuggestions(remainingSuggestions)
      setSelectedSuggestions(new Set())

      toast.success(`Added ${approvedSuggestions.length} dependency connection${approvedSuggestions.length > 1 ? 's' : ''}`)
    } catch (error: any) {
      console.error('Error approving suggestions:', error)
      toast.error('Failed to add connections', {
        description: error.message,
      })
    }
  }

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'dependency':
        return 'bg-blue-500'
      case 'blocks':
        return 'bg-red-500'
      case 'complements':
        return 'bg-green-500'
      case 'relates_to':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getConnectionTypeLabel = (type: string) => {
    switch (type) {
      case 'dependency':
        return 'Depends On'
      case 'blocks':
        return 'Blocks'
      case 'complements':
        return 'Complements'
      case 'relates_to':
        return 'Relates To'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Dependency Suggestions
          </CardTitle>
          <CardDescription>
            Use AI to automatically detect dependencies between your work items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            showDetails={true}
            disabled={loading || disabled}
          />

          <Button
            onClick={handleGenerateSuggestions}
            disabled={loading || disabled}
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
                Generate AI Suggestions
              </>
            )}
          </Button>

          {usage && model && (
            <Alert>
              <AlertDescription className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
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

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Suggestions ({suggestions.length})</CardTitle>
                <CardDescription>
                  Review and approve AI-generated dependency connections
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={disabled}
                >
                  {selectedSuggestions.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleApproveSelected}
                  disabled={selectedSuggestions.size === 0 || disabled}
                  size="sm"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Selected ({selectedSuggestions.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  selectedSuggestions.has(index)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => handleToggleSuggestion(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="font-medium text-sm">
                            {suggestion.sourceWorkItem?.name || 'Unknown'}
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {suggestion.sourceWorkItem?.type || 'Feature'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`h-0.5 w-8 ${getConnectionTypeColor(suggestion.connectionType)}`} />
                          <ArrowRight className={`h-4 w-4 ${getConnectionTypeColor(suggestion.connectionType).replace('bg-', 'text-')}`} />
                          <div className={`h-0.5 w-8 ${getConnectionTypeColor(suggestion.connectionType)}`} />
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {suggestion.targetWorkItem?.type || 'Feature'}
                          </Badge>
                          <div className="font-medium text-sm text-right">
                            {suggestion.targetWorkItem?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${getConnectionTypeColor(suggestion.connectionType).replace('bg-', 'text-')} border-current`}
                        >
                          {getConnectionTypeLabel(suggestion.connectionType)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${
                            suggestion.confidence >= 0.8
                              ? 'text-green-600 border-green-600'
                              : suggestion.confidence >= 0.6
                              ? 'text-yellow-600 border-yellow-600'
                              : 'text-red-600 border-red-600'
                          }`}
                        >
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          selectedSuggestions.has(index)
                            ? 'bg-primary text-primary-foreground'
                            : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleSuggestion(index)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
