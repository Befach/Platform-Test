# 📊 DATABASE SCHEMA

**Last Updated:** 2025-11-26
**Status:** Complete (46 migrations applied)
**Total Tables:** 28+
**RLS Policies:** Applied to all team-scoped tables

[← Back to Implementation Plan](README.md)

---

## Table of Contents

1. [Multi-Tenant Architecture](#multi-tenant-architecture)
2. [Core Tables](#core-tables)
   - [users](#users)
   - [teams](#teams)
   - [team_members](#team_members)
   - [subscriptions](#subscriptions)
   - [invitations](#invitations)
3. [Workspace Tables](#workspace-tables)
   - [workspaces](#workspaces)
4. [Work Item Tables](#work-item-tables)
   - [work_items](#work_items)
   - [timeline_items](#timeline_items)
   - [linked_items](#linked_items)
   - [product_tasks](#product_tasks)
5. [Phase System Tables](#phase-system-tables)
   - [user_phase_assignments](#user_phase_assignments)
   - [phase_assignment_history](#phase_assignment_history)
   - [phase_access_requests](#phase_access_requests)
   - [phase_workload_cache](#phase_workload_cache)
6. [Mind Mapping Tables](#mind-mapping-tables)
   - [mind_maps](#mind_maps)
   - [work_flows](#work_flows)
7. [Feedback Tables](#feedback-tables)
   - [feedback](#feedback)
8. [Feature Analysis Tables](#feature-analysis-tables)
   - [feature_connections](#feature_connections)
   - [feature_importance_scores](#feature_importance_scores)
   - [feature_correlations](#feature_correlations)
   - [connection_insights](#connection_insights)
9. [Supporting Tables](#supporting-tables)
   - [user_settings](#user_settings)
   - [execution_steps](#execution_steps)
   - [feature_resources](#feature_resources)
   - [inspiration_items](#inspiration_items)
   - [workflow_stages](#workflow_stages)
   - [tags](#tags)
10. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
11. [Database Functions](#database-functions)
12. [Migration History](#migration-history)

---

## Multi-Tenant Architecture

**Design Principles:**
- Every table has `team_id` for data isolation
- Row-Level Security (RLS) enforces access control at database level
- Use timestamp-based TEXT IDs: `Date.now().toString()` (NOT UUID)
- All queries filter by `team_id` for multi-tenancy
- Phase-based permissions control edit access per phase per user

**ID Format:**
```sql
-- Correct: Timestamp-based TEXT ID
id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT

-- NEVER use: UUID
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## Core Tables

### **users**

Public user profiles linked to Supabase auth.users.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
```

**RLS Policies:**
- `Users can view all user profiles` - SELECT: `USING (true)`
- `Users can update own profile` - UPDATE: `USING (auth.uid() = id)`
- `Users can insert own profile` - INSERT: `WITH CHECK (auth.uid() = id)`

**Trigger:** Auto-creates public.users record when auth.users is created via `handle_new_user()` function.

---

### **teams**

Organizations/teams for multi-tenant isolation.

```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY, -- timestamp-based
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'pro')) DEFAULT 'free',
  member_count INT DEFAULT 1,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- `team_members_can_view_their_teams` - SELECT via team_members lookup
- `owners_can_update_team` - UPDATE for owners only
- `owners_can_delete_team` - DELETE for owners only
- `authenticated_users_can_create_teams` - INSERT for authenticated users

---

### **team_members**

Team membership with roles (owner, admin, member).

```sql
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

**RLS Policies:**
- `team_members_can_view_team_members` - SELECT via team membership
- `admins_can_insert_team_members` - INSERT for owner/admin only
- `admins_can_update_team_members` - UPDATE with self-role-escalation prevention
- `admins_can_delete_team_members` - DELETE for owner/admin only

---

### **subscriptions**

Stripe billing data for Pro tier.

```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  plan_id TEXT NOT NULL, -- 'pro'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **invitations**

Team invitation system with phase assignments.

```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID REFERENCES users(id),
  phase_assignments JSONB DEFAULT '[]'::jsonb, -- Array of {workspace_id, phase, can_edit}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_phase_assignments ON invitations USING gin (phase_assignments);
```

---

## Workspace Tables

### **workspaces**

Projects/products with phase tracking and enabled modules.

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT CHECK (phase IN (
    'research', 'planning', 'review',
    'execution', 'testing', 'metrics', 'complete'
  )) DEFAULT 'research',
  enabled_modules JSONB DEFAULT '["research", "mind_map", "features"]'::jsonb,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📊',
  custom_instructions TEXT,
  ai_memory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_team_id ON workspaces(team_id);
CREATE INDEX idx_workspaces_phase ON workspaces(phase);
```

---

## Work Item Tables

### **work_items**

Work items (features, enhancements, bugs, concepts) with hierarchy and phase assignment.

```sql
CREATE TABLE work_items (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'concept', 'feature', 'bug', 'enhancement'
  purpose TEXT,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'in_review', 'completed', 'on_hold'
  owner TEXT, -- Assigned user ID

  -- Phase-based access control
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),

  -- Hierarchy support
  parent_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  is_epic BOOLEAN DEFAULT false NOT NULL,

  -- Canvas positioning
  flow_id TEXT REFERENCES work_flows(id) ON DELETE SET NULL,
  canvas_position JSONB,
  parent_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  canvas_metadata JSONB,

  -- Note support
  is_note BOOLEAN DEFAULT false,
  note_type TEXT,
  note_content TEXT,
  is_placeholder BOOLEAN DEFAULT false,

  -- Conversion tracking
  converted_from_id TEXT,
  converted_from_type TEXT,
  converted_at TIMESTAMPTZ,
  converted_by UUID,

  -- AI metadata
  ai_generated JSONB,
  ai_created BOOLEAN DEFAULT false,
  ai_modified BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_items_team_id ON work_items(team_id);
CREATE INDEX idx_work_items_workspace_id ON work_items(workspace_id);
CREATE INDEX idx_work_items_phase ON work_items(workspace_id, phase);
CREATE INDEX idx_work_items_workspace_phase_status ON work_items(workspace_id, phase, status);
CREATE INDEX idx_work_items_team_phase ON work_items(team_id, phase);
CREATE INDEX idx_work_items_parent_id ON work_items(parent_id);
CREATE INDEX idx_work_items_is_epic ON work_items(is_epic) WHERE is_epic = true;
CREATE INDEX idx_work_items_flow ON work_items(flow_id);
CREATE INDEX idx_work_items_parent ON work_items(parent_work_item_id);
CREATE INDEX idx_work_items_is_note ON work_items(is_note) WHERE is_note = true;
```

**RLS Policies:**
- `Team members can view team work items` - SELECT via team membership
- `Users can create work items in assigned phases` - INSERT with phase permission check
- `Users can update work items in assigned phases` - UPDATE with phase permission check
- `Users can delete work items in assigned phases` - DELETE with phase permission check

---

### **timeline_items**

MVP/SHORT/LONG timeline breakdown for work items.

```sql
CREATE TABLE timeline_items (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  timeline TEXT NOT NULL CHECK (timeline IN ('MVP', 'SHORT', 'LONG')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  description TEXT,
  integration_type TEXT,
  category TEXT[] DEFAULT '{}',

  -- Execution tracking
  start_date DATE,
  end_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_items_work_item_id ON timeline_items(work_item_id);
CREATE INDEX idx_timeline_items_team_id ON timeline_items(team_id);
CREATE INDEX idx_timeline_items_workspace_id ON timeline_items(workspace_id);
```

---

### **linked_items**

Dependencies and relationships between timeline items.

```sql
CREATE TABLE linked_items (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  source_item_id TEXT NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  target_item_id TEXT NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'dependency', 'complements', 'blocks', 'depends_on', 'conflicts', 'extends'
  )),
  reason TEXT,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_item_id, target_item_id)
);

CREATE INDEX idx_linked_items_source ON linked_items(source_item_id);
CREATE INDEX idx_linked_items_target ON linked_items(target_item_id);
CREATE INDEX idx_linked_items_team_id ON linked_items(team_id);
```

---

### **product_tasks**

Two-track task system - standalone tasks OR linked to work items.

```sql
CREATE TABLE product_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL, -- NULL for standalone
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  task_type TEXT NOT NULL DEFAULT 'development' CHECK (task_type IN (
    'research', 'design', 'development', 'qa', 'marketing', 'ops', 'admin'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_tasks_workspace_id ON product_tasks(workspace_id);
CREATE INDEX idx_product_tasks_team_id ON product_tasks(team_id);
CREATE INDEX idx_product_tasks_work_item_id ON product_tasks(work_item_id);
CREATE INDEX idx_product_tasks_status ON product_tasks(status);
CREATE INDEX idx_product_tasks_assigned_to ON product_tasks(assigned_to);
CREATE INDEX idx_product_tasks_task_type ON product_tasks(task_type);
CREATE INDEX idx_product_tasks_due_date ON product_tasks(due_date);
CREATE INDEX idx_product_tasks_workspace_status ON product_tasks(workspace_id, status);
CREATE INDEX idx_product_tasks_work_item_status ON product_tasks(work_item_id, status) WHERE work_item_id IS NOT NULL;
```

**Helper Functions:**
- `get_workspace_task_stats(workspace_id)` - Returns task statistics
- `get_work_item_tasks(work_item_id)` - Returns tasks with completion percentage

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
