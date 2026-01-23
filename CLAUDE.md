<!-- OPENSPEC:START -->
# OpenSpec Instructions

Open `@/openspec/AGENTS.md` when request mentions: proposals, specs, breaking changes, architecture shifts, or is ambiguous.

<!-- OPENSPEC:END -->

# Project Guidelines

**Project**: Product Lifecycle Management Platform
**Stack**: Next.js 16.1.3 + TypeScript + Supabase + Vercel
**Status**: Week 7/12 (95% complete)
**Canonical Architecture**: [docs/ARCHITECTURE_CONSOLIDATION.md](docs/ARCHITECTURE_CONSOLIDATION.md)

### Mission

Transform roadmap manager into **Product Lifecycle Management Platform**:

1. **Research & Ideate** - AI-powered mind mapping, web search, knowledge base
2. **Plan & Structure** - Features, timeline, dependencies
3. **Review & Gather Feedback** - Stakeholder input (invite-based, public links, iframe)
4. **Execute Collaboratively** - Team assignment, task tracking, real-time collaboration
5. **Test & Iterate** - User feedback collection and analysis
6. **Measure Success** - Analytics, expected vs actual performance tracking

---

## TIER 1: ABSOLUTE RULES

<critical>
These rules apply to EVERY action. Violations cause production bugs.
</critical>

### Data Integrity

```typescript
// ALWAYS - No exceptions
const id = Date.now().toString()          // NEVER use UUID
const query = supabase.from('table')
  .select('*')
  .eq('team_id', teamId)                  // NEVER skip team_id filter

// Migration template - ALL tables need these
CREATE TABLE table_name (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,                  -- NULL breaks RLS silently!
  -- other fields
);
CREATE INDEX idx_table_team ON table_name(team_id);
-- RLS policies for SELECT/INSERT/UPDATE/DELETE required
```

**Full patterns**: [docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)

### Architecture Guardrails

<reasoning>
Before implementing: Does this contradict established architecture?
If yes: STOP. Question the user. "We decided X. Why change to Y?"
</reasoning>

| Decision | Correct | WRONG |
|----------|---------|-------|
| **Phase vs Status** | `phase` field IS the status for work items | Separate `status` field |
| **Workspace Display** | Shows phase DISTRIBUTION (aggregation) | Single stage/phase value |
| **Timeline Items** | Have SEPARATE `status` field | Share status with work items |
| **Design Thinking** | METHODOLOGY for how to work | Lifecycle stages |
| **Strategy Display** | DIFFERENT at org vs work-item level | Same everywhere |
| **Phase Upgrades** | Prompted at WORK ITEM level (80%) | Workspace level |

#### Example Corrections

**User**: "Let's add a status field to work items"
**Claude**: "Wait - we established that `phase` IS the status for work items. They're the same field. Timeline items have separate status for task-level tracking. Are you sure you want to change this?"

**User**: "The workspace should show which stage it's in"
**Claude**: "We decided workspaces show phase DISTRIBUTION, not a single stage. Each work item has its own phase. The workspace shows '10 in research, 15 in planning...' - why would we want a single stage value?"

**User**: "Design Thinking should be our lifecycle stages"
**Claude**: "Design Thinking is a METHODOLOGY for HOW to work at each phase, not lifecycle stages. The phases are: research → planning → execution → review → complete. Design Thinking guides the APPROACH. Did you want to reconsider this?"

### UI/Code Standards

| DO | DON'T |
|----|-------|
| `import { X } from '@/components/ui/x'` (shadcn/ui) | Custom CSS files |
| Tailwind classes, mobile-first | Inline styles |
| TypeScript strict mode, interfaces | `any` type |
| Explicit error handling | Silent failures |

---

## TIER 2: WORKFLOW & DECISIONS

### Before Any Implementation

