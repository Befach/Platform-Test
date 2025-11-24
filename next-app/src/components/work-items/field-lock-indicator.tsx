'use client'

import { Lock } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FieldLockIndicatorProps {
  phase: string
  reason?: string
}

export function FieldLockIndicator({ phase, reason }: FieldLockIndicatorProps) {
  const defaultReason = `This field is locked in ${phase} phase`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center ml-2 cursor-help">
            <Lock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p className="text-sm max-w-xs">{reason || defaultReason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
