# AI Tool Architecture - Generalized Tools & Multi-Model Orchestration

**Last Updated**: 2025-12-31
**Status**: Phase 1 NEXT
**Goal**: Consolidate 38+ specialized tools into 7 generalized tools with AI reasoning
**Model**: Multi-model orchestration with GLM 4.7, MiniMax M2.1, Gemini 3 Flash
**Token Optimization**: Tiered injection, ~50% reduction

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase Breakdown](#phase-breakdown)
3. [Phase 1: Wire Missing Tools](#phase-1-wire-missing-tools) - **DETAILED IMPLEMENTATION**
4. [Phase 2: Model Routing Config](#phase-2-model-routing-config)
5. [Phase 3: Generalized Tools](#phase-3-generalized-tools)
6. [Phase 4: Orchestration System](#phase-4-orchestration-system)
7. [Phase 5: Agent Memory System](#phase-5-agent-memory-system)
8. [Phase 6: UX Improvements](#phase-6-ux-improvements)
9. [Cost Analysis](#cost-analysis)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### Goals

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Tool Count | 38+ | 7 | -82% |
| Tool Selection Accuracy | 72% | 90%+ | +25% |
| Monthly Cost (50 users) | $800 | $200 | -75% |
| Prompt Tokens | ~1000 | ~400 | -60% |

### Architecture Overview

```
                    7 GENERALIZED TOOLS
+----------------------------------------------------------+
|                                                          |
|  +--------+  +--------+  +---------+  +----------+       |
|  | entity |  | analyze|  | optimize|  | strategize|      |
|  | (CRUD) |  | (read) |  | (improve)|  | (plan)   |      |
|  +--------+  +--------+  +---------+  +----------+       |
|                                                          |
|  +---------+  +----------+  +------+                     |
|  | research|  | generate |  | plan |                     |
|  | (web)   |  | (content)|  |(sprint)|                   |
|  +---------+  +----------+  +------+                     |
|                                                          |
+----------------------------------------------------------+
```

---

## Phase Breakdown

| Phase | Branch | Scope | Duration | Status |
|-------|--------|-------|----------|--------|
| **Phase 1** | `feat/wire-missing-tools` | Wire 10 missing tools in agent-executor.ts | 1-2 hours | NEXT |
| **Phase 2** | `feat/model-routing-config` | Add GLM 4.7, MiniMax M2.1, Gemini 3 Flash | 2-3 hours | Pending |
| **Phase 3** | `feat/generalized-tools` | Consolidate 38 -> 7 generalized tools | 1-2 days | Pending |
| **Phase 4** | `feat/orchestration-system` | 4-tier routing, fallback chains, consensus | 1-2 days | Pending |
| **Phase 5** | `feat/agent-memory-system` | Memory UI, 10k token limit, learning | 1-2 days | Pending |
| **Phase 6** | `feat/ux-improvements` | Thinking status, quality toggle, Deep Reasoning | 1 day | Pending |

---

## Phase 1: Wire Missing Tools

### Overview

**Branch**: `feat/wire-missing-tools`
**File**: `next-app/src/lib/ai/agent-executor.ts`
**Lines to modify**: 730-758 (add cases before `default:`)
**Estimated time**: 1-2 hours
**Risk**: Low (adding new cases, not modifying existing)

### Problem Statement

The `executeToolAction()` switch statement (line 571) only handles:

- 5 creation tools (lines 573-728)
- 5 analysis tools (lines 732-754)
- **5 optimization tools - MISSING** (throws error)
- **5 strategy tools - MISSING** (throws error)

When any of the 10 missing tools are called, they hit `default:` and throw:

```
Error: Execution not implemented for tool: prioritizeFeatures
```

### Solution

Add 10 new cases using the **same passthrough pattern** as analysis tools (lines 732-754).

The pattern delegates to the tool's existing `execute()` function instead of implementing database operations inline. This is appropriate because:

- Optimization/strategy tools already return structured results
- They handle their own logic (scoring, analysis, suggestions)
- We just need to route them through the executor

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/wire-missing-tools
```

#### Step 2: Open File

Open: `next-app/src/lib/ai/agent-executor.ts`

Navigate to line **754** (after analysis tools, before `default:`).

#### Step 3: Add Optimization Tools Cases

Insert this code AFTER line 754 (`return { result }`) and BEFORE line 756 (`default:`):

```typescript
      // =========== OPTIMIZATION TOOLS ===========
      // Optimization tools execute through their own execute function
      // Some return previews for approval (update), some are analysis-only (suggest)
      case 'prioritizeFeatures':
      case 'balanceWorkload':
      case 'identifyRisks':
      case 'suggestTimeline':
      case 'deduplicateItems': {
        const optimizationTool = toolRegistry.get(toolName)
        if (!optimizationTool) throw new Error(`Tool not found: ${toolName}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const optimizationToolWithExecute = optimizationTool as any
        if (typeof optimizationToolWithExecute.execute !== 'function') {
          throw new Error(`Tool ${toolName} does not have an execute function`)
        }

        const result = await optimizationToolWithExecute.execute(params, {
          toolCallId: context.actionId || Date.now().toString(),
          abortSignal: new AbortController().signal,
        })

        // If the tool returns a preview requiring approval, pass it through
        // The agent-executor will handle the approval workflow
        if (result && typeof result === 'object' && 'requiresApproval' in result) {
          return {
            result,
            // For optimization tools that modify data, we'll need rollback support
            // The tool's preview.changes array describes what will change
          }
        }

        return { result }
      }

      // =========== STRATEGY TOOLS ===========
      // Strategy tools are primarily analysis/suggestion tools
      // roadmapGenerator may create new records (requires approval)
      case 'alignToStrategy':
      case 'suggestOKRs':
      case 'competitiveAnalysis':
      case 'roadmapGenerator':
      case 'impactAssessment': {
        const strategyTool = toolRegistry.get(toolName)
        if (!strategyTool) throw new Error(`Tool not found: ${toolName}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const strategyToolWithExecute = strategyTool as any
        if (typeof strategyToolWithExecute.execute !== 'function') {
          throw new Error(`Tool ${toolName} does not have an execute function`)
        }

        const result = await strategyToolWithExecute.execute(params, {
          toolCallId: context.actionId || Date.now().toString(),
          abortSignal: new AbortController().signal,
        })

        // Handle approval-requiring tools (like roadmapGenerator)
        if (result && typeof result === 'object' && 'requiresApproval' in result) {
          return { result }
        }

        return { result }
      }
```

#### Step 4: Verify Import

Ensure `toolRegistry` is imported at the top of the file. Check line ~20-30 for:

```typescript
import { toolRegistry } from './tools/tool-registry'
```

If missing, add this import.

#### Step 5: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

Fix any type errors.

#### Step 6: Run Linter

```bash
npm run lint
```

Fix any linting issues.

### Testing Plan

#### Manual Test 1: Optimization Tool

1. Start dev server: `npm run dev`
2. Open chat interface
3. Type: "Prioritize our features using RICE framework"
4. Verify: Tool executes without "not implemented" error
5. Verify: Returns prioritization preview

#### Manual Test 2: Strategy Tool

1. Type: "Which features align with our strategy?"
2. Verify: alignToStrategy tool executes
3. Verify: Returns alignment analysis

#### Manual Test 3: Each Tool

Test each of the 10 tools briefly:

| Tool | Test Prompt |
|------|-------------|
| prioritizeFeatures | "Prioritize features using RICE" |
| balanceWorkload | "Balance workload across team" |
| identifyRisks | "What are the risks in current work?" |
| suggestTimeline | "Suggest timeline for features" |
| deduplicateItems | "Find duplicate features" |
| alignToStrategy | "Align features to strategy" |
| suggestOKRs | "Suggest OKRs for this workspace" |
| competitiveAnalysis | "Analyze our competitors" |
| roadmapGenerator | "Generate a roadmap" |
| impactAssessment | "Assess impact of features" |

### Commit & PR

#### Commit

```bash
git add next-app/src/lib/ai/agent-executor.ts
git commit -m "feat: wire optimization and strategy tools in agent-executor

Add execution cases for 10 missing tools:
- Optimization: prioritizeFeatures, balanceWorkload, identifyRisks, suggestTimeline, deduplicateItems
- Strategy: alignToStrategy, suggestOKRs, competitiveAnalysis, roadmapGenerator, impactAssessment

Uses passthrough pattern to delegate to each tool's execute() function.
Fixes 'Execution not implemented' errors when these tools are invoked."
```

#### Push & PR

```bash
git push -u origin feat/wire-missing-tools

gh pr create --title "feat: wire 10 missing tools in agent-executor" --body "## Summary
- Add execution wiring for 5 optimization tools
- Add execution wiring for 5 strategy tools
- Uses passthrough pattern (same as analysis tools)
- Fixes 'Execution not implemented' errors

## Test Plan
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Each tool executes without 'not implemented' error
- [ ] Tool results return expected preview/analysis format

## Tools Wired
| Category | Tools |
|----------|-------|
| Optimization | prioritizeFeatures, balanceWorkload, identifyRisks, suggestTimeline, deduplicateItems |
| Strategy | alignToStrategy, suggestOKRs, competitiveAnalysis, roadmapGenerator, impactAssessment |
"
```

### Expected Final State

After this phase:

| Category | Tools | Status |
|----------|-------|--------|
| Creation | 5 | Wired (existing) |
| Analysis | 5 | Wired (existing) |
| Optimization | 5 | **Wired (new)** |
| Strategy | 5 | **Wired (new)** |
| **Total** | 20 | **100% wired** |

### Code Location Reference

```
next-app/src/lib/ai/agent-executor.ts

Line 571: switch (toolName) {
Lines 573-599: case 'createWorkItem'
Lines 601-630: case 'createTask'
Lines 632-660: case 'createDependency'
Lines 662-689: case 'createTimelineItem'
Lines 691-728: case 'createInsight'
Lines 730-754: Analysis tools (grouped case)

>>> INSERT NEW CODE HERE (after line 754) <<<

Lines 756-758: default: throw Error
```

### Rollback Plan

If issues arise:

```bash
git checkout main
git branch -D feat/wire-missing-tools
```

---

## Phase 2: Model Routing Config

### Overview

**Branch**: `feat/model-routing-config`
**Files to modify**:

- `next-app/src/lib/ai/models-config.ts`
- `next-app/src/lib/ai/ai-sdk-client.ts`
**Estimated time**: 2-3 hours
**Risk**: Low-Medium (adding new models, updating routing config)

### Problem Statement

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

### Solution

Add 3 new models to the registry with proper capability flags, and create a `MODEL_ROUTING` config that defines fallback chains for each capability type.

### New Models to Add

| Model | OpenRouter ID | Use For | Cost | Context |
|-------|---------------|---------|------|---------|
| **GLM 4.7** | `z-ai/glm-4.7` | Strategic reasoning + Agentic | $0.40/$1.50 | 128K |
| **MiniMax M2.1** | `minimax/minimax-m2.1` | Coding | $0.30/$1.20 | 128K |
| **Gemini 3 Flash** | `google/gemini-3-flash-preview` | Visual reasoning (upgraded) | $0.50/$3.00 | 1M |

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/model-routing-config
```

#### Step 2: Add New Models to Registry

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

#### Step 3: Add Model Routing Configuration

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

#### Step 4: Update AI SDK Client

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

#### Step 5: Add Fallback Chain Utility

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

#### Step 6: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

Fix any type errors.

#### Step 7: Run Linter

```bash
npm run lint
```

Fix any linting issues.

### Testing Plan

#### Manual Test 1: New Model Access

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

#### Manual Test 2: Model Registry

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

#### Manual Test 3: AI SDK Client

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

#### Manual Test 4: Fallback Chain

```typescript
import { createFallbackChain, getFallbackOrder } from '@/lib/ai/fallback-chain'

// Test fallback chain creation
const chain = createFallbackChain('strategic_reasoning')
console.log(chain) // Should be a valid LanguageModel with fallbacks

// Test fallback order
console.log(getFallbackOrder('strategic_reasoning'))
// Should output: ['z-ai/glm-4.7', 'deepseek/deepseek-v3.2:nitro', 'google/gemini-3-flash-preview']
```

### Commit & PR

#### Commit

```bash
git add next-app/src/lib/ai/models-config.ts \
        next-app/src/lib/ai/ai-sdk-client.ts \
        next-app/src/lib/ai/fallback-chain.ts
git commit -m "feat: add GLM 4.7, MiniMax M2.1, Gemini 3 Flash with routing config

Add 3 new high-performance models:
- GLM 4.7: Strategic reasoning + agentic (best HLE/GPQA scores)
- MiniMax M2.1: Coding specialist (best coding benchmarks)
- Gemini 3 Flash: Upgraded vision (1M context, video analysis)

Add MODEL_ROUTING configuration with fallback chains:
- strategic_reasoning: GLM 4.7 -> DeepSeek V3.2 -> Gemini 3 Flash
- agentic_tool_use: GLM 4.7 -> Gemini 3 Flash -> MiniMax M2.1
- coding: MiniMax M2.1 -> GLM 4.7 -> Kimi K2
- visual_reasoning: Gemini 3 Flash -> Grok 4 Fast -> Gemini 2.5 Flash
- large_context: Grok 4 Fast (2M) -> Gemini 3 Flash (1M) -> Kimi K2 (262K)
- default: Kimi K2 -> GLM 4.7 -> MiniMax M2.1

Add fallback-chain.ts utility for AI SDK fallback support."
```

#### Push & PR

```bash
git push -u origin feat/model-routing-config

gh pr create --title "feat: add 3 new models + routing config with fallback chains" --body "$(cat <<'EOF'
## Summary
- Add GLM 4.7 for strategic reasoning + agentic tool use
- Add MiniMax M2.1 for coding tasks
- Add Gemini 3 Flash for upgraded vision
- Add MODEL_ROUTING config with fallback chains per capability
- Add fallback-chain.ts utility for AI SDK integration

## New Models
| Model | Use Case | Cost | Context |
|-------|----------|------|---------|
| GLM 4.7 | Strategic reasoning, agentic | $0.40/$1.50 | 128K |
| MiniMax M2.1 | Coding | $0.30/$1.20 | 128K |
| Gemini 3 Flash | Vision, multimodal | $0.50/$3.00 | 1M |

## Fallback Chains
| Capability | Primary | Fallback | Tertiary |
|------------|---------|----------|----------|
| Strategic Reasoning | GLM 4.7 | DeepSeek V3.2 | Gemini 3 Flash |
| Agentic Tool Use | GLM 4.7 | Gemini 3 Flash | MiniMax M2.1 |
| Coding | MiniMax M2.1 | GLM 4.7 | Kimi K2 |
| Visual Reasoning | Gemini 3 Flash | Grok 4 Fast | Gemini 2.5 |
| Large Context | Grok 4 (2M) | Gemini 3 (1M) | Kimi K2 (262K) |
| Default Chat | Kimi K2 | GLM 4.7 | MiniMax M2.1 |

## Test Plan
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Each new model accessible via OpenRouter API
- [ ] Model registry returns correct configs
- [ ] AI SDK client exports new models
- [ ] Fallback chain utility works correctly

## Files Changed
- `next-app/src/lib/ai/models-config.ts` - Add 3 models + routing config
- `next-app/src/lib/ai/ai-sdk-client.ts` - Add new model exports
- `next-app/src/lib/ai/fallback-chain.ts` - New fallback utility
EOF
)"
```

### Expected Final State

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

### Code Location Reference

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

### Rollback Plan

If issues arise:

```bash
git checkout main
git branch -D feat/model-routing-config
```

### Dependencies

- **Requires**: Phase 1 complete (missing tools wired)
- **Blocks**: Phase 3 (generalized tools need routing), Phase 4 (orchestration uses routing)

---

## Phase 3: Generalized Tools

### Overview

**Branch**: `feat/generalized-tools`
**Files to create**: 8 new files in `next-app/src/lib/ai/tools/generalized/`
**Files to modify**: `next-app/src/lib/ai/tools/tool-registry.ts`, `next-app/src/lib/ai/agent-executor.ts`
**Estimated time**: 1-2 days
**Risk**: Medium (creating new tool abstraction layer)

### Problem Statement

Currently there are 38+ specialized tools, each with its own schema and implementation. This causes:

- **Prompt bloat**: All 38 tool definitions must be sent to the model
- **Selection confusion**: Models often pick wrong tools with similar names
- **Maintenance burden**: Each tool requires separate code/tests
- **Inconsistent patterns**: Different approaches for similar operations

### Solution

Consolidate into 7 generalized tools that use AI reasoning to determine the specific operation:

| # | Tool | Purpose | Replaces |
|---|------|---------|----------|
| 1 | **`entity`** | Create, update, delete entities | createWorkItem, createTask, createDependency, createTimelineItem, createInsight |
| 2 | **`analyze`** | Analyze data without modification | analyzeFeedback, suggestDependencies, findGaps, summarizeWorkItem, extractRequirements |
| 3 | **`optimize`** | Improve workflows and priorities | prioritizeFeatures, balanceWorkload, identifyRisks, suggestTimeline, deduplicateItems |
| 4 | **`strategize`** | Strategic planning and alignment | alignToStrategy, suggestOKRs, competitiveAnalysis, roadmapGenerator, impactAssessment |
| 5 | **`research`** | Web search and external data | webSearch, extractContent, deepResearch, researchStatus, quickAnswer |
| 6 | **`generate`** | Generate structured content | generateUserStories, generateAcceptanceCriteria, estimateEffort (NEW) |
| 7 | **`plan`** | Sprint and release planning | planSprint, suggestTimeline (NEW) |

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/generalized-tools
```

#### Step 2: Create Directory Structure

```bash
cd next-app/src/lib/ai/tools
mkdir -p generalized
```

#### Step 3: Create Base Types File

Create: `next-app/src/lib/ai/tools/generalized/types.ts`

```typescript
/**
 * Generalized Tool Types
 * 
 * Shared types and interfaces for the 7 generalized tools.
 */

import { z } from 'zod'

/**
 * Base result type for all generalized tools
 */
export interface GeneralizedToolResult<T = unknown> {
  success: boolean
  operation: string
  data?: T
  error?: string
  requiresApproval?: boolean
  preview?: {
    description: string
    changes: Array<{
      type: 'create' | 'update' | 'delete'
      entityType: string
      entityId?: string
      summary: string
    }>
  }
}

/**
 * Tool execution context
 */
export interface ToolContext {
  workspaceId: string
  teamId: string
  userId: string
  toolCallId: string
  abortSignal: AbortSignal
}

/**
 * Common entity types across the platform
 */
export const EntityTypes = z.enum([
  'work_item',
  'task',
  'timeline_item',
  'dependency',
  'insight',
  'feedback',
  'roadmap',
])
export type EntityType = z.infer<typeof EntityTypes>

/**
 * Common operations for entity tool
 */
export const EntityOperations = z.enum([
  'create',
  'update',
  'delete',
  'clone',
  'link',
  'promote',
])
export type EntityOperation = z.infer<typeof EntityOperations>

/**
 * Priority levels
 */
export const PriorityLevels = z.enum(['critical', 'high', 'medium', 'low'])
export type PriorityLevel = z.infer<typeof PriorityLevels>

/**
 * Work item types
 */
export const WorkItemTypes = z.enum(['concept', 'feature', 'bug', 'enhancement'])
export type WorkItemType = z.infer<typeof WorkItemTypes>
```

#### Step 4: Create Entity Tool

Create: `next-app/src/lib/ai/tools/generalized/entity-tool.ts`

```typescript
/**
 * Entity Tool - Unified CRUD for all platform entities
 * 
 * Replaces: createWorkItem, createTask, createDependency, createTimelineItem, createInsight
 * 
 * The AI model decides the operation and entity type based on user intent.
 */

import { z } from 'zod'
import { tool } from 'ai'
import {
  EntityTypes,
  EntityOperations,
  PriorityLevels,
  WorkItemTypes,
  type GeneralizedToolResult,
  type ToolContext,
} from './types'

/**
 * Entity tool schema - covers all CRUD operations
 */
export const entityToolSchema = z.object({
  operation: EntityOperations.describe('The operation to perform'),
  entityType: EntityTypes.describe('Type of entity to operate on'),
  data: z.object({
    // Common fields
    name: z.string().optional().describe('Name/title of the entity'),
    description: z.string().optional().describe('Detailed description'),
    
    // Work item specific
    workItemType: WorkItemTypes.optional().describe('Type if creating work item'),
    phase: z.string().optional().describe('Phase/status of work item'),
    priority: PriorityLevels.optional().describe('Priority level'),
    tags: z.array(z.string()).optional().describe('Tags/labels'),
    
    // Relationships
    parentId: z.string().optional().describe('Parent entity ID'),
    sourceId: z.string().optional().describe('Source entity for links'),
    targetId: z.string().optional().describe('Target entity for links'),
    connectionType: z.enum(['dependency', 'blocks', 'complements', 'relates_to'])
      .optional().describe('Type of connection'),
    
    // Timeline specific
    timeframe: z.enum(['mvp', 'short', 'long']).optional().describe('Timeline bucket'),
    startDate: z.string().optional().describe('Start date (ISO format)'),
    endDate: z.string().optional().describe('End date (ISO format)'),
    
    // Insight specific
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    content: z.string().optional().describe('Content/body text'),
    
    // For updates/deletes
    entityId: z.string().optional().describe('ID of entity to update/delete'),
  }).describe('Data for the operation'),
})

export type EntityToolParams = z.infer<typeof entityToolSchema>

/**
 * Entity tool definition for AI SDK
 */
export const entityTool = tool({
  description: `Manage platform entities (create, update, delete, link).
    
Use this tool when the user wants to:
- Create a new work item, task, dependency, timeline item, or insight
- Update an existing entity's properties
- Delete an entity
- Clone an entity
- Link two entities together
- Promote a concept to a feature

Examples:
- "Create a feature called Dark Mode" → operation: create, entityType: work_item
- "Add a task to the Dark Mode feature" → operation: create, entityType: task
- "Link these two features as dependencies" → operation: link, entityType: dependency
- "Delete this insight" → operation: delete, entityType: insight`,
  
  parameters: entityToolSchema,
  
  execute: async (params: EntityToolParams, context: ToolContext): Promise<GeneralizedToolResult> => {
    const { operation, entityType, data } = params
    
    // Route to specific handler based on operation
    switch (operation) {
      case 'create':
        return await handleCreate(entityType, data, context)
      case 'update':
        return await handleUpdate(entityType, data, context)
      case 'delete':
        return await handleDelete(entityType, data, context)
      case 'clone':
        return await handleClone(entityType, data, context)
      case 'link':
        return await handleLink(entityType, data, context)
      case 'promote':
        return await handlePromote(entityType, data, context)
      default:
        return { success: false, operation, error: `Unknown operation: ${operation}` }
    }
  },
})

// Handler implementations (delegate to existing services)
async function handleCreate(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  // Import and delegate to existing service functions
  // This preserves existing business logic
  
  switch (entityType) {
    case 'work_item': {
      // Delegate to existing createWorkItem logic
      const { createWorkItem } = await import('@/lib/actions/work-items')
      const result = await createWorkItem({
        name: data.name!,
        description: data.description,
        type: data.workItemType || 'feature',
        phase: data.phase || 'backlog',
        priority: data.priority || 'medium',
        tags: data.tags,
        workspace_id: context.workspaceId,
        team_id: context.teamId,
      })
      return {
        success: true,
        operation: 'create',
        data: result,
      }
    }
    
    case 'task': {
      const { createTask } = await import('@/lib/actions/tasks')
      const result = await createTask({
        title: data.name!,
        description: data.description,
        work_item_id: data.parentId!,
        team_id: context.teamId,
      })
      return {
        success: true,
        operation: 'create',
        data: result,
      }
    }
    
    case 'dependency': {
      const { createDependency } = await import('@/lib/actions/dependencies')
      const result = await createDependency({
        source_id: data.sourceId!,
        target_id: data.targetId!,
        connection_type: data.connectionType || 'dependency',
        team_id: context.teamId,
      })
      return {
        success: true,
        operation: 'create',
        data: result,
      }
    }
    
    case 'timeline_item': {
      const { createTimelineItem } = await import('@/lib/actions/timeline')
      const result = await createTimelineItem({
        work_item_id: data.parentId!,
        timeframe: data.timeframe || 'short',
        start_date: data.startDate,
        end_date: data.endDate,
        team_id: context.teamId,
      })
      return {
        success: true,
        operation: 'create',
        data: result,
      }
    }
    
    case 'insight': {
      const { createInsight } = await import('@/lib/actions/insights')
      const result = await createInsight({
        content: data.content!,
        sentiment: data.sentiment || 'neutral',
        work_item_id: data.parentId,
        team_id: context.teamId,
      })
      return {
        success: true,
        operation: 'create',
        data: result,
      }
    }
    
    default:
      return {
        success: false,
        operation: 'create',
        error: `Cannot create entity type: ${entityType}`,
      }
  }
}

async function handleUpdate(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  if (!data.entityId) {
    return { success: false, operation: 'update', error: 'entityId is required for update' }
  }
  
  // Return preview for approval
  return {
    success: true,
    operation: 'update',
    requiresApproval: true,
    preview: {
      description: `Update ${entityType} ${data.entityId}`,
      changes: [{
        type: 'update',
        entityType,
        entityId: data.entityId,
        summary: `Update fields: ${Object.keys(data).filter(k => k !== 'entityId').join(', ')}`,
      }],
    },
  }
}

async function handleDelete(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  if (!data.entityId) {
    return { success: false, operation: 'delete', error: 'entityId is required for delete' }
  }
  
  // Always require approval for deletes
  return {
    success: true,
    operation: 'delete',
    requiresApproval: true,
    preview: {
      description: `Delete ${entityType} ${data.entityId}`,
      changes: [{
        type: 'delete',
        entityType,
        entityId: data.entityId,
        summary: `Permanently delete this ${entityType}`,
      }],
    },
  }
}

async function handleClone(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  // Implementation for cloning entities
  return {
    success: true,
    operation: 'clone',
    requiresApproval: true,
    preview: {
      description: `Clone ${entityType}`,
      changes: [{
        type: 'create',
        entityType,
        summary: `Create copy of ${entityType} ${data.entityId}`,
      }],
    },
  }
}

async function handleLink(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  if (!data.sourceId || !data.targetId) {
    return { success: false, operation: 'link', error: 'sourceId and targetId required' }
  }
  
  // Create dependency/link
  return handleCreate('dependency', data, context)
}

async function handlePromote(
  entityType: string,
  data: EntityToolParams['data'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  // Promote concept to feature
  return {
    success: true,
    operation: 'promote',
    requiresApproval: true,
    preview: {
      description: `Promote ${entityType} to feature`,
      changes: [{
        type: 'update',
        entityType,
        entityId: data.entityId,
        summary: 'Change type from concept to feature',
      }],
    },
  }
}

export default entityTool
```

#### Step 5: Create Analyze Tool

Create: `next-app/src/lib/ai/tools/generalized/analyze-tool.ts`

```typescript
/**
 * Analyze Tool - Read-only data analysis
 * 
 * Replaces: analyzeFeedback, suggestDependencies, findGaps, summarizeWorkItem, extractRequirements
 */

import { z } from 'zod'
import { tool } from 'ai'
import type { GeneralizedToolResult, ToolContext } from './types'

export const analyzeToolSchema = z.object({
  analysisType: z.enum([
    'feedback_sentiment',
    'dependency_gaps',
    'coverage_gaps',
    'summarize',
    'extract_requirements',
    'health_check',
  ]).describe('Type of analysis to perform'),
  scope: z.object({
    workItemIds: z.array(z.string()).optional().describe('Specific work items to analyze'),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'all']).optional(),
    phase: z.string().optional().describe('Filter by phase'),
    sourceText: z.string().optional().describe('Text to analyze (for extraction)'),
  }).describe('Scope of the analysis'),
  options: z.object({
    format: z.enum(['brief', 'detailed', 'executive']).optional().default('detailed'),
    minConfidence: z.number().optional().default(0.7),
  }).optional().describe('Analysis options'),
})

export type AnalyzeToolParams = z.infer<typeof analyzeToolSchema>

export const analyzeTool = tool({
  description: `Analyze workspace data without making changes.

Use this tool when the user wants to:
- Analyze customer feedback sentiment
- Find missing dependencies between work items
- Identify coverage gaps (incomplete items)
- Get AI summaries of work items
- Extract requirements from text
- Check workspace health

Examples:
- "Analyze our customer feedback" → analysisType: feedback_sentiment
- "What dependencies am I missing?" → analysisType: dependency_gaps
- "Summarize this feature" → analysisType: summarize
- "What are the requirements in this document?" → analysisType: extract_requirements`,

  parameters: analyzeToolSchema,

  execute: async (params: AnalyzeToolParams, context: ToolContext): Promise<GeneralizedToolResult> => {
    const { analysisType, scope, options } = params

    switch (analysisType) {
      case 'feedback_sentiment':
        return await analyzeFeedbackSentiment(scope, options, context)
      case 'dependency_gaps':
        return await analyzeDependencyGaps(scope, context)
      case 'coverage_gaps':
        return await analyzeCoverageGaps(scope, context)
      case 'summarize':
        return await summarizeItems(scope, options, context)
      case 'extract_requirements':
        return await extractRequirements(scope, context)
      case 'health_check':
        return await performHealthCheck(context)
      default:
        return { success: false, operation: analysisType, error: `Unknown analysis type` }
    }
  },
})

// Analysis implementations
async function analyzeFeedbackSentiment(
  scope: AnalyzeToolParams['scope'],
  options: AnalyzeToolParams['options'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  const { getFeedbackByWorkspace } = await import('@/lib/actions/feedback')
  const feedback = await getFeedbackByWorkspace(context.workspaceId)
  
  // Aggregate sentiment counts
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  for (const item of feedback) {
    if (item.sentiment in sentimentCounts) {
      sentimentCounts[item.sentiment as keyof typeof sentimentCounts]++
    }
  }
  
  return {
    success: true,
    operation: 'feedback_sentiment',
    data: {
      total: feedback.length,
      sentimentCounts,
      items: options?.format === 'brief' ? [] : feedback.slice(0, 10),
    },
  }
}

async function analyzeDependencyGaps(
  scope: AnalyzeToolParams['scope'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  const { suggestDependencies } = await import('@/lib/ai/tools/analysis/suggest-dependencies')
  const suggestions = await suggestDependencies({
    workspaceId: context.workspaceId,
    workItemIds: scope.workItemIds,
  })
  
  return {
    success: true,
    operation: 'dependency_gaps',
    data: suggestions,
  }
}

async function analyzeCoverageGaps(
  scope: AnalyzeToolParams['scope'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  const { findGaps } = await import('@/lib/ai/tools/analysis/find-gaps')
  const gaps = await findGaps({
    workspaceId: context.workspaceId,
    phase: scope.phase,
  })
  
  return {
    success: true,
    operation: 'coverage_gaps',
    data: gaps,
  }
}

async function summarizeItems(
  scope: AnalyzeToolParams['scope'],
  options: AnalyzeToolParams['options'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  const { summarizeWorkItem } = await import('@/lib/ai/tools/analysis/summarize')
  
  if (!scope.workItemIds?.length) {
    return { success: false, operation: 'summarize', error: 'No work items specified' }
  }
  
  const summaries = await Promise.all(
    scope.workItemIds.map(id => summarizeWorkItem(id, options?.format))
  )
  
  return {
    success: true,
    operation: 'summarize',
    data: summaries,
  }
}

async function extractRequirements(
  scope: AnalyzeToolParams['scope'],
  context: ToolContext
): Promise<GeneralizedToolResult> {
  if (!scope.sourceText) {
    return { success: false, operation: 'extract_requirements', error: 'No source text provided' }
  }
  
  const { extractRequirements: extract } = await import('@/lib/ai/tools/analysis/extract-requirements')
  const requirements = await extract(scope.sourceText)
  
  return {
    success: true,
    operation: 'extract_requirements',
    data: requirements,
  }
}

async function performHealthCheck(
  context: ToolContext
): Promise<GeneralizedToolResult> {
  // Aggregate health metrics
  return {
    success: true,
    operation: 'health_check',
    data: {
      workspaceId: context.workspaceId,
      metrics: {
        staleItems: 0, // Items not updated in 30+ days
        orphanedTasks: 0, // Tasks without parent work item
        missingDescriptions: 0, // Items without descriptions
        unlinkedFeatures: 0, // Features with no dependencies
      },
    },
  }
}

export default analyzeTool
```

#### Step 6: Create Remaining Tools (Optimize, Strategize, Research, Generate, Plan)

Create similar files for each tool following the same pattern:

- `optimize-tool.ts` - prioritize, balance_workload, identify_risks, estimate_timeline, deduplicate
- `strategize-tool.ts` - align, suggest_okrs, competitive_analysis, generate_roadmap, impact_assessment
- `research-tool.ts` - web_search, extract_content, deep_research, quick_answer
- `generate-tool.ts` - user_stories, acceptance_criteria, effort_estimate, test_cases, documentation
- `plan-tool.ts` - sprint, release, milestone, capacity

#### Step 7: Create Index File

Create: `next-app/src/lib/ai/tools/generalized/index.ts`

```typescript
/**
 * Generalized Tools Index
 * 
 * Exports all 7 generalized tools for registration.
 */

export { entityTool, entityToolSchema, type EntityToolParams } from './entity-tool'
export { analyzeTool, analyzeToolSchema, type AnalyzeToolParams } from './analyze-tool'
export { optimizeTool, optimizeToolSchema, type OptimizeToolParams } from './optimize-tool'
export { strategizeTool, strategizeToolSchema, type StrategizeToolParams } from './strategize-tool'
export { researchTool, researchToolSchema, type ResearchToolParams } from './research-tool'
export { generateTool, generateToolSchema, type GenerateToolParams } from './generate-tool'
export { planTool, planToolSchema, type PlanToolParams } from './plan-tool'

export * from './types'

/**
 * All generalized tools for registration
 */
export const generalizedTools = {
  entity: entityTool,
  analyze: analyzeTool,
  optimize: optimizeTool,
  strategize: strategizeTool,
  research: researchTool,
  generate: generateTool,
  plan: planTool,
}

/**
 * Tool names for type safety
 */
export type GeneralizedToolName = keyof typeof generalizedTools
```

#### Step 8: Update Tool Registry

Modify: `next-app/src/lib/ai/tools/tool-registry.ts`

Add at the top of the file:

```typescript
import { generalizedTools } from './generalized'
```

Add a new function to get generalized tools:

```typescript
/**
 * Get generalized tools (7 tools instead of 38+)
 * 
 * Use this for new agentic workflows.
 * Reduces prompt tokens by ~60%.
 */
export function getGeneralizedTools() {
  return generalizedTools
}

/**
 * Check if generalized tools should be used
 * Based on feature flag or user preference
 */
export function useGeneralizedTools(userId?: string): boolean {
  // Feature flag - start with false, gradually roll out
  const FEATURE_FLAG_GENERALIZED_TOOLS = process.env.FEATURE_GENERALIZED_TOOLS === 'true'
  return FEATURE_FLAG_GENERALIZED_TOOLS
}
```

#### Step 9: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

#### Step 10: Run Linter

```bash
npm run lint
```

### Testing Plan

#### Test 1: Entity Tool - Create Work Item

```typescript
// Test prompt: "Create a feature called Dark Mode"
const result = await entityTool.execute({
  operation: 'create',
  entityType: 'work_item',
  data: {
    name: 'Dark Mode',
    workItemType: 'feature',
    description: 'Add dark mode support to the application',
  }
}, testContext)

// Expected: success: true, data contains new work item
```

#### Test 2: Analyze Tool - Feedback Sentiment

```typescript
// Test prompt: "Analyze our customer feedback"
const result = await analyzeTool.execute({
  analysisType: 'feedback_sentiment',
  scope: {},
  options: { format: 'detailed' }
}, testContext)

// Expected: success: true, data contains sentiment counts
```

#### Test 3: Tool Selection by AI

| User Prompt | Expected Tool | Expected Operation |
|-------------|---------------|-------------------|
| "Create a feature called Dark Mode" | entity | create |
| "Add a task to the Dark Mode feature" | entity | create |
| "Analyze our customer feedback" | analyze | feedback_sentiment |
| "Prioritize our features using RICE" | optimize | prioritize |
| "Generate OKRs for this quarter" | strategize | suggest_okrs |
| "Search for competitor pricing" | research | web_search |
| "Write user stories for Dark Mode" | generate | user_stories |
| "Plan next sprint" | plan | sprint |

### Commit & PR

#### Commit

```bash
git add next-app/src/lib/ai/tools/generalized/
git add next-app/src/lib/ai/tools/tool-registry.ts
git commit -m "feat: add 7 generalized tools to replace 38+ specialized tools

Create generalized tool abstraction layer:
- entity: CRUD for work_item, task, dependency, timeline_item, insight
- analyze: feedback_sentiment, dependency_gaps, coverage_gaps, summarize
- optimize: prioritize, balance_workload, identify_risks, deduplicate
- strategize: align, suggest_okrs, competitive_analysis, roadmap
- research: web_search, extract_content, deep_research
- generate: user_stories, acceptance_criteria, effort_estimate
- plan: sprint, release, milestone, capacity

Benefits:
- 82% reduction in tool count (38 -> 7)
- ~60% reduction in prompt tokens
- Improved tool selection accuracy
- Consistent patterns across operations"
```

#### Push & PR

```bash
git push -u origin feat/generalized-tools

gh pr create --title "feat: 7 generalized tools replacing 38+ specialized tools" --body "$(cat <<'EOF'
## Summary
Create a generalized tool abstraction that consolidates 38+ specialized tools into 7 semantic categories.

## The 7 Generalized Tools
| Tool | Purpose | Replaces |
|------|---------|----------|
| entity | CRUD operations | createWorkItem, createTask, createDependency, etc. |
| analyze | Read-only analysis | analyzeFeedback, suggestDependencies, findGaps, etc. |
| optimize | Workflow improvement | prioritizeFeatures, balanceWorkload, identifyRisks |
| strategize | Strategic planning | alignToStrategy, suggestOKRs, roadmapGenerator |
| research | External data | webSearch, deepResearch, extractContent |
| generate | Content creation | generateUserStories, generateAcceptanceCriteria |
| plan | Sprint/release planning | planSprint, capacityPlanning |

## Benefits
- **82% tool count reduction**: 38 -> 7 tools
- **~60% prompt token reduction**: Smaller context window usage
- **Better tool selection**: AI can reason about intent vs. memorizing 38 names
- **Consistent patterns**: All tools follow same schema structure

## Files Added
```

next-app/src/lib/ai/tools/generalized/
├── types.ts           # Shared types
├── entity-tool.ts     # CRUD operations
├── analyze-tool.ts    # Data analysis
├── optimize-tool.ts   # Workflow optimization
├── strategize-tool.ts # Strategic planning
├── research-tool.ts   # External research
├── generate-tool.ts   # Content generation
├── plan-tool.ts       # Sprint planning
└── index.ts           # Exports

```

## Test Plan
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Each tool executes without errors
- [ ] Tool selection accuracy tested with sample prompts
- [ ] Existing functionality preserved (delegate to existing services)

## Migration Strategy
- Feature flagged (`FEATURE_GENERALIZED_TOOLS=true`)
- Gradual rollout to test accuracy
- Keep legacy tools until confidence threshold reached
EOF
)"
```

### Expected Final State

After this phase:

| Metric | Before | After |
|--------|--------|-------|
| Tool Count | 38+ | 7 |
| Prompt Tokens (tools) | ~1000 | ~400 |
| Tool Selection Accuracy | ~72% | ~90% (target) |

### Code Location Reference

```
next-app/src/lib/ai/tools/generalized/
├── types.ts             # Line 1-60: Shared types and interfaces
├── entity-tool.ts       # Line 1-200: CRUD tool implementation
├── analyze-tool.ts      # Line 1-150: Analysis tool implementation
├── optimize-tool.ts     # Line 1-150: Optimization tool implementation
├── strategize-tool.ts   # Line 1-150: Strategy tool implementation
├── research-tool.ts     # Line 1-150: Research tool implementation
├── generate-tool.ts     # Line 1-150: Generation tool implementation
├── plan-tool.ts         # Line 1-150: Planning tool implementation
└── index.ts             # Line 1-50: Exports

next-app/src/lib/ai/tools/tool-registry.ts
└── >>> ADD getGeneralizedTools() function <<<
```

### Rollback Plan

If issues arise:

```bash
# Remove feature flag
unset FEATURE_GENERALIZED_TOOLS

# Or revert branch
git checkout main
git branch -D feat/generalized-tools
```

### Dependencies

- **Requires**: Phase 1 complete (tools wired), Phase 2 complete (model routing)
- **Blocks**: Phase 4 (orchestration uses tools)

### Tool Schemas

#### Tool 1: `entity` - Entity Management

```typescript
const entityToolSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'clone', 'link', 'promote']),
  entityType: z.enum([
    'work_item', 'task', 'timeline_item', 'dependency',
    'insight', 'feedback', 'roadmap'
  ]),
  data: z.object({
    // Common
    name: z.string().optional(),
    description: z.string().optional(),

    // Work item
    workItemType: z.enum(['concept', 'feature', 'bug', 'enhancement']).optional(),
    phase: z.string().optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    tags: z.array(z.string()).optional(),

    // Relationships
    parentId: z.string().optional(),
    sourceId: z.string().optional(),
    targetId: z.string().optional(),
    connectionType: z.enum(['dependency', 'blocks', 'complements', 'relates_to']).optional(),

    // Timeline
    timeframe: z.enum(['mvp', 'short', 'long']).optional(),

    // Insight
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    content: z.string().optional(),
  }),
})
```

#### Tool 2: `analyze` - Analysis Tool

```typescript
const analyzeToolSchema = z.object({
  analysisType: z.enum([
    'feedback_sentiment',    // Customer feedback analysis
    'dependency_gaps',       // Missing relationships
    'coverage_gaps',         // Incomplete items
    'summarize',             // AI summaries
    'extract_requirements',  // Parse from text
    'health_check',          // Workspace health
  ]),
  scope: z.object({
    workItemIds: z.array(z.string()).optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'all']).optional(),
    phase: z.string().optional(),
    sourceText: z.string().optional(),
  }),
  options: z.object({
    format: z.enum(['brief', 'detailed', 'executive']).optional(),
    minConfidence: z.number().optional(),
  }).optional(),
})
```

#### Tool 3: `optimize` - Optimization Tool

```typescript
const optimizeToolSchema = z.object({
  optimizationType: z.enum([
    'prioritize',           // RICE/WSJF scoring
    'balance_workload',     // Task redistribution
    'identify_risks',       // Risk assessment
    'estimate_timeline',    // Date estimation
    'deduplicate',          // Merge duplicates
  ]),
  target: z.object({
    workItemIds: z.array(z.string()).optional(),
    phase: z.string().optional(),
  }),
  options: z.object({
    framework: z.enum(['rice', 'wsjf', 'auto']).optional(),
    maxTasksPerPerson: z.number().optional(),
    staleDays: z.number().optional(),
    applyChanges: z.boolean().optional(),
  }).optional(),
})
```

#### Tool 4: `strategize` - Strategy Tool

```typescript
const strategizeToolSchema = z.object({
  strategyType: z.enum([
    'align',                // Work item to strategy alignment
    'suggest_okrs',         // Generate OKRs
    'competitive_analysis', // Research competitors
    'generate_roadmap',     // Create visual roadmap
    'impact_assessment',    // Predict business impact
  ]),
  input: z.object({
    workItemIds: z.array(z.string()).optional(),
    competitors: z.array(z.string()).optional(),
    timeframe: z.enum(['quarter', 'half', 'year']).optional(),
    groupBy: z.enum(['theme', 'phase', 'priority', 'type']).optional(),
  }),
})
```

#### Tool 5: `research` - External Research Tool

```typescript
const researchToolSchema = z.object({
  researchType: z.enum([
    'web_search',      // Quick web search
    'extract_content', // Extract from URLs
    'deep_research',   // Comprehensive research
    'quick_answer',    // Fast AI answer
  ]),
  input: z.union([
    z.object({ query: z.string(), maxResults: z.number().optional() }),
    z.object({ urls: z.array(z.string().url()), objective: z.string() }),
    z.object({ topic: z.string(), depth: z.enum(['lite', 'base', 'pro', 'ultra']) }),
    z.object({ question: z.string(), context: z.string().optional() }),
  ]),
})
```

#### Tool 6: `generate` - Content Generation Tool (NEW)

```typescript
const generateToolSchema = z.object({
  generationType: z.enum([
    'user_stories',         // "As a [persona], I want..."
    'acceptance_criteria',  // Given/When/Then
    'effort_estimate',      // T-shirt sizing, story points
    'test_cases',           // Test case outlines
    'documentation',        // Feature documentation
    'release_notes',        // Release notes from completed items
  ]),
  input: z.object({
    workItemId: z.string().optional(),
    description: z.string().optional(),
    format: z.enum(['standard', 'gherkin', 'bdd']).optional(),
    count: z.number().optional(),
    includeEdgeCases: z.boolean().optional(),
  }),
})
```

#### Tool 7: `plan` - Sprint/Planning Tool (NEW)

```typescript
const planToolSchema = z.object({
  planningType: z.enum([
    'sprint',           // Plan a sprint
    'release',          // Plan a release
    'milestone',        // Define milestones
    'capacity',         // Capacity planning
  ]),
  input: z.object({
    sprintDuration: z.number().optional(),
    startDate: z.string().optional(),
    teamCapacity: z.object({
      members: z.number(),
      hoursPerDay: z.number(),
    }).optional(),
    autoSelect: z.boolean().optional(),
    maxItems: z.number().optional(),
    sprintGoal: z.string().optional(),
    respectDependencies: z.boolean().optional(),
  }),
})
```

### AI Reasoning Decision Tree

```
User Intent
    |
    +-> Create/Modify/Delete? -----------------> entity
    |     Examples: "create feature", "add task", "link items"
    |
    +-> Analyze existing data? ----------------> analyze
    |     Examples: "find gaps", "summarize", "sentiment"
    |
    +-> Optimize/Improve workflow? ------------> optimize
    |     Examples: "prioritize", "balance workload", "risks"
    |
    +-> Strategic/Business planning? ----------> strategize
    |     Examples: "OKRs", "roadmap", "competitors"
    |
    +-> Need external/web data? ---------------> research
    |     Examples: "search", "look up", "what is"
    |
    +-> Generate content/artifacts? -----------> generate
    |     Examples: "user stories", "acceptance criteria", "estimate"
    |
    +-> Sprint/Release planning? --------------> plan
          Examples: "plan sprint", "what fits in sprint"
```

### Files to Create

```
next-app/src/lib/ai/tools/generalized/
+-- entity-tool.ts       # CRUD for all entities
+-- analyze-tool.ts      # Data analysis
+-- optimize-tool.ts     # Workflow optimization
+-- strategize-tool.ts   # Strategic planning
+-- research-tool.ts     # Web research (wraps Parallel AI)
+-- generate-tool.ts     # Content generation (NEW)
+-- plan-tool.ts         # Sprint planning (NEW)
+-- index.ts             # Exports
```

---

## Phase 4: Orchestration System

### Overview

**Branch**: `feat/orchestration-system`
**Files to create**: 8 new files in `next-app/src/lib/ai/orchestration/`
**Files to modify**: Chat API route, AI message handler
**Estimated time**: 1-2 days
**Risk**: Medium (core AI flow changes)

### Problem Statement

Currently, the platform uses a single model per request with no fallback, escalation, or quality verification. This causes:

- **Single point of failure**: If model is unavailable, request fails
- **Inconsistent quality**: Some queries need deeper reasoning
- **No learning**: System doesn't improve from user feedback
- **Missed optimization**: Same model used regardless of query type

### Solution

Implement a 4-tier orchestration system:

1. **Smart Routing** (80%) - Route to best model per query type
2. **Confidence Escalation** (15%) - Auto-escalate when uncertain
3. **Consensus Mode** (5%) - Multi-model synthesis for high-stakes
4. **Blind Comparison** (learning) - Collect user preferences

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/orchestration-system
```

#### Step 2: Create Directory Structure

```bash
cd next-app/src/lib/ai
mkdir -p orchestration
```

#### Step 3: Create Core Types

Create: `next-app/src/lib/ai/orchestration/types.ts`

```typescript
/**
 * Orchestration System Types
 * 
 * Types for multi-model orchestration, confidence escalation, and consensus.
 */

/**
 * Query types for routing decisions
 */
export type QueryType =
  | 'strategic_reasoning'
  | 'agentic_tool_use'
  | 'coding'
  | 'visual_reasoning'
  | 'large_context'
  | 'default'

/**
 * Response from a single model
 */
export interface ModelResponse {
  modelId: string
  response: string
  confidence: number        // 0-1 self-reported or calculated
  reasoning?: string        // Chain of thought (if available)
  citations?: string[]
  claims?: string[]         // Extracted factual claims
  latency: number           // ms
  tokens: {
    input: number
    output: number
  }
}

/**
 * Result from consensus mode (multiple models)
 */
export interface ConsensusResult {
  synthesizedAnswer: string
  agreementLevel: number    // 0-1 overall agreement
  claims: Array<{
    claim: string
    supportedBy: string[]   // Model IDs that agree
    confidence: number      // % of models agreeing
  }>
  conflicts?: Array<{
    topic: string
    positions: Array<{ modelId: string; position: string }>
  }>
  modelResponses: ModelResponse[]
}

/**
 * Result from blind comparison (learning mode)
 */
export interface BlindComparisonResult {
  responses: Array<{
    id: string              // Anonymous ID (A, B, C)
    response: string
    modelId: string         // Hidden until user picks
  }>
  queryType: QueryType
  timestamp: string
}

/**
 * Configuration for the orchestrator
 */
export interface OrchestratorConfig {
  mode: 'auto' | 'consensus' | 'blind_comparison' | 'quick'
  tiers: {
    confidenceThreshold: number     // 0.7 default - escalate below this
    consensusModels: number         // 3-4 models for consensus
    blindComparisonRate: number     // 0.05 (5%) for learning
  }
  routing: Record<QueryType, {
    primary: string
    fallback: string
    tertiary: string
  }>
  learning: {
    enabled: boolean
    minSamples: number              // 100 before adjusting weights
    weightDecay: number             // 0.95 for older samples
  }
}

/**
 * Context for query processing
 */
export interface QueryContext {
  workspaceId: string
  teamId: string
  userId: string
  sessionId: string
  previousMessages?: Array<{ role: string; content: string }>
  hasImages?: boolean
  estimatedTokens?: number
}

/**
 * Final orchestrated response
 */
export interface OrchestratedResponse {
  response: string
  tier: 'routing' | 'escalation' | 'consensus' | 'blind_comparison'
  modelUsed: string | string[]
  confidence: number
  metadata: {
    queryType: QueryType
    latency: number
    tokens: { input: number; output: number }
    escalationReason?: string
  }
}
```

#### Step 4: Create Query Classifier

Create: `next-app/src/lib/ai/orchestration/query-classifier.ts`

```typescript
/**
 * Query Classifier
 * 
 * Classifies incoming queries to route to the optimal model.
 * Uses lightweight pattern matching + AI fallback for ambiguous queries.
 */

import type { QueryType, QueryContext } from './types'

/**
 * Pattern-based classification rules (fast, no AI call)
 */
const CLASSIFICATION_PATTERNS: Record<QueryType, RegExp[]> = {
  strategic_reasoning: [
    /\b(strategy|strategic|plan|planning|analyze|analysis|roadmap|okr|objective|goal)\b/i,
    /\b(why|should we|what if|compare|evaluate|assess|recommend)\b/i,
    /\b(prioritize|priority|impact|risk|tradeoff)\b/i,
  ],
  agentic_tool_use: [
    /\b(create|add|update|delete|remove|link|connect)\b/i,
    /\b(task|feature|work item|dependency|insight)\b/i,
    /\b(do|make|build|generate|set up)\b/i,
  ],
  coding: [
    /\b(code|function|class|component|api|endpoint)\b/i,
    /\b(bug|fix|error|debug|refactor|optimize)\b/i,
    /\b(typescript|javascript|python|react|sql)\b/i,
    /```[\s\S]*```/,  // Code blocks
  ],
  visual_reasoning: [
    /\b(image|picture|screenshot|diagram|chart|graph)\b/i,
    /\b(see|look at|analyze this|what's in)\b/i,
  ],
  large_context: [
    /\b(document|file|entire|all|full|complete|whole)\b/i,
    /\b(summarize all|analyze entire|review full)\b/i,
  ],
  default: [], // Fallback
}

/**
 * Classify a query into a query type
 * 
 * @param query - User's query text
 * @param context - Additional context (images, token count, etc.)
 * @returns The classified query type
 */
export function classifyQuery(query: string, context: QueryContext): QueryType {
  // Check for images first
  if (context.hasImages) {
    return 'visual_reasoning'
  }

  // Check for large context
  if (context.estimatedTokens && context.estimatedTokens > 100_000) {
    return 'large_context'
  }

  // Pattern-based classification
  for (const [queryType, patterns] of Object.entries(CLASSIFICATION_PATTERNS)) {
    if (queryType === 'default') continue
    
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return queryType as QueryType
      }
    }
  }

  // Default fallback
  return 'default'
}

/**
 * Get confidence score for the classification
 * 
 * @param query - User's query
 * @param classifiedType - The classified type
 * @returns Confidence score 0-1
 */
export function getClassificationConfidence(query: string, classifiedType: QueryType): number {
  const patterns = CLASSIFICATION_PATTERNS[classifiedType]
  if (!patterns || patterns.length === 0) return 0.5 // Default type

  let matches = 0
  for (const pattern of patterns) {
    if (pattern.test(query)) matches++
  }

  // More pattern matches = higher confidence
  return Math.min(0.5 + (matches * 0.15), 1.0)
}
```

#### Step 5: Create Multi-Model Orchestrator

Create: `next-app/src/lib/ai/orchestration/multi-model-orchestrator.ts`

```typescript
/**
 * Multi-Model Orchestrator
 * 
 * Core orchestration logic implementing the 4-tier architecture:
 * 1. Smart Routing (80%) - Best model per query type
 * 2. Confidence Escalation (15%) - Auto-escalate when uncertain
 * 3. Consensus Mode (5%) - Multi-model for high-stakes
 * 4. Blind Comparison (learning) - User preference collection
 */

import { generateText } from 'ai'
import { openrouter } from '../ai-sdk-client'
import { MODEL_ROUTING } from '../models-config'
import { classifyQuery, getClassificationConfidence } from './query-classifier'
import type {
  QueryType,
  QueryContext,
  ModelResponse,
  OrchestratorConfig,
  OrchestratedResponse,
} from './types'

/**
 * Default orchestrator configuration
 */
export const DEFAULT_CONFIG: OrchestratorConfig = {
  mode: 'auto',
  tiers: {
    confidenceThreshold: 0.7,
    consensusModels: 3,
    blindComparisonRate: 0.05, // 5%
  },
  routing: {
    strategic_reasoning: MODEL_ROUTING.strategic_reasoning,
    agentic_tool_use: MODEL_ROUTING.agentic_tool_use,
    coding: MODEL_ROUTING.coding,
    visual_reasoning: MODEL_ROUTING.visual_reasoning,
    large_context: MODEL_ROUTING.large_context,
    default: MODEL_ROUTING.default,
  },
  learning: {
    enabled: true,
    minSamples: 100,
    weightDecay: 0.95,
  },
}

/**
 * Main orchestration function
 * 
 * Routes queries through the appropriate tier based on confidence and config.
 */
export async function orchestrateQuery(
  query: string,
  context: QueryContext,
  config: OrchestratorConfig = DEFAULT_CONFIG
): Promise<OrchestratedResponse> {
  const startTime = Date.now()

  // Step 1: Classify query type
  const queryType = classifyQuery(query, context)
  const classificationConfidence = getClassificationConfidence(query, queryType)

  // Step 2: Check if blind comparison should trigger (learning mode)
  if (
    config.learning.enabled &&
    Math.random() < config.tiers.blindComparisonRate
  ) {
    return await executeBlindComparison(query, queryType, context, config)
  }

  // Step 3: Quick mode - single model, no escalation
  if (config.mode === 'quick') {
    return await executeSingleModel(query, queryType, context, config, startTime)
  }

  // Step 4: Consensus mode - always use multiple models
  if (config.mode === 'consensus') {
    return await executeConsensus(query, queryType, context, config, startTime)
  }

  // Step 5: Auto mode - smart routing with escalation
  const routing = config.routing[queryType]
  let response = await queryModel(routing.primary, query, context)

  // Check confidence - escalate if needed
  if (response.confidence < config.tiers.confidenceThreshold) {
    const secondaryResponse = await queryModel(routing.fallback, query, context)

    // Check for disagreement
    if (detectDisagreement(response, secondaryResponse)) {
      return await executeConsensus(query, queryType, context, config, startTime)
    }

    // Return higher confidence response
    response = response.confidence > secondaryResponse.confidence
      ? response
      : secondaryResponse
  }

  return {
    response: response.response,
    tier: response.confidence < config.tiers.confidenceThreshold ? 'escalation' : 'routing',
    modelUsed: response.modelId,
    confidence: response.confidence,
    metadata: {
      queryType,
      latency: Date.now() - startTime,
      tokens: response.tokens,
      escalationReason: response.confidence < config.tiers.confidenceThreshold
        ? `Primary model confidence (${response.confidence.toFixed(2)}) below threshold`
        : undefined,
    },
  }
}

/**
 * Query a single model
 */
async function queryModel(
  modelId: string,
  query: string,
  context: QueryContext
): Promise<ModelResponse> {
  const startTime = Date.now()

  try {
    const result = await generateText({
      model: openrouter(modelId),
      prompt: query,
      system: context.previousMessages
        ? `Previous conversation context available.`
        : undefined,
    })

    // Extract confidence from response (if model provides it)
    const confidence = extractConfidence(result.text)

    return {
      modelId,
      response: result.text,
      confidence,
      latency: Date.now() - startTime,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
      },
    }
  } catch (error) {
    throw new Error(`Model ${modelId} failed: ${error}`)
  }
}

/**
 * Execute single model mode (no escalation)
 */
async function executeSingleModel(
  query: string,
  queryType: QueryType,
  context: QueryContext,
  config: OrchestratorConfig,
  startTime: number
): Promise<OrchestratedResponse> {
  const routing = config.routing[queryType]
  const response = await queryModel(routing.primary, query, context)

  return {
    response: response.response,
    tier: 'routing',
    modelUsed: response.modelId,
    confidence: response.confidence,
    metadata: {
      queryType,
      latency: Date.now() - startTime,
      tokens: response.tokens,
    },
  }
}

/**
 * Execute consensus mode (multiple models)
 */
async function executeConsensus(
  query: string,
  queryType: QueryType,
  context: QueryContext,
  config: OrchestratorConfig,
  startTime: number
): Promise<OrchestratedResponse> {
  const routing = config.routing[queryType]
  const modelIds = [routing.primary, routing.fallback, routing.tertiary]

  // Query all models in parallel
  const responses = await Promise.all(
    modelIds.map(modelId => queryModel(modelId, query, context))
  )

  // Synthesize consensus
  const consensus = await synthesizeConsensus(responses, query, context)

  return {
    response: consensus.synthesizedAnswer,
    tier: 'consensus',
    modelUsed: modelIds,
    confidence: consensus.agreementLevel,
    metadata: {
      queryType,
      latency: Date.now() - startTime,
      tokens: responses.reduce(
        (acc, r) => ({
          input: acc.input + r.tokens.input,
          output: acc.output + r.tokens.output,
        }),
        { input: 0, output: 0 }
      ),
    },
  }
}

/**
 * Execute blind comparison mode (learning)
 */
async function executeBlindComparison(
  query: string,
  queryType: QueryType,
  context: QueryContext,
  config: OrchestratorConfig
): Promise<OrchestratedResponse> {
  const routing = config.routing[queryType]
  const modelIds = [routing.primary, routing.fallback, routing.tertiary]

  // Query all models in parallel
  const responses = await Promise.all(
    modelIds.map(modelId => queryModel(modelId, query, context))
  )

  // Shuffle responses for blind comparison
  const shuffled = responses
    .map((r, i) => ({ ...r, anonymousId: String.fromCharCode(65 + i) })) // A, B, C
    .sort(() => Math.random() - 0.5)

  // Return first response but flag as blind comparison
  // UI will show all options for user to pick
  return {
    response: JSON.stringify({
      type: 'blind_comparison',
      options: shuffled.map(r => ({
        id: r.anonymousId,
        response: r.response,
        // modelId is hidden until user picks
      })),
      queryType,
    }),
    tier: 'blind_comparison',
    modelUsed: modelIds,
    confidence: 0.5, // Unknown until user picks
    metadata: {
      queryType,
      latency: 0,
      tokens: { input: 0, output: 0 },
    },
  }
}

/**
 * Synthesize consensus from multiple model responses
 */
async function synthesizeConsensus(
  responses: ModelResponse[],
  originalQuery: string,
  context: QueryContext
): Promise<{ synthesizedAnswer: string; agreementLevel: number }> {
  // Use the highest-confidence model to synthesize
  const synthesizer = responses.reduce((best, r) =>
    r.confidence > best.confidence ? r : best
  )

  const synthesisPrompt = `
You are synthesizing responses from multiple AI models to a user query.

Original Query: ${originalQuery}

Model Responses:
${responses.map((r, i) => `
Response ${i + 1} (Confidence: ${r.confidence.toFixed(2)}):
${r.response}
`).join('\n')}

Instructions:
1. Identify points of agreement across all responses
2. Note any significant disagreements
3. Provide a unified answer that captures the consensus
4. If there are disagreements, explain both perspectives

Synthesized Response:
`

  const result = await generateText({
    model: openrouter(synthesizer.modelId),
    prompt: synthesisPrompt,
  })

  // Calculate agreement level based on response similarity
  const agreementLevel = calculateAgreement(responses)

  return {
    synthesizedAnswer: result.text,
    agreementLevel,
  }
}

/**
 * Detect if two responses disagree significantly
 */
function detectDisagreement(response1: ModelResponse, response2: ModelResponse): boolean {
  // Simple heuristic: if both have low confidence, they might disagree
  if (response1.confidence < 0.6 && response2.confidence < 0.6) {
    return true
  }

  // Could add more sophisticated disagreement detection here
  // e.g., semantic similarity, claim extraction, etc.
  return false
}

/**
 * Extract confidence from response text
 */
function extractConfidence(responseText: string): number {
  // Look for explicit confidence markers
  const confidenceMatch = responseText.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i)
  if (confidenceMatch) {
    return parseFloat(confidenceMatch[1])
  }

  // Look for uncertainty markers
  const uncertaintyMarkers = [
    'i think', "i'm not sure", 'possibly', 'maybe', 'might',
    'unclear', 'uncertain', 'i believe', 'could be'
  ]
  
  const lowerText = responseText.toLowerCase()
  let uncertaintyCount = 0
  for (const marker of uncertaintyMarkers) {
    if (lowerText.includes(marker)) uncertaintyCount++
  }

  // More uncertainty markers = lower confidence
  return Math.max(0.5, 0.95 - (uncertaintyCount * 0.1))
}

/**
 * Calculate agreement level between responses
 */
function calculateAgreement(responses: ModelResponse[]): number {
  // Simple: average of all confidences
  // More sophisticated: semantic similarity comparison
  const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length
  return avgConfidence
}

export { queryModel, detectDisagreement, extractConfidence }
```

#### Step 6: Create Consensus Engine

Create: `next-app/src/lib/ai/orchestration/consensus-engine.ts`

```typescript
/**
 * Consensus Engine
 * 
 * Extracts claims from model responses and calculates agreement levels.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { openrouter } from '../ai-sdk-client'
import type { ModelResponse, ConsensusResult } from './types'

/**
 * Schema for extracted claims
 */
const claimsSchema = z.object({
  claims: z.array(z.object({
    claim: z.string().describe('A factual claim from the response'),
    isFactual: z.boolean().describe('Whether this is a verifiable fact'),
    confidence: z.number().describe('Confidence in this claim (0-1)'),
  })),
})

/**
 * Extract claims from a model response
 */
export async function extractClaims(response: ModelResponse): Promise<string[]> {
  const result = await generateObject({
    model: openrouter('z-ai/glm-4.7'), // Use reasoning model for extraction
    schema: claimsSchema,
    prompt: `Extract the key factual claims from this response:

${response.response}

Focus on:
1. Specific facts, numbers, or dates
2. Technical statements
3. Recommendations with rationale
4. Conclusions or decisions`,
  })

  return result.object.claims.map(c => c.claim)
}

/**
 * Build full consensus result from multiple responses
 */
export async function buildConsensusResult(
  responses: ModelResponse[],
  synthesizedAnswer: string
): Promise<ConsensusResult> {
  // Extract claims from each response
  const claimsPerResponse = await Promise.all(
    responses.map(async (r) => ({
      modelId: r.modelId,
      claims: await extractClaims(r),
    }))
  )

  // Find common claims
  const allClaims = claimsPerResponse.flatMap(c => c.claims)
  const claimCounts = new Map<string, string[]>()

  for (const { modelId, claims } of claimsPerResponse) {
    for (const claim of claims) {
      const similar = findSimilarClaim(claim, Array.from(claimCounts.keys()))
      const key = similar || claim
      
      if (!claimCounts.has(key)) {
        claimCounts.set(key, [])
      }
      claimCounts.get(key)!.push(modelId)
    }
  }

  // Build claims array with confidence
  const claims = Array.from(claimCounts.entries()).map(([claim, supportedBy]) => ({
    claim,
    supportedBy,
    confidence: supportedBy.length / responses.length,
  }))

  // Find conflicts (claims only supported by one model)
  const conflicts = claims
    .filter(c => c.confidence < 0.5)
    .map(c => ({
      topic: c.claim,
      positions: c.supportedBy.map(modelId => ({
        modelId,
        position: claimsPerResponse.find(r => r.modelId === modelId)?.claims.find(
          cl => cl.includes(c.claim.split(' ')[0])
        ) || c.claim,
      })),
    }))

  // Calculate overall agreement
  const agreementLevel = claims.length > 0
    ? claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
    : 0.5

  return {
    synthesizedAnswer,
    agreementLevel,
    claims: claims.filter(c => c.confidence >= 0.5), // Only high-agreement claims
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    modelResponses: responses,
  }
}

/**
 * Find a similar claim in existing claims
 */
function findSimilarClaim(newClaim: string, existingClaims: string[]): string | null {
  const newWords = new Set(newClaim.toLowerCase().split(/\s+/))
  
  for (const existing of existingClaims) {
    const existingWords = new Set(existing.toLowerCase().split(/\s+/))
    const intersection = new Set([...newWords].filter(w => existingWords.has(w)))
    const union = new Set([...newWords, ...existingWords])
    
    // Jaccard similarity > 0.5 = similar enough
    if (intersection.size / union.size > 0.5) {
      return existing
    }
  }
  
  return null
}
```

#### Step 7: Create Weight Learning

Create: `next-app/src/lib/ai/orchestration/weight-learning.ts`

```typescript
/**
 * Weight Learning
 * 
 * Learns optimal model routing weights from blind comparison feedback.
 */

import type { QueryType } from './types'

/**
 * Model performance record
 */
interface ModelPerformance {
  modelId: string
  queryType: QueryType
  wins: number
  losses: number
  totalComparisons: number
  winRate: number
  lastUpdated: string
}

/**
 * In-memory performance cache (should be persisted to DB in production)
 */
const performanceCache = new Map<string, ModelPerformance>()

/**
 * Record a blind comparison result
 */
export async function recordComparisonResult(
  winnerId: string,
  loserId: string,
  queryType: QueryType
): Promise<void> {
  // Update winner
  const winnerKey = `${winnerId}:${queryType}`
  const winnerPerf = performanceCache.get(winnerKey) || createPerformance(winnerId, queryType)
  winnerPerf.wins++
  winnerPerf.totalComparisons++
  winnerPerf.winRate = winnerPerf.wins / winnerPerf.totalComparisons
  winnerPerf.lastUpdated = new Date().toISOString()
  performanceCache.set(winnerKey, winnerPerf)

  // Update loser
  const loserKey = `${loserId}:${queryType}`
  const loserPerf = performanceCache.get(loserKey) || createPerformance(loserId, queryType)
  loserPerf.losses++
  loserPerf.totalComparisons++
  loserPerf.winRate = loserPerf.wins / loserPerf.totalComparisons
  loserPerf.lastUpdated = new Date().toISOString()
  performanceCache.set(loserKey, loserPerf)
}

/**
 * Get current model weights for a query type
 */
export function getModelWeights(queryType: QueryType): Map<string, number> {
  const weights = new Map<string, number>()
  
  for (const [key, perf] of performanceCache.entries()) {
    if (key.endsWith(`:${queryType}`)) {
      weights.set(perf.modelId, perf.winRate)
    }
  }
  
  return weights
}

/**
 * Check if we have enough samples to adjust routing
 */
export function hasEnoughSamples(queryType: QueryType, minSamples: number): boolean {
  let totalSamples = 0
  
  for (const [key, perf] of performanceCache.entries()) {
    if (key.endsWith(`:${queryType}`)) {
      totalSamples += perf.totalComparisons
    }
  }
  
  return totalSamples >= minSamples
}

/**
 * Get recommended routing based on learned weights
 */
export function getLearnedRouting(queryType: QueryType): {
  primary: string
  fallback: string
  tertiary: string
} | null {
  const weights = getModelWeights(queryType)
  
  if (weights.size < 3) return null // Not enough data
  
  // Sort by win rate
  const sorted = Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
  
  return {
    primary: sorted[0][0],
    fallback: sorted[1][0],
    tertiary: sorted[2][0],
  }
}

function createPerformance(modelId: string, queryType: QueryType): ModelPerformance {
  return {
    modelId,
    queryType,
    wins: 0,
    losses: 0,
    totalComparisons: 0,
    winRate: 0.5, // Start neutral
    lastUpdated: new Date().toISOString(),
  }
}
```

#### Step 8: Create Index File

Create: `next-app/src/lib/ai/orchestration/index.ts`

```typescript
/**
 * Orchestration System Index
 */

export * from './types'
export { classifyQuery, getClassificationConfidence } from './query-classifier'
export {
  orchestrateQuery,
  DEFAULT_CONFIG,
  queryModel,
  detectDisagreement,
  extractConfidence,
} from './multi-model-orchestrator'
export { extractClaims, buildConsensusResult } from './consensus-engine'
export {
  recordComparisonResult,
  getModelWeights,
  hasEnoughSamples,
  getLearnedRouting,
} from './weight-learning'
```

#### Step 9: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

#### Step 10: Run Linter

```bash
npm run lint
```

### Testing Plan

#### Test 1: Query Classification

```typescript
import { classifyQuery, getClassificationConfidence } from '@/lib/ai/orchestration'

// Test strategic query
const type1 = classifyQuery('What strategy should we use for our roadmap?', context)
console.log(type1) // Expected: 'strategic_reasoning'

// Test coding query
const type2 = classifyQuery('Fix the bug in the authentication function', context)
console.log(type2) // Expected: 'coding'

// Test tool use query
const type3 = classifyQuery('Create a new feature called Dark Mode', context)
console.log(type3) // Expected: 'agentic_tool_use'
```

#### Test 2: Single Model Routing

```typescript
import { orchestrateQuery, DEFAULT_CONFIG } from '@/lib/ai/orchestration'

const result = await orchestrateQuery(
  'What are the risks in our current plan?',
  testContext,
  { ...DEFAULT_CONFIG, mode: 'quick' }
)

console.log(result.tier) // Expected: 'routing'
console.log(result.modelUsed) // Expected: 'z-ai/glm-4.7'
```

#### Test 3: Consensus Mode

```typescript
const result = await orchestrateQuery(
  'Should we prioritize feature A or B?',
  testContext,
  { ...DEFAULT_CONFIG, mode: 'consensus' }
)

console.log(result.tier) // Expected: 'consensus'
console.log(result.modelUsed) // Expected: ['z-ai/glm-4.7', ...]
```

### Commit & PR

#### Commit

```bash
git add next-app/src/lib/ai/orchestration/
git commit -m "feat: add 4-tier multi-model orchestration system

Implement orchestration system with:
- Smart Routing (80%): Route queries to optimal model by type
- Confidence Escalation (15%): Auto-escalate when uncertain
- Consensus Mode (5%): Multi-model synthesis for high-stakes
- Blind Comparison (learning): Collect user preferences

Components:
- query-classifier.ts: Pattern-based query type classification
- multi-model-orchestrator.ts: Core orchestration logic
- consensus-engine.ts: Claim extraction and synthesis
- weight-learning.ts: Adaptive routing from feedback

Benefits:
- 99.9% availability with fallback chains
- +15% accuracy via consensus mode
- Self-improving routing via blind comparisons"
```

#### Push & PR

```bash
git push -u origin feat/orchestration-system

gh pr create --title "feat: 4-tier multi-model orchestration system" --body "$(cat <<'EOF'
## Summary
Implement intelligent multi-model orchestration with automatic escalation and consensus.

## 4-Tier Architecture
| Tier | Usage | Description |
|------|-------|-------------|
| Smart Routing | 80% | Route to best model per query type |
| Confidence Escalation | 15% | Auto-escalate when uncertain |
| Consensus Mode | 5% | Multi-model for high-stakes queries |
| Blind Comparison | learning | Collect user preferences |

## Query Types & Routing
| Query Type | Primary | Fallback | Tertiary |
|------------|---------|----------|----------|
| Strategic Reasoning | GLM 4.7 | DeepSeek V3.2 | Gemini 3 |
| Agentic Tool Use | GLM 4.7 | Gemini 3 | MiniMax M2.1 |
| Coding | MiniMax M2.1 | GLM 4.7 | Kimi K2 |
| Visual | Gemini 3 | Grok 4 | Gemini 2.5 |
| Default | Kimi K2 | GLM 4.7 | MiniMax M2.1 |

## Files Added
```

next-app/src/lib/ai/orchestration/
├── types.ts                    # Type definitions
├── query-classifier.ts         # Query classification
├── multi-model-orchestrator.ts # Core orchestration
├── consensus-engine.ts         # Multi-model consensus
├── weight-learning.ts          # Adaptive learning
└── index.ts                    # Exports

```

## Test Plan
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Query classification accuracy tested
- [ ] Single model routing works
- [ ] Consensus mode synthesizes correctly
- [ ] Weight learning records results
EOF
)"
```

### Expected Final State

After this phase:

| Metric | Before | After |
|--------|--------|-------|
| Model Availability | Single point of failure | 99.9% with fallbacks |
| Response Quality | Fixed | Adaptive via escalation |
| Learning | None | Continuous improvement |

### Code Location Reference

```
next-app/src/lib/ai/orchestration/
├── types.ts                    # Line 1-100: Type definitions
├── query-classifier.ts         # Line 1-80: Classification logic
├── multi-model-orchestrator.ts # Line 1-300: Core orchestrator
├── consensus-engine.ts         # Line 1-120: Consensus building
├── weight-learning.ts          # Line 1-100: Learning from feedback
└── index.ts                    # Line 1-20: Exports
```

### Rollback Plan

If issues arise:

```bash
# Feature flag off
FEATURE_ORCHESTRATION=false

# Or revert
git checkout main
git branch -D feat/orchestration-system
```

### Dependencies

- **Requires**: Phase 2 complete (model routing config), Phase 3 complete (generalized tools)
- **Blocks**: Phase 6 (UX needs orchestration status)

### 4-Tier Architecture

```
+----------------------------------------------------------+
|                     QUERY INTAKE                          |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  | TIER 1: SMART ROUTING (80% of queries)             |  |
|  |                                                    |  |
|  | Query Type -> Best Model Selection (with fallback) |  |
|  | - Reasoning/Planning -> GLM 4.7 -> DeepSeek        |  |
|  | - Coding -> MiniMax M2.1 -> GLM 4.7 -> Kimi K2     |  |
|  | - Vision -> Gemini 3 Flash -> Grok 4 Fast          |  |
|  |                                                    |  |
|  | Cost: 1x | Latency: ~1s                            |  |
|  +----------------------------------------------------+  |
|                          |                               |
|                 Confidence < 70%?                        |
|                          | YES                           |
|  +----------------------------------------------------+  |
|  | TIER 2: CONFIDENCE ESCALATION (15% of queries)     |  |
|  |                                                    |  |
|  | Primary Model uncertain -> Query fallback model    |  |
|  | Compare responses -> Return higher confidence      |  |
|  |                                                    |  |
|  | Cost: 1.3x avg | Latency: ~1.5s                    |  |
|  +----------------------------------------------------+  |
|                          |                               |
|              Disagreement detected?                      |
|                          | YES                           |
|  +----------------------------------------------------+  |
|  | TIER 3: CONSENSUS MODE (5% of queries)             |  |
|  |                                                    |  |
|  | High-stakes OR user-triggered "Deep Think"         |  |
|  | - Query 3-4 models in parallel                     |  |
|  | - Extract claims from each                         |  |
|  | - Calculate agreement levels                       |  |
|  | - Synthesize unified answer with confidence        |  |
|  |                                                    |  |
|  | Output: "Based on 3 models: 100% agree on X,       |  |
|  |          67% agree on Y, conflicting views on Z"   |  |
|  |                                                    |  |
|  | Cost: 3-4x | Latency: ~3s (parallel)               |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | TIER 4: BLIND COMPARISON (Learning - 5% sampling)  |  |
|  |                                                    |  |
|  | "Which response is better?"                        |  |
|  | +-------------+  +-------------+  +-------------+  |  |
|  | | Response A  |  | Response B  |  | Response C  |  |  |
|  | | (GLM 4.7)   |  | (MiniMax)   |  | (Gemini)    |  |  |
|  | |  [hidden]   |  |  [hidden]   |  |  [hidden]   |  |  |
|  | +-------------+  +-------------+  +-------------+  |  |
|  |                                                    |  |
|  | User picks -> System logs winner per query type    |  |
|  | -> Optimizes routing weights over time             |  |
|  |                                                    |  |
|  | Cost: 3-4x | Used sparingly for learning           |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Core Types

```typescript
// multi-model-orchestrator.ts

interface ModelResponse {
  modelId: string;           // Hidden in blind mode
  response: string;
  confidence: number;        // 0-1 self-reported or calculated
  reasoning?: string;        // Chain of thought
  citations?: string[];
  claims?: string[];         // Extracted factual claims
  latency: number;
  tokens: { input: number; output: number };
}

interface ConsensusResult {
  synthesizedAnswer: string;
  agreementLevel: number;    // 0-1 overall
  claims: {
    claim: string;
    supportedBy: string[];   // Model IDs that agree
    confidence: number;      // % of models agreeing
  }[];
  conflicts?: {
    topic: string;
    positions: { modelId: string; position: string }[];
  }[];
}

interface OrchestratorConfig {
  mode: 'auto' | 'consensus' | 'blind_comparison';
  tiers: {
    confidenceThreshold: number;     // 0.7 for escalation
    consensusModels: number;         // 3-4 models
    blindComparisonRate: number;     // 0.05 (5%)
  };
  routing: Record<QueryType, {
    primary: string;
    fallback: string;
    tertiary: string;
  }>;
  learning: {
    enabled: boolean;
    minSamples: number;     // 100 before adjusting weights
    weightDecay: number;    // 0.95 for older samples
  };
}
```

### Orchestration Flow

```typescript
async function orchestrateQuery(
  query: string,
  context: QueryContext,
  config: OrchestratorConfig
): Promise<OrchestratedResponse> {

  // Step 1: Classify query type
  const queryType = await classifyQueryType(query, context);

  // Step 2: Check if blind comparison triggered (learning mode)
  if (config.learning.enabled && Math.random() < config.tiers.blindComparisonRate) {
    return await executeBlindComparison(query, context, config);
  }

  // Step 3: Route to primary model (with fallback chain)
  const routing = config.routing[queryType];
  let response = await tryModelChain(routing, query, context);

  // Step 4: Check confidence - escalate if needed
  if (response.confidence < config.tiers.confidenceThreshold) {
    const secondaryResponse = await queryModel(routing.fallback, query, context);

    // Compare and check for disagreement
    if (detectDisagreement(response, secondaryResponse)) {
      return await executeConsensus(query, context, config);
    }

    // Return higher confidence
    response = response.confidence > secondaryResponse.confidence
      ? response : secondaryResponse;
  }

  return response;
}

// Fallback chain execution
async function tryModelChain(
  routing: { primary: string; fallback: string; tertiary: string },
  query: string,
  context: QueryContext
): Promise<ModelResponse> {
  try {
    return await queryModel(routing.primary, query, context);
  } catch (primaryError) {
    console.warn(`Primary model failed: ${primaryError.message}`);
    try {
      return await queryModel(routing.fallback, query, context);
    } catch (fallbackError) {
      console.warn(`Fallback model failed: ${fallbackError.message}`);
      return await queryModel(routing.tertiary, query, context);
    }
  }
}
```

### Files to Create

```
next-app/src/lib/ai/orchestration/
+-- multi-model-orchestrator.ts   # Core orchestration logic
+-- fallback-chain.ts             # Fallback model execution
+-- consensus-engine.ts           # Multi-model consensus
+-- blind-comparison.ts           # Learning mode
+-- weight-learning.ts            # Adaptive weight adjustment
+-- claim-extractor.ts            # Extract claims from responses
+-- thinking-status.ts            # Thinking status management
+-- index.ts                      # Exports
```

---

## Phase 5: Agent Memory System

### Overview

**Branch**: `feat/agent-memory-system`
**Files to create**:

- 5 files in `next-app/src/lib/ai/memory/`
- 7 files in `next-app/src/components/ai/memory/`
- 5 API routes in `next-app/src/app/api/ai/memory/`
**Files to modify**: Supabase schema, chat system prompt
**Estimated time**: 1-2 days
**Risk**: Medium (new database table, UI components)

### Problem Statement

AI models have no persistent context about:

- User preferences and working style
- Project-specific patterns and conventions
- Previously rejected suggestions (repeats mistakes)
- Domain-specific knowledge

Each conversation starts from zero context, leading to repeated corrections and inconsistent responses.

### Solution

Implement a persistent memory system with:

- **10k token limit** - Efficient context injection
- **5 memory categories** - Organized knowledge
- **Auto-optimization** - Compress when near limit
- **Learning mechanism** - Track rejections/acceptances
- **User management UI** - View, edit, delete entries

A persistent memory file that gives AI models context about the user's preferences, project patterns, and learned rules. Stays efficient with a **10k token limit** and provides UI for user management.

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/agent-memory-system
```

#### Step 2: Create Database Migration

Create: `supabase/migrations/20251231_agent_memory.sql`

```sql
-- Agent Memory table for persistent AI context
CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISSMS')),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  token_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX idx_agent_memory_workspace ON agent_memory(workspace_id);
CREATE INDEX idx_agent_memory_team ON agent_memory(team_id);

-- RLS policies
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team's memory"
  ON agent_memory FOR SELECT
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert memory for their team"
  ON agent_memory FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their team's memory"
  ON agent_memory FOR UPDATE
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON agent_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 3: Create Directory Structure

```bash
cd next-app/src/lib/ai
mkdir -p memory

cd next-app/src/components/ai
mkdir -p memory

cd next-app/src/app/api/ai
mkdir -p memory/entry/[id] memory/optimize memory/learn
```

#### Step 4: Create Memory Types

Create: `next-app/src/lib/ai/memory/types.ts`

```typescript
/**
 * Agent Memory Types
 * 
 * Types for the persistent memory system.
 */

/**
 * Memory entry sources
 */
export type MemorySource = 'manual' | 'learned' | 'analyzed' | 'inferred'

/**
 * Memory categories
 */
export type MemoryCategory =
  | 'userPreferences'
  | 'projectPatterns'
  | 'learnedRules'
  | 'domainKnowledge'
  | 'communicationStyle'

/**
 * Single memory entry
 */
export interface MemoryEntry {
  id: string
  content: string
  category: MemoryCategory
  source: MemorySource
  confidence: number      // 0-1, higher = more certain
  usageCount: number      // How often this rule was applied
  lastUsed: string        // ISO date
  tokens: number          // Pre-calculated token count
  canDelete: boolean      // Some entries are protected
  createdAt: string       // ISO date
}

/**
 * Full agent memory structure
 */
export interface AgentMemory {
  version: string
  workspaceId: string
  teamId: string
  tokenCount: number
  maxTokens: number       // 10000

  sections: {
    userPreferences: MemoryEntry[]
    projectPatterns: MemoryEntry[]
    learnedRules: MemoryEntry[]
    domainKnowledge: MemoryEntry[]
    communicationStyle: MemoryEntry[]
  }

  metadata: {
    createdAt: string
    lastUpdated: string
    lastOptimized: string
    entryCount: number
  }
}

/**
 * Memory operation result
 */
export interface MemoryOperationResult {
  success: boolean
  memory?: AgentMemory
  error?: string
  tokensUsed?: number
  tokensRemaining?: number
}

/**
 * Default empty memory
 */
export const EMPTY_MEMORY: AgentMemory = {
  version: '1.0',
  workspaceId: '',
  teamId: '',
  tokenCount: 0,
  maxTokens: 10000,
  sections: {
    userPreferences: [],
    projectPatterns: [],
    learnedRules: [],
    domainKnowledge: [],
    communicationStyle: [],
  },
  metadata: {
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastOptimized: '',
    entryCount: 0,
  },
}
```

#### Step 5: Create Memory Tokenizer

Create: `next-app/src/lib/ai/memory/memory-tokenizer.ts`

```typescript
/**
 * Memory Tokenizer
 * 
 * Token counting using js-tiktoken for accurate GPT token estimates.
 */

import { getEncoding } from 'js-tiktoken'

// Use cl100k_base encoding (GPT-4, Claude compatible)
const encoder = getEncoding('cl100k_base')

/**
 * Count tokens in a string
 */
export function countTokens(text: string): number {
  return encoder.encode(text).length
}

/**
 * Count tokens for an entire memory object
 */
export function countMemoryTokens(memory: AgentMemory): number {
  let total = 0
  
  for (const section of Object.values(memory.sections)) {
    for (const entry of section) {
      total += entry.tokens
    }
  }
  
  return total
}

/**
 * Check if adding content would exceed limit
 */
export function wouldExceedLimit(
  currentTokens: number,
  newContent: string,
  maxTokens: number = 10000
): boolean {
  const newTokens = countTokens(newContent)
  return currentTokens + newTokens > maxTokens
}

/**
 * Estimate tokens for a memory entry
 */
export function estimateEntryTokens(content: string): number {
  // Content + metadata overhead (~20 tokens)
  return countTokens(content) + 20
}

import type { AgentMemory } from './types'
```

#### Step 6: Create Core Agent Memory Module

Create: `next-app/src/lib/ai/memory/agent-memory.ts`

```typescript
/**
 * Agent Memory
 * 
 * Core memory management: CRUD operations, persistence, injection.
 */

import { createClient } from '@/lib/supabase/server'
import { countTokens, countMemoryTokens } from './memory-tokenizer'
import type {
  AgentMemory,
  MemoryEntry,
  MemoryCategory,
  MemorySource,
  MemoryOperationResult,
  EMPTY_MEMORY,
} from './types'

/**
 * Get memory for a workspace
 */
export async function getMemory(workspaceId: string, teamId: string): Promise<AgentMemory> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('agent_memory')
    .select('content, token_count')
    .eq('workspace_id', workspaceId)
    .eq('team_id', teamId)
    .single()

  if (error || !data) {
    // Return empty memory if none exists
    return {
      ...EMPTY_MEMORY,
      workspaceId,
      teamId,
    }
  }

  return data.content as AgentMemory
}

/**
 * Save memory for a workspace
 */
export async function saveMemory(memory: AgentMemory): Promise<MemoryOperationResult> {
  const supabase = await createClient()
  
  const tokenCount = countMemoryTokens(memory)
  
  if (tokenCount > memory.maxTokens) {
    return {
      success: false,
      error: `Token count (${tokenCount}) exceeds limit (${memory.maxTokens})`,
    }
  }

  const { error } = await supabase
    .from('agent_memory')
    .upsert({
      workspace_id: memory.workspaceId,
      team_id: memory.teamId,
      content: memory,
      token_count: tokenCount,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'workspace_id',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    memory: { ...memory, tokenCount },
    tokensUsed: tokenCount,
    tokensRemaining: memory.maxTokens - tokenCount,
  }
}

/**
 * Add a new memory entry
 */
export async function addMemoryEntry(
  workspaceId: string,
  teamId: string,
  content: string,
  category: MemoryCategory,
  source: MemorySource = 'manual'
): Promise<MemoryOperationResult> {
  const memory = await getMemory(workspaceId, teamId)
  const tokens = countTokens(content) + 20 // +20 for metadata

  // Check token limit
  if (memory.tokenCount + tokens > memory.maxTokens) {
    return {
      success: false,
      error: `Adding this entry would exceed token limit. Current: ${memory.tokenCount}, New: ${tokens}, Limit: ${memory.maxTokens}`,
    }
  }

  const entry: MemoryEntry = {
    id: Date.now().toString(),
    content,
    category,
    source,
    confidence: source === 'manual' ? 1.0 : 0.5,
    usageCount: 0,
    lastUsed: new Date().toISOString(),
    tokens,
    canDelete: true,
    createdAt: new Date().toISOString(),
  }

  memory.sections[category].push(entry)
  memory.tokenCount += tokens
  memory.metadata.entryCount++
  memory.metadata.lastUpdated = new Date().toISOString()

  return saveMemory(memory)
}

/**
 * Remove a memory entry
 */
export async function removeMemoryEntry(
  workspaceId: string,
  teamId: string,
  entryId: string
): Promise<MemoryOperationResult> {
  const memory = await getMemory(workspaceId, teamId)

  for (const category of Object.keys(memory.sections) as MemoryCategory[]) {
    const index = memory.sections[category].findIndex(e => e.id === entryId)
    if (index !== -1) {
      const entry = memory.sections[category][index]
      if (!entry.canDelete) {
        return { success: false, error: 'This entry is protected and cannot be deleted' }
      }
      
      memory.tokenCount -= entry.tokens
      memory.sections[category].splice(index, 1)
      memory.metadata.entryCount--
      memory.metadata.lastUpdated = new Date().toISOString()
      
      return saveMemory(memory)
    }
  }

  return { success: false, error: 'Entry not found' }
}

/**
 * Update entry usage (called when rule is applied)
 */
export async function updateEntryUsage(
  workspaceId: string,
  teamId: string,
  entryId: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)

  for (const category of Object.keys(memory.sections) as MemoryCategory[]) {
    const entry = memory.sections[category].find(e => e.id === entryId)
    if (entry) {
      entry.usageCount++
      entry.lastUsed = new Date().toISOString()
      entry.confidence = Math.min(entry.confidence + 0.05, 1.0)
      await saveMemory(memory)
      return
    }
  }
}

/**
 * Convert memory to markdown for injection into prompts
 */
export function memoryToMarkdown(memory: AgentMemory): string {
  const lines: string[] = ['# Agent Memory', '']

  const categoryTitles: Record<MemoryCategory, string> = {
    userPreferences: 'User Preferences',
    projectPatterns: 'Project Patterns',
    learnedRules: 'Learned Rules',
    domainKnowledge: 'Domain Knowledge',
    communicationStyle: 'Communication Style',
  }

  for (const [category, title] of Object.entries(categoryTitles)) {
    const entries = memory.sections[category as MemoryCategory]
    if (entries.length > 0) {
      lines.push(`## ${title}`)
      for (const entry of entries) {
        lines.push(`- ${entry.content}`)
      }
      lines.push('')
    }
  }

  lines.push(`*Token Count: ${memory.tokenCount} / ${memory.maxTokens}*`)

  return lines.join('\n')
}
```

#### Step 7: Create Memory Optimizer

Create: `next-app/src/lib/ai/memory/memory-optimizer.ts`

```typescript
/**
 * Memory Optimizer
 * 
 * Auto-optimizes memory when approaching token limit.
 */

import { generateText } from 'ai'
import { openrouter } from '../ai-sdk-client'
import { countTokens } from './memory-tokenizer'
import type { AgentMemory, MemoryEntry, MemoryCategory } from './types'

const OPTIMIZATION_THRESHOLD = 0.8 // 80% of max tokens

/**
 * Check if memory needs optimization
 */
export function needsOptimization(memory: AgentMemory): boolean {
  return memory.tokenCount > memory.maxTokens * OPTIMIZATION_THRESHOLD
}

/**
 * Get optimization suggestions
 */
export function getOptimizationSuggestions(memory: AgentMemory): string[] {
  const suggestions: string[] = []
  const allEntries = getAllEntries(memory)

  // Find stale entries (low confidence, unused, old)
  const staleEntries = allEntries.filter(e =>
    e.confidence < 0.3 &&
    e.usageCount < 2 &&
    daysSince(e.lastUsed) > 30
  )
  if (staleEntries.length > 0) {
    suggestions.push(`Remove ${staleEntries.length} stale entries (low confidence, unused)`)
  }

  // Find verbose entries
  const verboseEntries = allEntries.filter(e => e.tokens > 100)
  if (verboseEntries.length > 0) {
    suggestions.push(`Summarize ${verboseEntries.length} verbose entries`)
  }

  // Find potential duplicates
  const duplicates = findPotentialDuplicates(allEntries)
  if (duplicates > 0) {
    suggestions.push(`Merge ${duplicates} potential duplicate entries`)
  }

  return suggestions
}

/**
 * Auto-optimize memory
 */
export async function optimizeMemory(memory: AgentMemory): Promise<AgentMemory> {
  const optimized = { ...memory }

  // Step 1: Remove stale entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = optimized.sections[category].filter(e => {
      const isStale = e.confidence < 0.3 && e.usageCount < 2 && daysSince(e.lastUsed) > 30
      return !isStale || !e.canDelete
    })
  }

  // Step 2: Merge similar entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = await mergeSimilarEntries(optimized.sections[category])
  }

  // Step 3: Summarize verbose entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = await summarizeVerboseEntries(optimized.sections[category])
  }

  // Step 4: Recalculate token count
  let totalTokens = 0
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    for (const entry of optimized.sections[category]) {
      totalTokens += entry.tokens
    }
  }
  optimized.tokenCount = totalTokens

  // Step 5: Update metadata
  optimized.metadata.lastOptimized = new Date().toISOString()
  optimized.metadata.entryCount = getAllEntries(optimized).length

  return optimized
}

