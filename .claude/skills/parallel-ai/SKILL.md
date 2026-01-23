---
name: parallel-ai
description: Tool for web search, data extraction, and research using Parallel AI APIs. Use when you need to search the web, extract data from URLs, enrich company data, or analyze markets. Provides direct API access to Search, Extract, Task, and Deep Research without SDK.
---

# Parallel AI Research Tool

**4 APIs for research**: Search (web), Extract (URLs), Task (structured data), Deep Research (analysis)

## Setup

API Key: https://platform.parallel.ai  
Environment: `export PARALLEL_API_KEY="your-key"`

## The 4 APIs at a Glance

| API | Purpose | Speed | Cost | Use For |
|-----|---------|-------|------|---------|
| Search | Web search + excerpts | 5-60s | $0.01 | Quick lookups |
| Extract | Scrape specific URLs | 5-30s | $0.01 | Pricing, data |
| Task | Structured enrichment | 1-25m | $0.01-0.30 | Companies, data |
| Deep Research | Multi-source analysis | 5-25m | $0.10-0.30 | Markets, reports |

## Processors (Pick One)

| Processor | Speed | Cost/1K | When |
|-----------|-------|---------|------|
| lite | 5-60s | $5 | Simple Q&A |
| base | 15-100s | $10 | Quick data |
| core | 1-5m | $25 | Detailed |
| pro | 3-9m | $100 | Analysis |
| ultra | 5-25m | $300 | Deep |

## Endpoint URLs

```
POST https://api.parallel.ai/v1beta/search       (web search)
POST https://api.parallel.ai/v1beta/extract      (URL scraping)
POST https://api.parallel.ai/v1beta/tasks/runs   (research tasks)
GET  https://api.parallel.ai/v1beta/tasks/runs/{id}  (check status)
```

## Required Headers (All Requests)

```
x-api-key: your-api-key
Content-Type: application/json
parallel-beta: search-extract-2025-10-10     (only Search/Extract)
```

## Minimal Examples

**Search**: `{"objective": "your question"}`

**Extract**: `{"url": "https://...", "objective": "what to extract"}`

**Task**: `{"input": "company name", "processor": "core"}`

**Task Status**: `GET /v1beta/tasks/runs/{task_id}`

## Task Polling Loop

```
Create task → get id
Poll every 2-5s: GET /v1beta/tasks/runs/{id}
Status: "running" → keep polling
Status: "completed" → use result
Status: "failed" → check error
```

## Limits & Errors

- Rate limit: 2,000 req/min → HTTP 429 (wait, retry)
- Invalid key: HTTP 401
- Bad request: HTTP 400 (check parameters)
- Server error: HTTP 500/503 (retry)

See `api-reference.md` for complete endpoint docs
See `quick-reference.md` for troubleshooting
See `research-workflows.md` for real examples
