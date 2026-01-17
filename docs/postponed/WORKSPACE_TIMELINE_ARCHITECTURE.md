# 🏗️ Workspace-Level Timelines & Calculated Status Architecture

**Created**: 2025-12-01
**Status**: PLANNING COMPLETE - Postponed for Implementation
**Priority**: HIGH (Foundation for future features)
**Target**: After Week 7 (AI Integration)
**Estimated Effort**: ~25 hours

[← Back to Postponed Features](README.md)

---

## Executive Summary

This refactor transforms our data model to support **workspace-level timelines** (release milestones) instead of per-work-item timelines, with **calculated work item status** derived from task completion.

### Key Changes Overview

| Current State | Future State |
|---------------|--------------|
| Timelines belong to work items | Timelines belong to workspace (releases) |
| Work item status manually set | Status CALCULATED from task progress |
| 1:N (work item → timelines) | M:N (work items ↔ timelines) |
| Effort stored as numbers | Effort vocabulary system (XS/S/M/L/XL) |
| Simple progress % | Weighted progress based on effort points |

---

## 5-Question Framework Validation

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 1 | **Data Dependencies**: Do required tables/APIs exist? | ✅ | New tables, non-breaking addition |
| 2 | **Integration Points**: Are module APIs stable? | ✅ | All API routes defined |
| 3 | **Standalone Value**: Does this provide standalone value? | ✅ | Major architecture improvement |
| 4 | **Schema Finalized**: Are tables/columns finalized? | ✅ | Complete SQL defined |
| 5 | **Testing Feasibility**: Can this be fully tested? | ⏳ | After current work complete |

**Result**: ⏳ **POSTPONE** until after 8-tab implementation

---

## Why Postponed

Current 8-tab Work Item Detail Page implementation delivers immediate value. Architecture refactor:

- ❌ Would require reworking in-progress components
- ❌ Needs full platform stabilization first
- ✅ Can be implemented as non-breaking change (new tables alongside existing)

### Dependencies (Must Complete First)

- [⏳] Work Item Detail Page 8-tab structure
- [⏳] Resources Tab integration
- [⏳] Feedback Tab integration
- [⏳] Current timeline_items system stable
- [⏳] AI Integration complete (Week 7)

### When to Implement

**Target**: After Week 7 completion (AI Integration)

**Review Trigger**: End of Week 7

---

## Hierarchy Clarification

### Data Hierarchy (Revised)

```
Workspace (Project/Product)
├── Timelines (Release Milestones: v1.0, Q1 Sprint, MVP Launch)
│   └── Work Items (via junction table with scope_type)
├── Work Items (features, bugs, concepts, enhancements)
│   ├── Tasks (execution units with effort)
│   └── Resources, Feedback, etc.
└── Quick Tasks (standalone workspace-level tasks)
```

### Phase vs Status Clarification

| Level | "Phase" | "Status" |
|-------|---------|----------|
| **Workspace** | Current phase (Research→Planning→Execution→Review→Complete) | N/A |
| **Timeline** | N/A | draft / active / completed / archived |
| **Work Item** | **INTERNAL** - for tab visibility logic | **CALCULATED** from tasks (see formula) |
| **Task** | N/A | todo / in_progress / done |

**Important**:

- **Phase** = Internal concept for progressive disclosure (tab visibility)
- **Status** = What users see and interact with

---

## Work Item Status Calculation

Work item status is **DERIVED** from task completion, not manually set:

```typescript
function calculateWorkItemStatus(tasks: Task[]): WorkItemStatus {
  if (tasks.length === 0) return 'planned'

  const totalEffort = tasks.reduce((sum, t) => sum + t.effort_points, 0)
  const completedEffort = tasks
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + t.effort_points, 0)
  const inProgressEffort = tasks
    .filter(t => t.status === 'in_progress')
    .reduce((sum, t) => sum + t.effort_points, 0)

  const progress = (completedEffort + (inProgressEffort * 0.5)) / totalEffort

  if (progress >= 1) return 'completed'
  if (progress > 0) return 'in_progress'
  return 'planned'
}
```

**Override Option**: Allow manual override to `on_hold` or `cancelled`

---

## Effort Vocabulary System

### T-Shirt to Points Mapping

| Size | Points | Meaning |
|------|--------|---------|
| XS | 1 | ~1-2 hours |
| S | 2 | ~half day |
| M | 5 | ~1-2 days |
| L | 8 | ~3-5 days |
| XL | 13 | ~1-2 weeks |

### Vocabulary Presets

| Preset | XS | S | M | L | XL |
|--------|-----|-----|-----|-----|-----|
| **Simple** | Tiny | Small | Medium | Large | Huge |
| **Technical** | Quick Fix | Minor | Standard | Major | Epic |
| **Business** | Trivial | Low | Medium | High | Strategic |

**Database**: Store `effort_vocabulary` at workspace level, `effort_size` enum on tasks.

---

## Database Schema Changes

### New: `timelines` Table (Workspace-Level)

```sql
CREATE TABLE timelines (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),

    sort_order INTEGER DEFAULT 0,
    color TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_timelines_workspace ON timelines(workspace_id);
CREATE INDEX idx_timelines_team ON timelines(team_id);

-- RLS
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view timelines in their team" ON timelines
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert timelines in their team" ON timelines
    FOR INSERT WITH CHECK (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update timelines in their team" ON timelines
    FOR UPDATE USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can delete timelines" ON timelines
    FOR DELETE USING (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
```

### New: `work_item_timelines` Junction Table

