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
**Reference**: [docs/ARCHITECTURE_CONSOLIDATION.md](../ARCHITECTURE_CONSOLIDATION.md)

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

**Scope Decision**: Focus on lightweight, native feedback capture. Deep CRM integration is OUT OF SCOPE (see [scope-decisions.md](../research/architecture-decisions/scope-decisions.md)).

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

**Schema**:
```sql
CREATE TABLE product_strategies (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Hierarchy
  parent_id TEXT REFERENCES product_strategies(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('pillar', 'objective', 'key_result', 'initiative')),

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Measurement
  metric_type TEXT, -- 'number', 'percentage', 'currency'
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT, -- 'users', 'revenue', 'NPS', etc.

  -- Timeline
  time_period TEXT, -- 'Q1 2025', 'H1 2025', 'Annual 2025'
  start_date DATE,
  end_date DATE,

  -- Ownership
  owner_id UUID REFERENCES users(id),
  department_id TEXT REFERENCES departments(id),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'at_risk', 'achieved', 'missed', 'archived')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_team ON product_strategies(team_id);
CREATE INDEX idx_strategies_workspace ON product_strategies(workspace_id);
CREATE INDEX idx_strategies_parent ON product_strategies(parent_id);
CREATE INDEX idx_strategies_level ON product_strategies(level);
CREATE INDEX idx_strategies_owner ON product_strategies(owner_id);
```

**API Endpoints**:
- `GET /api/workspaces/[id]/strategies` - List strategies
- `POST /api/workspaces/[id]/strategies` - Create strategy
- `PATCH /api/strategies/[id]` - Update progress
- `GET /api/strategies/[id]/tree` - Get full hierarchy

---

#### 5.2 Strategy Alignment on Work Items

**What**: Link work items to strategic objectives

**Why**: Show how daily work contributes to goals

**Requires**: 5.1 Product Strategy Table, 3.3 Connection Menu

**Effort**: 2 days

**Blocks**: 5.4 Alignment Dashboard

**Schema**:
```sql
ALTER TABLE work_items ADD COLUMN strategy_id TEXT REFERENCES product_strategies(id) ON DELETE SET NULL;
CREATE INDEX idx_work_items_strategy ON work_items(strategy_id);

-- Or many-to-many if work items contribute to multiple strategies
CREATE TABLE work_item_strategies (
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL REFERENCES product_strategies(id) ON DELETE CASCADE,
  contribution_weight NUMERIC DEFAULT 1.0, -- How much this work item contributes
  PRIMARY KEY (work_item_id, strategy_id)
);
```

**UI Changes**:
- Add "Strategic Alignment" field to work item form
- Show strategy badge on work item cards
- Filter work items by strategy
- Show unaligned work items warning

**API**:
- `POST /api/work-items/[id]/align-strategy` - Link to strategy
- `GET /api/work-items/unaligned` - Find unaligned work
- `GET /api/strategies/[id]/work-items` - Work items for strategy

---

#### 5.3 AI Alignment Suggestions

**What**: AI recommends which strategy a work item should align to

**Why**: Reduce manual alignment effort

**Requires**: 5.1 Product Strategy Table, 4.1 Customer Insights

**Effort**: 3 days

**AI Logic**:
```typescript
// Analyze work item content
const workItem = {
  name: "Add SSO authentication",
  type: "feature",
  description: "Enterprise customers need SAML SSO",
  linked_insights: [
    { customer_tier: "enterprise", vote_count: 12 }
  ]
}

// Match against strategies
const strategies = [
  { title: "Increase Enterprise Revenue", metric: "ARR", target: "$1M" },
  { title: "Improve Onboarding", metric: "Activation Rate", target: "60%" }
]

// AI suggests: "Increase Enterprise Revenue" (80% confidence)
// Reasoning: "Enterprise customers requested, ARR impact"
```

**Implementation**:
- Use Vercel AI SDK `generateObject()` with Zod schema
- Context: Work item + Customer insights + Strategies
- Output: Top 3 suggested strategies with confidence scores
- User can accept/reject/skip suggestion

**API**:
- `POST /api/work-items/[id]/suggest-alignment` - Get AI suggestions

---

#### 5.4 Alignment Dashboard