<verification_checklist>
1. [ ] Read existing code first (NEVER propose changes to unread files)
2. [ ] Check 5-Question Framework below
3. [ ] Use TodoWrite for multi-step tasks
4. [ ] Create branch: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`
</verification_checklist>

### 5-Question Framework

| # | Question | If NO |
|---|----------|-------|
| 1 | Data dependencies exist and stable? | POSTPONE |
| 2 | Module APIs defined and stable? | PARTIAL impl |
| 3 | Provides standalone user value? | POSTPONE |
| 4 | Database schema finalized? | PARTIAL impl |
| 5 | Can be fully tested? | POSTPONE |

| Result | Action |
|--------|--------|
| All ✅ | **PROCEED** - Full implementation |
| Some ❌ | **PARTIAL** - Build foundation, enhance later |
| Many ❌ | **POSTPONE** - Document in [docs/postponed/](docs/postponed/) |

### Phase Transition Requirements

| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| research → planning | `purpose` filled, 1+ timeline items OR scope defined | Ready to plan |
| planning → execution | `target_release`, `acceptance_criteria`, `priority`, `estimated_hours` | Planning complete |
| execution → review | `progress_percent` >= 80, `actual_start_date` set | Work substantially done |
| review → complete | Feedback addressed, `status` = 'completed' | Approved |

### Git Workflow

**Rule**: Main branch is ALWAYS production-ready. Never commit directly to main.

| Step | Command |
|------|---------|
| 1. Start fresh | `git checkout main && git pull` |
| 2. Create branch | `git checkout -b feat/name` |
| 3. Develop | Code → `git add` → `git commit -m "feat: ..."` |
| 4. Push | `git push -u origin feat/name` |
| 5. Create PR | `gh pr create --title "..." --body "..."` |
| 6. Self-review | Review diff on GitHub, fix issues |
| 7. Merge | `gh pr merge --squash` |

#### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/work-item-review-system` |
| Bug fix | `fix/description` | `fix/timeline-calculation-loop` |
| Docs | `docs/description` | `docs/update-api-reference` |
| Refactor | `refactor/description` | `refactor/auth-service` |
| Test | `test/description` | `test/e2e-workspace-crud` |

#### Commit Message Format

```
<type>: <short description (50 chars max)>

[Optional body explaining WHY]
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Good**: `feat: add dark mode toggle to user settings`
**Bad**: `Update files`, `fix bug`, `changes`, `WIP`

**Full guide**: [docs/reference/DEVELOPER_WORKFLOW.md](docs/reference/DEVELOPER_WORKFLOW.md)

---

## TIER 3: MULTI-AGENT ORCHESTRATION

### When to Use Multiple Agents

| Scenario | Pattern | Example |
|----------|---------|---------|
| Feature needs multiple specializations | **Parallel** | UI + Types + Schema |
| Output of one feeds another | **Sequential** | Design → Implement → Test |
| Critical feature needs QA | **Review Gate** | Implement → Security Audit → Review |
| Uncertain scope | **Exploration** | Explore → Plan → Implement |

### Parallel Execution (SINGLE message)

Launch independent agents together:
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

### Context Management

**When to `/clear`**:
- After 50+ tool calls in a session
- Switching between unrelated features
- Before complex multi-file changes
- When Claude "forgets" earlier decisions

**Sub-Agent Pattern** (preserve main context):

| Task Type | Agent | Benefit |
|-----------|-------|---------|
| Complex search | `Explore` | Doesn't pollute main context |
| Architecture design | `Plan` | Isolated decision-making |
| Code quality | `code-reviewer` | Fresh perspective |
| Debug issues | `debugger` | Focused investigation |

**Context Preservation Tips**:
- Reference file paths explicitly (use React Grab!)
- Summarize decisions before complex operations
- Use TodoWrite for multi-step tasks
- Break large features into smaller commits

---

## TIER 4: ARCHITECTURE DETAILS

### Two-Layer System

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

| Entity | Field | Purpose |
|--------|-------|---------|
| **Work Item** | `phase` (IS the status) | Lifecycle: research → planning → execution → review → complete |
| **Timeline Item** | `status` (separate) | Task execution: not_started, in_progress, blocked, completed |
| **Workspace** | NO phase/status | Shows DISTRIBUTION of work item phases |

**Critical**: Work items do NOT have a separate `status` field. The `phase` field serves as both lifecycle stage AND status.

### Workspace Mode vs Phase

| Concept | Definition | Applies To | Values |
|---------|------------|------------|--------|
| **Workspace Mode** | Lifecycle context for project | Workspace | development, launch, growth, maintenance |
| **Work Item Phase** | Stage/status of individual item | Work Item | research, planning, execution, review, complete |

**Mode Influences**: Default phase for new items, type weight focus, form field visibility, template suggestions

**Phase Does NOT**: Have "workspace phase", determine mode, aggregate across items

### Strategy Levels (Four-Tier Hierarchy)

```
ORGANIZATION STRATEGY (Pillars - Team-wide)
    └── TEAM STRATEGY (Objectives - Department)
         └── WORK ITEM STRATEGY (Alignment - Feature)
              └── PROCESS STRATEGY (Methodology - Execution)
