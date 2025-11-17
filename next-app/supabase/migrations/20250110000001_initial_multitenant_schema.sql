-- Multi-Tenant Product Lifecycle Management Platform Schema
-- Migration: 20250110000001_initial_multitenant_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE MULTI-TENANCY TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams (Organizations)
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    member_count INTEGER NOT NULL DEFAULT 1,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members with roles
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    plan_id TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- WORKSPACES (PROJECTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📋',
    phase TEXT NOT NULL DEFAULT 'research' CHECK (phase IN ('research', 'planning', 'review', 'execution', 'testing', 'metrics', 'complete')),
    enabled_modules JSONB NOT NULL DEFAULT '["research", "mind_map", "features"]'::jsonb,
    custom_instructions TEXT,
    ai_memory TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MIND MAPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mind_maps (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Mind Map',
    canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    viewport JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mind_map_nodes (
    id TEXT PRIMARY KEY,
    mind_map_id TEXT NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('idea', 'feature', 'epic', 'module', 'user_story')),
    label TEXT NOT NULL,
    description TEXT,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION,
    height DOUBLE PRECISION,
    style JSONB,
    data JSONB,
    converted_to_feature_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mind_map_edges (
    id TEXT PRIMARY KEY,
    mind_map_id TEXT NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    target_node_id TEXT NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'default',
    style JSONB,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FEATURES & TIMELINE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.features (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timeline_items (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    timeline TEXT NOT NULL CHECK (timeline IN ('MVP', 'SHORT', 'LONG')),
    difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    categories TEXT[] DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    start_date DATE,
    end_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.linked_items (
    id TEXT PRIMARY KEY,
    source_timeline_item_id TEXT NOT NULL REFERENCES public.timeline_items(id) ON DELETE CASCADE,
    target_timeline_item_id TEXT NOT NULL REFERENCES public.timeline_items(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('dependency', 'blocks', 'complements', 'relates')),
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_timeline_item_id, target_timeline_item_id, relationship_type)
);

-- =====================================================
-- EXTERNAL REVIEW SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.review_links (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('invite', 'public', 'embed')),
    email TEXT,
    name TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
    id TEXT PRIMARY KEY,
    review_link_id TEXT NOT NULL REFERENCES public.review_links(id) ON DELETE CASCADE,
    feature_id TEXT REFERENCES public.features(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    attachments TEXT[],
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'dismissed')),
    reviewer_email TEXT,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.custom_dashboards (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layout JSONB NOT NULL,
    widgets JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.success_metrics (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    feature_id TEXT REFERENCES public.features(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    target_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    unit TEXT,
    measured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AI USAGE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 1,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DOUBLE PRECISION,
    month TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_team_id ON public.workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_phase ON public.workspaces(phase);

-- Mind Maps
CREATE INDEX IF NOT EXISTS idx_mind_maps_workspace_id ON public.mind_maps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_map_id ON public.mind_map_nodes(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_map_id ON public.mind_map_edges(mind_map_id);

-- Features
CREATE INDEX IF NOT EXISTS idx_features_workspace_id ON public.features(workspace_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON public.features(status);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON public.features(assigned_to);

-- Timeline Items
CREATE INDEX IF NOT EXISTS idx_timeline_items_feature_id ON public.timeline_items(feature_id);
CREATE INDEX IF NOT EXISTS idx_timeline_items_timeline ON public.timeline_items(timeline);

-- Linked Items
CREATE INDEX IF NOT EXISTS idx_linked_items_source ON public.linked_items(source_timeline_item_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_target ON public.linked_items(target_timeline_item_id);

-- Review Links
CREATE INDEX IF NOT EXISTS idx_review_links_workspace_id ON public.review_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_review_links_token ON public.review_links(token);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_review_link_id ON public.feedback(review_link_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feature_id ON public.feedback(feature_id);

-- AI Usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_team_id ON public.ai_usage(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON public.ai_usage(month);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_team_id ON public.invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users: can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Teams: members can view their teams
CREATE POLICY "Team members can view their teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their teams" ON public.teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Anyone can create teams" ON public.teams
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Team Members: members can view team roster
CREATE POLICY "Team members can view roster" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage team members" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Workspaces: team members can access
CREATE POLICY "Team members can view workspaces" ON public.workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = workspaces.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = workspaces.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can update workspaces" ON public.workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = workspaces.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Mind Maps: workspace access implies mind map access
CREATE POLICY "Workspace members can manage mind maps" ON public.mind_maps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE w.id = mind_maps.workspace_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage mind map nodes" ON public.mind_map_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mind_maps mm
            JOIN public.workspaces w ON w.id = mm.workspace_id
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE mm.id = mind_map_nodes.mind_map_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage mind map edges" ON public.mind_map_edges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mind_maps mm
            JOIN public.workspaces w ON w.id = mm.workspace_id
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE mm.id = mind_map_edges.mind_map_id
            AND tm.user_id = auth.uid()
        )
    );

-- Features: workspace members can manage
CREATE POLICY "Workspace members can manage features" ON public.features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE w.id = features.workspace_id
            AND tm.user_id = auth.uid()
        )
    );

-- Timeline Items: inherit feature permissions
CREATE POLICY "Workspace members can manage timeline items" ON public.timeline_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.features f
            JOIN public.workspaces w ON w.id = f.workspace_id
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE f.id = timeline_items.feature_id
            AND tm.user_id = auth.uid()
        )
    );

-- Linked Items: inherit timeline item permissions
CREATE POLICY "Workspace members can manage linked items" ON public.linked_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.timeline_items ti
            JOIN public.features f ON f.id = ti.feature_id
            JOIN public.workspaces w ON w.id = f.workspace_id
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE ti.id = linked_items.source_timeline_item_id
            AND tm.user_id = auth.uid()
        )
    );

-- Review Links: workspace members can create, anyone with token can view
CREATE POLICY "Workspace members can create review links" ON public.review_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE w.id = review_links.workspace_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view active review links by token" ON public.review_links
    FOR SELECT USING (is_active = true);

-- Feedback: anyone can submit, workspace members can view
CREATE POLICY "Anyone can submit feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Workspace members can view feedback" ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.review_links rl
            JOIN public.workspaces w ON w.id = rl.workspace_id
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE rl.id = feedback.review_link_id
            AND tm.user_id = auth.uid()
        )
    );

-- Custom Dashboards & Success Metrics
CREATE POLICY "Workspace members can manage dashboards" ON public.custom_dashboards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE w.id = custom_dashboards.workspace_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage metrics" ON public.success_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            JOIN public.team_members tm ON tm.team_id = w.team_id
            WHERE w.id = success_metrics.workspace_id
            AND tm.user_id = auth.uid()
        )
    );

