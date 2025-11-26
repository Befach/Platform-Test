# 📚 Project Guidelines & Quick Reference

**Last Updated**: 2025-11-26
**Project**: Product Lifecycle Management Platform
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Vercel
**Current Status**: Week 6 (60-65% overall)

---

## 🎯 QUICK START

### Essential Documentation (Read These First!)

#### Planning & Architecture
1. **[docs/implementation/README.md](docs/implementation/README.md)** - Week-by-week implementation guide (main entry point)
2. **[docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)** - System architecture with Mermaid diagrams
3. **[docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md)** - Complete API documentation (20+ routes)

#### Progress Tracking
4. **[docs/planning/PROGRESS.md](docs/planning/PROGRESS.md)** - Weekly tracker with completion percentages
5. **[docs/reference/CHANGELOG.md](docs/reference/CHANGELOG.md)** - Migration history, feature tracking
6. **[docs/planning/NEXT_STEPS.md](docs/planning/NEXT_STEPS.md)** - Immediate actions, priorities, blockers

#### Postponed Features
7. **[docs/postponed/README.md](docs/postponed/README.md)** - Postponed features index
8. **[docs/processes/POSTPONED_FEATURES_PROCESS.md](docs/processes/POSTPONED_FEATURES_PROCESS.md)** - Tracking process

#### Configuration & Standards
9. **[docs/planning/RECOMMENDED_AGENTS.md](docs/planning/RECOMMENDED_AGENTS.md)** - Claude agents by phase
10. **[docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)** - TypeScript, Next.js, Supabase patterns
11. **[docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md)** - MCP usage examples

#### UI Component Selection
12. **[docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md](docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md)** - 14 shadcn/ui registries with 1000+ components

### Tech Stack
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

### MCP Servers (5 Active)

| MCP | Purpose |
|-----|---------|
| **Supabase** | Migrations, queries, RLS, real-time, TypeScript types |
| **Playwright** | E2E testing, browser automation, screenshots |
| **Vercel** | Deployment, environment vars, build monitoring |
| **Parallel Search** | Multi-source web search (Tavily, Perplexity, Exa, Brave) |
| **Parallel Task** | Workflow automation, multi-agent workflows |
| **shadcn/ui** *(Week 4+)* | Component installation, multi-registry access |

**shadcn/ui MCP Setup** (Install at Week 4 start):
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

### Dev Server Policy

**IMPORTANT**: Always run on **localhost:3000** only.

```bash
# Kill existing processes, then start
taskkill /F /IM node.exe 2>nul
cd next-app && npm run dev
```

**Rules:**
- ✅ Only ONE dev server on port 3000
- ❌ NEVER run on other ports (3001, 3002)
- ❌ If port occupied, kill process first

---

## 📋 PROJECT OVERVIEW

### Mission
Transform roadmap manager into **Product Lifecycle Management Platform**:

1. **Research & Ideate** - AI-powered mind mapping, web search, knowledge base
2. **Plan & Structure** - Features, timeline, dependencies
3. **Review & Gather Feedback** - Stakeholder input (invite-based, public links, iframe)
4. **Execute Collaboratively** - Team assignment, task tracking, real-time collaboration
5. **Test & Iterate** - User feedback collection and analysis
6. **Measure Success** - Analytics, expected vs actual performance tracking

### Key Features (10 Modules)

