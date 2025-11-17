-- Migration: Add conversion tracking to features table
-- Purpose: Track item evolution (User Need → Feature, User Request → Bug Fix)
-- Created: 2025-01-13

-- Add conversion tracking fields
ALTER TABLE features ADD COLUMN IF NOT EXISTS converted_from_id TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS converted_from_type TEXT
  CHECK (converted_from_type IN ('mind_map_node', 'feature', 'user_need', 'user_request', 'idea', 'exploration', 'bug_report'));
ALTER TABLE features ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE features ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES users(id);

-- Add conversion chain for full lineage tracking
-- Format: [{id, type, title, convertedAt, convertedBy, reason}]
ALTER TABLE features ADD COLUMN IF NOT EXISTS conversion_chain JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_converted_from
  ON features(converted_from_id, converted_from_type)
  WHERE converted_from_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_features_converted_by
  ON features(converted_by)
  WHERE converted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_features_conversion_chain
  ON features USING GIN(conversion_chain)
  WHERE jsonb_array_length(conversion_chain) > 0;

-- Add comments for documentation
COMMENT ON COLUMN features.converted_from_id IS 'ID of the item this work item was converted from (immediate parent)';
COMMENT ON COLUMN features.converted_from_type IS 'Type of the source item (mind_map_node, feature, user_need, etc.)';
COMMENT ON COLUMN features.converted_at IS 'Timestamp when the item was converted';
COMMENT ON COLUMN features.converted_by IS 'User who performed the conversion';
COMMENT ON COLUMN features.conversion_chain IS 'Full conversion lineage from original idea to current state';

-- Helper function to get conversion lineage
CREATE OR REPLACE FUNCTION get_conversion_lineage(feature_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  current_id TEXT;
  current_type TEXT;
  chain JSONB;
  current_title TEXT;
BEGIN
  -- Start with the feature
  SELECT converted_from_id, converted_from_type, conversion_chain, name
  INTO current_id, current_type, chain, current_title
  FROM features
  WHERE id = feature_id_param;

  -- If has conversion chain, return it
  IF chain IS NOT NULL AND jsonb_array_length(chain) > 0 THEN
    RETURN chain;
  END IF;

  -- Otherwise, build simple chain from immediate parent
  IF current_id IS NOT NULL THEN
    RETURN jsonb_build_array(
      jsonb_build_object(
        'id', current_id,
        'type', current_type,
        'title', current_title
      )
    );
  END IF;

  -- No conversion history
  RETURN '[]'::jsonb;
END;
$$;

-- Add conversion metadata to mind_map_nodes (if not exists)
ALTER TABLE mind_map_nodes ADD COLUMN IF NOT EXISTS conversion_metadata JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN mind_map_nodes.conversion_metadata IS 'Additional context about conversion: {reason, preservedData, originalType}';

-- Create reverse lookup index for mind map conversions
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_converted_to
  ON mind_map_nodes(converted_to_feature_id)
  WHERE converted_to_feature_id IS NOT NULL;
