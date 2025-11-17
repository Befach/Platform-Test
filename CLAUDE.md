# 📚 Project Guidelines & Quick Reference

**Last Updated**: 2025-01-15
**Project**: Product Lifecycle Management Platform
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Vercel
**Current Status**: Week 3-4 (25% complete, behind schedule)

---

## 🎯 QUICK START

### Essential Documentation (Read These First!)

#### Planning & Architecture
1. **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Main entry point (redirects to organized structure)
2. **[docs/implementation/](docs/implementation/README.md)** - Week-by-week implementation guide
3. **[docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)** - System architecture with Mermaid diagrams
4. **[docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md)** - Complete API documentation (20+ routes)

#### Progress Tracking
5. **[docs/planning/PROGRESS.md](docs/planning/PROGRESS.md)** - Weekly tracker with completion percentages
6. **[docs/reference/CHANGELOG.md](docs/reference/CHANGELOG.md)** - Migration history, feature tracking
7. **[docs/planning/NEXT_STEPS.md](docs/planning/NEXT_STEPS.md)** - Immediate actions, priorities, blockers
8. **[docs/planning/REVISED_TIMELINE.md](docs/planning/REVISED_TIMELINE.md)** - Realistic 12-week timeline

#### Postponed Features
9. **[docs/postponed/](docs/postponed/README.md)** - Postponed features index
10. **[docs/postponed/MIND_MAP_ENHANCEMENTS.md](docs/postponed/MIND_MAP_ENHANCEMENTS.md)** - 23 mind map enhancements
11. **[docs/processes/POSTPONED_FEATURES_PROCESS.md](docs/processes/POSTPONED_FEATURES_PROCESS.md)** - Postponed features tracking process

#### Configuration & Standards
12. **[MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md)** - MCP configuration and context optimization
13. **[.cursorrules](.cursorrules)** - Cursor AI behavior, coding standards, MCP usage
14. **[docs/processes/DOCUMENTATION_AUDIT_CHECKLIST.md](docs/processes/DOCUMENTATION_AUDIT_CHECKLIST.md)** - Documentation sync process
15. **[docs/planning/RECOMMENDED_AGENTS.md](docs/planning/RECOMMENDED_AGENTS.md)** - Claude agents by phase

#### Processes & Reference
16. **[docs/processes/IMPLEMENTATION_TIMING_CHECKLIST.md](docs/processes/IMPLEMENTATION_TIMING_CHECKLIST.md)** - 5-question framework for timing decisions
17. **[docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)** - TypeScript, Next.js, Supabase patterns
18. **[docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md)** - MCP usage examples and best practices

### Tech Stack Summary

```
Framework:    Next.js 15 + TypeScript (App Router, Server Components)
Database:     Supabase (PostgreSQL + Real-time + Auth + RLS)
UI:           shadcn/ui + Tailwind CSS + Lucide React
Mind Mapping: ReactFlow (custom nodes, AI-powered)
Charts:       Recharts (10+ chart types)
Testing:      Playwright (E2E) + Jest (Unit)
Payments:     Stripe (Checkout + Webhooks)
Email:        Resend (Invitations, notifications)
AI:           OpenRouter (Claude Haiku, Perplexity, Grok)
Deployment:   Vercel (Serverless functions)
```

### MCP Servers (5 Active, 6 from Week 4)

- ✅ **Supabase MCP** - Documentation search, schema introspection, migrations, RLS, real-time
- ✅ **Playwright MCP** - E2E testing, browser automation, screenshots
- ✅ **Vercel MCP** - Deployment management, environment variables, build monitoring
- ✅ **Parallel Search MCP** - Multi-source web search (Tavily, Perplexity, Exa, Brave) for AI research
- ✅ **Parallel Task MCP** - Task orchestration, automation, multi-agent workflows
- ⏳ **shadcn/ui MCP** - *(Install Week 4+)* Component installation, multi-registry access, AI-assisted UI development

**Note**: Parallel.ai MCPs provide advanced search and task automation capabilities.
**API Key Required**: Configure at https://platform.parallel.ai

