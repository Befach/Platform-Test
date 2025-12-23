/**
 * Feedback Module Types
 *
 * Feedback is a separate module that attaches to any work item.
 * Can be added at any phase from any source (internal, customer, user).
 */

import { Database } from '@/lib/supabase/database.types'

// Database types
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type FeedbackInsert = Database['public']['Tables']['feedback']['Insert']
export type FeedbackUpdate = Database['public']['Tables']['feedback']['Update']

// Feedback source types
export type FeedbackSource = 'internal' | 'customer' | 'user'

// Feedback priorities
export type FeedbackPriority = 'high' | 'low'

// Feedback statuses
export type FeedbackStatus = 'pending' | 'reviewed' | 'implemented' | 'deferred' | 'rejected'

// Feedback decision types
export type FeedbackDecision = 'implement' | 'defer' | 'reject'

// Extended feedback type with relations
export interface FeedbackWithRelations extends Feedback {
  work_item?: {
    id: string
    name: string
    type: string
  }
  implemented_in?: {
    id: string
    name: string
    type: string
  }
  decision_by_user?: {
    id: string
    name: string | null
    email: string
  }
}

// Feedback form data
export interface FeedbackFormData {
  work_item_id: string
  source: FeedbackSource
  source_name: string
  source_role?: string
  source_email?: string
  priority: FeedbackPriority
  content: string
  context?: string
  received_at?: string
}

// Feedback triage data
export interface FeedbackTriageData {
  decision: FeedbackDecision
  decision_reason?: string
  status: FeedbackStatus
}

// Feedback conversion data
export interface FeedbackConversionData {
  work_item_type: 'concept' | 'feature' | 'bug'
  work_item_name: string
  work_item_purpose?: string
  workspace_id: string
  is_enhancement?: boolean
}

// Feedback filters
export interface FeedbackFilters {
  work_item_id?: string
  workspace_id?: string
  source?: FeedbackSource
  priority?: FeedbackPriority
  status?: FeedbackStatus
  search?: string
}

// Feedback stats
export interface FeedbackStats {
  total: number
  by_status: Record<FeedbackStatus, number>
  by_source: Record<FeedbackSource, number>
  by_priority: Record<FeedbackPriority, number>
  pending_count: number
  implemented_count: number
}
