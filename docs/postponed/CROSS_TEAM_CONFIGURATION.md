# 🏢 Cross-Team Configuration

**Created**: 2025-12-01
**Status**: PLANNING COMPLETE - Postponed for Implementation
**Priority**: MEDIUM (High value for enterprise, but foundation needed first)
**Target**: After Product Strategy Foundation (Post-Week 8)
**Estimated Effort**: ~30 hours

[← Back to Postponed Features](README.md)

---

## Executive Summary

This feature enables different teams to have **different contextual views** of the same work items. Instead of a generic "Work Item" table, each department (Product, Engineering, Design, Marketing, Sales, Support) sees fields and workflows tailored to their needs.

### Key Innovation

**One Work Item, Multiple Team Contexts** - A single feature is simultaneously:
- A **Product Priority** with customer impact scoring
- An **Engineering Task** with technical complexity and dependencies
- A **Design Deliverable** with accessibility requirements
- A **Marketing Campaign** with channels and messaging
- A **Sales Enablement** asset with positioning
- A **Support Article** with documentation status

### Value Proposition

| Problem | Current State | With Cross-Team Config |
|---------|---------------|------------------------|
| **Field Overload** | All teams see 50+ fields, most irrelevant | Each team sees only their 10-15 fields |
| **Workflow Mismatch** | Generic statuses don't match team processes | Custom workflows per department |
| **Visibility Gaps** | Teams work in silos, misaligned priorities | Unified view shows cross-team dependencies |
| **Data Quality** | Teams skip irrelevant fields, data incomplete | Teams fill only their context, 100% completion |

---

## 5-Question Framework Validation

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 1 | **Data Dependencies**: Do required tables/APIs exist? | ❌ | Needs `departments`, `workflow_states`, workspace modes |
| 2 | **Integration Points**: Are module APIs stable? | ❌ | Needs Work Board 3.0, Work Item Detail 8-tab structure |
| 3 | **Standalone Value**: Does this provide standalone value? | ✅ | Yes, but only after foundation modules complete |
| 4 | **Schema Finalized**: Are tables/columns finalized? | ❌ | Work item schema still evolving (Week 6-7) |
| 5 | **Testing Feasibility**: Can this be fully tested? | ❌ | Requires stable multi-workspace testing infrastructure |

**Result**: ❌ **POSTPONE** until foundation modules stabilize

---

## Why Postponed

This feature is **strategically valuable but architecturally premature**:

### Missing Foundational Pieces

1. **Departments & Teams Architecture** (From Linear):
   - Need `departments` table with hierarchy
   - Department-based permissions
   - Team-to-department mapping
   - **Dependency**: Not yet designed or implemented

2. **Workflow States System**:
   - Custom status workflows per team
   - State transitions and validations
   - Workflow templates (Kanban, Scrum, Design Sprints, etc.)
   - **Dependency**: Planned but postponed

3. **Workspace Modes**:
   - Project mode (single product)
   - Portfolio mode (multiple products)
   - Enterprise mode (departments + portfolios)
   - **Dependency**: Design in progress

4. **Work Item Schema Stability**:
   - Current schema still evolving (Week 6-7)
   - Adding team contexts now = high rework risk
   - Need stable foundation first

### Why Implementing Now Would Fail

- ❌ **No department structure** - Can't assign "Engineering" vs "Design" fields
- ❌ **No custom workflows** - Can't have per-team statuses
- ❌ **Schema churn** - Work items still changing (tasks, resources, timelines)
- ❌ **Testing impossible** - Multi-team scenarios need stable platform
- ❌ **UI not ready** - Work Board 3.0 and 8-tab detail page needed for UX

---

## Dependencies (Must Complete First)