**shadcn/ui MCP Note**: Install at the start of Week 4 when UI-heavy development begins (Feature Planning, Review, Analytics modules). Adds ~2-3k tokens but provides significant value for component-heavy modules. See Week 4 Pre-Setup below.

### Development Server Policy

**IMPORTANT**: Always run the Next.js dev server on **localhost:3000** only.

```bash
# Before starting dev server, kill any existing Node processes:
taskkill /F /IM node.exe 2>nul

# Then start the server (it will use port 3000):
cd next-app && npm run dev
```

**Rules:**
- ✅ Only ONE dev server instance on port 3000
- ❌ NEVER run on other ports (3001, 3002, etc.)
- ❌ If port 3000 is occupied, kill the process first
- ✅ Always check for and terminate duplicate instances

---

## 📋 PROJECT OVERVIEW

### Mission
Transform roadmap manager into comprehensive **Product Lifecycle Management Platform**:

1. **Research & Ideate** - AI-powered mind mapping, web search, knowledge base
2. **Plan & Structure** - Features, timeline, dependencies
3. **Review & Gather Feedback** - Stakeholder input (invite-based, public links, iframe)
4. **Execute Collaboratively** - Team assignment, task tracking, real-time collaboration
5. **Test & Iterate** - User feedback collection and analysis
6. **Measure Success** - Analytics, expected vs actual performance tracking

### Key Features (10 Modules)

| Module | Phase | Priority | Description |
|--------|-------|----------|-------------|
| **Mind Mapping** 🧠 | Week 3 | **CRITICAL** | ReactFlow canvas, 5 node types, AI-powered, convert to features |
| Research & Discovery 🔍 | Week 7 | High | AI chat, web search (Perplexity, Exa), knowledge base |
| Feature Planning 📋 | Week 4 | High | CRUD, timeline breakdown, rich text, custom fields |
| Dependency Management 🔗 | Week 4 | High | Visual graph, 4 link types, critical path analysis |
| Review & Feedback 👥 | Week 5 | Medium | Invite-based, public links, iframe embeds (Pro tier) |
| Project Execution 🚀 | Week 6 | Medium | Team assignment, status tracking, milestones |
| Collaboration 🤝 | Week 6 | Medium | Real-time editing, live cursors, activity feed (Pro tier) |
| Timeline Visualization 📅 | Week 6 | High | Gantt chart, swimlanes, drag-to-reschedule |
| Analytics & Metrics 📊 | Week 7 | Medium | 4 pre-built dashboards, custom builder (Pro tier) |
| AI Assistant 🤖 | Week 7 | High | Chat panel, agentic mode, tool calling (20+ tools) |

---

## 🏗️ ARCHITECTURE PRINCIPLES

### Multi-Tenant System
- **Team Isolation**: All tables have `team_id` for data separation
- **Row-Level Security**: RLS policies enforce access control
- **ID Format**: Timestamp-based TEXT IDs (`Date.now().toString()`) - NEVER use UUID
- **Workspace = Project**: Each workspace is a separate product/project

### Database Schema (Supabase)

#### Core Tables
```
users           - User accounts (Supabase Auth)
teams           - Organizations/teams
team_members    - Team membership and roles
subscriptions   - Stripe billing data
workspaces      - Projects with phase and modules
```

#### Feature Tables
```
features        - Top-level roadmap items
timeline_items  - MVP/SHORT/LONG breakdowns
linked_items    - Dependencies and relationships
```

#### Mind Mapping Tables
```
mind_maps       - Canvas data (ReactFlow JSON)
mind_map_nodes  - Individual nodes (5 types)
mind_map_edges  - Connections between nodes
```

#### Review & Feedback Tables
```
review_links    - Public/invite/iframe links
feedback        - Reviewer submissions
```

#### Analytics Tables
```
custom_dashboards - User-created dashboards
success_metrics   - Expected vs actual tracking
ai_usage          - Message count per user/month
```

### Data Sync Strategy
1. **Write**: Save to Supabase immediately (no localStorage)
2. **Read**: Load from Supabase, cache in React Query
3. **Real-time**: Subscribe to Supabase Realtime for live updates
4. **Conflict resolution**: Last write wins (timestamp-based)

---

## 💻 CODING STANDARDS

### Core Principles

