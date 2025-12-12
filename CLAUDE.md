# 📚 Project Guidelines & Quick Reference

**Last Updated**: 2025-12-11 <!-- Added: Platform Architecture (Core Concepts) section with two-layer system, phase vs status, Design Thinking, strategy hierarchy -->
**Project**: Product Lifecycle Management Platform
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Vercel
**Current Status**: Week 7/12 (90% overall)

---

## 🚨 ARCHITECTURE GUARDRAILS (MANDATORY)

**CRITICAL**: If the user proposes changes that contradict these established decisions, Claude MUST:
1. **STOP** and question the deviation
2. **REMIND** the user of the established architecture
3. **ASK** "Why are we changing this approach? We already decided on X."

### Established Architecture Decisions (Do NOT Deviate Without Explicit Discussion)

| Decision | Correct Approach | WRONG Approach |
|----------|------------------|----------------|
| **Phase vs Status** | Phase IS the status for work items (same field) | Separate phase and status fields |
| **Workspace Display** | Shows AGGREGATION (distribution across phases) | Has single stage/phase value |
| **Timeline Items** | Have SEPARATE status field for task execution | Share status with work items |
| **Design Thinking** | METHODOLOGY for how to work (not lifecycle) | Lifecycle stages to progress through |
| **Strategy Display** | DIFFERENT at org level vs work-item level | Same display everywhere |
| **Phase Upgrades** | Prompted at WORK ITEM level (80% threshold) | Prompted at workspace level |

### Canonical Reference
**`docs/ARCHITECTURE_CONSOLIDATION.md`** is the single source of truth. When in doubt, consult this file.

### Example Corrections

**User says**: "Let's add a status field to work items"
**Claude responds**: "Wait - we established that phase IS the status for work items. They're the same field. Why do we need a separate status? The timeline items have separate status for task-level tracking. Are you sure you want to change this?"

**User says**: "The workspace should show which stage it's in"
**Claude responds**: "We decided that workspaces show phase DISTRIBUTION (aggregation), not a single stage. Each work item has its own phase. The workspace shows '10 in research, 15 in planning...' - why would we want a single stage value?"

**User says**: "Design Thinking should be our lifecycle stages"
**Claude responds**: "Design Thinking is documented as a METHODOLOGY/framework for HOW to work at each phase, not lifecycle stages to progress through. The phases are: research → planning → execution → review → complete. Design Thinking (Empathize, Define, Ideate, Prototype, Test) guides the APPROACH at each phase. Did you want to reconsider this?"

---

## 🎯 QUICK START

### Essential Documentation (Read These First!)

#### Planning & Architecture
0. **[docs/ARCHITECTURE_CONSOLIDATION.md](docs/ARCHITECTURE_CONSOLIDATION.md)** - ⭐ CANONICAL source of truth for all architecture decisions
1. **[docs/implementation/README.md](docs/implementation/README.md)** - Week-by-week implementation guide (main entry point)
2. **[docs/planning/MASTER_IMPLEMENTATION_ROADMAP.md](docs/planning/MASTER_IMPLEMENTATION_ROADMAP.md)** - Complete dependency graph and implementation sequence for future features
3. **[docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)** - System architecture with Mermaid diagrams
4. **[docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md)** - Complete API documentation (20+ routes)

#### Progress Tracking
5. **[docs/planning/PROGRESS.md](docs/planning/PROGRESS.md)** - Weekly tracker with completion percentages
6. **[docs/reference/CHANGELOG.md](docs/reference/CHANGELOG.md)** - Migration history, feature tracking
7. **[docs/planning/NEXT_STEPS.md](docs/planning/NEXT_STEPS.md)** - Immediate actions, priorities, blockers

#### Postponed Features
8. **[docs/postponed/README.md](docs/postponed/README.md)** - Postponed features index
9. **[docs/processes/POSTPONED_FEATURES_PROCESS.md](docs/processes/POSTPONED_FEATURES_PROCESS.md)** - Tracking process

#### Configuration & Standards
10. **[docs/planning/RECOMMENDED_AGENTS.md](docs/planning/RECOMMENDED_AGENTS.md)** - Claude agents by phase
11. **[docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)** - TypeScript, Next.js, Supabase patterns
12. **[docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md)** - MCP usage examples

