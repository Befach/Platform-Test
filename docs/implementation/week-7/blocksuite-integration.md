# Week 7: BlockSuite Integration

**Last Updated:** 2026-01-14
**Sprint Duration:** 2026-01-05 to 2026-01-08

[Back to Week 7 Overview](README.md)

---

## Overview

BlockSuite integration for mind map persistence, Yjs CRDT collaboration, and RAG layer.

---

## Phase 1: Foundation Setup (2026-01-05) - PR #43

**What Changed:**
Established foundational TypeScript types, Zod validation schemas, and configuration.

**Implementation:**

1. **Core Types** (`components/blocksuite/types.ts`)
   - `MindMapTreeNode` - Recursive tree structure
   - `EditorMode` - Canvas modes (pan/edit/connect)
   - `BlockType` - Node types (idea/feature/problem/question/solution)
   - `YjsSnapshot` - Yjs binary state wrapper
   - `BlockSuiteConfig` - Editor configuration

2. **BlockSuite-Specific Types** (`components/blocksuite/mindmap-types.ts`)
   - BlockSuite v0.18.7 enum mappings
   - `MigrationStatus` - DAG->Tree tracking
   - `LostEdge` - Non-tree edge tracking
   - `MindMapConversionResult` - Migration output

3. **Validation Schemas** (`components/blocksuite/schema.ts`)
   - Dual pattern: `validate*()` (throws) + `safeValidate*()` (returns result)
   - Recursive tree validation
   - API input validation

**Files Created:**

- `next-app/src/components/blocksuite/types.ts`
- `next-app/src/components/blocksuite/mindmap-types.ts`
- `next-app/src/components/blocksuite/schema.ts`

---

## Phase 2: Mind Map Canvas (2026-01-06) - PR #45

**What Changed:**
Complete BlockSuite editor integration with React wrapper, mind map canvas, SSR-safe exports.

**Implementation:**

1. **BlockSuite Editor** (`blocksuite-editor.tsx`)
   - React wrapper with SSR handling
   - DocCollection initialization
   - Editor lifecycle management

2. **Mind Map Canvas** (`mind-map-canvas.tsx`)
   - 4 styles: Classic, Bubble, Box, Wireframe
   - 3 layouts: Balance, Right, Left
   - Mode switching: pan, edit, connect
   - ReactFlow data adapter

3. **Utility Functions** (`mindmap-utils.ts`)
   - `convertDAGToTree()` - ReactFlow -> BlockSuite
   - `cycleDetection()` - Prevent infinite loops
   - `findRootNodes()` - Identify tree roots
   - `buildTreeFromNode()` - Recursive construction
   - `validateTreeStructure()` - Post-conversion validation

4. **SSR-Safe Exports** (`index.tsx`)
   - Dynamic imports with `ssr: false`
   - Loading skeleton integration

**Files Created:**

- `next-app/src/components/blocksuite/blocksuite-editor.tsx` (~180 lines)
- `next-app/src/components/blocksuite/mind-map-canvas.tsx` (~350 lines)
- `next-app/src/components/blocksuite/mindmap-utils.ts` (~200 lines)
- `next-app/src/components/blocksuite/index.tsx`
- `next-app/src/components/blocksuite/loading-skeleton.tsx` (~80 lines)

---

## Phase 3: Data Migration (2026-01-06) - PR #48

**What Changed:**
Migration infrastructure for converting ReactFlow mind maps to BlockSuite format.

**DAG to Tree Conversion:**

```
ReactFlow DAG:                    BlockSuite Tree:
┌─────┐                           ┌─────┐
│  A  │                           │  A  │
└──┬──┘                           └──┬──┘
   │                                 │
┌──┴──┐                           ┌──┴──┐
│  B  │◄──┐                       │  B  │
└──┬──┘   │                       └──┬──┘
   │      │    ═══════════►          │
┌──┴──┐   │   (lost edge: C→B)    ┌──┴──┐
│  C  │───┘                       │  C  │
└─────┘                           └─────┘
```

**Implementation:**

1. **Migration Utilities** (`migration-utils.ts`)
   - `migrateMindMap()` - Full orchestration
   - `convertReactFlowToTree()` - DAG->Tree
   - `trackLostEdges()` - Record non-tree edges
   - `validateMigration()` - Integrity checks
   - `rollbackMigration()` - Reversal support

