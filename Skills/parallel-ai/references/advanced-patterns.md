# Advanced Patterns

# Advanced Parallel AI Patterns

This reference contains advanced usage patterns, edge cases, and production-ready examples.

## Task Lifecycle Management

### Full Async Workflow with Timeout

```python
import asyncio
from parallel_web import ParallelClient

async def research_with_timeout(query: str, timeout_seconds: int = 300):
    client = ParallelClient()
    
    # Create task
    task = await client.create_task(
        input=query,
        processor="pro",
        output_schema={
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "key_findings": {"type": "array", "items": {"type": "string"}},
                "confidence": {"type": "number"}
            }
        }
    )
    
    # Wait with timeout
    try:
        result = await asyncio.wait_for(task.wait(), timeout=timeout_seconds)
        return result.content
    except asyncio.TimeoutError:
        print(f"Task {task.id} still running after {timeout_seconds}s")
        # Can check status later or implement polling
        return None
```

### Polling with Exponential Backoff

```python
import time

def wait_for_task_with_backoff(client, task_id, max_wait=600):
    """Poll task with exponential backoff (2s, 4s, 8s, etc)"""
    backoff = 2
    elapsed = 0
    
    while elapsed < max_wait:
        task = client.get_task(task_id)
        
        if task.status == "completed":
            return task.result
        elif task.status == "failed":
            raise Exception(f"Task failed: {task.error}")
        
        print(f"Waiting... (status: {task.status})")
        time.sleep(backoff)
        elapsed += backoff
        backoff = min(backoff * 2, 30)  # Cap at 30 seconds
    
    raise TimeoutError(f"Task {task_id} did not complete within {max_wait}s")
```

## Batch Processing and Task Groups

### Parallel Company Enrichment

```python
def enrich_companies_batch(company_list: list[str]):
    """Enrich multiple companies concurrently"""
    client = ParallelClient()
    
    tasks = []
    for company in company_list:
        task = client.create_task(
            input=company,
            processor="core",
            output_schema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "founded_year": {"type": "integer"},
                    "headquarters": {"type": "string"},
                    "employee_range": {"type": "string"},
                    "key_products": {"type": "array", "items": {"type": "string"}}
                }
            },
            metadata={"batch_id": "enrichment_001", "company": company}
        )
        tasks.append((company, task.id))
    
    # Check status for all
    results = {}
    for company, task_id in tasks:
        result = wait_for_task_with_backoff(client, task_id)
        results[company] = result.content
    
    return results
```

### Structured Input Processing

```python
def process_company_list(companies_data: list[dict]):
    """Process companies with structured input/output"""
    client = ParallelClient()
    
    input_schema = {
        "type": "object",
        "properties": {
            "company_name": {"type": "string"},
            "industry": {"type": "string"}
        }
    }
    
    output_schema = {
        "type": "object",
        "properties": {
            "market_position": {"type": "string"},
            "competitors": {"type": "array", "items": {"type": "string"}},
            "growth_rate": {"type": "number"}
        }
    }
    
    task = client.create_task(
        input=companies_data[0],  # First company as example
        processor="core",
        input_schema=input_schema,
        output_schema=output_schema
    )
    
    return task
```

## Deep Research for Complex Queries

### Market Research Report Generation

```python
def generate_market_report(market: str, year: int):
    """Generate comprehensive market analysis"""
    client = ParallelClient()
    
    query = f"""
    Provide a comprehensive market analysis for {market} in {year} including:
    - Market size and growth trajectory
    - Key players and market share
    - Emerging trends and disruptions
    - Customer pain points
    - Regulatory landscape
    - Investment opportunities
    """
    
    task = client.create_deep_research(
        input=query,
        processor="ultra",  # Use ultra for deep research
        output_schema="text"  # Returns markdown report
    )
    
    # Deep research can take 5-25 minutes
    result = task.wait(timeout=1800)
    return result.content
```

### Auto Schema Deep Research

```python
def research_competitor(company_name: str):
    """Research competitor with auto-generated schema"""
    client = ParallelClient()
    
    query = f"Provide comprehensive analysis of {company_name} including financials, strategy, and market position"
    
    task = client.create_deep_research(
        input=query,
        processor="pro",
        output_schema="auto"  # Parallel AI generates optimal schema
    )
    
    result = task.wait()
    
    # Result is JSON with nested structure and citations
    # Access basis for verification
    for key, basis in result.basis.items():
        confidence = basis.get("confidence", "unknown")
        print(f"{key}: confidence={confidence}")
    
    return result.content
```

## Source Control and Verification

### Domain-Specific Search

```python
def search_academic_sources(query: str):
    """Search only academic and research domains"""
    client = ParallelClient()
    
    academic_domains = [
        "arxiv.org",
        "scholar.google.com",
        "researchgate.net",
        "ieee.org",
        "nature.com",
        "science.org"
    ]
    
    response = client.search(
        objective=query,
        source_policy={"include_domains": academic_domains},
        max_results=10
    )
    
    return response.results
```

### Financial Data Verification

