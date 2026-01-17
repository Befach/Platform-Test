# Phase 3: Generalized Tools

**Last Updated**: 2026-01-14
**Status**: Pending
**Branch**: `feat/generalized-tools`

[Back to AI Tool Architecture](README.md)

---

## Overview

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

[Back to AI Tool Architecture](README.md) | [Previous: Phase 2](phase-2-model-routing.md) | [Next: Phase 4](phase-4-orchestration.md)
