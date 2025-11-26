-- Migration: Create Product Tasks Table
-- Date: 2025-11-25
-- Purpose: Two-track task system - standalone tasks OR linked to work items

-- =====================================================
-- PRODUCT TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_tasks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    work_item_id TEXT REFERENCES public.work_items(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    task_type TEXT NOT NULL DEFAULT 'development' CHECK (task_type IN (
        'research', 'design', 'development', 'qa', 'marketing', 'ops', 'admin'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_tasks_workspace_id ON public.product_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_product_tasks_team_id ON public.product_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_product_tasks_work_item_id ON public.product_tasks(work_item_id);
CREATE INDEX IF NOT EXISTS idx_product_tasks_status ON public.product_tasks(status);
CREATE INDEX IF NOT EXISTS idx_product_tasks_assigned_to ON public.product_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_product_tasks_task_type ON public.product_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_product_tasks_due_date ON public.product_tasks(due_date);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_product_tasks_workspace_status ON public.product_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_product_tasks_work_item_status ON public.product_tasks(work_item_id, status) WHERE work_item_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.product_tasks ENABLE ROW LEVEL SECURITY;

-- Team members can view tasks in their team's workspaces
CREATE POLICY "Team members can view product tasks"
ON public.product_tasks FOR SELECT
USING (
    team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid()
    )
);

-- Team members can create tasks in their team's workspaces
CREATE POLICY "Team members can create product tasks"
ON public.product_tasks FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid()
    )
);

-- Team members can update tasks in their team's workspaces
CREATE POLICY "Team members can update product tasks"
ON public.product_tasks FOR UPDATE
USING (
    team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid()
    )
);

-- Team members can delete tasks in their team's workspaces
CREATE POLICY "Team members can delete product tasks"
ON public.product_tasks FOR DELETE
USING (
    team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_product_tasks_updated_at
    BEFORE UPDATE ON public.product_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get task statistics for a workspace
CREATE OR REPLACE FUNCTION get_workspace_task_stats(workspace_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'by_status', jsonb_build_object(
            'todo', COUNT(*) FILTER (WHERE status = 'todo'),
            'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
            'done', COUNT(*) FILTER (WHERE status = 'done')
        ),
        'by_type', jsonb_build_object(
            'research', COUNT(*) FILTER (WHERE task_type = 'research'),
            'design', COUNT(*) FILTER (WHERE task_type = 'design'),
            'development', COUNT(*) FILTER (WHERE task_type = 'development'),
            'qa', COUNT(*) FILTER (WHERE task_type = 'qa'),
            'marketing', COUNT(*) FILTER (WHERE task_type = 'marketing'),
            'ops', COUNT(*) FILTER (WHERE task_type = 'ops'),
            'admin', COUNT(*) FILTER (WHERE task_type = 'admin')
        ),
        'standalone_count', COUNT(*) FILTER (WHERE work_item_id IS NULL),
        'linked_count', COUNT(*) FILTER (WHERE work_item_id IS NOT NULL),
        'overdue_count', COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done')
    )
    INTO result
    FROM public.product_tasks
    WHERE product_tasks.workspace_id = workspace_id_param;

    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to get tasks for a work item with status summary
CREATE OR REPLACE FUNCTION get_work_item_tasks(work_item_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tasks', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'status', status,
                'task_type', task_type,
                'priority', priority,
                'assigned_to', assigned_to,
                'due_date', due_date,
                'order_index', order_index
            ) ORDER BY order_index, created_at
        ), '[]'::jsonb),
        'stats', jsonb_build_object(
            'total', COUNT(*),
            'todo', COUNT(*) FILTER (WHERE status = 'todo'),
            'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
            'done', COUNT(*) FILTER (WHERE status = 'done'),
            'completion_percentage', CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)::NUMERIC) * 100)
            END
        )
    )
    INTO result
    FROM public.product_tasks
    WHERE product_tasks.work_item_id = work_item_id_param;

    RETURN COALESCE(result, '{"tasks": [], "stats": {"total": 0, "todo": 0, "in_progress": 0, "done": 0, "completion_percentage": 0}}'::jsonb);
END;
$$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.product_tasks IS 'Product tasks - standalone tasks or linked to work items. Two-track system for granular task management.';
COMMENT ON COLUMN public.product_tasks.work_item_id IS 'Optional link to parent work item. NULL for standalone tasks.';
COMMENT ON COLUMN public.product_tasks.task_type IS 'Category of work: research, design, development, qa, marketing, ops, admin';
COMMENT ON COLUMN public.product_tasks.status IS 'Task status: todo (not started), in_progress (active), done (completed)';
COMMENT ON COLUMN public.product_tasks.order_index IS 'Manual sort order within workspace or work item';