| Module | Week | Priority | Description |
|--------|------|----------|-------------|
| **Mind Mapping** 🧠 | 3 | **CRITICAL** | ReactFlow canvas, 5 node types, convert to features |
| Research & Discovery 🔍 | 7 | High | AI chat, web search, knowledge base |
| Feature Planning 📋 | 4 | High | CRUD, timeline breakdown, rich text |
| Dependency Management 🔗 | 4 | High | Visual graph, 4 link types, critical path |
| Review & Feedback 👥 | 5 | Medium | Invite-based, public links, iframe (Pro) |
| Project Execution 🚀 | 6 | Medium | Team assignment, status tracking |
| Collaboration 🤝 | 6 | Medium | Real-time editing, live cursors (Pro) |
| Timeline Visualization 📅 | 6 | High | Gantt chart, swimlanes, drag-to-reschedule |
| Analytics & Metrics 📊 | 7 | Medium | 4 pre-built dashboards, custom builder (Pro) |
| AI Assistant 🤖 | 7 | High | Chat panel, agentic mode, 20+ tools |

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
work_items      - Top-level roadmap items (features, bugs, enhancements)
timeline_items  - MVP/SHORT/LONG breakdowns
linked_items    - Dependencies and relationships
product_tasks   - Execution tasks
```

#### Mind Mapping Tables
```
mind_maps       - Canvas data (ReactFlow JSON)
work_flows      - Hierarchical sub-canvases
```

#### Review & Feedback Tables
```
feedback        - User/stakeholder feedback
```

#### Phase System Tables
```
user_phase_assignments    - Phase-based permissions
phase_assignment_history  - Audit trail
phase_access_requests     - Self-service permission requests
phase_workload_cache      - Performance optimization
```

### Data Sync Strategy
1. **Write**: Save to Supabase immediately (no localStorage)
2. **Read**: Load from Supabase, cache in React Query
3. **Real-time**: Subscribe to Supabase Realtime for live updates
4. **Conflict resolution**: Last write wins (timestamp-based)

---

## 💻 CODING STANDARDS

### Core Rules

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use strict TypeScript (interfaces, no `any`) | Use `any` type |
| Use `Date.now().toString()` for IDs | Use UUID |
| Always filter by `team_id` | Skip `team_id` filtering |
| Use shadcn/ui + Tailwind CSS | Use inline styles or custom CSS |
| Enable RLS on all tables | Skip RLS policies |
| Handle errors explicitly | Skip error handling |

### Quick Patterns
```typescript
// IDs
const id = Date.now().toString()

// Queries - ALWAYS filter by team_id
const { data } = await supabase
  .from('work_items')
  .select('*')
  .eq('team_id', teamId)

// Components
import { Button } from '@/components/ui/button'
```

**Full Patterns**: See [docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)

---

## ✅ 5-QUESTION FRAMEWORK

Before implementing ANY feature, validate timing:

| # | Question | Check |
|---|----------|-------|
| 1 | **Data Dependencies**: Do required tables/APIs exist and are they stable? | ✅/❌ |
| 2 | **Integration Points**: Are module APIs defined and stable? | ✅/❌ |
| 3 | **User Experience**: Does this provide standalone value? | ✅/❌ |
| 4 | **Database Schema**: Are required tables/columns finalized? | ✅/❌ |
| 5 | **Testing Feasibility**: Can this be fully tested? | ✅/❌ |

| Result | Action |
|--------|--------|
| All ✅ | **PROCEED NOW** - Full implementation |
| Some ❌ | **PARTIAL** - Build foundation, enhance later |
| Many ❌ | **POSTPONE** - Document in [postponed-features.md](docs/implementation/postponed-features.md) |

**Remember**: Better to postpone and build correctly than implement early and rework!

---

## 📁 DOCUMENTATION ORGANIZATION

### File Structure

```
docs/
├── implementation/         # Week-by-week progress
│   ├── week-X-Y.md        # Add all week-related work HERE
│   ├── database-schema.md # Schema reference
│   └── postponed-features.md
├── reference/              # Technical references
│   ├── API_REFERENCE.md   # Consolidate all API docs HERE
│   ├── ARCHITECTURE.md    # System design
│   └── CODE_PATTERNS.md   # Code examples
├── planning/               # Project management
│   ├── PROGRESS.md        # Weekly progress tracking
│   └── NEXT_STEPS.md      # Immediate priorities
├── postponed/              # Deferred feature specs
│   └── [FEATURE_NAME].md
└── processes/              # How-to guides
```

### Documentation Rules

**✅ DO**:
- Add implementations to `docs/implementation/week-X-Y.md` immediately
- Consolidate API docs into `docs/reference/API_REFERENCE.md`
- Update week files with full details (what, why, files, dependencies)
- Delete scattered files after consolidating
- Update `docs/implementation/README.md` for architecture changes

**❌ DON'T**:
- Create summary/implementation files in root
- Create duplicate documentation in multiple locations
- Skip updating week files
- Leave scattered .md files after completing work

### Update Triggers

| Change Type | Update These Files |
|-------------|-------------------|
| Database table/column | `docs/reference/CHANGELOG.md` |
| API endpoint | `docs/reference/API_REFERENCE.md` |
| Feature completion | `docs/planning/PROGRESS.md` + `week-X.md` |
| Architecture change | `docs/reference/ARCHITECTURE.md` |
| Postponed feature | `docs/postponed/[NAME].md` + `postponed-features.md` |
| Tech stack change | `README.md` + `CLAUDE.md` |
| Process change | `CLAUDE.md` |

### Update Checklist Template

Use this for major changes:
```markdown
- [ ] What changed? [Description]
- [ ] docs/implementation/week-X-Y.md updated?
- [ ] Dependencies documented? (satisfied/created)
- [ ] docs/planning/PROGRESS.md updated?
- [ ] docs/reference/CHANGELOG.md entry added?
- [ ] Scattered files deleted?
```

### File Creation Rules

| Need | Location | Convention |
|------|----------|------------|
| Migration | `supabase/migrations/` | `YYYYMMDDHHMMSS_[action]_[table].sql` |
| API route | `next-app/src/app/api/[resource]/` | `route.ts` |
| Component | `next-app/src/components/[feature]/` | `[name].tsx` (kebab-case) |
| Types | `next-app/src/lib/types/` | **EXTEND** existing file |
| Week docs | `docs/implementation/` | Add entry to `week-X-Y.md` |
| Postponed | `docs/postponed/` | `[FEATURE_NAME].md` |

**Never Create - Always Extend**:
| ❌ Don't Create | ✅ Instead Extend |
|-----------------|-------------------|
| `FEATURE_SUMMARY.md` in root | `docs/implementation/week-X.md` |
| `API_ROUTES.md` (new file) | `docs/reference/API_REFERENCE.md` |
| `src/types/newFeature.ts` | `src/lib/types/[existing].ts` |

### Pre-File-Creation Checklist

Before creating ANY new file:
```markdown
- [ ] Is there an existing file this should extend instead?
- [ ] Does location match directory structure?
- [ ] Does filename follow naming convention?
- [ ] For docs: Should this be an entry in week-X.md?
- [ ] For types: Can this be added to existing [feature]-types.ts?

