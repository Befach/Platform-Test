# Key Research Workflows

## 1. Quick Fact Lookup (30 seconds, $0.01)

Find information quickly.

**Request**:
```json
{
  "objective": "What is the current Bitcoin price?",
  "max_results": 3,
  "mode": "agentic"
}
```

**Use**: Stock prices, quick questions, news, facts

---

## 2. Company Research (5 minutes, $0.025)

Get structured company information.

**Create task**:
```json
{
  "input": "OpenAI",
  "processor": "core",
  "output_schema": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "founded_year": {"type": "integer"},
      "headquarters": {"type": "string"},
      "employee_count": {"type": "integer"},
      "key_products": {"type": "array", "items": {"type": "string"}}
    }
  }
}
```

**Poll**: `GET /task/{task_id}` until status="completed"

**Use**: Company enrichment, lead qualification, research

---

## 3. Market Analysis Report (10 minutes, $0.10)

Comprehensive market intelligence.

**Create task**:
```json
{
  "input": "Analyze the AI chatbot market. Include: size, growth, key players, trends, competitive threats",
  "processor": "pro",
  "output_schema": "text"
}
```

**Poll**: `GET /task/{task_id}` until status="completed"

**Result**: Markdown report with citations

**Use**: Strategic analysis, market research, reports

---

## Cost & Processor Guide

| Task | Processor | Speed | Cost |
|------|-----------|-------|------|
| Simple Q&A | lite | 5-60s | $0.005 |
| Quick data | base | 15-100s | $0.01 |
| Enrichment | core | 1-5m | $0.025 |
| Analysis | pro | 3-9m | $0.10 |
| Deep analysis | ultra | 5-25m | $0.30 |