#### UI Component Selection
13. **[docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md](docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md)** - 14 shadcn/ui registries with 1000+ components

### Tech Stack
```
Framework:    Next.js 15 + TypeScript (App Router, Server Components)
Database:     Supabase (PostgreSQL + Real-time + Auth + RLS)
UI:           shadcn/ui + Tailwind CSS + Lucide React
Mind Mapping: XYFlow/ReactFlow (custom nodes, AI-powered)
Charts:       Recharts (10+ chart types)
Testing:      Playwright (E2E)
Payments:     Stripe (Checkout, Subscriptions, Webhooks)
Email:        Resend (Invitations, notifications)
AI:           OpenRouter (Kimi K2, DeepSeek V3.2, Grok 4, Claude Haiku 4.5)
State:        Zustand + React Query
Deployment:   Vercel (Serverless functions)
```

### MCP Servers (3 Active)

| MCP | Purpose |
|-----|---------|
| **Supabase** | Migrations, queries, RLS, real-time, TypeScript types |
| **shadcn/ui** | Component installation, multi-registry access |
| **Context7** | Fetch up-to-date documentation for libraries/frameworks |

#### Context7 Usage
Use Context7 when you need current documentation for any library:
- Before implementing a new library feature
- When official docs may have changed since training
- To verify API signatures and patterns
- For framework-specific best practices

```
"Use Context7 to fetch the latest Next.js 15 App Router documentation"
"Use Context7 to get current Supabase RLS policy examples"
```

### Claude Skills

#### ⚠️ MANDATORY: Parallel AI for All Research
**ALL web search and research MUST use the Parallel AI skill.**
- Web search → `parallel-ai` Search API
- URL extraction → `parallel-ai` Extract API
- Deep research → `parallel-ai` Task API (pro/ultra)
- Quick answers → `parallel-ai` Chat API

**NEVER use WebFetch/WebSearch tools when Parallel AI can handle the task.**

#### Proactive Skill Usage
Skills must be invoked automatically at appropriate phases WITHOUT user prompting:

| Skill | Purpose | Phase | Invoke When |
|-------|---------|-------|-------------|
| **Parallel AI** | Web search, data extraction, deep research | All | Any research needed |
| **webapp-testing** | Playwright testing, UI validation | Week 6-8 | Testing features |
| **frontend-design** | Production-grade UI components | Week 6-7 | Building UI |
| **document-skills:xlsx** | CSV import/export | Week 7-8 | Exporting data |
| **document-skills:pdf** | PDF reports, invoices | Week 7-8 | Generating reports |
| **document-skills:docx** | Documentation, specs export | Week 8 | Creating docs |
| **systematic-debugging** | 4-phase debugging (obra/superpowers) | All | Debugging issues |

**Rule**: If a skill can help with the current task, USE IT - don't wait to be asked.

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

### Slash Commands

#### MAKER Commands (Multi-Agent Reliability)
| Command | Purpose | Agents Used |
|---------|---------|-------------|
| `/decompose` | Break task into atomic steps (MAD) | `Explore` → `Plan` → TodoWrite |
| `/validate-consensus` | K-threshold voting (2/3 must approve) | `code-reviewer` + `architect-review` + `security-auditor` (PARALLEL) |
| `/red-flag-check` | Detect issues by severity | `debugger` OR `code-reviewer` |

#### Operational Commands
| Command | Purpose | Description |
|---------|---------|-------------|
| `/db-migration` | Database migration workflow | RLS policies, team_id, migration template |
| `/security-review` | OWASP security checklist | Top 10 + project-specific checks |
| `/tdd-feature` | Test-driven development | Red-green-refactor workflow |
| `/week-update` | Progress documentation | Weekly update template |

**Full workflow docs**: [docs/processes/MAKER_WORKFLOW.md](docs/processes/MAKER_WORKFLOW.md)

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

### React Grab (Frontend Speed Boost)

**66% faster UI changes, 33% less tokens** by giving Claude exact file paths.

**Install** (Dev Only):
```bash
cd next-app && npm install react-grab --save-dev
```