```python
def search_financial_data(company: str, metric: str):
    """Search verified financial sources only"""
    client = ParallelClient()
    
    trusted_finance_sources = [
        "sec.gov",
        "bloomberg.com",
        "reuters.com",
        "financialservices.com",
        "crunchbase.com"
    ]
    
    response = client.search(
        objective=f"{company} {metric}",
        source_policy={"include_domains": trusted_finance_sources},
        max_results=5
    )
    
    # Verify results have citations
    for result in response.results:
        print(f"URL: {result.url}")
        print(f"Excerpt: {result.excerpt}")
        print(f"Relevance: {result.relevance_score}")
```

## Error Handling and Resilience

### Comprehensive Error Handler

```python
from parallel_web import ParallelError

def safe_task_execution(input_data, processor="core", max_retries=3):
    """Execute task with comprehensive error handling"""
    client = ParallelClient()
    
    for attempt in range(max_retries):
        try:
            task = client.create_task(
                input=input_data,
                processor=processor
            )
            
            result = task.wait(timeout=600)
            return result.content
            
        except Exception as e:
            error_str = str(e).lower()
            
            if "rate_limit" in error_str or "429" in error_str:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited. Waiting {wait_time}s before retry {attempt+1}/{max_retries}")
                time.sleep(wait_time)
                
            elif "invalid_input" in error_str:
                print(f"Invalid input: {e}")
                raise  # Don't retry invalid input
                
            elif "timeout" in error_str:
                if attempt < max_retries - 1:
                    print(f"Timeout. Retrying... ({attempt+1}/{max_retries})")
                else:
                    raise
                    
            else:
                print(f"Unexpected error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(5)  # Brief pause before retry
                else:
                    raise
    
    raise Exception("Max retries exceeded")
```

## Integration Patterns

### REST API Direct Call (Without SDK)

```python
import requests
import os

def direct_api_search(query: str):
    """Use REST API directly without SDK"""
    api_key = os.getenv("PARALLEL_API_KEY")
    
    response = requests.post(
        "https://api.parallel.ai/v1/search",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "parallel-beta": "search-extract-2025-10-10"
        },
        json={
            "objective": query,
            "max_results": 5,
            "mode": "agentic"
        }
    )
    
    if response.status_code != 200:
        print(f"Error: {response.status_code} - {response.text}")
        return None
    
    return response.json()
```

### Task Webhook Processing

```python
from flask import Flask, request

app = Flask(__name__)

@app.route("/parallel-webhook", methods=["POST"])
def handle_task_complete():
    """Receive webhook notification when task completes"""
    data = request.json
    
    task_id = data.get("id")
    status = data.get("status")
    result = data.get("result")
    
    if status == "completed":
        print(f"Task {task_id} completed!")
        # Process result
        process_research_result(result)
    elif status == "failed":
        print(f"Task {task_id} failed: {data.get('error')}")
    
    return {"status": "ok"}
```

## Production Considerations

### Caching Results

```python
import json
from datetime import datetime, timedelta

class ParallelTaskCache:
    def __init__(self, cache_file="parallel_cache.json"):
        self.cache_file = cache_file
        self.cache = self.load_cache()
    
    def load_cache(self):
        try:
            with open(self.cache_file) as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def save_cache(self):
        with open(self.cache_file, "w") as f:
            json.dump(self.cache, f)
    
    def get(self, key, max_age_hours=24):
        if key in self.cache:
            entry = self.cache[key]
            age = datetime.now() - datetime.fromisoformat(entry["timestamp"])
            if age < timedelta(hours=max_age_hours):
                return entry["result"]
        return None
    
    def set(self, key, result):
        self.cache[key] = {
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        self.save_cache()
```

### Monitoring and Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parallel_ai")

def monitored_task_execution(input_data, processor="core"):
    """Execute task with monitoring"""
    client = ParallelClient()
    
    logger.info(f"Creating task: input={input_data[:50]}..., processor={processor}")
    
    task = client.create_task(
        input=input_data,
        processor=processor
    )
    
    logger.info(f"Task created: {task.id}")
    
    try:
        result = task.wait(timeout=600)
        logger.info(f"Task completed: {task.id}")
        return result.content
    except Exception as e:
        logger.error(f"Task failed: {task.id}, error={str(e)}")
        raise
```

## Cost Optimization

### Smart Processor Selection

```python
def choose_processor_by_complexity(query: str) -> str:
    """Select processor based on query complexity"""
    query_lower = query.lower()
    
    # Simple factual queries
    if any(word in query_lower for word in ["what is", "when was", "how many"]):
        if len(query) < 50:
            return "lite"
        else:
            return "base"
    
    # Structured enrichment
    if "enrichment" in query_lower or "company" in query_lower:
        return "core"
    
    # Complex analysis
    if any(word in query_lower for word in ["analysis", "trend", "market", "research"]):
        return "pro"
    
    # Very complex research
    if any(word in query_lower for word in ["competitive", "deep", "comprehensive"]):
        return "ultra"
    
    return "core"  # Default
```

### Batch Cost Calculation

```python
def estimate_batch_cost(batch_size: int, processor: str) -> float:
    """Estimate cost of batch task execution"""
    processor_costs = {
        "lite": 5,
        "base": 10,
        "core": 25,
        "core2x": 50,
        "pro": 100,
        "ultra": 300,
        "ultra2x": 600,
        "ultra4x": 1200,
        "ultra8x": 2400
    }
    
    cost_per_1k = processor_costs.get(processor, 100)
    cost_per_task = cost_per_1k / 1000
    total_cost = batch_size * cost_per_task
    
    return total_cost
```
