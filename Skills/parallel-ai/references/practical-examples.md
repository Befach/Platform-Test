# Practical Examples

# Parallel AI Practical Examples

Copy-paste ready examples for common use cases.

## Use Case 1: Company Enrichment Pipeline

Enrich a CSV of companies with founding date, headquarters, and employee count.

```python
import csv
from parallel_web import ParallelClient

def enrich_companies_from_csv(input_file: str, output_file: str):
    client = ParallelClient()
    
    enriched_data = []
    
    with open(input_file) as f:
        reader = csv.DictReader(f)
        for row in reader:
            company_name = row['company_name']
            print(f"Enriching {company_name}...")
            
            task = client.create_task(
                input=company_name,
                processor="core",
                output_schema={
                    "type": "object",
                    "properties": {
                        "company": {"type": "string"},
                        "founded": {"type": "integer"},
                        "headquarters": {"type": "string"},
                        "employees": {"type": "string"}
                    }
                }
            )
            
            # Wait for completion
            import time
            while task.status != "completed":
                time.sleep(2)
                task = client.get_task(task.id)
            
            enriched_row = {**row, **task.result.content}
            enriched_data.append(enriched_row)
    
    # Write results
    if enriched_data:
        with open(output_file, 'w', newline='') as f:
            fieldnames = list(enriched_data[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(enriched_data)
    
    print(f"Enrichment complete. Results saved to {output_file}")

# Usage
enrich_companies_from_csv("companies.csv", "companies_enriched.csv")
```

## Use Case 2: Product Research Assistant

Research product categories and competitors.

```python
def research_product_category(category: str):
    """Get market overview, top products, and pricing for a category"""
    client = ParallelClient()
    
    research_queries = [
        f"top products in {category} market 2024",
        f"{category} average pricing",
        f"{category} market leaders",
    ]
    
    results = {}
    
    for query in research_queries:
        print(f"Searching: {query}")
        response = client.search(
            objective=query,
            max_results=3
        )
        
        results[query] = []
        for result in response.results:
            results[query].append({
                "title": result.title,
                "url": result.url,
                "excerpt": result.excerpt
            })
    
    return results

# Usage
research = research_product_category("AI chatbots")
for query, findings in research.items():
    print(f"\n{query}:")
    for finding in findings:
        print(f"  - {finding['title']}")
        print(f"    URL: {finding['url']}")
```

## Use Case 3: Lead Qualification

Verify and enrich sales leads.

```python
def qualify_lead(company_name: str, industry: str):
    """Check if company is legitimate and get key metrics"""
    client = ParallelClient()
    
    task = client.create_task(
        input=company_name,
        processor="base",  # Fast processor for quick qualification
        output_schema={
            "type": "object",
            "properties": {
                "exists": {"type": "boolean"},
                "industry_match": {"type": "boolean"},
                "estimated_size": {"type": "string"},
                "web_presence": {"type": "boolean"},
                "recommendation": {"type": "string", "enum": ["ACCEPT", "REJECT", "REVIEW"]}
            }
        }
    )
    
    # Fast - usually 15-100 seconds with base processor
    import time
    while task.status != "completed":
        time.sleep(1)
        task = client.get_task(task.id)
    
    return task.result.content

# Usage
lead = qualify_lead("TechStartup Inc", "Software")
if lead["recommendation"] == "ACCEPT":
    print(f"Lead qualified: {lead}")
else:
    print(f"Lead rejected: {lead}")
```

## Use Case 4: Competitive Intelligence

Track competitor activities and news.

```python
def track_competitor(company_name: str):
    """Get recent news and activities about a competitor"""
    client = ParallelClient()
    
    queries = [
        f"{company_name} product launch 2024",
        f"{company_name} funding round",
        f"{company_name} partnerships",
        f"{company_name} executive changes"
    ]
    
    intel = {}
    
    for query in queries:
        print(f"Tracking: {query}")
        response = client.search(
            objective=query,
            search_queries=[query],
            max_results=3
        )
        
        intel[query] = [
            {
                "title": r.title,
                "excerpt": r.excerpt[:200],
                "url": r.url
            }
            for r in response.results
        ]
    
    return intel

# Usage
intel = track_competitor("OpenAI")
print("\n=== Competitive Intelligence ===")
for topic, findings in intel.items():
    print(f"\n{topic}:")
    for finding in findings:
        print(f"  {finding['title']}")
```

## Use Case 5: Job Market Analysis

Analyze job market for specific roles and skills.

```python
def analyze_job_market(role: str, location: str):
    """Research job market for a specific role"""
    client = ParallelClient()
    
    task = client.create_deep_research(
        input=f"""
        Analyze the job market for {role} positions in {location}.
        Include: salary ranges, required skills, hiring trends, 
        top employers, and growth outlook.
        """,
        processor="pro",
        output_schema="text"  # Get markdown report
    )
    
    # Deep research takes time (5-25 min with pro processor)
    print("Starting market analysis... this may take several minutes")
    result = task.wait(timeout=1800)
    
    return result.content

# Usage
report = analyze_job_market("Machine Learning Engineer", "San Francisco")
print(report)
```