-- AI Usage: team members can view team usage
CREATE POLICY "Team members can view AI usage" ON public.ai_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = ai_usage.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Invitations
CREATE POLICY "Team admins can manage invitations" ON public.invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = invitations.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mind_maps_updated_at BEFORE UPDATE ON public.mind_maps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mind_map_nodes_updated_at BEFORE UPDATE ON public.mind_map_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON public.features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE ON public.timeline_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_dashboards_updated_at BEFORE UPDATE ON public.custom_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.teams
        SET member_count = (
            SELECT COUNT(*) FROM public.team_members
            WHERE team_id = NEW.team_id
        )
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.teams
        SET member_count = (
            SELECT COUNT(*) FROM public.team_members
            WHERE team_id = OLD.team_id
        )
        WHERE id = OLD.team_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_count_on_insert
    AFTER INSERT ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

CREATE TRIGGER update_member_count_on_delete
    AFTER DELETE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- This section intentionally left empty
-- Initial data will be created through the application

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.teams IS 'Organizations that own workspaces and have billing';
COMMENT ON TABLE public.workspaces IS 'Projects with phase-based workflows and modular features';
COMMENT ON TABLE public.mind_maps IS 'Visual canvas for brainstorming and planning';
COMMENT ON TABLE public.review_links IS 'External review system for gathering feedback';
COMMENT ON COLUMN public.workspaces.phase IS 'Current lifecycle phase: research, planning, review, execution, testing, metrics, complete';
COMMENT ON COLUMN public.workspaces.enabled_modules IS 'Array of enabled module names: research, mind_map, features, dependencies, review, execution, collaboration, timeline, analytics, ai';
