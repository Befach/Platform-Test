# 📜 CHANGELOG

**Last Updated**: 2025-11-26
**Project**: Product Lifecycle Management Platform
**Format**: Based on [Keep a Changelog](https://keepachangelog.com/)

All notable changes, migrations, and feature implementations are documented in this file.

---

## [Unreleased]

### Added
- PROGRESS.md - Weekly implementation tracker with completion percentages
- CHANGELOG.md - This file, tracking all changes and migrations
- Updated README.md to reflect Next.js 15 platform (not legacy HTML app)
- Fixed MCP_OPTIMIZATION_SUMMARY.md (corrected from 2 to 3 active MCPs)

### Changed
- Documentation structure improvements in progress

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

**Total Migrations**: 45
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
