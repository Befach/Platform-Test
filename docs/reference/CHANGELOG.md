# 📜 CHANGELOG

**Last Updated**: 2025-12-23
**Project**: Product Lifecycle Management Platform
**Format**: Based on [Keep a Changelog](https://keepachangelog.com/)

All notable changes, migrations, and feature implementations are documented in this file.

---

## [Unreleased]

### Changed

#### 3-Type System: Enhancement is Now a Flag (2025-12-23)
Migrated from 4-type to 3-type work item system by converting `enhancement` from a type to a boolean flag on features.

**Architecture Change**:
- **Before**: 4 types (concept, feature, bug, enhancement)
- **After**: 3 types (concept, feature, bug) + `is_enhancement` flag on features
- **Rationale**: Enhancement is an attribute of features, not a separate type. Reduces type proliferation while maintaining functionality.

**Database Migration**: `20251223000001_fix_enhancement_architecture_v2.sql`
- ✅ Added `is_enhancement` column (boolean, default false)
- ✅ Migrated existing enhancement-type items to feature + flag
- ✅ Updated CHECK constraint to only allow 3 types
- ✅ Created index on `is_enhancement` for performance

**TypeScript Changes**:
- ✅ Removed `ENHANCEMENT` from `WORK_ITEM_TYPES` constant (9 files updated)
- ✅ Updated `TYPE_PHASE_MAP` to exclude enhancement (3 files)
- ✅ Updated form validation schema to 3-type enum
- ✅ Updated conversion logic: concept → [feature, bug], feature ↔ bug
- ✅ Fixed 9 TypeScript compilation errors
- ✅ All type definitions now consistent across codebase

**UI Changes**:
- ✅ Removed enhancement as selectable type in forms and dialogs
- ✅ Canvas nodes marked as deprecated (kept for backward compatibility)
- ✅ Growth mode defaults to feature type (with is_enhancement flag)
- ✅ Type-aware components updated (badges, tooltips, distribution)

**Documentation**: Updated `ARCHITECTURE_CONSOLIDATION.md` to reflect 3-type system

**Files Modified**: 15 files across TypeScript constants, UI components, API routes, and docs

**Breaking Change**: Forms/APIs no longer accept `type='enhancement'` - will be rejected by validation. Use `type='feature'` with `is_enhancement=true` instead.

#### Updated .cursorrules to Current Architecture (2025-12-23)
Modernized Cursor AI rules from 347-day-old configuration to reflect current multi-tenant architecture.

**Key Changes**:
- ✅ Updated multi-tenancy model: `user_id = 'default'` → `team_id` (multi-tenant)
- ✅ Corrected MCP count: 5 MCPs → 3 MCPs (Supabase, shadcn/ui, Context7)
- ✅ Added type-aware 4-phase system (design→build→refine→launch)
- ✅ Replaced `workspace_id` isolation with `team_id` isolation
- ✅ Updated table names: `features` → `work_items`
- ✅ Added versioning system, review process, Design Thinking methodology
- ✅ Added comprehensive security checklist (OWASP Top 10)
- ✅ Clarified: Phase IS the status for work items (no separate status field)

**Impact**: Cursor AI now has accurate context for code generation and suggestions aligned with canonical architecture (`ARCHITECTURE_CONSOLIDATION.md`).

**Files Modified**: `.cursorrules` (complete rewrite), backup created at `.cursorrules.backup-2025-12-23`

### Fixed

#### Canvas Work Item Status Field (2025-12-23)
Fixed TypeScript error in `unified-canvas.tsx` where code referenced non-existent `status` field on work items.

**Error**: `Property 'status' does not exist on type WorkItem`

**Fix**: Changed `item.status` → `item.phase` (phase IS the status for work items, per canonical architecture)

**Files Modified**: `next-app/src/components/canvas/unified-canvas.tsx:182`

#### Enhancement Architecture Phase 2 - Security & Consistency (2025-12-23)
Complete security hardening and UI consistency cleanup following 4-type to 3-type migration.

**Security Improvements**:
- ✅ **Defense-in-Depth**: Added explicit authentication and team membership checks to enhance API endpoint
- ✅ **Input Validation**: Replaced manual validation with comprehensive Zod schema
- ✅ **Proper HTTP Codes**: 401 (unauthorized), 403 (forbidden), 404 (not found), 400 (validation error)
- ✅ **Explicit Flags**: `is_enhancement` explicitly set in INSERT operations (no reliance on DB defaults)

**UI Consistency**:
- ✅ Removed 'enhancement' from 12 component icon/color mappings
- ✅ Removed 'enhancement' from form placeholder configurations
- ✅ Verified canvas deprecation comments for backward compatibility
- ✅ All UI components now consistently use 3-type system (concept/feature/bug)

**Type Safety**:
- ✅ Added `is_enhancement` validation to form schema (optional boolean, default false)
- ✅ TypeScript compilation passes with 0 errors
- ✅ No 'enhancement' references in active code paths (only deprecated legacy nodes)

**Files Modified**:
- API: `next-app/src/app/api/work-items/[id]/enhance/route.ts` (security hardening)
- Components: 12 files (insight-link-dialog, tool-previews, connection-menu, ai-alignment-suggestions, strategy-detail-sheet, create-work-item-dialog, template-preview, smart-work-item-form, work-items-board-view, nested-work-items-table, filter-context, insight-detail-sheet)
- Schema: `next-app/src/lib/schemas/work-item-form-schema.ts` (is_enhancement validation)

**Impact**: Production-ready security posture for enhance endpoint + consistent 3-type UX across all components.

### Added

#### Type-Aware Phase System - Database Columns (2025-12-22)
Database migration adding missing phase tracking, versioning, and review columns to `work_items` table.

**Migration**: `20251222120000_add_missing_phase_columns.sql`

**Schema Changes**:
```sql
-- Add phase column (work item lifecycle stage - replaces status)
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS phase TEXT;

-- Add versioning columns
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS enhances_work_item_id TEXT REFERENCES work_items(id);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- Add review process columns
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS review_enabled BOOLEAN DEFAULT true;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS review_status TEXT;
```

**New Columns**:
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `phase` | TEXT | (type-based) | Work item lifecycle phase (IS the status field) |
| `enhances_work_item_id` | TEXT | null | Links to parent work item for versioning |
| `version` | INTEGER | 1 | Version number in enhancement chain |
| `version_notes` | TEXT | null | Changelog/release notes for this version |
| `review_enabled` | BOOLEAN | true | Per-item toggle for review process |
| `review_status` | TEXT | null | Review state: pending, approved, needs_revision, rejected |

**Type-Specific Phase Constraints**:
- **Feature/Enhancement**: design → build → refine → launch
- **Concept**: ideation → research → validated | rejected
- **Bug**: triage → investigating → fixing → verified

**Indexes Created**:
- `idx_work_items_enhances` - Finding all enhancements of a work item
- `idx_work_items_type_phase` - Type-phase composite queries
- `idx_work_items_review_status` - Filtering by review status

**Helper Functions**:
- `get_next_version(parent_id TEXT)` - Auto-increment version numbers for enhancement chains

**Files Modified**:
- `next-app/src/lib/supabase/types.ts` - Regenerated TypeScript types from schema
- `next-app/tests/utils/database.ts` - Fixed `createWorkItemInDatabase` (phase instead of status)
- `next-app/tests/utils/fixtures.ts` - Updated test fixtures
- `next-app/e2e/*.spec.ts` - Updated 4 E2E test files to use `phase` field

**Rationale**:
- Previous migrations were marked as applied but columns weren't actually created
- Work items use `phase` as their status field (timeline items have separate execution status)
- Enables type-aware phase workflows, versioning chains, and detached review process

---

#### Metorial Integration - Strategic Decision (2025-12-23)
Strategic analysis and decision to migrate from self-hosted MCP Gateway to Metorial as primary integration method for Week 11-12 implementation.

**Decision**: Approved - Migrate to Metorial as primary, keep self-hosted as advanced fallback

**Key Insights**:
- **User Experience**: 5 minutes setup vs 2-4 hours OAuth configuration per user
- **Integration Coverage**: 600+ integrations vs 6 providers (100x increase)
- **Cost**: Free tier for 90% of users vs $10-20/month infrastructure
- **Open Source Friendly**: Non-technical users can self-host with easy Metorial setup
- **Solo Dev Sustainable**: Cannot build/maintain 200-300 integrations alone

**Implementation Timeline**:
- **Now (Week 7-8)**: NO CHANGES - Continue with current work
- **Week 11-12**: Add Metorial SDK integration (3-4 days)

**Files Created**:
- `docs/research/metorial-integration-decision.md` - Strategic decision summary (key points)
- `C:\Users\harsh\.claude\plans\kind-mapping-quasar.md` - Full implementation plan (2,135 lines)

**Files to Create** (Week 11-12):
- `next-app/src/lib/ai/mcp/metorial-adapter.ts` - Metorial SDK wrapper
- `next-app/src/lib/ai/mcp/integration-factory.ts` - Mode selection (metorial/self-hosted/hybrid)
- `next-app/src/components/integrations/integration-status.tsx` - UI status component
- `docs/reference/SELF_HOSTED_MCP_GATEWAY.md` - Advanced self-hosted guide
- `docs/migration/METORIAL_MIGRATION.md` - Migration guide for existing users

**Files to Modify** (Week 11-12):
- `next-app/package.json` - Add Metorial SDK dependency
- `next-app/.env.example` - Add integration mode configuration
- `next-app/src/lib/ai/mcp/index.ts` - Update exports
- `next-app/src/app/api/integrations/route.ts` - Use factory pattern
- `docs/reference/MCP_USAGE_GUIDE.md` - Document both integration options
- `README.md` - Quick start with integration setup

**Files to Keep** (for fallback):
- `next-app/src/lib/ai/mcp/gateway-client.ts` - Self-hosted MCP client
- `docker/mcp-gateway/gateway.js` - Self-hosted gateway implementation
- All existing MCP Gateway infrastructure

**Rationale**:
For an open-source self-hosted application:
- Solo developer cannot build/maintain 200-300 integrations
- Users need 6-10 integrations out of 200-300 possible (variable requirements)
- Current approach: Users must configure OAuth apps for each integration (2-4 hours, high failure rate, technical users only)
- Metorial approach: Users sign up + add API key + connect integrations (5 minutes, non-technical friendly, 600+ integrations)

**Decision Validation** (5-Question Framework):
- ✅ Data Dependencies: Metorial SDK available, documented APIs
- ✅ Integration Points: Works with existing AI assistant and tools
- ✅ Standalone Value: Provides immediate value (600+ integrations)
- ✅ Schema Finalized: No database changes needed
- ✅ Testing Feasibility: Can test with multiple providers

**Result**: ✅ **PROCEED in Week 11-12** - All validation criteria met

**References**:
- **Strategic Decision**: [docs/research/metorial-integration-decision.md](../research/metorial-integration-decision.md)
- **Full Plan**: `C:\Users\harsh\.claude\plans\kind-mapping-quasar.md`
- **Progress Entry**: [docs/planning/PROGRESS.md](../planning/PROGRESS.md#metorial-integration---strategic-decision--2025-12-23)
- **External**: https://metorial.com/ | https://docs.metorial.com/

---

### Fixed

#### Type-Aware Phase System - Critical Fixes (2025-12-23)
Code review cleanup addressing 5 critical security, data integrity, and architecture consistency issues.

**Migration 1: Safety & Security Fixes**
- **File**: `20251222120000_add_missing_phase_columns.sql` (modified)
- **Changes**:
  - Added `WHERE phase IS NULL` to UPDATE statement (line 30) - protects existing data
  - Added `p_team_id TEXT` parameter to `get_next_version()` function (line 120)
  - Added `WHERE team_id = p_team_id` filter - enforces multi-tenancy isolation

**Migration 2: Schema Cleanup**
- **File**: `20251223000000_drop_work_items_status_column.sql` (new)
- **Changes**:
  - Dropped `work_items.status` column (conflicted with architecture)
  - Architecture now consistent: work items have `phase` only (which IS the status)
  - Timeline items retain separate `status` field for execution tracking
  - Logged 5 work items with differing status/phase values before dropping column

**Code Changes**:
```sql
-- Migration Safety Fix
UPDATE work_items
SET phase = CASE type
  WHEN 'feature' THEN 'design'
  WHEN 'enhancement' THEN 'design'
  WHEN 'concept' THEN 'ideation'
  WHEN 'bug' THEN 'triage'
  ELSE 'design'
END
WHERE phase IS NULL;  -- ✅ Added - only update NULL values

-- Multi-Tenancy Security Fix
CREATE OR REPLACE FUNCTION get_next_version(
  parent_id TEXT,
  p_team_id TEXT  -- ✅ Added parameter
)
RETURNS INTEGER AS $$
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM work_items
  WHERE team_id = p_team_id  -- ✅ Added team filter
    AND (enhances_work_item_id = parent_id OR id = parent_id);
  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql;
```

**Test Fixes** (24 total changes):
- `tests/fixtures/test-data.ts` - Removed `status` property from 5 TEST_WORK_ITEMS, updated phase values
- `tests/utils/fixtures.ts` - Changed `.status` → `.phase` (2 locations)
- `e2e/type-phases.spec.ts` - Removed 7 `status:` field inserts from work_items
- `e2e/review-process.spec.ts` - Removed 9 `status:` field inserts from work_items
- `e2e/versioning.spec.ts` - Removed 8 `status:` field inserts from work_items

**TypeScript Types**:
- `src/lib/supabase/types.ts` - Regenerated, `work_items.status` column removed

**Critical Issues Addressed**:
| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| Unsafe UPDATE | 🔴 HIGH | Could overwrite valid phase data | Added WHERE clause |
| Missing team_id filter | 🔴 CRITICAL | Version leakage across teams | Added parameter + filter |
| .status references | 🟡 MEDIUM | Test failures | Updated 2 fixture files |
| status: inserts | 🟡 MEDIUM | E2E test breakage | Removed 24 occurrences |
| Schema conflict | 🔴 CRITICAL | Architecture violation | Dropped status column |

**Architecture Validation**:
- ✅ **Phase IS Status**: Work items have `phase` only (no separate status)
- ✅ **Timeline Status**: Timeline items retain separate `status` for execution tracking
- ✅ **Multi-Tenancy**: All database functions now enforce team_id filtering
- ✅ **Test Alignment**: Test suite matches architecture decisions
- ✅ **Type Safety**: TypeScript types match actual schema

**Rationale**:
- Code review by `feature-dev:code-reviewer` agent identified critical flaws
- Schema had conflicting column violating documented "phase IS the status" architecture
- Multi-tenancy isolation was incomplete, allowing potential cross-team data leakage
- Test suite had invalid field references that would cause future failures

---

### Added

#### Strategy Customization Fields (Session 5 - 2025-12-15)
Database migration adding pillar-specific context fields to `product_strategies` table.

**Migration**: `20251214165151_add_strategy_customization_fields.sql`

**Schema Changes**:
```sql
ALTER TABLE product_strategies
ADD COLUMN IF NOT EXISTS user_stories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_examples TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS case_studies TEXT[] DEFAULT '{}';
```

**New Columns**:
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `user_stories` | TEXT[] | '{}' | User stories relevant to the strategy pillar |
| `user_examples` | TEXT[] | '{}' | Real-world examples and applications |
| `case_studies` | TEXT[] | '{}' | Case studies demonstrating success |

**Components Created** (`src/components/strategy/`):
- `alignment-strength-indicator.tsx` - Visual indicator for weak/medium/strong alignment
- `org-level-strategy-display.tsx` - Full organization-level strategy view with tabs
- `work-item-strategy-alignment.tsx` - Compact work item alignment view

**Files Modified**:
- `src/lib/types/strategy.ts` - Added new fields to `ProductStrategy` interface
- `src/components/strategy/strategy-form.tsx` - Added pillar-specific fields section
- `src/lib/supabase/types.ts` - Regenerated with new columns

---

#### Workspace Analysis Service (Session 2 - 2025-12-15)
Complete workspace health scoring and analysis service with dashboard integration.

**API Endpoints** (`src/app/api/workspaces/[id]/analyze/`):
- `GET /api/workspaces/[id]/analyze` - Workspace analysis endpoint
  - Auth: Requires authenticated user with team membership
  - Query params: `staleThreshold` (days), `upgradeThreshold` (0-1)
  - Response: `{ data: WorkspaceAnalysis, meta: { workspaceName, config } }`

**Core Infrastructure** (`src/lib/workspace/`):
- `analyzer-types.ts` - TypeScript interfaces (WorkspaceAnalysis, HealthBreakdown, MismatchedItem, UpgradeOpportunity, StaleItem)
- `analyzer-service.ts` (~320 lines) - Core analysis logic:
  - `analyzeWorkspace()` - Main analysis function
  - `calculateDistributionScore()` - Phase concentration penalty (0-30 pts)
  - `calculateReadinessScoreAndOpportunities()` - Using Session 1's calculator (0-30 pts)
  - `calculateFreshnessScore()` - Stale item detection (0-20 pts)
  - `calculateFlowScore()` - Phase advancement rate (0-20 pts)
  - `detectMismatches()` - Mode vs distribution analysis
  - `calculateStuckPenalty()` - Items stuck >14 days

**React Hooks** (`src/hooks/`):
- `use-workspace-analysis.ts` - React Query hook with Supabase real-time invalidation

**UI Components** (`src/components/workspace/`):
- `workspace-health-card.tsx` - Health card with circular gauge, breakdown bars, recommendations

**Dashboard Integration**:
- Added `'workspace-health'` to `DashboardWidget` type in `mode-config.ts`
- Added widget to all 4 workspace modes (development, launch, growth, maintenance)
- Updated `ModeAwareDashboard` to render `WorkspaceHealthCard`

**Health Score Algorithm**: Distribution (30) + Readiness (30) + Freshness (20) + Flow (20) - Penalties

---

#### Design Thinking Integration (Session 3 - 2025-12-15)
Complete Design Thinking methodology integration with frameworks, tools, and AI-powered suggestions.

**New Module** (`src/lib/design-thinking/`):
- `frameworks.ts` - 4 Design Thinking frameworks database:
  - Stanford d.school (Empathize → Define → Ideate → Prototype → Test)
  - Double Diamond (Discover → Define → Develop → Deliver)
  - IDEO HCD (Inspiration → Ideation → Implementation)
  - IBM Enterprise (The Loop + Hills, Playbacks, Sponsor Users)
- `phase-methods.ts` - Maps 4 platform phases to DT stages and methods
- `index.ts` - Module re-exports

**Design Thinking Tools (14 total)**:
Empathy maps, journey maps, personas, how might we, brainstorming, affinity diagrams, prototyping methods, user testing, stakeholder mapping, problem framing, ideation workshops, design sprints, feedback synthesis, iteration planning

**Case Studies (7)**:
Airbnb (Host Guarantee), Apple (iPhone), IBM (Enterprise Design), GE Healthcare, IDEO Shopping Cart, PillPack (Pharmacy), Stanford d.school (Embrace Incubator)

**New API Endpoint**:
- `POST /api/ai/methodology/suggest` - AI-powered methodology suggestions
  - Request: `{ work_item_id, team_id, current_phase, work_item_context?, model_key? }`
  - Response: `{ primaryFramework, frameworkReason, suggestedMethods, nextSteps, relevantCaseStudies }`
  - Uses `generateObject()` with MethodologySuggestionSchema

**New Schema** (`lib/ai/schemas.ts`):
- `DesignThinkingFrameworkSchema` - Enum: stanford, double-diamond, ideo, ibm
- `SuggestedMethodSchema` - Method name, description, expected outcome
- `MethodologySuggestionSchema` - Complete AI response structure

**New UI Components**:
- `guiding-questions-tooltip.tsx` - Phase badge hover tooltip with 2-3 questions
- `methodology-guidance-panel.tsx` - Full slide-over panel with:
  - Guiding questions with DT method badges
  - Tool cards (duration, participants, difficulty)
  - Case study cards (expandable)
  - Alternative framework suggestions
  - AI-powered personalized suggestions
  - Next phase preview

**Component Integrations**:
- `phase-context-badge.tsx` - Added `showTooltip` and `onOpenMethodologyPanel` props
- `work-item-detail-header.tsx` - Added "Methodology" button and Sheet wrapper

---

#### Architecture Decisions Finalized (2025-12-11)
Complete documentation of platform architecture principles and design decisions.

**Documentation Updates**:
- `docs/reference/ARCHITECTURE.md` - Added sections:
  - Two-Layer System Architecture (Workspace aggregation + Work Item phases)
  - Phase System (phase = status clarification, transition requirements)
  - Workspace Modes (4 lifecycle modes, no single stage field)
  - Strategy System (4-tier hierarchy, context-specific displays)
  - Design Thinking Methodology (how it maps to platform phases)
- `docs/reference/CODE_PATTERNS.md` - Added patterns:
  - Phase Transition Validation Pattern
  - Phase Readiness Calculation Pattern
  - Workspace Aggregation Pattern (phase distribution)
  - Strategy Display by Context Pattern
- `docs/ARCHITECTURE_CONSOLIDATION.md` - Created as canonical source of truth

**Key Architectural Clarifications**:
- **Two Layers, Not Three**: Workspace (aggregation) → Work Items (individual phases)
- **Phase = Status**: Work item `phase` field IS the status, no separate `status` field
- **Timeline Status**: Timeline items have separate `status` field for execution tracking
- **Workspace Stage**: Workspaces do NOT have a single stage; they show phase distribution
- **Design Thinking**: Methodology that guides HOW to work, not lifecycle stages
- **Strategy Hierarchy**: Phase-agnostic 4-tier system (Pillar → Objective → Key Result → Initiative)

**Phase Transition Requirements**:
| From → To | Required Fields |
|-----------|-----------------|
| research → planning | `purpose`, 1+ timeline items OR scope |
| planning → execution | `target_release`, `acceptance_criteria`, `priority`, `estimated_hours` |
| execution → review | `progress_percent` >= 80, `actual_start_date` |
| review → complete | Feedback addressed, `status` = 'completed' |

**Impact**:
- All documentation now aligned with canonical architecture
- Clear patterns for phase validation and transition logic
- Eliminates confusion between phase/status/stage terminology
- Provides code examples for common architectural patterns

---

#### Multi-Step Autonomous Execution System (Phase 8 - 2025-12-11)
Complete plan-and-execute architecture for complex multi-step tasks with single approval.

**Core Infrastructure** (`src/lib/ai/`):
- `task-planner.ts` (473 lines) - LLM-based task decomposition:
  - `createTaskPlan()` using AI SDK `generateObject()` for structured plan generation
  - `isMultiStepTask()` detection with regex patterns for common task indicators
  - `getTaskComplexity()` estimation (simple/medium/complex)
  - `TaskPlan`, `TaskStep` TypeScript interfaces with full typing
  - `formatPlanForDisplay()` utility for UI rendering
  - Zod schemas: `TaskStepSchema`, `TaskPlanSchema` for validation
- `agent-loop.ts` (409 lines) - Autonomous execution loop:
  - `executeTaskPlan()` with `onProgress` callbacks for real-time UI updates
  - `CancelSignal` interface for user interruption support
  - Context passing between steps (inspired by CrewAI patterns)
  - `MAX_RETRIES` (2) for failed step recovery
  - `ExecutionResult` interface with completedSteps, errors, executionTime

**UI Components** (`src/components/ai/`):
- `task-plan-card.tsx` (~380 lines) - Premium plan approval UI:
  - Glassmorphism card with gradient accent bar (category-colored)
  - Step status badges: ⏳ pending, 🔄 running, ✅ completed, ❌ failed
  - Tool category color coding: creation (emerald), analysis (blue), optimization (amber), strategy (purple)
  - Duration estimate badges (fast/medium/slow)
  - Action buttons: [✓ Approve All] [Step-by-Step] [Edit] [Cancel]
  - Collapsible step details with ScrollArea for 5+ steps
- `execution-progress.tsx` (~480 lines) - Real-time progress display:
  - Animated progress bar with gradient fill (status-based colors)
  - Step-by-step status updates with live icon changes
  - Elapsed time counter (auto-updating via useEffect interval)
  - Cancel button with AlertDialog confirmation
  - Completion/failure/cancelled states with summaries

**API Routes** (`src/app/api/ai/agent/plan/`):
- `POST /api/ai/agent/plan/approve` - Execute approved plan:
  - SSE stream for real-time progress events
  - Events: plan-approved, execution-started, step-progress, execution-complete, error
  - Plan stored in thread metadata for persistence
  - `activePlanSignals` Map for cancellation support
- `POST /api/ai/agent/plan/cancel` - Cancel running plan:
  - Triggers CancelSignal to stop execution loop
  - Returns completed steps count

**Chat Integration**:
- `chat-interface-v2.tsx` - Added state for `pendingPlan` and `executingPlan`
- `unified-chat/route.ts` - Multi-step detection branch with plan creation

---

#### Premium Tool UI Enhancement (Phase 8.7 - 2025-12-11)
Complete redesign of tool UI components with glassmorphism, gradients, and micro-interactions.

**Design System Constants**:
- Category-based styling: creation (emerald), analysis (blue), optimization (amber), strategy (purple)
- Each category defines: gradient, border, glow, iconBg, iconColor, accentBar, overlay, buttonGradient

**Files Enhanced**:

1. **`tool-previews.tsx`** - Premium preview components:
   - `sentimentStyles` for InsightPreview (positive/neutral/negative/default)
   - Premium card wrappers with glassmorphism (backdrop-blur-xl)
   - Gradient accent bars based on category/sentiment
   - Enhanced badges with gradient backgrounds
   - Hover effects with scale transforms

2. **`tool-confirmation-card.tsx`** - Complete premium upgrade:
   - `categoryConfig` object with full style definitions per category
   - Glassmorphism card wrapper: `bg-gradient-to-br from-background/95 via-background/90 to-background/80`
   - Gradient approve buttons: `bg-gradient-to-r from-X-500 to-Y-500`
   - Button hover effects: `hover:shadow-lg hover:shadow-X-500/25`
   - `CompletedActionCard` with success (emerald) and error (red) themes
   - Status indicators with category-colored icons

3. **`tool-ui-registry.tsx`** - Streaming tool premium states:
   - `streamingStyles` constants for all states:
     - `running`: blue/purple/amber variants with animation
     - `success`: emerald theme with checkmark
     - `error`: red theme with alert icon
     - `cancelled`: slate theme with stop icon
   - Updated `WebSearchToolUI`, `ExtractDataToolUI`, `AnalyzeFeedbackToolUI`
   - Consistent premium styling across all streaming tools
   - `createStreamingToolUI` factory with premium default states

**Visual Improvements**:
- Glassmorphism: `backdrop-blur-xl` + semi-transparent backgrounds
- Gradient overlays: `bg-gradient-to-br from-X-500/5 via-transparent to-Y-500/5`
- Accent bars: `h-1 w-full bg-gradient-to-r from-X-500 to-Y-500`
- Premium shadows: `shadow-lg shadow-black/5` + `shadow-X-500/10` glow
- Hover states: `hover:scale-[1.01] hover:border-white/20`

---

### Fixed

#### AI SDK v5 Proper Migration (2025-12-02)
- **Issue**: TypeScript compilation errors due to using legacy v4 API syntax with AI SDK v5.0.104
- **Root Cause**: Tools used `parameters` property (v4 syntax) instead of `inputSchema` (v5 syntax)
- **Research**: Confirmed v6 is in beta (stable end of 2025), maintains same tool API - migration will be minimal
- **Files Fixed**:
  - `src/lib/ai/tools/parallel-ai-tools.ts` - Migrated all 5 tools to proper v5 API:
    - Changed `parameters` → `inputSchema` for all tools (webSearchTool, extractContentTool, deepResearchTool, researchStatusTool, quickAnswerTool)
    - Updated `execute` signature to include `options: { toolCallId, abortSignal }`
    - Removed `createTool` workaround helper and all `any` type casts
    - Full type safety now working with zero workarounds
  - `src/lib/ai/ai-sdk-client.ts` - Changed `LanguageModelV1` → `LanguageModel` type
  - `src/app/api/ai/sdk-chat/route.ts` - Fixed `Message` → `UIMessage`, `toDataStreamResponse` → `toTextStreamResponse`
  - `src/app/api/ai/analyze-note/route.ts` - Fixed token usage: `promptTokens` → `inputTokens`, `completionTokens` → `outputTokens`
  - `src/app/api/ai/dependencies/suggest/route.ts` - Same token usage property fixes with null coalescing
  - `src/app/api/ai/chat/route.ts` - Fixed async import issue inside synchronous map
  - `src/components/ai/chat-panel.tsx` - Added `LegacyMessage` interface for backward compatibility with useChat hook
  - `tests/utils/database.ts` - Added `GenerateLinkPropertiesWithTokens` interface for Supabase type compatibility
- **Impact**: Full TypeScript compilation with zero errors, proper type safety, ready for v6 migration
- **v6 Readiness**: AI SDK v6 (beta, stable end of 2025) maintains the same tool API, so migration will be minimal

### Added

#### Collective Intelligence API + UI (Phase 1, Session 13 - 2025-12-04)
Complete API routes and dashboard for the knowledge compression system.

**API Routes** (`app/api/knowledge/`):
- `POST /api/knowledge/compression` - Trigger compression jobs (l2_summary, l3_clustering, l4_extraction, full_refresh)
- `GET /api/knowledge/compression` - List compression jobs with filtering
- `GET /api/knowledge/compression/[jobId]` - Get job status
- `DELETE /api/knowledge/compression/[jobId]` - Cancel running job
- `GET /api/knowledge/graph` - Get knowledge graph for visualization
- `POST /api/knowledge/context` - Get compressed context for AI prompts
- `GET /api/knowledge/topics` - List topic clusters with documents

**React Query Hooks** (`lib/hooks/use-knowledge.ts`):
- `useKnowledgeGraph()` - Fetch knowledge graph data
- `useCompressedContext()` - Query compressed context
- `useTopics()` - Fetch topic clusters
- `useCompressionJobs()` - List compression jobs
- `useJobStatus()` - Poll single job status
- `useTriggerCompression()` - Mutation to start jobs
- `useCancelCompression()` - Mutation to cancel jobs
- `useActiveJobs()` - Auto-polling for running jobs

**Dashboard Component** (`components/knowledge/knowledge-dashboard.tsx`):
- Stats overview: concepts, relationships, topics, jobs
- Overview tab: top concepts and topic clusters
- Graph tab: concept list with relationships
- Topics tab: topic cards with documents
- Jobs tab: trigger compression + job history

---

#### Knowledge Compression Services (Phase 1, Session 12 - 2025-12-03)
AI-powered compression pipeline for generating L2-L4 knowledge layers.

**L2 Summarizer** (`src/lib/ai/compression/l2-summarizer.ts`):
- `summarizeDocument()` - Generate document summary with key points, topics, entities
- `batchSummarizeDocuments()` - Process multiple documents with context accumulation
- Zod schemas for structured AI output (summary, keyPoints, topics, entities, sentiment)
- OpenRouter integration with Claude 3 Haiku for cost-efficient summarization

**L3 Topic Clustering** (`src/lib/ai/compression/l3-topic-clustering.ts`):
- `clusterTopics()` - Greedy clustering based on embedding similarity
- `getClusterCenter()` - Calculate cluster centroid for similarity matching
- `generateTopicFromCluster()` - AI synthesis of cross-document topics
- Automatic topic creation/update with 0.85 similarity threshold

**L4 Concept Extractor** (`src/lib/ai/compression/l4-concept-extractor.ts`):
- `extractConcepts()` - Extract concepts and relationships from documents
- `upsertConcept()` - Merge similar concepts by name or embedding similarity
- `upsertRelationship()` - Create/strengthen relationships between concepts
- `getKnowledgeGraph()` - Retrieve top concepts with relationships

**Job Runner** (`src/lib/ai/compression/job-runner.ts`):
- `runCompressionJob()` - Orchestrate L2/L3/L4 compression with progress tracking
- `full_refresh` - Complete pipeline: summarize → cluster → extract
- Job status tracking: pending → running → completed/failed
- Progress callbacks for real-time UI updates

---

#### Collective Intelligence / Knowledge Compression (Phase 1, Session 11 - 2025-12-03)
Hierarchical knowledge compression system for efficient AI context management.

**Database Migration** (`20251203130000_create_collective_intelligence.sql`):
- `document_summaries` - L2: Document-level summaries (~200 tokens)
- `knowledge_topics` - L3: Cross-document topic clusters
- `topic_documents` - Junction table for topic-document relationships
- `knowledge_concepts` - L4: Knowledge graph concepts
- `concept_relationships` - L4: Edges in knowledge graph
- `compression_jobs` - Background compression job tracking
- `get_compressed_context()` - Multi-layer semantic search function
- `get_knowledge_graph()` - Knowledge graph retrieval function
- HNSW vector indexes for L2-L4 embeddings

**TypeScript Types** (`src/lib/types/collective-intelligence.ts`):
- `DocumentSummary`, `KnowledgeTopic`, `KnowledgeConcept` - Core entity types
- `ConceptRelationship`, `TopicDocument` - Relationship types
- `CompressionJob`, `CompressionJobResult` - Job tracking types
- `CompressedContext`, `KnowledgeGraph` - Function return types
- `ConceptType`, `RelationshipType`, `TopicCategory` - Enums
- `COMPRESSION_CONFIG` - Configuration constants

**Compression Layers**:
- L1: Document chunks (~500 tokens) - existing from Session 9
- L2: Document summaries with key insights, entities, topics
- L3: Cross-document topic clustering with importance/confidence scores
- L4: Knowledge graph with concepts and typed relationships

---

#### Embedding Pipeline + Document Search (Phase 1, Session 10 - 2025-12-03)
Text extraction, chunking, embedding generation, and semantic search.

**Embedding Service** (`src/lib/ai/embeddings/embedding-service.ts`):
- `chunkText()` - Intelligent text chunking with heading detection
- `generateEmbeddings()` - Batch embedding generation via OpenAI
- `embedQuery()` - Single query embedding generation
- `formatEmbeddingForPgvector()` - pgvector format conversion
- Supports OpenAI text-embedding-3-small (1536 dimensions)

**Document Processor** (`src/lib/ai/embeddings/document-processor.ts`):
- `processDocument()` - Full processing pipeline (extract → chunk → embed → store)
- `extractText()` - Text extraction for TXT, MD, HTML, CSV, JSON
- `searchDocuments()` - Vector similarity search wrapper

**API Routes**:
- `POST /api/documents` - Upload document with metadata
- `GET /api/documents` - List documents with filtering
- `POST /api/documents/search` - Semantic search with similarity scores

---

#### Knowledge Base / Document RAG System (Phase 1, Session 9 - 2025-12-03)
Document storage and vector search system for AI-powered document retrieval.

**Database Migration** (`20251203120000_create_knowledge_base.sql`):
- `document_collections` - Organize documents by topic (PRDs, Meeting Notes, etc.)
- `knowledge_documents` - Document metadata with processing status
- `document_chunks` - Chunked text with pgvector embeddings (1536 dimensions)
- `document_queries` - Query analytics and tracking
- `search_documents()` - Vector similarity search function
- `get_knowledge_base_stats()` - Statistics helper function
- HNSW index for fast approximate nearest neighbor search

**TypeScript Types** (`src/lib/types/knowledge.ts`):
- `KnowledgeDocument`, `DocumentChunk`, `DocumentCollection` - Core types
- `DocumentSearchResult`, `RAGContext`, `Citation` - Search and RAG types
- `SUPPORTED_FILE_TYPES` - PDF, DOCX, MD, TXT, HTML, CSV, JSON
- `EMBEDDING_CONFIG`, `SEARCH_CONFIG` - Configuration constants

**Features**:
- Vector embeddings via pgvector extension
- Semantic search with configurable similarity threshold
- Document visibility controls (private, team, workspace)
- Processing pipeline status tracking
- RAG context generation for AI prompts

---

#### MCP Gateway Integration System (Phase 1, Sessions 5-7 - 2025-12-03)
External integration system supporting 270+ integrations via Docker MCP Gateway.

**Database Migration** (`20251203100000_create_mcp_gateway_integrations.sql`):
- `organization_integrations` - Team-level OAuth tokens and provider connections
- `workspace_integration_access` - Workspace-level tool enablement
- `integration_sync_logs` - Audit trail for all sync operations
- RLS policies for multi-tenant access control
- `get_team_integration_summary()` helper function

**Docker Infrastructure** (`docker/`):
- `mcp-gateway/Dockerfile` - Node.js 20 Alpine container for MCP server
- `mcp-gateway/gateway.js` - JSON-RPC 2.0 server with OAuth flow support
- `docker-compose.yml` - Gateway + Redis for token caching
- Provider support: GitHub, Jira, Linear, Notion, Slack, Figma

**TypeScript Client** (`src/lib/ai/mcp/`):
- `gateway-client.ts` - Type-safe client with retry logic and health checks
- `MCPGatewayClient` class with `callTool()`, `listTools()`, `initOAuth()` methods
- Singleton `mcpGateway` instance for easy access

**API Routes** (`app/api/integrations/`):
- `GET /api/integrations` - List team integrations
- `POST /api/integrations` - Create integration + initiate OAuth
- `GET /api/integrations/[id]` - Integration details with sync logs
- `DELETE /api/integrations/[id]` - Disconnect integration
- `POST /api/integrations/[id]/sync` - Trigger sync operation
- `GET /api/integrations/oauth/callback` - OAuth callback handler
- `GET /api/workspaces/[id]/integrations` - Workspace-enabled integrations
- `POST /api/workspaces/[id]/integrations` - Enable integration for workspace

**Environment Variables**:
- `MCP_GATEWAY_URL` - Gateway URL (default: http://localhost:3100)
- OAuth credentials for each provider (GITHUB_CLIENT_ID, etc.)

---

#### Strategy Alignment System (Phase 1, Session 3 - 2025-12-03)
Complete OKR/Pillar strategy system with hierarchical tree, drag-drop reordering, and AI alignment suggestions.

**Database Migration** (`20251202162950_add_strategy_reorder_function.sql`):
- `reorder_strategy()` PostgreSQL function for safe hierarchy reordering
- Handles sort_order updates, parent changes, and circular reference prevention
- Uses recursive CTE to validate hierarchy integrity

**API Routes** (`app/api/strategies/`):
- `GET /api/strategies` - List strategies with workspace/team filtering
- `POST /api/strategies` - Create new strategy with hierarchy support
- `GET /api/strategies/[id]` - Get single strategy with children
- `PUT /api/strategies/[id]` - Update strategy fields
- `DELETE /api/strategies/[id]` - Delete strategy (cascade to children)
- `POST /api/strategies/[id]/reorder` - Safe drag-drop reordering with validation
- `GET /api/strategies/stats` - Aggregate statistics (counts by type/status)
- `POST /api/ai/strategies/suggest` - AI-powered alignment suggestions using OpenRouter

**Components** (`src/components/strategies/`):
- `StrategyTree` - Hierarchical tree view with @dnd-kit drag-drop
- `StrategyTreeItem` - Collapsible tree node with type-specific icons/colors
- `StrategyTypeCard` - Visual type selector (pillar/objective/key_result/initiative)
- `StrategyDetailSheet` - Slide-over panel for viewing/editing strategy details
- `CreateStrategyDialog` - Form dialog with type selection and parent picker
- `AlignmentDashboard` - Recharts visualizations for alignment metrics
- `AIAlignmentSuggestions` - AI-powered suggestion component with apply actions
- `StrategyBreadcrumb` - Navigation breadcrumb for hierarchy traversal
- `StrategyCard` - Card view for list display mode

**React Query Hooks** (`lib/hooks/use-strategies.ts`):
- `useStrategyTree` - Fetch hierarchical strategy tree
- `useStrategy` - Single strategy fetch by ID
- `useStrategyStats` - Statistics aggregation query
- `useCreateStrategy` - Create mutation with cache invalidation
- `useUpdateStrategy` - Update mutation with optimistic updates
- `useDeleteStrategy` - Delete mutation with cascade handling
- `useReorderStrategy` - Drag-drop reorder mutation

**TypeScript Types** (`lib/types/strategy-types.ts`):
- `Strategy` - Core strategy interface with all fields
- `StrategyType` - Union type: 'pillar' | 'objective' | 'key_result' | 'initiative'
- `StrategyStatus` - Status tracking: 'draft' | 'active' | 'completed' | 'archived'
- `StrategyWithChildren` - Extended type for tree representation
- `StrategyTreeNode` - Tree node structure for UI rendering
- Request/response types for all API endpoints

**Bug Fixes During Implementation**:
- Fixed `supabase: any` → `Awaited<ReturnType<typeof createClient>>` in reorder route
- Fixed `error: any` → `error: unknown` with `error instanceof Error` pattern
- Added explicit Recharts interfaces (TooltipProps, LegendProps, payload types)
- Fixed implicit `any` types in alignment dashboard tooltip/legend components
- Fixed `isLoading` prop missing from StrategyDetailSheet

#### Workspace Modes & UX Enhancements (Phase 1, Session 3 - 2025-12-02)

**Workspace Mode System** (`lib/workspace-modes/mode-config.ts`)
- 4 lifecycle modes: development, launch, growth, maintenance
- Mode-specific feature visibility configuration
- Mode-specific color schemes and icons
- Mode transition recommendations

**Progressive Form System** (`lib/hooks/use-progressive-form.ts`, `components/forms/`)
- `useProgressiveForm` hook for dynamic field visibility
- `ProgressiveForm` component with expandable sections
- `ProgressiveFieldGroup` for field grouping by importance
- `SmartWorkItemForm` - Mode-aware work item creation

**Templates System** (Migration: `20251202125328_create_workspace_templates.sql`)
- `workspace_templates` table with RLS policies
- 8 system templates (2 per mode):
  - Development: MVP Sprint, Feature Discovery
  - Launch: Launch Checklist, Go-to-Market
  - Growth: Growth Experiments, Feature Expansion
  - Maintenance: Tech Debt Tracker, Stability Focus
- Template types: `lib/templates/template-types.ts`
- System templates registry: `lib/templates/system-templates.ts`
- UI Components:
  - `TemplateCard` - Card display with mode badge
  - `TemplatePreview` - Sheet with full details
  - `TemplateGallery` - Grid with mode tabs and search
  - `CreateTemplateDialog` - Team template creation
- API Routes:
  - `GET/POST /api/templates` - List and create
  - `GET/PUT/DELETE /api/templates/[id]` - Single template ops
  - `POST /api/templates/apply` - Apply to workspace

**Connection Menu** (`components/connection-menu/`)
- Notion-style "/" command for entity linking
- 6 entity types: work_item, member, department, strategy, insight, resource
- Type-specific icons and colors
- `useConnectionSearch` hook for parallel search
- Keyboard navigation support (⌘K)

**Mode Onboarding Wizard** (`components/onboarding/mode-onboarding-wizard.tsx`)
- 4-step wizard: Welcome → Template → Tips → Complete
- Template selection with preview
- Mode-specific tips and guidance
- Page route: `/workspaces/[id]/onboarding`

**Mode-Aware Dashboard** (`components/dashboard/`)
- Container: `ModeAwareDashboard` - Renders mode-specific widgets
- Widgets:
  - `QuickActionsWidget` - Mode-specific suggested actions
  - `BlockersWidget` - Launch mode blocking issues
  - `FeedbackSummaryWidget` - Growth mode feedback overview
  - `TechDebtWidget` - Maintenance mode debt tracking
- API Route: `GET/PUT /api/workspaces/[id]/mode` - Mode operations

#### Analytics Dashboards System (Phase 1, Session 2 - 2025-12-02)

Complete implementation of 4 pre-built analytics dashboards with Pro feature custom dashboard builder.

**Core Analytics Types** (`lib/types/analytics.ts`):
- `MetricCardData` - Individual metric display
- `PieChartData` - Pie/donut chart data with index signature for Recharts compatibility
- `BarChartData`, `LineChartData` - Time series visualization
- `ActivityItem`, `ListItem` - Activity feed and list data
- `DashboardData` - Unified dashboard response structure
- `WidgetDefinition`, `WidgetInstance` - Widget system types for custom builder

**Pre-Built Dashboards** (`components/analytics/dashboards/`):
- `FeatureOverview` - Work item metrics, status/type breakdown, recent activity, completion trends
- `DependencyHealth` - Dependency counts, health distribution, critical path, bottlenecks, orphaned items
- `TeamPerformance` - Member productivity, workload distribution, velocity trends, phase allocation
- `StrategyAlignment` - OKR/Pillar progress, alignment breakdown, at-risk strategies, unlinked items

**Shared Components** (`components/analytics/`):
- `MetricCard` - Stats display with trend indicators
- `TrendIndicator` - Up/down/neutral trend visualization

**Analytics View** (`app/(dashboard)/workspaces/[id]/analytics/`):
- `page.tsx` - Server component with Pro feature gate
- `analytics-view.tsx` - Tab-based dashboard selector with export functionality
- `export.ts` - `exportToCSV()` utility for dashboard data export

**Widget System for Custom Builder (Pro Feature)**:
- `widget-registry.tsx` - 20+ widget definitions across 4 categories:
  - Metrics: total-work-items, completion-rate, blocked-items, health-score, velocity, cycle-time
  - Charts: status-breakdown-chart, type-breakdown-chart, timeline-distribution, dependency-flow, burndown-chart
  - Lists: recent-activity, critical-path, bottlenecks, at-risk-items
  - Progress: strategy-progress, phase-progress, team-workload, sprint-progress
- `widget-picker.tsx` - Sheet-based widget selector with search and accordion categories
- `dashboard-builder.tsx` - react-grid-layout drag-and-drop canvas with:
  - Grid configuration (6 columns, 120px row height)
  - Widget add/remove/duplicate/resize/drag
  - Dashboard name editing
  - Save functionality
  - Pro feature gate (Lock UI for non-Pro users)

**API Routes**:
- `GET /api/analytics/overview` - Feature Overview dashboard data
- `GET /api/analytics/dependencies` - Dependency Health dashboard data
- `GET /api/analytics/performance` - Team Performance dashboard data
- `GET /api/analytics/alignment` - Strategy Alignment dashboard data
- `POST /api/analytics/dashboards` - Create custom dashboard (Pro)

**Dependencies Added**:
- `react-grid-layout` - Drag-and-drop grid layout
- `@types/react-grid-layout` - TypeScript definitions
- `accordion` - shadcn/ui component for widget picker

**Bug Fixes During Implementation**:
- Fixed `PieChartData` type incompatibility with Recharts by adding index signature
- Fixed `LinkOff` → `Link2Off` icon import (lucide-react naming)
- Fixed missing `isLoading` prop on `StrategyDetailSheet`
- Fixed circular type inference in strategies reorder route
- Fixed `useToast` import path

**Inline Editing Components** (`components/inline-editors/`)
- `InlineSelect` - Base click-to-edit select with optimistic updates
- `InlineStatusEditor` - Status field (planned/in_progress/completed/on_hold)
- `InlinePriorityEditor` - Priority field (low/medium/high/critical)
- `InlineTypeEditor` - Type field (concept/feature/bug/enhancement)
- `InlineDepartmentEditor` - Department selector with live data

**Component Integrations**
- `dashboard-view.tsx` - Integrated ModeAwareDashboard for mode-aware workspaces
- `work-items-table-view.tsx` - Added inline editors for type, status, priority columns

#### Feedback & Insights UI System (2025-12-02)
Complete implementation of public feedback collection and customer insights management.

**Security Utilities** (`src/lib/security/`):
- `honeypot.ts` - Spam prevention with hidden fields + time validation (< 3s = bot)
- `rate-limit.ts` - In-memory rate limiting (10 feedback/30 votes per 15 min per IP)
- CAPTCHA-ready architecture with pluggable provider interface

**Insights Dashboard Components** (`src/components/insights/`):
- `insights-dashboard.tsx` - Main dashboard with tabs (all/triage/linked)
- `insights-dashboard-stats.tsx` - Stats cards with clickable filters
- `insight-detail-sheet.tsx` - Slide-over panel for insight details
- `insight-triage-queue.tsx` - Keyboard-driven rapid review (Vim-style j/k navigation)
- `hooks/use-insight-shortcuts.ts` - Keyboard shortcuts hook
- `public-vote-card.tsx` - External voting UI with configurable verification

**Feedback Components** (`src/components/feedback/`):
- `public-feedback-form.tsx` - Simplified form with honeypot integration
- `feedback-thank-you.tsx` - Success confirmation component
- `feedback-widget-embed.tsx` - Embed code generator with live preview

**Work Item Integration** (`src/components/work-items/`):
- `linked-insights-section.tsx` - Shows/manages insights linked to work items

**Settings** (`src/components/settings/`):
- `workspace-feedback-settings.tsx` - Admin panel for feedback configuration

**Public Pages** (`src/app/(public)/`):
- `layout.tsx` - Minimal layout with gradient background
- `feedback/[workspaceId]/page.tsx` - Public feedback submission
- `widget/[workspaceId]/page.tsx` - Embeddable widget with URL params
- `vote/[insightId]/page.tsx` - Public voting page

**Public API Routes**:
- `POST /api/public/feedback` - Submit anonymous feedback with spam protection
- `GET /api/public/workspaces/[id]` - Validate workspace + get public settings
- `GET /api/public/insights/[id]` - Get sanitized insight for voting
- `POST /api/public/insights/[id]/vote` - Submit public vote

**Dashboard Route**:
- `src/app/(dashboard)/workspaces/[id]/insights/page.tsx` - Insights dashboard

**Keyboard Shortcuts (Triage Queue)**:
- `j/k` - Navigate up/down, `R` - Reviewed, `A` - Actionable, `D` - Archive
- `L` - Link to work item, `Enter` - Open detail, `/` - Search, `?` - Help

#### Previous Additions
- PROGRESS.md - Weekly implementation tracker with completion percentages
- CHANGELOG.md - This file, tracking all changes and migrations
- Updated README.md to reflect Next.js 15 platform (not legacy HTML app)
- Fixed MCP_OPTIMIZATION_SUMMARY.md (corrected from 2 to 3 active MCPs)

### Changed
- Documentation structure improvements in progress

### Security
#### Function Search Path Vulnerabilities (Migration: `20251202150000_fix_remaining_function_search_paths.sql`)
- **Issue**: Supabase advisor detected 16 `function_search_path_mutable` warnings - functions without immutable search_path are vulnerable to search path injection attacks
- **Fix**: Added `SET search_path = ''` to 30+ functions using ALTER FUNCTION with DO blocks for safe execution
- **Functions Fixed**:
  - Trigger functions: handle_work_item_reference_cleanup, validate_work_item_reference, update_feedback_updated_at, calculate_work_item_duration, update_customer_insights_updated_at, handle_new_user, log_phase_change, auto_refresh_workload_cache, update_workspace_templates_updated_at, update_work_flows_updated_at, update_flow_counts, update_strategy_calculated_progress
  - Auth helpers: user_is_team_member, user_is_team_admin
  - Work item functions: calculate_work_item_status, calculate_work_item_progress, calculate_work_item_phase
  - Resource functions: purge_soft_deleted, purge_deleted_resources, get_resource_history, search_resources, purge_unlinked_work_item_resources, manual_purge_all_deleted
  - Phase functions: count_phase_leads, refresh_phase_workload_cache, get_phase_lead_info
  - Task functions: get_workspace_task_stats, get_work_item_tasks
  - Public feedback: check_public_feedback_enabled, get_workspace_public_settings
  - Strategy functions: calculate_strategy_progress
- **Impact**: Eliminated search path injection attack vector for all database functions
- **Verification**: Supabase advisor confirmed 0 `function_search_path_mutable` warnings post-migration
- **Remaining**: `auth_leaked_password_protection` warning - This is a **Pro Plan feature** (HaveIBeenPwned.org integration). Cannot be enabled on Free Plan.

#### Departments & Insight Votes RLS Fix (Migration: `20251202160000_fix_departments_insight_votes_rls.sql`)
- **Issue 1**: `auth_rls_initplan` on `departments` table - 4 RLS policies using `auth.uid()` directly
- **Issue 2**: `multiple_permissive_policies` on `insight_votes` table - duplicate INSERT policies
- **Fix 1**: Replaced `auth.uid()` with `(select auth.uid())` in all 4 departments policies
- **Fix 2**: Consolidated "Team members can create votes" and "External voters can vote via review links" into single policy with OR conditions
- **Impact**: Improved RLS query performance on departments and insight_votes tables
- **Verification**: Supabase advisor confirmed 0 WARN-level issues remaining (only INFO-level notices)

#### Security Definer View Fix (Migration: `20251202170000_fix_security_definer_view.sql`)
- **Issue**: `security_definer_view` ERROR on `public.cron_job_status` view
- **Risk**: Views with SECURITY DEFINER run with the view creator's permissions (postgres), bypassing RLS
- **Fix**: Dropped the `cron_job_status` view - admins can query `cron.job` directly if needed
- **Impact**: Eliminated RLS bypass vulnerability

#### Workspace Templates Trigger Search Path Fix (Migration: `20251202200000_fix_workspace_templates_trigger_search_path.sql`)
- **Issue**: `function_search_path_mutable` WARN on `update_workspace_templates_updated_at` function
- **Root Cause**: Function was created without explicit `search_path` setting during table creation
- **Fix**: Added `SET search_path = ''` to function
- **Verification**: Supabase security advisor shows 0 ERROR or WARN issues (except Pro Plan feature `auth_leaked_password_protection`)

### Performance

#### Workspace Templates RLS + FK Indexes (Migration: `20251202180000_fix_workspace_templates_rls_and_add_fk_indexes.sql`)
- **Issue 1**: `auth_rls_initplan` on `workspace_templates` - 4 RLS policies using `auth.uid()` directly
- **Issue 2**: `unindexed_foreign_keys` - 30 foreign key columns without covering indexes
- **Fix 1**: Replaced `auth.uid()` with `(select auth.uid())` in all 4 workspace_templates policies (SELECT, INSERT, UPDATE, DELETE)
- **Fix 2**: Added 30 indexes on FK columns across 18 tables:
  - `ai_usage`: workspace_id
  - `custom_dashboards`: created_by, workspace_id
  - `customer_insights`: created_by, workspace_id
  - `departments`: created_by
  - `feedback`: decision_by, implemented_in_id
  - `insight_votes`: voter_id
  - `invitations`: invited_by
  - `linked_items`: created_by
  - `mind_map_edges`: source_node_id, target_node_id
  - `mind_map_nodes`: converted_to_work_item_id
  - `product_strategies`: owner_id
  - `product_tasks`: created_by
  - `resource_audit_log`: team_id, workspace_id
  - `resources`: created_by, deleted_by, last_modified_by, workspace_id
  - `review_links`: created_by
  - `subscriptions`: team_id
  - `success_metrics`: feature_id, workspace_id
  - `user_phase_assignments`: assigned_by
  - `work_item_insights`: linked_by
  - `work_item_resources`: added_by, unlinked_by
- **Impact**: Improved RLS query performance + faster JOINs and CASCADE DELETEs
- **Verification**: 0 WARN-level issues, only INFO-level unused indexes remain (expected in development)

#### Workspace Templates SELECT Policy Consolidation (Migration: `20251202190000_consolidate_workspace_templates_select_policies.sql`)
- **Issue**: `multiple_permissive_policies` WARN on `workspace_templates` - two SELECT policies (`workspace_templates_read_system` and `workspace_templates_read_team`) with overlapping scope
- **Root Cause**: After fixing `auth_rls_initplan` in migration `20251202180000`, PostgreSQL flagged the two separate SELECT policies as potentially overlapping
- **Fix**: Consolidated into single `workspace_templates_select` policy with OR conditions:
  - System templates (`is_system = true`) are publicly readable
  - Team templates are readable by team members via EXISTS subquery
- **Impact**: Single policy evaluation instead of two separate checks per query
- **Verification**: 0 ERROR, 0 WARN issues - all security and performance advisors clean (except Pro Plan feature and INFO-level notices)

#### RLS Policy Optimization (Migration: `20251201000001_optimize_rls_auth_initplan.sql`)
- **Issue**: Supabase advisor detected 44+ `auth_rls_initplan` warnings - `auth.uid()` and `current_setting()` calls were re-evaluated for every row scanned
- **Fix**: Wrapped all `auth.uid()` and `current_setting()` calls in scalar subqueries `(select ...)` so they execute once per query instead of once per row
- **Scope**: Optimized 119 RLS policies across 27 tables
- **Tables Affected**: users, teams, team_members, invitations, subscriptions, workspaces, work_items, linked_items, timeline_items, execution_steps, product_tasks, feature_resources, milestones, risks, prerequisites, inspiration_items, mind_maps, mind_map_nodes, mind_map_edges, review_links, feedback, custom_dashboards, success_metrics, ai_usage, workflow_stages, conversion_tracking, resources, work_item_resources, resource_audit_log
- **Helper Functions Updated**: `user_is_team_member()`, `user_is_team_admin()` - also optimized for `(select auth.uid())` pattern
- **Impact**: Significant query performance improvement for multi-tenant RLS checks
- **Verification**: Supabase advisor confirmed 0 `auth_rls_initplan` warnings post-migration

#### Duplicate RLS Policy Consolidation (Migration: `20251201000002_consolidate_duplicate_rls_policies.sql`)
- **Issue**: Supabase advisor detected 50+ `multiple_permissive_policies` warnings - multiple overlapping policies for same table/role/action
- **Fix**: Consolidated duplicate policies into single policies with combined OR conditions
- **Tables Affected**:
  - `mind_maps`, `mind_map_nodes`, `mind_map_edges`: Removed redundant "Workspace members can manage..." FOR ALL policies
  - `team_members`: Merged "Users can view own..." + "Team members can view roster..." → single SELECT policy
  - `teams`: Merged duplicate SELECT policies into single policy
  - `users`: Merged "Users can view all profiles" + "Users can view own profile" → single SELECT policy
  - `invitations`: Merged token-based and team-based SELECT policies
  - `work_item_connections`: Consolidated 8 duplicate policies (feature/work-item variants) into 4
  - `workspaces`: Merged user-based and team-based policies for SELECT/INSERT/UPDATE
- **Impact**: Reduced duplicate policy evaluations, improving RLS query performance

#### Duplicate Index Cleanup (Migration: `20251201000003_drop_duplicate_indexes.sql`)
- **Issue**: Supabase advisor detected 5 `duplicate_index` warnings - identical indexes with different names
- **Fix**: Dropped redundant indexes, keeping the ones with better naming conventions
- **Indexes Dropped**:
  - `linked_items`: Dropped `idx_linked_items_workspace` (kept `idx_linked_items_workspace_id`)
  - `work_item_connections`: Dropped legacy `idx_connections_*` indexes (kept `idx_work_item_connections_*`)
    - `idx_connections_type`, `idx_connections_source`, `idx_connections_target`, `idx_connections_workspace`
- **Impact**: Reduced disk space usage and write overhead (no duplicate index maintenance)

### Planned - Architecture Refactor (Scheduled Post-Week 7)

#### Workspace-Level Timelines & Calculated Status
- **Status**: PLANNING COMPLETE - Postponed for implementation
- **Detailed Spec**: [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md)
- **Estimated Effort**: ~25 hours
- **Target**: After Week 7 (AI Integration complete)

**Database Changes (Planned)**:
- NEW: `timelines` table - Workspace-level release milestones
- NEW: `work_item_timelines` junction table - M:N work items ↔ timelines
- MODIFY: `product_tasks` - Add `effort_size` (xs/s/m/l/xl) with computed `effort_points`
- MODIFY: `workspaces` - Add `effort_vocabulary` (simple/technical/business)

**Conceptual Changes**:
- Work item STATUS becomes CALCULATED from task progress
- Phase remains INTERNAL (for tab visibility logic only)
- Timelines move from per-work-item to workspace level
- Effort uses T-shirt vocabulary with Fibonacci points (1/2/5/8/13)

---

## [0.8.0] - 2025-11-30 (Resources Module)

### Added - Database

#### Resources Module Tables (Migration: `20251130000001_create_resources_module.sql`)
- **`resources`** - Core resource storage with PostgreSQL full-text search
  - 5 resource types: reference, inspiration, documentation, media, tool
  - TSVECTOR with weighted fields (title=A, description=B, notes=C)
  - GIN index for fast search
  - Soft-delete with 30-day retention (is_deleted, deleted_at, deleted_by)
  - Source domain extraction for URL grouping
- **`work_item_resources`** - Many-to-many junction table
  - Composite PRIMARY KEY (work_item_id, resource_id)
  - Tab-based organization (inspiration vs resource tabs)
  - Soft unlink capability with re-link support
  - Display order for drag-and-drop
- **`resource_audit_log`** - Immutable audit trail
  - 6 action types: created, updated, deleted, restored, linked, unlinked
  - JSONB changes field for field-level tracking
  - Actor tracking with email for historical accuracy

#### Database Functions
- `search_resources()` - Full-text search with ranking
- `get_resource_history()` - Get complete audit trail
- `purge_deleted_resources(days)` - Remove soft-deleted after N days
- `purge_soft_deleted(table_name, days)` - Generic purge (reusable)
- `purge_unlinked_work_item_resources(days)` - Junction cleanup
- `manual_purge_all_deleted(days)` - Manual trigger with results

#### Scheduled Jobs (Migration: `20251130000002_schedule_resource_purge_job.sql`)
- `purge-deleted-resources-daily` - pg_cron job at 3:00 AM UTC
- `purge-unlinked-resources-daily` - Junction table cleanup
- `cron_job_status` view for monitoring

### Added - API Routes

#### Resources CRUD (`/api/resources`)
- **GET** `/api/resources` - List with filtering (type, workspace, deleted)
- **POST** `/api/resources` - Create with optional auto-link to work item
- **GET** `/api/resources/:id` - Get with linked work items
- **PATCH** `/api/resources/:id` - Update fields or restore from trash
- **DELETE** `/api/resources/:id` - Soft delete or permanent delete

#### Search & History
- **GET** `/api/resources/search` - Full-text search with ranking
- **GET** `/api/resources/:id/history` - Complete audit trail

#### Work Item Linking (`/api/work-items/:id/resources`)
- **GET** - Get resources organized by tab (inspiration/resources)
- **POST** - Link existing or create-and-link new
- **DELETE** - Unlink resource (soft unlink with re-link capability)

### Added - TypeScript Types

#### File: `lib/types/resources.ts`
- `ResourceType`, `TabType`, `AuditAction` unions
- `Resource`, `WorkItemResource`, `ResourceAuditEntry` interfaces
- `ResourceWithMeta` - Extended with link counts
- Request/response types for all API endpoints
- Utility functions: `calculateDaysRemaining()`, `extractDomain()`, `getResourceTypeLabel()`

### Added - UI Components

#### Reusable Soft-Delete Components (`components/shared/soft-delete.tsx`)
- `DaysRemaining` - Countdown to permanent deletion with color coding
- `RestoreButton` - Restore from trash with loading state
- `DeleteForeverButton` - Permanent delete with confirmation dialog
- `TrashBadge` - Visual indicator for deleted items
- `EmptyTrash` - Empty state component
- `TrashInfoBanner` - Info banner with item count

#### Resource Components (`components/resources/`)
- `ResourceCard` - Full card with thumbnail, actions, link count
- `ResourceItem` - Compact list item for search results
- `AddResourceDialog` - Tabbed dialog (New/Link Existing)
  - New: URL, title, type, description, notes fields
  - Existing: Search with debounce, selection, context note

### Added - Edge Functions

#### `purge-deleted-resources` (`supabase/functions/purge-deleted-resources/`)
- Manual trigger for purge operations
- Requires service_role key (admin-only)
- Supports dry_run mode for preview
- Returns detailed results (resources_purged, links_purged, duration)

### Technical Details

#### Architecture Decisions
- **Separate Tables > JSONB**: Chose Option B for proper schema, RLS, and global search
- **Soft Delete Pattern**: 30-day recycle bin with automatic purge via pg_cron
- **Many-to-Many Sharing**: Resources can be linked to multiple work items
- **Tab Organization**: Inspiration (research phase) vs Resources (general)
- **Audit Trail**: Immutable log for compliance and undo capability

#### Key Files
| File | Purpose |
|------|---------|
| `supabase/migrations/20251130000001_create_resources_module.sql` | Tables, indexes, RLS, functions |
| `supabase/migrations/20251130000002_schedule_resource_purge_job.sql` | pg_cron jobs |
| `supabase/functions/purge-deleted-resources/index.ts` | Edge Function |
| `lib/types/resources.ts` | TypeScript types |
| `app/api/resources/route.ts` | CRUD endpoints |
| `app/api/resources/search/route.ts` | Full-text search |
| `app/api/resources/[id]/route.ts` | Single resource ops |
| `app/api/resources/[id]/history/route.ts` | Audit trail |
| `app/api/work-items/[id]/resources/route.ts` | Link/unlink |
| `components/shared/soft-delete.tsx` | Reusable trash components |
| `components/resources/resource-card.tsx` | Card + Item |
| `components/resources/add-resource-dialog.tsx` | Add dialog |

---

## [0.7.0] - 2025-11-30 (AI SDK Migration)

### Added - AI Infrastructure

#### Vercel AI SDK Adoption
- **Package Installation**: `ai`, `@openrouter/ai-sdk-provider`, `@ai-sdk/react`
- **AI SDK Client**: `lib/ai/ai-sdk-client.ts` - OpenRouter provider with pre-configured models
- **Parallel AI Tools**: `lib/ai/tools/parallel-ai-tools.ts` - Tool definitions for web search, extract, research
- **Chat API Route**: `/api/ai/sdk-chat/route.ts` - New streaming endpoint using `streamText()`
- **ChatPanel Component**: `components/ai/chat-panel.tsx` - React component with `useChat()` hook

#### Zod Schemas for Type-Safe AI Outputs
- **schemas.ts**: `lib/ai/schemas.ts` - Comprehensive Zod schemas
  - `SuggestedWorkItemSchema` - Note analysis → work item conversion
  - `DependencySuggestionsSchema` - Dependency suggestion arrays
  - `MindMapExpansionSchema` - AI-assisted mind map expansion
  - `FeaturePrioritizationSchema` - Feature priority scoring
  - `ChatIntentSchema` - User intent classification

### Changed - Endpoint Migrations

#### analyze-note Endpoint (`/api/ai/analyze-note`)
- **Before**: Manual `fetch()` to OpenRouter, regex JSON parsing
- **After**: `generateObject()` with `SuggestedWorkItemSchema`
- **Benefits**: Type-safe responses, automatic validation, no manual parsing

#### dependencies/suggest Endpoint (`/api/ai/dependencies/suggest`)
- **Before**: `callOpenRouter()`, manual JSON regex extraction
- **After**: `generateObject()` with `DependencySuggestionsSchema`
- **Benefits**: Compile-time types, AI SDK retries on validation failure

#### openrouter.ts Updates
- Added `suggestDependenciesWithSDK()` - New AI SDK version
- Deprecated `suggestDependencies()` - Old manual parsing version

### Technical Details

#### AI Architecture
```
User → ChatPanel (useChat) → /api/ai/sdk-chat → OpenRouter (LLM)
                                    ↓ (tool calls)
                             Parallel AI (Tool Layer)
```

| Component | Role |
|-----------|------|
| OpenRouter | LLM provider (300+ models, :nitro routing) |
| Parallel AI | Tool layer (search, extract, research APIs) |
| AI SDK | Unified interface (streaming, tools, structured output) |

#### Key Files Modified
| File | Change |
|------|--------|
| `lib/ai/ai-sdk-client.ts` | NEW - OpenRouter provider config |
| `lib/ai/schemas.ts` | NEW - Zod schemas for AI outputs |
| `lib/ai/tools/parallel-ai-tools.ts` | NEW - Tool definitions |
| `app/api/ai/sdk-chat/route.ts` | NEW - AI SDK chat endpoint |
| `components/ai/chat-panel.tsx` | NEW - useChat() component |
| `app/api/ai/analyze-note/route.ts` | MIGRATED - generateObject() |
| `app/api/ai/dependencies/suggest/route.ts` | MIGRATED - generateObject() |
| `lib/ai/openrouter.ts` | UPDATED - Added SDK version |

### Migration Pattern
```typescript
// Before (fragile)
const content = response.choices[0].message.content
const jsonMatch = content.match(/\[[\s\S]*\]/)
const data = JSON.parse(jsonMatch[0]) // Can fail!

// After (type-safe)
const result = await generateObject({
  model: aiModel,
  schema: MySchema, // Zod schema
  system: '...',
  prompt: '...',
})
// result.object is fully typed!
```

---

## [0.6.0] - 2025-11-29 (Week 6 Documentation)

### Added - Documentation

#### Work Board 3.0 (Parts 7-10)
- **Part 7: Work Item Detail Page** - 8-Tab structure design
  - Summary, Inspiration, Resources, Scope, Tasks, Feedback, Metrics, AI Copilot tabs
  - Phase-based progressive disclosure using `calculateWorkItemPhase()`
  - Tracking sidebar with effort tracking (Story Points, Hours)
- **Part 8: Feedback Module** - Multi-channel feedback collection
  - In-app widget, public links, email collection, embeddable iframe
  - AI-powered analysis (sentiment, categorization, theme extraction)
  - Stakeholder portal with voting/ranking
- **Part 9: Integrations Module** - External service connections
  - Build vs Integrate decision matrix
  - Twilio (SMS/WhatsApp), SurveyMonkey, Typeform integrations
  - Database: `team_integrations` table schema
- **Part 10: AI Visual Prototype Feature** - Generate React UI from prompts
  - Text-to-UI generation with shadcn/ui components
  - Sandboxed iframe preview
  - Feedback collection via public links and voting
  - Database: `ui_prototypes` and `prototype_votes` tables

#### Week Documentation Updates
- **week-6-timeline-execution.md** - Added Work Item Detail Page (8-Tab Structure) reference
  - Cross-links to work-board-3.0.md Part 7
  - Updated Project Execution Module with Tasks as Universal Module concept
- **week-7-ai-analytics.md** - Added Feedback, Integrations, AI Visual Prototypes
  - New task sections: Day 15-17 (Feedback), Day 18-19 (Integrations), Day 20-21 (AI Prototypes)
  - Module Features sections with database schemas
  - Testing checklists for all new features

#### README Navigation Updates
- Updated implementation progress (60-65% complete, Week 6 in progress)
- Enhanced navigation descriptions for Week 6 and Week 7
- Updated Work Board 3.0 description to include Parts 7-10
- Added cross-links to work-board-3.0.md for each new feature

### Changed
- README.md version bumped to 1.2
- Week-6 status changed from "Not Started" to "In Planning"
- Week-7 status changed from "Not Started" to "In Planning"

### Technical Decisions Documented
- **Tasks as Universal Module**: Tasks can link to Work Items, Timeline Items, or Module content
- **Phase-Based Tab Visibility**: Tabs show/hide based on work item phase
- **Build vs Integrate Matrix**: Core features built in-house, complex infrastructure integrated

---

## [0.3.0] - 2025-01-13 (Week 4 Start)

### Added - Database
- Migration `20250113000009_create_mind_maps_tables.sql`
  - Created `mind_maps` table with canvas_data JSONB
  - Created `mind_map_nodes` table with 5 node types (idea, feature, epic, module, user_story)
  - Created `mind_map_edges` table with relationship types
  - Added indexes for performance optimization
  - **Purpose**: Enable visual ideation with ReactFlow canvas

### Added - API
- Mind maps API routes (`/api/mind-maps`)
  - GET - List all mind maps for workspace
  - POST - Create new mind map
  - GET `/api/mind-maps/[id]` - Get mind map details
  - PATCH `/api/mind-maps/[id]` - Update mind map
  - DELETE `/api/mind-maps/[id]` - Delete mind map

### Added - Frontend
- Mind maps list page (`(dashboard)/mind-maps/page.tsx`)
- Create mind map dialog
- React Query hooks for mind map CRUD operations

### Known Issues
- ReactFlow canvas implementation status unknown (needs verification)
- AI integration for node suggestions not implemented
- Template system not built

---

## [0.2.5] - 2025-01-13

### Added - Database
- Migration `20250113000008_add_conversion_tracking.sql`
  - Created `workflow_stages` table
  - Created `conversion_tracking` table
  - **Purpose**: Track conversion from mind map nodes to features
  - **Rationale**: Need visibility into ideation → execution pipeline

---

## [0.2.4] - 2025-01-13

### Added - Database
- Migration `20250113000007_rename_features_to_work_items.sql`
  - Renamed columns for consistency
  - **Note**: Despite migration name, actual table name remained `features`
  - Updated related foreign key references

---

## [0.2.3] - 2025-01-13

### Added - Database
- Migration `20250113000006_improve_timeline_dependencies.sql`
  - Enhanced `linked_items` table structure
  - Added bidirectional relationship support
  - Improved dependency tracking for critical path analysis

---

## [0.2.2] - 2025-01-12 (Future date - likely typo)

### Added - Database
- Migration `20251112115417_create_tags_table.sql` (**Date typo: should be 20250112**)
  - Created `tags` table for feature categorization
  - Added many-to-many relationship infrastructure
  - **Purpose**: Enable flexible feature organization

### Action Required
- [ ] Rename migration file to correct date: `20250112115417_create_tags_table.sql`

---

## [0.2.1] - 2025-01-11

### Added - Database
- Migration `20250111000005_add_feature_analytics.sql`
  - Created `feature_correlations` table
  - Created `feature_importance_scores` table
  - **Purpose**: AI-powered feature prioritization and relationship detection
  - **Rationale**: Support ML-based recommendations for feature planning

---

## [0.2.0] - 2025-01-11 (Week 4 Start)

### Added - Database
- Migration `20250111000004_create_feature_connections.sql`
  - Created `feature_connections` table for dependency graph
  - Supports 4 link types: dependency, blocks, complements, relates
  - Added indexes for graph traversal performance
  - **Purpose**: Enable visual dependency mapping with ReactFlow

### Added - API
- Dependencies API routes (`/api/dependencies`)
  - GET - Get all dependencies for workspace
  - POST - Create new dependency link
  - DELETE - Remove dependency link
  - GET `/api/dependencies/analyze` - Critical path analysis

### Known Issues
- Frontend dependency graph not implemented
- Critical path algorithm not verified

---

## [0.1.5] - 2025-01-03

### Changed - Database
- Migration `20250101000003_change_ids_to_text.sql`
  - **Critical Change**: Converted all UUID IDs to TEXT (timestamp-based)
  - Reason: Project standard is `Date.now().toString()`, not UUIDs
  - **Impact**: Breaking change for existing data
  - **Lesson**: Should have used TEXT IDs from the start (documented in CLAUDE.md)

---

## [0.1.0] - 2025-01-01 (Week 1 Start)

### Added - Initial Release

#### Database Schema
- Migration `20250101000001_initial_schema.sql`
  - Created `users` table (Supabase Auth integration)
  - Created `teams` table (multi-tenant organizations)
  - Created `team_members` table (roles: owner, admin, member)
  - Created `subscriptions` table (Stripe billing)
  - Created `workspaces` table (projects with phases)
  - Created `features` table (roadmap items)
  - Created `timeline_items` table (MVP/SHORT/LONG breakdown)
  - Created `linked_items` table (feature relationships)

#### RLS Policies
- Migration `20250101000002_add_rls_policies.sql`
  - Enabled Row-Level Security on all tables
  - Team-scoped SELECT policies
  - Team-scoped INSERT/UPDATE policies
  - Owner/admin-only DELETE policies
  - **Status**: ⚠️ Not verified in production

#### Project Setup
- Initialized Next.js 15 with TypeScript
- Configured App Router with route groups: `(auth)` and `(dashboard)`
- Installed core dependencies:
  - `@supabase/ssr` for SSR-compatible Supabase client
  - `@tanstack/react-query` for server state management
  - `tailwindcss` + `@radix-ui/*` for UI (shadcn/ui)
  - `lucide-react` for icons
  - `stripe`, `@stripe/stripe-js` for payments (not yet implemented)
  - `resend` for emails (not yet implemented)

#### Authentication
- Created login page (`(auth)/login/page.tsx`)
- Created signup page (`(auth)/signup/page.tsx`)
- Created onboarding flow (`(auth)/onboarding/page.tsx`)
- Created accept invite page (`(auth)/accept-invite/page.tsx`)
- Set up auth middleware for route protection

#### UI Foundation
- Installed shadcn/ui components:
  - button, card, dialog, dropdown-menu, form
  - input, label, select, table, tabs, toast
- Configured Tailwind with design tokens
- Created base layout components

---

## Migration History Summary

| # | Date | Migration | Purpose |
|---|------|-----------|---------|
| 1 | 2025-01-01 | `20250101000000_initial_schema.sql` | Initial multi-tenant schema with users, teams, workspaces |
| 2 | 2025-01-01 | `20250101000001_disable_rls_for_anon.sql` | Disable RLS temporarily for development |
| 3 | 2025-01-01 | `20250101000002_fix_anonymous_access.sql` | Fix anonymous access policies |
| 4 | 2025-01-01 | `20250101000003_change_ids_to_text.sql` | Convert UUID IDs to TEXT (timestamp-based) |
| 5 | 2025-01-01 | `20250101000004_remove_type_constraints.sql` | Remove strict type constraints for flexibility |
| 6 | 2025-01-01 | `20250101000005_auto_generate_linked_item_ids.sql` | Auto-generate IDs for linked_items table |
| 7 | 2025-01-01 | `20250101000006_remove_user_isolation.sql` | Remove user-level isolation for team-based access |
| 8 | 2025-01-01 | `20250101000007_add_workspaces.sql` | Add workspaces table for project management |
| 9 | 2025-01-01 | `20250101000008_migrate_existing_data.sql` | Migrate existing data to new schema |
| 10 | 2025-01-11 | `20250111000001_add_execution_steps_table.sql` | Add execution_steps for task breakdown |
| 11 | 2025-01-11 | `20250111000002_add_feature_resources_table.sql` | Add feature_resources for attachments |
| 12 | 2025-01-11 | `20250111000003_add_feature_planning_tables.sql` | Add feature planning support tables |
| 13 | 2025-01-11 | `20250111000004_add_inspiration_items_table.sql` | Add inspiration_items for research |
| 14 | 2025-01-11 | `20250111000005_add_features_tracking_columns.sql` | Add tracking columns to features |
| 15 | 2025-01-12 | `20250112000001_add_workflow_stages.sql` | Add workflow_stages for status tracking |
| 16 | 2025-01-12 | `20251112115417_create_tags_table.sql` | Create tags table for categorization |
| 17 | 2025-01-13 | `20250113000001_add_feature_connections_table.sql` | Add feature_connections for dependency graph |
| 18 | 2025-01-13 | `20250113000002_add_feature_importance_scores_table.sql` | Add importance scores for AI prioritization |
| 19 | 2025-01-13 | `20250113000003_add_feature_correlations_table.sql` | Add correlations for AI relationship detection |
| 20 | 2025-01-13 | `20250113000004_add_connection_insights_table.sql` | Add connection_insights for AI analysis |
| 21 | 2025-01-13 | `20250113000006_improve_timeline_dependencies.sql` | Enhance timeline dependencies tracking |
| 22 | 2025-01-13 | `20250113000007_rename_features_to_work_items.sql` | Rename feature columns for consistency |
| 23 | 2025-01-13 | `20250113000008_add_conversion_tracking.sql` | Add conversion_tracking for workflow analytics |
| 24 | 2025-01-13 | `20250113000009_create_mind_maps_tables.sql` | Create mind_maps, mind_map_nodes, mind_map_edges |
| 25 | 2025-01-15 | `20250115000001_re_enable_rls_security.sql` | Re-enable RLS after development |
| 26 | 2025-01-15 | `20250115000002_upgrade_harsha_to_pro.sql` | Upgrade user subscription to Pro |
| 27 | 2025-01-15 | `20250115143000_enable_rls_critical_tables.sql` | Enable RLS on critical tables |
| 28 | 2025-01-15 | `20250115143100_enable_rls_public_tables.sql` | Enable RLS on public-facing tables |
| 29 | 2025-01-15 | `20250115143200_add_subscriptions_rls_policies.sql` | Add RLS policies for subscriptions |
| 30 | 2025-01-15 | `20250115143300_fix_function_search_path.sql` | Fix function search path security |
| 31 | 2025-11-15 | `20251115133000_add_timeline_dates.sql` | Add start/end dates to timeline items |
| 32 | 2025-01-17 | `20250117000001_create_phase_assignments.sql` | Create phase_assignments for team permissions |
| 33 | 2025-01-17 | `20250117000002_add_phase_assignments_to_invitations.sql` | Add phase assignments to invitation flow |
| 34 | 2025-01-17 | `20250117000003_fix_user_id_data_types.sql` | Fix user ID data type consistency |
| 35 | 2025-01-17 | `20250117000004_add_phase_lead_role.sql` | Add phase_lead role for team hierarchy |
| 36 | 2025-01-17 | `20250117000005_create_public_users_table.sql` | Create public users view for profiles |
| 37 | 2025-11-17 | `20251117175229_comprehensive_phase_system.sql` | Comprehensive phase permission system |
| 38 | 2025-01-19 | `20250119000001_add_teams_team_members_rls.sql` | Add RLS policies for teams and team_members |
| 39 | 2025-01-20 | `20250120000001_add_unified_canvas_support.sql` | Add unified canvas support for dual canvases |
| 40 | 2025-01-21 | `20250121000001_extend_mind_maps_for_two_canvas_system.sql` | Extend mind_maps for dual canvas (Ideas + Roadmap) |
| 41 | 2025-01-24 | `20250124000001_consolidate_work_item_types.sql` | Consolidate work item types |
| 42 | 2025-01-24 | `20250124000002_create_feedback_module.sql` | Create feedback module tables |
| 43 | 2025-01-24 | `20250124000003_add_work_items_hierarchy.sql` | Add work_items hierarchy support |
| 44 | 2025-01-24 | `20250124000004_extend_timeline_items_execution.sql` | Extend timeline_items for execution tracking |
| 45 | 2025-11-25 | `20251125000001_create_product_tasks_table.sql` | Create product_tasks table |
| 46 | 2025-11-30 | `20251130000001_create_resources_module.sql` | Create resources module (tables, functions, indexes, RLS) |
| 47 | 2025-11-30 | `20251130000002_schedule_resource_purge_job.sql` | Schedule pg_cron purge jobs for soft-deleted resources |
| 48 | 2025-11-30 | `20251130110700_add_work_items_workspace_fk.sql` | Add foreign key to work_items table |
| 49 | 2025-12-01 | `20251201000001_optimize_rls_auth_initplan.sql` | Optimize 119 RLS policies (auth.uid() → scalar subquery) |
| 50 | 2025-12-01 | `20251201000002_consolidate_duplicate_rls_policies.sql` | Consolidate 50+ duplicate permissive RLS policies |
| 51 | 2025-12-01 | `20251201000003_drop_duplicate_indexes.sql` | Drop 5 duplicate indexes |
| 52 | 2025-12-01 | `20251201120000_create_customer_insights.sql` | Create customer insights & voting system |
| 53 | 2025-12-01 | `20251201130000_create_product_strategies.sql` | Create product strategies (OKRs/Pillars) |
| 54 | 2025-12-02 | `20251202120000_add_public_feedback_settings.sql` | Add public feedback & widget settings |
| 55 | 2025-12-02 | `20251202125328_create_workspace_templates.sql` | Create workspace templates (8 system templates) |
| 56 | 2025-12-02 | `20251202150000_fix_remaining_function_search_paths.sql` | Fix 30+ function search_path vulnerabilities |
| 57 | 2025-12-02 | `20251202160000_fix_departments_insight_votes_rls.sql` | Fix departments RLS + consolidate insight_votes policies |
| 58 | 2025-12-02 | `20251202170000_fix_security_definer_view.sql` | Drop cron_job_status view (security definer issue) |
| 59 | 2025-12-02 | `20251202180000_fix_workspace_templates_rls_and_add_fk_indexes.sql` | Fix workspace_templates RLS + add 30 FK indexes |
| 60 | 2025-12-02 | `20251202190000_consolidate_workspace_templates_select_policies.sql` | Consolidate workspace_templates SELECT policies |
| 61 | 2025-12-02 | `20251202200000_fix_workspace_templates_trigger_search_path.sql` | Fix workspace_templates trigger search_path |
| 62 | 2025-12-02 | `20251202162950_add_strategy_reorder_function.sql` | Add reorder_strategy() function for drag-drop |

**Total Migrations**: 62
**Total Tables**: 26+

---

## Database Schema Evolution

### Core Tables (Week 1-2)
1. `users` - User accounts (Supabase Auth)
2. `teams` - Organizations/teams
3. `team_members` - Team membership with roles
4. `subscriptions` - Stripe billing data
5. `workspaces` - Projects with phases

### Feature Tables (Week 2-4)
6. `features` - Top-level roadmap items
7. `timeline_items` - MVP/SHORT/LONG breakdowns
8. `linked_items` - Basic feature relationships
9. `feature_connections` - Dependency graph (added Week 4)
10. `feature_correlations` - AI-detected correlations (added Week 4)
11. `feature_importance_scores` - Priority scores (added Week 4)
12. `tags` - Feature categorization (added Week 4)

### Mind Mapping Tables (Week 3)
13. `mind_maps` - Canvas data (ReactFlow JSON)
14. `mind_map_nodes` - Individual nodes (5 types)
15. `mind_map_edges` - Connections between nodes

### Workflow Tracking (Week 4)
16. `workflow_stages` - Stage definitions
17. `conversion_tracking` - Mind map → Feature tracking

### Review & Feedback (Week 5 - Planned)
18. `review_links` - Public/invite/iframe links (not yet created)
19. `feedback` - Reviewer submissions (not yet created)

### Analytics (Week 7 - Planned)
20. `custom_dashboards` - User-created dashboards (not yet created)
21. `success_metrics` - Expected vs actual tracking (not yet created)
22. `ai_usage` - Message count per user/month (not yet created)

---

## Feature Implementation Timeline

### ✅ Implemented
- **Week 1-2 (50%)**: Next.js setup, auth, database schema
- **Week 3 (30%)**: Mind mapping list view, API routes
- **Week 4 (15%)**: Dependency database schema, API routes

### ⏳ In Progress
- **Week 3**: Mind mapping canvas (ReactFlow)
- **Week 4**: Feature dashboard, dependency visualization

### ❌ Not Started
- **Week 5**: Review system, email invitations
- **Week 6**: Timeline visualization, real-time collaboration
- **Week 7**: AI integration (OpenRouter, Perplexity, Exa)
- **Week 8**: Stripe billing, Playwright tests, Jest tests

---

## Undocumented Decisions

### Why were these tables added?

#### 1. `feature_correlations` & `feature_importance_scores`
**Added**: 2025-01-11 (Week 4)
**Reason**: Support AI-powered feature prioritization
**Rationale**:
- Correlations table detects relationships between features (e.g., "Payment Gateway" often paired with "Order Management")
- Importance scores use ML to prioritize features based on user feedback, dependencies, and business value
- Enables "Smart Suggestions" in AI assistant (Week 7)

#### 2. `tags` table
**Added**: 2025-01-12 (Week 4)
**Reason**: Flexible feature categorization
**Rationale**:
- Replace hard-coded categories with user-defined tags
- Supports multi-tag features (e.g., "backend" + "security" + "MVP")
- Enables filtering and search by tags

#### 3. `workflow_stages` & `conversion_tracking`
**Added**: 2025-01-13 (Week 4)
**Reason**: Track conversion pipeline from ideation to execution
**Rationale**:
- Visibility into how many mind map nodes convert to features
- Measure stage conversion rates (e.g., "60% of ideas become features")
- Analytics for Week 7 (conversion funnels)

---

## Breaking Changes

### ⚠️ v0.1.5 (2025-01-03) - UUID to TEXT ID Migration
**Impact**: All existing data with UUID IDs became incompatible
**Solution**: Data migration required (or fresh start)
**Lesson**: Should have used TEXT IDs from the beginning (documented in CLAUDE.md)

---

## Security Fixes

### 🔒 Pending
- [ ] **RLS Policies Not Verified** - Critical for multi-tenant security
- [ ] **JWT Validation** - Auth middleware not fully tested
- [ ] **OWASP Top 10 Review** - Scheduled for Week 8

---

## Performance Improvements

### Indexes Added
- Week 1: Core table indexes (team_id, workspace_id)
- Week 3: Mind map indexes (mind_map_id, converted_to_feature_id)
- Week 4: Dependency graph indexes (source_id, target_id)

---

## Known Issues & Tech Debt

### 🐛 Current Issues
1. **Mind Map Canvas** - Implementation status unknown, needs verification
2. **RLS Policies** - Not verified in production, security risk
3. **Migration Naming** - One migration has future date (20251112 instead of 20250112)
4. **No Tests** - Zero automated tests (E2E or unit)
5. **AI Integration** - OpenRouter client not implemented

### 📋 Tech Debt
1. **Large IMPLEMENTATION_PLAN.md** - 2,419 lines, needs splitting into folder
2. **Undocumented Decisions** - Some tables added without documentation updates
3. **Schema Drift** - IMPLEMENTATION_PLAN.md doesn't match actual migrations

---

## Deprecated Features

None yet (project is in initial development phase)

---

## Contributors

- Initial implementation: Harsh (with Claude Code assistance)

---

## References

- [docs/implementation/README.md](../implementation/README.md) - Implementation plan overview
- [docs/planning/PROGRESS.md](../planning/PROGRESS.md) - Current implementation status
- [CLAUDE.md](../../CLAUDE.md) - Project guidelines and coding standards
- [supabase/migrations/](../../supabase/migrations/) - All migration files

---

**Changelog Format**: [Keep a Changelog](https://keepachangelog.com/)
**Versioning**: [Semantic Versioning](https://semver.org/)

**Legend**:
- **Added**: New features or tables
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal
- **Removed**: Deleted features
- **Fixed**: Bug fixes
- **Security**: Security improvements
