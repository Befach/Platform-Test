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
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

/**
 * SSR-Safe Page Editor (Document mode)
 * Pre-configured for document editing with page mode
 */
export const BlockSuitePageEditor = dynamic<Omit<BlockSuiteEditorProps, 'mode'>>(
  () => import('./blocksuite-editor').then((mod) => {
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
 * SSR-Safe SimpleCanvas - Standalone BlockSuite editor with persistence
 * Use this for all canvas/whiteboard/document editing needs.
 *
 * @example
 * ```tsx
 * import { SimpleCanvas } from '@/components/blocksuite'
 *
 * function MyCanvas() {
 *   return (
 *     <SimpleCanvas
 *       documentId="1234567890"
 *       teamId="team-123"
 *       documentType="mindmap"
 *     />
 *   )
 * }
 * ```
 */
export const SimpleCanvas = dynamic(
  () => import('./simple-canvas').then((mod) => mod.SimpleCanvas),
  {
    ssr: false,
    loading: () => <LoadingSkeleton mode="edgeless" />,
  }
)

// ============================================================
// Core Types
// ============================================================

export type { BlockSuiteEditorProps } from './blocksuite-editor'
export type { SimpleCanvasProps } from './simple-canvas'
export { LoadingSkeleton } from './loading-skeleton'

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
  BlockSuiteMindmapStyleSchema,
  BlockSuiteLayoutTypeSchema,
  BlockSuiteMindmapNodeSchema,
} from './schema'
export type { ValidatedBlockSuiteEditorProps } from './schema'

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

// Re-export mindmap-specific types (kept for compatibility)
export {
  BlockSuiteMindmapStyle,
  BlockSuiteLayoutType,
  DEFAULT_SAMPLE_TREE,
} from './mindmap-types'
export type {
  BlockSuiteMindmapNode,
  BlockSuiteMindmapNodeWithMeta,
} from './mindmap-types'

// ============================================================
// Persistence Utilities
// ============================================================

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

export {
  BLOCKSUITE_STORAGE_BUCKET,
  getStoragePath,
  sanitizeId,
  isValidId,
  DEFAULT_DEBOUNCE_MS,
  LARGE_DOCUMENT_THRESHOLD,
  MAX_DOCUMENT_SIZE,
} from './persistence-types'

export {
  saveYjsState,
  loadYjsState,
  deleteYjsState,
  existsYjsState,
  getYjsStateSize,
  listTeamDocuments,
} from './storage-client'

export { HybridProvider } from './hybrid-provider'

export { useBlockSuiteSync, useBlockSuiteDocument } from './use-blocksuite-sync'

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
  YjsUpdatePayloadSchema,
  validateYjsUpdatePayload,
  safeValidateYjsUpdatePayload,
} from './schema'
export type {
  ValidatedDocumentCreate,
  ValidatedDocumentUpdate,
  ValidatedStateSave,
  ValidatedYjsUpdatePayload,
} from './schema'

// ============================================================
// RAG Layer Utilities (for AI Assistant search)
// ============================================================

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

export {
  extractTextFromBlockSuiteTree,
  walkBlockSuiteTree,
  getSubtreeText,
  computeTreeHash,
  getTreeStats,
  estimateTokens,
  estimateExtractionTokens,
} from './text-extractor'

export {
  chunkMindmapForEmbedding,
  batchChunkMindmaps,
  getChunkStats,
  validateChunks,
  DEFAULT_CHUNK_OPTIONS,
} from './mindmap-chunker'
export type { ChunkContext } from './mindmap-chunker'

export {
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
  ValidatedExtractionOptions,
  ValidatedChunkOptions,
  ValidatedEmbedMindMapRequest,
  ValidatedMindMapChunkMetadata,
} from './schema'
