/**
 * L3 Topic Clustering Service
 *
 * Groups documents into topic clusters based on:
 * - Semantic similarity of summaries
 * - Shared topics from L2 summaries
 * - Entity co-occurrence
 *
 * Each topic cluster contains:
 * - Cross-document summary (~500 tokens)
 * - Keywords aggregated from member documents
 * - Related entities across documents
 * - Importance and confidence scores
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createClient } from '@/lib/supabase/server'
import { embedQuery, formatEmbeddingForPgvector, cosineSimilarity } from '../embeddings/embedding-service'
import type {
  KnowledgeTopic,
  KnowledgeTopicInsert,
  TopicCategory,
  TopicDocument,
} from '@/lib/types/collective-intelligence'

// =============================================================================
// SCHEMAS
// =============================================================================

const TopicClusterSchema = z.object({
  name: z.string().describe('A concise, descriptive name for this topic cluster (2-5 words)'),
  description: z
    .string()
    .describe('A brief description of what this topic cluster covers (1-2 sentences)'),
  summary: z
    .string()
    .describe('A comprehensive cross-document summary synthesizing all member documents (max 500 tokens)'),
  category: z
    .enum(['feature', 'process', 'decision', 'research', 'risk', 'goal', 'problem', 'solution', 'other'])
    .describe('The primary category of this topic'),
  keywords: z
    .array(z.string())
    .max(10)
    .describe('Key terms that define this topic cluster'),
  importanceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('How important this topic is based on document count and recency (0-1)'),
})

type GeneratedTopicCluster = z.infer<typeof TopicClusterSchema>

// =============================================================================
// CLUSTERING
// =============================================================================

interface DocumentForClustering {
  documentId: string
  documentName: string
  summary: string
  keyPoints: string[]
  topics: string[]
  entities: string[]
  embedding: number[]
}

export interface ClusterTopicsOptions {
  teamId: string
  workspaceId?: string
  similarityThreshold?: number // Default 0.7
  minDocumentsPerCluster?: number // Default 2
  model?: string
}

export interface ClusterTopicsResult {
  success: boolean
  topicsCreated: number
  topicsUpdated: number
  documentsProcessed: number
  error?: string
}

/**
 * Cluster documents into topics based on semantic similarity
 */
