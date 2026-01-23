# Tasks: Simplify BlockSuite to Standalone Editor

**Change ID:** `simplify-blocksuite-standalone`
**Status:** In Progress

---

## Phase 1: Create Simplified Components

- [x] 1.1 Create `components/blocksuite/simple-canvas.tsx` (~200 lines)
  - Simple wrapper around BlockSuite EdgelessEditor
  - Props: `documentId`, `teamId`, `documentType`, `readOnly`
  - Minimal initialization (no polling hacks)
  - Auto-saves via HybridProvider

- [x] 1.2 Create canvas list page `app/(dashboard)/workspaces/[id]/canvas/page.tsx`
  - List all `blocksuite_documents` for workspace
  - Create new canvas button
  - Document type filter (mindmap/document/canvas)

- [x] 1.3 Create canvas editor page `app/(dashboard)/workspaces/[id]/canvas/[canvasId]/page.tsx`
  - Load SimpleCanvas with documentId
  - Simple toolbar for basic operations
  - Auto-save indicator

- [x] 1.4 Create new canvas page `app/(dashboard)/workspaces/[id]/canvas/new/page.tsx`
  - Document type selector
  - Title input
  - Create and redirect to editor

- [x] 1.5 Update `components/blocksuite/index.tsx` exports

## Phase 2: Database Migration

- [x] 2.1 Create migration `supabase/migrations/20260123100000_simplify_blocksuite_standalone.sql`
  - Remove `mind_map_id` FK from `blocksuite_documents`
  - Keep `document_type` column as-is

- [x] 2.2 Run migration with `supabase db push`

- [x] 2.3 Regenerate types with `supabase gen types typescript`

## Phase 3: UI Integration

- [x] 3.1 Add "Endless Canvas" link to workspace sidebar navigation

- [x] 3.2 Add redirect middleware `/mind-maps/*` → `/canvas/*`

- [x] 3.3 Security hardening (CRITICAL)
  - Re-enabled middleware authentication check
  - Added rate limiting to canvas creation API
  - Added input validation with Zod
  - Added team membership verification
  - Added audit logging for security events
  - Removed debug code from production middleware

- [x] 3.4 E2E Tests
  - Created `e2e/canvas.spec.ts` with 18 tests
  - Authentication protection tests (3)
  - Mind maps redirect tests (2)
  - API validation tests (4)
  - Canvas UI tests (4)
  - Security tests (5)
  - Results: 13 passed, 5 skipped (require test credentials)

- [ ] 3.5 Update test page to use new SimpleCanvas component

## Phase 4: Cleanup Old Code

- [ ] 4.1 Delete `components/blocksuite/mind-map-canvas.tsx` (843 lines)

- [ ] 4.2 Delete `components/blocksuite/mind-map-canvas-with-toolbar.tsx` (491 lines)

- [ ] 4.3 Delete `components/blocksuite/mindmap-toolbar.tsx` (~300 lines)

- [ ] 4.4 Delete `components/blocksuite/migration-utils.ts` (419 lines)

- [ ] 4.5 Delete `components/blocksuite/mindmap-utils.ts` (~200 lines)

- [ ] 4.6 Delete `app/api/mind-maps/[id]/nodes/[nodeId]/convert/route.ts`

- [ ] 4.7 Delete `components/mind-map/` folder (ReactFlow components)

- [ ] 4.8 Simplify `components/blocksuite/blocksuite-editor.tsx` (356 → ~200 lines)

**Note:** Phase 4 cleanup is deferred. Old components remain but are deprecated. The redirect in Phase 3.2 ensures users are directed to the new canvas routes.

## Phase 5: Update RAG Integration

- [ ] 5.1 Create new embed API `app/api/blocksuite/documents/[id]/embed/route.ts`
  - Works with `blocksuite_documents` directly
  - Extracts text from Yjs state

- [ ] 5.2 Update `text-extractor.ts` to extract from Yjs binary state

- [ ] 5.3 Keep existing chunker logic (works independently)

## Validation

- [ ] V.1 Create new canvas from `/canvas/new`
- [ ] V.2 Edit canvas - add content, verify auto-save
- [ ] V.3 Refresh page - verify content persists
- [ ] V.4 Open in two tabs - verify real-time sync
- [ ] V.5 List canvases - verify all documents shown
- [ ] V.6 Test AI assistant can search canvas content (RAG)
- [x] V.7 Verify `/mind-maps/` redirects to `/canvas/`
- [x] V.8 Run type checking `npm run typecheck`
- [ ] V.9 Run linting `npm run lint`

---

## Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Simplified Components | ✅ Complete | 100% |
| Phase 2: Database Migration | ✅ Complete | 100% |
| Phase 3: UI Integration | ⚠️ In Progress | 90% |
| Phase 4: Cleanup Old Code | 🔄 Deferred | 0% |
| Phase 5: Update RAG Integration | ⏳ Pending | 0% |
| **Overall** | **In Progress** | **75%** |
