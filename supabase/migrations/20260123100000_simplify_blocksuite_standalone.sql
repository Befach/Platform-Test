-- Migration: Simplify BlockSuite to Standalone Editor
-- Change ID: simplify-blocksuite-standalone
--
-- This migration removes the coupling between blocksuite_documents and mind_maps.
-- BlockSuite now works as a standalone canvas/editor without work item integration.
--
-- Changes:
-- 1. Drop mind_map_id index
-- 2. Drop mind_map_id column (removes FK constraint)
--
-- Benefits:
-- - Simpler architecture (standalone editor)
-- - No migration complexity from legacy mind maps
-- - Faster feature development

-- Drop the index first
DROP INDEX IF EXISTS idx_blocksuite_docs_mind_map;

-- Drop the mind_map_id column (automatically drops FK constraint)
ALTER TABLE blocksuite_documents DROP COLUMN IF EXISTS mind_map_id;

-- Update table comment to reflect new purpose
COMMENT ON TABLE blocksuite_documents IS
  'Standalone BlockSuite canvas documents. Yjs binary state stored in Supabase Storage. Decoupled from work items.';
