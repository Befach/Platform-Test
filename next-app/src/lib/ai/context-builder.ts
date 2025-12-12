/**
 * Context Builder for AI Chat
 *
 * Builds comprehensive context for AI responses by combining:
 * 1. RAG Context - Knowledge base (L2-L4 compression)
 * 2. Platform Context - Workspace, work items, OKRs
 * 3. Image Context - Previously analyzed images
 * 4. Conversation Context - Recent messages
 *
 * All context is fetched in parallel for optimal performance.
 */

import { createClient } from '@/lib/supabase/server'
import type { CompressedContext, CompressedContextItem } from '@/lib/types/collective-intelligence'
import { formatImageContextForPrompt, ImageContext } from './image-analyzer'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Built context ready for injection into system prompt
 */
export interface BuiltContext {
  /** RAG context from knowledge base */
  ragContext: string
  /** Platform context (workspace, items, OKRs) */
  platformContext: string
  /** Image context from analyzed images */
  imageContext: string
  /** Combined context string */
  combined: string
  /** Total estimated tokens */
  totalTokens: number
  /** Whether RAG context was used */
  ragUsed: boolean
  /** RAG retrieval stats */
  ragStats?: {
    itemCount: number
    layers: { L2: number; L3: number; L4: number }
    retrievalTimeMs: number
  }
}

/**
 * Options for building context
 */
export interface ContextBuilderOptions {
  /** User's message/query */
  query: string
  /** Workspace ID for scoping */
  workspaceId?: string
  /** Team ID */
  teamId: string
  /** Max tokens for RAG context */
  maxRagTokens?: number
  /** Previously analyzed image contexts */
  imageContexts?: ImageContext[]
  /** Include platform data (workspace, work items, OKRs) */
  includePlatformContext?: boolean
  /** Similarity threshold for RAG (0-1) */
  similarityThreshold?: number
}

// =============================================================================
// RAG CONTEXT FETCHER
// =============================================================================

/**
 * Fetch RAG context from the knowledge base API
 */
