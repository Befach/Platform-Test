# Parallel Search Integration Guide

## ✅ Setup Complete

Parallel Search is ready to use in your Next.js application!

## 📦 Installed Packages

- `parallel-web` - Official Parallel.ai TypeScript SDK
- `dotenv` - Environment variable management

## 🔑 Environment Variables

Added to `.env.local`:

```bash
PARALLEL_API_KEY=REDACTED_KEY
```

## 📁 Files Created

### 1. Search Client Utility

**Location**: `src/lib/parallel/search-client.ts`

Provides two main functions:

- `searchWeb()` - Search across multiple sources (Tavily, Perplexity, Exa, Brave)
- `extractContent()` - Extract content from specific URLs

### 2. API Route

**Location**: `src/app/api/search/route.ts`

POST endpoint for web search functionality.

### 3. Test Script

**Location**: `test-parallel-search.ts`

Test script to verify Parallel Search is working.

## 🚀 Usage Examples

### Server-Side (API Routes, Server Components)

```typescript
import { searchWeb } from '@/lib/parallel/search-client';

// In an API route or Server Component
const results = await searchWeb({
  objective: 'Find best practices for product roadmap design',
  searchQueries: [
    'product roadmap best practices 2025',
    'roadmap visualization techniques'
  ],
  maxResults: 5,
  mode: 'one-shot' // or 'agentic' for token-efficient results
});

console.log(results.results); // Array of search results
```

### Client-Side (React Components)

```typescript
'use client';

import { useState } from 'react';

export default function SearchExample() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: 'Find best practices for product roadmaps',
          searchQueries: ['product roadmap best practices 2025'],
          maxResults: 5,
          mode: 'one-shot'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div>
        {results.map((result, index) => (
          <div key={index}>
            <h3>{result.title}</h3>
            <a href={result.url}>{result.url}</a>
            {result.excerpts && (
              <div>
                {result.excerpts.map((excerpt, i) => (
                  <p key={i}>{excerpt}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing

Run the test script to verify everything works:

```bash
cd next-app
npx tsx test-parallel-search.ts
```

Expected output:

- ✅ Loads environment variables from `.env.local`
- ✅ Searches across multiple sources
- ✅ Returns 5 relevant results with titles, URLs, and excerpts
- ✅ Shows search ID and usage metrics

## 📊 Search Options

### Search Modes

**`one-shot` mode** (default):

- Returns comprehensive results with longer excerpts
- Best for answering questions from a single response
- Higher token usage but more detailed

**`agentic` mode**:

- Returns concise, token-efficient results
- Best for use in an agentic loop (multiple rounds of search)
- Lower token usage

### Parameters

```typescript
interface ParallelSearchOptions {
  objective?: string;           // Natural-language description
  searchQueries?: string[];     // Keyword search queries
  maxResults?: number;          // Default: 10
  maxCharsPerResult?: number;   // Default: 500
  mode?: 'one-shot' | 'agentic'; // Default: 'one-shot'
}
```

**Note**: At least one of `objective` or `searchQueries` must be provided.

## 🎯 Response Format

```typescript
interface ParallelSearchResponse {
  results: Array<{
    url: string;
    title?: string | null;
    excerpts?: string[] | null;    // Relevant content snippets
    publish_date?: string | null;  // YYYY-MM-DD format
  }>;
  search_id: string;               // e.g., "search_abc123..."
  usage?: Array<{
    name: string;
    count: number;
  }> | null;
  warnings?: Array<{
    message: string;
  }> | null;
}
```

## 🔧 Advanced: Extract Content from URLs

If you have specific URLs and want to extract content:

```typescript
import { extractContent } from '@/lib/parallel/search-client';

const content = await extractContent({
  urls: ['https://example.com/article'],
  objective: 'Extract key product features',
  includeFullContent: true,
  maxCharsPerResult: 1000
});
```

## 📅 Integration Roadmap

**Current Status**: Testing & Setup ✅

**Week 7 (Research & Discovery Module)**:

- Integrate into AI chat interface
- Add web search panel in mind mapping view
- Create knowledge base with search results
- Build search history tracking

## 🔗 Resources

- [Parallel.ai Documentation](https://docs.parallel.ai)
- [Parallel Search API Reference](https://docs.parallel.ai/integrations/search)
- [parallel-web SDK on npm](https://www.npmjs.com/package/parallel-web)

## ⚠️ Important Notes

1. **Environment Variables**:
   - Never commit `.env.local` to git (already in `.gitignore`)
   - API key is server-side only - never expose to client

2. **API Usage**:
   - Always use the `/api/search` route from client components
   - Use `searchWeb()` directly only in server components or API routes

3. **Error Handling**:
   - Always wrap search calls in try-catch blocks
   - Handle rate limits and API errors gracefully

4. **Cost Management**:
   - Use `agentic` mode for lower token usage
   - Limit `maxResults` to what you actually need
   - Cache results when appropriate

---

**Ready to use Parallel Search in your Product Lifecycle Platform!** 🚀
