# Quick Reference

# Parallel AI Quick Reference

## API Endpoints

| API | Purpose | Base URL |
|-----|---------|----------|
| Search | Web search with excerpts | `https://api.parallel.ai/v1/search` |
| Extract | Get structured data from URLs | `https://api.parallel.ai/v1/extract` |
| Task | Multi-step web research | `https://api.parallel.ai/v1/task` |
| Deep Research | Advanced multi-source research | `https://api.parallel.ai/v1/task` (with deep research flag) |

## Common Headers

```
x-api-key: your-api-key
Content-Type: application/json
parallel-beta: search-extract-2025-10-10  (for beta APIs)
```

## Processor Quick Pick

| Need | Processor | Speed | Cost |
|------|-----------|-------|------|
| Fast lookup | `lite` | 5-60s | $5/1K |
| Basic data | `base` | 15-100s | $10/1K |
| Good accuracy | `core` | 1-5min | $25/1K |
| Deep research | `pro` | 3-9min | $100/1K |
| Complex analysis | `ultra` | 5-25min | $300/1K |

## Task Status Flow

```
queued → running → completed ✓
              ↓
            failed ✗
```

## Python SDK Common Patterns

### Create and Wait (Simple)
```python
task = client.create_task(input=data, processor="core")
result = task.wait()
return result.content
```

### Poll with Status Checking
```python
task = client.create_task(input=data, processor="core")
while task.status != "completed":
    print(f"Status: {task.status}")
    time.sleep(2)
    task = client.get_task(task.id)
```

### Search Quick Lookup
```python
response = client.search(objective="your query", max_results=5)
for r in response.results:
    print(r.title, r.url)
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API key | Check `PARALLEL_API_KEY` |
| 400 | Bad request | Validate input format |
| 429 | Rate limited | Wait and retry with backoff |
| 500 | Server error | Retry after delay |
| 503 | Service unavailable | Check status.parallel.ai |

## Rate Limits

- **Task API**: 2,000 requests/minute per API key
- **Search API**: Variable (see docs)
- **Returns**: 429 Too Many Requests when exceeded

## Output Schema Examples

### Simple Text Output
```python
# No output_schema needed - returns plain text
response = client.create_task(input="question")
```

### Structured JSON
```python
output_schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "founded": {"type": "integer"},
        "employees": {"type": "integer"}
    }
}
```

### Array Output
```python
output_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "product": {"type": "string"},
            "price": {"type": "number"}
        }
    }
}
```

## Source Policy Examples

### Include Only Academic
```python
source_policy = {
    "include_domains": [
        "arxiv.org",
        "scholar.google.com",
        "nature.com"
    ]
}
```

### Exclude Social Media
```python
source_policy = {
    "exclude_domains": [
        "reddit.com",
        "twitter.com",
        "facebook.com"
    ]
}
```

## Async Pattern

```python
import asyncio
from parallel_web import ParallelClient

async def run():
    client = ParallelClient()
    task = await client.create_task(input="query", processor="core")
    result = await task.wait()
    return result.content

result = asyncio.run(run())
```

## Cost Calculation

**Formula**: (Number of tasks) × (Cost per 1K tasks) ÷ 1000

**Example**:
- 100 tasks on `core` processor
- `core` = $25 per 1K
- Cost = 100 × (25 ÷ 1000) = $2.50

## Common Issues and Solutions

### Task Stays in "running" State
- **Cause**: Long-running task on complex processor
- **Solution**: Increase timeout or use webhook
- **Code**: `task.wait(timeout=1800)` for 30 minutes

### Get "rate_limit" Error
- **Cause**: Exceeded 2,000 requests/minute
- **Solution**: Implement exponential backoff
- **Code**: `time.sleep(2 ** attempt_number)`

### Empty Results from Search
- **Cause**: Query too specific or sources excluded
- **Solution**: Broaden query or remove source_policy
- **Code**: Remove `source_policy` parameter

### Output Doesn't Match Schema
- **Cause**: Ambiguous or conflicting schema
- **Solution**: Simplify schema or provide examples
- **Code**: Add clear property descriptions

## Environment Setup

```bash
# Install SDK
pip install parallel-web

# Set API key (Linux/Mac)
export PARALLEL_API_KEY="your-key"

# Set API key (Windows PowerShell)
$env:PARALLEL_API_KEY="your-key"

# Verify setup
python -c "import parallel_web; print('OK')"
```

## Timezone and Date Handling

When using dates in queries:

```python
from datetime import datetime, timedelta

today = datetime.now()
last_week = today - timedelta(days=7)

task = client.create_task(
    input=f"Find news from {last_week.strftime('%Y-%m-%d')} to {today.strftime('%Y-%m-%d')}",
    processor="core"
)
```

## Batch Processing Efficiency

For multiple tasks, use `create_task_group()`:

```python
tasks = [
    {"input": item, "processor": "core"}
    for item in data_items
]

group = client.create_task_group(tasks=tasks)
# All tasks run in parallel
```

## Response Structure

### Task Result
```json
{
  "id": "task_123",
  "status": "completed",
  "result": {
    "content": {...},
    "basis": {...}
  }
}
```

### Search Result
```json
{
  "search_id": "search_123",
  "results": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "..."
    }
  ]
}
```

## Documentation Links

- Full Docs: https://docs.parallel.ai
- API Reference: https://docs.parallel.ai/api-reference
- Python SDK: https://pypi.org/project/parallel-web/
- GitHub: https://github.com/parallel-web/parallel-cookbook
- Status: https://status.parallel.ai
