-- Migration: Create Feedback Module
-- Date: 2025-01-24
-- Purpose: Add feedback as separate module that attaches to any work item

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Source (3 types: internal, customer, user)
  source TEXT NOT NULL CHECK (source IN ('internal', 'customer', 'user')),
  source_name TEXT NOT NULL,
  source_role TEXT,
  source_email TEXT,

  -- Priority (2 levels: high, low)
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high', 'low')),

  -- Content
  content TEXT NOT NULL,
  context TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Triage workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'deferred', 'rejected')),
  decision TEXT CHECK (decision IN ('implement', 'defer', 'reject')),
  decision_reason TEXT,
  decision_by TEXT REFERENCES users(id),
  decision_at TIMESTAMPTZ,

  -- Implementation tracking
  implemented_in_id TEXT REFERENCES work_items(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_feedback_work_item ON feedback(work_item_id);
CREATE INDEX idx_feedback_team ON feedback(team_id);
CREATE INDEX idx_feedback_workspace ON feedback(workspace_id);
CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_received_at ON feedback(received_at DESC);

-- RLS policies for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feedback for their team's work items
CREATE POLICY "Users can view feedback for their team"
  ON feedback
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert feedback for their team's work items
CREATE POLICY "Users can insert feedback for their team"
  ON feedback
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update feedback for their team's work items
CREATE POLICY "Users can update feedback for their team"
  ON feedback
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete feedback for their team's work items
CREATE POLICY "Users can delete feedback for their team"
  ON feedback
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on row update
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Comments for documentation
COMMENT ON TABLE feedback IS 'User/stakeholder feedback attached to work items. Separate from work items to allow multiple feedback per item.';
COMMENT ON COLUMN feedback.source IS 'Source type: internal (team), customer (paying), user (non-paying)';
COMMENT ON COLUMN feedback.priority IS 'Priority: high (must address), low (review later). Auto-suggested based on source.';
COMMENT ON COLUMN feedback.status IS 'Triage status: pending → reviewed → implemented/deferred/rejected';
COMMENT ON COLUMN feedback.implemented_in_id IS 'Points to work item created from this feedback (if implemented)';
