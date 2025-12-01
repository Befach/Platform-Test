-- ============================================================================
-- Migration: Create Customer Insights Module
-- Date: 2025-12-01
-- Purpose: Voice-of-customer insights with feedback integration, voting, and work item linking
-- Tables: customer_insights, work_item_insights (junction), insight_votes
-- Features: Full-text search, sentiment tracking, voting, feedback conversion
-- ============================================================================

-- ============================================================================
-- TABLE 1: customer_insights - Core insight storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_insights (
  -- Primary key (timestamp-based TEXT, not UUID)
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Multi-tenant isolation (REQUIRED)
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE SET NULL,

  -- Core content
  title TEXT NOT NULL,
  quote TEXT,
  pain_point TEXT,
  context TEXT,

  -- Source classification
  source TEXT NOT NULL CHECK (source IN (
    'feedback',    -- From feedback module
    'support',     -- Support tickets
    'interview',   -- Customer interviews
    'survey',      -- Survey responses
    'social',      -- Social media
    'analytics',   -- Analytics data
    'other'        -- Other sources
  )),
  source_url TEXT,
  source_date DATE,

  -- Customer info
  customer_name TEXT,
  customer_email TEXT,
  customer_segment TEXT,
  customer_company TEXT,

  -- Classification
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN (
    'positive', 'neutral', 'negative', 'mixed'
  )),

  -- Prioritization
  impact_score INTEGER DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 10),
  frequency INTEGER DEFAULT 1 CHECK (frequency >= 1),
  tags TEXT[] DEFAULT '{}',

  -- Workflow status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new',         -- Just captured
    'reviewed',    -- Reviewed by team
    'actionable',  -- Marked for action
    'addressed',   -- Linked to work item and addressed
    'archived'     -- No longer active
  )),

  -- Feedback integration (track origin)
  source_feedback_id TEXT REFERENCES public.feedback(id) ON DELETE SET NULL,

  -- AI fields (future-proofing)
  ai_extracted BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(3,2),
  ai_summary TEXT,

  -- Full-text search (generated column with weighted fields)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(quote, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(pain_point, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(context, '')), 'C')
  ) STORED,

  -- Audit columns
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE public.customer_insights IS 'Voice-of-customer insights synthesized from feedback, interviews, and other sources';
COMMENT ON COLUMN public.customer_insights.source IS 'Origin: feedback, support, interview, survey, social, analytics, other';
COMMENT ON COLUMN public.customer_insights.sentiment IS 'Customer sentiment: positive, neutral, negative, mixed';
COMMENT ON COLUMN public.customer_insights.impact_score IS 'Manual priority score 0-10 (higher = more impactful)';
COMMENT ON COLUMN public.customer_insights.frequency IS 'How often this insight/pain point is mentioned';
COMMENT ON COLUMN public.customer_insights.source_feedback_id IS 'Link to original feedback if converted from feedback module';
COMMENT ON COLUMN public.customer_insights.search_vector IS 'Generated tsvector for full-text search (title=A, quote/pain_point=B, context=C)';

