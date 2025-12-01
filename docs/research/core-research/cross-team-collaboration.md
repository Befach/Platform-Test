# Cross-Team Collaboration Research

**Research Date**: 2025-12-01
**Category**: Team Collaboration Patterns
**Key Finding**: 75% of cross-functional teams are dysfunctional
**Decision ID(s)**: ADR-007
**Status**: Accepted
**Last Reviewed**: 2025-12-01

---

## Executive Summary

Cross-functional team collaboration is one of the most challenging aspects of product development. Research shows that 75% of cross-functional teams fail to deliver, primarily due to unclear missions, competing priorities, and lack of shared language. This document outlines the challenges, proven solutions, and a team-based configuration model that transforms product tools into company-wide alignment platforms.

**Key Insight**: A single work item needs DIFFERENT contexts for DIFFERENT teams, but they must all connect back to the SAME strategic foundation.

---

## Why Cross-Functional Teams Fail

### HBR/Atlassian Research: Top 5 Failure Reasons

| Reason | Description | Our Solution |
|--------|-------------|--------------|
| **Fuzzy mission** | No clear goal or parameters | Strategy Foundation (Part 4) |
| **Competing priorities** | Members focus on own department | Unified work item visibility |
| **Power dynamics** | Different seniority levels create friction | Role-based permissions |
| **Lack of authority** | Can't take action without approvals | Clear ownership model |
| **No shared language** | Different terminology across departments | Unified taxonomy |

### The 75% Dysfunctional Statistic

From Harvard Business Review research:
> "75% of cross-functional teams are dysfunctional. They fail on at least three of five criteria: meeting a planned budget, staying on schedule, adhering to specifications, meeting customer expectations, and maintaining alignment with corporate goals."

---

## The Core Problem: Siloed Teams

Most product tools are built for ONE team (usually Engineering).

**Reality**: Product success requires alignment across:
- **Product** - Strategy, prioritization, roadmap
- **Engineering** - Implementation, technical decisions
- **Design** - User experience, visual design
- **Marketing** - Messaging, campaigns, launches
- **Sales** - Positioning, demos, objection handling
- **Support** - Documentation, training, issue tracking
- **Leadership** - Visibility, reporting, decisions

Each team needs:
- Different **views** of the same data
- Different **fields** relevant to their work
- Different **categorizations** for their domain
- **Connections** to work happening in other teams

---

## One Work Item, Multiple Team Contexts

### Core Concept: Team-Based Configuration Model

```
WORK ITEM: "OAuth Login"
│
├─ PRODUCT CONTEXT
│   ├─ Priority: P1
│   ├─ Customer Impact: High (Primary persona)
│   ├─ Strategic Pillar: "Speed over features"
│   └─ North Star Impact: +15% signup speed
│
├─ ENGINEERING CONTEXT
│   ├─ Technical Domain: Authentication
│   ├─ Complexity: Medium
│   ├─ Dependencies: Auth0 SDK, Database schema
│   ├─ Tech Stack: Next.js, Supabase Auth
│   └─ Tasks: [Design → Implement → Test → Deploy]
│
├─ DESIGN CONTEXT
│   ├─ Design System: Uses existing button patterns
│   ├─ Accessibility: AAA contrast required
│   ├─ User Flow: 3-step signup → 1-step with OAuth
│   └─ Deliverables: [Mockups, Prototype, Specs]
│
├─ MARKETING CONTEXT
│   ├─ Campaign: "Speed Week Launch"
│   ├─ Messaging Angle: "10-second signup"
│   ├─ Target Audience: Startup Founders
│   ├─ Channels: Twitter, Indie Hackers
│   └─ Deliverables: [Landing page, Social posts, Email]
│
├─ SALES CONTEXT
│   ├─ Positioning: "Frictionless onboarding"
│   ├─ Objection Handler: "No separate passwords needed"
│   ├─ Demo Script: Show Google → instant access
│   └─ Competitive Angle: "10x faster than Jira setup"
│
└─ SUPPORT CONTEXT
    ├─ Documentation: OAuth setup guide
    ├─ FAQ: "What if Google login fails?"
    ├─ Training: Support team walkthrough
    └─ Known Issues: Rate limits with Google API
```

