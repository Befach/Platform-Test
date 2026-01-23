# Design: BlockSuite Phase 6 - Technical Decisions

## Context

BlockSuite v0.18.7 integration needs UI interactivity and production hardening. The core infrastructure (editor, persistence, RAG) is complete, but users cannot interact with mind map nodes or perform operations via toolbar.

## Goals / Non-Goals

**Goals:**
- Enable node selection via BlockSuite Selection API
- Provide toolbar for common operations (add, delete, style, zoom)
- Replace in-memory rate limiting with persistent Redis
- Clean up orphaned storage files

**Non-Goals:**
- Multi-cursor collaboration UI (future Phase 7+)
- Canvas export functionality (future)
- Offline support (future)

---

## Decisions

### 1. Node Selection: Selection Slots vs Click Events

**Decision:** Use `host.selection.slots.changed` subscription

**Rationale:**
- Native BlockSuite API, maintained by AFFiNE team
- Works with keyboard selection (Tab, Shift+Click)
- Consistent with BlockSuite's architecture
- Handles multi-selection scenarios

**Alternative Considered:** Manual click event handling with hit testing

**Why Rejected:** Duplicates BlockSuite's built-in selection logic, doesn't handle keyboard navigation

**Implementation:**
```typescript
// Subscribe to selection changes
const disposable = selection.slots.changed.on((selections) => {
  const surfaceSelection = selections.find(sel => sel.type === 'surface')
  if (surfaceSelection?.elements.length > 0) {
    const elementId = surfaceSelection.elements[0]
    // Extract node text and fire callback
  }
})
```

---

### 2. Toolbar: BlockSuite Widget vs React Component

**Decision:** React component communicating via editor ref

**Rationale:**
- Consistent with existing codebase (all shadcn/ui)
- Simpler state management with React hooks
- No need to learn BlockSuite's Lit-based Widget API
- Easier to style with Tailwind CSS

**Alternative Considered:** BlockSuite native Widget system (Lit-based)

**Why Rejected:** Adds complexity, inconsistent with React/shadcn/ui patterns

**Implementation:**
```typescript
interface MindmapToolbarProps {
  editorRef: RefObject<EdgelessEditor | null>
  onStyleChange: (style: MindmapStyle) => void
  onLayoutChange: (layout: LayoutType) => void
}
```

---

### 3. Rate Limiting: Upstash vs Vercel KV

**Decision:** Upstash Redis with @upstash/ratelimit

**Rationale:**
- HTTP-based (no TCP connection pooling issues in serverless)
- Built-in sliding window implementation
- Dashboard analytics included
- Lower latency than Vercel KV
- Well-documented patterns for Next.js

**Alternative Considered:** Vercel KV

**Why Rejected:** Higher latency, less rate-limiting specific features

**Configuration:**
```typescript
// Sliding window: 60 requests per minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: '@blocksuite/state',
  analytics: true,
})
```

---

### 4. Storage Cleanup: Supabase Cron vs Vercel Cron

**Decision:** Support both approaches (documented in tasks)

**Rationale:**
- Supabase Cron: Native to existing stack, no extra service, SQL-based
- Vercel Cron: Easier debugging, TypeScript implementation
- Let user choose based on deployment preference

**Safety Measures:**
- 24-hour grace period for files
- Batch processing (max 100 files per run)
- Audit logging for all deletions
- Dry-run mode for testing

---

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Selection API changes in future BlockSuite versions | Low | High | Pin to v0.18.7, add version check |
| Redis connection failures in high traffic | Very Low | Medium | Implement timeout with allow-by-default fallback |
| Cleanup job deleting in-flight uploads | Low | High | 24-hour grace period on created_at |
| Toolbar blocking editor initialization | Low | Medium | Render toolbar after editor is ready |

---

## Environment Variables Required

```env
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Vercel Cron (if using Vercel approach)
CRON_SECRET=xxx
```

---

## Migration Path

1. **Phase 6A First**: Rate limiting protects existing endpoints immediately
2. **Phase 6B Second**: Core functionality for user interaction
3. **Phase 6C Third**: UI polish after core works
4. **Phase 6D Optional**: Background maintenance (lowest priority)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/rate-limiter.ts` | CREATE | Upstash rate limiter utility |
| `mind-map-canvas.tsx` | MODIFY | Add selection tracking |
| `mindmap-toolbar.tsx` | CREATE | React toolbar component |
| `state/route.ts` | MODIFY | Add rate limiting |
| `cron/cleanup-storage/route.ts` | CREATE | Vercel cron handler (optional) |

---

## Open Questions

1. Should rate limiting apply per-user or per-team?
   - **Proposed**: Per-user when authenticated, per-IP when anonymous
2. Should cleanup job run in production only or all environments?
   - **Proposed**: Production only, with manual trigger for staging