✅ **DO**:
- Use strict TypeScript (interfaces, no `any`)
- Use `Date.now().toString()` for IDs (NEVER UUID)
- Always filter by `team_id` for multi-tenancy
- Handle errors explicitly
- Use shadcn/ui components + Tailwind CSS
- Enable RLS on all tables

❌ **DON'T**:
- Use `any` type
- Skip `team_id` filtering
- Use inline styles or custom CSS
- Use UUID for IDs
- Skip error handling

### Quick Examples

**TypeScript**: Strict interfaces, timestamp IDs, error handling
**Components**: shadcn/ui + Tailwind, TypeScript props
**Queries**: Team-scoped, typed responses, explicit errors

**Full Patterns**: See [Code Patterns Reference](docs/reference/CODE_PATTERNS.md) for:
- Complete TypeScript examples
- Next.js component patterns (Server & Client)
- Supabase query patterns
- Database migration examples
- Real-time subscription patterns
- Feature gates & billing
- AI integration patterns

---

## 🤖 CLAUDE AGENTS BY PHASE

### Week 1-2: Foundation
```
✅ frontend-developer   - Next.js setup, auth pages, layouts
✅ typescript-pro       - Type definitions, Supabase types
✅ database-architect   - Multi-tenant schema, RLS policies
✅ security-engineer    - Auth implementation, JWT validation, API protection
✅ devops-engineer      - CI/CD pipeline, Vercel configuration
```

### Week 3: Mind Mapping (CRITICAL)
```
✅ frontend-developer   - ReactFlow canvas, custom nodes
✅ typescript-pro       - Node types, canvas state
```

### Week 4: Feature Planning & Dependencies

**⚠️ IMPORTANT: Before starting Week 4, install shadcn/ui MCP**

Week 4 begins UI-heavy development (Feature Planning forms, dependency graphs, dialogs). The shadcn/ui MCP provides significant value for component-heavy modules.

**Pre-Week 4 Setup Checklist:**
- [ ] Install shadcn/ui MCP by adding to `cursor-mcp-config.json`
- [ ] Verify MCP connection (restart Claude Code if needed)
- [ ] Test with prompt: "List available shadcn components"

**Configuration:**
```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"]
    }
  }
}
```

**Why Now?**
- Feature Planning module requires extensive forms, tables, dialogs
- Dependency Management needs complex UI components
- AI-assisted component selection saves development time
- Multi-registry support (Aceternity UI, Magic UI) for advanced components

**Token Impact:** +2-3k tokens (~30% increase on MCP usage, acceptable given 22.3k freed)

**See Also:** [MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md) for context on MCP strategy

```
✅ frontend-developer   - Dashboard, dependency graph
✅ typescript-pro       - Feature types, dependency types
✅ database-optimizer   - Query optimization, indexing
✅ api-architect        - API route design, validation, error handling
✅ test-automator       - TDD setup, unit tests, API integration tests
```

### Week 5: External Review System
```
✅ frontend-developer   - Review pages, feedback forms
✅ backend-architect    - Email invitations, token generation
✅ security-engineer    - Token security, rate limiting, CSRF protection
```

### Week 6: Timeline & Execution
```
✅ frontend-developer   - Gantt chart, real-time cursors
✅ database-optimizer   - Real-time subscriptions, performance
```

### Week 7: AI Integration & Analytics
```
✅ ai-engineer          - OpenRouter, tool calling, streaming
✅ frontend-developer   - Dashboard builder, chart widgets
✅ typescript-pro       - AI types, analytics types
✅ api-architect        - Streaming API, AI tool routes
```

### Week 8: Billing, Testing & Launch
```
✅ payment-integration  - Stripe integration, webhooks
✅ test-automator       - Playwright E2E tests, Jest unit tests
✅ docs-architect       - User docs, developer docs, self-hosting
✅ typescript-pro       - Payment types, test types
✅ security-engineer    - Security audit, penetration testing, production checklist
✅ devops-engineer      - Production deployment, monitoring, optimization
```

**Full Details**: [docs/planning/RECOMMENDED_AGENTS.md](docs/planning/RECOMMENDED_AGENTS.md)

**Optimization Summary**: 15 agents (up from 12) - Added security, API architecture, and DevOps specialists for production-ready SaaS

