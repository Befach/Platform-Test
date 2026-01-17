# Phase 2: Model Routing Config

**Last Updated**: 2026-01-14
**Status**: Complete (2026-01-08)
**Branch**: `feat/model-routing-config`

[Back to AI Tool Architecture](README.md)

---

## Overview

**Files to modify**:

- `next-app/src/lib/ai/models-config.ts`
- `next-app/src/lib/ai/ai-sdk-client.ts`

**Risk**: Low-Medium (adding new models, updating routing config)

---

## Problem Statement

The current model registry only has 5 models:

- Kimi K2 Thinking (default)
- Claude Haiku 4.5 (tools)
- DeepSeek V3.2 (reasoning)
- Grok 4 Fast (large context)
- Gemini 2.5 Flash (vision)

We need to add 3 new high-performance models and create a routing system with fallback chains:

- **GLM 4.7** - Best for strategic reasoning + agentic tool use
- **MiniMax M2.1** - Best for coding tasks
- **Gemini 3 Flash** - Upgraded vision with better reasoning

---

## Solution

Add 3 new models to the registry with proper capability flags, and create a `MODEL_ROUTING` config that defines fallback chains for each capability type.

---

## New Models to Add

| Model | OpenRouter ID | Use For | Cost | Context |
|-------|---------------|---------|------|---------|
| **GLM 4.7** | `z-ai/glm-4.7` | Strategic reasoning + Agentic | $0.40/$1.50 | 128K |
| **MiniMax M2.1** | `minimax/minimax-m2.1` | Coding | $0.30/$1.20 | 128K |
| **Gemini 3 Flash** | `google/gemini-3-flash-preview` | Visual reasoning (upgraded) | $0.50/$3.00 | 1M |

---

## Step-by-Step Implementation

### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/model-routing-config
```

### Step 2: Add New Models to Registry

Open: `next-app/src/lib/ai/models-config.ts`

Navigate to line **274** (after Gemini Flash entry, before closing bracket of `MODEL_REGISTRY`).

Insert these 3 new model entries:

```typescript
  // ─────────────────────────────────────────────────────────────────────────
  // GLM 4.7 - STRATEGIC REASONING + AGENTIC (Best HLE score, best GPQA)
  // Routes here for complex planning, analysis, multi-step tool execution
  // Features: Interleaved thinking (reasons BEFORE each tool call)
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: 'glm-4.7',
    provider: 'openrouter',
    modelId: 'z-ai/glm-4.7',
    displayName: 'GLM 4.7',
    icon: '🎯',
    capabilities: ['reasoning', 'tool_use', 'quality'],
    contextLimit: 128_000,
    compactAt: 102_400, // 80% of 128K
    costPer1M: { input: 0.40, output: 1.50 },
    providerSettings: {
      // Enable interleaved thinking for better tool use
      reasoning: { include: true, effort: 'high' }
    },
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    isSlowModel: false,
    priority: { vision: 99, tools: 1, reasoning: 1, default: 2 }, // Best for tools + reasoning
    role: 'chat',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax M2.1 - CODING SPECIALIST (Best coding benchmarks)
  // Routes here for code generation, debugging, refactoring
  // Optimized for: Rust, Go, C++, Python, TypeScript
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: 'minimax-m2.1',
    provider: 'openrouter',
    modelId: 'minimax/minimax-m2.1',
    displayName: 'MiniMax M2.1',
    icon: '💻',
    capabilities: ['cost_effective', 'speed'],
    contextLimit: 128_000,
    compactAt: 102_400, // 80% of 128K
    costPer1M: { input: 0.30, output: 1.20 },
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 99, tools: 4, reasoning: 5, default: 5 },
    role: 'chat',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Gemini 3 Flash - UPGRADED VISION + REASONING
  // Replaces Gemini 2.5 Flash for vision tasks with better reasoning
  // 1M context window, video analysis support
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: 'gemini-3-flash',
    provider: 'openrouter',
    modelId: 'google/gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    icon: '👁️‍🗨️',
    capabilities: ['vision', 'large_context', 'speed'],
    contextLimit: 1_000_000,
    compactAt: 800_000, // 80% of 1M
    costPer1M: { input: 0.50, output: 3.00 },
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    isSlowModel: false,
    priority: { vision: 1, tools: 3, reasoning: 3, default: 4 }, // Best for vision
    role: 'vision', // Primary vision model (replaces Gemini 2.5)
  },
