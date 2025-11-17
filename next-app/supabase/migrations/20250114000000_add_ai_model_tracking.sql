-- Migration: Add AI Model Tracking
-- Created: 2025-01-14
-- Purpose: Track AI model usage, costs, and user preferences

-- ============================================================================
-- 1. AI Usage Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Model information
  model_key TEXT NOT NULL, -- 'claude-haiku-45', 'grok-4-fast', etc.
  model_id TEXT NOT NULL, -- Full OpenRouter ID with :nitro suffix
  model_name TEXT NOT NULL, -- Display name
  provider TEXT NOT NULL, -- 'Anthropic', 'xAI', 'Moonshot', 'Minimax'

  -- Usage details
  feature_type TEXT NOT NULL, -- 'dependency_suggestion', 'chat', etc.
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0, -- Cost in USD

  -- Request metadata
  request_duration_ms INTEGER, -- How long the request took
  suggestions_generated INTEGER, -- Number of suggestions returned
  suggestions_approved INTEGER DEFAULT 0, -- How many were approved
  suggestions_rejected INTEGER DEFAULT 0, -- How many were rejected

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for efficient queries
  CONSTRAINT ai_usage_tokens_check CHECK (
    prompt_tokens >= 0 AND
    completion_tokens >= 0 AND
    total_tokens >= 0
  ),
  CONSTRAINT ai_usage_cost_check CHECK (cost_usd >= 0)
);

-- Indexes for performance
CREATE INDEX idx_ai_usage_team_id ON ai_usage(team_id);
CREATE INDEX idx_ai_usage_workspace_id ON ai_usage(workspace_id);
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_model_key ON ai_usage(model_key);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_feature_type ON ai_usage(feature_type);

-- Enable Row-Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can read team AI usage"
ON ai_usage FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own AI usage records"
ON ai_usage FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 2. Add AI Preferences to Teams Table
-- ============================================================================

-- Add preferred AI model column to teams
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS preferred_ai_model TEXT DEFAULT 'claude-haiku-45';

-- Add AI budget settings
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS ai_monthly_budget_usd DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_current_month_spend_usd DECIMAL(10, 6) DEFAULT 0;

-- Add constraint for valid model keys
ALTER TABLE teams
ADD CONSTRAINT teams_preferred_ai_model_check
CHECK (
  preferred_ai_model IN (
    'claude-haiku-45',
    'grok-4-fast',
    'kimi-k2-thinking',
    'minimax-m2'
  )
);

-- Add constraint for budget
ALTER TABLE teams
ADD CONSTRAINT teams_ai_budget_check
CHECK (
  ai_monthly_budget_usd IS NULL OR
  ai_monthly_budget_usd >= 0
);

-- ============================================================================
-- 3. Add AI Preferences to Users Table (Optional per-user overrides)
-- ============================================================================

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_ai_model TEXT, -- Override team default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT user_ai_preferences_model_check
  CHECK (
    preferred_ai_model IS NULL OR
    preferred_ai_model IN (
      'claude-haiku-45',
      'grok-4-fast',
      'kimi-k2-thinking',
      'minimax-m2'
    )
  )
);

-- Enable RLS
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own preferences"
ON user_ai_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON user_ai_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. Create View for AI Usage Analytics
-- ============================================================================

CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  team_id,
  model_key,
  model_name,
  provider,
  feature_type,
  DATE_TRUNC('day', created_at) AS usage_date,
  COUNT(*) AS request_count,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  AVG(request_duration_ms) AS avg_duration_ms,
  SUM(suggestions_generated) AS total_suggestions,
  SUM(suggestions_approved) AS total_approved,
  SUM(suggestions_rejected) AS total_rejected,
  CASE
    WHEN SUM(suggestions_generated) > 0
    THEN (SUM(suggestions_approved)::FLOAT / SUM(suggestions_generated) * 100)
    ELSE 0
  END AS approval_rate_percent
FROM ai_usage
GROUP BY team_id, model_key, model_name, provider, feature_type, usage_date;

-- ============================================================================
-- 5. Create Function to Update Monthly Spend
-- ============================================================================

CREATE OR REPLACE FUNCTION update_team_ai_spend()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team's current month spend
  UPDATE teams
  SET ai_current_month_spend_usd = (
    SELECT COALESCE(SUM(cost_usd), 0)
    FROM ai_usage
    WHERE team_id = NEW.team_id
      AND created_at >= DATE_TRUNC('month', NOW())
  )
  WHERE id = NEW.team_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update spend
DROP TRIGGER IF EXISTS trigger_update_team_ai_spend ON ai_usage;
CREATE TRIGGER trigger_update_team_ai_spend
AFTER INSERT ON ai_usage
FOR EACH ROW
EXECUTE FUNCTION update_team_ai_spend();

-- ============================================================================
-- 6. Create Function to Reset Monthly Spend (Call via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_ai_spend()
RETURNS void AS $$
BEGIN
  -- Reset all teams' monthly spend on the 1st of each month
  UPDATE teams
  SET ai_current_month_spend_usd = 0
  WHERE ai_current_month_spend_usd > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE ai_usage IS 'Tracks AI model usage, tokens, costs, and suggestion acceptance rates';
COMMENT ON COLUMN ai_usage.model_key IS 'Model key from AI_MODELS config (claude-haiku-45, grok-4-fast, etc.)';
COMMENT ON COLUMN ai_usage.model_id IS 'Full OpenRouter model ID with :nitro suffix';
COMMENT ON COLUMN ai_usage.feature_type IS 'Which feature used AI (dependency_suggestion, chat, etc.)';
COMMENT ON COLUMN ai_usage.suggestions_approved IS 'How many AI suggestions were accepted by user';
COMMENT ON COLUMN ai_usage.suggestions_rejected IS 'How many AI suggestions were rejected by user';

COMMENT ON COLUMN teams.preferred_ai_model IS 'Team default AI model for dependency suggestions';
COMMENT ON COLUMN teams.ai_monthly_budget_usd IS 'Monthly AI budget in USD (NULL = unlimited)';
COMMENT ON COLUMN teams.ai_current_month_spend_usd IS 'Current month AI spend in USD (auto-updated)';

COMMENT ON TABLE user_ai_preferences IS 'Per-user AI model preferences (override team default)';
COMMENT ON VIEW ai_usage_summary IS 'Aggregated AI usage analytics by team, model, and date';

-- ============================================================================
-- Complete!
-- ============================================================================