---

## Successful Cross-Team Patterns

### Industry Examples

| Tool | Approach | Key Lesson |
|------|----------|------------|
| **Asana** | Portfolios for cross-team visibility | Single source of truth across teams |
| **Productboard** | Custom Roles for governance | Different permissions per role |
| **Jira + Confluence** | Unified platform | Avoid tool sprawl |
| **Linear** | Cycles across teams | Synchronized timelines |

### Productboard Custom Roles Quote

> "As Product Operations, with Custom Roles I can ensure consistency, scalability, and the integrity of the data in Productboard" - Dana McKnight, Teladoc Health

---

## Team-Specific Field Templates

### Engineering Fields
```typescript
const ENGINEERING_FIELDS = [
  { name: 'technical_domain', type: 'select',
    options: ['Frontend', 'Backend', 'Database', 'Infrastructure', 'Security', 'Performance'] },
  { name: 'complexity', type: 'select',
    options: ['Trivial', 'Low', 'Medium', 'High', 'Very High'] },
  { name: 'tech_stack', type: 'multi_select',
    options: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'] },
  { name: 'breaking_changes', type: 'boolean', defaultValue: false },
  { name: 'requires_migration', type: 'boolean', defaultValue: false },
  { name: 'security_review', type: 'select',
    options: ['Not Required', 'Pending', 'Approved', 'Rejected'] },
  { name: 'performance_impact', type: 'select',
    options: ['None', 'Positive', 'Negative - Acceptable', 'Negative - Needs Optimization'] },
]

const ENGINEERING_CATEGORIES = [
  { name: 'Feature', color: 'blue', description: 'New functionality' },
  { name: 'Bug Fix', color: 'red', description: 'Fixing existing issues' },
  { name: 'Tech Debt', color: 'yellow', description: 'Code quality improvements' },
  { name: 'Infrastructure', color: 'purple', description: 'DevOps and platform work' },
  { name: 'Security', color: 'orange', description: 'Security improvements' },
  { name: 'Performance', color: 'green', description: 'Speed optimizations' },
]
```

### Design Fields
```typescript
const DESIGN_FIELDS = [
  { name: 'design_type', type: 'select',
    options: ['UI Design', 'UX Research', 'Prototype', 'Design System', 'Illustration', 'Branding'] },
  { name: 'design_status', type: 'select',
    options: ['Not Started', 'Research', 'Wireframes', 'Hi-Fi', 'Review', 'Approved', 'Handed Off'] },
  { name: 'accessibility_level', type: 'select',
    options: ['AA', 'AAA', 'Not Applicable'] },
  { name: 'figma_link', type: 'url' },
  { name: 'prototype_link', type: 'url' },
  { name: 'design_system_components', type: 'multi_select',
    options: ['Button', 'Form', 'Modal', 'Card', 'Table', 'New Component'] },
  { name: 'user_testing_required', type: 'boolean', defaultValue: false },
]

const DESIGN_CATEGORIES = [
  { name: 'New Feature', color: 'blue', description: 'Designing new functionality' },
  { name: 'Improvement', color: 'green', description: 'Enhancing existing designs' },
  { name: 'Research', color: 'purple', description: 'User research and testing' },
  { name: 'Design System', color: 'orange', description: 'Component library work' },
  { name: 'Bug Fix', color: 'red', description: 'Fixing design issues' },
]
```

### Marketing Fields
```typescript
const MARKETING_FIELDS = [
  { name: 'campaign', type: 'text' },
  { name: 'target_audience', type: 'multi_select',
    options: ['Startup Founders', 'Enterprise PMs', 'Indie Developers', 'Design Teams'] },
  { name: 'channels', type: 'multi_select',
    options: ['Twitter', 'LinkedIn', 'Product Hunt', 'Indie Hackers', 'Email', 'Blog', 'YouTube'] },
  { name: 'messaging_angle', type: 'text' },
  { name: 'launch_date', type: 'date' },
  { name: 'content_status', type: 'select',
    options: ['Not Started', 'Drafting', 'Review', 'Approved', 'Published'] },
  { name: 'metrics_goal', type: 'text' },
]

const MARKETING_CATEGORIES = [
  { name: 'Launch', color: 'red', description: 'Feature/product launches' },
  { name: 'Campaign', color: 'blue', description: 'Marketing campaigns' },
  { name: 'Content', color: 'green', description: 'Blog, video, social content' },
  { name: 'Event', color: 'purple', description: 'Webinars, conferences' },
  { name: 'Partnership', color: 'orange', description: 'Co-marketing activities' },
]
```

