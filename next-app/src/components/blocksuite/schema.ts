import { z } from 'zod'

/**
 * Zod Schemas for BlockSuite Component Validation
 *
 * These schemas provide runtime validation for component props,
 * ensuring type safety and preventing invalid data from being processed.
 */

/**
 * Editor mode schema
 */
export const EditorModeSchema = z.enum(['page', 'edgeless'])

/**
 * BlockSuiteEditor props schema
 * Validates all incoming props at runtime
 */
export const BlockSuiteEditorPropsSchema = z.object({
  /** Editor mode: 'page' for document editing, 'edgeless' for canvas/whiteboard */
  mode: EditorModeSchema.optional().default('edgeless'),

  /** Additional CSS classes */
  className: z.string().optional(),

  /** Callback when editor is ready - any function is valid */
  onReady: z.unknown().optional(),

  /** Callback when document content changes - any function is valid */
  onChange: z.unknown().optional(),

  /**
   * Document ID for persistence
   * Must be alphanumeric with hyphens/underscores, no special characters
   */
  documentId: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        // Allow alphanumeric, hyphens, underscores, max 100 chars
        const idRegex = /^[a-zA-Z0-9_-]{1,100}$/
        return idRegex.test(val)
      },
      { message: 'documentId must be alphanumeric with hyphens/underscores only (max 100 chars)' }
    ),

  /** Whether the editor is read-only */
  readOnly: z.boolean().optional().default(false),
})

/**
 * Inferred type from the schema
 */
export type ValidatedBlockSuiteEditorProps = z.infer<typeof BlockSuiteEditorPropsSchema>

/**
 * Mind map tree node schema for validation
 */
export interface MindMapTreeNodeType {
  text: string
  children?: MindMapTreeNodeType[]
  data?: Record<string, unknown>
}

export const MindMapTreeNodeSchema: z.ZodType<MindMapTreeNodeType> = z.lazy(() =>
  z.object({
    text: z.string().min(1, 'Node text is required'),
    children: z.array(MindMapTreeNodeSchema).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
)

/**
 * Mind map layout type schema
 */
export const MindMapLayoutTypeSchema = z.enum(['left', 'right', 'balance'])

/**
 * Mind map style schema
 */
export const MindMapStyleSchema = z.enum(['default', 'style1', 'style2', 'style3', 'style4'])

/**
 * MindMapEditor props schema
 */
export const MindMapEditorPropsSchema = z.object({
  initialTree: MindMapTreeNodeSchema.optional(),
  layout: MindMapLayoutTypeSchema.optional().default('balance'),
  style: MindMapStyleSchema.optional().default('default'),
  onTreeChange: z.unknown().optional(),
  onNodeSelect: z.unknown().optional(),
  readOnly: z.boolean().optional().default(false),
})

/**
 * Document metadata schema for storage validation
 */
export const DocumentMetadataSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.enum(['mindmap', 'document', 'canvas']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  custom: z.record(z.string(), z.unknown()).optional(),
})

/**
 * BlockSuite document schema for database storage
 */
export const BlockSuiteDocumentSchema = z.object({
  id: z.string().min(1).max(100),
  team_id: z.string().min(1).max(100),
  workspace_id: z.string().max(100).nullable(),
  yjs_snapshot: z.string().min(1),
  document_type: z.enum(['mindmap', 'document', 'canvas']),
  metadata: DocumentMetadataSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * Validate props and return parsed result or throw error
 */
export function validateEditorProps(props: unknown): ValidatedBlockSuiteEditorProps {
  return BlockSuiteEditorPropsSchema.parse(props)
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidateEditorProps(props: unknown) {
  return BlockSuiteEditorPropsSchema.safeParse(props)
}

// ============================================================
// BlockSuite MindMap Canvas Schemas (v0.18.7)
// ============================================================

/**
 * BlockSuite MindmapStyle enum schema
 * Maps to @blocksuite/affine-model MindmapStyle: ONE=1, TWO=2, THREE=3, FOUR=4
 */
export const BlockSuiteMindmapStyleSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
])

/**
 * BlockSuite LayoutType enum schema
 * Maps to @blocksuite/affine-model LayoutType: RIGHT=0, LEFT=1, BALANCE=2
 */
export const BlockSuiteLayoutTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
])

/**
 * BlockSuite mindmap node schema (recursive tree structure)
 */
export interface BlockSuiteMindmapNodeType {
  text: string
  children?: BlockSuiteMindmapNodeType[]
  xywh?: string
  layoutType?: 'left' | 'right'
}

