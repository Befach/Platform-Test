# Change: Simplify BlockSuite to Standalone Endless Editor

## Why

The current BlockSuite integration (Phase 6, 95% complete) is deeply coupled with work items, causing:
- Complex initialization sequences with polling and timeouts (~843 lines in mind-map-canvas.tsx)
- DAG-to-tree migration complexity that's no longer needed
- Work item conversion APIs that tightly couple the editor to product domain
- Feature development velocity blocked by integration issues

Users need a simple canvas/whiteboard for brainstorming, not a deeply integrated work item editor.

## What Changes

- **REMOVED**: Complex initialization hacks (polling, timeouts, opacity fixes)
- **REMOVED**: DAG-to-tree migration utilities
- **REMOVED**: Work item conversion API (`/api/mind-maps/[id]/nodes/[nodeId]/convert`)
- **REMOVED**: ReactFlow mind map components (deprecated)
- **MODIFIED**: BlockSuite used as standalone editor instead of integrated tool
- **ADDED**: Simplified `simple-canvas.tsx` component (~200 lines)
- **ADDED**: New `/canvas/` routes for standalone canvas editing
- **KEPT**: RAG embedding for AI assistant search (text-extractor, chunker)
- **KEPT**: HybridProvider persistence layer
- **KEPT**: `blocksuite_documents` table schema

**BREAKING**: Mind maps route `/mind-maps/` deprecated, redirects to `/canvas/`

## Impact

- **Affected specs**: `blocksuite-canvas` (simplified requirements)
- **Affected code**:
  - DELETE: `components/blocksuite/mind-map-canvas.tsx` (843 lines)
  - DELETE: `components/blocksuite/mind-map-canvas-with-toolbar.tsx` (491 lines)
  - DELETE: `components/blocksuite/migration-utils.ts` (419 lines)
  - DELETE: `components/mind-map/` (entire folder)
  - CREATE: `components/blocksuite/simple-canvas.tsx` (~200 lines)
  - CREATE: `app/(dashboard)/workspaces/[id]/canvas/` (routes)
  - MODIFY: `blocksuite_documents` table (remove `mind_map_id` FK)

## Code Reduction

| Before | After | Saved |
|--------|-------|-------|
| ~5,000 lines | ~1,600 lines | ~3,400 lines |

## Benefits

1. **Faster feature development** - No more fighting BlockSuite integration issues
2. **Simpler maintenance** - Fewer moving parts, cleaner architecture
3. **Better upgrade path** - Easier to upgrade BlockSuite to v1.0+
4. **Preserved AI capabilities** - RAG embeddings still work for AI assistant
5. **User-focused** - Standalone canvas for creativity, not complex domain coupling