- [⏳] **Week 6-7:** Work Item Detail 8-tab structure - Foundation for team-specific tabs
- [⏳] **Week 6:** Work Board 3.0 - Supports filtered views and grouping
- [⏳] **Week 7:** Analytics module - Needed for cross-team reporting
- [⏳] **Week 8:** Testing infrastructure - Multi-workspace E2E tests
- [⏳] **Post-Week 8:** Departments table and architecture (Linear-inspired)
- [⏳] **Post-Week 8:** Workflow States system
- [⏳] **Post-Week 8:** Workspace Modes (Project/Portfolio/Enterprise)

---

## When to Implement

**Target:** After Week 8 + Product Strategy Foundation complete

**Phased Approach:**
1. **Phase 0** (Weeks 9-10): Departments & Workflow States foundation (~15h)
2. **Phase 1** (Weeks 11-12): Cross-Team Configuration (~30h, this feature)
3. **Phase 2** (Week 13): Enterprise rollout & polish (~10h)

**Why this timing:**
- ✅ Core platform stable (all 10 modules working)
- ✅ Work Item Detail 8-tab structure proven
- ✅ Work Board 3.0 supports advanced filtering
- ✅ Testing infrastructure ready for complex scenarios
- ✅ Can focus on enterprise features without breaking core product

---

## Core Concept: Team Contexts

### Example: Feature "User Authentication"

Each team sees different context for the same work item:

```
WORK ITEM: User Authentication (Feature)
├── Product Context
│   ├── Priority: P0 (Critical)
│   ├── Customer Impact: High
│   ├── Strategic Pillar: Security
│   └── Success Metrics: Signup conversion rate
│
├── Engineering Context
│   ├── Technical Domain: Backend
│   ├── Complexity: High
│   ├── Dependencies: Database migration, OAuth provider
│   ├── Tech Stack: Node.js, Passport.js, JWT
│   ├── Breaking Changes: Yes
│   └── Security Review: Required
│
├── Design Context
│   ├── Design Type: User Flow
│   ├── Design Status: In Progress
│   ├── Accessibility Level: WCAG AA
│   ├── Figma Link: https://figma.com/...
│   └── User Testing Required: Yes
│
├── Marketing Context
│   ├── Campaign: Q1 Security Launch
│   ├── Target Audience: Enterprise, SMB
│   ├── Channels: Email, Blog, LinkedIn
│   ├── Launch Date: 2025-03-15
│   └── Content Status: Draft
│
├── Sales Context
│   ├── Positioning: Enterprise Security
│   ├── Objection Handlers: "Is SSO supported?" → "Yes, via OAuth"
│   ├── Demo Script: Login flow walkthrough
│   └── Competitive Advantage: Built-in 2FA
│
└── Support Context
    ├── Documentation Status: In Progress
    ├── FAQ Created: Yes (5 articles)
    ├── Known Issues: None
    └── Support Playbook: Password reset guide
```

---

## Team-Specific Field Templates

### 1. Engineering Fields

| Field | Type | Options |
|-------|------|---------|
| `technical_domain` | Select | Frontend, Backend, Database, Infrastructure, DevOps, Security |
| `complexity` | Select | Trivial (1h), Low (half day), Medium (2-3 days), High (1 week), Very High (2+ weeks) |
| `tech_stack` | Multi-select | React, Node.js, PostgreSQL, Redis, etc. |
| `breaking_changes` | Boolean | Yes/No |
| `security_review` | Select | Not Required, Requested, In Review, Approved |
| `dependencies` | Multi-select | Other work items (from Dependencies module) |
| `technical_notes` | Rich Text | Architecture decisions, implementation details |

**Engineering Workflow:**
`Backlog → Planning → In Development → Code Review → QA → Merged → Deployed`

---

### 2. Design Fields

| Field | Type | Options |
|-------|------|---------|
| `design_type` | Select | User Flow, Visual Design, Interaction Design, Prototype |
| `design_status` | Select | Not Started, In Progress, Review, Approved, Implemented |
| `accessibility_level` | Select | A, AA, AAA, Not Applicable |
| `design_system_component` | Select | Uses existing, Needs new component, Custom |
| `figma_link` | URL | Link to Figma file |
| `user_testing_required` | Boolean | Yes/No |
| `design_deliverables` | Multi-select | Wireframes, Mockups, Prototype, Design Specs |