**Setup** - Add to `next-app/src/app/layout.tsx`:
```tsx
import { ReactGrab } from 'react-grab'

// In your layout, add conditionally:
{process.env.NODE_ENV === 'development' && <ReactGrab />}
```

**Usage**:
1. Run dev server → Click any element in browser
2. Copy component stack (shows file paths + line numbers)
3. Paste into Claude prompt

**Best For**: Spacing/layout tweaks, minor visual changes, finding component files.

⚠️ **DEV ONLY** - Never use in production. Link: https://www.react-grab.com/

---

## 🤖 Multi-Agent Orchestration

### When to Use Multiple Agents
| Scenario | Pattern | Example |
|----------|---------|---------|
| Feature needs multiple specializations | **Parallel** | UI + Types + Schema |
| Output of one feeds another | **Sequential** | Design → Implement → Test |
| Critical feature needs QA | **Review Gate** | Implement → Security Audit → Review |
| Uncertain scope | **Exploration** | Explore → Plan → Implement |

### Parallel Execution (SINGLE message)
Launch independent agents together for maximum efficiency:
```
"Launch frontend-developer and typescript-pro in parallel:
- frontend-developer: Build ReactFlow canvas
- typescript-pro: Create node/edge types"
```

### Sequential Pipeline
When agents depend on each other:
1. `api-architect` → Design endpoint structure
2. `typescript-pro` → Create types from design
3. `test-automator` → Write tests (TDD)
4. `frontend-developer` → Build consuming UI

### Context Handoff Template
When switching agents mid-feature:
```
Previous: [agent-name] completed:
- [What was done]
- Files: [paths modified]
- Decisions: [key choices made]

Next: [agent-name] should:
- [Specific tasks]
- Build upon: [what to use]
- Constraints: [limitations]
```

### Failure Recovery
If an agent produces poor results:
1. Review output, identify specific issues
2. Provide corrective context
3. Re-launch with more specific instructions

---

## 🧠 Context Management

### When to Reset Context (`/clear`)
- After 50+ tool calls in a session
- Switching between unrelated features
- Before complex multi-file changes
- When Claude "forgets" earlier decisions

### Sub-Agent Pattern
Use Task tool to preserve main context:

| Task Type | Agent | Benefit |
|-----------|-------|---------|
| Complex search | `Explore` | Doesn't pollute main context |
| Architecture design | `Plan` | Isolated decision-making |
| Code quality | `code-reviewer` | Fresh perspective |
| Debug issues | `debugger` | Focused investigation |

### Context Preservation Tips
- Reference file paths explicitly (use React Grab!)
- Summarize decisions before complex operations
- Use TodoWrite for multi-step tasks
- Break large features into smaller commits

---

## 🔀 Git Workflow

### Branch Naming
| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/mind-mapping-canvas` |
| Bug fix | `fix/description` | `fix/dependency-cycle` |
| Docs | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/timeline-component` |

### Rules
- ❌ Never commit directly to `main`
- ✅ Create branch → implement → PR → merge
- ✅ Use descriptive branch names
- ✅ One feature per branch

### Commit Message Format
```
feat: add mind mapping canvas with ReactFlow
fix: resolve circular dependency detection
docs: update API reference for work items
refactor: extract timeline utils to separate module
```

### Parallel Development (Git Worktrees)
Work on multiple features simultaneously:
```bash
# Create worktree for parallel feature
git worktree add ../feature-x feat/feature-x

# Work in separate directory
cd ../feature-x

# Remove when done
git worktree remove ../feature-x
```

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

### Key Features (15 Modules)

