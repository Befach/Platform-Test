# Design: Simplify BlockSuite to Standalone Editor

## Context

BlockSuite Phase 6 is 95% complete but the deep integration with work items has caused:
1. **Initialization complexity** - 843 lines with polling, timeouts, opacity hacks
2. **Maintenance burden** - Deprecated BlockSuite v0.19.x APIs will break on v1.0
3. **Feature velocity blocked** - Developers fighting integration instead of building features
4. **Coupling issues** - Work item conversion, DAG-to-tree migration, complex state

The user wants a simple "endless editor" for brainstorming, not a deeply integrated domain tool.

## Goals / Non-Goals

**Goals:**
- Reduce code complexity from ~5,000 to ~1,600 lines
- Create standalone canvas that "just works"
- Preserve RAG capabilities for AI assistant
- Keep HybridProvider persistence layer (proven stable)
- Enable faster BlockSuite upgrades in future

**Non-Goals:**
- Migrate existing mind map data (user confirmed data loss acceptable)
- Maintain backward compatibility with ReactFlow mind maps
- Deep work item integration
- Complex toolbar with all BlockSuite features

## Decisions

### Decision 1: Single SimpleCanvas Component

**What**: Create one simplified `simple-canvas.tsx` (~200 lines) instead of complex hierarchy.

**Why**: Current setup has `blocksuite-editor.tsx` → `mind-map-canvas.tsx` → `mind-map-canvas-with-toolbar.tsx` with 1,700+ total lines. Most is initialization hacks.

**Alternatives considered**:
- Keep existing components, just simplify → Still too coupled, hard to maintain
- Use BlockSuite's preset editors directly → Need React wrapper for hooks/state

### Decision 2: New `/canvas/` Routes (Not Modify `/mind-maps/`)

**What**: Create fresh routes at `/workspaces/[id]/canvas/` instead of modifying existing.

**Why**:
- Clean slate without legacy baggage
- Existing `/mind-maps/` has ReactFlow dependencies
- Redirect middleware handles backward compatibility

**Alternatives considered**:
- Modify existing `/mind-maps/` routes → Too much legacy code to untangle
- Keep both systems → Confusing UX, double maintenance

### Decision 3: Keep HybridProvider As-Is

**What**: Reuse existing `hybrid-provider.ts` (427 lines) without modification.

**Why**: It's well-tested, handles Yjs sync, Supabase Realtime, and Storage correctly. The problem was the component initialization, not the persistence layer.

**Alternatives considered**:
- Rewrite persistence → Unnecessary risk, it works
- Use simpler provider → Would lose real-time collaboration

### Decision 4: Remove mind_map_id FK, Keep Table

**What**: Remove `mind_map_id` foreign key from `blocksuite_documents`, but keep the column nullable.

**Why**: Decouples BlockSuite from work item domain. Column stays for potential future use.

**Migration**:
```sql
ALTER TABLE blocksuite_documents
DROP CONSTRAINT IF EXISTS blocksuite_documents_mind_map_id_fkey;
-- Column remains, just no FK constraint
```

### Decision 5: RAG Works with Yjs State

**What**: Update text-extractor to parse Yjs binary state instead of JSONB tree.

**Why**: Simplified canvas stores Yjs state, not JSONB trees. RAG must adapt.

**Approach**:
1. Load Yjs state from Storage
2. Initialize Y.Doc from binary
3. Traverse BlockSuite document structure
4. Extract text from blocks/mindmap nodes

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| RAG extraction breaks | Test thoroughly with sample Yjs states before deleting old code |
| Users lose mind map data | User confirmed acceptable; data in `mind_maps` table preserved |
| HybridProvider has hidden dependencies | It's decoupled - test with SimpleCanvas before cleanup |
| BlockSuite initialization still complex | Follow BlockSuite official examples, avoid custom hacks |

## Migration Plan

### Step 1: Create New (No Breaking Changes)
1. Create `simple-canvas.tsx`
2. Create `/canvas/` routes
3. Test new system works

### Step 2: Add Redirects
1. Add middleware for `/mind-maps/*` → `/canvas/*`
2. Update sidebar navigation

### Step 3: Delete Old Code
1. Delete complex components (mind-map-canvas.tsx, etc.)
2. Delete ReactFlow components
3. Run database migration

### Rollback
If issues occur:
1. Revert component deletions (git)
2. Revert migration (restore FK if needed)
3. Remove redirect middleware

## Open Questions

1. **Toolbar complexity** - Should SimpleCanvas have a toolbar, or just the raw editor?
   - **Answer**: Basic toolbar (zoom, undo/redo) built into BlockSuite's EdgelessEditor. No custom React toolbar initially.

2. **Document types** - Support all three (mindmap/document/canvas) or just whiteboard?
   - **Answer**: Support all three. User selects type when creating. Different BlockSuite presets.

3. **RAG performance** - Will parsing Yjs state be slower than JSONB?
   - **Answer**: Likely similar. Yjs state is compact binary. Test with real documents.