**What**: Visual dashboard showing strategic progress

**Why**: Executive visibility into strategy execution

**Requires**: 5.1 Product Strategy Table, 5.2 Strategy Alignment

**Effort**: 2 days

**Visualizations**:

1. **Strategy Progress Tree**
   - Hierarchical view (Pillars → Objectives → Key Results)
   - Progress bars per item
   - Color-coded status (green/yellow/red)

2. **Work Item Coverage**
   - % of work items aligned to strategy
   - % of work items unaligned
   - Department breakdown

3. **Delivery Timeline**
   - Gantt chart of strategic initiatives
   - Dependencies between strategies
   - At-risk indicators

4. **Impact Forecast**
   - Predicted metric movement based on in-progress work
   - "If we ship these 5 features, ARR increases 15%"

**UI Components**:
- `app/(dashboard)/workspaces/[id]/strategy/page.tsx`
- `components/strategy/strategy-tree.tsx`
- `components/strategy/alignment-chart.tsx`

---

### LAYER 6: INTEGRATIONS (Future - Post-MVP)

**Purpose**: Connect with external tools

**Total Effort**: ~15 days (spread across multiple sprints)

**Requires**: Layer 4 (Feedback & Research), Layer 5 (Strategy)

**Integration Levels**:
| Level | Scope | Effort | Priority |
|-------|-------|--------|----------|
| **Light** | Link external URLs as references | 1 day | ✅ MVP (already done via Resources) |
| **Medium** | Pull metadata from external tools | 5 days | Post-MVP |
| **Deep** | Bi-directional sync, auto-create insights | 15 days | Future |

#### CRM Integration (HubSpot, Salesforce)

**What**: Surface product roadmap in CRM, pull deal data into insights

**Why**: Sales team sees delivery dates, Product sees customer demand

**Blocks**: None (optional layer)

**Implementation**:
- OAuth flow for HubSpot/Salesforce
- Webhook: Deal stage change → Create customer insight
- API: Fetch roadmap → Display in CRM sidebar
- Mapping: Deal custom fields → Insight fields

**API Endpoints**:
- `GET /api/integrations/crm/authorize` - OAuth start
- `POST /api/integrations/crm/webhook` - Receive CRM events
- `GET /api/integrations/crm/roadmap` - Roadmap data for CRM

---

#### Help Desk Integration (Zendesk, Intercom)

**What**: Pull support tickets into insights, auto-classify bugs vs features

**Why**: Support feedback becomes product insights

**Implementation**:
- Webhook: New ticket → Create insight (if feature request)
- AI classification: Bug vs Feature request
- Link tickets to work items
- Auto-update ticket when work item ships

**API Endpoints**:
- `POST /api/integrations/helpdesk/webhook` - Receive ticket events
- `GET /api/insights/[id]/tickets` - Linked support tickets

---

## Critical Path Analysis

**Definition**: The longest sequence of dependent tasks that determines minimum project duration.

### Critical Path (11 Days Minimum)

```
Layer 0 (Complete)
  → 1.1 Departments (1d)
  → 1.2 Workflow States (1d)
  → 3.1 Team Templates (2d)
  → 3.3 Connection Menu (3d)
  → 5.2 Strategy Alignment (2d)
  → 5.4 Alignment Dashboard (2d)

Total: 11 days
```

**Why This Path**:
- Departments unlock all team-specific features
- Workflow States enable mode defaults
- Templates provide onboarding value
- Connection Menu is core UX improvement
- Strategy Alignment is high-value for enterprise
- Dashboard provides executive visibility

**Parallel Tracks** (can build simultaneously):
- 2.1 → 2.2 → 2.3 → 2.4 (Workspace Modes: 5 days)
- 4.1 → 4.2 → 4.3 → 4.4 (Feedback: 7 days)
- 5.1 → 5.3 (Strategy + AI: 5 days)

**Optimal Schedule**: Build critical path + 1-2 parallel tracks = 11-15 days total

---

## Database Migration Order

**CRITICAL**: Migrations must be applied in this exact order to avoid foreign key conflicts.

### Phase A: Foundation Extensions (Days 1-2)