---

## 🔄 TRACKING POSTPONED FEATURES

When features are planned but postponed, follow a structured process to ensure they're tracked and resumed at the right time.

### Process Overview

1. **Document immediately**: Create spec in `docs/postponed/[FEATURE_NAME].md`
2. **Add tracking entry**: Update `docs/implementation/postponed-features.md`
3. **Include required fields**: What, When, Why, Dependencies, Priority, Review Trigger
4. **Review regularly**: End of each phase, when dependencies complete, or when gaps emerge

### Required Information

Every postponed feature must include:
- **What was postponed** + link to detailed spec
- **Postponed date** and **reason** (specific blocking dependencies)
- **Dependencies** (with checkboxes: ✅ done / ⏳ pending)
- **Priority**, **estimated effort**, **when to implement**
- **Review trigger** (when to revisit decision)
- **Rationale** (why waiting is better than implementing now)

### Example: Mind Map Enhancements

**What**: 23 enhancements (auto-zoom, context menus, AI integration)
**Why Postponed**: Needs dependency graph (Week 4), timeline data (Week 6), AI assistant (Week 7)
**When**: After Week 7 completion

**Full Process**: See [Postponed Features Process](docs/processes/POSTPONED_FEATURES_PROCESS.md) for:
- Entry format template
- Review cadence and triggers
- Detailed examples and best practices

**Tracking**: [docs/implementation/postponed-features.md](docs/implementation/postponed-features.md)

---

## ✅ EXECUTION TIMING & DEPENDENCY CROSS-CHECKS

Before implementing ANY feature, validate that it's the right time to build it. Implementing too early causes rework, incomplete features, poor UX, and wasted development time.

### The 5-Question Framework

Ask these questions BEFORE starting:

1. **Data Dependencies**: Do required data sources, tables, or APIs exist and are they stable?
2. **Integration Points**: Are module APIs defined and stable? Any breaking changes expected?
3. **User Experience**: Are prerequisite features built? Does this provide standalone value?
4. **Database Schema**: Are required tables/columns finalized? Any cross-module impacts?
5. **Testing Feasibility**: Can this be fully tested with available data?

### Quick Decision Guide

| All Checks Pass | Some Checks Fail | Many Checks Fail |
|-----------------|------------------|------------------|
| ✅ **PROCEED NOW** | ⚠️ **PARTIAL IMPLEMENTATION** | ❌ **POSTPONE** |
| Full implementation | Build foundation, enhance later | Document in [postponed features](docs/implementation/postponed-features.md) |

### Validation Workflow

```
Before implementing:
  → Run 5-Question Framework
  → All YES? ✅ PROCEED
  → Any NO? ⏸️ POSTPONE & document blocking dependencies
```

**Full Details**: See [Implementation Timing Checklist](docs/processes/IMPLEMENTATION_TIMING_CHECKLIST.md) for:
- Detailed 5-question framework with examples
- Pre-implementation checklist template
- Decision examples (good vs. bad timing)
- When to re-evaluate postponed features

**Remember**: It's better to postpone and build correctly than to implement early and rework later!

---

## 📁 DOCUMENTATION ORGANIZATION

**CRITICAL**: All documentation MUST be organized into the proper structure. NEVER create scattered files in root or random directories.

### File Structure

```
docs/
├── implementation/         # Week-by-week progress
│   ├── week-X-Y.md        # Add all week-related work HERE
│   └── postponed-features.md
├── reference/              # Technical references
│   ├── API_REFERENCE.md   # Consolidate all API docs HERE
│   ├── ARCHITECTURE.md    # System design
│   ├── SECURITY.md        # Security implementation
│   └── CODE_PATTERNS.md   # Code examples
├── planning/               # Project management
│   ├── PROGRESS.md        # Weekly progress tracking
│   └── NEXT_STEPS.md      # Immediate priorities
└── processes/              # How-to guides
```

### Rules

✅ **DO**:
- Add implementations to `docs/implementation/week-X-Y.md` immediately
- Consolidate API docs into `docs/reference/API_REFERENCE.md`
- Update week files with full details (what, why, files, dependencies, impact)
- Delete scattered files after consolidating