```sql
CREATE TABLE work_item_timelines (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
    timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,

    scope_type TEXT DEFAULT 'mvp' CHECK (scope_type IN ('mvp', 'short', 'long')),
    sort_order INTEGER DEFAULT 0,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(work_item_id, timeline_id)
);

-- Indexes
CREATE INDEX idx_wit_work_item ON work_item_timelines(work_item_id);
CREATE INDEX idx_wit_timeline ON work_item_timelines(timeline_id);

-- RLS
ALTER TABLE work_item_timelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies (similar pattern)
CREATE POLICY "Users can view work_item_timelines in their team" ON work_item_timelines
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage work_item_timelines in their team" ON work_item_timelines
    FOR ALL USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));
```

### Modify: `product_tasks` Table

```sql
ALTER TABLE product_tasks
ADD COLUMN effort_size TEXT DEFAULT 'm' CHECK (effort_size IN ('xs', 's', 'm', 'l', 'xl')),
ADD COLUMN effort_points INTEGER GENERATED ALWAYS AS (
    CASE effort_size
        WHEN 'xs' THEN 1
        WHEN 's' THEN 2
        WHEN 'm' THEN 5
        WHEN 'l' THEN 8
        WHEN 'xl' THEN 13
        ELSE 5
    END
) STORED;
```

### Modify: `workspaces` Table

```sql
ALTER TABLE workspaces
ADD COLUMN effort_vocabulary TEXT DEFAULT 'simple' CHECK (effort_vocabulary IN ('simple', 'technical', 'business'));
```

---

## Migration Strategy

### Phase 1: Add New Tables (Non-Breaking)

1. Create `timelines` table
2. Create `work_item_timelines` junction table
3. Add `effort_size` and `effort_points` to `product_tasks`
4. Add `effort_vocabulary` to `workspaces`

### Phase 2: Migrate Existing Data

1. Create default timeline per workspace: "Main Timeline"
2. Migrate existing `timeline_items` to `work_item_timelines` entries
3. Keep `timeline_items` table for backward compatibility

### Phase 3: Update UI

1. Add Timeline management page at workspace level
2. Update Work Board to show timelines
3. Update Work Item Detail to use new structure

### Phase 4: Deprecate Old Structure

1. Add deprecation warnings on old API endpoints
2. Migrate all clients to new structure
3. Eventually drop `timeline_items` table

---

## UI Changes Required

### New: Workspace Timeline Management

```
Workspace Settings > Timelines
├── Create Timeline (v1.0 Release, Q1 Sprint, etc.)
├── Timeline List with drag-to-reorder
├── Timeline Detail:
│   ├── Name, Description, Target Date
│   ├── Work Items in this timeline (with scope_type badges)
│   └── Progress summary (calculated from tasks)
```

### Updated: Work Item Detail

- **Scope Tab** → Shows which timelines this work item appears in
- **Tasks Tab** → Tasks have effort_size selector (XS/S/M/L/XL)
- **Summary Tab** → Shows calculated status, progress bar with effort weighting

### Updated: Work Board

- **Timeline View** → Gantt shows workspace-level timelines as swimlanes
- **Board View** → Option to group by timeline

---

## API Endpoints (New)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workspaces/[id]/timelines` | List workspace timelines |
| POST | `/api/workspaces/[id]/timelines` | Create timeline |
| PATCH | `/api/timelines/[id]` | Update timeline |
| DELETE | `/api/timelines/[id]` | Delete timeline |
| GET | `/api/timelines/[id]/work-items` | Get work items in timeline |
| POST | `/api/work-items/[id]/timelines` | Add work item to timeline |
| DELETE | `/api/work-items/[id]/timelines/[timelineId]` | Remove from timeline |

---

## Backward Compatibility

### Keep Working

- Existing `timeline_items` API and components (deprecated)
- Current work item detail page (until migration)
- Manual status selection (as override)

### Deprecation Timeline

- **Phase 1**: New structure alongside old (both work)
- **Phase 2**: Warnings on old endpoints
- **Phase 3**: Remove old structure (migration complete)

---

## Implementation Priority

| Priority | Item | Time Est |
|----------|------|----------|
| **P0** | Current 8-tab implementation (Part B) | 14-18h |
| **P1** | Add `timelines` + `work_item_timelines` tables | 2h |
| **P1** | Add effort system to tasks | 2h |
| **P2** | Timeline management UI | 6h |
| **P2** | Work Item → Timelines assignment UI | 4h |
| **P3** | Calculated status implementation | 3h |
| **P3** | Effort vocabulary UI | 2h |
| **P4** | Migrate existing data | 4h |
| **P4** | Deprecate old structure | 2h |

**Total Refactor Time**: ~25 hours (after current 8-tab work)

---

## Review Trigger

**When**: End of Week 7 (AI Integration & Analytics complete)

**Who**: Development team

**Questions to Ask**:

1. Is the 8-tab Work Item Detail Page stable?
2. Are all current API endpoints working correctly?
3. Is there user feedback requesting timeline improvements?
4. Do we have ~25 hours available before next major milestone?
5. Would this refactor improve the Gantt/Timeline views significantly?

**Decision Matrix**:

- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 4: ⏸️ **POSTPONE** further
- If "NO" to question 5: 🔍 **RE-EVALUATE** priority

---

## Related Documentation

- [Implementation Plan - Postponed Features](README.md)
- [Week 6: Timeline & Execution](../implementation/week-6-timeline-execution.md)
- [Work Board 3.0](../implementation/work-board-3.0.md)
- [CLAUDE.md - Project Guidelines](../../CLAUDE.md)

---

**Last Reviewed**: December 1, 2025
**Next Review**: End of Week 7 (AI Integration complete)

[← Back to Postponed Features](README.md)