/**
 * Merge similar entries using AI
 */
async function mergeSimilarEntries(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
  if (entries.length < 2) return entries

  // Group similar entries
  const groups: MemoryEntry[][] = []
  const used = new Set<string>()

  for (const entry of entries) {
    if (used.has(entry.id)) continue

    const similar = entries.filter(e => {
      if (e.id === entry.id || used.has(e.id)) return false
      return isSimilar(entry.content, e.content)
    })

    if (similar.length > 0) {
      groups.push([entry, ...similar])
      similar.forEach(s => used.add(s.id))
    }
    used.add(entry.id)
  }

  // Merge each group
  const merged = entries.filter(e => !used.has(e.id) || groups.some(g => g[0].id === e.id))
  
  for (const group of groups) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }

    // Use AI to merge
    const mergePrompt = `Combine these similar memory entries into one concise entry:

${group.map((e, i) => `${i + 1}. ${e.content}`).join('\n')}

Output only the merged entry text, nothing else.`

    const result = await generateText({
      model: openrouter('moonshotai/kimi-k2-thinking:nitro'),
      prompt: mergePrompt,
    })

    const mergedEntry: MemoryEntry = {
      ...group[0],
      content: result.text.trim(),
      tokens: countTokens(result.text) + 20,
      usageCount: Math.max(...group.map(e => e.usageCount)),
      confidence: Math.max(...group.map(e => e.confidence)),
    }
    merged.push(mergedEntry)
  }

  return merged
}

