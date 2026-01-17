# Phase 6: UX Improvements

**Last Updated**: 2026-01-14
**Status**: Pending
**Branch**: `feat/ux-improvements`

[Back to AI Tool Architecture](README.md)

---

## Overview

**Files to create**: 7 React components in `next-app/src/components/ai/`
**Files to modify**: Chat component, orchestration hooks
**Estimated time**: 1 day
**Risk**: Low (UI-only changes)

### Problem Statement

Users have no visibility into:

- Why responses take longer sometimes (escalation happening)
- Model confidence levels
- When consensus mode is active
- Quality/speed tradeoffs available

This creates a "black box" experience that can feel slow or unpredictable.

### Solution

Implement transparent UX features:

1. **Thinking Status Indicator** - Show escalation progress
2. **Quality Mode Toggle** - User control over speed/quality
3. **Confidence Badge** - Show model certainty
4. **Consensus Display** - Show agreement levels
5. **Blind Comparison UI** - A/B/C picker for learning

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/ux-improvements
```

#### Step 2: Create UI Types

Create: `next-app/src/lib/ai/ui-types.ts`

```typescript
/**
 * AI UX Types
 * 
 * Types for AI-related UI components.
 */

/**
 * Response quality modes
 */
export type ResponseQuality = 'quick' | 'deep_reasoning' | 'auto'

/**
 * Chat settings controlled by user
 */
export interface ChatSettings {
  responseQuality: ResponseQuality
  showThinkingStatus: boolean  // Default: true
  allowEscalation: boolean     // Default: true
}

/**
 * Default chat settings
 */
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  responseQuality: 'auto',
  showThinkingStatus: true,
  allowEscalation: true,
}

/**
 * Thinking status stages
 */
export type ThinkingStage =
  | 'primary'
  | 'escalating'
  | 'consensus'
  | 'synthesizing'
  | 'complete'

/**
 * Thinking status for UI display
 */
export interface ThinkingStatus {
  stage: ThinkingStage
  message: string
  estimatedTime: number  // seconds remaining
  reason?: string        // Why escalation triggered
  modelsUsed?: string[]  // Which models are being queried
}

/**
 * Status messages by stage
 */
export const THINKING_MESSAGES: Record<ThinkingStage, string> = {
  primary: 'Thinking...',
  escalating: 'Thinking deeper for a better answer...',
  consensus: 'Getting multiple expert opinions...',
  synthesizing: 'Found different perspectives, synthesizing...',
  complete: 'Done!',
}

/**
 * Blind comparison option
 */
export interface BlindComparisonOption {
  id: string              // 'A', 'B', 'C'
  response: string
  // modelId is hidden until user picks
}

/**
 * Consensus claim for display
 */
export interface ConsensusClaim {
  claim: string
  agreementPercent: number  // 0-100
  modelCount: number        // How many models agree
}
```

#### Step 3: Create Thinking Status Hook

Create: `next-app/src/hooks/use-thinking-status.ts`

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ThinkingStatus, ThinkingStage } from '@/lib/ai/ui-types'

interface UseThinkingStatusReturn {
  status: ThinkingStatus | null
  isThinking: boolean
  setStage: (stage: ThinkingStage, reason?: string) => void
  reset: () => void
}

/**
 * Hook for managing thinking status UI
 */
export function useThinkingStatus(): UseThinkingStatusReturn {
  const [status, setStatus] = useState<ThinkingStatus | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)

  const setStage = useCallback((stage: ThinkingStage, reason?: string) => {
    const messages: Record<ThinkingStage, { message: string; time: number }> = {
      primary: { message: 'Thinking...', time: 2 },
      escalating: { message: 'Thinking deeper for a better answer...', time: 3 },
      consensus: { message: 'Getting multiple expert opinions...', time: 5 },
      synthesizing: { message: 'Found different perspectives, synthesizing...', time: 3 },
      complete: { message: 'Done!', time: 0 },
    }

    const { message, time } = messages[stage]

    setStatus({
      stage,
      message,
      estimatedTime: time,
      reason,
    })

    if (stage === 'primary') {
      setStartTime(Date.now())
    }
  }, [])

  const reset = useCallback(() => {
    setStatus(null)
    setStartTime(null)
  }, [])

  // Update estimated time countdown
  useEffect(() => {
    if (!status || status.stage === 'complete') return

    const interval = setInterval(() => {
      setStatus(prev => {
        if (!prev) return prev
        const newTime = Math.max(0, prev.estimatedTime - 1)
        return { ...prev, estimatedTime: newTime }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status?.stage])

  return {
    status,
    isThinking: status !== null && status.stage !== 'complete',
    setStage,
    reset,
  }
}
```