❌ **DON'T**:
- Create summary/implementation/quick-reference files in root
- Create duplicate documentation in multiple locations
- Skip updating week files "because it's documented elsewhere"
- Leave scattered files after completing work

### When You Create Documentation

**Immediately after ANY significant change:**
1. Update appropriate `docs/implementation/week-X-Y.md` with full entry
2. If API changes → Update `docs/reference/API_REFERENCE.md`
3. If security changes → Update `docs/reference/SECURITY.md`
4. Delete any temporary/scattered files created during development
5. Update `docs/planning/PROGRESS.md` percentages

**Example**: After implementing team management:
- ✅ Add full entry to `week-5-review-system.md`
- ✅ Update API_REFERENCE.md with new routes
- ✅ Delete TEAM_MANAGEMENT_UI_IMPLEMENTATION.md (consolidate into week-5)
- ✅ Delete TEAM_API_*.md files (consolidate into API_REFERENCE.md)
- ❌ Don't leave 10+ scattered .md files in root

---

## 📝 DOCUMENTATION MAINTENANCE WORKFLOW

### When to Update Documentation

**ALWAYS update these 3 files for major changes:**
1. **CLAUDE.md** - Process changes, tech stack updates, current status
2. **IMPLEMENTATION_PLAN.md** - Schema changes, phase completions
3. **README.md** - Project status, live URLs, setup changes

### Update Triggers (When You MUST Update Docs)

✅ **Database Schema Changes**
- Update: docs/implementation/database-schema.md (schema section)
- Update: docs/reference/CHANGELOG.md (migration log)
- Update: CLAUDE.md (if new patterns emerge)

✅ **Tech Stack Changes** (packages added/removed)
- Update: README.md (dependencies)
- Update: CLAUDE.md (tech stack summary)

✅ **Process Changes** (new workflows, MCPs)
- Update: CLAUDE.md (workflows section)
- Update: .cursorrules (if coding standards change)

✅ **Phase Completions** (Week 1, 2, 3 done)
- Update: docs/implementation/week-X-Y.md (mark week complete + add entry for completion)
- Update: docs/planning/PROGRESS.md (update percentages)
- Update: README.md (current status)
- Link: Related week files if dependencies changed
- Link: Future week files if new dependencies created

✅ **Postponed Features** (new deferrals)
- Create: docs/postponed/[FEATURE_NAME].md (detailed spec)
- Update: docs/implementation/postponed-features.md (summary tracking)

✅ **Architecture Changes** (new modules, APIs)
- Update: docs/reference/ARCHITECTURE.md (diagrams)
- Update: docs/reference/API_REFERENCE.md (if API changes)
- Update: CLAUDE.md (quick reference)

### Update Checklist Template

Use this when making major changes:

```markdown
- [ ] What changed? [Brief description]
- [ ] Why? [Rationale]
- [ ] CLAUDE.md updated? [Yes/No - section]
- [ ] docs/implementation/week-X-Y.md updated? [Yes/No - entry added with full details]
- [ ] Dependencies documented? [Satisfied/Created - linked to weeks]
- [ ] Future impact documented? [Which weeks affected]
- [ ] README.md updated? [Yes/No - section]
- [ ] docs/reference/CHANGELOG.md entry added? [Yes/No]
- [ ] docs/planning/PROGRESS.md updated? [Yes/No - percentages]
- [ ] Postponed features linked? [Yes/No - target week specified]
- [ ] Other docs affected? [List]
```

### Documentation Sync Schedule

**Daily** (End of work session):
- Update docs/planning/PROGRESS.md with completed tasks
- Add docs/reference/CHANGELOG.md entries for new migrations

**Weekly** (End of each implementation week):
- Review docs/implementation/week-X-Y.md phase status
- Update README.md current status
- Sync CLAUDE.md if processes changed
- Review docs/planning/NEXT_STEPS.md priorities

**Monthly** (Before major releases):
- Full documentation audit (use docs/processes/DOCUMENTATION_AUDIT_CHECKLIST.md)
- Fix inconsistencies
- Update all "Last Updated" timestamps

### Documentation Quality Standards