/**
 * Summarize verbose entries
 */
async function summarizeVerboseEntries(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
  return Promise.all(entries.map(async (entry) => {
    if (entry.tokens <= 100) return entry

    const summarizePrompt = `Summarize this memory entry to be more concise while keeping the key information:

${entry.content}

Output only the summarized text, nothing else.`

    const result = await generateText({
      model: openrouter('moonshotai/kimi-k2-thinking:nitro'),
      prompt: summarizePrompt,
    })

    return {
      ...entry,
      content: result.text.trim(),
      tokens: countTokens(result.text) + 20,
    }
  }))
}

// Helper functions
function getAllEntries(memory: AgentMemory): MemoryEntry[] {
  return Object.values(memory.sections).flat()
}

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function isSimilar(text1: string, text2: string): boolean {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  return intersection.size / union.size > 0.5
}

function findPotentialDuplicates(entries: MemoryEntry[]): number {
  let count = 0
  const seen = new Set<string>()
  
  for (const entry of entries) {
    for (const other of entries) {
      if (entry.id !== other.id && !seen.has(`${entry.id}-${other.id}`)) {
        if (isSimilar(entry.content, other.content)) {
          count++
          seen.add(`${entry.id}-${other.id}`)
          seen.add(`${other.id}-${entry.id}`)
        }
      }
    }
  }
  
  return count
}
```

#### Step 8: Create Memory Learning

Create: `next-app/src/lib/ai/memory/memory-learning.ts`

```typescript
/**
 * Memory Learning
 * 
 * Tracks user rejections and acceptances to learn preferences.
 */

