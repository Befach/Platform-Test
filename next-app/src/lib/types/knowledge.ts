/**
 * Knowledge Base / Document RAG Types
 *
 * TypeScript types for the document storage and retrieval system.
 * Supports vector embeddings and semantic search via Gemini.
 *
 * Architecture:
 * - KnowledgeDocument: File metadata and processing status
 * - DocumentChunk: Text segments with vector embeddings
 * - DocumentCollection: Organize documents by topic
 * - SearchResult: Vector similarity search results
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Supported file types for knowledge documents
 */
export type DocumentFileType =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'md'
  | 'txt'
  | 'html'
  | 'csv'
  | 'json'

/**
 * Document source type
 */
export type DocumentSourceType =
  | 'upload'            // User uploaded file
  | 'url'               // Imported from URL
  | 'integration'       // Synced from external integration
  | 'generated'         // AI-generated document
  | 'blocksuite_mindmap' // BlockSuite mind map content (Phase 5)

/**
 * Document processing status
 */
export type DocumentStatus =
  | 'pending'     // Waiting to be processed
  | 'processing'  // Currently being chunked/embedded
  | 'ready'       // Ready for search
  | 'error'       // Processing failed

/**
 * Document visibility level
 */
export type DocumentVisibility =
  | 'private'     // Only creator can see
  | 'team'        // All team members
  | 'workspace'   // Only workspace members

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Document collection (maps to document_collections table)
 */
export interface DocumentCollection {
  id: string
  team_id: string
  workspace_id?: string

  // Collection info
  name: string
  description?: string
  icon: string
  color: string

  // Settings
  is_default: boolean
  auto_embed: boolean

  // Audit
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Knowledge document (maps to knowledge_documents table)
 */
export interface KnowledgeDocument {
  id: string
  team_id: string
  workspace_id?: string
  collection_id?: string

  // Document info
  name: string
  description?: string

  // File metadata
  file_type: DocumentFileType
  file_size?: number
  file_path?: string
  file_url?: string

  // Source tracking
  source_type: DocumentSourceType
  source_url?: string
  source_integration?: string

  // Processing status
  status: DocumentStatus
  processing_error?: string

  // Content stats
  word_count?: number
  page_count?: number
  chunk_count: number

  // Embedding info
  embedding_model?: string
  embedding_dimensions?: number
  last_embedded_at?: string

  // Content
  extracted_text?: string
  extracted_at?: string

  // Metadata
  metadata: Record<string, unknown>
  tags: string[]
  visibility: DocumentVisibility

  // Audit
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Document chunk with embedding (maps to document_chunks table)
 */
export interface DocumentChunk {
  id: string
  document_id: string

  // Positioning
  chunk_index: number
  page_number?: number

  // Content
  content: string
  token_count?: number

  // Context
  heading?: string
  context_before?: string
  context_after?: string

  // Metadata
  metadata: Record<string, unknown>

  // Audit
  created_at: string

  // Note: embedding is stored as pgvector, not exposed to frontend
}

/**
 * Document query log (maps to document_queries table)
 */
export interface DocumentQuery {
  id: string
  team_id: string
  workspace_id?: string
  user_id?: string

  // Query
  query_text: string

  // Results
  result_count: number
  result_chunk_ids: string[]
  result_scores: number[]

  // Usage
  used_in_response: boolean
  response_id?: string

