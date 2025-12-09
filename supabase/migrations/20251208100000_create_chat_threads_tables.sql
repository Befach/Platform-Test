-- =============================================================================
-- Migration: Create Chat Threads & Messages for AI Chat Persistence
-- Purpose: Enable thread history and message persistence for assistant-ui
-- =============================================================================

-- Chat Threads table - stores conversation threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY DEFAULT to_char(now(), 'YYYYMMDDHH24MISSMS'),
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Track which user created the thread (store as text for flexibility)
  created_by TEXT,
  -- Thread status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Chat Messages table - stores individual messages within threads
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT to_char(now(), 'YYYYMMDDHH24MISSMS'),
  thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  -- AI SDK v5 message parts for rich content
  parts JSONB,
  -- Tool invocations for tool calls
  tool_invocations JSONB,
  -- Model that generated this message (for assistant messages)
  model_used TEXT,
  -- Message metadata (tokens, latency, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

-- Thread lookups by team and workspace
CREATE INDEX IF NOT EXISTS idx_chat_threads_team ON chat_threads(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_workspace ON chat_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created_by ON chat_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_threads_status ON chat_threads(status);
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated ON chat_threads(updated_at DESC);

-- Message lookups by thread (most recent first)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON chat_messages(thread_id, created_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Enable RLS
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Thread policies: Users can access threads in their teams
CREATE POLICY "chat_threads_team_access" ON chat_threads
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Message policies: Users can access messages in threads they have access to
CREATE POLICY "chat_messages_thread_access" ON chat_messages
  FOR ALL USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- Trigger for auto-updating updated_at on threads
-- =============================================================================

CREATE OR REPLACE FUNCTION update_chat_thread_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_thread_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_thread_timestamp();

-- Also update thread timestamp when new message is added
CREATE OR REPLACE FUNCTION update_thread_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE chat_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_message_updates_thread
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_new_message();