**Design Workflow:**
`Intake → Research → Wireframes → Visual Design → Prototype → Review → Handoff`

---

### 3. Marketing Fields

| Field | Type | Options |
|-------|------|---------|
| `campaign` | Text | Campaign name |
| `target_audience` | Multi-select | Enterprise, SMB, Individual, Developer, Designer |
| `channels` | Multi-select | Email, Blog, Social, Webinar, Ads, PR |
| `launch_date` | Date | Planned launch date |
| `content_status` | Select | Planning, Draft, Review, Approved, Published |
| `messaging_angle` | Text | Key message |
| `content_deliverables` | Multi-select | Landing Page, Blog Post, Email, Social Posts, Case Study |

**Marketing Workflow:**
`Intake → Planning → Content Creation → Review → Approval → Launch → Analysis`

---

### 4. Sales Fields

| Field | Type | Options |
|-------|------|---------|
| `positioning` | Text | How to position this feature |
| `objection_handlers` | Rich Text | Common objections and responses |
| `demo_script` | Rich Text | How to demo this feature |
| `competitive_advantage` | Text | Why we're better |
| `pricing_impact` | Select | No change, New tier, Add-on, Upsell |
| `sales_readiness` | Select | Not Ready, Training Needed, Ready, Launched |

**Sales Workflow:**
`New Feature → Training → Sales Deck → Demo Ready → Launched → Feedback`

---

### 5. Support Fields

| Field | Type | Options |
|-------|------|---------|
| `documentation_status` | Select | Not Started, In Progress, Review, Published |
| `faq_created` | Boolean | Yes/No |
| `known_issues` | Rich Text | List of known issues |
| `support_playbook` | Rich Text | How to troubleshoot |
| `customer_facing` | Boolean | Yes/No |
| `support_training` | Select | Not Required, Scheduled, Completed |

**Support Workflow:**
`New Feature → Documentation → Internal Training → Help Center → Monitor`

---

## Database Schema

### New: `team_configurations` Table

```sql
CREATE TABLE team_configurations (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Department (from future departments table)
    department TEXT NOT NULL CHECK (department IN (
        'product',
        'engineering',
        'design',
        'marketing',
        'sales',
        'support',
        'leadership',
        'custom'
    )),

    -- Custom fields configuration
    custom_fields JSONB DEFAULT '[]',
    -- Example: [
    --   { "key": "technical_domain", "label": "Technical Domain", "type": "select", "options": ["Frontend", "Backend"] },
    --   { "key": "complexity", "label": "Complexity", "type": "select", "options": ["Low", "Medium", "High"] }
    -- ]

    -- Categories for grouping fields
    categories JSONB DEFAULT '[]',
    -- Example: [
    --   { "name": "Technical Details", "fields": ["technical_domain", "complexity", "tech_stack"] },
    --   { "name": "Security", "fields": ["breaking_changes", "security_review"] }
    -- ]

    -- Default view for this team
    default_view TEXT DEFAULT 'list' CHECK (default_view IN ('list', 'board', 'timeline', 'table')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(workspace_id, department)
);

-- Indexes
CREATE INDEX idx_team_configurations_workspace ON team_configurations(workspace_id);
CREATE INDEX idx_team_configurations_department ON team_configurations(department);

-- RLS
ALTER TABLE team_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view team configurations in their team" ON team_configurations
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage team configurations" ON team_configurations
    FOR ALL USING (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
```

---

### New: `work_item_team_contexts` Table