```

| Level | Name | Display Context |
|-------|------|-----------------|
| **Pillar** | Organization-wide theme | Full tree at org level |
| **Objective** | Team/department goal | Nested under pillar |
| **Key Result** | Measurable outcome | Progress indicators |
| **Initiative** | Specific action | Task-like cards |

**Different Displays**: Org level shows full tree with case studies; Work item level shows aligned strategies with strength indicators.

### Design Thinking as Methodology

Design Thinking guides HOW to work at each phase (NOT lifecycle stages):

| What It IS | What It Is NOT |
|------------|-----------------|
| Methodology for problem-solving | Lifecycle stages or phases |
| Guides approach at each phase | Replacement for phases |
| Provides tools (empathy maps, prototyping) | Status tracking |

**Frameworks**: Stanford d.school (Empathize → Define → Ideate → Prototype → Test), Double Diamond, IDEO HCD, IBM Enterprise

**Platform Integration**: AI suggests methods, shows guiding questions as tooltips, references case studies.

---

## TIER 5: PROJECT REFERENCE

### Current Module Status

| Module | Week | Status | Description |
|--------|------|--------|-------------|
| **Foundation & Multi-Tenancy** | 1-2 | ✅ 100% | Auth, teams, RLS, base schema |
| **Mind Mapping** | 3 | ✅ 100% | XYFlow canvas, 5 node types |
| **Endless Canvas** | 7 | ✅ 95% | BlockSuite standalone editor |
| Feature Planning | 4 | ⚠️ 80% | CRUD, timeline, rich text |
| Dependency Management | 4 | ⚠️ 80% | Visual graph, 4 link types |
| **Team Management** | 5 | ✅ 100% | Invitations, roles, phases |
| **Work Items UI** | 5 | ✅ 100% | Full CRUD, dual canvas |
| Timeline Visualization | 6 | ❌ 0% | Gantt chart, swimlanes |
| Project Execution | 6 | ❌ 0% | Team assignment, tracking |
| Collaboration | 6 | ❌ 0% | Real-time editing (Pro) |
| **Analytics & Metrics** | 7 | ✅ 95% | 4 dashboards, custom builder |
| **AI Assistant** | 7 | ✅ 95% | Chat panel, 20+ tools |
| **Workspace Modes** | 7 | ✅ 100% | 4 lifecycle modes |
| **Strategy Alignment** | 7 | ✅ 100% | OKR/Pillar hierarchy |
| **Knowledge Base** | 7 | ✅ 90% | RAG, pgvector |
| Review & Feedback | 7 | ✅ 100% | Public forms, voting |
| Billing & Testing | 8 | ❌ 0% | Stripe, E2E suite |

**Full progress**: [docs/planning/PROGRESS.md](docs/planning/PROGRESS.md)

### Tech Stack

```
Framework:    Next.js 16.1.3 + TypeScript (App Router, Server Components)
Database:     Supabase (PostgreSQL + Real-time + Auth + RLS)
UI:           shadcn/ui + Tailwind CSS + Lucide React
Mind Mapping: XYFlow/ReactFlow + BlockSuite 0.19.5 (custom nodes, AI-powered)
Charts:       Recharts (10+ chart types)
Testing:      Playwright (E2E, Chromium-only CI)
Code Review:  Greptile (AI-powered PR reviews)
Payments:     Stripe (Checkout, Subscriptions, Webhooks)
Email:        Resend (Invitations, notifications)
AI:           Vercel AI SDK 6.x + OpenRouter (multi-model)
State:        Zustand + React Query
Deployment:   Vercel (Serverless)
CI/CD:        GitHub Actions + Bun
```

### AI Model Routing

| Capability | Primary | Fallback | Tertiary |
|------------|---------|----------|----------|
| Strategic Reasoning | GLM 4.7 | DeepSeek V3.2 | Gemini 3 Flash |
| Agentic Tool Use | GLM 4.7 | Gemini 3 Flash | MiniMax M2.1 |
| Coding | MiniMax M2.1 | GLM 4.7 | Kimi K2 |
| Visual Reasoning | Gemini 3 Flash | Grok 4 Fast | GPT-4o |
| Large Context | Grok 4.1 Fast | Gemini 3 Flash | Kimi K2 |
| Default Chat | Kimi K2 | GLM 4.7 | MiniMax M2.1 |

**AVOID**: Claude Sonnet models (too costly for this project)

**Full AI architecture**: [docs/implementation/week-7/advanced-ai-system/AI_TOOL_ARCHITECTURE.md](docs/implementation/week-7/advanced-ai-system/AI_TOOL_ARCHITECTURE.md)

### Database Schema Overview

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core** | `users`, `teams`, `team_members`, `subscriptions`, `workspaces` | Auth, multi-tenancy, billing |
| **Features** | `work_items`, `timeline_items`, `linked_items`, `product_tasks` | Roadmap items, dependencies |
| **Mind Mapping** | `mind_maps`, `work_flows` | Canvas data, sub-canvases |
| **Endless Canvas** | `blocksuite_documents` | BlockSuite canvas persistence |
| **Phases** | `user_phase_assignments`, `phase_assignment_history`, `phase_access_requests` | Phase permissions |
| **Feedback** | `feedback` | User/stakeholder feedback |

**Full schema**: [docs/architecture/database-schema.md](docs/architecture/database-schema.md)

### Domain Terminology

| Concept | DB Table | UI Label |
|---------|----------|----------|
| Organization | `team` | "Team" |
| Product/Project | `workspace` | "Workspace" |
| Feature/Bug/etc | `work_item` | "Work Item" |
| Timeline breakdown | `timeline_item` | "Timeline" |
| Execution task | `product_task` | "Task" |
| Dependency | `linked_item` | "Dependency" |

**Anti-patterns** (NEVER use):
- `feature` table → use `work_item`
- `task` for timeline → use `timeline_item`
- `project` → use `workspace`
- `ticket`, `story` → use `work_item`

---

## TIER 6: COMMANDS & SKILLS

### MCP Servers

| Server | Purpose | When to Use |
|--------|---------|-------------|
| **Supabase** | Migrations, queries, RLS, types | Database operations |
| **shadcn/ui** | Component installation | Adding UI components |
| **Context7** | Library documentation | Before implementing library features |

#### Context7 Usage

Use Context7 when you need current documentation:
- Before implementing a new library feature
- When official docs may have changed since training
- To verify API signatures and patterns

```
"Use Context7 to fetch the latest Next.js 15 App Router documentation"
"Use Context7 to get current Supabase RLS policy examples"
```

#### shadcn/ui MCP Setup

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

### Skills (Auto-Invoke)

| Skill | Purpose | Trigger |
|-------|---------|---------|
| **parallel-ai** | Web search, extraction, research | ALL web operations (MANDATORY) |
| **webapp-testing** | Playwright testing | Testing features (Week 6-8) |
| **frontend-design** | Production-grade UI | Building UI (Week 6-7) |
| **document-skills:xlsx/pdf/docx** | Document generation | Exporting data/reports |
| **systematic-debugging** | 4-phase debugging | Debugging issues |

**NEVER use WebFetch/WebSearch directly. NEVER use claude-code-guide agent. Use parallel-ai skill instead.**

**Rule**: If a skill can help with the current task, USE IT - don't wait to be asked.

### Slash Commands

#### MAKER Commands (Multi-Agent Reliability)

| Command | Purpose | Agents Used |
|---------|---------|-------------|
| `/decompose` | Break task into atomic steps | `Explore` → `Plan` → TodoWrite |
| `/validate-consensus` | K-threshold voting (2/3 approve) | `code-reviewer` + `architect-review` + `security-auditor` |
| `/red-flag-check` | Detect issues by severity | `debugger` OR `code-reviewer` |

#### Operational Commands

| Command | Purpose |
|---------|---------|
| `/db-migration` | RLS policies, team_id, migration template |
| `/security-review` | OWASP Top 10 + project checks |
| `/tdd-feature` | Red-green-refactor workflow |
| `/week-update` | Weekly progress documentation |

#### Phase Workflow Commands

| Phase | Command | Purpose | Next |
|-------|---------|---------|------|
| 1 | `/status-check` | Read PROGRESS.md, select task | `/research-plan` |
| 2 | `/research-plan` | Research, plan, CREATE BRANCH | `/parallel-dev` |
| 3 | `/parallel-dev` | Implement with parallel agents | `/quality-review` |
| 4 | `/quality-review` | Type check, code review, security | `/test` |
| 5 | `/test` | Run E2E tests, fix failures | `/deploy` |
| 6 | `/deploy` | Create PR, WAIT FOR REVIEW | Manual review |
| 7 | `/merge` | Squash-merge after approval | `/status-check` |

**CRITICAL**: `/deploy` does NOT auto-merge. Manual self-review required before `/merge`.

**Command Locations**:
- Commands: `.claude/commands/*.md` - Type `/command-name`
- Skills: `.claude/skills/*/SKILL.md` - Auto-invoked

**Full workflow**: [docs/processes/MAKER_WORKFLOW.md](docs/processes/MAKER_WORKFLOW.md)

---

## TIER 7: COMMON PATTERNS

### Package Manager: Bun (NOT npm)

<critical>
**ALWAYS use Bun instead of npm/npx for all commands.**
This project uses Bun as the package manager and runtime. Never use npm or npx.
</critical>

| npm Command | Bun Equivalent |
|-------------|----------------|
| `npm install` | `bun install` |
| `npm run dev` | `bun run dev` |
| `npm run build` | `bun run build` |
| `npm run test` | `bun run test` |
| `npm run lint` | `bun run lint` |
| `npx playwright` | `bunx playwright` |
| `npx supabase` | `bunx supabase` |
| `npx shadcn-ui` | `bunx shadcn-ui` |

### Quick Commands

```bash
# Dev server (Port 3000 ONLY - kill existing first)
taskkill /F /IM node.exe 2>nul
cd next-app && bun run dev