import { getMemory, addMemoryEntry, updateEntryUsage, saveMemory } from './agent-memory'
import type { AgentMemory, MemoryEntry } from './types'

/**
 * Track when user rejects a suggestion
 */
export async function trackRejection(
  workspaceId: string,
  teamId: string,
  suggestion: string,
  reason?: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)
  
  // Check if we already have a rejection for this
  const existing = memory.sections.learnedRules.find(e =>
    e.content.toLowerCase().includes(suggestion.toLowerCase())
  )

  if (existing) {
    // Increment rejection count (stored in usageCount temporarily)
    existing.usageCount++
    
    if (existing.usageCount >= 3) {
      // Already a rule, increase confidence
      existing.confidence = Math.min(existing.confidence + 0.1, 1.0)
    }
    
    await saveMemory(memory)
  } else {
    // Create tracker or rule
    const rejectionCount = await getRejectionCount(workspaceId, teamId, suggestion)
    
    if (rejectionCount >= 2) {
      // Third rejection - create a learned rule
      await addMemoryEntry(
        workspaceId,
        teamId,
        `Don't suggest: ${suggestion}${reason ? ` (Reason: ${reason})` : ''}`,
        'learnedRules',
        'learned'
      )
    } else {
      // Track rejection (stored in a separate tracking mechanism)
      await incrementRejectionCount(workspaceId, teamId, suggestion)
    }
  }
}