## Use Case 6: Website Data Extraction

Extract structured data from specific websites.

```python
def extract_pricing_page(url: str):
    """Extract pricing information from a website"""
    client = ParallelClient()
    
    response = client.extract(
        url=url,
        objective="Extract all pricing plans, features, and costs"
    )
    
    return response.data

# Usage
pricing = extract_pricing_page("https://www.anthropic.com/pricing")
print(pricing)
```

## Use Case 7: Research Newsletter Generator

Generate weekly research summaries for specific topics.

```python
import json
from datetime import datetime

def generate_research_summary(topic: str, week_of: datetime):
    """Generate comprehensive research summary for newsletter"""
    client = ParallelClient()
    
    task = client.create_deep_research(
        input=f"""
        Provide a comprehensive summary of recent developments, news, and trends 
        in {topic} for the week of {week_of.strftime('%B %d, %Y')}.
        
        Include:
        - Major announcements and product launches
        - Key industry trends
        - Investment/funding news
        - Regulatory changes
        - Expert opinions and forecasts
        """,
        processor="ultra",
        output_schema="text"
    )
    
    print(f"Generating research summary for {topic}...")
    result = task.wait(timeout=1800)
    
    return {
        "topic": topic,
        "week_of": week_of.isoformat(),
        "generated_at": datetime.now().isoformat(),
        "content": result.content,
        "citations": result.basis if hasattr(result, 'basis') else {}
    }

# Usage
from datetime import datetime, timedelta
this_week = datetime.now() - timedelta(days=datetime.now().weekday())
summary = generate_research_summary("Artificial Intelligence", this_week)
print(json.dumps(summary, indent=2))
```

## Use Case 8: Customer Review Analysis

Analyze and summarize customer reviews from multiple sources.

```python
def analyze_product_reviews(product_name: str):
    """Find and analyze reviews across the web"""
    client = ParallelClient()
    
    search_terms = [
        f'"{product_name}" reviews',
        f'{product_name} customer feedback',
        f'{product_name} rating reddit'
    ]
    
    all_reviews = []
    
    for term in search_terms:
        response = client.search(
            objective=f"Find customer reviews and ratings for {product_name}",
            search_queries=[term],
            max_results=5
        )
        
        for result in response.results:
            all_reviews.append({
                "source": result.url,
                "title": result.title,
                "excerpt": result.excerpt
            })
    
    # Now get synthesis of reviews
    task = client.create_task(
        input=json.dumps(all_reviews),
        processor="core",
        output_schema={
            "type": "object",
            "properties": {
                "overall_sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
                "average_rating": {"type": "number"},
                "key_pros": {"type": "array", "items": {"type": "string"}},
                "key_cons": {"type": "array", "items": {"type": "string"}},
                "recommendation": {"type": "string"}
            }
        }
    )
    
    import time
    while task.status != "completed":
        time.sleep(2)
        task = client.get_task(task.id)
    
    return task.result.content

# Usage
analysis = analyze_product_reviews("Claude")
print(f"Sentiment: {analysis['overall_sentiment']}")
print(f"Rating: {analysis['average_rating']}")
print(f"Pros: {', '.join(analysis['key_pros'])}")
```

## Use Case 9: Real Estate Market Research

Research local real estate markets.

```python
def analyze_real_estate_market(location: str, property_type: str = "residential"):
    """Research real estate market for a location"""
    client = ParallelClient()
    
    task = client.create_deep_research(
        input=f"""
        Analyze the {property_type} real estate market in {location}.
        Include: average prices, price trends, top neighborhoods, 
        market activity, inventory levels, and forecast.
        """,
        processor="pro",
        output_schema="auto"
    )
    
    print(f"Analyzing {location} real estate market...")
    result = task.wait(timeout=1800)
    
    return result.content

# Usage
market = analyze_real_estate_market("Austin, Texas", "residential")
print(market)
```

## Use Case 10: Error Handling Wrapper

Reusable wrapper with built-in error handling.

```python
import time
from typing import Any, Optional

class ResilientParallelClient:
    def __init__(self, api_key: str, max_retries: int = 3):
        from parallel_web import ParallelClient
        self.client = ParallelClient(api_key=api_key)
        self.max_retries = max_retries
    
    def execute_task_safe(
        self,
        input_data: Any,
        processor: str = "core",
        output_schema: Optional[dict] = None,
        timeout: int = 600
    ) -> Optional[dict]:
        """Execute task with built-in retry logic"""
        
        for attempt in range(self.max_retries):
            try:
                task = self.client.create_task(
                    input=input_data,
                    processor=processor,
                    output_schema=output_schema
                )
                
                result = task.wait(timeout=timeout)
                return result.content
                
            except Exception as e:
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"Attempt {attempt+1} failed: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"All {self.max_retries} attempts failed")
                    return None
        
        return None

# Usage
client = ResilientParallelClient(api_key="your-key")
result = client.execute_task_safe(
    input_data="OpenAI",
    processor="core"
)
```
