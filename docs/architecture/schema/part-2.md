SELECT cron.schedule('purge-deleted-resources-daily', '0 3 ** *',
  $$ SELECT purge_deleted_resources(30); $$
);

-- Cleanup unlinked junction records
SELECT cron.schedule('purge-unlinked-resources-daily', '0 3 ** *',
  $$ SELECT purge_unlinked_work_item_resources(30); $$
);

```

---

## Phase System Tables

### **user_phase_assignments**

Phase-based permissions for workspace members.

```sql
CREATE TABLE user_phase_assignments (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  can_edit BOOLEAN DEFAULT true NOT NULL,
  is_lead BOOLEAN DEFAULT false,
  assigned_by TEXT NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  UNIQUE(workspace_id, user_id, phase)
);

CREATE INDEX idx_user_phase_team ON user_phase_assignments(team_id);
CREATE INDEX idx_user_phase_workspace ON user_phase_assignments(workspace_id);
CREATE INDEX idx_user_phase_user ON user_phase_assignments(user_id);
CREATE INDEX idx_user_phase_phase ON user_phase_assignments(phase);
CREATE INDEX idx_user_phase_permission ON user_phase_assignments(user_id, workspace_id, phase, can_edit);
```

---

### **phase_assignment_history**

Audit trail for all work item phase changes.

```sql
CREATE TABLE phase_assignment_history (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  from_phase TEXT CHECK (from_phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  to_phase TEXT NOT NULL CHECK (to_phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  changed_by TEXT NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_phase_transition CHECK (from_phase IS NULL OR from_phase != to_phase)
);

CREATE INDEX idx_phase_history_work_item ON phase_assignment_history(work_item_id, changed_at DESC);
CREATE INDEX idx_phase_history_team ON phase_assignment_history(team_id, changed_at DESC);
CREATE INDEX idx_phase_history_workspace ON phase_assignment_history(workspace_id, changed_at DESC);
CREATE INDEX idx_phase_history_user ON phase_assignment_history(changed_by, changed_at DESC);
```

---

### **phase_access_requests**

Self-service permission request workflow.

```sql
CREATE TABLE phase_access_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expected_duration TEXT,
  reviewed_by TEXT REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_access_requests_user ON phase_access_requests(user_id, status);
CREATE INDEX idx_access_requests_workspace ON phase_access_requests(workspace_id, status, requested_at DESC);
CREATE INDEX idx_access_requests_pending ON phase_access_requests(status, requested_at) WHERE status = 'pending';
```

---

### **phase_workload_cache**

Performance optimization cache for work item counts per phase.

```sql
CREATE TABLE phase_workload_cache (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),
  total_count INTEGER DEFAULT 0 NOT NULL,
  not_started_count INTEGER DEFAULT 0 NOT NULL,
  in_progress_count INTEGER DEFAULT 0 NOT NULL,
  completed_count INTEGER DEFAULT 0 NOT NULL,
  on_hold_count INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (workspace_id, phase)
);

CREATE INDEX idx_workload_cache_team ON phase_workload_cache(team_id, phase);
```

---

## Mind Mapping Tables

### **mind_maps**

Mind map canvas data with dual-canvas support.

```sql
CREATE TABLE mind_maps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'research' CHECK (type IN ('research', 'feedback')),
  canvas_data JSONB NOT NULL, -- ReactFlow data structure
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mind_maps_workspace_id ON mind_maps(workspace_id);
CREATE INDEX idx_mind_maps_team_id ON mind_maps(team_id);
CREATE INDEX idx_mind_maps_type ON mind_maps(type);
```

---

### **work_flows**

Hierarchical sub-canvases for nested mind mapping.

```sql
CREATE TABLE work_flows (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  parent_flow_id TEXT REFERENCES work_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_collapsed BOOLEAN DEFAULT true,
  canvas_position JSONB,
  viewport JSONB,
  depth INTEGER DEFAULT 0,
  child_count INTEGER DEFAULT 0,
  work_item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_flows_workspace ON work_flows(workspace_id);
CREATE INDEX idx_work_flows_team ON work_flows(team_id);
CREATE INDEX idx_work_flows_parent ON work_flows(parent_flow_id);
```

---

## Feedback Tables

### **feedback**

User/stakeholder feedback attached to work items.

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Source (3 types)
  source TEXT NOT NULL CHECK (source IN ('internal', 'customer', 'user')),
  source_name TEXT NOT NULL,
  source_role TEXT,
  source_email TEXT,

  -- Priority (2 levels)
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high', 'low')),

  -- Content
  content TEXT NOT NULL,
  context TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Triage workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewed', 'implemented', 'deferred', 'rejected'
  )),
  decision TEXT CHECK (decision IN ('implement', 'defer', 'reject')),
  decision_reason TEXT,
  decision_by TEXT REFERENCES users(id),
  decision_at TIMESTAMPTZ,

  -- Implementation tracking
  implemented_in_id TEXT REFERENCES work_items(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_work_item ON feedback(work_item_id);
CREATE INDEX idx_feedback_team ON feedback(team_id);
CREATE INDEX idx_feedback_workspace ON feedback(workspace_id);
CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_received_at ON feedback(received_at DESC);
```

---

## Strategy System Tables

### **product_strategies**

Four-tier OKR/Pillar hierarchy for organization-wide and work-item-level strategy alignment.

```sql
CREATE TABLE public.product_strategies (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Hierarchy
  parent_id TEXT REFERENCES public.product_strategies(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Strategy types (4-tier)
  type TEXT NOT NULL CHECK (type IN ('pillar', 'objective', 'key_result', 'initiative')),

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,

  -- Design Thinking fields (NEW - Phase System Enhancement)
  user_stories TEXT[], -- User story examples for context
  case_studies TEXT[], -- Reference case studies
  user_examples TEXT[], -- Real user examples

  -- Metrics
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,

  -- Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  owner_id UUID REFERENCES public.users(id),

  -- Timestamps
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id)
);

CREATE INDEX idx_product_strategies_team ON public.product_strategies(team_id);
CREATE INDEX idx_product_strategies_workspace ON public.product_strategies(workspace_id);
CREATE INDEX idx_product_strategies_parent ON public.product_strategies(parent_id);
CREATE INDEX idx_product_strategies_type ON public.product_strategies(type);
CREATE INDEX idx_product_strategies_hierarchy ON public.product_strategies(parent_id, sort_order);
```

**Strategy Type Hierarchy:**

| Level | Type | Purpose | Display Context |
|-------|------|---------|-----------------|
| 1 | **pillar** | Organization-wide theme | Full tree view with user stories, case studies |
| 2 | **objective** | Team/department goal | Nested under pillar with metrics |
| 3 | **key_result** | Measurable outcome | Progress indicators with target/actual |
| 4 | **initiative** | Specific action | Task-like cards with timeline, assignees |

**Design Thinking Fields (NEW):**

- **user_stories**: TEXT[] - User story examples that provide context and inspiration
  - Example: ["As a product manager, I want to...", "As a developer, I need to..."]

- **case_studies**: TEXT[] - Reference case studies showing real-world implementations
  - Example: ["Spotify's squad model", "Google's OKR framework"]

- **user_examples**: TEXT[] - Real user examples demonstrating need or impact
  - Example: ["Sarah spent 3 hours manually...", "Team reported 40% time savings..."]

**Display Modes:**

1. **Organization Level** (Full Strategy Tree):
   - Shows complete hierarchy with all tiers
   - Displays user stories, case studies, examples for pillars
   - High-level metrics and team-wide alignment
   - Used in `/workspaces/[id]/strategies` page

2. **Work Item Level** (Alignment View):
   - Shows derived/aligned strategies only
   - Displays alignment strength (weak/medium/strong)
   - Specific requirements for this work item
   - Actionable, focused view
   - Used in work item detail page "Strategy" tab

---

## Feature Analysis Tables

### **feature_connections**

Dependencies between work items at feature level.

```sql
CREATE TABLE feature_connections (
  id TEXT PRIMARY KEY,
  source_feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  target_feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL,
  strength NUMERIC DEFAULT 0.5,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **feature_importance_scores**

AI-calculated importance scores for work items.

```sql
CREATE TABLE feature_importance_scores (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  factors JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **feature_correlations**

Statistical correlations between work items.

```sql
CREATE TABLE feature_correlations (
  id TEXT PRIMARY KEY,
  feature_a_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  feature_b_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  correlation_score NUMERIC NOT NULL,
  correlation_type TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **connection_insights**

AI-generated insights about work item connections.

```sql
CREATE TABLE connection_insights (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Supporting Tables

### **user_settings**

User theme and AI preferences.

```sql
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  custom_instructions TEXT,
  ai_memory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **execution_steps**

Granular execution steps for timeline items.

```sql
CREATE TABLE execution_steps (
  id TEXT PRIMARY KEY,
  timeline_item_id TEXT NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **feature_resources**

External resources linked to work items.

```sql
CREATE TABLE feature_resources (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **inspiration_items**

Research and inspiration linked to work items.

```sql
CREATE TABLE inspiration_items (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  item_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **workflow_stages**

Custom workflow stages for work items.

```sql
CREATE TABLE workflow_stages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **tags**

Tagging system for work items.

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row-Level Security (RLS) Policies

**Standard Policy Pattern for Team-Scoped Tables:**

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT: Team members can view
CREATE POLICY "Team members can view table_name"
ON table_name FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Team members can create
CREATE POLICY "Team members can create table_name"
ON table_name FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Team members can update
CREATE POLICY "Team members can update table_name"
ON table_name FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Owners/admins only
CREATE POLICY "Owners and admins can delete table_name"
ON table_name FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

**Phase-Based Policy Pattern (for work_items):**

```sql
-- INSERT with phase permission check
CREATE POLICY "Users can create work items in assigned phases"
ON work_items FOR INSERT
WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM user_phase_assignments
      WHERE user_id = auth.uid()
        AND workspace_id = work_items.workspace_id
        AND phase = work_items.phase
        AND can_edit = true
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
        AND team_id = work_items.team_id
        AND role IN ('owner', 'admin')
    )
  )
);
```

---

## Database Functions

### Phase Calculation

- `calculate_work_item_phase(work_item_id, status, owner)` - Returns calculated phase based on state

### Dependency Analysis

- `get_timeline_dependencies(timeline_item_id)` - Returns blocking/blocked_by/complements/conflicts/extends
- `get_work_item_dependencies_aggregated(work_item_id)` - Aggregated dependency view
- `get_conversion_lineage(work_item_id)` - Tracks conversion chain

### Task Statistics

- `get_workspace_task_stats(workspace_id)` - Task counts by status/type
- `get_work_item_tasks(work_item_id)` - Tasks with completion percentage

### Phase Management

- `refresh_phase_workload_cache(workspace_id)` - Updates workload cache
- `log_phase_change()` - Trigger function for audit trail
- `get_phase_lead_info(workspace_id, phase)` - Returns phase lead contact

### Utility

- `update_updated_at_column()` - Generic timestamp trigger
- `handle_new_user()` - Creates public.users on auth.users insert

---

## Migration History

See [CHANGELOG.md](../reference/CHANGELOG.md) for complete migration history.

**Summary:**

- **Total Tables**: 28+
- **Total Migrations**: 46 (as of 2025-11-26)
- **RLS Policies**: Applied to all team-scoped tables
- **Phase System**: Complete with audit trail and access requests

**Key Migration Milestones:**

| Migration | Date | Description |
|-----------|------|-------------|
| 20250101000000 | 2025-01-01 | Initial schema (features, timeline_items, linked_items) |
| 20250101000007 | 2025-01-01 | Add workspaces table |
| 20250113000007 | 2025-01-13 | Rename features → work_items |
| 20250117000001 | 2025-01-17 | Create phase assignments system |
| 20251117175229 | 2025-11-17 | Comprehensive phase system |
| 20250124000002 | 2025-01-24 | Create feedback module |
| 20251125000001 | 2025-11-25 | Create product_tasks table |

---

[← Back to Implementation Plan](README.md)