### Sales Fields
```typescript
const SALES_FIELDS = [
  { name: 'positioning', type: 'text' },
  { name: 'objection_handlers', type: 'rich_text' },
  { name: 'competitive_angle', type: 'text' },
  { name: 'demo_script', type: 'rich_text' },
  { name: 'target_segment', type: 'multi_select',
    options: ['SMB', 'Mid-Market', 'Enterprise', 'Startups'] },
  { name: 'deal_enabler', type: 'boolean', defaultValue: false },
  { name: 'pricing_tier', type: 'select',
    options: ['Free', 'Pro', 'Enterprise', 'All Tiers'] },
]

const SALES_CATEGORIES = [
  { name: 'Deal Enabler', color: 'green', description: 'Unblocks specific deals' },
  { name: 'Competitive', color: 'blue', description: 'Competitive advantage' },
  { name: 'Enterprise', color: 'purple', description: 'Enterprise requirements' },
  { name: 'Demo', color: 'orange', description: 'Improves demo experience' },
]
```

### Support Fields
```typescript
const SUPPORT_FIELDS = [
  { name: 'documentation_status', type: 'select',
    options: ['Not Needed', 'Not Started', 'In Progress', 'Review', 'Published'] },
  { name: 'training_required', type: 'boolean', defaultValue: false },
  { name: 'known_issues', type: 'rich_text' },
  { name: 'faq_entries', type: 'rich_text' },
  { name: 'support_article_link', type: 'url' },
  { name: 'customer_communication', type: 'select',
    options: ['None', 'Changelog', 'Email', 'In-App', 'All'] },
]

const SUPPORT_CATEGORIES = [
  { name: 'Documentation', color: 'blue', description: 'Help articles and guides' },
  { name: 'Training', color: 'green', description: 'Internal training materials' },
  { name: 'Customer Communication', color: 'purple', description: 'Release notes, announcements' },
  { name: 'FAQ', color: 'orange', description: 'Frequently asked questions' },
]
```

---

## Cross-Team Connection Types

### Connection Matrix

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               CROSS-TEAM CONNECTIONS                    │
                    ├─────────────────────────────────────────────────────────┤
                    │                                                         │
                    │  FEATURE (Product/Engineering)                          │
                    │       ↑                                                  │
                    │       │ enables                                         │
                    │       │                                                  │
                    │  ┌────┴────────────────────────────────────────────┐    │
                    │  │                                                  │    │
                    │  ▼           ▼              ▼              ▼        │    │
                    │  DESIGN      MARKETING     SALES          SUPPORT  │    │
                    │  WORK        CAMPAIGN      ENABLEMENT     DOCS     │    │
                    │  (design_for) (marketing_for) (enables)   (docs_for)   │
                    │                                                         │
                    │  Connection Types:                                      │
                    │  • blocks / blocked_by                                  │
                    │  • depends_on / enables                                 │
                    │  • relates_to                                           │
                    │  • parent_of / child_of                                 │
                    │  • marketing_for / design_for / documentation_for      │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘
```

### Connection Type Definitions

| Type | Description | Use Case |
|------|-------------|----------|
| `blocks` | Source blocks target from starting | Engineering blocker |
| `blocked_by` | Source is blocked by target | Waiting on dependency |
| `relates_to` | General relationship | Related work items |
| `depends_on` | Source needs target complete | Sequential dependency |
| `enables` | Source enables target to proceed | Feature unlocks capability |
| `duplicates` | Source is duplicate of target | Deduplication |
| `parent_of` | Hierarchical parent | Epic → Stories |
| `child_of` | Hierarchical child | Story → Epic |
| `marketing_for` | Marketing work for feature | Campaign for feature |
| `documentation_for` | Docs for feature | Support docs |
| `design_for` | Design work for feature | UI/UX design |
| `qa_for` | QA work for feature | Testing |

### Implementation Example

```typescript
// When a feature is created, prompt for cross-team work items
function suggestCrossTeamWork(feature: WorkItem): CrossTeamSuggestion[] {
  return [
    {
      department: 'design',
      connection_type: 'design_for',
      suggested_name: `Design: ${feature.name}`,
      suggested_fields: {
        design_type: 'UI Design',
        design_status: 'Not Started',
      },
      prompt: 'Does this feature need design work?'
    },
    {
      department: 'marketing',
      connection_type: 'marketing_for',
      suggested_name: `Launch: ${feature.name}`,
      suggested_fields: {
        campaign: feature.name,
        content_status: 'Not Started',
      },
      prompt: 'Will this feature need a marketing launch?'
    },
    {
      department: 'support',
      connection_type: 'documentation_for',
      suggested_name: `Docs: ${feature.name}`,
      suggested_fields: {
        documentation_status: 'Not Started',
      },
      prompt: 'Does this feature need documentation?'
    }
  ]
}
```

---

## Team Views of Same Data

### Engineering View (Board)
```
┌─────────────────────────────────────────────────────────────────┐
│  Engineering Board                           [+ Add Task]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TODO          IN PROGRESS      IN REVIEW       DONE           │
│  ┌─────────┐   ┌─────────┐     ┌─────────┐    ┌─────────┐      │
│  │OAuth    │   │Database │     │Auth     │    │Login    │      │
│  │Setup    │   │Schema   │     │Tests    │    │UI       │      │
│  │         │   │         │     │         │    │         │      │
│  │[M] Auth │   │[L] DB   │     │[S] Auth │    │[M] FE   │      │
│  │@alice   │   │@bob     │     │@carol   │    │@dave    │      │
│  └─────────┘   └─────────┘     └─────────┘    └─────────┘      │
│                                                                 │
│  Legend: [Effort] Domain @Assignee                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Marketing View (Campaign Timeline)
```
┌─────────────────────────────────────────────────────────────────┐
│  Marketing Campaigns                    [+ Add Campaign]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dec 2025                          Jan 2026                    │
│  ├───────────────────────────────────┼────────────────────────│
│  │                                   │                         │
│  │  ████ OAuth Launch Campaign       │                         │
│  │       (Dec 15-22)                 │                         │
│  │       Twitter, Product Hunt       │                         │
│  │       → Links to: OAuth Feature   │                         │
│  │                                   │                         │
│  │                    ██████████████ │ Year-End Review         │
│  │                    (Dec 28-Jan 5) │                         │
│  │                                   │                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sales View (Feature Availability)
```
┌─────────────────────────────────────────────────────────────────┐
│  Sales Enablement                      [Feature Status]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Shipping This Month:                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✅ OAuth Login                                             │ │
│  │    Positioning: "10-second signup"                         │ │
│  │    Segment: All tiers                                      │ │
│  │    Competitive: "10x faster than Jira"                     │ │
│  │    [View Demo Script] [Copy Pitch]                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Coming Next Month:                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔜 SSO Integration                                         │ │
│  │    Unlocks: Enterprise deals                               │ │
│  │    Status: In Development (70%)                            │ │
│  │    [Subscribe for Updates]                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Support View (Documentation Status)
```
┌─────────────────────────────────────────────────────────────────┐
│  Documentation Tracker                    [+ Add Doc]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Needs Documentation (Shipping Soon):                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⚠️ OAuth Login (Ships Dec 15)                              │ │
│  │    Status: Not Started                                      │ │
│  │    Required: Setup Guide, FAQ, Troubleshooting             │ │
│  │    [Start Documentation]                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  In Progress:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📝 Team Dashboards                                         │ │
│  │    Status: Drafting (60%)                                  │ │
│  │    @support_writer                                          │ │
│  │    [View Draft] [Request Review]                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Unified Dashboard: Cross-Team Alignment

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OAuth Login Feature                                    [All Teams]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STRATEGY ALIGNMENT                                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│  🎯 Customer Impact: HIGH (Primary: Startup Founders)                   │
│  📊 North Star: +15% signup speed                                       │
│  ⚡ Pillar: "Speed over features" ✅                                    │
│                                                                         │
│  CROSS-TEAM STATUS                                                      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Team          Status              Progress    Blocker?                 │
│  ────────────  ──────────────────  ─────────  ─────────                │
│  🔧 Engineering  In Development     ████████░░ 80%     ✅               │
│  🎨 Design       Handed Off         ██████████ 100%    ✅               │
│  📢 Marketing    Drafting Content   ██████░░░░ 60%     ✅               │
│  💼 Sales        Preparing Demo     ████░░░░░░ 40%     ⚠️ Needs script │
│  📚 Support      Not Started        ░░░░░░░░░░ 0%      ⚠️ Blocked       │
│                                                                         │
│  CONNECTIONS                                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  → Design: OAuth UI Mockups (design_for) ✅ Complete                   │
│  → Marketing: Speed Week Launch (marketing_for) 🔄 In Progress         │
│  → Support: OAuth Setup Guide (documentation_for) ⏳ Not Started       │
│  ← Blocks: SSO Feature (depends on OAuth infrastructure)               │
│                                                                         │
│  TIMELINE                                                               │
│  ─────────────────────────────────────────────────────────────────────  │
│  Dec 1    Dec 8    Dec 15   Dec 22                                      │
│  │        │        │        │                                           │
│  ├──🎨──▶ Design Complete                                               │
│  │        ├──🔧──▶ Engineering Complete                                 │
│  │        │        ├──📢──▶ Marketing Launch                            │
│  │        │        ├──💼──▶ Sales Enabled                               │
│  │        │        └──📚──▶ Docs Published                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Team Configurations Table

```sql
-- Team-specific configurations per workspace
CREATE TABLE team_configurations (
  id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISSMS')),
  team_id TEXT NOT NULL REFERENCES teams(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),

  -- Team type
  department TEXT NOT NULL CHECK (department IN (
    'product', 'engineering', 'design', 'marketing', 'sales', 'support', 'leadership', 'custom'
  )),
  custom_department_name TEXT,  -- If department = 'custom'

  -- Configuration
  enabled BOOLEAN DEFAULT true,

  -- Custom fields for this team
  custom_fields JSONB DEFAULT '[]',
  -- Structure: [{name, type, options[], required, defaultValue}]

  -- Categories specific to this team
  categories JSONB DEFAULT '[]',
  -- Structure: [{name, color, description}]

  -- Default view preferences
  default_view TEXT DEFAULT 'list',  -- list, board, timeline, table
  default_filters JSONB DEFAULT '{}',
  default_sort JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, department)
);