**Core Files Must Always Be:**
- ✅ **Consistent** - Same information across all files
- ✅ **Current** - "Last Updated" within 1 week
- ✅ **Complete** - No missing sections or TODOs
- ✅ **Cross-Referenced** - Valid links between docs
- ✅ **Tested** - Installation steps actually work

**Red Flags to Fix Immediately:**
- ❌ MCP count mismatch (e.g., README says 2, config has 3)
- ❌ Progress percentage differs by >10% across files
- ❌ Database schema documented but migration missing
- ❌ Tech stack mismatch between files
- ❌ Last Updated > 2 weeks ago on core files

**Full Checklist**: See [docs/processes/DOCUMENTATION_AUDIT_CHECKLIST.md](docs/processes/DOCUMENTATION_AUDIT_CHECKLIST.md)

---

## 📅 WEEKLY PROGRESSION TRACKING

### Critical Rule: Never Move On Without Documenting

**Every significant change MUST be documented in the current week's progression file** (`docs/implementation/week-X-Y.md`). This prevents lost context, forgotten dependencies, and broken feature links.

### When to Update Weekly Files

Update the current week file **immediately after**:
- ✅ Feature completion or major milestone
- ✅ Architecture changes or new patterns introduced
- ✅ Database schema modifications
- ✅ Dependency changes (satisfied or newly created)
- ✅ Postponed features or deferred work
- ✅ Blockers encountered or resolved
- ✅ Progress percentage changes (e.g., 50% → 75%)

### What to Document in Weekly Files

Each significant change should include:

1. **What Changed**: Specific features, files, or components modified
2. **Why**: Rationale for decisions made
3. **Progress Update**: New completion percentage for the week
4. **Dependencies**:
   - ✅ Dependencies satisfied (from previous weeks)
   - ⏳ New dependencies created (for future weeks)
5. **Files Modified/Created**: List of changed files with brief descriptions
6. **Future Impact**: Which future weeks are affected by this change
7. **Cross-References**: Links to related docs (postponed features, architecture, etc.)

### Required Cross-Linking

**Link to Related Weeks**:
- If satisfying dependency → Link to week that created it
- If creating dependency → Link to future week that needs it
- If postponing feature → Link to target week for implementation

**Link to Related Docs**:
- Postponed features → `docs/postponed/[FEATURE_NAME].md`
- Architecture changes → `docs/reference/ARCHITECTURE.md`
- API changes → `docs/reference/API_REFERENCE.md`
- Database changes → `docs/reference/CHANGELOG.md`

### Standard Weekly Entry Format

```markdown
---
### ✅ [Feature Name] (YYYY-MM-DD)

**What Changed**:
- [Bullet points describing what was built/modified]
- [Include component names, route changes, etc.]

**Why**:
- [Rationale for approach taken]
- [Alternative approaches considered]

**Progress**: Week X: [old%] → [new%]

**Dependencies Satisfied**:
- ✅ [Dependency from Week Y] - [Brief description]
- ✅ [Dependency from Week Z] - [Brief description]

**New Dependencies Created**:
- ⏳ [Dependency for Week A] - [What needs this]
- ⏳ [Postponed to Week B] - [Why postponed]

**Files Modified**:
- `path/to/file.tsx` - [What changed]
- Created: `path/to/new-file.tsx` - [Purpose]
- Deleted: `path/to/old-file.tsx` - [Reason]

**Future Impact**:
- Week A: [How this affects future work]
- Week B: [Dependencies or considerations]
- See: [Link to postponed feature doc]

**Links**:
- Related Feature: [docs/implementation/week-Y-Z.md](week-Y-Z.md#feature-name)
- Postponed: [docs/postponed/FEATURE.md](../postponed/FEATURE.md)
- Architecture: [docs/reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md#section)
---
```

### Example: Workspace Redesign Entry