# Database
bunx supabase db push                  # Apply migrations
bunx supabase gen types typescript     # Generate types

# Testing
bun run test:e2e         # Playwright E2E
bun run test             # Jest unit

# Build & Deploy
bun run build && bun run lint
vercel --prod
```

### Database Migrations

1. Create: `supabase/migrations/YYYYMMDDHHMMSS_*.sql`
2. Include: team_id, indexes, RLS policies (SELECT/INSERT/UPDATE/DELETE)
3. Apply: `bunx supabase db push`
4. Generate types: `bunx supabase gen types typescript > lib/supabase/types.ts`

### Real-time Subscriptions

```typescript
// Use supabase.channel() with team_id filter
const channel = supabase.channel('changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    filter: `team_id=eq.${teamId}`
  }, callback)
  .subscribe()

// Return unsubscribe in useEffect cleanup
return () => { channel.unsubscribe() }
```

### Feature Gates

```typescript
// Check team plan before Pro features
if (team.plan === 'pro') {
  // Show Pro feature
} else {
  // Show upgrade modal
}
```

### UI Patterns

```bash
# Install shadcn/ui components
bunx shadcn-ui@latest add button card dialog form input select table tabs toast
```

```tsx
// ✅ Responsive, mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Avoid inline styles
<div style={{ display: 'flex' }}>
```

**Full patterns**: [docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md)

### React Grab (Frontend Speed Boost)

**66% faster UI changes, 33% less tokens** by giving exact file paths.

```bash
# Install (Dev Only)
cd next-app && bun add react-grab --dev
```

```tsx
// Add to next-app/src/app/layout.tsx
import { ReactGrab } from 'react-grab'