export async function clusterTopics(options: ClusterTopicsOptions): Promise<ClusterTopicsResult> {
  const {
    teamId,
    workspaceId,
    similarityThreshold = 0.7,
    minDocumentsPerCluster = 2,
    model = 'anthropic/claude-3-haiku-20240307',
  } = options

  try {
    const supabase = await createClient()

    // Fetch all document summaries with embeddings
    const query = supabase
      .from('document_summaries')
      .select(`
        id,
        document_id,
        summary,
        key_points,
        topics,
        entities,
        embedding,
        knowledge_documents!inner(id, name, team_id, workspace_id)
      `)

    // Filter by team through the joined documents
    const { data: summaries, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch summaries: ${fetchError.message}`)
    }

    if (!summaries || summaries.length < minDocumentsPerCluster) {
      return {
        success: true,
        topicsCreated: 0,
        topicsUpdated: 0,
        documentsProcessed: summaries?.length || 0,
      }
    }

    // Filter summaries by team/workspace
    const filteredSummaries = summaries.filter((s) => {
      // Handle both array and single object from inner join
      const docData = s.knowledge_documents
      const doc = Array.isArray(docData) ? docData[0] : docData
      if (!doc) return false
      const typedDoc = doc as { team_id: string; workspace_id?: string }
      if (typedDoc.team_id !== teamId) return false
      if (workspaceId && typedDoc.workspace_id !== workspaceId) return false
      return true
    })

    // Parse embeddings and prepare documents
    const documents: DocumentForClustering[] = filteredSummaries
      .filter((s) => s.embedding)
      .map((s) => {
        // Handle both array and single object from inner join
        const docData = s.knowledge_documents
        const doc = Array.isArray(docData) ? docData[0] : docData
        const typedDoc = doc as { id: string; name: string } | undefined
        // Parse the embedding string back to array
        const embeddingStr = s.embedding as string
        const embedding = embeddingStr
          ? JSON.parse(embeddingStr.replace('[', '[').replace(']', ']'))
          : []

        return {
          documentId: s.document_id,
          documentName: typedDoc?.name || 'Unknown',
          summary: s.summary,
          keyPoints: s.key_points || [],
          topics: s.topics || [],
          entities: s.entities || [],
          embedding,
        }
      })

    if (documents.length < minDocumentsPerCluster) {
      return {
        success: true,
        topicsCreated: 0,
        topicsUpdated: 0,
        documentsProcessed: documents.length,
      }
    }

    // Cluster documents using greedy clustering
    const clusters = greedyCluster(documents, similarityThreshold, minDocumentsPerCluster)

    // Generate topic summaries for each cluster
    let topicsCreated = 0
    let topicsUpdated = 0

    for (const cluster of clusters) {
      const result = await generateTopicFromCluster(cluster, teamId, workspaceId, model)

      if (result.created) {
        topicsCreated++
      } else if (result.updated) {
        topicsUpdated++
      }
    }

    return {
      success: true,
      topicsCreated,
      topicsUpdated,
      documentsProcessed: documents.length,
    }
  } catch (error) {
    console.error('[L3 Topic Clustering] Error:', error)
    return {
      success: false,
      topicsCreated: 0,
      topicsUpdated: 0,
      documentsProcessed: 0,
      error: error instanceof Error ? error.message : 'Failed to cluster topics',
    }
  }
}

/**
 * Greedy clustering algorithm based on cosine similarity
 */
function greedyCluster(
  documents: DocumentForClustering[],
  threshold: number,
  minSize: number
): DocumentForClustering[][] {
  const clusters: DocumentForClustering[][] = []
  const assigned = new Set<string>()

  // Sort by number of topics (more specific documents first)
  const sorted = [...documents].sort((a, b) => b.topics.length - a.topics.length)

  for (const doc of sorted) {
    if (assigned.has(doc.documentId)) continue

    // Try to find an existing cluster this document fits into
    let bestCluster = -1
    let bestSimilarity = threshold

    for (let i = 0; i < clusters.length; i++) {
      const clusterCenter = getClusterCenter(clusters[i])
      const similarity = cosineSimilarity(doc.embedding, clusterCenter)

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestCluster = i
      }
    }

    if (bestCluster >= 0) {
      clusters[bestCluster].push(doc)
      assigned.add(doc.documentId)
    } else {
      // Start a new cluster
      clusters.push([doc])
      assigned.add(doc.documentId)
    }
  }

  // Filter out clusters that are too small
  return clusters.filter((c) => c.length >= minSize)
}

/**
 * Calculate the centroid of a cluster
 */
function getClusterCenter(documents: DocumentForClustering[]): number[] {
  if (documents.length === 0) return []
  if (documents.length === 1) return documents[0].embedding

  const dimensions = documents[0].embedding.length
  const center = new Array(dimensions).fill(0)

  for (const doc of documents) {
    for (let i = 0; i < dimensions; i++) {
      center[i] += doc.embedding[i]
    }
  }

  for (let i = 0; i < dimensions; i++) {
    center[i] /= documents.length
  }

  return center
}

/**
 * Generate a topic from a document cluster
 */
async function generateTopicFromCluster(
  cluster: DocumentForClustering[],
  teamId: string,
  workspaceId: string | undefined,
  model: string
): Promise<{ created: boolean; updated: boolean; topicId?: string }> {
  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    // Aggregate topics and entities from cluster
    const allTopics = new Set<string>()
    const allEntities = new Set<string>()

    for (const doc of cluster) {
      doc.topics.forEach((t) => allTopics.add(t))
      doc.entities.forEach((e) => allEntities.add(e))
    }

    // Build context from cluster documents
    const documentContext = cluster
      .map(
        (doc) => `
Document: ${doc.documentName}
Summary: ${doc.summary}
Key Points:
${doc.keyPoints.map((p) => `- ${p}`).join('\n')}
`
      )
      .join('\n---\n')

    // Generate topic cluster summary
    const { object: generated } = await generateObject({
      model: openrouter(model),
      schema: TopicClusterSchema,
      prompt: `Analyze these ${cluster.length} related documents and create a unified topic cluster.

Documents in this cluster:
${documentContext}

Shared topics detected: ${Array.from(allTopics).join(', ')}
Entities mentioned: ${Array.from(allEntities).join(', ')}

Generate a topic cluster that:
1. Has a clear, specific name (not generic like "General Topics")
2. Synthesizes insights from all documents
3. Identifies the key themes and decisions
4. Provides actionable summary for product teams`,
    })

    // Generate embedding for the topic
    const topicEmbedding = await embedQuery(generated.summary)

    const supabase = await createClient()

    // Check if a similar topic already exists
    const { data: existingTopics } = await supabase
      .from('knowledge_topics')
      .select('id, name, embedding')
      .eq('team_id', teamId)
      .eq(workspaceId ? 'workspace_id' : 'team_id', workspaceId || teamId)

    let existingTopicId: string | null = null

    if (existingTopics) {
      for (const existing of existingTopics) {
        if (existing.embedding) {
          const embeddingArr = JSON.parse(
            (existing.embedding as string).replace('[', '[').replace(']', ']')
          )
          const similarity = cosineSimilarity(topicEmbedding, embeddingArr)

          if (similarity > 0.85) {
            existingTopicId = existing.id
            break
          }
        }
      }
    }

    if (existingTopicId) {
      // Update existing topic
      await supabase
        .from('knowledge_topics')
        .update({
          summary: generated.summary,
          description: generated.description,
          keywords: generated.keywords,
          importance_score: generated.importanceScore,
          document_count: cluster.length,
          embedding: formatEmbeddingForPgvector(topicEmbedding),
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', existingTopicId)

      // Update topic-document links
      await supabase.from('topic_documents').delete().eq('topic_id', existingTopicId)

      const links = cluster.map((doc) => ({
        topic_id: existingTopicId,
        document_id: doc.documentId,
        relevance_score: 0.8,
      }))

      await supabase.from('topic_documents').insert(links)

      return { created: false, updated: true, topicId: existingTopicId }
    } else {
      // Create new topic
      const { data: newTopic, error: insertError } = await supabase
        .from('knowledge_topics')
        .insert({
          team_id: teamId,
          workspace_id: workspaceId,
          name: generated.name,
          description: generated.description,
          summary: generated.summary,
          category: generated.category,
          keywords: generated.keywords,
          related_entities: Array.from(allEntities),
          importance_score: generated.importanceScore,
          confidence_score: Math.min(0.5 + cluster.length * 0.1, 0.95),
          document_count: cluster.length,
          embedding: formatEmbeddingForPgvector(topicEmbedding),
          auto_generated: true,
          last_updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create topic: ${insertError.message}`)
      }

      // Create topic-document links
      const links = cluster.map((doc) => ({
        topic_id: newTopic.id,
        document_id: doc.documentId,
        relevance_score: 0.8,
      }))

      await supabase.from('topic_documents').insert(links)

      return { created: true, updated: false, topicId: newTopic.id }
    }
  } catch (error) {
    console.error('[L3 Topic Clustering] Cluster generation error:', error)
    return { created: false, updated: false }
  }
}

