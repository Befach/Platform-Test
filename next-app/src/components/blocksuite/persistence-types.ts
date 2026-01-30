/**
 * BlockSuite Persistence Types
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * TypeScript types for the hybrid storage architecture:
 * - PostgreSQL: Document metadata, permissions, team_id/RLS
 * - Supabase Storage: Yjs binary state (blocksuite-yjs bucket)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Document Types
// ============================================================================

/** Document types supported by BlockSuite */
export type BlockSuiteDocumentType = 'mindmap' | 'document' | 'canvas'

/** Document metadata stored in PostgreSQL (NOT Yjs state) */
export interface BlockSuiteDocumentMetadata {
  id: string // Date.now().toString()
  team_id: string
  workspace_id: string | null

  // Storage reference (NOT the actual Yjs state)
  storage_path: string // Format: {team_id}/{doc_id}.yjs
  storage_size_bytes: number

  // Document metadata
  document_type: BlockSuiteDocumentType
  title: string | null

  // Sync tracking
  last_sync_at: string // ISO timestamp
  sync_version: number
  active_editors: number

  // Timestamps
  created_at: string
  updated_at: string
}

/** Input for creating a new document */
export interface CreateDocumentInput {
  workspace_id?: string
  document_type?: BlockSuiteDocumentType
  title?: string
  initial_state?: Uint8Array // Optional initial Yjs state
}

/** Input for updating document metadata */
export interface UpdateDocumentInput {
  title?: string
  document_type?: BlockSuiteDocumentType
}

// ============================================================================
// Storage Types
// ============================================================================

/** Result of a storage operation */
export interface StorageResult {
  success: boolean
  size?: number
  error?: string
}

/** Storage bucket name */
export const BLOCKSUITE_STORAGE_BUCKET = 'blocksuite-yjs' as const

/** Regex for valid ID format (alphanumeric, hyphens, underscores only) */
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/

/**
 * Sanitize an ID to prevent path traversal attacks
 * Only allows alphanumeric characters, hyphens, and underscores
 */
export function sanitizeId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID: must be a non-empty string')
  }
  // Remove any characters that could be used for path traversal
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!sanitized || sanitized.length === 0) {
    throw new Error('Invalid ID: contains no valid characters')
  }
  if (sanitized !== id) {
    console.warn(`[Security] ID sanitized: "${id}" -> "${sanitized}"`)
  }
  return sanitized
}

/**
 * Validate that an ID is safe (doesn't contain path traversal characters)
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && SAFE_ID_REGEX.test(id)
}

/**
 * Generate storage path for a document
 * SECURITY: Sanitizes inputs to prevent path traversal attacks
 */
export function getStoragePath(teamId: string, docId: string): string {
  const safeTeamId = sanitizeId(teamId)
  const safeDocId = sanitizeId(docId)
  return `${safeTeamId}/${safeDocId}.yjs`
}

// ============================================================================
// Provider Types
// ============================================================================

/** Options for the HybridProvider */
export interface HybridProviderOptions {
  documentId: string
  teamId: string
  supabase: SupabaseClient
  /** Debounce time for storage saves (default: 2000ms) */
  debounceMs?: number
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void
  /** Called when sync error occurs */
  onSyncError?: (error: Error) => void
}

/** State of the HybridProvider */
export interface HybridProviderState {
  isLoading: boolean
  isConnected: boolean
  hasUnsavedChanges: boolean
  syncVersion: number
  lastSyncAt: Date | null
  error: Error | null
}

// ============================================================================
// Hook Types
// ============================================================================

/** Options for the useBlockSuiteSync hook */
export interface UseBlockSuiteSyncOptions {
  documentId: string
  teamId: string
  /** Whether sync is enabled (default: true) */
  enabled?: boolean
  /** Debounce time for storage saves (default: 2000ms) */
  debounceMs?: number
}

/** Return value of the useBlockSuiteSync hook */
export interface UseBlockSuiteSyncReturn {
  isLoading: boolean
  isConnected: boolean
  hasUnsavedChanges: boolean
  /** Force save current state */
  save: () => Promise<void>
  /** Current sync error, if any */
  error: Error | null
}

// ============================================================================
// Realtime Types
// ============================================================================

/** Payload for Yjs update broadcast */
export interface YjsUpdatePayload {
  update: string // Base64 encoded Uint8Array
  documentId: string
  /** Origin of the update (for filtering) */
  origin?: string
}

/** Realtime channel event types */
export type RealtimeEventType = 'yjs-update' | 'presence-update' | 'cursor-update'

// ============================================================================
// API Types
// ============================================================================

/** Response from document creation API */
export interface CreateDocumentResponse {
  document: BlockSuiteDocumentMetadata
}

/** Response from document list API */
export interface ListDocumentsResponse {
  documents: BlockSuiteDocumentMetadata[]
  total: number
}

/** Error response from API */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

// ============================================================================
// Constants
// ============================================================================

/** Default debounce time for storage saves (ms) */
export const DEFAULT_DEBOUNCE_MS = 2000

/** Size threshold for monitoring large documents (bytes) */
export const LARGE_DOCUMENT_THRESHOLD = 102400 // 100KB

/** Maximum document size allowed (bytes) */
export const MAX_DOCUMENT_SIZE = 10485760 // 10MB
