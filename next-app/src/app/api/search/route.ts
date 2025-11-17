import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/parallel/search-client';

/**
 * POST /api/search
 *
 * Search the web using Parallel.ai
 *
 * Request body:
 * {
 *   objective?: string;
 *   searchQueries?: string[];
 *   maxResults?: number;
 *   mode?: 'one-shot' | 'agentic';
 * }
 *
 * Example usage:
 * ```ts
 * const response = await fetch('/api/search', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     objective: 'Find best practices for product roadmaps',
 *     searchQueries: ['product roadmap best practices 2025'],
 *     maxResults: 5
 *   })
 * });
 * const data = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { objective, searchQueries, maxResults = 10, mode = 'one-shot' } = body;

    // Validate required parameters
    if (!objective && (!searchQueries || searchQueries.length === 0)) {
      return NextResponse.json(
        {
          error: 'Must provide either objective or searchQueries',
          code: 'MISSING_PARAMETERS'
        },
        { status: 400 }
      );
    }

    // Perform search
    const results = await searchWeb({
      objective,
      searchQueries,
      maxResults,
      mode
    });

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search API Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Search failed',
        code: 'SEARCH_ERROR'
      },
      { status: 500 }
    );
  }
}