| Module | Week | Status | Description |
|--------|------|--------|-------------|
| **Foundation & Multi-Tenancy** 🏗️ | 1-2 | ✅ 100% | Auth, teams, RLS, base schema |
| **Mind Mapping** 🧠 | 3 | ✅ 100% | XYFlow canvas, 5 node types, convert to features |
| Feature Planning 📋 | 4 | ⚠️ 80% | CRUD, timeline breakdown, rich text |
| Dependency Management 🔗 | 4 | ⚠️ 80% | Visual graph, 4 link types (critical path pending) |
| **Team Management** 👥 | 5 | ✅ 100% | Invitations, roles, phase assignments |
| **Work Items UI** 📝 | 5 | ✅ 100% | Full CRUD, product tasks, dual canvas |
| Timeline Visualization 📅 | 6 | ❌ 0% | Gantt chart, swimlanes, drag-to-reschedule |
| Project Execution 🚀 | 6 | ❌ 0% | Team assignment, status tracking |
| Collaboration 🤝 | 6 | ❌ 0% | Real-time editing, live cursors (Pro) |
| **Analytics & Metrics** 📊 | 7 | ✅ 95% | 4 pre-built dashboards, custom builder (Pro) |
| **AI Assistant** 🤖 | 7 | ✅ 95% | Chat panel, agentic mode, 20+ tools |
| **Workspace Modes** 🎯 | 7 | ✅ 100% | 4 lifecycle modes, progressive forms, templates |
| **Strategy Alignment** 🎯 | 7 | ✅ 100% | OKR/Pillar hierarchy, drag-drop, AI suggestions |
| **Knowledge Base** 📚 | 7 | ✅ 90% | RAG, pgvector, L2-L4 compression |
| Review & Feedback 👥 | 7 | ✅ 100% | Public forms, voting, insights dashboard |
| Billing & Testing 💳 | 8 | ❌ 0% | Stripe integration, E2E test suite |

---

## 🏛️ PLATFORM ARCHITECTURE (Core Concepts)

### Two-Layer System

The platform uses a **two-layer architecture** (NOT three):

```
WORKSPACE (Aggregation View)
├── mode: development | launch | growth | maintenance
├── Shows: Phase DISTRIBUTION across all work items
│   Example: "10 in research, 15 in planning, 8 in execution..."
│
└── WORK ITEMS (Individual Phase Tracking)
    ├── phase: research | planning | execution | review | complete
    │         ↑ THIS IS THE STATUS - No separate status field!
    │
    └── TIMELINE ITEMS (MVP/SHORT/LONG breakdowns)
        └── status: not_started | in_progress | blocked | completed | on_hold | cancelled
                    ↑ Separate status for task-level execution tracking
```

### Phase vs Status Clarification

| Entity | Phase/Status Field | Purpose |
|--------|-------------------|---------|
| **Work Item** | `phase` (IS the status) | Lifecycle stage: research → planning → execution → review → complete |
| **Timeline Item** | `status` (separate field) | Task execution: not_started, in_progress, blocked, completed, on_hold, cancelled |
| **Workspace** | NO phase/status field | Shows DISTRIBUTION of work item phases |

**Critical**: Work items do NOT have a separate `status` field. The `phase` field serves as both the lifecycle stage AND the status.

### Design Thinking as Methodology

Design Thinking is a **human-centered, iterative methodology** that guides HOW to work at each phase:

| What It IS | What It Is NOT |
|------------|-----------------|
| Methodology/framework for problem-solving | Lifecycle stages or phases |
| Guides the approach at each phase | Replacement for work item phases |
| Provides tools (empathy maps, prototyping, testing) | Status tracking mechanism |
| Informs AI suggestions and guiding questions | Workspace mode |

**Major Frameworks**:
- **Stanford d.school**: Empathize → Define → Ideate → Prototype → Test
- **Double Diamond**: Discover → Define → Develop → Deliver
- **IDEO HCD**: Inspiration → Ideation → Implementation
- **IBM Enterprise**: The Loop + Hills, Playbacks, Sponsor Users

**Platform Integration**: AI actively suggests Design Thinking methods, shows guiding questions as tooltips, and references case studies for inspiration.

### Strategy Levels (Four-Tier Hierarchy)

The platform supports a **phase-agnostic** strategy system with four levels:

```
ORGANIZATION STRATEGY (Pillars - Team-wide)
    └── TEAM STRATEGY (Objectives - Department)
         └── WORK ITEM STRATEGY (Alignment - Feature)
              └── PROCESS STRATEGY (Methodology - Execution)
```