/**
 * Track when user accepts/uses a suggestion
 */
export async function trackAcceptance(
  workspaceId: string,
  teamId: string,
  pattern: string,
  context?: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)
  
  // Check if this pattern already exists
  const existing = findSimilarPattern(memory, pattern)
  
  if (existing) {
    // Reinforce existing pattern
    existing.usageCount++
    existing.confidence = Math.min(existing.confidence + 0.1, 1.0)
    existing.lastUsed = new Date().toISOString()
    await saveMemory(memory)
  } else if (shouldLearn(pattern)) {
    // Add new learned pattern
    await addMemoryEntry(
      workspaceId,
      teamId,
      pattern,
      'projectPatterns',
      'inferred'
    )
  }
}

/**
 * Parse user commands for memory operations
 */
export async function parseMemoryCommand(
  workspaceId: string,
  teamId: string,
  message: string
): Promise<{ handled: boolean; response?: string }> {
  const lowerMessage = message.toLowerCase()

  // "Remember that..."
  if (lowerMessage.startsWith('remember that')) {
    const content = message.slice('remember that'.length).trim()
    const result = await addMemoryEntry(workspaceId, teamId, content, 'userPreferences', 'manual')
    return {
      handled: true,
      response: result.success
        ? `Got it! I'll remember: "${content}"`
        : `Sorry, couldn't save that: ${result.error}`,
    }
  }

  // "Forget about..."
  if (lowerMessage.startsWith('forget about')) {
    const content = message.slice('forget about'.length).trim()
    // Find and remove matching entry
    const memory = await getMemory(workspaceId, teamId)
    for (const category of Object.keys(memory.sections)) {
      const entry = memory.sections[category as keyof typeof memory.sections].find(e =>
        e.content.toLowerCase().includes(content.toLowerCase())
      )
      if (entry) {
        const { removeMemoryEntry } = await import('./agent-memory')
        await removeMemoryEntry(workspaceId, teamId, entry.id)
        return {
          handled: true,
          response: `Okay, I've forgotten about: "${entry.content}"`,
        }
      }
    }
    return {
      handled: true,
      response: `I couldn't find anything matching "${content}" in my memory.`,
    }
  }

  // "What do you know about me?"
  if (lowerMessage.includes('what do you know about me')) {
    const memory = await getMemory(workspaceId, teamId)
    const { memoryToMarkdown } = await import('./agent-memory')
    return {
      handled: true,
      response: memoryToMarkdown(memory),
    }
  }

  // "Optimize your memory"
  if (lowerMessage.includes('optimize your memory')) {
    const { optimizeMemory, needsOptimization } = await import('./memory-optimizer')
    const memory = await getMemory(workspaceId, teamId)
    
    if (!needsOptimization(memory)) {
      return {
        handled: true,
        response: `Memory is already optimized (${memory.tokenCount}/${memory.maxTokens} tokens).`,
      }
    }
    
    const optimized = await optimizeMemory(memory)
    await saveMemory(optimized)
    
    return {
      handled: true,
      response: `Memory optimized! Reduced from ${memory.tokenCount} to ${optimized.tokenCount} tokens.`,
    }
  }

  return { handled: false }
}