-- Add indexes
CREATE INDEX idx_team_configurations_workspace ON team_configurations(workspace_id);
CREATE INDEX idx_team_configurations_team ON team_configurations(team_id);
```

### Work Item Team Contexts Table

```sql
-- Team-specific context for each work item
CREATE TABLE work_item_team_contexts (
  id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISSMS')),
  team_id TEXT NOT NULL REFERENCES teams(id),
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  department TEXT NOT NULL,

  -- Custom field values for this team's context
  field_values JSONB DEFAULT '{}',

  -- Team-specific categorization
  categories TEXT[] DEFAULT '{}',

  -- Team-specific status (optional override)
  team_status TEXT,

  -- Team-specific notes/context
  notes TEXT,

  -- Team deliverables
  deliverables JSONB DEFAULT '[]',
  -- Structure: [{name, status, dueDate, assignee}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(work_item_id, department)
);

-- Add indexes
CREATE INDEX idx_work_item_team_contexts_work_item ON work_item_team_contexts(work_item_id);
CREATE INDEX idx_work_item_team_contexts_department ON work_item_team_contexts(department);
CREATE INDEX idx_work_item_team_contexts_team ON work_item_team_contexts(team_id);
```

### Work Item Connections Table

```sql
-- Cross-team connections (links between work items)
CREATE TABLE work_item_connections (
  id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISSMS')),
  team_id TEXT NOT NULL REFERENCES teams(id),

  source_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  target_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

  -- Connection type
  connection_type TEXT NOT NULL CHECK (connection_type IN (
    'blocks',           -- Source blocks target
    'blocked_by',       -- Source is blocked by target
    'relates_to',       -- General relationship
    'depends_on',       -- Source depends on target
    'enables',          -- Source enables target
    'duplicates',       -- Source duplicates target
    'parent_of',        -- Source is parent of target
    'child_of',         -- Source is child of target
    'marketing_for',    -- Marketing work for feature
    'documentation_for', -- Docs for feature
    'design_for',       -- Design work for feature
    'qa_for'            -- QA work for feature
  )),

  -- Optional context
  notes TEXT,

  -- Bidirectional or not
  is_bidirectional BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),

  -- Prevent duplicate connections
  UNIQUE(source_work_item_id, target_work_item_id, connection_type)
);

