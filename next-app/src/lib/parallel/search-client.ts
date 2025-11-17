import { Parallel } from 'parallel-web';

/**
 * Parallel Search Client for web search across multiple sources
 *
 * Uses Parallel.ai Beta Search API to search across:
 * - Tavily
 * - Perplexity
 * - Exa
 * - Brave
 *
 * @see https://docs.parallel.ai/integrations/search
 */

// Initialize client with API key from environment
const client = new Parallel({
  apiKey: process.env.PARALLEL_API_KEY!
});

export interface ParallelSearchOptions {
  objective?: string;
  searchQueries?: string[];
  maxResults?: number;
  maxCharsPerResult?: number;
  mode?: 'one-shot' | 'agentic';
}

export interface ParallelSearchResult {
  url: string;
  title?: string | null;
  excerpts?: string[] | null;
  publish_date?: string | null;
}

export interface ParallelSearchResponse {
  results: ParallelSearchResult[];
  search_id: string;
  usage?: Array<{ name: string; count: number }> | null;
  warnings?: Array<{ message: string }> | null;
}

/**
 * Search the web using Parallel.ai Beta Search API
 *
 * @example
 * ```ts
 * const results = await searchWeb({
 *   objective: 'Find best practices for product roadmaps',
 *   searchQueries: ['product roadmap best practices 2025'],
 *   maxResults: 5
 * });
 * ```
 */
export async function searchWeb(
  options: ParallelSearchOptions
): Promise<ParallelSearchResponse> {
  const {
    objective,
    searchQueries,
    maxResults = 10,
    maxCharsPerResult = 500,
    mode = 'one-shot'
  } = options;

  // Validate that at least one search parameter is provided
  if (!objective && (!searchQueries || searchQueries.length === 0)) {
    throw new Error('Must provide either objective or searchQueries');
  }

  try {
    const response = await client.beta.search(
      {
        objective: objective || undefined,
        search_queries: searchQueries || undefined,
        max_results: maxResults,
        mode: mode,
        excerpts: {
          max_chars_per_result: maxCharsPerResult
        }
      },
      {
        headers: {
          'parallel-beta': 'search-extract-2025-10-10'
        }
      }
    );

    return response;
  } catch (error) {
    console.error('Parallel Search Error:', error);
    throw error;
  }
}

/**
 * Extract content from specific URLs using Parallel.ai Beta Extract API
 *
 * @example
 * ```ts
 * const content = await extractContent({
 *   urls: ['https://example.com/article'],
 *   objective: 'Extract key product features',
 *   includeFullContent: true
 * });
 * ```
 */
export async function extractContent(options: {
  urls: string[];
  objective?: string;
  searchQueries?: string[];
  includeFullContent?: boolean;
  maxCharsPerResult?: number;
}) {
  const {
    urls,
    objective,
    searchQueries,
    includeFullContent = false,
    maxCharsPerResult = 1000
  } = options;

  try {
    const response = await client.beta.extract(
      {
        urls,
        objective: objective || undefined,
        search_queries: searchQueries || undefined,
        excerpts: {
          max_chars_per_result: maxCharsPerResult
        },
        full_content: includeFullContent ? {
          max_chars_per_result: maxCharsPerResult * 10
        } : false
      },
      {
        headers: {
          'parallel-beta': 'search-extract-2025-10-10'
        }
      }
    );

    return response;
  } catch (error) {
    console.error('Parallel Extract Error:', error);
    throw error;
  }
}

export { client as parallelClient };