  // Timing
  duration_ms?: number
  created_at: string
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Document for display (safe for frontend)
 */
export interface DocumentDisplay {
  id: string
  name: string
  description?: string
  fileType: DocumentFileType
  fileSize?: number
  fileUrl?: string
  status: DocumentStatus
  processingError?: string
  wordCount?: number
  pageCount?: number
  chunkCount: number
  tags: string[]
  visibility: DocumentVisibility
  collectionId?: string
  collectionName?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

/**
 * Collection for display
 */
export interface CollectionDisplay {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  documentCount: number
  isDefault: boolean
  createdAt: string
}

/**
 * Search result from vector similarity
 */
export interface DocumentSearchResult {
  chunkId: string
  documentId: string
  documentName: string
  content: string
  similarity: number
  pageNumber?: number
  heading?: string
}

/**
 * Knowledge base statistics
 */
export interface KnowledgeBaseStats {
  totalDocuments: number
  totalChunks: number
  totalQueries: number
  documentsByType: Record<string, number>
  documentsByStatus: Record<string, number>
  recentDocuments: Array<{
    id: string
    name: string
    file_type: string
    status: string
    created_at: string
  }>
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Upload document request
 */
export interface UploadDocumentRequest {
  name: string
  description?: string
  collectionId?: string
  workspaceId?: string
  tags?: string[]
  visibility?: DocumentVisibility
  // File sent as FormData
}

/**
 * Upload document response
 */
export interface UploadDocumentResponse {
  document: DocumentDisplay
  uploadUrl?: string // Signed URL for direct upload
}

/**
 * Import document from URL request
 */
export interface ImportDocumentRequest {
  url: string
  name?: string // Auto-detect if not provided
  description?: string
  collectionId?: string
  workspaceId?: string
  tags?: string[]
}

/**
 * Search documents request
 */
export interface SearchDocumentsRequest {
  query: string
  workspaceId?: string
  collectionId?: string
  limit?: number
  threshold?: number
}

/**
 * Search documents response
 */
export interface SearchDocumentsResponse {
  results: DocumentSearchResult[]
  queryId: string
  durationMs: number
}

/**
 * Create collection request
 */
export interface CreateCollectionRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  workspaceId?: string
  autoEmbed?: boolean
}

/**
 * Update document request
 */
export interface UpdateDocumentRequest {
  name?: string
  description?: string
  collectionId?: string | null
  tags?: string[]
  visibility?: DocumentVisibility
}

// =============================================================================
// PROCESSING TYPES
// =============================================================================

/**
 * Document processing job
 */
export interface DocumentProcessingJob {
  documentId: string
  status: 'queued' | 'extracting' | 'chunking' | 'embedding' | 'completed' | 'failed'
  progress: number // 0-100
  currentStep: string
  error?: string
  startedAt: string
  completedAt?: string
}

/**
 * Chunk for embedding
 */
export interface ChunkForEmbedding {
  content: string
  index: number
  pageNumber?: number
  heading?: string
  metadata: Record<string, unknown>
}

/**
 * Embedding result
 */
export interface EmbeddingResult {
  chunks: Array<{
    index: number
    embedding: number[]
    tokenCount: number
  }>
  model: string
  dimensions: number
  totalTokens: number
}

// =============================================================================
// RAG CONTEXT TYPES
// =============================================================================

/**
 * RAG context for AI prompts
 */
export interface RAGContext {
  query: string
  relevantChunks: Array<{
    documentName: string
    content: string
    similarity: number
    pageNumber?: number
    heading?: string
  }>
  totalDocumentsSearched: number
  searchDurationMs: number
}

/**
 * Citation reference
 */
export interface Citation {
  documentId: string
  documentName: string
  chunkId: string
  pageNumber?: number
  heading?: string
  excerpt: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Supported file types with metadata
 */
export const SUPPORTED_FILE_TYPES: Record<DocumentFileType, {
  name: string
  mimeTypes: string[]
  maxSize: number // bytes
  icon: string
}> = {
  pdf: {
    name: 'PDF Document',
    mimeTypes: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: 'file-text',
  },
  docx: {
    name: 'Word Document',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 25 * 1024 * 1024, // 25MB
    icon: 'file-text',
  },
  doc: {
    name: 'Word Document (Legacy)',
    mimeTypes: ['application/msword'],
    maxSize: 25 * 1024 * 1024,
    icon: 'file-text',
  },
  md: {
    name: 'Markdown',
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: 'file-code',
  },
  txt: {
    name: 'Plain Text',
    mimeTypes: ['text/plain'],
    maxSize: 10 * 1024 * 1024,
    icon: 'file',
  },
  html: {
    name: 'HTML Document',
    mimeTypes: ['text/html'],
    maxSize: 10 * 1024 * 1024,
    icon: 'code',
  },
  csv: {
    name: 'CSV Spreadsheet',
    mimeTypes: ['text/csv'],
    maxSize: 50 * 1024 * 1024,
    icon: 'table',
  },
  json: {
    name: 'JSON Data',
    mimeTypes: ['application/json'],
    maxSize: 10 * 1024 * 1024,
    icon: 'braces',
  },
}

/**
 * Default embedding configuration
 */
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small', // OpenAI
  dimensions: 1536,
  maxTokensPerChunk: 500,
  chunkOverlap: 50,
  minChunkSize: 100,
}

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  defaultLimit: 10,
  maxLimit: 50,
  defaultThreshold: 0.7,
  minThreshold: 0.5,
}
