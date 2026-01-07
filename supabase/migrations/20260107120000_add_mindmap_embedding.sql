-- =============================================================================
-- Phase 5: RAG Layer Integration for BlockSuite Mind Maps
-- =============================================================================
-- Adds embedding tracking columns to mind_maps table and extends document_chunks
-- for mind map content storage.
--
-- Architecture:
--   1. mind_maps gets embedding status tracking columns
--   2. document_chunks gets source_type and mind_map_id for mind map chunks
--   3. Indexes for efficient job queries and chunk lookups
-- =============================================================================

-- =============================================================================
-- MIND MAPS TABLE UPDATES
-- =============================================================================
-- Add embedding tracking columns to existing mind_maps table

-- Embedding status for tracking job state
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending'
  CHECK (embedding_status IN ('pending', 'processing', 'ready', 'error', 'skipped'));

-- Error message for failed embeddings
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS embedding_error TEXT;

-- Last successful embedding timestamp
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMPTZ;

-- Embedding version for cache invalidation
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 0;

-- Count of chunks generated from this mind map
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;

-- Hash of blocksuite_tree for change detection (avoid unnecessary re-embedding)
ALTER TABLE mind_maps
ADD COLUMN IF NOT EXISTS last_embedded_hash TEXT;

-- Index for embedding job queries (find maps needing embedding)
CREATE INDEX IF NOT EXISTS idx_mind_maps_embedding_status
ON mind_maps(embedding_status, team_id)
WHERE embedding_status IN ('pending', 'processing');

-- Index for workspace-scoped embedding queries
CREATE INDEX IF NOT EXISTS idx_mind_maps_embedding_workspace
ON mind_maps(workspace_id, embedding_status)
WHERE embedding_status IS NOT NULL;

-- =============================================================================
-- DOCUMENT CHUNKS TABLE UPDATES
-- =============================================================================
-- Extend document_chunks to support mind map content alongside regular documents

-- Source type to distinguish mind map chunks from document chunks
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'document'
  CHECK (source_type IN ('document', 'blocksuite_mindmap', 'url', 'upload'));

-- Mind map reference for mind map chunks (NULL for regular documents)
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS mind_map_id TEXT;

-- Index for mind map chunk lookups
CREATE INDEX IF NOT EXISTS idx_document_chunks_mind_map
ON document_chunks(mind_map_id)
WHERE mind_map_id IS NOT NULL;

-- Index for source type filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_source_type
ON document_chunks(source_type);

-- =============================================================================
-- UPDATE SEARCH FUNCTION
-- =============================================================================
-- Modify search_documents to optionally filter by source type

CREATE OR REPLACE FUNCTION search_documents(
  p_team_id TEXT,
  p_query_embedding extensions.vector(1536),
  p_workspace_id TEXT DEFAULT NULL,
  p_collection_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_threshold FLOAT DEFAULT 0.7,
  p_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id TEXT,
  document_id TEXT,
  document_name TEXT,
  content TEXT,
  similarity FLOAT,
  page_number INTEGER,
  heading TEXT,
  source_type TEXT,
  mind_map_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    COALESCE(kd.name, mm.name, 'Unknown') AS document_name,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) AS similarity,
    dc.page_number,
    dc.heading,
    dc.source_type,
    dc.mind_map_id
  FROM document_chunks dc
  LEFT JOIN knowledge_documents kd ON dc.document_id = kd.id
  LEFT JOIN mind_maps mm ON dc.mind_map_id = mm.id
  WHERE (
    -- Either from a document with team access
    (kd.team_id = p_team_id AND kd.status = 'ready')
    OR
    -- Or from a mind map with team access
    (mm.team_id = p_team_id)
  )
    AND (p_workspace_id IS NULL OR kd.workspace_id = p_workspace_id OR mm.workspace_id = p_workspace_id)
    AND (p_collection_id IS NULL OR kd.collection_id = p_collection_id)
    AND (p_source_type IS NULL OR dc.source_type = p_source_type)
    AND 1 - (dc.embedding <=> p_query_embedding) >= p_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- RLS POLICIES FOR MIND MAP CHUNKS
-- =============================================================================
-- Extend existing document_chunks policies to include mind map access

-- Drop existing policy if it exists and recreate with mind map support
DROP POLICY IF EXISTS "Users can view chunks of accessible documents" ON document_chunks;

CREATE POLICY "Users can view chunks of accessible documents or mind maps"
  ON document_chunks FOR SELECT
  USING (
    -- Access via document
    document_id IN (
      SELECT id FROM knowledge_documents
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
    OR
    -- Access via mind map
    mind_map_id IN (
      SELECT id FROM mind_maps
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Update system management policy to include mind maps
DROP POLICY IF EXISTS "System can manage chunks" ON document_chunks;

CREATE POLICY "System can manage chunks"
  ON document_chunks FOR ALL
  USING (
    document_id IN (
      SELECT id FROM knowledge_documents
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
    OR
    mind_map_id IN (
      SELECT id FROM mind_maps
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN mind_maps.embedding_status IS 'Status of embedding generation: pending, processing, ready, error, skipped';
COMMENT ON COLUMN mind_maps.embedding_error IS 'Error message if embedding generation failed';
COMMENT ON COLUMN mind_maps.last_embedded_at IS 'Timestamp of last successful embedding generation';
COMMENT ON COLUMN mind_maps.embedding_version IS 'Version counter for embedding cache invalidation';
COMMENT ON COLUMN mind_maps.chunk_count IS 'Number of chunks generated from this mind map';
COMMENT ON COLUMN mind_maps.last_embedded_hash IS 'MD5 hash of blocksuite_tree for change detection';

COMMENT ON COLUMN document_chunks.source_type IS 'Source type: document, blocksuite_mindmap, url, upload';
COMMENT ON COLUMN document_chunks.mind_map_id IS 'Reference to mind_maps.id for mind map chunks';