```sql
-- Migration 1: Departments table
20251201000001_create_departments.sql
  - CREATE TABLE departments
  - Add department_id to work_items
  - Add indexes

-- Migration 2: Workflow States enhancement
20251201000002_add_department_to_workflow_stages.sql
  - ALTER TABLE workflow_stages ADD COLUMN department_id
  - Create default workflows per department
  - Add indexes

-- Migration 3: Workspace modes
20251201000003_add_workspace_modes.sql
  - ALTER TABLE workspaces ADD COLUMN mode
  - ALTER TABLE workspaces ADD COLUMN mode_settings
  - Add indexes
```

### Phase B: Customer Insights (Days 3-4)

```sql
-- Migration 4: Customer insights table
20251201000004_create_customer_insights.sql
  - CREATE TABLE customer_insights
  - CREATE TABLE insight_votes
  - Add vote_count to customer_insights
  - Add indexes

-- Migration 5: Insight linking
20251201000005_create_work_item_insights.sql
  - CREATE TABLE work_item_insights (junction)
  - Add indexes
```

### Phase C: Strategy System (Days 5-6)

```sql
-- Migration 6: Product strategies
20251201000006_create_product_strategies.sql
  - CREATE TABLE product_strategies
  - Add indexes

-- Migration 7: Strategy alignment
20251201000007_add_strategy_to_work_items.sql
  - ALTER TABLE work_items ADD COLUMN strategy_id
  - CREATE TABLE work_item_strategies (junction)
  - Add indexes
```

### Phase D: RLS Policies (Day 7)

```sql
-- Migration 8: RLS policies for new tables
20251201000008_add_rls_policies.sql
  - Enable RLS on departments
  - Enable RLS on customer_insights
  - Enable RLS on product_strategies
  - Create SELECT/INSERT/UPDATE/DELETE policies
```

### Phase E: Database Functions (Day 8)

```sql
-- Migration 9: Helper functions
20251201000009_create_helper_functions.sql
  - get_department_work_items(department_id)
  - get_strategy_progress(strategy_id)
  - calculate_alignment_score(workspace_id)
  - find_unaligned_work_items(workspace_id)
```

**Migration Validation Checklist**:
- [ ] All foreign keys resolve correctly
- [ ] RLS policies applied to all new tables
- [ ] Indexes created for all foreign keys
- [ ] Triggers added for updated_at columns
- [ ] Test data migrates correctly
- [ ] Rollback script prepared

---

## Phase Execution Timeline

### Phase A: Team Structure Foundation (Week 9-10)

**Duration**: 3 days

**Goals**:
- Enable department-based organization
- Configure workspace modes
- Set up team-specific workflows

**Tasks**:
| Task | Effort | Assignee | Blocks |
|------|--------|----------|--------|
| 1.1 Departments Table | 1 day | Backend Dev | 1.2, 1.3 |
| 1.2 Workflow States | 1 day | Backend Dev | 2.2 |
| 2.1 Workspace Modes | 1 day | Backend Dev | 2.2 |

**Deliverables**:
- [x] Departments CRUD API
- [x] Department assignment UI
- [x] Workspace mode selector
- [x] Default workflows per mode

---

### Phase B: User Experience Enhancements (Week 10-11)

**Duration**: 5 days

**Goals**:
- Reduce cognitive load with progressive disclosure
- Accelerate onboarding with templates
- Improve keyboard-driven workflows

**Tasks**:
| Task | Effort | Assignee | Blocks |
|------|--------|----------|--------|
| 2.2 Mode Defaults | 2 days | Backend + Frontend | 3.2 |
| 3.1 Team Templates | 2 days | Frontend Dev | 3.3 |
| 3.2 Progressive Disclosure | 2 days | Frontend Dev | None |
| 3.3 Connection Menu | 3 days | Frontend Dev | 5.2 |

**Deliverables**:
- [x] Template gallery page
- [x] Apply template wizard
- [x] Progressive disclosure form components
- [x] "/" command menu with fuzzy search

---

### Phase C: Customer Feedback System (Week 11-12)

**Duration**: 7 days (parallel with Phase B)

**Goals**:
- Capture customer feedback systematically
- Enable feature voting
- Link feedback to work items

