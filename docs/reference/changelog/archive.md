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
- **Detailed Spec**: [WORKSPACE_TIMELINE_ARCHITECTURE.md](../../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md)
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

1. `features` - Top-level roadmap items
2. `timeline_items` - MVP/SHORT/LONG breakdowns
3. `linked_items` - Basic feature relationships
4. `feature_connections` - Dependency graph (added Week 4)
5. `feature_correlations` - AI-detected correlations (added Week 4)
6. `feature_importance_scores` - Priority scores (added Week 4)
7. `tags` - Feature categorization (added Week 4)

### Mind Mapping Tables (Week 3)

1. `mind_maps` - Canvas data (ReactFlow JSON)
2. `mind_map_nodes` - Individual nodes (5 types)
3. `mind_map_edges` - Connections between nodes

### Workflow Tracking (Week 4)

1. `workflow_stages` - Stage definitions
2. `conversion_tracking` - Mind map → Feature tracking

### Review & Feedback (Week 5 - Planned)

1. `review_links` - Public/invite/iframe links (not yet created)
2. `feedback` - Reviewer submissions (not yet created)

### Analytics (Week 7 - Planned)

1. `custom_dashboards` - User-created dashboards (not yet created)
2. `success_metrics` - Expected vs actual tracking (not yet created)
3. `ai_usage` - Message count per user/month (not yet created)

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

- [docs/implementation/README.md](../../implementation/README.md) - Implementation plan overview
- [docs/planning/PROGRESS.md](../../planning/PROGRESS.md) - Current implementation status
- [CLAUDE.md](../../../CLAUDE.md) - Project guidelines and coding standards
- [supabase/migrations/](../../../supabase/migrations/) - All migration files

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
