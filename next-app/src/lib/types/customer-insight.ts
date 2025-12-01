/**
 * Customer Insights Types
 * Voice-of-customer insights synthesized from feedback, interviews, and other sources
 */

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

export const INSIGHT_SOURCES = [
  'feedback',
  'support',
  'interview',
  'survey',
  'social',
  'analytics',
  'other',
] as const;

export const INSIGHT_SENTIMENTS = [
  'positive',
  'neutral',
  'negative',
  'mixed',
] as const;

export const INSIGHT_STATUSES = [
  'new',
  'reviewed',
  'actionable',
  'addressed',
  'archived',
] as const;

export const VOTE_TYPES = ['upvote', 'downvote'] as const;

export type InsightSource = (typeof INSIGHT_SOURCES)[number];
export type InsightSentiment = (typeof INSIGHT_SENTIMENTS)[number];
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];
export type VoteType = (typeof VOTE_TYPES)[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Core Customer Insight entity
 */
export interface CustomerInsight {
  id: string;
  team_id: string;
  workspace_id: string | null;

  // Core content
  title: string;
  quote: string | null;
  pain_point: string | null;
  context: string | null;

  // Source classification
  source: InsightSource;
  source_url: string | null;
  source_date: string | null;

  // Customer info
  customer_name: string | null;
  customer_email: string | null;
  customer_segment: string | null;
  customer_company: string | null;

  // Classification
  sentiment: InsightSentiment;

  // Prioritization
  impact_score: number;
  frequency: number;
  tags: string[];

  // Workflow
  status: InsightStatus;

  // Feedback integration
  source_feedback_id: string | null;

  // AI fields
  ai_extracted: boolean;
  ai_confidence: number | null;
  ai_summary: string | null;

  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insight with computed fields and relations
 */
export interface CustomerInsightWithMeta extends CustomerInsight {
  vote_count?: number;
  upvote_count?: number;
  downvote_count?: number;
  linked_work_items_count?: number;
  created_by_user?: {
    id: string;
    name: string | null;
    email: string;
  };
  source_feedback?: {
    id: string;
    content: string;
    source_name: string;
  };
}

// ============================================================================
// JUNCTION TABLE INTERFACES
// ============================================================================

/**
 * Work Item to Insight link
 */
export interface WorkItemInsight {
  id: string;
  work_item_id: string;
  insight_id: string;
  team_id: string;
  relevance_score: number;
  notes: string | null;
  linked_by: string | null;
  linked_at: string;
}

/**
 * Work Item Insight with expanded relations
 */
export interface WorkItemInsightWithMeta extends WorkItemInsight {
  insight?: CustomerInsight;
  work_item?: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  linked_by_user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Insight vote record
 */
export interface InsightVote {
  id: string;
  insight_id: string;
  team_id: string;
  voter_id: string | null;
  voter_email: string;
  vote_type: VoteType;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create insight request
 */
export interface CreateInsightRequest {
  team_id: string;
  workspace_id?: string;
  title: string;
  quote?: string;
  pain_point?: string;
  context?: string;
  source: InsightSource;
  source_url?: string;
  source_date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_segment?: string;
  customer_company?: string;
  sentiment?: InsightSentiment;
  impact_score?: number;
  frequency?: number;
  tags?: string[];
  source_feedback_id?: string;
}

/**
 * Update insight request
 */
export interface UpdateInsightRequest {
  title?: string;
  quote?: string;
  pain_point?: string;
  context?: string;
  source?: InsightSource;
  source_url?: string;
  source_date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_segment?: string;
  customer_company?: string;
  sentiment?: InsightSentiment;
  impact_score?: number;
  frequency?: number;
  tags?: string[];
  status?: InsightStatus;
}

/**
 * Link insight to work item request
 */
export interface LinkInsightRequest {
  work_item_id: string;
  relevance_score?: number;
  notes?: string;
}

/**
 * Vote on insight request
 */
export interface VoteInsightRequest {
  vote_type: VoteType;
  voter_email?: string; // For external voters
}

/**
 * Insight filters for list queries
 */
export interface InsightFilters {
  workspace_id?: string;
  source?: InsightSource;
  sentiment?: InsightSentiment;
  status?: InsightStatus;
  search?: string;
  tags?: string[];
  has_work_items?: boolean;
  min_impact_score?: number;
  max_impact_score?: number;
}

/**
 * Insight sort options
 */
export type InsightSortField =
  | 'impact_score'
  | 'frequency'
  | 'created_at'
  | 'updated_at'
  | 'vote_count';

export interface InsightSortOption {
  field: InsightSortField;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable label for insight source
 */
export function getSourceLabel(source: InsightSource): string {
  const labels: Record<InsightSource, string> = {
    feedback: 'Feedback',
    support: 'Support Ticket',
    interview: 'Interview',
    survey: 'Survey',
    social: 'Social Media',
    analytics: 'Analytics',
    other: 'Other',
  };
  return labels[source];
}

/**
 * Get human-readable label for insight sentiment
 */
export function getSentimentLabel(sentiment: InsightSentiment): string {
  const labels: Record<InsightSentiment, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    mixed: 'Mixed',
  };
  return labels[sentiment];
}

/**
 * Get human-readable label for insight status
 */
export function getStatusLabel(status: InsightStatus): string {
  const labels: Record<InsightStatus, string> = {
    new: 'New',
    reviewed: 'Reviewed',
    actionable: 'Actionable',
    addressed: 'Addressed',
    archived: 'Archived',
  };
  return labels[status];
}

/**
 * Get color class for sentiment badge
 */
export function getSentimentColor(sentiment: InsightSentiment): string {
  const colors: Record<InsightSentiment, string> = {
    positive: 'bg-green-100 text-green-700 border-green-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-300',
    negative: 'bg-red-100 text-red-700 border-red-300',
    mixed: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };
  return colors[sentiment];
}

/**
 * Get color class for status badge
 */
export function getStatusColor(status: InsightStatus): string {
  const colors: Record<InsightStatus, string> = {
    new: 'bg-blue-100 text-blue-700 border-blue-300',
    reviewed: 'bg-purple-100 text-purple-700 border-purple-300',
    actionable: 'bg-orange-100 text-orange-700 border-orange-300',
    addressed: 'bg-green-100 text-green-700 border-green-300',
    archived: 'bg-gray-100 text-gray-500 border-gray-300',
  };
  return colors[status];
}

/**
 * Get icon for source type
 */
export function getSourceIcon(source: InsightSource): string {
  const icons: Record<InsightSource, string> = {
    feedback: 'MessageSquare',
    support: 'HeadphonesIcon',
    interview: 'Users',
    survey: 'ClipboardList',
    social: 'Share2',
    analytics: 'BarChart3',
    other: 'FileText',
  };
  return icons[source];
}

/**
 * Calculate priority score from multiple factors
 * Returns 0-100
 */
export function calculatePriorityScore(
  impactScore: number,
  voteCount: number,
  frequency: number
): number {
  // Normalize each factor
  const normalizedImpact = impactScore / 10; // 0-1
  const normalizedVotes = Math.min(voteCount / 20, 1); // Cap at 20 votes
  const normalizedFrequency = Math.min(frequency / 10, 1); // Cap at 10

  // Weighted combination (40% impact, 30% votes, 30% frequency)
  return Math.round(
    (normalizedImpact * 0.4 + normalizedVotes * 0.3 + normalizedFrequency * 0.3) * 100
  );
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Form data for creating/editing insights
 */
export interface InsightFormData {
  title: string;
  quote: string;
  pain_point: string;
  context: string;
  source: InsightSource;
  source_url: string;
  source_date: string;
  customer_name: string;
  customer_email: string;
  customer_segment: string;
  customer_company: string;
  sentiment: InsightSentiment;
  impact_score: number;
  tags: string[];
}

/**
 * Default form values
 */
export const DEFAULT_INSIGHT_FORM: InsightFormData = {
  title: '',
  quote: '',
  pain_point: '',
  context: '',
  source: 'feedback',
  source_url: '',
  source_date: '',
  customer_name: '',
  customer_email: '',
  customer_segment: '',
  customer_company: '',
  sentiment: 'neutral',
  impact_score: 5,
  tags: [],
};

/**
 * Convert feedback to insight form data (for conversion flow)
 */
export function feedbackToInsightForm(feedback: {
  content: string;
  source_name: string;
  source_email?: string;
  source_role?: string;
  source: 'internal' | 'customer' | 'user';
}): Partial<InsightFormData> {
  return {
    quote: feedback.content,
    customer_name: feedback.source_name,
    customer_email: feedback.source_email || '',
    customer_segment: feedback.source === 'customer' ? 'customer' : feedback.source === 'user' ? 'user' : '',
    source: 'feedback',
    sentiment: 'neutral', // Can be auto-detected by AI later
  };
}