**Tasks**:
| Task | Effort | Assignee | Blocks |
|------|--------|----------|--------|
| 4.1 Customer Insights Table | 2 days | Backend Dev | 4.2, 4.3 |
| 4.2 Feedback Widget | 2 days | Frontend Dev | 4.4 |
| 4.3 Feature Voting | 2 days | Backend + Frontend | None |
| 4.4 Insight Linking | 1 day | Backend Dev | 5.3 |
| 1.3 Triage Queue (optional) | 1 day | Frontend Dev | None |

**Deliverables**:
- [x] Public feedback page
- [x] Embeddable widget code
- [x] Voting system
- [x] Insights dashboard
- [x] Link insights to work items

---

### Phase D: Strategy Alignment (Week 12-13)

**Duration**: 9 days

**Goals**:
- Connect work items to company OKRs
- AI-powered alignment suggestions
- Executive visibility dashboard

**Tasks**:
| Task | Effort | Assignee | Blocks |
|------|--------|----------|--------|
| 5.1 Product Strategy Table | 2 days | Backend Dev | 5.2, 5.3 |
| 5.2 Strategy Alignment | 2 days | Backend + Frontend | 5.4 |
| 5.3 AI Suggestions | 3 days | AI/Backend Dev | None |
| 5.4 Alignment Dashboard | 2 days | Frontend Dev | None |

**Deliverables**:
- [x] OKR hierarchy management
- [x] Strategy assignment UI
- [x] AI alignment suggestions
- [x] Strategy dashboard with charts

---

### Phase E: Integrations (Week 13-16) - OPTIONAL

**Duration**: 15 days (spread over multiple sprints)

**Goals**:
- Connect with CRM tools (HubSpot, Salesforce)
- Pull support tickets from Zendesk/Intercom
- Bi-directional sync

**Tasks**:
| Task | Effort | Assignee | Priority |
|------|--------|----------|----------|
| CRM OAuth Setup | 2 days | Backend Dev | Medium |
| CRM Webhooks | 3 days | Backend Dev | Medium |
| Help Desk Integration | 5 days | Backend Dev | Low |
| Bi-directional Sync | 5 days | Backend Dev | Low |

**Deliverables**:
- [x] OAuth flow for CRM tools
- [x] Webhook handlers
- [x] Roadmap API for CRM
- [x] Auto-create insights from tickets

---

## Success Criteria by Phase

### Phase A: Team Structure Foundation ✅

**Acceptance Criteria**:
- [ ] Departments can be created, edited, deleted
- [ ] Work items can be assigned to departments
- [ ] Department-specific workflow states exist
- [ ] Workspace mode can be selected and changed
- [ ] Mode-specific defaults apply on workspace creation

**Testing Checklist**:
- [ ] Create department → Assign work item → Verify filtering
- [ ] Change workspace mode → Verify defaults applied
- [ ] Multi-tenant isolation: Department A cannot see Department B's data
- [ ] RLS policies enforced on all new tables

**Metrics**:
- API response time: < 200ms for department queries
- UI load time: < 1s for department selector
- Database query efficiency: Max 3 queries per page load

---

### Phase B: UX Enhancements ✅

**Acceptance Criteria**:
- [ ] Template gallery loads with 5+ templates
- [ ] Apply template wizard creates workspace with sample data
- [ ] Progressive disclosure shows 5 fields by default, 9 on expand
- [ ] Connection menu appears on "/" keystroke
- [ ] Connection menu searches across work items, resources, strategies
- [ ] Connection menu supports keyboard navigation

**Testing Checklist**:
- [ ] Apply SaaS Startup template → Verify workspace structure
- [ ] New user sees 5 fields → Expert user sees all fields
- [ ] Type "/" → Select work item → Link created
- [ ] Fuzzy search: Type "auth" → Matches "Authentication Bug"

**Metrics**:
- Template application time: < 3 seconds
- Connection menu search latency: < 100ms
- User onboarding time reduction: 50% (from analytics)

---

### Phase C: Customer Feedback System ✅

**Acceptance Criteria**:
- [ ] Public feedback page accepts submissions without login
- [ ] Feedback widget embeds in external site (iframe)
- [ ] Insights can be upvoted by email
- [ ] Insights can be linked to work items
- [ ] Insights status updates when linked work item ships
- [ ] Triage queue shows pending insights by department

