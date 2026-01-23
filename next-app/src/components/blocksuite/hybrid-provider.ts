/**
 * BlockSuite Hybrid Provider
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * Hybrid Yjs Provider combining:
 * - Supabase Realtime: Fast broadcasts for real-time collaboration
 * - Supabase Storage: Scalable persistence (S3 backend)
 * - PostgreSQL: Metadata only (permissions, team_id, sync_version)
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        CLIENT                                    │
 * │  BlockSuite Editor ←→ Yjs Doc ←→ HybridProvider                 │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *            ┌──────────────────┼──────────────────┐
 *            ▼                  ▼                  ▼
 * ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
 * │ Supabase        │  │ Supabase        │  │ Supabase        │
 * │ Realtime        │  │ Storage         │  │ PostgreSQL      │
 * │ • Broadcasts    │  │ • Yjs binary    │  │ • Metadata      │
 * │ • Presence      │  │ • Snapshots     │  │ • Permissions   │
 * └─────────────────┘  └─────────────────┘  └─────────────────┘
 */

import * as Y from 'yjs'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { saveYjsState, loadYjsState } from './storage-client'
import {
  DEFAULT_DEBOUNCE_MS,
  isValidId,
  type HybridProviderOptions,
  type YjsUpdatePayload,
} from './persistence-types'
import { safeValidateYjsUpdatePayload } from './schema'

/**
 * Hybrid Yjs Provider for BlockSuite
 *
 * Handles real-time synchronization and persistent storage:
 * - Broadcasts updates immediately via Supabase Realtime
 * - Debounces saves to Supabase Storage (less frequent writes)
 * - Saves on beforeunload/visibilitychange for reliability
 */
export class HybridProvider {
  private doc: Y.Doc
  private documentId: string
  private teamId: string
  private supabase: SupabaseClient
  private channel: RealtimeChannel | null = null
  private saveTimeout: ReturnType<typeof setTimeout> | null = null
  private debounceMs: number
  private syncVersion: number = 0
  private isDirty: boolean = false
  private destroyed: boolean = false
  private isLoaded: boolean = false
  private isSaving: boolean = false // Mutex lock to prevent concurrent saves
  private onConnectionChange?: (connected: boolean) => void
  private onSyncError?: (error: Error) => void

  constructor(doc: Y.Doc, options: HybridProviderOptions) {
    // SECURITY: Validate documentId and teamId format before use
    if (!isValidId(options.documentId)) {
      throw new Error(
        `[HybridProvider] Invalid documentId format: "${options.documentId}". ` +
          'Must be alphanumeric with hyphens/underscores only.'
      )
    }
    if (!isValidId(options.teamId)) {
      throw new Error(
        `[HybridProvider] Invalid teamId format: "${options.teamId}". ` +
          'Must be alphanumeric with hyphens/underscores only.'
      )
    }

    this.doc = doc
    this.documentId = options.documentId
    this.teamId = options.teamId
    this.supabase = options.supabase
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
    this.onConnectionChange = options.onConnectionChange
    this.onSyncError = options.onSyncError

    // Listen for local changes
    this.doc.on('update', this.handleUpdate)

    // Set up real-time channel for broadcasts
    this.setupRealtimeChannel()

    // Save on window events (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  /**
   * Handle local Yjs updates
   * - Skip updates from remote (prevent loops)
   * - Broadcast immediately for real-time
   * - Debounce saves to storage
   */
  private handleUpdate = (update: Uint8Array, origin: unknown) => {
    // Skip if update came from remote (prevent loops)
    if (origin === 'remote') return

    this.isDirty = true

    // Broadcast immediately for real-time sync
    this.broadcast(update)

    // Debounce save to storage (less frequent)
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => this.save(), this.debounceMs)
  }

  /**
   * Handle beforeunload event - save any pending changes
   */
  private handleBeforeUnload = () => {
    if (this.isDirty) {
      this.saveSync() // Synchronous save attempt
    }
  }

  /**
   * Handle visibility change - save when tab becomes hidden
   */
  private handleVisibilityChange = () => {
    if (document.hidden && this.isDirty) {
      this.save() // Save when tab becomes hidden
    }
  }

  /**
   * Save Yjs state to Supabase Storage
   * Uses mutex lock to prevent concurrent save operations
   */
  async save(): Promise<void> {
    if (this.destroyed || !this.isDirty) return

    // Mutex lock: Skip if already saving to prevent concurrent writes
    if (this.isSaving) {
      console.log('[HybridProvider] Save already in progress, skipping')
      return
    }

    this.isSaving = true
    try {
      const state = Y.encodeStateAsUpdate(this.doc)

      const result = await saveYjsState(
        this.supabase,
        this.teamId,
        this.documentId,
        state
      )

      if (result.success) {
        // Update metadata in PostgreSQL
        // Note: Only increment syncVersion and clear isDirty after metadata update succeeds
        // to prevent desynchronization between local and database sync versions
        const metadataSuccess = await this.updateMetadata(
          result.size ?? state.length,
          this.syncVersion + 1
        )
        if (metadataSuccess) {
          this.syncVersion++
          this.isDirty = false
        }
      } else {
        console.error('[HybridProvider] Failed to save:', result.error)
        this.onSyncError?.(new Error(result.error ?? 'Unknown save error'))
      }
    } catch (error) {
      console.error('[HybridProvider] Save error:', error)
      this.onSyncError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.isSaving = false
    }
  }