```

### Step 3: Add Model Routing Configuration

After the `MODEL_REGISTRY` array (around line 340), add the routing configuration:

```typescript
// =============================================================================
// MODEL ROUTING CONFIGURATION
// =============================================================================

/**
 * Fallback chain configuration for each capability type
 *
 * When primary model fails or is uncertain, automatically try fallback chain.
 * Each chain optimized for specific task types.
 */
export const MODEL_ROUTING = {
  /**
   * Strategic Reasoning - Complex analysis, planning, knowledge queries
   * GLM 4.7 has best HLE and GPQA scores
   */
  strategic_reasoning: {
    primary: 'z-ai/glm-4.7',
    fallback: 'deepseek/deepseek-v3.2:nitro',
    tertiary: 'google/gemini-3-flash-preview',
    features: ['interleaved_thinking', 'preserved_thinking'],
    bestFor: ['planning', 'analysis', 'knowledge_queries', 'reasoning'],
  },

  /**
   * Agentic Tool Use - Multi-step tool execution
   * GLM 4.7 has best agentic benchmark scores
   */
  agentic_tool_use: {
    primary: 'z-ai/glm-4.7',
    fallback: 'google/gemini-3-flash-preview',
    tertiary: 'minimax/minimax-m2.1',
    features: ['interleaved_thinking'],
    bestFor: ['tool_selection', 'multi_step_execution'],
  },

  /**
   * Coding - Code generation, debugging, refactoring
   * MiniMax M2.1 has best coding benchmark scores
   */
  coding: {
    primary: 'minimax/minimax-m2.1',
    fallback: 'z-ai/glm-4.7',
    tertiary: 'moonshotai/kimi-k2-thinking:nitro',
    bestFor: ['code_generation', 'debugging', 'refactoring'],
  },

  /**
   * Visual Reasoning - Image analysis, multimodal
   * Gemini 3 Flash has best vision capabilities
   */
  visual_reasoning: {
    primary: 'google/gemini-3-flash-preview',
    fallback: 'x-ai/grok-4-fast:nitro',
    tertiary: 'google/gemini-2.5-flash-preview', // Legacy fallback
    bestFor: ['image_analysis', 'visual_reasoning', 'video_analysis'],
  },

  /**
   * Large Context - Documents >200K tokens
   * Grok 4 Fast has 2M context, Gemini 3 Flash has 1M
   */
  large_context: {
    primary: 'x-ai/grok-4-fast:nitro',
    fallback: 'google/gemini-3-flash-preview',
    tertiary: 'moonshotai/kimi-k2-thinking:nitro',
    contextWindows: { primary: '2M', fallback: '1M', tertiary: '262K' },
  },

  /**
   * Default Chat - General conversation
   * Kimi K2 is cheapest with good quality
   */
  default: {
    primary: 'moonshotai/kimi-k2-thinking:nitro',
    fallback: 'z-ai/glm-4.7',
    tertiary: 'minimax/minimax-m2.1',
    bestFor: ['general_chat', 'customer_interaction'],
  },
} as const

export type RoutingCapability = keyof typeof MODEL_ROUTING

/**
 * Get the routing chain for a capability
 */
export function getRoutingChain(capability: RoutingCapability) {
  return MODEL_ROUTING[capability]
}

/**
 * Get primary model for a capability
 */
