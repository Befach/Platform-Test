# Parallel AI Tool Skill - Setup Instructions

## What You Have

A complete Claude Skill for using Parallel AI as a research tool with:
- Web search
- URL data extraction  
- Structured data enrichment
- Market analysis and reports

## Folder Structure

```
parallel-ai-sdk/
├── SKILL.md                    ← Main skill file
└── references/
    ├── api-reference.md        ← Complete API docs
    ├── quick-reference.md      ← Cheat sheet & troubleshooting
    └── research-workflows.md   ← 3 key use case examples
```

## How to Use

### Option 1: Claude.ai Skills Directory (Recommended)

1. Locate your Claude Skills folder:
   - **Mac**: `~/.claude/skills/`
   - **Windows**: `%APPDATA%\Claude\skills\`
   - **Linux**: `~/.config/claude/skills/`

2. Copy the entire `parallel-ai-sdk` folder there

3. Restart Claude

4. Ask Claude: "Research OpenAI for me" or "Search for AI news"

### Option 2: Reference in Chat

If you don't have a skills directory:

1. Keep this folder anywhere in your project
2. When chatting with Claude, say: "I have a Parallel AI skill in /path/to/parallel-ai-sdk"
3. Claude will reference it automatically

## Getting Started

### Step 1: Get API Key
1. Visit https://platform.parallel.ai
2. Sign up and generate an API key
3. Save it securely

### Step 2: Set Environment Variable
```bash
export PARALLEL_API_KEY="your-api-key-here"
```

### Step 3: Ask Claude

Try these prompts:
- "Research OpenAI"
- "Find the latest AI news"
- "What's the current Bitcoin price?"
- "Analyze the SaaS market"

## File Descriptions

| File | Purpose | Size |
|------|---------|------|
| SKILL.md | Main skill - Claude loads first | 2.4 KB |
| api-reference.md | API endpoints & parameters | 2.3 KB |
| quick-reference.md | Quick lookup & troubleshooting | 2.2 KB |
| research-workflows.md | 3 example use cases | 1.6 KB |

**Total: 8.5 KB** (very lightweight, won't bloat context)

## Features

✅ **Search API** - Web search with source filtering
✅ **Extract API** - Scrape data from URLs
✅ **Task API** - Structured data enrichment (company research, etc)
✅ **Deep Research API** - Multi-source analysis & reports

✅ **5 Processors** - From lite (fast, cheap) to ultra (slow, powerful)

✅ **Rate Limits** - 2,000 requests/minute

✅ **Error Handling** - Built-in troubleshooting guide

## Quick Example

When you ask Claude: "Research Anthropic"

Claude will:
1. Use the Task API with the `core` processor
2. Submit your query to Parallel AI
3. Poll for results (typically 1-5 minutes)
4. Return structured data: founding year, employees, products, etc.

Cost: ~$0.025
Time: 1-5 minutes

## Links

- **Parallel AI Docs**: https://docs.parallel.ai
- **Get API Key**: https://platform.parallel.ai
- **Status**: https://status.parallel.ai

## Troubleshooting

**"API key not found"**
- Make sure `PARALLEL_API_KEY` environment variable is set
- `echo $PARALLEL_API_KEY` to verify

**"Rate limited (429)"**
- You hit 2,000 requests/minute limit
- Wait 60 seconds before retrying

**"Empty results"**
- Try broader search terms
- Remove domain filters (source_policy)

**"Task stuck in running"**
- Normal for complex queries (can take up to 25 minutes)
- Keep polling, don't give up

## Support

For issues, check:
1. `quick-reference.md` - Troubleshooting section
2. `api-reference.md` - API details
3. https://docs.parallel.ai - Official documentation

---

**Ready to go!** Just copy this folder and start using it with Claude. 🚀
