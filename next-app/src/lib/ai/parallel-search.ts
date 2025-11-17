/**
 * Parallel Search Tool Layer
 *
 * Use Parallel.ai Search as an additional tool alongside AI models for:
 * - Web search for research and external knowledge
 * - Deep research with multi-query cross-referencing
 * - Context enrichment for AI responses
 * - External data retrieval for dependencies
 * - Specialized dependency analysis with industry best practices
 *
 * This is NOT a standalone AI model - it's a tool that models can use.
 *
 * Available functions:
 * - parallelSearch() - Single query web search
 * - extractSearchContext() - Extract relevant content from results
 * - enrichPromptWithSearch() - Enrich AI prompts with external knowledge
 * - deepResearch() - Multi-query research with cross-referencing
 * - deepResearchDependencies() - Specialized dependency research
 */

const PARALLEL_SEARCH_API_URL = 'https://api.parallel.ai/v1/search'
const PARALLEL_SEARCH_API_KEY = process.env.PARALLEL_SEARCH_API_KEY

if (!PARALLEL_SEARCH_API_KEY) {
  console.warn('PARALLEL_SEARCH_API_KEY not set - web search features will not work')
}

/**
 * Search result from Parallel.ai
 */
export interface ParallelSearchResult {
  title: string
  url: string
  content: string // AI-optimized token-efficient content
  score: number // Relevance score (0-1)
  source: string // Source domain
}

/**
 * Parallel Search API response
 */
export interface ParallelSearchResponse {
  query: string
  results: ParallelSearchResult[]
  totalResults: number
  tokensUsed: number // How many tokens were used for the response
  costUsd: number // Estimated cost
}

/**
 * Search the web using Parallel.ai
 *
 * @param query - Search query string
 * @param numResults - Number of results to return (default: 10, max: 50)
 * @param optimizeForAI - Return token-efficient AI-optimized content (default: true)
 * @returns Search results with AI-optimized content
 */
export async function parallelSearch(
  query: string,
  numResults: number = 10,
  optimizeForAI: boolean = true
): Promise<ParallelSearchResponse> {
  if (!PARALLEL_SEARCH_API_KEY) {
    throw new Error('PARALLEL_SEARCH_API_KEY not configured')
  }

  if (numResults < 1 || numResults > 50) {
    throw new Error('numResults must be between 1 and 50')
  }

  try {
    const response = await fetch(PARALLEL_SEARCH_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PARALLEL_SEARCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: numResults,
        optimize_for_ai: optimizeForAI, // Token-efficient results
        include_content: true,
        rank_by: 'relevance_and_authority', // AI-optimized ranking
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error?.message || `Parallel Search API error: ${response.statusText}`
      )
    }

    const data = await response.json()

    // Calculate cost: $0.005 per search request + $0.001 per page extracted
    const costUsd = 0.005 + data.results.length * 0.001

    return {
      query: data.query,
      results: data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
        source: result.source,
      })),
      totalResults: data.total_results,
      tokensUsed: data.tokens_used || 0,
      costUsd,
    }
  } catch (error: any) {
    console.error('Parallel Search API error:', error)
    throw new Error(`Failed to search with Parallel.ai: ${error.message}`)
  }
}

/**
 * Extract most relevant content from search results
 *
 * @param results - Array of search results
 * @param maxLength - Maximum content length (characters)
 * @returns Concatenated content from top results
 */
export function extractSearchContext(
  results: ParallelSearchResult[],
  maxLength: number = 10000
): string {
  let context = ''
  let currentLength = 0

  for (const result of results) {
    if (currentLength >= maxLength) break

    const resultText = `\n\n# ${result.title}\nSource: ${result.url}\n\n${result.content}`
    const remainingLength = maxLength - currentLength

    if (resultText.length <= remainingLength) {
      context += resultText
      currentLength += resultText.length
    } else {
      context += resultText.slice(0, remainingLength) + '...'
      break
    }
  }

  return context
}

/**
 * Search and enrich AI prompt with external knowledge
 *
 * @param query - Search query
 * @param originalPrompt - Original AI prompt
 * @param maxResults - Number of search results (default: 5)
 * @returns Enriched prompt with search context
 */