// Helper functions
async function getRejectionCount(workspaceId: string, teamId: string, suggestion: string): Promise<number> {
  // In production, this would query a rejections tracking table
  // For now, return 0 (first rejection)
  return 0
}

async function incrementRejectionCount(workspaceId: string, teamId: string, suggestion: string): Promise<void> {
  // In production, this would increment a counter in rejections tracking table
}

function findSimilarPattern(memory: AgentMemory, pattern: string): MemoryEntry | undefined {
  const words = new Set(pattern.toLowerCase().split(/\s+/))
  
  for (const category of Object.values(memory.sections)) {
    for (const entry of category) {
      const entryWords = new Set(entry.content.toLowerCase().split(/\s+/))
      const intersection = new Set([...words].filter(w => entryWords.has(w)))
      if (intersection.size / words.size > 0.6) {
        return entry
      }
    }
  }
  
  return undefined
}

function shouldLearn(pattern: string): boolean {
  // Don't learn very short or generic patterns
  return pattern.length > 20 && pattern.split(/\s+/).length > 3
}
```

#### Step 9: Create Index File

Create: `next-app/src/lib/ai/memory/index.ts`

```typescript
/**
 * Agent Memory System Index
 */

export * from './types'
export {
  getMemory,
  saveMemory,
  addMemoryEntry,
  removeMemoryEntry,
  updateEntryUsage,
  memoryToMarkdown,
} from './agent-memory'
export {
  needsOptimization,
  getOptimizationSuggestions,
  optimizeMemory,
} from './memory-optimizer'
export {
  trackRejection,
  trackAcceptance,
  parseMemoryCommand,
} from './memory-learning'
export { countTokens, countMemoryTokens, wouldExceedLimit } from './memory-tokenizer'
```

#### Step 10: Create API Routes

Create: `next-app/src/app/api/ai/memory/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getMemory, saveMemory, addMemoryEntry } from '@/lib/ai/memory'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  const teamId = searchParams.get('teamId')

  if (!workspaceId || !teamId) {
    return NextResponse.json({ error: 'Missing workspaceId or teamId' }, { status: 400 })
  }

  const memory = await getMemory(workspaceId, teamId)
  return NextResponse.json(memory)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { workspaceId, teamId, content, category } = body

  if (!workspaceId || !teamId || !content || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await addMemoryEntry(workspaceId, teamId, content, category, 'manual')
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
```

#### Step 11: Create UI Components

Create: `next-app/src/components/ai/memory/memory-panel.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MemorySection } from './memory-section'
import { TokenUsageBar } from './token-usage-bar'
import { AddMemoryDialog } from './add-memory-dialog'
import { MemoryOptimizerCard } from './memory-optimizer-card'
import type { AgentMemory, MemoryCategory } from '@/lib/ai/memory'