export const BlockSuiteMindmapNodeSchema: z.ZodType<BlockSuiteMindmapNodeType> = z.lazy(() =>
  z.object({
    text: z.string().min(1, 'Node text is required').max(1000, 'Node text too long'),
    children: z.array(BlockSuiteMindmapNodeSchema).optional(),
    xywh: z.string().regex(/^-?\d+,-?\d+,\d+,\d+$/, 'Invalid xywh format').optional(),
    layoutType: z.enum(['left', 'right']).optional(),
  })
)

/**
 * MindMapCanvas component props schema
 * Validates all incoming props at runtime for security
 */
export const MindMapCanvasPropsSchema = z.object({
  /** Document ID for persistence */
  documentId: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        // Allow alphanumeric, hyphens, underscores, max 100 chars
        const idRegex = /^[a-zA-Z0-9_-]{1,100}$/
        return idRegex.test(val)
      },
      { message: 'documentId must be alphanumeric with hyphens/underscores only (max 100 chars)' }
    ),

  /** Initial tree structure to render */
  initialTree: BlockSuiteMindmapNodeSchema.optional(),

  /** Visual style preset (1-4) */
  style: BlockSuiteMindmapStyleSchema.optional().default(4),

  /** Layout direction (0=RIGHT, 1=LEFT, 2=BALANCE) */
  layout: BlockSuiteLayoutTypeSchema.optional().default(2),

  /** Callback when tree structure changes */
  onTreeChange: z.unknown().optional(),

  /** Callback when a node is selected */
  onNodeSelect: z.unknown().optional(),

  /** Whether the canvas is read-only */
  readOnly: z.boolean().optional().default(false),

  /** Additional CSS classes */
  className: z.string().optional(),
})

/**
 * Inferred type from MindMapCanvasPropsSchema
 */
export type ValidatedMindMapCanvasProps = z.infer<typeof MindMapCanvasPropsSchema>

/**
 * Validate MindMapCanvas props and return parsed result or throw error
 */
export function validateMindMapCanvasProps(props: unknown): ValidatedMindMapCanvasProps {
  return MindMapCanvasPropsSchema.parse(props)
}

/**
 * Safe validation for MindMapCanvas props that returns result object instead of throwing
 */
export function safeValidateMindMapCanvasProps(props: unknown) {
  return MindMapCanvasPropsSchema.safeParse(props)
}

// ============================================================
// Migration Schemas (Phase 3: Data Migration)
// ============================================================

/**
 * Migration status schema
 */
export const MigrationStatusSchema = z.enum([
  'pending',
  'in_progress',
  'success',
  'warning',
  'failed',
  'skipped',
])

/**
 * Lost edge reason schema
 */
export const LostEdgeReasonSchema = z.enum([
  'multiple_parents',
  'circular_reference',
  'orphaned_node',
])

/**
 * Lost edge schema for tracking edges lost during DAG→Tree conversion
 */
export const LostEdgeSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  sourceTitle: z.string().optional(),
  targetTitle: z.string().optional(),
  reason: LostEdgeReasonSchema,
})

/**
 * Migration options schema for API validation
 * Safety: dryRun defaults to true to prevent accidental writes
 */
export const MigrationOptionsSchema = z.object({
  dryRun: z.boolean().default(true),
  batchSize: z.number().int().min(1).max(50).default(10),
  maxWarningsPerMap: z.number().int().min(1).max(100).default(50),
  skipLargeMaps: z.boolean().optional().default(false),
  maxSizeBytes: z.number().int().positive().optional().default(100 * 1024), // 100KB
})

/**
 * Single mind map migration request schema
 */
export const MigrateSingleRequestSchema = z.object({
  dryRun: z.boolean().default(true),
  skipLargeMaps: z.boolean().optional().default(false), // Default false for single map (process by default)
  maxSizeBytes: z.number().int().positive().optional().default(100 * 1024), // 100KB default
  force: z.boolean().optional().default(false), // Force re-migration of already migrated maps
})

/**
 * Workspace batch migration request schema
 */
export const MigrateWorkspaceRequestSchema = z.object({
  dryRun: z.boolean().default(true),
  batchSize: z.number().int().min(1).max(50).default(10),
  skipLargeMaps: z.boolean().optional().default(true), // Default true for batch safety
  maxSizeBytes: z.number().int().positive().optional().default(100 * 1024), // 100KB default
  limit: z.number().int().min(1).max(100).optional(), // Max maps to process in one request
  force: z.boolean().optional().default(false), // Force re-migration of already migrated maps
})

/**
 * Migration result schema for validation
 */
