# Quick Reference

## Endpoints

| Action | URL | Method |
|--------|-----|--------|
| Search | `https://api.parallel.ai/v1beta/search` | POST |
| Extract | `https://api.parallel.ai/v1beta/extract` | POST |
| Create task | `https://api.parallel.ai/v1beta/tasks/runs` | POST |
| Check status | `https://api.parallel.ai/v1beta/tasks/runs/{id}` | GET |

## Headers (All Requests)

```
x-api-key: your-api-key
Content-Type: application/json
parallel-beta: search-extract-2025-10-10     (Search/Extract only)
```

## Processors

| Processor | Speed | Cost/1K |
|-----------|-------|---------|
| lite | 5-60s | $5 |
| base | 15-100s | $10 |
| core | 1-5m | $25 |
| pro | 3-9m | $100 |
| ultra | 5-25m | $300 |

## Task Polling Loop

```
1. POST /v1beta/tasks/runs → get {id}
2. Loop: GET /v1beta/tasks/runs/{id}
3. If status="running" → wait 2-5s → repeat
4. If status="completed" → use result.content
5. If status="failed" → check error
```

## Troubleshooting

**"401 Unauthorized"**
- Check API key: `echo $PARALLEL_API_KEY`
- Regenerate at: https://platform.parallel.ai

**"429 Too Many Requests"**
- Hit rate limit (2,000/min)
- Wait 60s, retry with backoff
- Backoff: 2^attempt seconds (max 30s)

**"Empty search results"**
- Broaden objective
- Remove source_policy filters
- Try different keywords

**Task stuck in "running"**
- Normal for complex tasks (1-25m)
- Set timeout to 1800 (30 min)
- Use polling loop, don't give up

**"Output doesn't match schema"**
- Simplify schema
- Add clearer descriptions
- Don't specify exact field names

## Cost Calculator

Formula: `(tasks × cost_per_1k) ÷ 1000`

Examples:
- 100 lite tasks: (100 × 5) ÷ 1000 = **$0.50**
- 50 core tasks: (50 × 25) ÷ 1000 = **$1.25**
- 10 pro tasks: (10 × 100) ÷ 1000 = **$1.00**

## When to Use Each API

**Search** (fast, $0.01): Quick lookups, find sources

**Extract** (fast, $0.01): Scrape known URLs, get pricing

**Task** ($0.01-0.30): Enrichment, verification, structured data

**Deep Research** ($0.10-0.30, slow): Analysis, reports, market research

## Rate Limits

- Task API: 2,000 req/min
- Returns 429 when exceeded
- Implement exponential backoff

## Links

- Docs: https://docs.parallel.ai
- API Key: https://platform.parallel.ai
- Status: https://status.parallel.ai
