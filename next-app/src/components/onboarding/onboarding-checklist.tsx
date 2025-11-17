'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

interface OnboardingChecklistProps {
  items: ChecklistItem[]
  onItemComplete?: (itemId: string) => void
  onDismiss?: () => void
  className?: string
}

export function OnboardingChecklist({
  items,
  onItemComplete,
  onDismiss,
  className,
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = (completedCount / totalCount) * 100
  const isComplete = completedCount === totalCount

  if (isComplete && onDismiss) {
    return null // Auto-hide when complete
  }

  return (
    <Card className={cn('border-2 border-primary/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Getting Started</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {completedCount} of {totalCount} completed
              </span>
              <div className="flex-1 max-w-[120px]">
                <Progress value={progress} className="h-1.5" />
              </div>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-all',
                item.completed
                  ? 'bg-muted/50 border-muted'
                  : 'bg-background hover:bg-accent/50'
              )}
            >
              <button
                onClick={() => !item.completed && onItemComplete?.(item.id)}
                className={cn(
                  'mt-0.5 flex-shrink-0 transition-colors',
                  item.completed
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
                disabled={item.completed}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    'font-medium text-sm mb-0.5',
                    item.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {item.description}
                </p>

                {!item.completed && item.action && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={item.action.onClick}
                    asChild={!!item.action.href}
                  >
                    {item.action.href ? (
                      <a href={item.action.href}>{item.action.label}</a>
                    ) : (
                      <span>{item.action.label}</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isComplete && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-semibold text-sm mb-1">All set!</p>
              <p className="text-xs text-muted-foreground">
                You've completed the onboarding checklist. Start building amazing products!
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