| Level | Name | Fields | Display Context |
|-------|------|--------|-----------------|
| **Pillar** | Organization-wide theme | user_stories, case_studies, examples | Full tree view at org level |
| **Objective** | Team/department goal | metrics, owners | Nested under pillar |
| **Key Result** | Measurable outcome | target, actual | Progress indicators |
| **Initiative** | Specific action | timeline, assignees | Task-like cards |

**Different Displays**:
- **Organization Level**: Full strategy tree, high-level metrics, user stories, case studies
- **Work Item Level**: Derived/aligned strategies only, alignment strength (weak/medium/strong), actionable view

### Workspace Mode vs Phase

| Concept | Definition | Applies To | Values |
|---------|------------|------------|--------|
| **Workspace Mode** | Lifecycle context for the project | Workspace (aggregation) | development, launch, growth, maintenance |
| **Work Item Phase** | Lifecycle stage/status of individual item | Work Item | research, planning, execution, review, complete |

**Mode Influences**:
- Default phase for new work items
- Type weight focus (e.g., maintenance mode prioritizes bugs)
- Form field visibility
- Template suggestions

**Phase Does NOT**:
- Have a "workspace phase" or "workspace stage"
- Determine mode (mode is set explicitly by user)
- Aggregate across items (workspace shows distribution)

### Phase Upgrade Prompting

**When to Prompt**: Real-time as fields are filled, when 80% threshold reached

| Aspect | Details |
|--------|---------|
| **Threshold** | 80% field completion for current phase |
| **Level** | Work item level (NOT workspace level) |
| **Frequency** | Real-time as fields are filled |
| **UI Location** | Banner in work item detail header |
| **Calculation** | Based on required fields for phase transition |

**Phase Transition Requirements**:

| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| research → planning | `purpose` filled, 1+ timeline items OR scope defined | Ready to plan |
| planning → execution | `target_release`, `acceptance_criteria`, `priority`, `estimated_hours` | Planning complete |
| execution → review | `progress_percent` >= 80, `actual_start_date` set | Work substantially done |
| review → complete | Feedback addressed, `status` = 'completed' | Approved |

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
├── implementation/         # Week-by-week progress (11 files)
│   ├── README.md          # Main implementation entry point
│   ├── week-X-Y.md        # Add all week-related work HERE
│   ├── database-schema.md # Schema reference
│   ├── postponed-features.md
│   └── advanced-ai-system/ # Advanced AI documentation
├── reference/              # Technical references (15 files)
│   ├── API_REFERENCE.md   # Consolidate all API docs HERE
│   ├── ARCHITECTURE.md    # System design
│   ├── CODE_PATTERNS.md   # Code examples
│   ├── CHANGELOG.md       # Migration history
│   ├── MCP_USAGE_GUIDE.md # MCP examples
│   ├── PHASE_PERMISSIONS_GUIDE.md
│   └── SHADCN_REGISTRY_COMPONENT_GUIDE.md
├── planning/               # Project management (7 files)
│   ├── PROGRESS.md        # Weekly progress tracking
│   ├── NEXT_STEPS.md      # Immediate priorities
│   ├── MASTER_IMPLEMENTATION_ROADMAP.md
│   └── RECOMMENDED_AGENTS.md
├── research/               # Architecture decisions & research (12 files)
│   ├── architecture-decisions/
│   ├── core-research/
│   └── supporting-research/
├── postponed/              # Deferred feature specs (6 files)
│   └── [FEATURE_NAME].md
├── testing/                # Testing & security
│   └── SECURITY_AUDIT_REPORT.md
└── processes/              # How-to guides (5 files)
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
- ✅ **`team_id TEXT NOT NULL`** in all multi-tenant tables (NULL breaks RLS silently!)
- ✅ TypeScript strict mode, no `any`
- ✅ shadcn/ui components only
- ✅ Mobile-first design
- ✅ Check Pro tier feature gates

### Never
- ❌ UUID for IDs
- ❌ Skip RLS policies
- ❌ Skip team_id filtering
- ❌ Allow NULL team_id (causes silent RLS failures with empty `{}` errors)
- ❌ Custom CSS files
- ❌ Hardcode API keys

---

**Ready to build! 🚀**

See [docs/implementation/README.md](docs/implementation/README.md) for detailed implementation steps.