2. **Database Migration** (`20260106100000_add_blocksuite_migration_columns.sql`)
   - `blocksuite_tree JSONB` - Nested tree storage
   - `blocksuite_size_bytes INTEGER` - Size monitoring
   - `migration_status TEXT` - pending | migrated | failed
   - `migration_error TEXT` - Error details
   - `lost_edges JSONB` - Non-tree edges

**Migration Status Tracking:**

| Status | Description |
|--------|-------------|
| `pending` | Not yet migrated (default) |
| `migrated` | Successfully converted |
| `failed` | Migration attempted but failed |

**Files Created:**

- `next-app/src/components/blocksuite/migration-utils.ts` (~280 lines)
- `supabase/migrations/20260106100000_add_blocksuite_migration_columns.sql`

---

## Phase 4: Supabase Persistence (2026-01-07)

**What Changed:**
Complete persistence layer with Yjs CRDT for real-time collaborative editing.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                    │
│  BlockSuite Editor ←→ Yjs Doc ←→ HybridProvider                 │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Supabase        │  │ Supabase        │  │ Supabase        │
│ Realtime        │  │ Storage         │  │ PostgreSQL      │
│ • Broadcasts    │  │ • Yjs binary    │  │ • Metadata      │
│ • Presence      │  │ • Snapshots     │  │ • Permissions   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Implementation:**

1. **Storage Client** (`storage-client.ts`)
   - Native Supabase Storage API
   - `saveYjsState()`, `loadYjsState()`, `deleteYjsState()`
   - Path format: `{team_id}/{doc_id}.yjs`

2. **Hybrid Provider** (`hybrid-provider.ts`)
   - Realtime broadcasts (immediate)
   - Storage persistence (debounced 2000ms)
   - beforeunload/visibilitychange saves
   - Base64 chunking for large updates

3. **React Hooks** (`use-blocksuite-sync.ts`)
   - `useBlockSuiteSync()` - Sync integration
   - `useBlockSuiteDocument()` - Document creation
   - Supabase client memoization

4. **API Routes**
   - `GET/PATCH/DELETE /api/blocksuite/documents/[id]` (120 req/min)
   - `GET/PUT/POST /api/blocksuite/documents/[id]/state` (60 uploads/min)

5. **Database Migrations**
   - `20260107110000_create_blocksuite_documents.sql`
   - `20260107110001_create_blocksuite_storage_bucket.sql`

**Security Features:**

| Feature | Implementation |
|---------|----------------|
| Rate Limiting | 60 uploads/min, 120 req/min |
| Path Traversal Protection | sanitizeId(), RLS regex |
| Document ID Validation | Regex at API and provider |
| Input Validation | Zod schemas |
| Team Isolation | RLS + explicit filtering |
| Audit Logging | JSON logs for rate limits |
| Size Limits | 10MB max state upload |

**Files Created:**

- `next-app/src/components/blocksuite/storage-client.ts` (~150 lines)
- `next-app/src/components/blocksuite/hybrid-provider.ts` (~420 lines)
- `next-app/src/components/blocksuite/persistence-types.ts` (~120 lines)
- `next-app/src/components/blocksuite/use-blocksuite-sync.ts` (~260 lines)
- `next-app/src/app/api/blocksuite/documents/[id]/route.ts` (~370 lines)
- `next-app/src/app/api/blocksuite/documents/[id]/state/route.ts` (~380 lines)
- `supabase/migrations/20260107110000_create_blocksuite_documents.sql`
- `supabase/migrations/20260107110001_create_blocksuite_storage_bucket.sql`

---

## Phase 5: RAG Layer Integration (2026-01-07) - PR #51

**What Changed:**
Complete RAG layer for semantic search across BlockSuite mind map content.

**Core Components:**

1. **Embedding Service** (`mindmap-embedding-service.ts`)
   - `embedMindMap()` - Main entry point
   - OpenAI `text-embedding-3-large` @ 1536 dimensions
   - Batched API calls (50 chunks max)
   - Exponential backoff retry
   - SHA-256 hash change detection

2. **Text Extraction** (`text-extractor.ts`)
   - `extractTextFromBlockSuiteTree()` - Recursive extraction
   - `computeTreeHash()` - SHA-256 change detection
   - `walkBlockSuiteTree()` - Generic traversal
   - Max depth: 50 (stack overflow protection)