**Testing Checklist**:
- [ ] Submit feedback via public page → Verify in insights table
- [ ] Embed widget → Submit feedback → Verify received
- [ ] Upvote insight 3 times → Verify vote_count = 3
- [ ] Link insight to work item → Mark work item "Shipped" → Insight status = "Shipped"
- [ ] Filter insights by department → Verify correct subset

**Metrics**:
- Public feedback page load time: < 2s
- Widget embed size: < 50KB
- Duplicate insight detection accuracy: > 80%

---

### Phase D: Strategy Alignment ✅

**Acceptance Criteria**:
- [ ] Product strategies can be created with hierarchy (Pillar → Objective → Key Result)
- [ ] Work items can be aligned to strategies (1:N or N:M)
- [ ] AI suggests top 3 strategies for unaligned work items (80%+ confidence)
- [ ] Alignment dashboard shows strategy progress tree
- [ ] Dashboard shows % of work items aligned
- [ ] Unaligned work items highlighted with warning

**Testing Checklist**:
- [ ] Create strategy hierarchy → Verify parent-child relationships
- [ ] Align work item to strategy → Verify link in database
- [ ] Request AI suggestion → Verify top 3 strategies returned
- [ ] Dashboard loads with 4 visualizations in < 2s
- [ ] Filter work items by strategy → Verify correct subset

**Metrics**:
- AI suggestion accuracy (validated by PM): > 70%
- AI response time: < 2 seconds
- Dashboard query performance: < 500ms for 1000 work items

---

### Phase E: Integrations ✅ (OPTIONAL)

**Acceptance Criteria**:
- [ ] OAuth flow completes for HubSpot/Salesforce
- [ ] CRM webhook receives and processes events
- [ ] Roadmap API returns data in CRM-compatible format
- [ ] Support tickets auto-create insights (bugs only)
- [ ] Linked work item ships → Support ticket auto-updated

**Testing Checklist**:
- [ ] Connect HubSpot account → Verify OAuth token stored
- [ ] Change deal stage → Verify insight created
- [ ] Fetch roadmap from CRM → Verify data matches platform
- [ ] Create Zendesk ticket (bug) → Verify insight created
- [ ] Ship work item → Verify ticket comment added

**Metrics**:
- OAuth success rate: > 95%
- Webhook processing time: < 1 second
- Duplicate insight rate: < 10%

---

## Risk Mitigation Strategy

### Risk 1: Migration Ordering Errors 🔴 HIGH RISK

**Problem**: Foreign key constraints fail if tables created out of order

**Impact**: Database migration fails, production downtime

**Mitigation**:
1. **Pre-flight Testing**: Test all migrations on staging database
2. **Rollback Scripts**: Prepare `DOWN` migration for each change
3. **Atomic Migrations**: Use transactions, rollback on error
4. **Dependency Graph**: Document exact migration order in this document

**Rollback Plan**:
```sql
-- If Migration 7 fails, rollback Migrations 7, 6, 5, 4
BEGIN;
  DROP TABLE IF EXISTS work_item_strategies;
  ALTER TABLE work_items DROP COLUMN IF EXISTS strategy_id;
  DROP TABLE IF EXISTS product_strategies;
  DROP TABLE IF EXISTS work_item_insights;
  DROP TABLE IF EXISTS insight_votes;
  DROP TABLE IF EXISTS customer_insights;
ROLLBACK; -- Or COMMIT if successful
```

---

### Risk 2: Scope Creep on Feedback System 🟡 MEDIUM RISK

**Problem**: Temptation to build full CRM functionality

**Impact**: Development time doubles, loses focus on PM core value

**Mitigation**:
1. **Stick to "Native Basics" Scope**: Feedback capture + voting + linking ONLY
2. **Integration Over Building**: For advanced CRM features, integrate with HubSpot/Salesforce
3. **Reference Document**: Link to [scope-decisions.md](../research/architecture-decisions/scope-decisions.md) when tempted to add CRM features
4. **Phase Gate Review**: Validate scope at end of Phase C

**Scope Boundary**:
| ✅ IN SCOPE | ❌ OUT OF SCOPE |
|------------|----------------|
| Capture feedback | Manage sales pipeline |
| Upvote features | Track deals |
| Link to work items | Email campaigns |
| Triage queue | Customer success workflows |

