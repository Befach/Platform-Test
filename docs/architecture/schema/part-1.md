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
5. [Resources Module Tables](#resources-module-tables) *(New)*
   - [resources](#resources)
   - [work_item_resources](#work_item_resources)
   - [resource_audit_log](#resource_audit_log)
6. [Phase System Tables](#phase-system-tables)
   - [user_phase_assignments](#user_phase_assignments)
   - [phase_assignment_history](#phase_assignment_history)
   - [phase_access_requests](#phase_access_requests)
   - [phase_workload_cache](#phase_workload_cache)
7. [Mind Mapping Tables](#mind-mapping-tables)
   - [mind_maps](#mind_maps)
   - [work_flows](#work_flows)
8. [Feedback Tables](#feedback-tables)
   - [feedback](#feedback)
9. [Feature Analysis Tables](#feature-analysis-tables)
   - [feature_connections](#feature_connections)
   - [feature_importance_scores](#feature_importance_scores)
   - [feature_correlations](#feature_correlations)
   - [connection_insights](#connection_insights)
10. [Supporting Tables](#supporting-tables)

- [user_settings](#user_settings)
- [execution_steps](#execution_steps)
- [feature_resources](#feature_resources)
- [inspiration_items](#inspiration_items)
- [workflow_stages](#workflow_stages)
- [tags](#tags)
1. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
2. [Database Functions](#database-functions)
3. [Migration History](#migration-history)

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

Projects/products with mode and enabled modules.

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN (
    'development', 'launch', 'growth', 'maintenance'
  )) DEFAULT 'development',
  enabled_modules JSONB DEFAULT '["research", "mind_map", "features"]'::jsonb,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📊',
  custom_instructions TEXT,
  ai_memory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_team_id ON workspaces(team_id);
CREATE INDEX idx_workspaces_mode ON workspaces(mode);
```

**Field Explanations:**

- **mode**: Workspace lifecycle context (NOT a stage). Determines default phase for new work items and type weighting.
  - `development`: Building from scratch (default phase: planning)
  - `launch`: Racing to release (default phase: execution)
  - `growth`: Iterating on feedback (default phase: review)
  - `maintenance`: Stability focus (default phase: execution)

**Note:** Workspace does NOT have a `phase` or `stage` field. Phase distribution is AGGREGATED from work_items.

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
  owner TEXT, -- Assigned user ID

  -- Phase IS the status (no separate status field!)
  phase TEXT NOT NULL CHECK (phase IN ('research', 'planning', 'execution', 'review', 'complete')),

  -- Phase transition tracking
  phase_changed_at TIMESTAMPTZ,
  phase_changed_by UUID REFERENCES users(id),
  previous_phase TEXT,

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

**Field Explanations:**

- **phase**: The lifecycle stage of this work item. **This IS the status** - there is NO separate status field.
  - `research`: Initial exploration, problem understanding
  - `planning`: Structure, scope, timeline breakdown
  - `execution`: Active development work
  - `review`: Testing, validation, feedback
  - `complete`: Shipped, launched, done

- **phase_changed_at**: Timestamp of last phase transition (for audit trail)
- **phase_changed_by**: User who changed the phase (for accountability)
- **previous_phase**: The phase before current one (for rollback context)

**Critical Clarification:**

- Work item `phase` = status (one field, dual purpose)
- Timeline item has separate `status` field (not_started, in_progress, blocked, completed, on_hold, cancelled)
- Workspace has NO phase field - only `mode` field and AGGREGATED phase distribution

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

## Resources Module Tables

The Resources module enables linking external references, documentation, and inspiration to work items with full audit trail, soft-delete, and many-to-many sharing.

### **resources**

Core resource storage with full-text search and soft-delete support.

```sql
CREATE TABLE public.resources (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  notes TEXT,
  resource_type TEXT NOT NULL DEFAULT 'reference' CHECK (resource_type IN (
    'reference', 'inspiration', 'documentation', 'media', 'tool'
  )),
  image_url TEXT,
  favicon_url TEXT,
  source_domain TEXT,

  -- Full-text search (auto-generated)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(notes, '')), 'C')
  ) STORED,

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Tracking
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_resources_team_id ON public.resources(team_id);
CREATE INDEX idx_resources_workspace_id ON public.resources(workspace_id);
CREATE INDEX idx_resources_type ON public.resources(resource_type);
CREATE INDEX idx_resources_deleted ON public.resources(is_deleted);
CREATE INDEX idx_resources_search ON public.resources USING GIN(search_vector);
CREATE INDEX idx_resources_domain ON public.resources(source_domain) WHERE source_domain IS NOT NULL;
```

**Resource Types:**

| Type | Description |
|------|-------------|
| `reference` | General links, bookmarks, URLs |
| `inspiration` | Competitor examples, design ideas, benchmarks |
| `documentation` | Tutorials, guides, articles, specs |
| `media` | Videos, images, screenshots |
| `tool` | Tools, utilities, services |

---

### **work_item_resources**

Junction table for many-to-many relationship between resources and work items.

```sql
CREATE TABLE public.work_item_resources (
  work_item_id TEXT NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  PRIMARY KEY (work_item_id, resource_id),

  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  tab_type TEXT NOT NULL DEFAULT 'resource' CHECK (tab_type IN ('inspiration', 'resource')),
  display_order INTEGER NOT NULL DEFAULT 0,
  context_note TEXT,

  -- Added by tracking
  added_by UUID NOT NULL REFERENCES public.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft unlink
  is_unlinked BOOLEAN NOT NULL DEFAULT FALSE,
  unlinked_at TIMESTAMPTZ,
  unlinked_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_work_item_resources_work_item ON public.work_item_resources(work_item_id);
CREATE INDEX idx_work_item_resources_resource ON public.work_item_resources(resource_id);
CREATE INDEX idx_work_item_resources_team ON public.work_item_resources(team_id);
CREATE INDEX idx_work_item_resources_tab ON public.work_item_resources(work_item_id, tab_type);
CREATE INDEX idx_work_item_resources_unlinked ON public.work_item_resources(is_unlinked);
```

**Tab Types:**

- `inspiration` - Research phase references, competitor analysis
- `resource` - General resources for development/execution

---

### **resource_audit_log**

Immutable audit trail for all resource actions.

```sql
CREATE TABLE public.resource_audit_log (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  work_item_id TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'restored', 'linked', 'unlinked'
  )),
  actor_id UUID NOT NULL REFERENCES public.users(id),
  actor_email TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB,
  team_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL
);

CREATE INDEX idx_resource_audit_resource ON public.resource_audit_log(resource_id, performed_at DESC);
CREATE INDEX idx_resource_audit_work_item ON public.resource_audit_log(work_item_id, performed_at DESC);
CREATE INDEX idx_resource_audit_team ON public.resource_audit_log(team_id, performed_at DESC);
CREATE INDEX idx_resource_audit_action ON public.resource_audit_log(action);
```

**Audit Actions:**

| Action | Description |
|--------|-------------|
| `created` | Resource was created |
| `updated` | Resource fields were modified |
| `deleted` | Resource was soft-deleted (moved to trash) |
| `restored` | Resource was restored from trash |
| `linked` | Resource was linked to a work item |
| `unlinked` | Resource was unlinked from a work item |

---

### **Resource Module Database Functions**

```sql
-- Full-text search with ranking
search_resources(p_team_id, p_query, p_workspace_id, p_type, p_limit, p_offset)
  RETURNS TABLE(id, title, url, ..., rank)

-- Get resource history (audit trail)
get_resource_history(resource_id_param)
  RETURNS TABLE(action, performed_at, actor_id, actor_email, work_item_id, changes)

-- Purge soft-deleted resources (30-day retention)
purge_deleted_resources(days INTEGER DEFAULT 30)
  RETURNS INTEGER (count of purged records)

-- Generic purge function (reusable for other entities)
purge_soft_deleted(table_name TEXT, days INTEGER DEFAULT 30)
  RETURNS INTEGER

-- Purge unlinked junction records
purge_unlinked_work_item_resources(days INTEGER DEFAULT 30)
  RETURNS INTEGER

-- Manual purge trigger
manual_purge_all_deleted(days INTEGER DEFAULT 30)
  RETURNS JSONB { resources_purged, links_purged, executed_at }
```

---

### **Scheduled Purge (pg_cron)**

Daily cleanup of soft-deleted resources older than 30 days:

```sql
-- Runs daily at 3:00 AM UTC