If ANY check fails → DO NOT CREATE, extend existing file instead.
```

### Documentation Quality Standards

**Core Files Must Be**:
- ✅ **Consistent** - Same information across all files
- ✅ **Current** - "Last Updated" within 1 week
- ✅ **Complete** - No missing sections or TODOs
- ✅ **Cross-Referenced** - Valid links between docs

**Red Flags to Fix Immediately**:
- ❌ Progress percentage differs by >10% across files
- ❌ Database schema documented but migration missing
- ❌ Tech stack mismatch between files
- ❌ Last Updated > 2 weeks ago on core files

---

## 📅 WEEKLY PROGRESSION TRACKING

### When to Update Weekly Files

Update the current week file **immediately after**:
- ✅ Feature completion or major milestone
- ✅ Architecture changes or new patterns introduced
- ✅ Database schema modifications
- ✅ Dependency changes (satisfied or newly created)
- ✅ Postponed features or deferred work
- ✅ Progress percentage changes

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

### Weekly Entry Format

Every entry in `docs/implementation/week-X-Y.md` must include:

```markdown
### ✅ [Feature Name] (YYYY-MM-DD)

**What Changed**:
- [Bullet points describing what was built/modified]

**Why**:
- [Rationale for approach]

**5-Question Validation**:
| Q | Status | Notes |
|---|--------|-------|
| 1. Data Dependencies | ✅/❌ | [tables/APIs needed] |
| 2. Integration Points | ✅/❌ | [modules affected] |
| 3. Standalone Value | ✅/❌ | [user value] |
| 4. Schema Finalized | ✅/❌ | [tables/columns] |
| 5. Can Test | ✅/❌ | [test approach] |

**Result**: ✅ PROCEED / ⚠️ PARTIAL / ❌ POSTPONE

**Progress**: Week X: [old%] → [new%]

**Dependencies Satisfied**:
- ✅ [Dependency from Week Y]

**Dependencies Created**:
- ⏳ [For Week Z] - [What needs this]

**Files Modified**:
- `path/to/file.tsx` - [purpose]
- Created: `path/to/new.tsx` - [purpose]