---

### Risk 3: Strategy Alignment Too Heavy 🟡 MEDIUM RISK

**Problem**: Enterprises want complex OKR management, infinite nesting

**Impact**: Over-engineered feature, poor UX

**Mitigation**:
1. **Limit Hierarchy Depth**: Max 3 levels (Pillar → Objective → Key Result)
2. **AI Suggestions**: Make alignment easy with AI, not complex UI
3. **Skip Option**: Allow "Unaligned" work items (not everything needs strategy link)
4. **Pro Feature**: Advanced OKR features behind Pro tier gate

**Complexity Cap**:
```typescript
// MAX 3 levels
type StrategyLevel = 'pillar' | 'objective' | 'key_result'

// Reject if depth > 3
if (strategyDepth > 3) {
  throw new Error('Maximum strategy depth is 3 levels')
}
```

---

### Risk 4: Integration Dependency Failures 🟡 MEDIUM RISK

**Problem**: HubSpot/Zendesk API changes break integration

**Impact**: Broken features, customer complaints

**Mitigation**:
1. **Graceful Degradation**: If integration fails, show manual link option
2. **Webhook Retry**: Retry failed webhooks 3 times with exponential backoff
3. **Error Monitoring**: Sentry alerts on integration failures
4. **Fallback UI**: "Integration temporarily unavailable" message

**Example**:
```typescript
try {
  const insights = await fetchFromZendesk()
} catch (error) {
  logger.error('Zendesk integration failed', error)
  // Fallback: Show manual entry form
  return <ManualInsightForm />
}
```

---

### Risk 5: AI Suggestion Accuracy 🟡 MEDIUM RISK

**Problem**: AI suggests wrong strategies, users lose trust

**Impact**: Feature not adopted, wasted development effort

**Mitigation**:
1. **Confidence Threshold**: Only suggest if confidence > 70%
2. **User Override**: Always allow manual selection
3. **Feedback Loop**: Track acceptance rate, improve prompts
4. **Prompt Engineering**: Provide rich context (work item + insights + strategies)

**Monitoring**:
```typescript
// Track AI suggestion acceptance rate
const acceptanceRate = acceptedSuggestions / totalSuggestions

if (acceptanceRate < 0.5) {
  alert('AI suggestion quality below threshold')
  // Trigger prompt improvement sprint
}
```

---

## Related Documentation

### Planning Documents
- [PROGRESS.md](PROGRESS.md) - Weekly progress tracking
- [NEXT_STEPS.md](NEXT_STEPS.md) - Immediate priorities
- [RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md) - Claude agents by phase

### Implementation Guides
- [Implementation Plan](../implementation/README.md) - Week-by-week guide
- [Database Schema](../implementation/database-schema.md) - Current schema reference

### Postponed Features
- [MIND_MAP_ENHANCEMENTS.md](../postponed/MIND_MAP_ENHANCEMENTS.md) - 23 mind map enhancements (Phase 1-3)
- [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md) - Timeline refactor

### Research Findings
- [ultra-deep-research-findings.md](../research/core-research/ultra-deep-research-findings.md) - Market intelligence
- [scope-decisions.md](../research/architecture-decisions/scope-decisions.md) - In-scope vs out-of-scope teams
- [progressive-disclosure-ux.md](../research/core-research/progressive-disclosure-ux.md) - UX patterns
- [cross-team-collaboration.md](../research/core-research/cross-team-collaboration.md) - Team workflow research

### Technical References
- [ARCHITECTURE.md](../reference/ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](../reference/API_REFERENCE.md) - API documentation
- [CODE_PATTERNS.md](../reference/CODE_PATTERNS.md) - Code standards

---

**Last Updated**: 2025-12-01
**Status**: Planning Document - Ready for Implementation
**Next Review**: End of Week 8 (After AI Integration & Testing complete)

---

**Legend**:
- 🔴 CRITICAL BLOCKER - Blocks many other features
- 🟡 MEDIUM RISK - Requires careful execution
- ✅ READY - All dependencies satisfied
- ⏳ BLOCKED - Waiting on dependencies