-- Add indexes
CREATE INDEX idx_work_item_connections_source ON work_item_connections(source_work_item_id);
CREATE INDEX idx_work_item_connections_target ON work_item_connections(target_work_item_id);
CREATE INDEX idx_work_item_connections_type ON work_item_connections(connection_type);
CREATE INDEX idx_work_item_connections_team ON work_item_connections(team_id);
```

---

## Implementation Priority

### Phase 1: Team Configuration
1. Create `team_configurations` table
2. Build team setup wizard
3. Create preset templates (Engineering, Design, Marketing, Sales, Support)
4. Add team context to work item detail page

**Estimated Effort**: 2-3 days
**Dependencies**: None
**Week**: 7

### Phase 2: Custom Fields
1. Custom field builder UI
2. Field type implementations (text, select, multi-select, date, url, boolean, rich_text)
3. Team-specific field visibility
4. Field values storage and retrieval

**Estimated Effort**: 3-4 days
**Dependencies**: Phase 1
**Week**: 7-8

### Phase 3: Categorization
1. Team-specific categories
2. Category management UI
3. Category assignment in work items
4. Category-based filtering and views

**Estimated Effort**: 2 days
**Dependencies**: Phase 1
**Week**: 8

### Phase 4: Connections
1. Create `work_item_connections` table
2. Connection type definitions
3. Connection creation UI
4. Cross-team dependency visualization
5. Bi-directional connection sync

**Estimated Effort**: 3-4 days
**Dependencies**: Phase 2
**Week**: 8

### Phase 5: Team Views
1. Team-specific list/board/timeline views
2. Saved view configurations
3. Team dashboards
4. Cross-team unified view

**Estimated Effort**: 4-5 days
**Dependencies**: Phases 2, 3, 4
**Week**: 8-9

---

## Summary: Why Cross-Team Configuration Matters

| Without | With |
|---------|------|
| Engineering tracks in Jira | All teams see same source of truth |
| Marketing uses Notion separately | Marketing context attached to features |
| Sales improvises positioning | Sales sees feature-specific enablement |
| Support learns at launch | Support prepares documentation in advance |
| No visibility across teams | Unified dashboard shows all team statuses |
| Features ship without coordination | Cross-team dependencies are explicit |
| 75% of teams are dysfunctional | Alignment built into the workflow |
| Competing priorities dominate | Shared strategic foundation visible |

**The key insight**: A single work item needs DIFFERENT contexts for DIFFERENT teams, but they must all connect back to the SAME strategic foundation.

This transforms a product tool into a **company-wide alignment platform**.

---

## Related Research

- [Progressive Disclosure UX](progressive-disclosure-ux.md) - Role-based views
- [Flexibility vs Simplicity](../supporting-research/flexibility-vs-simplicity.md) - Configuration balance
- [Dashboard Design](../supporting-research/dashboard-design.md) - Team-specific dashboards
- [Ultra Deep Research Findings](ultra-deep-research-findings.md) - UX patterns and integration

---

## Sources

- Harvard Business Review: Cross-Functional Team Research
- Atlassian: Team Collaboration Studies
- Productboard: Custom Roles Documentation
- Asana: Portfolio Management
- McKinsey: Digital Transformation Research
- Gallup: Employee Engagement Studies
- Parallel AI Search API: Industry Analysis
