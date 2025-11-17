-- Create tags table for reusable category tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES auth.users(id),
  UNIQUE(team_id, name)
);

-- Create indexes
CREATE INDEX idx_tags_team_id ON tags(team_id);
CREATE INDEX idx_tags_name ON tags(name);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view team tags"
ON tags FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create team tags"
ON tags FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update team tags"
ON tags FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete team tags"
ON tags FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Create work_item_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS work_item_tags (
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (work_item_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_work_item_tags_work_item_id ON work_item_tags(work_item_id);
CREATE INDEX idx_work_item_tags_tag_id ON work_item_tags(tag_id);

-- Enable RLS
ALTER TABLE work_item_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_item_tags
CREATE POLICY "Team members can view work item tags"
ON work_item_tags FOR SELECT
USING (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can create work item tags"
ON work_item_tags FOR INSERT
WITH CHECK (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can delete work item tags"
ON work_item_tags FOR DELETE
USING (
  work_item_id IN (
    SELECT id FROM work_items
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);