export const MigrationResultSchema = z.object({
  mindMapId: z.string().min(1),
  workspaceId: z.string(),
  status: MigrationStatusSchema,
  nodeCount: z.number().int().min(0),
  edgeCount: z.number().int().min(0),
  treeNodeCount: z.number().int().min(0),
  lostEdgeCount: z.number().int().min(0),
  warnings: z.array(z.string()),
  error: z.string().optional(),
  durationMs: z.number().min(0),
  sizeBytes: z.number().int().min(0).optional(),
})

/**
 * Inferred types from schemas
 */
export type ValidatedMigrationOptions = z.infer<typeof MigrationOptionsSchema>
export type ValidatedMigrateSingleRequest = z.infer<typeof MigrateSingleRequestSchema>
export type ValidatedMigrateWorkspaceRequest = z.infer<typeof MigrateWorkspaceRequestSchema>

/**
 * Validate migration options and throw on error
 */
export function validateMigrationOptions(options: unknown): ValidatedMigrationOptions {
  return MigrationOptionsSchema.parse(options)
}

/**
 * Safe validation for migration options that returns result object instead of throwing
 */
export function safeValidateMigrationOptions(options: unknown) {
  return MigrationOptionsSchema.safeParse(options)
}

/**
 * Validate single migration request and throw on error
 */
export function validateMigrateSingleRequest(request: unknown): ValidatedMigrateSingleRequest {
  return MigrateSingleRequestSchema.parse(request)
}

/**
 * Safe validation for single migration request
 */
export function safeValidateMigrateSingleRequest(request: unknown) {
  return MigrateSingleRequestSchema.safeParse(request)
}

/**
 * Validate workspace migration request and throw on error
 */
export function validateMigrateWorkspaceRequest(request: unknown): ValidatedMigrateWorkspaceRequest {
  return MigrateWorkspaceRequestSchema.parse(request)
}

/**
 * Safe validation for workspace migration request
 */
export function safeValidateMigrateWorkspaceRequest(request: unknown) {
  return MigrateWorkspaceRequestSchema.safeParse(request)
}

// ============================================================
// Persistence Schemas (Phase 4: Supabase Persistence)
// ============================================================

/**
 * Document type schema for BlockSuite documents
 */
export const BlockSuiteDocumentTypeSchema = z.enum(['mindmap', 'document', 'canvas'])

/**
 * BlockSuite document creation request schema
 */
export const BlockSuiteDocumentCreateSchema = z.object({
  /** Optional mind map ID to link to */
  mindMapId: z.string().max(100).optional(),
  /** Optional workspace ID */
  workspaceId: z.string().max(100).optional(),
  /** Document type (default: mindmap) */
  documentType: BlockSuiteDocumentTypeSchema.default('mindmap'),
  /** Optional title */
  title: z.string().max(255).optional(),
  /** Optional initial Yjs state as base64 */
  initialState: z.string().optional(),
})

/**
 * BlockSuite document update request schema
 */
export const BlockSuiteDocumentUpdateSchema = z.object({
  /** Optional title update */
  title: z.string().max(255).optional(),
  /** Optional document type update */
  documentType: BlockSuiteDocumentTypeSchema.optional(),
})

/**
 * BlockSuite Yjs state save schema (for metadata update)
 * Note: The actual binary state is sent as request body
 */
export const BlockSuiteStateSaveSchema = z.object({
  /** Sync version for optimistic concurrency */
  syncVersion: z.number().int().positive().optional(),
})

/**
 * Inferred types from schemas
 */
export type ValidatedDocumentCreate = z.infer<typeof BlockSuiteDocumentCreateSchema>
export type ValidatedDocumentUpdate = z.infer<typeof BlockSuiteDocumentUpdateSchema>
export type ValidatedStateSave = z.infer<typeof BlockSuiteStateSaveSchema>

/**
 * Validate document creation request and throw on error
 */
export function validateDocumentCreate(data: unknown): ValidatedDocumentCreate {
  return BlockSuiteDocumentCreateSchema.parse(data)
}

/**
 * Safe validation for document creation that returns result object
 */
export function safeValidateDocumentCreate(data: unknown) {
  return BlockSuiteDocumentCreateSchema.safeParse(data)
}

/**
 * Validate document update request and throw on error
 */
export function validateDocumentUpdate(data: unknown): ValidatedDocumentUpdate {
  return BlockSuiteDocumentUpdateSchema.parse(data)
}

/**
 * Safe validation for document update that returns result object
 */
export function safeValidateDocumentUpdate(data: unknown) {
  return BlockSuiteDocumentUpdateSchema.safeParse(data)
}

/**
 * Validate state save request and throw on error
 */
export function validateStateSave(data: unknown): ValidatedStateSave {
  return BlockSuiteStateSaveSchema.parse(data)
}

/**
 * Safe validation for state save that returns result object
 */