interface MemoryPanelProps {
  workspaceId: string
  teamId: string
}

export function MemoryPanel({ workspaceId, teamId }: MemoryPanelProps) {
  const [memory, setMemory] = useState<AgentMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadMemory()
  }, [workspaceId, teamId])

  async function loadMemory() {
    setLoading(true)
    const response = await fetch(`/api/ai/memory?workspaceId=${workspaceId}&teamId=${teamId}`)
    const data = await response.json()
    setMemory(data)
    setLoading(false)
  }

  async function handleDeleteEntry(entryId: string) {
    await fetch(`/api/ai/memory/entry/${entryId}`, {
      method: 'DELETE',
      body: JSON.stringify({ workspaceId, teamId }),
    })
    loadMemory()
  }

  async function handleOptimize() {
    await fetch('/api/ai/memory/optimize', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, teamId }),
    })
    loadMemory()
  }

  if (loading) {
    return <div>Loading memory...</div>
  }

  if (!memory) {
    return <div>No memory found</div>
  }

  const categories: { key: MemoryCategory; title: string }[] = [
    { key: 'userPreferences', title: 'User Preferences' },
    { key: 'projectPatterns', title: 'Project Patterns' },
    { key: 'learnedRules', title: 'Learned Rules' },
    { key: 'domainKnowledge', title: 'Domain Knowledge' },
    { key: 'communicationStyle', title: 'Communication Style' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent Memory</CardTitle>
        <Button onClick={() => setShowAddDialog(true)}>Add Memory</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <TokenUsageBar used={memory.tokenCount} max={memory.maxTokens} />

        {memory.tokenCount > memory.maxTokens * 0.8 && (
          <MemoryOptimizerCard onOptimize={handleOptimize} />
        )}

        {categories.map(({ key, title }) => (
          <MemorySection
            key={key}
            title={title}
            entries={memory.sections[key]}
            onDelete={handleDeleteEntry}
          />
        ))}
      </CardContent>

      <AddMemoryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        workspaceId={workspaceId}
        teamId={teamId}
        onAdded={loadMemory}
      />
    </Card>
  )
}
```

#### Step 12: Run TypeScript Check & Linter

```bash
cd next-app
npx tsc --noEmit
npm run lint
```

### Testing Plan

#### Test 1: Memory CRUD

```typescript
// Add entry
const result = await addMemoryEntry(workspaceId, teamId, 'Use Prisma for ORM', 'projectPatterns')
console.log(result.success) // true

