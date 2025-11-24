# Parallel AI SDK Skill

---
name: parallel-ai-sdk
description: Comprehensive guide for integrating Parallel AI APIs and SDK into Python applications and Claude Code workflows. Use when building applications that need web search, web scraping, task automation, deep research, or data extraction using Parallel AI's SDK or REST APIs. Covers authentication, processor selection, common workflows, and error handling for Search, Extract, Task, and Deep Research APIs.
---

# Parallel AI SDK Integration Skill

This skill provides practical guidance for using Parallel AI's APIs and Python SDK to build intelligent web research and data extraction applications.

## Quick Start

### Installation

```bash
pip install parallel-web
```

### Authentication

Get your API key from [https://platform.parallel.ai](https://platform.parallel.ai), then set it as an environment variable:

```bash
export PARALLEL_API_KEY="your-api-key"
```

In Python:

```python
from parallel_web import ParallelClient

client = ParallelClient(api_key="your-api-key")
```

## Core APIs Overview

Parallel AI provides four main API categories:

- **Search**: Fast web search returning relevant excerpts
- **Extract**: Get structured data from specific URLs
- **Task**: Multi-step web research with structured inputs/outputs
- **Deep Research**: Advanced multi-source research with verification

Choose based on complexity: Search for simple lookups, Task for enrichment, Deep Research for analyst-grade intelligence.

## API Reference

### Search API

Fast web search returning relevant excerpts optimized for LLMs.

**When to use**: Find information quickly, answer factual questions, locate specific data

**Python example**:

```python
response = client.search(
    objective="Find current pricing for solar panel installations in California",
    search_queries=["solar panel price California 2024"],
    max_results=5
)

for result in response.results:
    print(f"Title: {result.title}")
    print(f"URL: {result.url}")
    print(f"Excerpt: {result.excerpt}")
```

**Key parameters**:
- `objective`: Natural language description of what you're searching for
- `search_queries`: List of keyword queries (optional if objective provided)
- `max_results`: Number of results (default: 10, max varies by processor)
- `mode`: "one-shot" for comprehensive results, "agentic" for concise token-efficient results

**Cost**: Free or minimal (depends on tier)

### Extract API

Get structured data from specific URLs.

**When to use**: Scrape data from known URLs, extract specific information from pages

```python
response = client.extract(
    url="https://example.com/company-page",
    objective="Extract company name, founding year, and employee count"
)

print(response.data)
```

**Key parameters**:
- `url`: The URL to extract from
- `objective`: What data to extract
- `structured`: Set to True for structured output

### Task API

Multi-step web research with structured inputs and outputs. Asynchronous by design.

**When to use**: Enrichment workflows, complex research, structured data collection

**Basic example**:

```python
# Create a task
task = client.create_task(
    input="OpenAI",  # Simple text input
    processor="base",  # Choose processor (lite, base, core, pro, ultra)
    output_schema={
        "type": "object",
        "properties": {
            "company_name": {"type": "string"},
            "founded_year": {"type": "integer"},
            "employee_count": {"type": "integer"}
        }
    }
)

print(f"Task created: {task.id}, Status: {task.status}")
```

**Check status and get results**:

```python
import time

# Poll until complete
while True:
    task = client.get_task(task.id)
    print(f"Status: {task.status}")
    
    if task.status == "completed":
        print(f"Result: {task.result}")
        break
    elif task.status == "failed":
        print(f"Error: {task.error}")
        break
    
    time.sleep(2)  # Wait before polling again
```

**Async example**:

```python
async def run_task_async():
    task = await client.create_task(
        input="Anthropic",
        processor="core",
        output_schema={
            "type": "object",
            "properties": {
                "company_name": {"type": "string"},
                "founded_year": {"type": "integer"}
            }
        }
    )
    
    # Wait for completion
    result = await task.wait()
    return result.content
```

### Deep Research API

Advanced research for complex queries, analyst-grade intelligence with verification.

**When to use**: Market analysis, competitive intelligence, comprehensive research

```python
task = client.create_deep_research(
    input="Market analysis for AI chip manufacturers in 2024",
    processor="pro",  # Use "pro" or "ultra" for deep research
    output_schema="auto"  # Auto-generates schema, or use "text" for markdown
)

# Wait and retrieve
import time
while task.status != "completed":
    task = client.get_task(task.id)
    time.sleep(3)

result = task.result
print(result.content)  # JSON or markdown depending on schema
```

## Processor Selection

Choose processor based on task complexity and latency needs:

| Processor | Latency | Cost per 1K | Best For |
|-----------|---------|------------|----------|
| `lite` | 5s-60s | $5 | Simple lookups, fallback |
| `base` | 15s-100s | $10 | Basic enrichment |
| `core` | 60s-5min | $25 | Cross-referenced data |
| `core2x` | 2-5min | $50 | Complex enrichment |
| `pro` | 3-9min | $100 | Research, exploration |
| `ultra` | 5-25min | $300 | Deep research, complex |
| `ultra2x` | 5-25min | $600 | Difficult research |
| `ultra4x` | 8-30min | $1200 | Very difficult research |
| `ultra8x` | 8-30min | $2400 | Hardest research |

**Selection guide**:
- Simple enrichment: `lite` or `base`
- Structured queries: `core`
- Exploratory research: `pro`
- Market/competitive analysis: `ultra`

## Common Patterns

### Source Policy

Control which domains to include or exclude:

```python
response = client.search(
    objective="Find Python web framework benchmarks",
    search_queries=["python web framework performance"],
    source_policy={
        "include_domains": ["github.com", "python.org"],  # Only these domains
        # OR
        "exclude_domains": ["reddit.com", "quora.com"]   # Block these
    }
)
```

### Task Groups (Batch Processing)

Run multiple tasks concurrently:

```python
companies = ["OpenAI", "Anthropic", "Google", "Meta"]

task_group = client.create_task_group(
    tasks=[
        {
            "input": company,
            "processor": "base",
            "output_schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "founded": {"type": "integer"}
                }
            }
        }
        for company in companies
    ]
)

# Check progress
print(f"Group ID: {task_group.id}")
```

### Error Handling

```python
try:
    task = client.create_task(
        input="Some input",
        processor="core"
    )
    result = task.wait(timeout=600)  # 10 minute timeout
    
except Exception as e:
    if "rate_limit" in str(e):
        print("Rate limited - wait before retrying")
    elif "invalid_input" in str(e):
        print("Fix input and retry")
    else:
        print(f"Unexpected error: {e}")
```

## Integration with Claude Code

When using Parallel AI with Claude Code in artifacts:

```javascript
// JavaScript example for artifacts
const response = await fetch("https://api.parallel.ai/v1/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.PARALLEL_API_KEY
  },
  body: JSON.stringify({
    objective: "Find recent AI breakthroughs",
    max_results: 5,
    mode: "agentic"
  })
});

const data = await response.json();
console.log(data.results);
```

## Advanced Topics

### Basis and Citations

Every Task API response includes `basis` data with citations, confidence levels, and reasoning:

```python
task = client.get_task(task_id)
result = task.result

# Access citations for each field
for field, basis in result.basis.items():
    print(f"{field}:")
    for citation in basis.citations:
        print(f"  - {citation.url}: {citation.excerpt}")
```

### Webhooks for Long Tasks

For tasks taking >10 minutes, use webhooks instead of polling:

```python
task = client.create_task(
    input="Your research query",
    processor="ultra",
    webhook_url="https://your-server.com/webhook",  # Gets POST when done
    metadata={"workflow": "market_research"}
)
```

### Rate Limits

- Task API: 2,000 requests/minute per API key
- Search API: Check documentation for limits
- Returns 429 status if exceeded; implement exponential backoff

## Reference Documentation

For complete API documentation, see [https://docs.parallel.ai](https://docs.parallel.ai)

Key docs to reference:
- [Task API Quickstart](https://docs.parallel.ai/task-api/task-quickstart)
- [Deep Research Guide](https://docs.parallel.ai/task-api/task-deep-research)
- [Search API Best Practices](https://docs.parallel.ai/search/best-practices)
- [Source Policy Guide](https://docs.parallel.ai/resources/source-policy)
- [API Reference](https://docs.parallel.ai/api-reference/search-beta/search)

## Python SDK

Install: `pip install parallel-web`

GitHub: [https://github.com/parallel-web/parallel-cookbook](https://github.com/parallel-web/parallel-cookbook)

PyPI: [https://pypi.org/project/parallel-web/](https://pypi.org/project/parallel-web/)