export function getPrimaryModelForCapability(capability: RoutingCapability): string {
  return MODEL_ROUTING[capability].primary
}
```

### Step 4: Update AI SDK Client

Open: `next-app/src/lib/ai/ai-sdk-client.ts`

Add the new models after line 76 (after `deepseekV32` entry):

```typescript
  /**
   * GLM 4.7 (NEW - Strategic Reasoning + Agentic)
   * Best HLE score, best GPQA score, best agentic benchmarks
   * Cost: $0.40/M input, $1.50/M output
   * Features: Interleaved thinking (reasons before each tool call)
   */
  glm47: openrouter('z-ai/glm-4.7', {
    provider: {
      data_collection: 'deny',
    },
    // Enable reasoning for better tool use
    reasoning: { include: true, effort: 'high' },
  }),

  /**
   * MiniMax M2.1 (NEW - Coding Specialist)
   * Best coding benchmark scores
   * Cost: $0.30/M input, $1.20/M output
   * Optimized for: Rust, Go, C++, Python, TypeScript
   */
  minimaxM21: openrouter('minimax/minimax-m2.1', defaultProviderSettings),

  /**
   * Gemini 3 Flash (NEW - Upgraded Vision)
   * Replaces Gemini 2.5 Flash with better reasoning
   * Cost: $0.50/M input, $3.00/M output
   * Context: 1M tokens, video analysis support
   */
  gemini3Flash: openrouter('google/gemini-3-flash-preview', defaultProviderSettings),
```

Update the `recommendedModels` object (around line 82):

```typescript
export const recommendedModels = {
  /** Fast responses, real-time data (Grok 4) */
  speed: aiModels.grok4Fast,

  /** Best reasoning quality (GLM 4.7 - NEW) */
  quality: aiModels.glm47,

  /** Lowest cost (Kimi K2) */
  cost: aiModels.kimiK2,

  /** Deep reasoning with thinking traces (DeepSeek V3.2) */
  thinking: aiModels.deepseekV32,

  /** Default model for most tasks */
  default: aiModels.kimiK2,

  /** Agentic workflows with tool calling (GLM 4.7 - NEW) */
  agentic: aiModels.glm47,

  /** Complex multi-step tasks (GLM 4.7 - NEW) */
  complex: aiModels.glm47,

  /** Coding tasks (MiniMax M2.1 - NEW) */
  coding: aiModels.minimaxM21,

  /** Vision/image analysis (Gemini 3 Flash - NEW) */
  vision: aiModels.gemini3Flash,
} as const
```

Update the `modelIdMap` (around line 126):

```typescript
export const modelIdMap: Record<string, LanguageModel> = {
  'anthropic/claude-haiku-4.5:nitro': aiModels.claudeHaiku,
  'x-ai/grok-4-fast:nitro': aiModels.grok4Fast,
  'moonshotai/kimi-k2-thinking:nitro': aiModels.kimiK2,
  'deepseek/deepseek-v3.2:nitro': aiModels.deepseekV32,
  // NEW MODELS
  'z-ai/glm-4.7': aiModels.glm47,
  'minimax/minimax-m2.1': aiModels.minimaxM21,
  'google/gemini-3-flash-preview': aiModels.gemini3Flash,
}
```

### Step 5: Add Fallback Chain Utility

Create new file: `next-app/src/lib/ai/fallback-chain.ts`

```typescript
/**
 * Fallback Chain Utility
 *
 * Provides automatic model fallback when primary model fails.
 * Uses AI SDK's experimental_fallback for seamless switching.
 */

import { experimental_fallback as fallback } from 'ai'
import { openrouter } from './ai-sdk-client'
import { MODEL_ROUTING, type RoutingCapability } from './models-config'

/**
 * Create a fallback chain for a capability
 *
 * Usage:
 * ```typescript
 * const model = createFallbackChain('strategic_reasoning')
 * // Will try GLM 4.7 -> DeepSeek V3.2 -> Gemini 3 Flash
 * ```
 */
export function createFallbackChain(capability: RoutingCapability) {
  const routing = MODEL_ROUTING[capability]

  return fallback([
    openrouter(routing.primary),
    openrouter(routing.fallback),
    openrouter(routing.tertiary),
  ])
}

/**
 * Create a fallback chain with custom models
 */
export function createCustomFallbackChain(modelIds: string[]) {
  return fallback(modelIds.map(id => openrouter(id)))
}

/**
 * Get the fallback order for logging/debugging
 */
export function getFallbackOrder(capability: RoutingCapability): string[] {
  const routing = MODEL_ROUTING[capability]
  return [routing.primary, routing.fallback, routing.tertiary]
}
```

### Step 6: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

Fix any type errors.

### Step 7: Run Linter

```bash
npm run lint
```

Fix any linting issues.

---

## Testing Plan

### Manual Test 1: New Model Access

```bash
# Test that each new model is accessible via OpenRouter
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-ai/glm-4.7",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Repeat for `minimax/minimax-m2.1` and `google/gemini-3-flash-preview`.

