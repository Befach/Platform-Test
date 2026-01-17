'use client'

import dynamic from 'next/dynamic'
import { LoadingSkeleton } from './loading-skeleton'
import type { BlockSuiteEditorProps } from './blocksuite-editor'

/**
 * SSR-Safe BlockSuite Editor Export
 *
 * BlockSuite uses browser APIs (Web Components, DOM, etc.) that aren't
 * available during server-side rendering. This wrapper uses Next.js
 * dynamic imports with ssr: false to ensure the editor only loads
 * on the client.
 *
 * @example
 * ```tsx
 * import { BlockSuiteEditor } from '@/components/blocksuite'
 *
 * function MyCanvas() {
 *   return (
 *     <BlockSuiteEditor
 *       mode="edgeless"
 *       onReady={(doc) => console.log('Editor ready')}
 *     />
 *   )
 * }
 * ```
 */
export const BlockSuiteEditor = dynamic<BlockSuiteEditorProps>(
  () => import('./blocksuite-editor').then((mod) => mod.BlockSuiteEditor),
  {
    ssr: false,
    // Default to edgeless mode for loading skeleton since we can't access props here
    // Use specific BlockSuitePageEditor or BlockSuiteCanvasEditor for mode-matched loading
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

/**
 * SSR-Safe Page Editor (Document mode)
 * Pre-configured for document editing with page mode
 */
export const BlockSuitePageEditor = dynamic<Omit<BlockSuiteEditorProps, 'mode'>>(
  () => import('./blocksuite-editor').then((mod) => {
    // Return a component that forces page mode
    const PageEditor = (props: Omit<BlockSuiteEditorProps, 'mode'>) => (
      <mod.BlockSuiteEditor {...props} mode="page" />
    )
    PageEditor.displayName = 'BlockSuitePageEditor'
    return { default: PageEditor }
  }),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="page" />,
  }
)

/**
 * SSR-Safe Canvas Editor (Edgeless mode)
 * Pre-configured for canvas/whiteboard editing
 */
export const BlockSuiteCanvasEditor = dynamic<Omit<BlockSuiteEditorProps, 'mode'>>(
  () => import('./blocksuite-editor').then((mod) => {
    // Return a component that forces edgeless mode
    const CanvasEditor = (props: Omit<BlockSuiteEditorProps, 'mode'>) => (
      <mod.BlockSuiteEditor {...props} mode="edgeless" />
    )
    CanvasEditor.displayName = 'BlockSuiteCanvasEditor'
    return { default: CanvasEditor }
  }),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

/**
 * SSR-Safe MindMap Canvas
 * Specialized for mind mapping with BlockSuite native support
 *
 * @example
 * ```tsx
 * import { MindMapCanvas } from '@/components/blocksuite'
 *
 * function MyMindMap() {
 *   return (
 *     <MindMapCanvas
 *       initialTree={{
 *         text: 'Central Idea',
 *         children: [{ text: 'Branch 1' }]
 *       }}
 *       style={4}  // MindmapStyle.FOUR
 *       layout={2} // LayoutType.BALANCE
 *     />
 *   )
 * }
 * ```
 */
export const MindMapCanvas = dynamic(
  () => import('./mind-map-canvas').then((mod) => mod.MindMapCanvas),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

// Re-export types
export type { BlockSuiteEditorProps } from './blocksuite-editor'
export type { MindMapCanvasProps } from './mindmap-types'
export { LoadingSkeleton } from './loading-skeleton'

// Re-export toolbar component
export { MindmapToolbar } from './mindmap-toolbar'
export type { MindmapToolbarProps } from './mindmap-toolbar'

// Re-export validation schemas
export {
  BlockSuiteEditorPropsSchema,
  MindMapTreeNodeSchema,
  MindMapLayoutTypeSchema,
  MindMapStyleSchema,
  MindMapEditorPropsSchema,
  DocumentMetadataSchema,
  BlockSuiteDocumentSchema,
  validateEditorProps,
  safeValidateEditorProps,
  // MindMapCanvas validation schemas
  BlockSuiteMindmapStyleSchema,
  BlockSuiteLayoutTypeSchema,
  BlockSuiteMindmapNodeSchema,
  MindMapCanvasPropsSchema,
  validateMindMapCanvasProps,
  safeValidateMindMapCanvasProps,
} from './schema'
export type { ValidatedBlockSuiteEditorProps, ValidatedMindMapCanvasProps } from './schema'

// Re-export BlockSuite types for convenience
export type {
  MindMapTreeNode,
  MindMapLayoutType,
  MindMapStyle,
  EditorMode,
  BlockType,
  YjsSnapshot,
  DocumentMetadata,
  BlockSuiteDocument,
  MindMapEditorProps,
  NodeSelectionEvent,
  CanvasViewport,
} from './types'

// Re-export mindmap-specific types and utilities
export {
  BlockSuiteMindmapStyle,
  BlockSuiteLayoutType,
  DEFAULT_SAMPLE_TREE,
} from './mindmap-types'
export type {
  BlockSuiteMindmapNode,
  BlockSuiteMindmapNodeWithMeta,
  ConversionResult,
  MindmapElementRef,
  SurfaceBlockModelRef,
} from './mindmap-types'

// Re-export conversion utilities
export {
  reactFlowToBlockSuiteTree,
  blockSuiteTreeToReactFlow,
  semanticNodeToMindmapNode,
  textToMindmapTree,
  getTreeDepth,
  countTreeNodes,
} from './mindmap-utils'

// ============================================================
// Migration Utilities (Phase 3: Data Migration)
// ============================================================

// Re-export migration types
export type {
  MigrationStatus,
  LostEdge,
  MigrationOptions,
  MigrationResult,
  BatchMigrationResult,
  MindMapMigrationData,
} from './mindmap-types'

// Re-export migration utilities
export {
  DEFAULT_MIGRATION_OPTIONS,
  TOAST_THRESHOLD_BYTES,
  estimateJSONBSize,
  formatBytes,
  checkSizeThreshold,
  extractLostEdges,
  validateMindMapForMigration,
  migrateToBlockSuite,
  getBlockSuiteTree,
  summarizeMigration,
  createBatchResult,
} from './migration-utils'

// Re-export migration schemas
export {
  MigrationStatusSchema,
  LostEdgeReasonSchema,
  LostEdgeSchema,
  MigrationOptionsSchema,
  MigrateSingleRequestSchema,
  MigrateWorkspaceRequestSchema,
  MigrationResultSchema,
  validateMigrationOptions,
  safeValidateMigrationOptions,
  validateMigrateSingleRequest,
  safeValidateMigrateSingleRequest,
  validateMigrateWorkspaceRequest,
  safeValidateMigrateWorkspaceRequest,
} from './schema'
export type {
  ValidatedMigrationOptions,
  ValidatedMigrateSingleRequest,
  ValidatedMigrateWorkspaceRequest,
} from './schema'

// ============================================================
// Persistence Utilities (Phase 4: Supabase Persistence)
// ============================================================

// Re-export persistence types
export type {
  BlockSuiteDocumentType,
  BlockSuiteDocumentMetadata,
  CreateDocumentInput,
  UpdateDocumentInput,
  StorageResult,
  HybridProviderOptions,
  HybridProviderState,
  UseBlockSuiteSyncOptions,
  UseBlockSuiteSyncReturn,
  YjsUpdatePayload,
  RealtimeEventType,
  CreateDocumentResponse,
  ListDocumentsResponse,
  ApiErrorResponse,
} from './persistence-types'

// Re-export persistence constants and security utilities
export {
  BLOCKSUITE_STORAGE_BUCKET,
  getStoragePath,
  sanitizeId,
  isValidId,
  DEFAULT_DEBOUNCE_MS,
  LARGE_DOCUMENT_THRESHOLD,
  MAX_DOCUMENT_SIZE,
} from './persistence-types'

// Re-export storage client functions
export {
  saveYjsState,
  loadYjsState,
  deleteYjsState,
  existsYjsState,
  getYjsStateSize,
  listTeamDocuments,
} from './storage-client'

// Re-export hybrid provider
export { HybridProvider } from './hybrid-provider'

// Re-export sync hooks
export { useBlockSuiteSync, useBlockSuiteDocument } from './use-blocksuite-sync'

// Re-export persistence schemas
export {
  BlockSuiteDocumentTypeSchema,
  BlockSuiteDocumentCreateSchema,
  BlockSuiteDocumentUpdateSchema,
  BlockSuiteStateSaveSchema,
  validateDocumentCreate,
  safeValidateDocumentCreate,
  validateDocumentUpdate,
  safeValidateDocumentUpdate,
  validateStateSave,
  safeValidateStateSave,
  // Realtime payload validation (Phase 4 Security)
  YjsUpdatePayloadSchema,
  validateYjsUpdatePayload,
  safeValidateYjsUpdatePayload,
  // RAG Layer schemas (Phase 5)
  EmbeddingStatusSchema,
  ExtractedNodeTypeSchema,
  ExtractionOptionsSchema,
  ChunkOptionsSchema,
  EmbedMindMapRequestSchema,
  MindMapChunkMetadataSchema,
  validateExtractionOptions,
  safeValidateExtractionOptions,
  validateChunkOptions,
  safeValidateChunkOptions,
  validateEmbedMindMapRequest,
  safeValidateEmbedMindMapRequest,
} from './schema'
export type {
  ValidatedDocumentCreate,
  ValidatedDocumentUpdate,
  ValidatedStateSave,
  ValidatedYjsUpdatePayload,
  ValidatedExtractionOptions,
  ValidatedChunkOptions,
  ValidatedEmbedMindMapRequest,
  ValidatedMindMapChunkMetadata,
} from './schema'

// ============================================================
// RAG Layer Utilities (Phase 5: Embedding Integration)
// ============================================================

// Re-export RAG types
export type {
  MindMapEmbeddingStatusType,
  MindMapEmbeddingStatus,
  ExtractedTextNode,
  ExtractionResult,
  ExtractionOptions,
  MindMapChunkForEmbedding,
  MindMapChunkMetadata,
  ChunkOptions,
  EmbedMindMapRequest,
  EmbedMindMapResponse,
  MindMapWithEmbeddingStatus,
  MindMapSearchResult,
  MindMapEmbedJobType,
  MindMapEmbedJobStatus,
  TreeWalkCallback,
  TreeHashResult,
} from './rag-types'

// Re-export text extraction utilities
export {
  extractTextFromBlockSuiteTree,
  walkBlockSuiteTree,
  getSubtreeText,
  computeTreeHash,
  getTreeStats,
  estimateTokens,
  estimateExtractionTokens,
} from './text-extractor'

// Re-export chunking utilities
export {
  chunkMindmapForEmbedding,
  batchChunkMindmaps,
  getChunkStats,
  validateChunks,
  DEFAULT_CHUNK_OPTIONS,
} from './mindmap-chunker'
export type { ChunkContext } from './mindmap-chunker'
