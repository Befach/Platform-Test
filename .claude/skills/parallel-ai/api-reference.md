# API Reference - Minimal

## Search API
`POST https://api.parallel.ai/v1beta/search`

**Minimal request**:
```json
{"objective": "Find Bitcoin price"}
```

**Full request**:
```json
{
  "objective": "Find current Bitcoin price",
  "search_queries": ["BTC price today"],
  "max_results": 5,
  "mode": "agentic",
  "source_policy": {"include_domains": ["bloomberg.com", "reuters.com"]}
}
```

**Response**:
```json
{
  "results": [
    {"title": "...", "url": "...", "excerpt": "...", "relevance_score": 0.95}
  ]
}
```

---

## Extract API
`POST https://api.parallel.ai/v1beta/extract`

**Request**:
```json
{
  "url": "https://example.com/pricing",
  "objective": "Extract all pricing plans"
}
```

**Response**: Extracted JSON/text data

---

## Task API - Create
`POST https://api.parallel.ai/v1beta/tasks/runs`

**Minimal request**:
```json
{
  "input": "OpenAI",
  "processor": "core"
}
```

**With schema**:
```json
{
  "input": "OpenAI",
  "processor": "core",
  "output_schema": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "founded": {"type": "integer"},
      "employees": {"type": "integer"}
    }
  }
}
```

**Response**:
```json
{
  "id": "task_abc123",
  "status": "queued"
}
```

---

## Task API - Get Status
`GET https://api.parallel.ai/v1beta/tasks/runs/{task_id}`

**Response**:
```json
{
  "id": "task_abc123",
  "status": "completed",
  "result": {
    "content": {"name": "OpenAI", "founded": 2015},
    "basis": {"citations": [{"url": "...", "excerpt": "..."}]}
  }
}
```

**Status values**: `queued`, `running`, `completed`, `failed`

---

## Deep Research
`POST https://api.parallel.ai/v1beta/tasks/runs` + use processor `pro` or `ultra`

**Request**:
```json
{
  "input": "Analyze the AI chip market in 2024",
  "processor": "pro",
  "output_schema": "text"
}
```

**Response**: Markdown report with citations

---

## Error Responses

| Code | Meaning | Fix |
|------|---------|-----|
| 401 | Bad key | Check PARALLEL_API_KEY |
| 400 | Bad request | Validate JSON |
| 429 | Rate limit | Wait 60s |
| 500 | Server error | Retry later |

---

## Source Filtering

Include only:
```json
{"source_policy": {"include_domains": ["arxiv.org", "nature.com"]}}
```

Exclude:
```json
{"source_policy": {"exclude_domains": ["reddit.com", "twitter.com"]}}
```
