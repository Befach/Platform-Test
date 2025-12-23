'use client'

/**
 * AlignmentStrengthIndicator Component
 *
 * Visual indicator showing strategy alignment strength:
 * - Weak (amber): Minor contribution to strategy
 * - Medium (blue): Moderate contribution
 * - Strong (green): Major contribution
 *
 * Variants:
 * - badge: Colored badge with optional label
 * - dot: Simple colored dot
 * - bar: Progress-style bar
 */

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getAlignmentStrengthLabel } from '@/lib/types/strategy'
import type { AlignmentStrength } from '@/lib/types/strategy'

// Strength configuration
const STRENGTH_CONFIG: Record<
  AlignmentStrength,
  {
    color: string
    bgColor: string
    borderColor: string
    barWidth: string
    description: string
  }
> = {
  weak: {
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    barWidth: '33%',
    description: 'Minor contribution to this strategy',
  },
  medium: {
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    barWidth: '66%',
    description: 'Moderate contribution to this strategy',
  },
  strong: {
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    barWidth: '100%',
    description: 'Major contribution to this strategy',
  },
}

interface AlignmentStrengthIndicatorProps {
  strength: AlignmentStrength
  variant?: 'badge' | 'dot' | 'bar'
  showLabel?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AlignmentStrengthIndicator({
  strength,
  variant = 'badge',
  showLabel = true,
  showTooltip = true,
  size = 'md',
  className,
}: AlignmentStrengthIndicatorProps) {
  const config = STRENGTH_CONFIG[strength]
  const label = getAlignmentStrengthLabel(strength)

  // Size configurations
  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      badge: 'text-xs px-1.5 py-0',
      bar: 'h-1',
      barContainer: 'w-12',
    },
    md: {
      dot: 'w-2.5 h-2.5',
      badge: 'text-xs px-2 py-0.5',
      bar: 'h-1.5',
      barContainer: 'w-16',
    },
    lg: {
      dot: 'w-3 h-3',
      badge: 'text-sm px-2.5 py-1',
      bar: 'h-2',
      barContainer: 'w-20',
    },
  }

  const sizes = sizeConfig[size]

  const content = (() => {
    switch (variant) {
      case 'dot':
        return (
          <div
            className={cn(
              'rounded-full',
              sizes.dot,
              config.bgColor,
              'ring-1',
              config.borderColor,
              className
            )}
          />
        )

      case 'bar':
        return (
          <div
            className={cn(
              'rounded-full bg-muted overflow-hidden',
              sizes.barContainer,
              sizes.bar,
              className
            )}
          >
            <div
              className={cn('h-full rounded-full transition-all', config.bgColor)}
              style={{ width: config.barWidth }}
            />
          </div>
        )

      case 'badge':
      default:
        return (
          <Badge
            variant="outline"
            className={cn(
              sizes.badge,
              config.color,
              config.bgColor,
              config.borderColor,
              'font-medium',
              className
            )}
          >
            {showLabel ? label : label.charAt(0).toUpperCase()}
          </Badge>
        )
    }
  })()

  if (!showTooltip) {
    return content
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">{label} Alignment</p>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Alignment strength selector for forms
 */
interface AlignmentStrengthSelectorProps {
  value: AlignmentStrength
  onChange: (strength: AlignmentStrength) => void
  disabled?: boolean
  className?: string
}

export function AlignmentStrengthSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AlignmentStrengthSelectorProps) {
  const strengths: AlignmentStrength[] = ['weak', 'medium', 'strong']

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {strengths.map((strength) => {
        const config = STRENGTH_CONFIG[strength]
        const isSelected = value === strength

        return (
          <button
            key={strength}
            type="button"
            disabled={disabled}
            onClick={() => onChange(strength)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              'border',
              isSelected
                ? cn(config.bgColor, config.color, config.borderColor)
                : 'border-muted bg-background text-muted-foreground hover:bg-muted',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {getAlignmentStrengthLabel(strength)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Get strength color for external use
 */
export function getStrengthColor(strength: AlignmentStrength): string {
  return STRENGTH_CONFIG[strength].color
}

/**
 * Get strength background color for external use
 */
export function getStrengthBgColor(strength: AlignmentStrength): string {
  return STRENGTH_CONFIG[strength].bgColor
}
