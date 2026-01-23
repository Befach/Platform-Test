# Change: Complete BlockSuite Phase 6 - Node Selection, Toolbar & Production Hardening

## Why

BlockSuite integration is 80% complete but lacks interactive features (node selection, toolbar)
and production-grade infrastructure (persistent rate limiting, storage cleanup). Users cannot
click on mind map nodes or add new nodes via toolbar controls.

## What Changes

- **ADDED**: Node selection event handling via BlockSuite Selection API
- **ADDED**: React-based toolbar for node operations (add, delete, style, zoom)
- **ADDED**: Persistent rate limiting using Upstash Redis (replaces in-memory)
- **ADDED**: Orphaned storage cleanup cron job

## Impact

- **Affected specs**: `blocksuite-canvas` (new capability spec)
- **Affected code**:
  - `components/blocksuite/mind-map-canvas.tsx` (selection)
  - New `components/blocksuite/mindmap-toolbar.tsx`
  - New `lib/rate-limiter.ts`
  - `app/api/blocksuite/documents/[id]/state/route.ts`
  - New `app/api/cron/cleanup-storage/route.ts` OR SQL migration

## Background

### Current Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation (Types, Schemas) | Complete |
| Phase 2 | Mind Map Canvas | Complete |
| Phase 3 | Data Migration | Complete |
| Phase 4 | Supabase Persistence | Complete |
| Phase 5 | RAG Layer Integration | Complete |
| **Phase 6** | **UI Polish & Node Selection** | **Pending** |

### Key Infrastructure Already in Place

- BlockSuite v0.18.7 editor with React wrapper
- 4 mind map styles (Classic, Bubble, Box, Wireframe)
- 3 layout types (RIGHT, LEFT, BALANCE)
- HybridProvider for Yjs persistence (Realtime + Storage)
- RAG layer for semantic search

### Known TODO in Codebase

```typescript
// mind-map-canvas.tsx:145-146
// TODO: Implement node selection using BlockSuite's surface element click events
```