### Manual Test 2: Model Registry

1. Start dev server: `npm run dev`
2. Open browser console
3. Import and test:

```javascript
import { getModelByKey, MODEL_ROUTING } from '@/lib/ai/models-config'

// Test new models are in registry
console.log(getModelByKey('glm-4.7'))       // Should return GLM 4.7 config
console.log(getModelByKey('minimax-m2.1'))  // Should return MiniMax config
console.log(getModelByKey('gemini-3-flash')) // Should return Gemini 3 config

// Test routing config
console.log(MODEL_ROUTING.strategic_reasoning.primary) // Should be 'z-ai/glm-4.7'
console.log(MODEL_ROUTING.coding.primary)              // Should be 'minimax/minimax-m2.1'
```

### Manual Test 3: AI SDK Client

```typescript
import { aiModels, recommendedModels } from '@/lib/ai/ai-sdk-client'

// Test new models are accessible
console.log(aiModels.glm47)        // Should return LanguageModel
console.log(aiModels.minimaxM21)   // Should return LanguageModel
console.log(aiModels.gemini3Flash) // Should return LanguageModel

// Test recommended models updated
console.log(recommendedModels.agentic === aiModels.glm47) // Should be true
console.log(recommendedModels.coding === aiModels.minimaxM21) // Should be true
```

### Manual Test 4: Fallback Chain

```typescript
import { createFallbackChain, getFallbackOrder } from '@/lib/ai/fallback-chain'

// Test fallback chain creation
const chain = createFallbackChain('strategic_reasoning')
console.log(chain) // Should be a valid LanguageModel with fallbacks

// Test fallback order
console.log(getFallbackOrder('strategic_reasoning'))
// Should output: ['z-ai/glm-4.7', 'deepseek/deepseek-v3.2:nitro', 'google/gemini-3-flash-preview']
```

---

## Expected Final State

After this phase:

| Category | Models | Status |
|----------|--------|--------|
| Default | Kimi K2 | Existing |
| Tools | Claude Haiku, **GLM 4.7** | **GLM 4.7 NEW** |
| Reasoning | DeepSeek V3.2, **GLM 4.7** | **GLM 4.7 NEW** |
| Coding | **MiniMax M2.1** | **NEW** |
| Vision | Gemini 2.5 Flash, **Gemini 3 Flash** | **Gemini 3 Flash NEW** |
| Large Context | Grok 4 Fast | Existing |
| **Total** | 8 models | +3 NEW |

---

## Code Location Reference

```
next-app/src/lib/ai/models-config.ts
├── Lines 154-275: MODEL_REGISTRY array
│   ├── Line 159: Kimi K2 (existing)
│   ├── Line 185: Claude Haiku (existing)
│   ├── Line 208: DeepSeek V3.2 (existing)
│   ├── Line 231: Grok 4 Fast (existing)
│   ├── Line 252: Gemini 2.5 Flash (existing)
│   └── >>> INSERT NEW MODELS HERE (after line 274) <<<
│       ├── GLM 4.7
│       ├── MiniMax M2.1
│       └── Gemini 3 Flash
│
└── >>> INSERT MODEL_ROUTING CONFIG (after MODEL_REGISTRY) <<<

next-app/src/lib/ai/ai-sdk-client.ts
├── Lines 46-77: aiModels object
│   └── >>> INSERT NEW MODEL ENTRIES (after line 76) <<<
├── Lines 82-103: recommendedModels object
│   └── >>> UPDATE WITH NEW RECOMMENDATIONS <<<
└── Lines 126-131: modelIdMap
    └── >>> ADD NEW MODEL MAPPINGS <<<

next-app/src/lib/ai/fallback-chain.ts (NEW FILE)
```

---

## Rollback Plan

If issues arise:

```bash
git checkout main
git branch -D feat/model-routing-config
```

---

## Dependencies

- **Requires**: Phase 1 complete (missing tools wired)
- **Blocks**: Phase 3 (generalized tools need routing), Phase 4 (orchestration uses routing)

---

[Back to AI Tool Architecture](README.md)
