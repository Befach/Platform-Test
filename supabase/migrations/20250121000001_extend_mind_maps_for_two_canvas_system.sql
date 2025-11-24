-- Two-Canvas System Extension
-- Extends mind_maps tables to support:
-- 1. Work Items Visualization Canvas (auto-generated)
-- 2. Free-Form Mind Maps (user-created with shapes)

-- ========== EXTEND MIND MAPS TABLE ==========
-- Add canvas_type to differentiate between the two canvas systems
ALTER TABLE mind_maps
  ADD COLUMN IF NOT EXISTS canvas_type TEXT DEFAULT 'freeform'
  CHECK (canvas_type IN ('work_items_visualization', 'freeform'));

COMMENT ON COLUMN mind_maps.canvas_type IS 'Type of canvas: work_items_visualization (auto-generated) or freeform (user-created with shapes)';

-- ========== EXTEND MIND MAP NODES TABLE ==========
-- Add shape_type for free-form drawing (rectangles, circles, sticky notes, etc.)
ALTER TABLE mind_map_nodes
  ADD COLUMN IF NOT EXISTS shape_type TEXT DEFAULT 'semantic'
  CHECK (shape_type IN ('semantic', 'rectangle', 'circle', 'sticky_note', 'text', 'arrow', 'work_item_reference'));

COMMENT ON COLUMN mind_map_nodes.shape_type IS 'Shape type: semantic (uses node_type for idea/problem/etc), or geometric shapes for freeform canvases';

-- Add referenced_work_item_id for WorkItemReferenceNode (links to work items)
ALTER TABLE mind_map_nodes
  ADD COLUMN IF NOT EXISTS referenced_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN mind_map_nodes.referenced_work_item_id IS 'For work_item_reference shape_type: links to a work item, displays live data';

-- Add dimensions for resizable shapes
ALTER TABLE mind_map_nodes
  ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 150,
  ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 100;

COMMENT ON COLUMN mind_map_nodes.width IS 'Node width in pixels (for resizable shapes)';
COMMENT ON COLUMN mind_map_nodes.height IS 'Node height in pixels (for resizable shapes)';

-- ========== PERFORMANCE INDEXES ==========
-- Index for canvas_type filtering
CREATE INDEX IF NOT EXISTS idx_mind_maps_canvas_type ON mind_maps(canvas_type);

-- Index for shape_type filtering
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_shape_type ON mind_map_nodes(shape_type);

-- Index for work item references (critical for bidirectional linking)
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_referenced_work_item
  ON mind_map_nodes(referenced_work_item_id)
  WHERE referenced_work_item_id IS NOT NULL;

-- ========== CLEANUP TRIGGER FUNCTION ==========
-- Handle orphaned work item references when work items are deleted
CREATE OR REPLACE FUNCTION handle_work_item_reference_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- When a work item is deleted, set referenced_work_item_id to NULL
  -- (ON DELETE SET NULL handles this automatically, this is for logging/notifications)
  -- We could add logic here to notify users or mark nodes as "orphaned"
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on work_items deletion
CREATE TRIGGER cleanup_work_item_references
  BEFORE DELETE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_work_item_reference_cleanup();

-- ========== DEFAULT VALUES FOR EXISTING RECORDS ==========
-- Set canvas_type for existing mind maps (all are freeform by default)
UPDATE mind_maps
SET canvas_type = 'freeform'
WHERE canvas_type IS NULL;

-- Set shape_type for existing nodes (all are semantic by default)
UPDATE mind_map_nodes
SET shape_type = 'semantic'
WHERE shape_type IS NULL;

-- Set default dimensions for existing nodes
UPDATE mind_map_nodes
SET width = 150, height = 100
WHERE width IS NULL OR height IS NULL;

-- ========== VALIDATION ==========
-- Ensure work_item_reference nodes have a referenced_work_item_id
CREATE OR REPLACE FUNCTION validate_work_item_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shape_type = 'work_item_reference' AND NEW.referenced_work_item_id IS NULL THEN
    RAISE EXCEPTION 'work_item_reference nodes must have a referenced_work_item_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_work_item_reference_trigger
  BEFORE INSERT OR UPDATE ON mind_map_nodes
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_item_reference();

-- ========== SUMMARY ==========
-- Added 5 new columns to support two-canvas system:
-- 1. mind_maps.canvas_type - Differentiates work_items vs freeform canvases
-- 2. mind_map_nodes.shape_type - Supports geometric shapes (rectangle, circle, etc.)
-- 3. mind_map_nodes.referenced_work_item_id - Links to work items for WorkItemReferenceNode
-- 4. mind_map_nodes.width - Resizable node width
-- 5. mind_map_nodes.height - Resizable node height
--
-- Added 3 indexes for performance
-- Added 2 triggers for cleanup and validation
-- RLS policies unchanged (use existing team_id filtering)