#### Step 4: Create Thinking Status Indicator Component

Create: `next-app/src/components/ai/thinking-status-indicator.tsx`

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Brain, Sparkles, Users } from 'lucide-react'
import type { ThinkingStatus, ThinkingStage } from '@/lib/ai/ui-types'

interface ThinkingStatusIndicatorProps {
  status: ThinkingStatus | null
  className?: string
}

const stageIcons: Record<ThinkingStage, React.ReactNode> = {
  primary: <Loader2 className="h-4 w-4 animate-spin" />,
  escalating: <Brain className="h-4 w-4 animate-pulse" />,
  consensus: <Users className="h-4 w-4 animate-pulse" />,
  synthesizing: <Sparkles className="h-4 w-4 animate-pulse" />,
  complete: null,
}

const stageColors: Record<ThinkingStage, string> = {
  primary: 'bg-blue-50 border-blue-200 text-blue-700',
  escalating: 'bg-purple-50 border-purple-200 text-purple-700',
  consensus: 'bg-amber-50 border-amber-200 text-amber-700',
  synthesizing: 'bg-green-50 border-green-200 text-green-700',
  complete: 'bg-gray-50 border-gray-200 text-gray-700',
}

export function ThinkingStatusIndicator({ status, className }: ThinkingStatusIndicatorProps) {
  return (
    <AnimatePresence>
      {status && status.stage !== 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className={`rounded-lg border p-3 ${stageColors[status.stage]} ${className}`}
        >
          <div className="flex items-center gap-2">
            {stageIcons[status.stage]}
            <span className="font-medium">{status.message}</span>
          </div>
          
          {status.reason && (
            <p className="mt-1 text-sm opacity-80 ml-6">
              {status.reason}
            </p>
          )}
          
          {status.estimatedTime > 0 && (
            <div className="mt-2 ml-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 bg-white/50 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-current rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: status.estimatedTime, ease: 'linear' }}
                  />
                </div>
                <span className="text-xs">~{status.estimatedTime}s</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

#### Step 5: Create Quality Mode Toggle Component

Create: `next-app/src/components/ai/quality-mode-toggle.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Zap, Brain, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ResponseQuality } from '@/lib/ai/ui-types'

interface QualityModeToggleProps {
  value: ResponseQuality
  onChange: (value: ResponseQuality) => void
  className?: string
}

const modes: Array<{
  value: ResponseQuality
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: 'quick',
    label: 'Quick',
    description: 'Fast responses, single model',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Smart escalation when needed',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    value: 'deep_reasoning',
    label: 'Deep Reasoning',
    description: 'Always use advanced reasoning',
    icon: <Brain className="h-4 w-4" />,
  },
]

export function QualityModeToggle({ value, onChange, className }: QualityModeToggleProps) {
  const currentMode = modes.find(m => m.value === value) || modes[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          {currentMode.icon}
          <span className="ml-1">{currentMode.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {modes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className="flex flex-col items-start gap-1 py-2"
          >
            <div className="flex items-center gap-2 font-medium">
              {mode.icon}
              {mode.label}
              {value === mode.value && (
                <span className="ml-auto text-xs text-green-600">Active</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground ml-6">
              {mode.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### Step 6: Create Confidence Indicator Component

Create: `next-app/src/components/ai/confidence-indicator.tsx`

```typescript
'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
  confidence: number // 0-1
  modelName?: string
  className?: string
}

export function ConfidenceIndicator({
  confidence,
  modelName,
  className,
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)
  
  const getColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-500'
    if (conf >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getLabel = (conf: number) => {
    if (conf >= 0.8) return 'High confidence'
    if (conf >= 0.6) return 'Medium confidence'
    return 'Low confidence'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1.5', className)}>
          <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getColor(confidence))}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{percentage}%</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{getLabel(confidence)}</p>
        {modelName && <p className="text-xs text-muted-foreground">Model: {modelName}</p>}
      </TooltipContent>
    </Tooltip>
  )
}
```

#### Step 7: Create Consensus Result Component

Create: `next-app/src/components/ai/consensus-result.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import type { ConsensusClaim } from '@/lib/ai/ui-types'

interface ConsensusResultProps {
  claims: ConsensusClaim[]
  overallAgreement: number // 0-1
  modelCount: number
  className?: string
}

export function ConsensusResult({
  claims,
  overallAgreement,
  modelCount,
  className,
}: ConsensusResultProps) {
  const percentage = Math.round(overallAgreement * 100)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>Consensus from {modelCount} models</span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              percentage >= 80
                ? 'bg-green-100 text-green-700'
                : percentage >= 60
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {percentage}% agreement
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {claims.map((claim, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-start gap-2">
              {claim.agreementPercent >= 80 ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              ) : claim.agreementPercent >= 50 ? (
                <HelpCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              )}
              <p className="text-sm">{claim.claim}</p>
            </div>
            <div className="ml-6 flex items-center gap-2">
              <Progress value={claim.agreementPercent} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">
                {claim.modelCount}/{modelCount} agree
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

#### Step 8: Create Blind Comparison Modal

Create: `next-app/src/components/ai/blind-comparison-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import type { BlindComparisonOption } from '@/lib/ai/ui-types'

interface BlindComparisonModalProps {
  open: boolean
  onClose: () => void
  options: BlindComparisonOption[]
  onSelect: (optionId: string) => void
}

export function BlindComparisonModal({
  open,
  onClose,
  options,
  onSelect,
}: BlindComparisonModalProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelected(id)
  }

  const handleSubmit = () => {
    if (selected) {
      onSelect(selected)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Which response is better?</DialogTitle>
          <DialogDescription>
            Help us improve by selecting the most helpful response.
            Your choice helps optimize future answers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {options.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                selected === option.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleSelect(option.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Response {option.id}</span>
                  {selected === option.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                  {option.response.slice(0, 300)}
                  {option.response.length > 300 && '...'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!selected}>
            Submit Choice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### Step 9: Create Deep Think Button

Create: `next-app/src/components/ai/deep-think-button.tsx`

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Brain } from 'lucide-react'

interface DeepThinkButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function DeepThinkButton({ onClick, disabled, className }: DeepThinkButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={className}
        >
          <Brain className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Deep Think</p>
        <p className="text-xs text-muted-foreground">
          Get multiple AI perspectives on this question
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
```

#### Step 10: Create Index Export

Create: `next-app/src/components/ai/index.ts`

```typescript
/**
 * AI UX Components Index
 */

export { ThinkingStatusIndicator } from './thinking-status-indicator'
export { QualityModeToggle } from './quality-mode-toggle'
export { ConfidenceIndicator } from './confidence-indicator'
export { ConsensusResult } from './consensus-result'
export { BlindComparisonModal } from './blind-comparison-modal'
export { DeepThinkButton } from './deep-think-button'
```

#### Step 11: Run TypeScript Check & Linter

```bash
cd next-app
npx tsc --noEmit
npm run lint
```

### Testing Plan

#### Test 1: Thinking Status

```typescript
// Render component
<ThinkingStatusIndicator status={{
  stage: 'escalating',
  message: 'Thinking deeper...',
  estimatedTime: 3,
  reason: 'Primary model confidence below threshold',
}} />

// Verify: Purple background, brain icon, countdown visible
```

#### Test 2: Quality Mode Toggle

```tsx
const [quality, setQuality] = useState<ResponseQuality>('auto')

<QualityModeToggle value={quality} onChange={setQuality} />

// Verify: Dropdown opens, selecting changes state
```

#### Test 3: Blind Comparison

```tsx
<BlindComparisonModal
  open={true}
  onClose={() => {}}
  options={[
    { id: 'A', response: 'Response A content...' },
    { id: 'B', response: 'Response B content...' },
    { id: 'C', response: 'Response C content...' },
  ]}
  onSelect={(id) => console.log('Selected:', id)}
/>

// Verify: Three cards shown, can select one, submit button works
```

### Commit & PR

```bash
git add next-app/src/lib/ai/ui-types.ts
git add next-app/src/hooks/use-thinking-status.ts
git add next-app/src/components/ai/
git commit -m "feat: add AI UX components for transparent orchestration

Add UI components for multi-model orchestration visibility:
- ThinkingStatusIndicator: Show escalation progress with stages
- QualityModeToggle: User control over Quick/Auto/Deep Reasoning
- ConfidenceIndicator: Visual confidence bar with tooltip
- ConsensusResult: Display agreement levels per claim
- BlindComparisonModal: A/B/C picker for learning mode
- DeepThinkButton: Trigger consensus mode manually

Supporting:
- ui-types.ts: Shared types for AI UI
- use-thinking-status.ts: Hook for status management

Benefits:
- Transparent AI behavior (no more black box)
- User control over speed/quality tradeoff
- Visual feedback during escalation
- Gamified learning via comparison picker"
```

### Expected Final State

After this phase:

| Component | Status |
|-----------|--------|
| Thinking indicator | Animated, color-coded by stage |
| Quality toggle | Dropdown with 3 modes |
| Confidence badge | Visual bar + percentage |
| Consensus display | Claims with agreement levels |
| Blind comparison | A/B/C card picker |
| Deep think button | Trigger consensus |

### Code Location Reference

```
next-app/src/components/ai/
├── thinking-status-indicator.tsx  # Animated status with progress
├── quality-mode-toggle.tsx        # Dropdown for Quick/Auto/Deep
├── confidence-indicator.tsx       # Visual confidence bar
├── consensus-result.tsx           # Agreement levels display
├── blind-comparison-modal.tsx     # A/B/C picker modal
├── deep-think-button.tsx          # Consensus trigger button
└── index.ts                       # Exports

next-app/src/lib/ai/
└── ui-types.ts                    # Shared UI types

next-app/src/hooks/
└── use-thinking-status.ts         # Status management hook
```

### Rollback Plan

```bash
git checkout main
git branch -D feat/ux-improvements
```

### Dependencies

- **Requires**: Phase 4 complete (orchestration provides status data)
- **Blocks**: None (final phase)

### Thinking Status Indicator

When Tier 2 escalation triggers, show transparent status:

```
+----------------------------------------------------------+
|  Thinking deeper...                                       |
|                                                          |
|  "The initial response wasn't confident enough.          |
|   Running additional reasoning to give you a better answer."|
|                                                          |
|  [Progress Bar]  ~3 more seconds                         |
+----------------------------------------------------------+
```

**Status Messages by Stage**:

| Stage | Message |
|-------|---------|
| Primary uncertain | "Thinking deeper for a better answer..." |
| Querying fallback | "Cross-checking with additional reasoning..." |
| Disagreement found | "Found different perspectives, synthesizing..." |
| Consensus running | "Getting multiple expert opinions..." |

### Quality Mode Toggle

Add toggle in chat settings:

| Setting | Behavior | Best For |
|---------|----------|----------|
| **Quick** | Single model, fast response | Simple questions, chat |
| **Deep Reasoning** | Always uses DeepSeek V3.2 | Strategy, planning, complex analysis |
| **Auto-escalate** | Escalates only when uncertain | Balance of speed + quality |

### UI Types

```typescript
interface ChatSettings {
  responseQuality: 'quick' | 'deep_reasoning' | 'auto';
  showThinkingStatus: boolean;  // Default: true
  allowEscalation: boolean;     // Default: true
}

interface ThinkingStatus {
  stage: 'primary' | 'escalating' | 'consensus' | 'synthesizing';
  message: string;
  estimatedTime: number;  // seconds
  reason?: string;        // Why escalation triggered
}
```

### UI Components Summary

```
next-app/src/components/ai/
+-- thinking-status-indicator.tsx  # Shows "Thinking deeper..." with progress
+-- quality-mode-toggle.tsx        # Quick / Deep Reasoning / Auto toggle
+-- deep-reasoning-badge.tsx       # Badge showing DeepSeek active
+-- consensus-result.tsx           # Display consensus with agreement levels
+-- blind-comparison-modal.tsx     # A/B/C picker UI
+-- confidence-indicator.tsx       # Model confidence badge
+-- deep-think-button.tsx          # Trigger consensus mode
```

---

## Cost Analysis

### Per-Query Cost Calculation

```
Input:  500 tokens x $0.40/M = $0.0002
Output: 1000 tokens x $1.50/M = $0.0015
Total: ~$0.002 per single-model query
```

### Monthly Cost by Tier

| Tier | Usage % | Queries | Models | Cost/Query | Subtotal |
|------|---------|---------|--------|------------|----------|
| **Smart Routing** | 80% | 40,000 | 1 | $0.002 | $80 |
| **Escalation** | 15% | 7,500 | 1.3 avg | $0.0026 | $20 |
| **Consensus** | 5% | 2,500 | 3.5 avg | $0.007 | $17.50 |
| **Blind Compare** | 5% sample | 2,500 | 3 | $0.006 | $15 |
| | | | | **Subtotal** | **$132.50** |
| | | | | **+40% buffer** | **$185.50** |
| | | | | **+5.5% OpenRouter fee** | **$195.70** |

### Cost by Team Size

| Team Size | Queries/Month | Total Cost |
|-----------|---------------|------------|
| 5 people (startup) | 5,000 | ~$20/mo |
| 10 people (small) | 10,000 | ~$40/mo |
| 25 people (medium) | 25,000 | ~$100/mo |
| 50 people (large) | 50,000 | ~$200/mo |
| 100 people (enterprise) | 100,000 | ~$400/mo |

**Cost per seat**: ~$4/user/month (at scale)

### Cost Comparison (vs Current)

---

[Back to AI Tool Architecture](README.md) | [Previous: Phase 5](phase-5-agent-memory.md)