```sql
CREATE TABLE work_item_team_contexts (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
    department TEXT NOT NULL CHECK (department IN (
        'product',
        'engineering',
        'design',
        'marketing',
        'sales',
        'support',
        'leadership'
    )),

    -- Field values (matches custom_fields from team_configurations)
    field_values JSONB DEFAULT '{}',
    -- Example: {
    --   "technical_domain": "Backend",
    --   "complexity": "High",
    --   "tech_stack": ["Node.js", "PostgreSQL"],
    --   "breaking_changes": true
    -- }

    -- Team-specific status (from Workflow States system)
    team_status TEXT,
    -- Engineering: "In Development"
    -- Design: "Visual Design"
    -- Marketing: "Content Creation"

    -- Team-specific deliverables
    deliverables JSONB DEFAULT '[]',
    -- Example: [
    --   { "type": "code", "url": "https://github.com/...", "status": "done" },
    --   { "type": "design", "url": "https://figma.com/...", "status": "in_progress" }
    -- ]

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),

    UNIQUE(work_item_id, department)
);

-- Indexes
CREATE INDEX idx_witc_work_item ON work_item_team_contexts(work_item_id);
CREATE INDEX idx_witc_department ON work_item_team_contexts(department);
CREATE INDEX idx_witc_team_status ON work_item_team_contexts(team_status);

-- RLS
ALTER TABLE work_item_team_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view team contexts in their team" ON work_item_team_contexts
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage team contexts for their department" ON work_item_team_contexts
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
        AND department IN (
            SELECT department FROM user_phase_assignments WHERE user_id = auth.uid()
        )
    );
```

---

### New: `work_item_connections` Table

```sql
CREATE TABLE work_item_connections (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    source_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
    target_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

    connection_type TEXT NOT NULL CHECK (connection_type IN (
        'blocks',
        'blocked_by',
        'relates_to',
        'depends_on',
        'enables',
        'marketing_for',
        'documentation_for',
        'design_for',
        'qa_for',
        'sales_for',
        'support_for'
    )),

    -- Optional metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),

    UNIQUE(source_work_item_id, target_work_item_id, connection_type)
);

-- Indexes
CREATE INDEX idx_wic_source ON work_item_connections(source_work_item_id);
CREATE INDEX idx_wic_target ON work_item_connections(target_work_item_id);
CREATE INDEX idx_wic_type ON work_item_connections(connection_type);

-- RLS
ALTER TABLE work_item_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (similar to work_item_team_contexts)
```

---

## Connection Types Explained

| Type | Description | Example |
|------|-------------|---------|
| `blocks` | Source blocks target from progressing | "API Spec" blocks "API Implementation" |
| `blocked_by` | Source is blocked by target | "Frontend" blocked_by "API Spec" |
| `relates_to` | General relationship, no dependency | "Login" relates_to "Signup" |
| `depends_on` | Source depends on target | "Dashboard" depends_on "Auth System" |
| `enables` | Source enables target | "User Auth" enables "Personalization" |
| `marketing_for` | Marketing work for feature | "Launch Campaign" marketing_for "New Feature" |
| `documentation_for` | Docs work for feature | "User Guide" documentation_for "Admin Panel" |
| `design_for` | Design work for feature | "Mockups" design_for "Dashboard" |
| `qa_for` | QA work for feature | "Test Cases" qa_for "Payment Flow" |
| `sales_for` | Sales enablement for feature | "Demo Script" sales_for "Enterprise SSO" |
| `support_for` | Support docs for feature | "Troubleshooting Guide" support_for "Email Sync" |

---

## UI Changes Required

### 1. Workspace Settings: Team Configuration

**Location:** `Workspace Settings > Teams > [Department]`

```
Engineering Team Configuration
├── Custom Fields
│   ├── Technical Domain (select)
│   ├── Complexity (select)
│   ├── Tech Stack (multi-select)
│   └── [+ Add Field]
│
├── Field Categories
│   ├── Technical Details
│   │   └── Technical Domain, Complexity, Tech Stack
│   ├── Security
│   │   └── Breaking Changes, Security Review
│   └── [+ Add Category]
│
├── Workflow
│   ├── Status: Backlog → Planning → In Dev → Code Review → QA → Deployed
│   └── [Edit Workflow]
│
└── Default View
    └── Board (Kanban)
```

