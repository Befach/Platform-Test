# Linear Architecture Research

**Decision ID(s)**: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006
**Status**: Accepted
**Research Date**: 2025-12-01
**Last Reviewed**: 2025-12-01
**Next Review**: End of Week 8 / After department implementation milestone
**Supersedes**: N/A
**Superseded By**: N/A
**Research Method**: Parallel AI Ultra + Search API + Extract API

---

## Executive Summary

Linear is the closest architectural inspiration for our Product Lifecycle Management Platform. This document captures comprehensive research on Linear's data model, entity hierarchy, API patterns, and workflow design to inform our architecture decisions.

---

## Context

We needed to understand how Linear structures work items, teams, projects, and workflows to build a similar but enhanced platform that adds product lifecycle stages and strategy alignment.

---

## Linear's Entity Hierarchy

### Core Structure

```
WORKSPACE (Company Level)
└── TEAMS (Engineering, Design, Product, etc.)
     ├── Issues (strictly team-scoped, ID: TEAM-123)
     ├── Cycles (auto-repeating sprints, 1-8 weeks)
     ├── WorkflowStates (customizable per team)
     └── Triage (optional inbox)

CROSS-TEAM CONTAINERS:
├── Projects (span multiple teams, contain milestones)
├── Initiatives (strategic OKR-level, organize projects)
└── Labels (shared vocabulary across teams)
```

### Key Constraints

| Constraint | Description | Rationale |
|------------|-------------|-----------|
| **Issue → One Team** | Every issue MUST belong to exactly one team | Clear ownership, accurate metrics |
| **Issue ID Format** | `TEAM-NUMBER` (e.g., ENG-123) | Human-readable, team context |
| **Projects Cross-Team** | Projects can span multiple teams | Cross-functional coordination |
| **Cycles ≠ Releases** | Cycles are team cadence, not tied to releases | Decouples sprint from deployment |

---

## Entity Relationship Analysis

### Primary Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LINEAR RELATIONSHIP MODEL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Team ──────────┬──────────────── Issues (1:N, mandatory)           │
│                 ├──────────────── Cycles (1:N)                      │
│                 ├──────────────── WorkflowStates (1:N)              │
│                 └──────────────── Triage (0:1, optional)            │
│                                                                      │
│  Project ───────┬──────────────── Issues (N:M, cross-team)          │
│                 └──────────────── Milestones (1:N)                  │
│                                                                      │
│  Initiative ────┴──────────────── Projects (1:N)                    │
│                                                                      │
│  Issue ─────────┬──────────────── Issue (blocks/blocked_by)         │
│                 ├──────────────── Issue (parent/sub-issue)          │
│                 └──────────────── Labels (N:M)                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Cardinality Summary

| Relationship | Type | Notes |
|--------------|------|-------|
| Team → Issues | 1:N mandatory | Issue requires team |
| Team → Cycles | 1:N | Team can have multiple cycles |
| Team → WorkflowStates | 1:N | Custom states per team |
| Project → Issues | N:M | Cross-team aggregation |
| Project → Milestones | 1:N | Stage gates within project |
| Initiative → Projects | 1:N | Strategic grouping |
| Issue → Issue | N:M | Dependencies, parent-child |

---

## WorkflowState Types

Linear defines these state categories:

| Type | Description | Examples |
|------|-------------|----------|
| `backlog` | Items not yet started | Backlog, Icebox |
| `unstarted` | Ready to work on | Todo, Ready |
| `started` | Work in progress | In Progress, In Review |
| `completed` | Successfully done | Done, Deployed |
| `canceled` | Will not be done | Won't Fix, Duplicate |
| `triage` | Needs categorization | Triage, Inbox |

### Default States (Per Team)

Teams get default states but can customize:

- Backlog
- Todo
- In Progress
- In Review
- Done
- Canceled

---

## Triage Workflow

### Purpose

Triage provides a staging area for incoming requests that haven't been categorized or assigned to a team.

### Sources