async function fetchRagContext(
  query: string,
  workspaceId: string | undefined,
  maxTokens: number,
  similarityThreshold: number
): Promise<{
  context: CompressedContext | null
  durationMs: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Call the internal API (server-side)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/knowledge/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        workspaceId,
        maxTokens,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        context: null,
        durationMs: Date.now() - startTime,
        error: errorData.error || `RAG API error: ${response.status}`,
      }
    }

    const data = await response.json()

    // Filter by similarity threshold
    if (data.context?.items) {
      data.context.items = data.context.items.filter(
        (item: CompressedContextItem) => item.similarity >= similarityThreshold
      )
      data.context.totalTokens = data.context.items.reduce(
        (sum: number, item: CompressedContextItem) => sum + item.tokenCount,
        0
      )
    }

    return {
      context: data.context,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[ContextBuilder] RAG fetch error:', error)
    return {
      context: null,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Format RAG context for system prompt
 */
function formatRagContext(context: CompressedContext): string {
  if (!context.items || context.items.length === 0) return ''

  const header = '\n\n## Knowledge Base Context\nRelevant information from the knowledge base:\n'

  const sections: string[] = []

  // Group by layer
  const l2Items = context.items.filter((i) => i.layer === 'L2')
  const l3Items = context.items.filter((i) => i.layer === 'L3')
  const l4Items = context.items.filter((i) => i.layer === 'L4')

  if (l2Items.length > 0) {
    sections.push(
      '### Document Summaries\n' +
        l2Items.map((i) => `**${i.sourceName}**: ${i.content}`).join('\n\n')
    )
  }

  if (l3Items.length > 0) {
    sections.push(
      '### Topic Context\n' + l3Items.map((i) => `**${i.sourceName}**: ${i.content}`).join('\n\n')
    )
  }

  if (l4Items.length > 0) {
    sections.push(
      '### Related Concepts\n' + l4Items.map((i) => `- ${i.sourceName}: ${i.content}`).join('\n')
    )
  }

  return header + sections.join('\n\n')
}

// =============================================================================
// PLATFORM CONTEXT FETCHER
// =============================================================================

/**
 * Fetch platform context (workspace, work items, OKRs)
 */
async function fetchPlatformContext(
  workspaceId: string | undefined,
  teamId: string
): Promise<string> {
  if (!workspaceId) return ''

  try {
    const supabase = await createClient()

    // Fetch workspace details
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, description, phase, metadata')
      .eq('id', workspaceId)
      .eq('team_id', teamId)
      .single()

    if (!workspace) return ''

    // Fetch active work items (limit to recent/important)
    const { data: workItems } = await supabase
      .from('work_items')
      .select('id, title, status, priority, type')
      .eq('workspace_id', workspaceId)
      .eq('team_id', teamId)
      .in('status', ['in_progress', 'backlog', 'planned'])
      .order('priority', { ascending: false })
      .limit(10)

    // Fetch OKRs if they exist
    const { data: okrs } = await supabase
      .from('okrs')
      .select('id, title, type, progress')
      .eq('workspace_id', workspaceId)
      .eq('team_id', teamId)
      .limit(5)

    // Format platform context
    let context = `\n\n## Current Workspace: ${workspace.name}\n`

    if (workspace.description) {
      context += `${workspace.description}\n`
    }

    context += `Phase: ${workspace.phase || 'Not set'}\n`

    if (workItems && workItems.length > 0) {
      context += '\n### Active Work Items\n'
      workItems.forEach((item) => {
        context += `- [${item.type}] ${item.title} (${item.status}, ${item.priority} priority)\n`
      })
    }

    if (okrs && okrs.length > 0) {
      context += '\n### OKRs & Strategy\n'
      okrs.forEach((okr) => {
        context += `- [${okr.type}] ${okr.title} (${okr.progress}% complete)\n`
      })
    }

    return context
  } catch (error) {
    console.error('[ContextBuilder] Platform context error:', error)
    return ''
  }
}

// =============================================================================
// MAIN BUILDER
// =============================================================================

/**
 * Build comprehensive context for AI chat
 *
 * Fetches RAG, platform, and image context in parallel.
 *
 * @param options Context builder options
 * @returns Built context ready for injection
 */
export async function buildContext(options: ContextBuilderOptions): Promise<BuiltContext> {
  const {
    query,
    workspaceId,
    teamId,
    maxRagTokens = 2000,
    imageContexts = [],
    includePlatformContext = true,
    similarityThreshold = 0.6,
  } = options

  // Fetch all context sources in parallel
  const [ragResult, platformContext] = await Promise.all([
    fetchRagContext(query, workspaceId, maxRagTokens, similarityThreshold),
    includePlatformContext ? fetchPlatformContext(workspaceId, teamId) : Promise.resolve(''),
  ])

  // Format RAG context
  const ragContext = ragResult.context ? formatRagContext(ragResult.context) : ''

  // Format image context
  const imageContext = formatImageContextForPrompt(imageContexts)

  // Combine all context
  const combined = [platformContext, ragContext, imageContext].filter(Boolean).join('\n')

  // Estimate tokens (rough: 4 chars per token)
  const totalTokens = Math.ceil(combined.length / 4)

  return {
    ragContext,
    platformContext,
    imageContext,
    combined,
    totalTokens,
    ragUsed: ragResult.context !== null && ragResult.context.items.length > 0,
    ragStats: ragResult.context
      ? {
          itemCount: ragResult.context.items.length,
          layers: ragResult.context.layers,
          retrievalTimeMs: ragResult.durationMs,
        }
      : undefined,
  }
}

// =============================================================================
// SYSTEM PROMPT BUILDER
// =============================================================================

/**
 * Base system prompt for the AI assistant
 */
const BASE_SYSTEM_PROMPT = `You are an intelligent AI assistant integrated into a Product Lifecycle Management platform. You help users with:

- Product planning and roadmapping
- Feature prioritization and scoping
- Team collaboration and task management
- Analytics and progress tracking
- Knowledge management and research

Guidelines:
1. Be concise but thorough
2. Reference specific data from the context when relevant
3. Suggest actionable next steps when appropriate
4. Ask clarifying questions if the request is ambiguous
5. If you don't have enough context, say so rather than making assumptions

Current context is provided below.`

/**
 * Build complete system prompt with all context
 */
export function buildSystemPrompt(context: BuiltContext, customInstructions?: string): string {
  let prompt = BASE_SYSTEM_PROMPT

  if (customInstructions) {
    prompt += `\n\n## Custom Instructions\n${customInstructions}`
  }

  if (context.combined) {
    prompt += context.combined
  }

  return prompt
}

/**
 * Build minimal system prompt (no RAG/platform context)
 */
export function buildMinimalSystemPrompt(imageContext?: string): string {
  let prompt = BASE_SYSTEM_PROMPT

  if (imageContext) {
    prompt += imageContext
  }

  return prompt
}