**Implementation:** New settings page with drag-and-drop field builder

---

### 2. Work Item Detail: Team Context Tabs

**Location:** `Work Item Detail Page`

```
[Overview] [Timeline] [Tasks] [Engineering] [Design] [Marketing] [Dependencies] [Activity]

Engineering Tab:
├── Technical Domain: Backend
├── Complexity: High
├── Tech Stack: Node.js, PostgreSQL, Redis
├── Breaking Changes: Yes
├── Security Review: In Review
├── Status: Code Review
└── Deliverables:
    ├── ✅ Architecture Doc (link)
    ├── 🟡 Implementation (GitHub PR #123)
    └── ⏳ Security Audit (pending)

Design Tab:
├── Design Type: User Flow
├── Design Status: Approved
├── Accessibility Level: AA
├── Figma Link: https://figma.com/...
├── Status: Handoff
└── Deliverables:
    ├── ✅ Wireframes (link)
    ├── ✅ Visual Design (link)
    └── ✅ Prototype (link)
```

**Implementation:** Dynamic tabs based on `team_configurations` for workspace

---

### 3. Work Board: Team-Specific Views

**Location:** `Work Board > View Selector`

```
View: Engineering Board

Columns (Engineering Workflow):
├── Backlog (3 items)
├── Planning (2 items)
├── In Development (5 items)
├── Code Review (2 items)
├── QA (1 item)
└── Deployed (8 items)

Group By: Technical Domain
├── Frontend (4 items)
├── Backend (6 items)
└── Infrastructure (2 items)

Filter: Complexity = High, Security Review = Required
```

**Implementation:** Board view respects team configuration and custom fields

---

### 4. Cross-Team Alignment Dashboard

**Location:** `Workspace Dashboard > Cross-Team View`

```
Feature: User Authentication
├── Product: P0 Priority, High Customer Impact
├── Engineering: High Complexity, In Code Review
├── Design: Approved, Handoff Complete
├── Marketing: Content in Draft, Launch 2025-03-15
├── Sales: Demo Script Ready
└── Support: Documentation In Progress

🚨 Blockers:
- Engineering blocked by Security Review
- Marketing waiting on Engineering completion

✅ On Track:
- Design delivered on time
- Sales enablement ready

⏰ At Risk:
- Support docs behind schedule (launch in 2 weeks)
```

**Implementation:** New dashboard view aggregating all team contexts

---

## API Endpoints (New)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workspaces/[id]/team-configurations` | List team configurations |
| POST | `/api/workspaces/[id]/team-configurations` | Create team configuration |
| PATCH | `/api/team-configurations/[id]` | Update team configuration |
| DELETE | `/api/team-configurations/[id]` | Delete team configuration |
| GET | `/api/work-items/[id]/team-contexts` | Get all team contexts |
| POST | `/api/work-items/[id]/team-contexts` | Create team context |
| PATCH | `/api/work-items/[id]/team-contexts/[dept]` | Update team context |
| DELETE | `/api/work-items/[id]/team-contexts/[dept]` | Delete team context |
| GET | `/api/work-items/[id]/connections` | List connections |
| POST | `/api/work-items/[id]/connections` | Create connection |
| DELETE | `/api/connections/[id]` | Delete connection |

---

## Migration Strategy

### Phase 0: Foundation (Weeks 9-10, ~15h)

**Before this feature can be implemented:**

1. **Create Departments Table:**
```sql
CREATE TABLE departments (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- product, engineering, design, etc.
    parent_id TEXT REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Create Workflow States System:**
```sql
CREATE TABLE workflow_templates (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    name TEXT NOT NULL, -- "Engineering Kanban", "Design Sprint"
    department TEXT NOT NULL,
    states JSONB NOT NULL -- Array of state definitions
);