  /**
   * Synchronous save for beforeunload (best effort)
   * Uses sendBeacon for reliable delivery during page unload
   */
  private saveSync(): void {
    if (!this.isDirty) return

    try {
      const state = Y.encodeStateAsUpdate(this.doc)

      // Use sendBeacon for reliable delivery during page unload
      // This sends to our API route which handles the storage save
      // Create a fresh ArrayBuffer copy for Blob compatibility (avoids SharedArrayBuffer type issue)
      const buffer = new ArrayBuffer(state.length)
      new Uint8Array(buffer).set(state)
      const blob = new Blob([buffer], { type: 'application/octet-stream' })

      navigator.sendBeacon(
        `/api/blocksuite/documents/${this.documentId}/state`,
        blob
      )
    } catch (error) {
      console.error('[HybridProvider] Sync save error:', error)
    }
  }

  /**
   * Update document metadata in PostgreSQL
   * Note: Explicit team_id filtering required per project conventions
   * @param sizeBytes - Size of the saved state in bytes
   * @param newSyncVersion - The new sync version to write (passed to ensure atomicity)
   * @returns true if update succeeded, false otherwise
   */
  private async updateMetadata(
    sizeBytes: number,
    newSyncVersion: number
  ): Promise<boolean> {
    try {
      // CRITICAL: Use .select() to verify rows were actually updated
      // Without .select(), Supabase returns null error even when 0 rows match
      const { data, error } = await this.supabase
        .from('blocksuite_documents')
        .update({
          storage_size_bytes: sizeBytes,
          last_sync_at: new Date().toISOString(),
          sync_version: newSyncVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.documentId)
        .eq('team_id', this.teamId)
        .select('id')

      if (error) {
        console.warn('[HybridProvider] Failed to update metadata:', error)
        return false
      }

      // Verify at least one row was updated
      if (!data || data.length === 0) {
        console.warn('[HybridProvider] Metadata update matched 0 rows - document may not exist or team access denied')
        return false
      }

      return true
    } catch (error) {
      console.warn('[HybridProvider] Metadata update error:', error)
      return false
    }
  }

  /**
   * Convert Uint8Array to base64 string safely (handles large arrays)
   * Uses chunked processing to avoid spread operator argument limits (~65K)
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    // Process in 32KB chunks to stay well under the ~65K argument limit
    const CHUNK_SIZE = 0x8000
    let binaryString = ''

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length))
      // Use apply with array to avoid spread operator limits
      binaryString += String.fromCharCode.apply(null, Array.from(chunk))
    }

    return btoa(binaryString)
  }

  /**
   * Broadcast update to other clients via Supabase Realtime
   */
  private broadcast(update: Uint8Array): void {
    if (!this.channel) return

    try {
      // Convert Uint8Array to base64 for transmission (chunked for large updates)
      const base64 = this.uint8ArrayToBase64(update)

      const payload: YjsUpdatePayload = {
        update: base64,
        documentId: this.documentId,
        origin: 'local',
      }

      this.channel.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload,
      })
    } catch (error) {
      console.warn('[HybridProvider] Broadcast error:', error)
    }
  }

  /**
   * Set up Supabase Realtime channel for broadcasts
   * SECURITY: Channel name uses validated documentId (validated in constructor)
   */
  private setupRealtimeChannel(): void {
    this.channel = this.supabase
      .channel(`blocksuite-${this.documentId}`)
      .on('broadcast', { event: 'yjs-update' }, (message) => {
        // SECURITY: Validate payload structure before processing
        const validation = safeValidateYjsUpdatePayload(message.payload)
        if (!validation.success) {
          console.warn(
            '[HybridProvider] Invalid broadcast payload received:',
            validation.error.flatten()
          )
          return
        }

        const payload = validation.data

        // Skip if not for this document
        if (payload.documentId !== this.documentId) return

        // Skip our own broadcasts
        if (payload.origin === 'local') return

        try {
          // Decode base64 to Uint8Array
          const binaryString = atob(payload.update)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Apply remote update with 'remote' origin to prevent re-broadcast
          Y.applyUpdate(this.doc, bytes, 'remote')
        } catch (error) {
          console.warn('[HybridProvider] Failed to apply remote update:', error)
        }
      })
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        this.onConnectionChange?.(connected)
      })
  }

  /**
   * Load initial state from Supabase Storage
   */
  async load(): Promise<void> {
    if (this.isLoaded) return

    try {
      const state = await loadYjsState(
        this.supabase,
        this.teamId,
        this.documentId
      )

      if (state && state.length > 0) {
        // Apply loaded state with 'remote' origin
        Y.applyUpdate(this.doc, state, 'remote')
      }

      this.isLoaded = true
    } catch (error) {
      console.error('[HybridProvider] Load error:', error)
      this.onSyncError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Force save (for manual save button)
   */
  async forceSave(): Promise<void> {
    this.isDirty = true
    await this.save()
  }

  /**
   * Check if there are unsaved changes
   */
  get hasUnsavedChanges(): boolean {
    return this.isDirty
  }

  /**
   * Get current sync version
   */
  get currentSyncVersion(): number {
    return this.syncVersion
  }

  /**
   * Check if initial load is complete
   */
  get loaded(): boolean {
    return this.isLoaded
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.destroyed = true

    // Save any pending changes
    if (this.isDirty) {
      this.saveSync()
    }

    // Clear timeout
    if (this.saveTimeout) clearTimeout(this.saveTimeout)

    // Remove realtime channel
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }

    // Remove Yjs listener
    this.doc.off('update', this.handleUpdate)

    // Remove window event listeners (browser only)
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }
}
