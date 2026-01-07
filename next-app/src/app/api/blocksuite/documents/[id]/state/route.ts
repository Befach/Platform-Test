/**
 * BlockSuite Yjs State API
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * Upload/download Yjs binary state from Supabase Storage.
 * This avoids storing binary data in PostgreSQL (TOAST issues).
 *
 * SECURITY:
 * - Rate limiting prevents DoS and storage exhaustion
 * - Document ID validation prevents path traversal
 * - Size limits prevent large uploads
 * - RLS policies enforce team_id filtering
 * - Audit logging for state uploads
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isValidId } from '@/components/blocksuite/persistence-types'

const BUCKET = 'blocksuite-yjs'

// ============================================================================
// Rate Limiting (In-memory, resets on cold start - acceptable for MVP)
// ============================================================================
//
// TODO: Replace with persistent rate limiting for production scale
// Current limitation: In-memory store resets on Vercel serverless cold starts,
// potentially allowing rate limit bypass under heavy load.
//
// Recommended solutions (in order of preference):
// 1. Upstash Redis - serverless-native, per-request pricing, ~$0.20/100K requests
// 2. Vercel KV - integrated with Vercel, similar pricing
// 3. Supabase table - no new service but adds DB load per request
//
// Trigger: Implement when daily active users > 100 or abuse detected in audit logs
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Rate limit: 60 uploads per minute per user
const RATE_LIMIT_MAX = 60
const RATE_LIMIT_WINDOW_MS = 60 * 1000

// In-memory rate limit store (per-user)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check rate limit for a user
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  // Clean up old entries periodically (every 100th call)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window or expired - reset
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    // Rate limited
    return false
  }

  // Increment count
  entry.count++
  return true
}

/**
 * Audit log helper for security-relevant operations
 */
function auditLog(event: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      event,
      ...details,
      timestamp: new Date().toISOString(),
    })
  )
}

/**
 * GET /api/blocksuite/documents/[id]/state
 * Load Yjs binary state from Supabase Storage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Validate document ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team memberships for explicit filtering
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const teamIds = memberships?.map((m) => m.team_id) ?? []
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team access' }, { status: 403 })
    }

    // Get document metadata with explicit team_id filtering
    const { data: doc, error: docError } = await supabase
      .from('blocksuite_documents')
      .select('id, team_id, storage_path')
      .eq('id', id)
      .in('team_id', teamIds)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Load from Supabase Storage
    const { data, error: storageError } = await supabase.storage
      .from(BUCKET)
      .download(doc.storage_path)

    if (storageError) {
      // File not found = new document, return empty
      if (
        storageError.message.includes('not found') ||
        storageError.message.includes('Object not found')
      ) {
        return new NextResponse(new Uint8Array(0), {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
      }
      console.error('Storage load error:', storageError)
      return NextResponse.json(
        { error: 'Failed to load state' },
        { status: 500 }
      )
    }

    if (!data) {
      // No data = new document
      return new NextResponse(new Uint8Array(0), {
        headers: { 'Content-Type': 'application/octet-stream' },
      })
    }

    // Return binary data
    const arrayBuffer = await data.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/blocksuite/documents/[id]/state:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/blocksuite/documents/[id]/state
 * Save Yjs binary state to Supabase Storage
 *
 * Also handles sendBeacon requests from beforeunload.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Validate document ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(user.id)) {
      auditLog('rate_limit_exceeded', {
        userId: user.id,
        documentId: id,
        endpoint: 'state_upload',
      })
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Get user's team memberships for explicit filtering
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const teamIds = memberships?.map((m) => m.team_id) ?? []
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team access' }, { status: 403 })
    }

    // Get document metadata with explicit team_id filtering
    const { data: doc, error: docError } = await supabase
      .from('blocksuite_documents')
      .select('id, team_id, storage_path, sync_version')
      .eq('id', id)
      .in('team_id', teamIds)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get binary body
    const arrayBuffer = await request.arrayBuffer()
    const state = new Uint8Array(arrayBuffer)

    // Validate state (must be non-empty for actual saves)
    if (state.length === 0) {
      return NextResponse.json(
        { error: 'Empty state not allowed' },
        { status: 400 }
      )
    }

    // Size limit: 10MB
    if (state.length > 10485760) {
      auditLog('state_upload_rejected', {
        userId: user.id,
        documentId: id,
        teamId: doc.team_id,
        reason: 'size_exceeded',
        size: state.length,
      })
      return NextResponse.json(
        { error: 'State too large (max 10MB)' },
        { status: 413 }
      )
    }

    // Save to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(doc.storage_path, state, {
        contentType: 'application/octet-stream',
        upsert: true, // Overwrite if exists
      })

    if (storageError) {
      console.error('Storage save error:', storageError)
      return NextResponse.json({ error: 'Failed to save state' }, { status: 500 })
    }

    // Update metadata in PostgreSQL with explicit team_id filtering
    const newSyncVersion = (doc.sync_version ?? 0) + 1
    const { error: updateError } = await supabase
      .from('blocksuite_documents')
      .update({
        storage_size_bytes: state.length,
        last_sync_at: new Date().toISOString(),
        sync_version: newSyncVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('team_id', teamIds)

    if (updateError) {
      // Rollback: Delete the uploaded state to maintain consistency
      console.error('Metadata update failed, rolling back storage upload:', updateError)
      await supabase.storage.from(BUCKET).remove([doc.storage_path])
      return NextResponse.json(
        { error: 'Failed to update document metadata' },
        { status: 500 }
      )
    }

    // SECURITY: Audit log for large uploads (>100KB)
    if (state.length > 102400) {
      auditLog('large_state_upload', {
        userId: user.id,
        documentId: id,
        teamId: doc.team_id,
        size: state.length,
        syncVersion: newSyncVersion,
      })
    }

    return NextResponse.json({
      success: true,
      size: state.length,
      sync_version: newSyncVersion,
    })
  } catch (error: unknown) {
    console.error('Error in PUT /api/blocksuite/documents/[id]/state:', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/blocksuite/documents/[id]/state
 * Alternative method for sendBeacon (which uses POST)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Delegate to PUT handler
  return PUT(request, context)
}