// Get memory
const memory = await getMemory(workspaceId, teamId)
console.log(memory.sections.projectPatterns.length) // 1

// Remove entry
await removeMemoryEntry(workspaceId, teamId, result.memory.sections.projectPatterns[0].id)
```

#### Test 2: Token Management

```typescript
// Check token counting
const tokens = countTokens('This is a test string')
console.log(tokens) // ~5

// Check limit
const wouldExceed = wouldExceedLimit(9900, 'A very long string...', 10000)
console.log(wouldExceed) // true/false
```

#### Test 3: Memory Commands

```typescript
// Test "Remember that..."
const result = await parseMemoryCommand(workspaceId, teamId, 'Remember that we use TypeScript')
console.log(result.handled) // true
console.log(result.response) // "Got it! I'll remember..."
```

### Commit & PR

```bash
git add supabase/migrations/
git add next-app/src/lib/ai/memory/
git add next-app/src/components/ai/memory/
git add next-app/src/app/api/ai/memory/
git commit -m "feat: implement agent memory system with 10k token limit

Add persistent memory system:
- Database: agent_memory table with RLS
- Core: CRUD operations, token counting, markdown injection
- Optimizer: Auto-compress at 80% capacity
- Learning: Track rejections/acceptances
- UI: Memory panel, sections, add/delete dialogs

User commands:
- 'Remember that...' - Add manual rule
- 'Forget about...' - Remove entry
- 'What do you know about me?' - Show memory
- 'Optimize your memory' - Trigger compression

Benefits:
- Persistent context across sessions
- Self-improving via learning
- Efficient 10k token limit
- User-manageable preferences"
```

### Expected Final State

After this phase:

| Feature | Status |
|---------|--------|
| Memory persistence | Database + API |
| Token management | 10k limit enforced |
| Auto-optimization | At 80% threshold |
| User commands | 4 commands implemented |
| UI management | Full CRUD panel |

### Rollback Plan

```bash
# Drop migration
supabase db reset

# Or revert branch
git checkout main
git branch -D feat/agent-memory-system
```

### Dependencies

- **Requires**: Phase 2-4 complete
- **Blocks**: None (standalone feature)

### Memory Architecture

```
+----------------------------------------------------------+
|                    AGENT MEMORY SYSTEM                    |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  | agent.md (Per Workspace)                           |  |
|  |                                                    |  |
|  | # User Preferences                                 |  |
|  | - Prefers TypeScript over JavaScript               |  |
|  | - Uses Tailwind CSS, no inline styles              |  |
|  | - Likes detailed explanations                      |  |
|  |                                                    |  |
|  | # Project Patterns                                 |  |
|  | - ID format: Date.now().toString()                 |  |
|  | - Always filter by team_id                         |  |
|  | - Use shadcn/ui components                         |  |
|  |                                                    |  |
|  | # Learned Rules                                    |  |
|  | - Don't suggest UUID - user rejected 3 times       |  |
|  | - Priority order: critical > high > medium > low   |  |
|  |                                                    |  |
|  | Token Count: 2,847 / 10,000                        |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Sources:                                                |
|  +---------+  +---------+  +---------+  +---------+     |
|  | Manual  |  | Learned |  | Project |  | Feedback|     |
|  | Rules   |  | Patterns|  | Analysis|  | History |     |
|  +---------+  +---------+  +---------+  +---------+     |
|                                                          |
+----------------------------------------------------------+
```

### Memory Categories

| Category | Source | Examples |
|----------|--------|----------|
| **User Preferences** | Manual input, inferred | "Prefers concise answers", "Likes code comments" |
| **Project Patterns** | Code analysis | "Uses Zod for validation", "Supabase RLS required" |
| **Learned Rules** | Rejection tracking | "Don't suggest X - rejected 3 times" |
| **Domain Knowledge** | User-provided | "Our API uses REST, not GraphQL" |
| **Communication Style** | Inferred | "Prefers bullet points over paragraphs" |

### Token Management

**Hard Limit**: 10,000 tokens

```typescript
interface AgentMemory {
  version: string;
  workspaceId: string;
  tokenCount: number;
  maxTokens: 10000;

  sections: {
    userPreferences: MemoryEntry[];
    projectPatterns: MemoryEntry[];
    learnedRules: MemoryEntry[];
    domainKnowledge: MemoryEntry[];
    communicationStyle: MemoryEntry[];
  };

  metadata: {
    createdAt: string;
    lastUpdated: string;
    lastOptimized: string;
    entryCount: number;
  };
}

interface MemoryEntry {
  id: string;
  content: string;
  source: 'manual' | 'learned' | 'analyzed' | 'inferred';
  confidence: number;      // 0-1, higher = more certain
  usageCount: number;      // How often this rule was applied
  lastUsed: string;
  tokens: number;          // Pre-calculated token count
  canDelete: boolean;      // Some entries are protected
}
```

### Auto-Optimization

When tokens > 8,000 (80% threshold), auto-optimize:

```typescript
async function optimizeMemory(memory: AgentMemory): Promise<AgentMemory> {
  // 1. Remove low-confidence, unused entries
  const staleEntries = memory.entries.filter(e =>
    e.confidence < 0.3 &&
    e.usageCount < 2 &&
    daysSince(e.lastUsed) > 30
  );

  // 2. Merge similar entries
  const merged = await mergeSimilarEntries(memory.entries);

  // 3. Summarize verbose entries
  const summarized = await summarizeVerboseEntries(merged);

  // 4. Prioritize by impact
  const prioritized = sortByImpact(summarized);

  // 5. Truncate to fit limit
  return truncateToLimit(prioritized, 10000);
}
```

### User Commands

| Command | Action | Example |
|---------|--------|---------|
| "Remember that..." | Add manual rule | "Remember that we use Prisma, not raw SQL" |
| "Forget about..." | Remove entry | "Forget about the old API pattern" |
| "What do you know about me?" | Show memory summary | Lists all preferences |
| "Optimize your memory" | Trigger optimization | Compresses and cleans |
| "Add this rule: [rule]" | Explicit rule add | "Add this rule: Always use async/await" |

### Learning Mechanism

```typescript
// Track user rejections to learn preferences
async function trackRejection(
  suggestion: string,
  reason?: string
): Promise<void> {
  const existing = await findSimilarRule(suggestion);

  if (existing) {
    existing.rejectionCount++;
    if (existing.rejectionCount >= 3) {
      // Auto-add as "don't suggest" rule
      await addLearnedRule({
        content: `Don't suggest: ${suggestion}`,
        source: 'learned',
        confidence: 0.8,
        reason: reason || 'Rejected 3+ times',
      });
    }
  } else {
    await createRejectionTracker(suggestion);
  }
}

// Track user acceptance to reinforce patterns
async function trackAcceptance(
  pattern: string,
  context: string
): Promise<void> {
  const existing = await findSimilarPattern(pattern);

  if (existing) {
    existing.usageCount++;
    existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
    existing.lastUsed = new Date().toISOString();
  } else if (shouldLearn(pattern, context)) {
    await addLearnedRule({
      content: pattern,
      source: 'inferred',
      confidence: 0.5,
    });
  }
}
```

### Files to Create

```
next-app/src/lib/ai/memory/
+-- agent-memory.ts           # Core memory management
+-- memory-optimizer.ts       # Auto-optimization logic
+-- memory-learning.ts        # Pattern learning
+-- memory-tokenizer.ts       # Token counting
+-- index.ts                  # Exports

next-app/src/components/ai/memory/
+-- memory-panel.tsx          # Main memory UI
+-- memory-section.tsx        # Collapsible section
+-- memory-entry.tsx          # Single entry row
+-- memory-entry-editor.tsx   # Edit modal
+-- memory-optimizer-card.tsx # Optimization suggestions
+-- token-usage-bar.tsx       # Visual token indicator
+-- add-memory-dialog.tsx     # Add new entry
```

### API Routes

```
POST   /api/ai/memory              # Create/update memory
GET    /api/ai/memory              # Get memory for workspace
DELETE /api/ai/memory/entry/:id    # Delete entry
POST   /api/ai/memory/optimize     # Trigger optimization
POST   /api/ai/memory/learn        # Record learned pattern
```

### Database Table

```typescript
// Database table
interface AgentMemoryTable {
  id: string;              // Primary key
  workspace_id: string;    // FK to workspaces
  team_id: string;         // For RLS
  content: JsonB;          // AgentMemory object
  token_count: number;     // Cached count
  created_at: timestamp;
  updated_at: timestamp;
}

// Also store as markdown file for portability
// Location: workspace_data/agent.md
```

---

## Phase 6: UX Improvements

### Overview

**Branch**: `feat/ux-improvements`
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

| Model | Before | After | Savings |
|-------|--------|-------|---------|
| Function Calling + Strategic | $700 (Haiku + DeepSeek) | $120 (GLM 4.7 unified) | **83%** |
| Vision | $100 (Gemini 2.5) | $50 (Gemini 3 Flash) | **50%** |
| Coding Tasks | N/A | $40 (MiniMax M2.1) | New capability |
| **Total** | ~$800 | ~$210 | **~74% reduction** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Fallback success rate | 99.9% availability |
| Consensus accuracy improvement | +15% vs single model |
| Learning convergence | <500 samples to stable weights |
| User satisfaction (via blind picks) | >80% prefer optimized routing |
| Cost per query | <$0.002 average |
| Memory efficiency | <10k tokens always |
| User engagement with memory | >30% customize their memory |

---

## Quick Reference: Files Summary

### Phase 1 Files

- `next-app/src/lib/ai/agent-executor.ts` - Wire 10 missing tools

### Phase 2 Files

- `next-app/src/lib/ai/models-config.ts` - Add new models
- `next-app/src/lib/ai/ai-sdk-client.ts` - Update SDK config

### Phase 3 Files (Create)

```
next-app/src/lib/ai/tools/generalized/
+-- entity-tool.ts
+-- analyze-tool.ts
+-- optimize-tool.ts
+-- strategize-tool.ts
+-- research-tool.ts
+-- generate-tool.ts
+-- plan-tool.ts
+-- index.ts
```

### Phase 4 Files (Create)

```
next-app/src/lib/ai/orchestration/
+-- multi-model-orchestrator.ts
+-- fallback-chain.ts
+-- consensus-engine.ts
+-- blind-comparison.ts
+-- weight-learning.ts
+-- thinking-status.ts
+-- index.ts
```

### Phase 5 Files (Create)

```
next-app/src/lib/ai/memory/
+-- agent-memory.ts
+-- memory-optimizer.ts
+-- memory-learning.ts
+-- memory-tokenizer.ts
+-- index.ts

next-app/src/components/ai/memory/
+-- memory-panel.tsx
+-- memory-section.tsx
+-- memory-entry.tsx
+-- memory-entry-editor.tsx
+-- memory-optimizer-card.tsx
+-- token-usage-bar.tsx
+-- add-memory-dialog.tsx
```

### Phase 6 Files (Create)

```
next-app/src/components/ai/
+-- thinking-status-indicator.tsx
+-- quality-mode-toggle.tsx
+-- deep-reasoning-badge.tsx
+-- consensus-result.tsx
+-- blind-comparison-modal.tsx
+-- confidence-indicator.tsx
+-- deep-think-button.tsx
```

---

## Immediate Next Action

**Start Phase 1**: Wire 10 missing tools

```bash
git checkout main
git pull origin main
git checkout -b feat/wire-missing-tools
```

Then follow the [Phase 1 implementation steps](#step-by-step-implementation).

---

## References

- **Progress Tracking**: [PROGRESS.md](../../../planning/PROGRESS.md)
- **Architecture**: [ARCHITECTURE_CONSOLIDATION.md](../../../ARCHITECTURE_CONSOLIDATION.md)
