# Phase 1: Wire Missing Tools

**Last Updated**: 2026-01-14
**Status**: Complete (2026-01-08)
**Branch**: `feat/wire-missing-tools`

[Back to AI Tool Architecture](README.md)

---

## Overview

**File**: `next-app/src/lib/ai/agent-executor.ts`
**Lines modified**: 730-758 (add cases before `default:`)
**Risk**: Low (adding new cases, not modifying existing)

---

## Problem Statement

The `executeToolAction()` switch statement (line 571) only handles:

- 5 creation tools (lines 573-728)
- 5 analysis tools (lines 732-754)
- **5 optimization tools - MISSING** (throws error)
- **5 strategy tools - MISSING** (throws error)

When any of the 10 missing tools are called, they hit `default:` and throw:

```
Error: Execution not implemented for tool: prioritizeFeatures
```

---

## Solution

Add 10 new cases using the **same passthrough pattern** as analysis tools (lines 732-754).

The pattern delegates to the tool's existing `execute()` function instead of implementing database operations inline. This is appropriate because:

- Optimization/strategy tools already return structured results
- They handle their own logic (scoring, analysis, suggestions)
- We just need to route them through the executor

---

## Step-by-Step Implementation

### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/wire-missing-tools
```

### Step 2: Open File

Open: `next-app/src/lib/ai/agent-executor.ts`

Navigate to line **754** (after analysis tools, before `default:`).

### Step 3: Add Optimization Tools Cases

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

### Step 4: Verify Import

Ensure `toolRegistry` is imported at the top of the file. Check line ~20-30 for:

```typescript
import { toolRegistry } from './tools/tool-registry'
```

If missing, add this import.

### Step 5: Run TypeScript Check

```bash
cd next-app
npx tsc --noEmit
```

Fix any type errors.

### Step 6: Run Linter

```bash
npm run lint
```

Fix any linting issues.

---

## Testing Plan

### Manual Test 1: Optimization Tool

1. Start dev server: `npm run dev`
2. Open chat interface
3. Type: "Prioritize our features using RICE framework"
4. Verify: Tool executes without "not implemented" error
5. Verify: Returns prioritization preview

### Manual Test 2: Strategy Tool

1. Type: "Which features align with our strategy?"
2. Verify: alignToStrategy tool executes
3. Verify: Returns alignment analysis

### Manual Test 3: Each Tool

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

---

## Commit & PR

### Commit

```bash
git add next-app/src/lib/ai/agent-executor.ts
git commit -m "feat: wire optimization and strategy tools in agent-executor

Add execution cases for 10 missing tools:
- Optimization: prioritizeFeatures, balanceWorkload, identifyRisks, suggestTimeline, deduplicateItems
- Strategy: alignToStrategy, suggestOKRs, competitiveAnalysis, roadmapGenerator, impactAssessment

Uses passthrough pattern to delegate to each tool's execute() function.
Fixes 'Execution not implemented' errors when these tools are invoked."
```

### Push & PR

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

---

## Expected Final State

After this phase:

| Category | Tools | Status |
|----------|-------|--------|
| Creation | 5 | Wired (existing) |
| Analysis | 5 | Wired (existing) |
| Optimization | 5 | **Wired (new)** |
| Strategy | 5 | **Wired (new)** |
| **Total** | 20 | **100% wired** |

---

## Code Location Reference

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

---

## Rollback Plan

If issues arise:

```bash
git checkout main
git branch -D feat/wire-missing-tools
```

---

[Back to AI Tool Architecture](README.md)