// In layout, add conditionally:
{process.env.NODE_ENV === 'development' && <ReactGrab />}
```

**Usage**: Run dev server → Click element → Copy component stack → Paste into prompt

**DEV ONLY** - Never use in production.

---

## TIER 8: DOCUMENTATION

### File Structure

```
docs/
├── implementation/         # Week-by-week progress
│   ├── README.md          # Main entry point
│   ├── week-X-Y.md        # Add all week work HERE
│   ├── database-schema.md
│   └── advanced-ai-system/
├── reference/              # Technical references
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   ├── CODE_PATTERNS.md
│   ├── CHANGELOG.md
│   └── DEVELOPER_WORKFLOW.md
├── planning/               # Project management
│   ├── PROGRESS.md
│   ├── NEXT_STEPS.md
│   └── MASTER_IMPLEMENTATION_ROADMAP.md
├── postponed/              # Deferred features
└── processes/              # How-to guides
```

### Documentation Rules

**DO**:
- Add implementations to `docs/implementation/week-X-Y.md` immediately
- Consolidate API docs into `docs/reference/API_REFERENCE.md`
- Update week files with full details (what, why, files)
- Delete scattered files after consolidating

**DON'T**:
- Create summary files in root
- Create duplicate documentation
- Skip updating week files
- Leave scattered .md files

### Update Triggers

| Change Type | Update These Files |
|-------------|-------------------|
| Database table/column | `docs/reference/CHANGELOG.md` |
| API endpoint | `docs/reference/API_REFERENCE.md` |
| Feature completion | `docs/planning/PROGRESS.md` + `week-X.md` |
| Architecture change | `docs/architecture/ARCHITECTURE.md` |
| Postponed feature | `docs/postponed/[NAME].md` |
| Tech stack change | `README.md` + `CLAUDE.md` |

### File Creation Rules

| Need | Location | Convention |
|------|----------|------------|
| Migration | `supabase/migrations/` | `YYYYMMDDHHMMSS_[action]_[table].sql` |
| API route | `next-app/src/app/api/[resource]/` | `route.ts` |
| Component | `next-app/src/components/[feature]/` | `[name].tsx` |
| Types | `next-app/src/lib/types/` | **EXTEND** existing file |
| Week docs | `docs/implementation/` | Add to `week-X-Y.md` |

**Never Create - Always Extend**:
- `FEATURE_SUMMARY.md` → add to `week-X.md`
- `API_ROUTES.md` → add to `API_REFERENCE.md`
- `newFeature.ts` → extend existing types file

### Documentation Links

#### Primary (Read First)

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE_CONSOLIDATION.md](docs/ARCHITECTURE_CONSOLIDATION.md) | **Canonical source of truth** |
| [docs/implementation/README.md](docs/implementation/README.md) | Week-by-week guide |
| [docs/planning/PROGRESS.md](docs/planning/PROGRESS.md) | Current status |
| [docs/planning/NEXT_STEPS.md](docs/planning/NEXT_STEPS.md) | Immediate priorities |

#### Reference (As Needed)

| Doc | Purpose |
|-----|---------|
| [docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md) | 20+ API routes |
| [docs/reference/CODE_PATTERNS.md](docs/reference/CODE_PATTERNS.md) | TypeScript, Supabase patterns |
| [docs/reference/DEVELOPER_WORKFLOW.md](docs/reference/DEVELOPER_WORKFLOW.md) | Full workflow tutorial |
| [docs/reference/PHASE_PERMISSIONS_GUIDE.md](docs/reference/PHASE_PERMISSIONS_GUIDE.md) | Phase-based access |
| [docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md](docs/reference/SHADCN_REGISTRY_COMPONENT_GUIDE.md) | 14 registries, 1000+ components |
| [docs/reference/MCP_USAGE_GUIDE.md](docs/reference/MCP_USAGE_GUIDE.md) | MCP examples |

#### External Docs

- [Next.js 15](https://nextjs.org/docs) | [Supabase](https://supabase.com/docs) | [shadcn/ui](https://ui.shadcn.com)
- [ReactFlow](https://reactflow.dev) | [Playwright](https://playwright.dev) | [Stripe](https://stripe.com/docs)

---

## SELF-VERIFICATION

<before_commit>
- [ ] No `any` types added?
- [ ] All queries filter by `team_id`?
- [ ] RLS policies if new table?
- [ ] No hardcoded secrets?
- [ ] No custom CSS files?
- [ ] Mobile-first responsive?
</before_commit>

<before_pr>
- [ ] Branch follows convention? (`feat/`, `fix/`, etc.)
- [ ] Commit messages: `type: description`?
- [ ] Self-reviewed diff on GitHub?
- [ ] Updated [docs/planning/PROGRESS.md](docs/planning/PROGRESS.md)?
- [ ] Updated [docs/implementation/week-X.md](docs/implementation/)?
</before_pr>

<before_new_file>
- [ ] Is there an existing file to extend instead?
- [ ] Does location match directory structure?
- [ ] Does filename follow naming convention?
- [ ] For docs: Should this be in week-X.md?
- [ ] For types: Can this extend existing [feature]-types.ts?

If ANY fails → DO NOT CREATE, extend existing file.
</before_new_file>

---

## ERROR HANDLING

**Uncertain about approach?**
→ Use `Explore` agent to investigate, then `Plan` agent

**Contradicting user request?**
→ STOP. Quote established architecture. Ask "Why change this?"

**Missing context?**
→ Ask user directly via AskUserQuestion tool

**Test failures?**
→ Read error, fix issue, re-run. Never skip tests.

**RLS returning empty `{}`?**
→ Check: team_id NOT NULL? RLS policy exists? team_id filter in query?

**Agent produces poor results?**
1. Review output, identify specific issues
2. Provide corrective context
3. Re-launch with more specific instructions

---

## CRITICAL REMINDERS

### Always

- ✅ Timestamp IDs: `Date.now().toString()`
- ✅ Filter by `team_id` in ALL queries
- ✅ Enable RLS on ALL tables
- ✅ `team_id TEXT NOT NULL` (NULL breaks RLS silently!)
- ✅ TypeScript strict mode, no `any`
- ✅ shadcn/ui components only
- ✅ Mobile-first design
- ✅ Check Pro tier feature gates

### Never

- ❌ UUID for IDs
- ❌ Skip RLS policies
- ❌ Skip team_id filtering
- ❌ Allow NULL team_id
- ❌ Custom CSS files
- ❌ Hardcode API keys
- ❌ WebFetch/WebSearch directly (use parallel-ai)
- ❌ npm or npx commands (use bun/bunx)

---

**Ready to build!**

Start with [docs/implementation/README.md](docs/implementation/README.md) for implementation steps.