/**
 * Get topics for a workspace
 */
export async function getTopics(
  teamId: string,
  workspaceId?: string
): Promise<KnowledgeTopic[]> {
  const supabase = await createClient()

  let query = supabase
    .from('knowledge_topics')
    .select('*')
    .eq('team_id', teamId)
    .order('importance_score', { ascending: false })

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((t) => ({
    id: t.id,
    teamId: t.team_id,
    workspaceId: t.workspace_id,
    name: t.name,
    description: t.description,
    summary: t.summary,
    category: t.category as TopicCategory,
    importanceScore: t.importance_score,
    confidenceScore: t.confidence_score,
    keywords: t.keywords || [],
    relatedEntities: t.related_entities || [],
    embedding: null,
    documentCount: t.document_count,
    chunkCount: t.chunk_count,
    lastUpdatedAt: t.last_updated_at,
    autoGenerated: t.auto_generated,
    needsReview: t.needs_review,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }))
}

/**
 * Get documents for a topic
 */
export async function getTopicDocuments(
  topicId: string
): Promise<Array<{ documentId: string; documentName: string; relevanceScore: number }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topic_documents')
    .select(`
      document_id,
      relevance_score,
      knowledge_documents(name)
    `)
    .eq('topic_id', topicId)

  if (error || !data) {
    return []
  }

  return data.map((td) => {
    // Handle both array and single object from join
    const docData = td.knowledge_documents
    const doc = Array.isArray(docData) ? docData[0] : docData
    const typedDoc = doc as { name: string } | undefined
    return {
      documentId: td.document_id,
      documentName: typedDoc?.name || 'Unknown',
      relevanceScore: td.relevance_score,
    }
  })
}
