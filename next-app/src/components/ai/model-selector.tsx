'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, Zap, DollarSign, Clock } from 'lucide-react'
import { AIModel, getAllModels, formatCost, AI_MODELS } from '@/lib/ai/models'

interface ModelSelectorProps {
  selectedModel: string // Model ID (e.g., 'anthropic/claude-3.5-haiku')
  onModelChange: (modelId: string) => void
  showDetails?: boolean
  disabled?: boolean
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  showDetails = true,
  disabled = false,
}: ModelSelectorProps) {
  const models = getAllModels()
  const currentModel = models.find((model) => model.id === selectedModel)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">AI Model</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Choose the AI model for dependency suggestions. Different models offer
                different trade-offs between speed, quality, and cost.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Models</SelectLabel>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  {model.isDefault && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      DEFAULT
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {model.speed === 'fast' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Zap className="h-2 w-2 mr-0.5" />
                        Fast
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-muted-foreground"
                    >
                      {formatCost(model.costPer1M.input)}/M
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {showDetails && currentModel && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{currentModel.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentModel.provider} • {currentModel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Speed:</span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1 py-0 ${
                  currentModel.speed === 'fast'
                    ? 'text-green-600 border-green-600'
                    : currentModel.speed === 'medium'
                    ? 'text-yellow-600 border-yellow-600'
                    : 'text-red-600 border-red-600'
                }`}
              >
                {currentModel.speed.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-mono">
                {formatCost(currentModel.costPer1M.input)}/M in •{' '}
                {formatCost(currentModel.costPer1M.output)}/M out
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {currentModel.capabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact model selector (for inline use)
 */
export function CompactModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: Omit<ModelSelectorProps, 'showDetails'>) {
  return (
    <ModelSelector
      selectedModel={selectedModel}
      onModelChange={onModelChange}
      showDetails={false}
      disabled={disabled}
    />
  )
}

/**
 * Model comparison table (for settings page)
 */
export function ModelComparison() {
  const models = getAllModels()

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium">Model</th>
            <th className="px-4 py-3 text-left text-xs font-medium">Provider</th>
            <th className="px-4 py-3 text-left text-xs font-medium">Speed</th>
            <th className="px-4 py-3 text-right text-xs font-medium">Cost (Input)</th>
            <th className="px-4 py-3 text-right text-xs font-medium">Cost (Output)</th>
            <th className="px-4 py-3 text-left text-xs font-medium">Best For</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {models.map((model) => (
            <tr key={model.id} className="hover:bg-muted/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{model.name}</span>
                  {model.isDefault && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      DEFAULT
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {model.provider}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0.5 ${
                    model.speed === 'fast'
                      ? 'text-green-600 border-green-600'
                      : model.speed === 'medium'
                      ? 'text-yellow-600 border-yellow-600'
                      : 'text-red-600 border-red-600'
                  }`}
                >
                  {model.speed.toUpperCase()}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {formatCost(model.costPer1M.input)}/M
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {formatCost(model.costPer1M.output)}/M
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {model.capabilities[0]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