CREATE TABLE workflow_states (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    department TEXT NOT NULL,
    template_id TEXT REFERENCES workflow_templates(id),
    states JSONB NOT NULL
);
```

3. **Extend Workspace Modes:**
```sql
ALTER TABLE workspaces
ADD COLUMN mode TEXT DEFAULT 'project' CHECK (mode IN ('project', 'portfolio', 'enterprise'));
-- Only 'enterprise' mode enables Cross-Team Configuration
```

### Phase 1: Team Configuration (Week 11, ~10h)

1. Create `team_configurations` table
2. Build Team Configuration UI in Workspace Settings
3. API endpoints for CRUD operations
4. Add default templates (Engineering, Design, Marketing, etc.)

### Phase 2: Work Item Contexts (Week 11-12, ~15h)

1. Create `work_item_team_contexts` table
2. Add dynamic tabs to Work Item Detail Page
3. API endpoints for team context CRUD
4. Real-time sync with Supabase

### Phase 3: Connections & Views (Week 12, ~5h)

1. Create `work_item_connections` table
2. Build Cross-Team Alignment Dashboard
3. Add team-specific filtering to Work Board
4. Enable cross-team reporting in Analytics

---

## Testing Strategy

### Unit Tests (Jest)

- `team-configuration-validator.ts` - Test field schema validation
- `team-context-manager.ts` - Test context CRUD operations
- `connection-validator.ts` - Test circular dependency detection

### E2E Tests (Playwright)

**Test Case 1: Create Engineering Configuration**
1. Navigate to Workspace Settings > Teams > Engineering
2. Add custom field: "Technical Domain" (select)
3. Add field options: Frontend, Backend, Database
4. Save configuration
5. Verify field appears in Work Item Detail

**Test Case 2: Add Engineering Context to Work Item**
1. Open work item "User Authentication"
2. Click "Engineering" tab
3. Set Technical Domain = "Backend"
4. Set Complexity = "High"
5. Save and verify context persists

**Test Case 3: Create Cross-Team Connection**
1. Open work item "Launch Campaign" (Marketing)
2. Add connection: "marketing_for" → "User Authentication" (Feature)
3. Verify connection appears in both work items
4. Check Cross-Team Dashboard shows relationship

**Test Case 4: Team-Specific Board View**
1. Switch to Engineering team view
2. Board shows Engineering workflow columns
3. Group by "Technical Domain"
4. Filter by "Complexity = High"
5. Verify only Engineering team sees these columns

---

## Backward Compatibility

### Keep Working

- Existing work item fields remain unchanged
- Teams without configuration see default view
- Work items without team contexts work as before
- No breaking changes to existing APIs

### Deprecation Timeline

- **Phase 1:** Cross-Team Configuration is opt-in (new feature)
- **Phase 2:** Encourage adoption with templates
- **Phase 3:** No deprecation - both modes coexist indefinitely

**Design Decision:** This is an **enhancement**, not a replacement. Teams can choose to use generic fields or team-specific configurations.

---

## Pricing & Plan Gates

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Generic work item fields | ✅ | ✅ | ✅ |
| Basic department tags | ✅ | ✅ | ✅ |
| Team configurations (3 departments) | ❌ | ✅ | ✅ |
| Unlimited departments | ❌ | ❌ | ✅ |
| Custom workflow states | ❌ | ✅ | ✅ |
| Cross-team alignment dashboard | ❌ | ❌ | ✅ |
| Work item connections | ❌ | ✅ | ✅ |
| Team-specific views | ❌ | ✅ | ✅ |

**Rationale:** This is an **enterprise collaboration feature**. Small teams (Free/Pro) benefit less from departmental separation.

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Load Team Contexts:**
   - Only fetch contexts when user opens the specific tab
   - Cache contexts in React Query with 5-minute TTL

2. **Index Strategy:**
   - Index on `work_item_id + department` for fast lookups
   - Index on `department + team_status` for board views
   - Use JSONB GIN indexes for `field_values` queries

3. **Query Optimization:**
   - Batch load all contexts for work items in list views
   - Use Supabase `select` with specific JSON paths for filtering

4. **Real-time Updates:**
   - Subscribe to team contexts only for open work item
   - Unsubscribe when tab is closed or user navigates away

---

## Implementation Priority

| Priority | Item | Time Est |
|----------|------|----------|
| **P0** | Departments table + architecture | 5h |
| **P0** | Workflow States system | 10h |
| **P1** | Team Configuration UI | 8h |
| **P1** | Work Item Detail tabs | 10h |
| **P2** | Cross-Team Dashboard | 6h |
| **P2** | Work Board team views | 4h |
| **P3** | Work item connections | 4h |
| **P3** | Analytics cross-team reports | 3h |

**Total Time**: ~50 hours (30h for this feature + 15h foundation)

---

## Review Trigger

**When:** After Week 8 + 2-4 weeks of post-launch stabilization

**Who:** Product team + 2 enterprise beta customers

**Questions to Ask:**

1. Is the Work Item Detail 8-tab structure stable and proven?
2. Do we have 2+ enterprise customers requesting multi-team features?
3. Are Departments and Workflow States implemented?
4. Do we have ~50 hours before next major release?
5. Would this feature differentiate us from competitors (Linear, Jira)?

**Decision Matrix:**

- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 2: ⏸️ **POSTPONE** until demand validates
- If "NO" to question 3: 🚧 **BLOCKED** - build foundation first
- If "NO" to question 4: ⏸️ **POSTPONE** to next quarter

---

## Alternatives Considered

### Alternative 1: "Tag-Based Approach"

**Description:** Instead of team-specific tables, use tags like `#engineering`, `#design`