| Source | Description |
|--------|-------------|
| Integrations | Issues from Zendesk, Intercom, GitHub |
| Non-team members | Requests from stakeholders |
| Asks feature | Internal requests via Slack |
| Quick capture | Rapid issue creation without details |

### Actions

| Action | Result |
|--------|--------|
| **Accept** | Move to team's backlog, assign |
| **Decline** | Close with reason |
| **Duplicate** | Link to existing issue, close |
| **Snooze** | Defer for later review |

---

## Cycles (Sprints)

### Key Characteristics

| Attribute | Description |
|-----------|-------------|
| **Team-Scoped** | Each team has own cycles |
| **Auto-Repeating** | 1-8 week duration, auto-create next |
| **Rollover** | Incomplete issues move to next cycle |
| **Not Release-Tied** | Cycles ≠ deployments |

### Why Separate from Releases

Linear decouples team cadence (cycles) from product releases:

- Teams can ship continuously
- Sprint completion ≠ customer release
- Different teams can have different cycle lengths

---

## Initiatives (Replaced Roadmaps)

### Background

In June 2024, Linear replaced "Roadmaps" with "Initiatives" - a more strategic, OKR-aligned concept.

### Structure

```
INITIATIVE: "Improve User Activation"
├── Project: Onboarding Redesign
│   ├── Issue: Research user drop-off
│   ├── Issue: Design new flow
│   └── Issue: Implement changes
│
├── Project: First-Run Experience
│   ├── Issue: Add tooltips
│   └── Issue: Create checklist
│
└── Project: Welcome Email Sequence
    ├── Issue: Write email copy
    └── Issue: Set up automation
```

### Key Insight

Initiatives provide the "WHY" layer above projects - connecting daily work to strategic goals.

---

## API Patterns (GraphQL)

### Entity Queries

Linear uses GraphQL with these common patterns:

```graphql
# Get issues for a team
query TeamIssues($teamId: ID!) {
  team(id: $teamId) {
    issues {
      nodes {
        id
        identifier  # ENG-123
        title
        state { name }
        assignee { name }
        project { name }
      }
    }
  }
}

# Get project with cross-team issues
query ProjectIssues($projectId: ID!) {
  project(id: $projectId) {
    name
    issues {
      nodes {
        id
        identifier
        team { name }  # Shows cross-team nature
      }
    }
  }
}
```

### ID Format

- Internal: UUID
- Display: `TEAM-NUMBER` (e.g., ENG-123)
- Counter is per-team, auto-incrementing

---

## Key Decisions for Our Platform

### Decision 1: Adopt Team-Scoped Work Items [ADR-001]

**Linear's Approach**: Every issue belongs to exactly one team.

**Our Decision**: ADOPT

**Rationale**:

- Clear ownership prevents "orphan" items
- Team metrics (velocity, burndown) are accurate
- Forces intentional handoffs between teams

**Implementation**:

```sql
ALTER TABLE work_items ADD COLUMN department_id TEXT REFERENCES departments(id);
-- department_id is required for all work items
```

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Team-scoped (Linear)** | Clear ownership, accurate metrics | May feel rigid for cross-functional work | ✅ SELECTED |
| Shared work items | Flexibility | No clear owner, confusing metrics | Ownership ambiguity |
| Multi-team assignment | Can belong to multiple teams | Conflicts in workflow, unclear accountability | Too complex |

**Consequences**:

- Positive: Clear ownership, team velocity accuracy, intentional collaboration
- Negative: Requires explicit handoffs between teams
- Risks: Teams may duplicate work items instead of collaborating

### Decision 2: Cross-Team Projects [ADR-002]

**Linear's Approach**: Projects aggregate issues from multiple teams.

**Our Decision**: ADOPT (already have via workspaces)

**Rationale**:

- Workspace = Project container
- Work items from different departments can be in same workspace

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Workspace aggregation** | Already exists, fits our model | N/A | ✅ SELECTED |
| Separate cross-team entity | More explicit | Adds complexity | Unnecessary abstraction |
| No cross-team support | Simple | Can't coordinate | Blocks collaboration |

**Consequences**:

- Positive: Workspace already supports this pattern, no migration needed
- Negative: None significant
- Risks: Users may not understand workspace = project equivalence

### Decision 3: Triage Workflow [ADR-003]

**Linear's Approach**: Optional team inbox with Accept/Decline/Duplicate/Snooze.

**Our Decision**: ADOPT (Simplified)

**Rationale**:

- Useful for capturing integrations, quick ideas
- Prevents work items without proper categorization

**Implementation**:

- Add `status: 'triage'` to work items
- Triage view filters by this status
- Actions move item to proper state

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Simplified triage** | Handles intake, not complex | Less granular | ✅ SELECTED (good enough) |
| Full Linear triage | All features | More implementation | Over-engineered for MVP |
| No triage | Simple | No intake process | Loses quick capture value |

**Consequences**:

- Positive: Supports quick capture, integration intake, stakeholder requests
- Negative: Less sophisticated than Linear's full triage
- Risks: May need to expand triage features later

### Decision 4: Cycles/Sprints [ADR-004]

**Linear's Approach**: Auto-repeating team cycles.

**Our Decision**: DEFER to Phase 2

**Rationale**:

- Our timeline_items serve similar purpose
- Can add cycles later without migration impact

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Defer cycles** | Focus on core flow | Missing sprint planning | ✅ SELECTED (timeline_items bridge gap) |
| Implement cycles now | Complete feature | Delays other priorities | Not critical for MVP |
| Never add cycles | Simple forever | May need later | Too limiting long-term |

**Consequences**:

- Positive: Focus on core features, can add later without breaking changes
- Negative: Teams using sprint methodology may miss this
- Risks: May need to retrofit cycles into existing timeline structure

### Decision 5: Initiatives [ADR-005]

**Linear's Approach**: OKR-level strategic grouping above projects.

**Our Decision**: DEFER to Phase 2

**Rationale**:

- Focus on core work item flow first
- Our Product Strategy Foundation provides similar strategic layer

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Defer initiatives** | Focus on core | Missing strategic layer | ✅ SELECTED (strategy foundation bridges gap) |
| Implement initiatives now | Full strategic alignment | Complex, delays MVP | Not critical for MVP |
| Never add initiatives | Simple | No OKR connection | Too limiting for enterprise |

**Consequences**:

- Positive: Focus on execution features first, strategy foundation provides placeholder
- Negative: Missing explicit OKR-to-work-item linking
- Risks: May need to retrofit initiatives into existing workspace structure

### Decision 6: Issue ID Format [ADR-006]

**Linear's Format**: `TEAM-NUMBER` (e.g., ENG-123)

**Our Current Format**: `Date.now().toString()` (timestamp)

**Our Decision**: Keep timestamp for now, evaluate later

**Rationale**:

- Timestamp works, no collisions
- Changing ID format requires significant migration
- Can add display format without changing underlying ID

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| **Keep timestamp IDs** | Works now, no migration | Not human-readable | ✅ SELECTED (good enough for MVP) |
| Linear-style TEAM-NUM | Human-readable, team context | Requires counter per team, migration | High migration cost |
| UUID | Standard, collision-free | Not human-readable | No advantage over timestamp |
| Add display ID layer | Best of both | Added complexity | Can add later if needed |

**Consequences**:

- Positive: No migration needed, stable IDs, no collision risk
- Negative: Not as user-friendly as TEAM-123 format
- Risks: Users may request human-readable IDs later (can add as display layer)

---

## Review Triggers

Reconsider these decisions when:

- [ ] User feedback indicates need for human-readable IDs
- [ ] Teams request sprint/cycle functionality
- [ ] Strategic planning features become priority
- [ ] Cross-team workflows become more complex

---

## Related Decisions

- [UX Design Decisions](ux-design-decisions.md) - Templates, menus, alignment
- [Scope Decisions](scope-decisions.md) - What's in/out of scope

---

## Sources

- Linear Conceptual Model Documentation
- Linear GraphQL API Reference
- Linear Blog (Initiatives announcement, June 2024)
- Parallel AI Ultra Research (Task ID: various)