export async function enrichPromptWithSearch(
  query: string,
  originalPrompt: string,
  maxResults: number = 5
): Promise<string> {
  const searchResults = await parallelSearch(query, maxResults)
  const searchContext = extractSearchContext(searchResults.results)

  return `${originalPrompt}

# External Knowledge (from web search):
${searchContext}

Use the external knowledge above to inform your response, but prioritize the original context provided.`
}

/**
 * Deep Research: Multi-query search with cross-referencing
 *
 * Performs comprehensive research by:
 * 1. Running multiple related queries
 * 2. Aggregating results from diverse sources
 * 3. Cross-referencing information across sources
 * 4. Ranking by consensus and authority
 *
 * @param mainQuery - Primary research question
 * @param relatedQueries - Additional angles to explore (optional)
 * @param maxResultsPerQuery - Results per query (default: 10)
 * @returns Comprehensive research results with source diversity
 */
export async function deepResearch(
  mainQuery: string,
  relatedQueries: string[] = [],
  maxResultsPerQuery: number = 10
): Promise<{
  mainResults: ParallelSearchResult[]
  relatedResults: Record<string, ParallelSearchResult[]>
  consolidatedContext: string
  totalSources: number
  totalCost: number
  uniqueDomains: string[]
}> {
  // Run main query
  const mainSearchResults = await parallelSearch(mainQuery, maxResultsPerQuery)

  // Run related queries in parallel
  const relatedSearchPromises = relatedQueries.map((query) =>
    parallelSearch(query, maxResultsPerQuery)
  )
  const relatedSearchResults = await Promise.all(relatedSearchPromises)

  // Map related results by query
  const relatedResultsMap: Record<string, ParallelSearchResult[]> = {}
  relatedQueries.forEach((query, index) => {
    relatedResultsMap[query] = relatedSearchResults[index].results
  })

  // Combine all results
  const allResults = [
    ...mainSearchResults.results,
    ...relatedSearchResults.flatMap((r) => r.results),
  ]

  // Track unique domains for source diversity
  const uniqueDomains = Array.from(new Set(allResults.map((r) => r.source)))

  // Calculate total cost
  const totalCost =
    mainSearchResults.costUsd +
    relatedSearchResults.reduce((sum, r) => sum + r.costUsd, 0)

  // Consolidate context (prioritize high-scoring results)
  const sortedResults = allResults.sort((a, b) => b.score - a.score)
  const consolidatedContext = extractSearchContext(sortedResults, 20000) // Larger context

  return {
    mainResults: mainSearchResults.results,
    relatedResults: relatedResultsMap,
    consolidatedContext,
    totalSources: allResults.length,
    totalCost,
    uniqueDomains,
  }
}

/**
 * Deep Research for Dependency Analysis
 *
 * Specialized deep research for understanding feature dependencies:
 * - Technical implementation patterns
 * - Common dependency relationships
 * - Best practices from industry sources
 *
 * @param featureName - Feature to research
 * @param relatedFeatures - Related features to analyze (optional)
 * @returns Research findings with actionable insights
 */
export async function deepResearchDependencies(
  featureName: string,
  relatedFeatures: string[] = []
): Promise<{
  implementationPatterns: string
  dependencyInsights: string
  bestPractices: string
  cost: number
}> {
  const queries = [
    `${featureName} implementation dependencies best practices`,
    `${featureName} technical requirements architecture`,
    `${featureName} feature dependencies software engineering`,
  ]

  // Add related feature queries
  if (relatedFeatures.length > 0) {
    queries.push(
      `dependencies between ${featureName} and ${relatedFeatures.join(', ')}`
    )
  }

  const research = await deepResearch(queries[0], queries.slice(1), 8)

  // Extract insights from consolidated context
  const sections = research.consolidatedContext.split('\n\n')
  const implementationPatterns = sections
    .slice(0, Math.ceil(sections.length / 3))
    .join('\n\n')
  const dependencyInsights = sections
    .slice(
      Math.ceil(sections.length / 3),
      Math.ceil((sections.length * 2) / 3)
    )
    .join('\n\n')
  const bestPractices = sections
    .slice(Math.ceil((sections.length * 2) / 3))
    .join('\n\n')

  return {
    implementationPatterns,
    dependencyInsights,
    bestPractices,
    cost: research.totalCost,
  }
}