**Rejected Because:**
- ❌ No type safety (tags are strings, not structured data)
- ❌ Can't enforce field validation
- ❌ No custom workflows per team
- ❌ Poor UX (tags don't provide forms or dropdowns)

### Alternative 2: "Separate Workspaces Per Team"

**Description:** Engineering, Design, Marketing each get their own workspace

**Rejected Because:**
- ❌ Data silos - no cross-team visibility
- ❌ Duplicate work items across workspaces
- ❌ No unified alignment dashboard
- ❌ Poor collaboration UX

### Alternative 3: "Linear's Approach (Inherit All, Filter Per Team)"

**Description:** Copy Linear's model of team-specific views on shared issues

**Partially Adopted:**
- ✅ Keep work items shared (one source of truth)
- ✅ Enable team-specific fields and workflows
- ✅ Provide unified and filtered views
- ❌ Don't copy Linear's limited field types (only text, select, user)
- ✅ Our advantage: Richer field types (rich text, attachments, connections)

---

## Related Documentation

- [Implementation Plan](../implementation/README.md) - Overall project roadmap
- [Work Board 3.0 Implementation](../implementation/work-board-3.0.md) - Board view architecture
- [Work Item Detail 8-Tab Structure](../implementation/week-6-timeline-execution.md) - Detail page design
- [Recommended Agents](../planning/RECOMMENDED_AGENTS.md) - Claude agents for implementation
- [Postponed Features](README.md) - Summary tracking

---

## Success Metrics

**Post-Launch (Month 2-3):**

| Metric | Target |
|--------|--------|
| Enterprise customers using team configs | 50%+ |
| Average fields filled per team context | 80%+ |
| Cross-team connections created | 100+ per workspace |
| Time to find cross-team blockers | <2 minutes |
| User satisfaction (team alignment) | 4.5/5 stars |

**Validation Questions:**
1. Are teams using team-specific fields instead of generic ones?
2. Are cross-team connections reducing alignment meetings?
3. Is the Cross-Team Dashboard actionable?

---

**Last Reviewed:** December 1, 2025
**Next Review:** After Week 8 completion + enterprise beta feedback

[← Back to Postponed Features](README.md)