**Links**:
- Related: [week-Y.md](week-Y.md#section)
- Postponed: [docs/postponed/FEATURE.md](../postponed/FEATURE.md)
```

---

## 🔧 NAMING CONVENTIONS

### Pre-Naming Checklist (REQUIRED before creating any new entity)

Before naming ANY new table, field, component, or concept:

| Check | Question |
|-------|----------|
| **User-Friendly** | Would a non-technical Product Manager understand this term? |
| **Consistent** | Does it match existing naming patterns in the codebase? |
| **Clear** | Is the name self-explanatory without documentation? |
| **Relationship** | Does the name show how it relates to parent/child entities? |
| **Future-Proof** | Will this name still make sense if we add more features? |

**If ANY check fails → STOP and discuss naming before proceeding.**

### Established Terminology

| Concept | DB Name | UI Label |
|---------|---------|----------|
| Organization | `team` | "Team" |
| Product/Project | `workspace` | "Workspace" |
| Feature/Bug/etc | `work_item` | "Work Item" |
| Timeline breakdown | `timeline_item` | "Timeline" |
| Execution task | `product_task` | "Task" |
| Dependency | `linked_item` | "Dependency" |
| Type variants | `type` field | "Type" (concept/feature/bug/enhancement) |
| Phase | `phase` field | "Phase" (research→complete) |

### Anti-Patterns (NEVER use)

| ❌ Bad | ✅ Better | Problem |
|--------|----------|---------|
| `feature` (table) | `work_item` | Too specific |
| `task` for timeline | `timeline_item` | Confuses with execution |
| `project` | `workspace` | Conflicts |
| `ticket`, `story` | `work_item` | Jira/Agile specific |

### Renaming Migration Cost Matrix

| What Changes | Files Affected | Migration Required | Risk |
|--------------|----------------|-------------------|------|
| Table name | 20-50+ files | YES - data migration | 🔴 HIGH |
| Column name | 10-30 files | YES - column rename | 🟡 MEDIUM |
| FK name | 5-15 files | YES - constraint rename | 🟡 MEDIUM |
| Component name | 2-10 files | NO | 🟢 LOW |
| UI label only | 1-5 files | NO | 🟢 LOW |

---

## 🎯 QUICK COMMANDS

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run check:links      # Validate doc links
```

### Database
```bash
npx supabase db push                  # Apply migrations
npx supabase gen types typescript     # Generate types
```

### Testing
```bash
npm run test:e2e         # Playwright E2E tests
npm run test             # Jest unit tests
```

### Deployment
```bash
vercel --prod            # Deploy to production
```

---

## 🔍 COMMON PATTERNS

### Database Migrations
1. Create migration: `supabase/migrations/YYYYMMDDHHMMSS_*.sql`
2. Include: team_id, indexes, RLS policies (SELECT/INSERT/UPDATE/DELETE)
3. Apply: `npx supabase db push`
4. Generate types: `npx supabase gen types typescript > lib/supabase/types.ts`

### Real-time Subscriptions
- Use `supabase.channel()` with team_id filter
- Return unsubscribe function from useEffect

### Feature Gates
- Check team plan before Pro features
- Show upgrade modal for Pro-only features

### E2E Testing
- Use Playwright with `test.describe()`
- Test complete user flows end-to-end

**Full Patterns**: See [docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)

---

## 🎨 UI PATTERNS

### shadcn/ui Install
```bash
npx shadcn-ui@latest add button card dialog form input select table tabs toast
```

### Tailwind Patterns
```tsx
// ✅ Responsive, mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Avoid inline styles
<div style={{ display: 'flex' }}>
```

---

## 🚀 DEPLOYMENT

```bash
# 1. Test locally
npm run dev

# 2. Apply migrations
npx supabase db push

# 3. Run tests
npm run test:e2e

# 4. Commit & push
git add . && git commit -m "feat: description" && git push

# 5. Verify: https://platform-test-cyan.vercel.app
```

---

## 📚 REFERENCE DOCS

### Implementation-Specific
- **Sidebar**: [docs/reference/SIDEBAR_IMPLEMENTATION.md](docs/reference/SIDEBAR_IMPLEMENTATION.md)
- **Database Schema**: [docs/implementation/database-schema.md](docs/implementation/database-schema.md)
- **MCP Usage**: [docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md)

### External
- [Next.js 15](https://nextjs.org/docs) | [Supabase](https://supabase.com/docs) | [shadcn/ui](https://ui.shadcn.com)
- [ReactFlow](https://reactflow.dev) | [Playwright](https://playwright.dev) | [Stripe](https://stripe.com/docs)

---

## ⚠️ CRITICAL REMINDERS

### Always
- ✅ Timestamp IDs: `Date.now().toString()`
- ✅ Filter by `team_id` in ALL queries
- ✅ Enable RLS on ALL tables
- ✅ TypeScript strict mode, no `any`
- ✅ shadcn/ui components only
- ✅ Mobile-first design
- ✅ Check Pro tier feature gates

### Never
- ❌ UUID for IDs
- ❌ Skip RLS policies
- ❌ Skip team_id filtering
- ❌ Custom CSS files
- ❌ Hardcode API keys

---

**Ready to build! 🚀**

See [docs/implementation/README.md](docs/implementation/README.md) for detailed implementation steps.
