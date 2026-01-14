# Master Implementation Roadmap

**Last Updated**: 2025-12-01
**Purpose**: Complete dependency graph and implementation sequence for future features
**Status**: Planning Document - Not Yet Implemented

---

## Table of Contents

1. [Purpose & Scope](#purpose--scope)
2. [Architecture Layers](#architecture-layers)
3. [Dependency Graph](#dependency-graph)
4. [Critical Path Analysis](#critical-path-analysis)
5. [Database Migration Order](#database-migration-order)
6. [Phase Execution Timeline](#phase-execution-timeline)
7. [Success Criteria by Phase](#success-criteria-by-phase)
8. [Risk Mitigation Strategy](#risk-mitigation-strategy)
9. [Related Documentation](#related-documentation)

---

## Purpose & Scope

This document serves as the **master planning roadmap** for all future features beyond Week 8. It maps out:

- **Architecture layers** from foundation to advanced features
- **Dependency relationships** between features (what blocks what)
- **Implementation sequence** to minimize rework
- **Database migration order** to avoid schema conflicts
- **Critical path** for fastest time-to-value

**Key Principle**: Build features in dependency order to avoid rework and technical debt.

---

## Architecture Layers

### LAYER 0: FOUNDATION (Already Built) ✅

**Status**: 100% Complete (Weeks 1-7)

| Component | Description | Status |
|-----------|-------------|--------|
| Multi-tenancy | Teams, users, workspaces with RLS | ✅ Complete |
| Work Items | 4-type system (concept/feature/bug/enhancement) | ✅ Complete |
| Timeline Items | MVP/SHORT/LONG breakdown | ✅ Complete |
| Phase System | Research → Review → Execute → Complete | ✅ Core Complete (Enhancements in progress) |
| Mind Mapping | ReactFlow canvas with 5 node types | ✅ Complete |
| Product Tasks | Two-track system (standalone + linked) | ✅ Complete |
| Resources Module | References, inspiration, documentation links | ✅ Complete |
| AI Integration | Vercel AI SDK + OpenRouter + tool calling | ✅ Complete (95%) |
| Authentication | Supabase Auth with RLS | ✅ Complete |

**Dependencies Satisfied**: None (foundation complete)

**Blocks**: Everything in Layers 1-6

---

### LAYER 0.5: PHASE SYSTEM ENHANCEMENT (In Progress) 🔄

**Status**: Architecture Finalized, Implementation Pending (6 sessions)
**Reference**: [docs/ARCHITECTURE_CONSOLIDATION.md](../../ARCHITECTURE_CONSOLIDATION.md)

**Purpose**: Enhance phase system with validation, readiness prompts, workspace analysis, and Design Thinking integration

**Total Effort**: ~44-56 hours (6 implementation sessions)

#### Session Dependencies & File Structure

```
SESSION 1: Fix Phase Bugs & Validation (CRITICAL) 🔴
├── Files to Modify:
│   ├── workspace-phases.tsx (fix calculation overlap)
│   ├── work-item-types.ts (add validation)
│   └── phase-aware-form-fields.tsx (add field validation)
├── Database Changes:
│   └── Add phase_transitions JSONB to work_items
└── Blocks: Session 2 (readiness calculation depends on validation)

SESSION 2: Phase Readiness & Upgrade Prompts
├── Files to Create:
│   ├── lib/phase-readiness.ts
│   └── components/work-items/phase-upgrade-prompt.tsx
├── Depends on: Session 1 (validation logic)
└── Blocks: Session 6 (polish depends on prompts working)

SESSION 3: Workspace Analysis
├── Files to Create:
│   ├── lib/workspace-analyzer.ts
│   ├── components/workspaces/workspace-health-card.tsx
│   └── app/api/workspaces/[id]/analyze/route.ts
├── Depends on: Session 1 (needs valid phase data)
└── Blocks: Session 6 (workspace card update)

SESSION 4: Design Thinking Integration
├── Files to Create:
│   ├── lib/design-thinking/frameworks.ts
│   ├── lib/design-thinking/method-suggestions.ts
│   └── components/work-items/methodology-guidance.tsx
├── Files to Modify:
│   └── AI chat system prompt
├── Depends on: None (independent)
└── Blocks: None (UI enhancement)

SESSION 5: Strategy Customization
├── Files to Create:
│   ├── migrations/YYYYMMDDHHMMSS_add_strategy_user_fields.sql
│   ├── components/strategies/strategy-organization-view.tsx
│   └── components/strategies/strategy-work-item-view.tsx
├── Files to Modify:
│   └── lib/types/strategy-types.ts
├── Depends on: Existing strategy system (already built)
└── Blocks: None (enhancement to existing feature)

SESSION 6: Polish & Testing
├── Files to Modify:
│   ├── feedback-convert-dialog.tsx (pre-fill phase)
│   ├── workspace-card.tsx (show distribution)
│   └── e2e/ test files
├── Files to Create:
│   └── docs/reference/PHASE_SYSTEM_GUIDE.md
├── Depends on: Sessions 1-5 (testing all enhancements)
└── Blocks: None (final polish)
```

#### Implementation Order (Critical Path)

**Recommended Sequence**:
1. **Session 1** (CRITICAL) - Must be done first, blocks Sessions 2 & 3
2. **Sessions 2, 4, 5** (PARALLEL) - Can be done simultaneously
3. **Session 3** - After Session 1 validation is fixed
4. **Session 6** - After all other sessions complete

**Minimum Duration**:
- Sequential: 44 hours (~6 days)
- Parallel (2 developers): 28 hours (~4 days)

#### Key Architecture Decisions

**Two-Layer System (NOT Three)**:
- Workspace shows phase DISTRIBUTION across work items (aggregation view)
- Work items have phase field that IS the status (no separate status field)
- Timeline items have separate status field for execution tracking

**Phase Transition Requirements**:
| From → To | Required Fields | Threshold |
|-----------|----------------|-----------|
| research → planning | purpose, 1+ timeline item OR scope | 80% |
| planning → execution | target_release, acceptance_criteria, priority, estimated_hours | 80% |
| execution → review | progress_percent >= 80, actual_start_date | 80% |
| review → complete | Feedback addressed, status = completed | 100% |

**Design Thinking as Methodology**:
- NOT lifecycle stages, but HOW to work at each phase
- Major frameworks: d.school, Double Diamond, IDEO, IBM
- AI suggests methods based on current phase
- Guiding questions per phase as tooltips

**Strategy Customization**:
- New fields: user_stories[], user_examples[], case_studies[]
- Organization view: Full tree, high-level metrics
- Work item view: Aligned strategies only, strength indicators

#### Known Issues to Fix (Session 1)

| Issue | Severity | File | Lines |
|-------|----------|------|-------|
| Phase calculation overlap | CRITICAL | workspace-phases.tsx | 167-172 |
| No phase transition validation | CRITICAL | work-item-types.ts | N/A |
| No phase transition timestamps | HIGH | work_items table | N/A |
| progress_percent no 0-100 validation | MEDIUM | phase-aware-form-fields.tsx | N/A |

#### Success Criteria

**Session 1 Complete**:
- [ ] Phase calculation logic fixed with tests
- [ ] validatePhaseTransition() function working
- [ ] phase_transitions JSONB column added
- [ ] Field validation enforced

**Session 2 Complete**:
- [ ] Readiness calculator accurate
- [ ] Upgrade prompts show at 80%
- [ ] Guiding questions visible

**Session 3 Complete**:
- [ ] Workspace analysis API working
- [ ] Health card displays correctly
- [ ] Manual refresh functional

**Session 4 Complete**:
- [ ] 4 frameworks documented
- [ ] AI suggests methods per phase
- [ ] Case study examples available

**Session 5 Complete**:
- [ ] New strategy fields populated
- [ ] Organization view shows full tree
- [ ] Work item view shows alignment

**Session 6 Complete**:
- [ ] All E2E tests passing
- [ ] Documentation updated
- [ ] Production-ready

---

### LAYER 1: DEPARTMENTS & STRUCTURE

**Purpose**: Enable team-specific workflows and triage

**Total Effort**: ~3 days

#### 1.1 Departments Table (NEW) 🔴 CRITICAL BLOCKER

**What**: Sub-team organization (Engineering, Design, Product Management, QA, Marketing, Operations)

**Why**: Required for department-specific workflows, custom statuses, and team views

**Effort**: 1 day

**Components**:
- Database: `departments` table
- Fields: `id`, `team_id`, `workspace_id`, `name`, `type`, `color`, `icon`, `lead_user_id`
- Types: `engineering`, `design`, `product`, `qa`, `marketing`, `operations`, `custom`
- RLS policies: Team-scoped access
- API: CRUD endpoints for department management

**Blocks**:
- 1.2 Workflow States
- 1.3 Triage Queue
- 2.x Workspace Modes
- 3.1 Team Templates
- All department-specific customization

**Schema**:
```sql
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('engineering', 'design', 'product', 'qa', 'marketing', 'operations', 'custom')),
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '👥',
  lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add department_id to work_items
ALTER TABLE work_items ADD COLUMN department_id TEXT REFERENCES departments(id) ON DELETE SET NULL;
CREATE INDEX idx_work_items_department ON work_items(department_id);
```

---

#### 1.2 Workflow States (Per-Department)

**What**: Department-specific status workflows

**Why**: Engineering needs "In QA", Design needs "Design Review", Product needs "Prioritization"

**Requires**: 1.1 Departments Table

**Effort**: 1 day

**Components**:
- Database: `workflow_states` table (already exists, needs department_id)
- Default workflows by department type
- Custom workflow editor UI
- Transition rules and validation

**Blocks**:
- 2.2 Mode-Specific Defaults
- 3.x UX Enhancements

**Schema Enhancement**:
```sql
ALTER TABLE workflow_stages ADD COLUMN department_id TEXT REFERENCES departments(id) ON DELETE CASCADE;
CREATE INDEX idx_workflow_stages_department ON workflow_stages(department_id);

-- Default states by department
-- Engineering: Backlog → In Dev → Code Review → In QA → Done
-- Design: Backlog → In Design → Design Review → Ready for Dev → Done
-- Product: Backlog → Prioritization → Planned → In Progress → Done
```

---

#### 1.3 Triage Queue

**What**: Feedback and bug triage workflow for departments

**Why**: Enables structured intake and prioritization

**Requires**: 1.1 Departments Table

**Effort**: 1 day

**Components**:
- UI: Triage board view (Kanban)
- Workflow: Pending → Review → Prioritize → Assign
- Auto-routing: Customer feedback → Support department, Bug → Engineering
- Filters: By department, priority, source

**Blocks**: 4.3 Feature Voting

**Implementation**:
- Reuse existing `feedback` table
- Add `triage_status` field: `pending`, `in_review`, `prioritized`, `assigned`, `converted`
- Create triage view component
- API: Bulk triage operations

---

### LAYER 2: WORKSPACE MODES

**Purpose**: Configure workspaces for different use cases (Startup, Enterprise, Agency)

**Total Effort**: ~5 days

#### 2.1 Mode Column on Workspaces 🔴 CRITICAL BLOCKER

**What**: Workspace mode field with presets

**Why**: Different teams need different workflows and features

**Requires**: Layer 0 (Workspaces table)

**Effort**: 1 day

**Modes**:
| Mode | Description | Target Users |
|------|-------------|--------------|
| `startup` | Lightweight, fast iteration | Small teams (1-10) |
| `enterprise` | Full governance, approvals | Large orgs (50+) |
| `agency` | Client projects, billing | Agencies |
| `custom` | Manual configuration | Power users |

**Blocks**:
- 2.2 Mode-Specific Defaults
- 2.3 Mode Transition Flow
- 2.4 Mode-Specific Dashboards

**Schema**:
```sql
ALTER TABLE workspaces ADD COLUMN mode TEXT CHECK (mode IN ('startup', 'enterprise', 'agency', 'custom')) DEFAULT 'startup';
ALTER TABLE workspaces ADD COLUMN mode_settings JSONB DEFAULT '{}'::jsonb;
CREATE INDEX idx_workspaces_mode ON workspaces(mode);
```

---

#### 2.2 Mode-Specific Defaults

**What**: Auto-configure workspace based on mode

**Why**: Reduce setup time, provide best-practice defaults

**Requires**: 2.1 Mode Column, 1.2 Workflow States

**Effort**: 2 days

**Defaults by Mode**:

**Startup Mode**:
- Phases: Research → Build → Ship (simplified)
- Departments: Engineering + Product only
- Workflow: Backlog → In Progress → Done
- Modules: Mind Map, Features, Timeline

**Enterprise Mode**:
- Phases: All 7 phases
- Departments: All 6 default departments
- Workflow: Custom by department with approvals
- Modules: All modules enabled
- Additional: Approval workflows, audit logs

**Agency Mode**:
- Phases: Discovery → Design → Development → Review → Delivery
- Departments: Design + Engineering + Project Management
- Workflow: With client approval steps
- Additional: Client portals, billing integration

**Blocks**: 3.2 Progressive Disclosure

**Implementation**:
- Mode templates JSON files
- Apply template on workspace creation
- Migration path between modes

---

#### 2.3 Mode Transition Flow

**What**: Migrate workspace from one mode to another

**Why**: Teams grow and need more structure

**Requires**: 2.1 Mode Column

**Effort**: 1 day

**Transitions**:
- Startup → Enterprise (add departments, enable governance)
- Startup → Agency (add client management)
- Enterprise → Custom (unlock all customization)

**Implementation**:
- Pre-flight check (data migration impact)
- Backup existing configuration
- Apply new defaults
- Notification to team

---

#### 2.4 Mode-Specific Dashboards

**What**: Default dashboard layouts by mode

**Why**: Show relevant metrics per use case

**Requires**: 2.1 Mode Column, 4.1 Customer Insights (optional)

**Effort**: 1 day

**Dashboard Layouts**:

**Startup Dashboard**:
- Work Items by Phase (pie chart)
- Sprint Burndown (line chart)
- Top Blockers (list)

**Enterprise Dashboard**:
- Strategic Alignment (OKR progress)
- Department Health (status grid)
- Risk Register (table)
- Budget vs Actual (bar chart)

**Agency Dashboard**:
- Client Projects (kanban board)
- Billable Hours (timeline)
- Client Satisfaction (NPS)

---

### LAYER 3: UX ENHANCEMENTS

**Purpose**: Improve user experience and reduce cognitive load

**Total Effort**: ~6 days

#### 3.1 Team Templates

**What**: Pre-built workspace templates for common scenarios

**Why**: Accelerate onboarding, share best practices

**Requires**: 1.1 Departments, 1.2 Workflow States

**Effort**: 2 days

**Templates**:
| Template | Description | Includes |
|----------|-------------|----------|
| SaaS Startup | Product-market fit phase | Research canvas, MVP roadmap |
| Mobile App | iOS/Android development | Design system, platform features |
| B2B Enterprise | Sales-led product | Customer requests, integrations |
| Marketplace | Two-sided platform | Buyer + Seller features |
| API Product | Developer platform | Endpoints, documentation, SDKs |

**Blocks**: 3.3 Notion-Style Connection Menu

**Implementation**:
- Template gallery UI
- Template application wizard
- Sample data for each template

---

#### 3.2 Progressive Disclosure

**What**: Hide advanced fields until needed

**Why**: Reduce overwhelm for new users, power for advanced users

**Requires**: 2.2 Mode-Specific Defaults

**Effort**: 2 days

**Disclosure Levels**:
1. **Basic** (Default): 5 essential fields (name, type, status, owner, phase)
2. **Intermediate** (+4 fields): Timeline, priority, department, tags
3. **Advanced** (+10 fields): Custom fields, AI metadata, integrations

**UI Pattern**:
```tsx
// Work Item Form
<Form>
  {/* Always visible */}
  <Input name="name" />
  <Select name="type" />

  {/* Intermediate - expandable */}
  <Collapsible trigger="More Options">
    <Input name="timeline" />
    <Select name="priority" />
  </Collapsible>

  {/* Advanced - modal or separate page */}
  <Button onClick={() => openAdvancedEditor()}>
    Advanced Settings
  </Button>
</Form>
```

**Implementation**:
- User preference: disclosure level (stored in user_settings)
- Auto-promote to next level after 10 actions
- "Show all fields" toggle for power users

---

#### 3.3 Notion-Style Connection Menu

**What**: Unified "/" command menu for linking entities

**Why**: Fast keyboard-driven workflow

**Requires**: 1.1 Departments, 3.1 Team Templates

**Effort**: 3 days

**Command Types**:
| Command | Action | Example |
|---------|--------|---------|
| `/link-work-item` | Link to existing work item | `/link-work-item Authentication Bug` |
| `/link-resource` | Attach external resource | `/link-resource https://...` |
| `/link-timeline` | Link to timeline milestone | `/link-timeline MVP Launch` |
| `/link-department` | Assign to department | `/link-department Engineering` |
| `/create-task` | Quick task creation | `/create-task Fix login bug` |
| `/add-tag` | Add tag | `/add-tag P0` |

**Blocks**: 5.2 Strategy Alignment

**Implementation**:
- TipTap or ProseMirror editor integration
- Fuzzy search across all linkable entities
- Recent items suggestion
- Keyboard navigation (↑↓ to select, Enter to confirm)

---

### LAYER 4: FEEDBACK & RESEARCH (Native Basics)

**Purpose**: Enable customer-driven product development

**Total Effort**: ~7 days

**Scope Decision**: Focus on lightweight, native feedback capture. Deep CRM integration is OUT OF SCOPE (see [scope-decisions.md](../../research/architecture-decisions/scope-decisions.md)).

#### 4.1 Customer Insights Table

**What**: Structured customer feedback storage

**Why**: Centralize feedback from all sources (support, sales, user research)

**Requires**: Layer 0 (Work Items)

**Effort**: 2 days

**Blocks**:
- 4.2 Feedback Widget
- 4.3 Feature Voting
- 4.4 Insight Linking
- 5.3 AI Alignment Suggestions

**Schema**:
```sql
CREATE TABLE customer_insights (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Source
  source TEXT NOT NULL CHECK (source IN ('support', 'sales', 'user_research', 'feedback_widget', 'manual')),
  source_reference TEXT, -- External ticket/deal ID
  customer_name TEXT,
  customer_email TEXT,
  customer_tier TEXT CHECK (customer_tier IN ('enterprise', 'pro', 'free')),

  -- Content
  insight_type TEXT NOT NULL CHECK (insight_type IN ('feature_request', 'bug_report', 'improvement', 'complaint', 'praise')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quote TEXT, -- Direct customer quote

  -- Classification
  category TEXT[], -- ['onboarding', 'integrations', 'performance']
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'shipped', 'declined')),
  linked_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_insights_team ON customer_insights(team_id);
CREATE INDEX idx_customer_insights_workspace ON customer_insights(workspace_id);
CREATE INDEX idx_customer_insights_source ON customer_insights(source);
CREATE INDEX idx_customer_insights_status ON customer_insights(status);
CREATE INDEX idx_customer_insights_linked ON customer_insights(linked_work_item_id);
CREATE INDEX idx_customer_insights_priority ON customer_insights(priority);
```

**API Endpoints**:
- `GET /api/workspaces/[id]/insights` - List insights with filters
- `POST /api/workspaces/[id]/insights` - Create insight
- `PATCH /api/insights/[id]` - Update status, link to work item
- `GET /api/insights/[id]/similar` - AI-powered duplicate detection

---

#### 4.2 Feedback Widget

**What**: Embeddable widget for public feedback collection

**Why**: Capture feedback without email/login friction

**Requires**: 4.1 Customer Insights Table

**Effort**: 2 days

**Blocks**: 4.4 Insight Linking

**Features**:
- Public URL: `platform.example.com/feedback/[workspace_token]`
- Embeddable iframe: `<iframe src="...feedback-widget..." />`
- Fields: Name (optional), Email (optional), Type, Title, Description
- Spam protection: reCAPTCHA
- Auto-create customer_insights record

**Implementation**:
```tsx
// Public feedback page (no auth required)
app/feedback/[token]/page.tsx

// Widget embed code
<script src="platform.example.com/widget.js" data-workspace="xxx"></script>
```

**API**:
- `POST /api/feedback/public` - Accept anonymous feedback
- `GET /api/feedback/widget/[token]` - Validate token, return config

---

#### 4.3 Feature Voting

**What**: Upvote system for customer insights

**Why**: Quantify demand, prioritize by customer need

**Requires**: 4.1 Customer Insights Table, 1.3 Triage Queue

**Effort**: 2 days

**Schema**:
```sql
CREATE TABLE insight_votes (
  id TEXT PRIMARY KEY,
  insight_id TEXT NOT NULL REFERENCES customer_insights(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL, -- Allow anonymous voting
  user_id UUID REFERENCES users(id), -- Optional for logged-in users
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(insight_id, user_email)
);

-- Add vote_count to customer_insights
ALTER TABLE customer_insights ADD COLUMN vote_count INTEGER DEFAULT 0;
CREATE INDEX idx_customer_insights_votes ON customer_insights(vote_count DESC);
```

**UI**:
- Public voting page: `platform.example.com/vote/[workspace_token]`
- Sort insights by votes
- Show "12 customers want this" badge
- Email notification on status change

**API**:
- `POST /api/insights/[id]/vote` - Upvote (public endpoint)
- `GET /api/insights/trending` - Top voted insights

---

#### 4.4 Insight Linking

**What**: Link customer insights to work items

**Why**: Track which feedback drove which features

**Requires**: 4.1 Customer Insights Table, 4.2 Feedback Widget

**Effort**: 1 day

**Features**:
- Many-to-many: One insight can link to multiple work items
- Show insights on Work Item Detail page (Feedback tab)
- Show linked work items on Insights page
- Auto-update insight status when linked work item ships

**Schema Enhancement**:
```sql
-- Already exists: linked_work_item_id in customer_insights
-- Add many-to-many junction if needed
CREATE TABLE work_item_insights (
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL REFERENCES customer_insights(id) ON DELETE CASCADE,
  PRIMARY KEY (work_item_id, insight_id)
);
```

**API**:
- `POST /api/work-items/[id]/link-insight` - Link insight
- `DELETE /api/work-items/[id]/unlink-insight` - Unlink
- `GET /api/work-items/[id]/insights` - Get linked insights

---

### LAYER 5: STRATEGY ALIGNMENT

**Purpose**: Connect daily work to company objectives

**Total Effort**: ~9 days

#### 5.1 Product Strategy Table

**What**: OKRs, North Star Metrics, Strategic Pillars

**Why**: Align work items with company strategy

**Requires**: Layer 0 (Workspaces)

**Effort**: 2 days

**Blocks**:
- 5.2 Strategy Alignment on Work Items
- 5.3 AI Alignment Suggestions
- 5.4 Alignment Dashboard
