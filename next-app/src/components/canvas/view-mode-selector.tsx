'use client'

/**
 * View Mode Selector Component
 *
 * Allows users to switch between 4 view modes:
 * - Dependency View: Shows depends_on and blocks relationships
 * - Blocking View: Highlights blocking chains (mrtree layout)
 * - Hierarchical View: Parent-child relationships with strict layering
 * - Architecture View: System modules with stress algorithm
 */

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ViewMode, VIEW_MODE_CONFIGS } from './unified-canvas'

export interface ViewModeSelectorProps {
  selectedMode: ViewMode
  onModeChange: (mode: ViewMode) => void
  className?: string
}

export function ViewModeSelector({
  selectedMode,
  onModeChange,
  className,
}: ViewModeSelectorProps) {
  const viewModes: ViewMode[] = ['dependency', 'blocking', 'hierarchical', 'architecture']

  return (
    <div className={cn('flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border', className)}>
      <TooltipProvider delayDuration={300}>
        {viewModes.map((mode) => {
          const config = VIEW_MODE_CONFIGS[mode]
          const isActive = selectedMode === mode

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'gap-1.5 min-w-[100px] transition-all',
                    isActive && 'shadow-sm'
                  )}
                >
                  <span className="text-base">{config.icon}</span>
                  <span className="text-xs font-medium">{config.label.split(' ')[0]}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                  <div className="pt-1 border-t text-xs text-muted-foreground">
                    <span className="font-medium">Algorithm:</span> {config.algorithm}
                    <br />
                    <span className="font-medium">Shows:</span> {config.edgeFilter.join(', ')}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
