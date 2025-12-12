'use client'

/**
 * Deep Thinking Indicator
 *
 * Shows a "Deep thinking..." animation when the AI is using a slow model
 * like DeepSeek V3.2 that requires extended thinking time.
 *
 * Features:
 * - Animated brain icon with pulse effect
 * - Progress dots animation
 * - Optional elapsed time display
 * - Smooth fade in/out transitions
 */

import { useEffect, useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface ThinkingIndicatorProps {
  /** Whether to show the indicator */
  isThinking: boolean
  /** Custom message (default: "Deep thinking...") */
  message?: string
  /** Show elapsed time */
  showElapsedTime?: boolean
  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal'
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// ANIMATED DOTS COMPONENT
// =============================================================================

function AnimatedDots() {
  return (
    <span className="inline-flex gap-0.5 ml-0.5">
      <span className="animate-bounce [animation-delay:-0.3s]">.</span>
      <span className="animate-bounce [animation-delay:-0.15s]">.</span>
      <span className="animate-bounce">.</span>
    </span>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ThinkingIndicator({
  isThinking,
  message = 'Deep thinking',
  showElapsedTime = true,
  variant = 'default',
  className,
}: ThinkingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Track elapsed time
  useEffect(() => {
    if (!isThinking) {
      setElapsedSeconds(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isThinking])

  // Don't render if not thinking
  if (!isThinking) return null

  // Format elapsed time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Minimal variant - just dots
  if (variant === 'minimal') {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        {message}
        <AnimatedDots />
      </span>
    )
  }

  // Compact variant - inline badge
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
          'bg-purple-500/10 text-purple-700 dark:text-purple-400',
          'text-xs font-medium',
          'animate-in fade-in duration-300',
          className
        )}
      >
        <Brain className="h-3 w-3 animate-pulse" />
        <span>
          {message}
          <AnimatedDots />
        </span>
        {showElapsedTime && elapsedSeconds > 0 && (
          <span className="text-muted-foreground text-[10px]">
            ({formatTime(elapsedSeconds)})
          </span>
        )}
      </div>
    )
  }

  // Default variant - full card
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent',
        'border border-purple-500/20',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {/* Animated Brain Icon */}
      <div className="relative">
        <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-purple-400 animate-ping" />
      </div>

      {/* Message */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
            {message}
            <AnimatedDots />
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Using extended thinking for complex analysis
        </p>
      </div>

      {/* Elapsed Time */}
      {showElapsedTime && elapsedSeconds > 0 && (
        <div className="text-right">
          <div className="text-sm font-mono text-purple-600 dark:text-purple-400">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-[10px] text-muted-foreground">elapsed</div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TYPING INDICATOR (for normal AI responses)
// =============================================================================

export interface TypingIndicatorProps {
  /** Whether to show the indicator */
  isTyping: boolean
  /** Model name (optional) */
  modelName?: string
  /** Additional CSS classes */
  className?: string
}

export function TypingIndicator({
  isTyping,
  modelName,
  className,
}: TypingIndicatorProps) {
  if (!isTyping) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        'animate-in fade-in duration-200',
        className
      )}
    >
      {/* Typing animation - three bouncing dots */}
      <div className="flex gap-1">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
      {modelName && <span className="text-xs">{modelName} is typing</span>}
    </div>
  )
}

// =============================================================================
// IMAGE ANALYSIS INDICATOR
// =============================================================================

export interface ImageAnalysisIndicatorProps {
  /** Whether analysis is in progress */
  isAnalyzing: boolean
  /** Number of images being analyzed */
  imageCount?: number
  /** Additional CSS classes */
  className?: string
}

export function ImageAnalysisIndicator({
  isAnalyzing,
  imageCount = 1,
  className,
}: ImageAnalysisIndicatorProps) {
  if (!isAnalyzing) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        'text-xs',
        'animate-in fade-in duration-200',
        className
      )}
    >
      <div className="relative">
        <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <span>
        Analyzing {imageCount > 1 ? `${imageCount} images` : 'image'}
        <AnimatedDots />
      </span>
    </div>
  )
}