3. **Chunking** (`mindmap-chunker.ts`)
   - `chunkMindmapForEmbedding()` - Path-preserving chunks
   - Target: 300 tokens per chunk
   - Min chunk: 50 tokens
   - Max 3 ancestor path context

4. **API Routes**
   - `POST /api/mind-maps/[id]/embed` - Generate embeddings
   - `GET /api/mind-maps/[id]/embed` - Check status

5. **Database Migration** (`20260107150000_add_mindmap_embedding_columns.sql`)
   - `embedding_status` - pending | processing | ready | error | skipped
   - `last_embedded_hash` - SHA-256 for change detection
   - `source_type` on document_chunks
   - `mind_map_id` foreign key

**Files Created:**

- `next-app/src/lib/ai/embeddings/mindmap-embedding-service.ts` (~375 lines)
- `next-app/src/components/blocksuite/text-extractor.ts` (~350 lines)
- `next-app/src/components/blocksuite/mindmap-chunker.ts` (~180 lines)
- `next-app/src/components/blocksuite/rag-types.ts` (~70 lines)
- `next-app/src/app/api/mind-maps/[id]/embed/route.ts` (~180 lines)
- `next-app/src/components/blocksuite/__tests__/text-extractor.test.ts`
- `next-app/src/components/blocksuite/__tests__/mindmap-chunker.test.ts`
- `supabase/migrations/20260107150000_add_mindmap_embedding_columns.sql`

**Progress:** Knowledge Base: 95% -> 100%

---

## AI Architecture Phase 1-2 (2026-01-08)

> **Full Plan:** See [AI_TOOL_ARCHITECTURE.md](advanced-ai-system/AI_TOOL_ARCHITECTURE.md)

**What Changed:**

- Added 3 new models: GLM 4.7, MiniMax M2.1, Gemini 3 Flash
- Created MODEL_ROUTING config with 6 capability-based fallback chains
- Wired 10 missing optimization/strategy tools
- Implemented 5-layer streaming reliability stack

**New Models:**

| Model | Purpose | Cost | Context |
|-------|---------|------|---------|
| GLM 4.7 | Strategic reasoning, agentic | $0.40/$1.50 per 1M | 128K |
| MiniMax M2.1 | Coding benchmarks leader | $0.30/$1.20 per 1M | 128K |
| Gemini 3 Flash | Vision, multimodal chat | $0.50/$3.00 per 1M | 1M |

**MODEL_ROUTING Capability Chains:**

```typescript
strategic_reasoning: GLM 4.7 → DeepSeek V3.2 → Gemini 3 Flash
agentic_tool_use:    GLM 4.7 → Claude Haiku → MiniMax M2.1
coding:              MiniMax M2.1 → GLM 4.7 → Kimi K2
visual_reasoning:    Gemini 3 Flash → Grok 4 Fast → Gemini 2.5 Flash
large_context:       Grok 4 Fast → Gemini 3 Flash → Kimi K2
default:             Kimi K2 → GLM 4.7 → MiniMax M2.1
```

**5-Layer Streaming Reliability Stack:**

1. Vercel Fluid Compute - Dashboard setting
2. vercel.json - `maxDuration: 300`
3. streamWithTimeout() - 280s AbortController
4. callWithRetry() - Exponential backoff
5. logSlowRequest() - Monitoring for >60s

**Tools Wired (10):**

- Optimization: prioritizeFeatures, balanceWorkload, identifyRisks, suggestTimeline, deduplicateItems
- Strategy: alignToStrategy, suggestOKRs, competitiveAnalysis, roadmapGenerator, impactAssessment

**Files Modified:**

- `next-app/src/lib/ai/models-config.ts` - New models, routing config
- `next-app/src/lib/ai/ai-sdk-client.ts` - Model exports
- `next-app/src/lib/ai/agent-executor.ts` - 10 tools wired
- `next-app/src/lib/ai/openrouter.ts` - Reliability utilities
- `next-app/src/lib/ai/agent-loop.ts` - Type-safe ExecutableTool
- `next-app/src/app/api/ai/*/route.ts` - maxDuration settings
- `next-app/vercel.json` - AI function timeout config

**Remaining Phases:**

- Phase 3: Consolidate 38 -> 7 generalized tools
- Phase 4: 4-tier orchestration system
- Phase 5: Agent memory system
- Phase 6: UX improvements

---

[Back to Week 7 Overview](README.md)