-- ============================================================================
-- TABLE 2: work_item_insights - Junction table (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_item_insights (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Foreign keys
  work_item_id TEXT NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL REFERENCES public.customer_insights(id) ON DELETE CASCADE,

  -- Multi-tenant (denormalized for RLS performance)
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Link metadata
  relevance_score INTEGER DEFAULT 5 CHECK (relevance_score >= 1 AND relevance_score <= 10),
  notes TEXT,

  -- Audit
  linked_by UUID REFERENCES public.users(id),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint (one link per work_item + insight pair)
  UNIQUE(work_item_id, insight_id)
);

COMMENT ON TABLE public.work_item_insights IS 'Junction table linking customer insights to work items (many-to-many)';
COMMENT ON COLUMN public.work_item_insights.relevance_score IS 'How relevant is this insight to the work item (1-10, higher = more relevant)';
COMMENT ON COLUMN public.work_item_insights.notes IS 'Optional notes explaining the connection';

-- ============================================================================
-- TABLE 3: insight_votes - Voting system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.insight_votes (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Foreign keys
  insight_id TEXT NOT NULL REFERENCES public.customer_insights(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Voter info (supports both authenticated users and external stakeholders)
  voter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  voter_email TEXT NOT NULL,
  vote_type TEXT DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One vote per email per insight
  UNIQUE(insight_id, voter_email)
);

COMMENT ON TABLE public.insight_votes IS 'Votes on insights from team members and external stakeholders';
COMMENT ON COLUMN public.insight_votes.voter_id IS 'NULL for external voters (via review links)';
COMMENT ON COLUMN public.insight_votes.voter_email IS 'Email of voter - required for uniqueness';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- customer_insights: Full-text search (GIN index)
CREATE INDEX IF NOT EXISTS idx_customer_insights_search
  ON public.customer_insights USING GIN(search_vector);

-- customer_insights: Tags array (GIN index)
CREATE INDEX IF NOT EXISTS idx_customer_insights_tags
  ON public.customer_insights USING GIN(tags);

-- customer_insights: Team and workspace filtering
CREATE INDEX IF NOT EXISTS idx_customer_insights_team_workspace
  ON public.customer_insights(team_id, workspace_id);

-- customer_insights: Source filtering
CREATE INDEX IF NOT EXISTS idx_customer_insights_source
  ON public.customer_insights(source);

-- customer_insights: Sentiment filtering
CREATE INDEX IF NOT EXISTS idx_customer_insights_sentiment
  ON public.customer_insights(sentiment);

-- customer_insights: Status filtering
CREATE INDEX IF NOT EXISTS idx_customer_insights_status
  ON public.customer_insights(status);

-- customer_insights: Impact score for prioritization (active insights only)
CREATE INDEX IF NOT EXISTS idx_customer_insights_impact
  ON public.customer_insights(impact_score DESC)
  WHERE status != 'archived';

-- customer_insights: Feedback integration
CREATE INDEX IF NOT EXISTS idx_customer_insights_feedback
  ON public.customer_insights(source_feedback_id)
  WHERE source_feedback_id IS NOT NULL;

-- work_item_insights: Work item lookup
CREATE INDEX IF NOT EXISTS idx_work_item_insights_work_item
  ON public.work_item_insights(work_item_id);

-- work_item_insights: Insight lookup
CREATE INDEX IF NOT EXISTS idx_work_item_insights_insight
  ON public.work_item_insights(insight_id);

-- work_item_insights: Team lookup for RLS
CREATE INDEX IF NOT EXISTS idx_work_item_insights_team
  ON public.work_item_insights(team_id);

-- insight_votes: Insight lookup (for counting)
CREATE INDEX IF NOT EXISTS idx_insight_votes_insight
  ON public.insight_votes(insight_id);

-- insight_votes: Team lookup for RLS
CREATE INDEX IF NOT EXISTS idx_insight_votes_team
  ON public.insight_votes(team_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trigger_customer_insights_updated_at ON public.customer_insights;
CREATE TRIGGER trigger_customer_insights_updated_at
  BEFORE UPDATE ON public.customer_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_insights_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.customer_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: customer_insights
-- ============================================================================

DROP POLICY IF EXISTS "Team members can view insights" ON public.customer_insights;
CREATE POLICY "Team members can view insights"
  ON public.customer_insights FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can create insights" ON public.customer_insights;
CREATE POLICY "Team members can create insights"
  ON public.customer_insights FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can update insights" ON public.customer_insights;
CREATE POLICY "Team members can update insights"
  ON public.customer_insights FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can delete insights" ON public.customer_insights;
CREATE POLICY "Admins can delete insights"
  ON public.customer_insights FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: work_item_insights
-- ============================================================================

DROP POLICY IF EXISTS "Team members can view insight links" ON public.work_item_insights;
CREATE POLICY "Team members can view insight links"
  ON public.work_item_insights FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can create insight links" ON public.work_item_insights;
CREATE POLICY "Team members can create insight links"
  ON public.work_item_insights FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can update insight links" ON public.work_item_insights;
CREATE POLICY "Team members can update insight links"
  ON public.work_item_insights FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can delete insight links" ON public.work_item_insights;
CREATE POLICY "Team members can delete insight links"
  ON public.work_item_insights FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: insight_votes
-- ============================================================================

DROP POLICY IF EXISTS "Team members can view votes" ON public.insight_votes;
CREATE POLICY "Team members can view votes"
  ON public.insight_votes FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can create votes" ON public.insight_votes;
CREATE POLICY "Team members can create votes"
  ON public.insight_votes FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Voters can update their own votes" ON public.insight_votes;
CREATE POLICY "Voters can update their own votes"
  ON public.insight_votes FOR UPDATE
  USING (
    voter_id = (SELECT auth.uid())
    OR voter_email IN (
      SELECT email FROM public.users
      WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Voters can delete their own votes" ON public.insight_votes;
CREATE POLICY "Voters can delete their own votes"
  ON public.insight_votes FOR DELETE
  USING (
    voter_id = (SELECT auth.uid())
    OR voter_email IN (
      SELECT email FROM public.users
      WHERE id = (SELECT auth.uid())
    )
  );

-- External voting via review links (for stakeholders)
DROP POLICY IF EXISTS "External voters can vote via review links" ON public.insight_votes;
CREATE POLICY "External voters can vote via review links"
  ON public.insight_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review_links rl
      JOIN public.customer_insights ci ON ci.workspace_id = rl.workspace_id
      WHERE ci.id = insight_votes.insight_id
      AND rl.is_active = TRUE
      AND (rl.expires_at IS NULL OR rl.expires_at > NOW())
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_item_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insight_votes TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================================================
/*
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%insight%';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%insight%';

-- Check policies
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE '%insight%';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%insight%';
*/