```markdown
---
### ✅ Workspace Dashboard Redesign (2025-01-15)

**What Changed**:
- Redesigned workspace page with Supabase-style sidebar navigation
- Added multi-phase horizontal progress bar with auto-calculation
- Implemented research-backed color palette (Indigo → Violet → Emerald → Amber → Green)
- Created phase calculation logic from work item states

**Why**:
- Grid layout provided poor workflow guidance
- Vertical timeline didn't show resource distribution
- Users needed clear visual hierarchy and reduced cognitive load
- Research showed sidebar navigation scales better for 5+ modules

**Progress**: Week 3: 50% → 75% (major UI overhaul completed)

**Dependencies Satisfied**:
- ✅ Work items schema with status fields (Week 2)
- ✅ Workspace module system (Week 1)
- ✅ Team subscription plan field (Week 1)

**New Dependencies Created**:
- ⏳ Focus Mode widget - Postponed to Week 7 (needs AI insights)
- ⏳ Health Alerts component - Postponed to Week 7 (needs analytics)
- ⏳ Auto-assign reviewers - Postponed to Week 7 (needs AI + team data)

**Files Modified**:
- `app/(dashboard)/workspaces/[id]/page.tsx` - Complete layout redesign
- Created: `components/workspaces/workspace-sidebar.tsx` - Collapsible navigation
- Created: `components/workspaces/multi-phase-progress-bar.tsx` - Horizontal progress
- Created: `lib/constants/workspace-phases.ts` - Phase config + calculation
- `cursor-mcp-config.json` - Re-enabled Parallel MCPs

**Future Impact**:
- Week 4: Dependencies module can use phase color system
- Week 5: Review module can filter by phase
- Week 6: Timeline can show phase-based swimlanes
- Week 7: AI insights can analyze phase distribution and suggest optimizations
- See: `docs/postponed/WORKSPACE_ENHANCEMENTS.md` for deferred features

**Links**:
- Postponed Features: [docs/postponed/WORKSPACE_ENHANCEMENTS.md](../postponed/WORKSPACE_ENHANCEMENTS.md)
- Architecture Update: [docs/reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md#workspace-phase-system)
- Color Research: [WORKSPACE_REDESIGN_SUMMARY.md](../../WORKSPACE_REDESIGN_SUMMARY.md)
---
```

### Update Triggers Checklist (Enhanced)

When making ANY significant change, update:

```markdown
- [ ] Current week file: docs/implementation/week-X-Y.md
- [ ] Progress percentage updated in week file
- [ ] Dependencies documented (satisfied + newly created)
- [ ] Future week files updated if new dependencies added
- [ ] Postponed features linked if work deferred
- [ ] Cross-references added to related weeks
- [ ] Files modified/created listed with purposes
- [ ] Future impact documented for affected weeks
- [ ] Related docs updated (Architecture, API, etc.)
- [ ] PROGRESS.md updated with new percentages
```

### Red Flags - Never Do This

❌ **DON'T**:
- Skip documenting changes because "it's small"
- Move to next feature without updating current week file
- Create dependencies without documenting in both weeks (creator + consumer)
- Postpone features without linking to target week
- Forget to update progress percentages
- Break cross-reference links between weeks

✅ **DO**:
- Document every significant change immediately
- Link forward (future weeks) and backward (past weeks)
- Update postponed feature docs with target week
- Keep progress percentages current
- Maintain complete file modification lists
- Cross-reference all related documentation

---

## 🛠️ MCP USAGE GUIDELINES

### Quick Reference

| MCP | Primary Use | Example Prompt |
|-----|-------------|----------------|
| **Supabase** | Migrations, queries, real-time, TypeScript types | "Create migration with RLS policies" |
| **Playwright** | E2E tests, user flows, screenshots | "Test authentication flow" |
| **Parallel Search** | Multi-source research, competitive analysis | "Research roadmap UX best practices" |
| **Parallel Task** | Workflow automation, parallel execution | "Orchestrate migration + build + deploy" |
| **Vercel** | Deployment, monitoring, environment vars | "Deploy to production and check logs" |
| **shadcn/ui** *(Week 4+)* | Component installation, multi-registry access | "Add login form with button and input components from shadcn" |

**Full Guide**: See [MCP Usage Guide](docs/reference/MCP_USAGE_GUIDE.md) for:
- Detailed use cases for each MCP
- Extended example prompts and patterns
- MCP integration workflows
- Troubleshooting tips
- Best practices and optimization

---

## 🎨 UI/UX PATTERNS

### shadcn/ui Components
Use pre-built components from shadcn/ui library:

```bash
# Install components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### Tailwind CSS Patterns

```tsx
// ✅ Responsive, mobile-first
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {features.map(feature => <FeatureCard key={feature.id} feature={feature} />)}
</div>

// ✅ Flexbox utilities
<div className="flex items-center justify-between gap-4">
  <h1 className="text-2xl font-bold">Features</h1>
  <Button>Add Feature</Button>
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', gap: '1rem' }}>
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Standard Process
```bash
# 1. Test locally
npm run dev

# 2. Apply migrations (if any)
npx supabase db push

# 3. Run tests
npm run test
npm run test:e2e

# 4. Commit changes
git add .
git commit -m "feat: add mind mapping canvas"
git push origin main

# 5. Deploy to Vercel (automatic via GitHub)
# Or manually: vercel --prod

# 6. Verify production
# Visit https://platform-test-cyan.vercel.app
```

### Using Vercel CLI
```bash
# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# View environment variables
vercel env ls

# Pull environment variables to local .env
vercel env pull
```

---

## 🔍 COMMON PATTERNS & TESTING

### Quick Reference

**Database Migrations**:
1. Create migration: `supabase/migrations/YYYYMMDDHHMMSS_*.sql`
2. Include: team_id, indexes, RLS policies (SELECT/INSERT/UPDATE/DELETE)
3. Apply: `npx supabase db push`
4. Generate types: `npx supabase gen types typescript > lib/supabase/types.ts`

**Real-time**: Use `supabase.channel()` with team_id filter, return unsubscribe function

**Feature Gates**: Check team plan, show upgrade modal for Pro features

**E2E Testing**: Playwright with `test.describe()`, test user flows end-to-end

**Full Patterns**: See [Code Patterns Reference](docs/reference/CODE_PATTERNS.md) for complete examples of:
- Database migrations with RLS
- Real-time subscriptions
- Feature gates (Free vs Pro)
- AI chat with streaming
- AI tool calling (agentic mode)
- Playwright E2E testing

---

## 📚 ADDITIONAL RESOURCES

### Key Documentation Files

| File | Purpose |
|------|---------|
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | 8-week roadmap, architecture, database schema |
| [RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md) | Claude agents mapped to implementation phases |
| [MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md) | MCP configuration and context optimization |
| [.cursorrules](.cursorrules) | Cursor AI behavior and coding standards |
| [cursor-mcp-config.json](cursor-mcp-config.json) | Active MCP server configuration |
| [cursor-mcp-config.BACKUP.json](cursor-mcp-config.BACKUP.json) | Removed MCPs (re-enable if needed) |

### External Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com
- **ReactFlow Docs**: https://reactflow.dev
- **Playwright Docs**: https://playwright.dev
- **Stripe Docs**: https://stripe.com/docs

---

## 🎯 QUICK COMMANDS

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler
```

### Database
```bash
npx supabase start                    # Start local Supabase
npx supabase db push                  # Apply migrations
npx supabase db reset                 # Reset database
npx supabase gen types typescript     # Generate TypeScript types
```

### Testing
```bash
npm run test             # Run Jest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:watch       # Run tests in watch mode
```

### Deployment
```bash
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel env pull          # Pull environment variables
```

---

## ⚠️ IMPORTANT REMINDERS

### Always Remember
- ✅ Use timestamp-based IDs (`Date.now().toString()`), NEVER UUID
- ✅ Filter all queries by `team_id` for multi-tenancy
- ✅ Enable RLS on all tables
- ✅ Use TypeScript strict mode, avoid `any`
- ✅ Use shadcn/ui components, not custom UI libraries
- ✅ Test on mobile (mobile-first design)
- ✅ Check Pro tier feature gates before accessing features

### Never Do
- ❌ Don't use UUID for IDs
- ❌ Don't skip RLS policies
- ❌ Don't use `any` type in TypeScript
- ❌ Don't create custom CSS files (use Tailwind)
- ❌ Don't hardcode API keys in code
- ❌ Don't skip team_id filtering in queries

---

**Ready to build! 🚀**

For detailed implementation steps, see [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

For agent usage by phase, see [RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md).

For MCP configuration details, see [MCP_OPTIMIZATION_SUMMARY.md](MCP_OPTIMIZATION_SUMMARY.md).