export function safeValidateStateSave(data: unknown) {
  return BlockSuiteStateSaveSchema.safeParse(data)
}

// ============================================================
// Realtime Payload Schemas (Phase 4: Security)
// ============================================================

/**
 * Yjs update payload schema for Supabase Realtime broadcasts
 * SECURITY: Validates all fields before applying remote updates
 */
export const YjsUpdatePayloadSchema = z.object({
  /** Base64-encoded Yjs update binary */
  // Note: Binary 10MB (10,485,760 bytes) becomes ~14MB when base64 encoded (4/3 ratio)
  update: z.string().min(1).max(13981014), // Max 10MB binary → ~14MB base64
  /** Document ID this update belongs to (supports timestamp IDs like Date.now().toString()) */
  documentId: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'documentId must contain only alphanumeric characters, hyphens, or underscores'),
  /** Origin of the update (for filtering own broadcasts) */
  origin: z.string().max(50).optional(),
})

/**
 * Inferred type from schema
 */
export type ValidatedYjsUpdatePayload = z.infer<typeof YjsUpdatePayloadSchema>

/**
 * Validate Yjs update payload and throw on error
 */
export function validateYjsUpdatePayload(data: unknown): ValidatedYjsUpdatePayload {
  return YjsUpdatePayloadSchema.parse(data)
}

/**
 * Safe validation for Yjs update payload that returns result object
 */
export function safeValidateYjsUpdatePayload(data: unknown) {
  return YjsUpdatePayloadSchema.safeParse(data)
}

// ============================================================
// RAG Layer Schemas (Phase 5: Embedding Integration)
// ============================================================

/**
 * Embedding status schema for mind maps
 */
export const EmbeddingStatusSchema = z.enum([
  'pending',
  'processing',
  'ready',
  'error',
  'skipped',
])

/**
 * Node type schema for extracted nodes
 */
export const ExtractedNodeTypeSchema = z.enum(['root', 'branch', 'leaf'])

/**
 * Extraction options schema for API validation
 */
export const ExtractionOptionsSchema = z.object({
  maxDepth: z.number().int().min(0).optional(),
  includeEmpty: z.boolean().optional().default(false),
})

/**
 * Chunk options schema for API validation
 */
export const ChunkOptionsSchema = z.object({
  maxTokensPerChunk: z.number().int().min(50).max(1000).optional().default(300),
  minChunkSize: z.number().int().min(10).max(200).optional().default(50),
  includePathContext: z.boolean().optional().default(true),
  maxPathDepth: z.number().int().min(1).max(10).optional().default(3),
})

/**
 * Mind map embedding request schema
 */
export const EmbedMindMapRequestSchema = z.object({
  force: z.boolean().optional().default(false),
})

/**
 * Mind map chunk metadata schema
 */
export const MindMapChunkMetadataSchema = z.object({
  mindMapId: z.string().min(1),
  workspaceId: z.string().optional(),
  teamId: z.string().min(1), // Required for multi-tenant safety
  path: z.array(z.string()),
  nodeType: ExtractedNodeTypeSchema,
  depth: z.number().int().min(0),
  source: z.literal('blocksuite_mindmap'),
})

/**
 * Inferred types from schemas
 */
export type ValidatedExtractionOptions = z.infer<typeof ExtractionOptionsSchema>
export type ValidatedChunkOptions = z.infer<typeof ChunkOptionsSchema>
export type ValidatedEmbedMindMapRequest = z.infer<typeof EmbedMindMapRequestSchema>
export type ValidatedMindMapChunkMetadata = z.infer<typeof MindMapChunkMetadataSchema>

/**
 * Validate extraction options and throw on error
 */
export function validateExtractionOptions(options: unknown): ValidatedExtractionOptions {
  return ExtractionOptionsSchema.parse(options)
}

/**
 * Safe validation for extraction options
 */
export function safeValidateExtractionOptions(options: unknown) {
  return ExtractionOptionsSchema.safeParse(options)
}

/**
 * Validate chunk options and throw on error
 */
export function validateChunkOptions(options: unknown): ValidatedChunkOptions {
  return ChunkOptionsSchema.parse(options)
}

/**
 * Safe validation for chunk options
 */
export function safeValidateChunkOptions(options: unknown) {
  return ChunkOptionsSchema.safeParse(options)
}

/**
 * Validate embed mind map request and throw on error
 */
export function validateEmbedMindMapRequest(request: unknown): ValidatedEmbedMindMapRequest {
  return EmbedMindMapRequestSchema.parse(request)
}

/**
 * Safe validation for embed mind map request
 */
export function safeValidateEmbedMindMapRequest(request: unknown) {
  return EmbedMindMapRequestSchema.safeParse(request)
}
