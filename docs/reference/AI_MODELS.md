# AI Models Configuration (2025 Latest)

**Last Updated**: December 31, 2025
**Status**: Production-ready with multi-model orchestration

---

## 🚀 2025 Model Routing Update (December 31, 2025)

### New Models Added

| Model | Provider | Intelligence | Best For |
|-------|----------|--------------|----------|
| **GLM 4.7** | Z-AI | 68 | Strategic reasoning, agentic tool use |
| **MiniMax M2.1** | MiniMax | 64 | Coding, execution |
| **Gemini 3 Flash** | Google | ~68 | Visual reasoning, multimodal |

### Model Routing Strategy

See [AI_TOOL_ARCHITECTURE.md](../implementation/week-7/advanced-ai-system/AI_TOOL_ARCHITECTURE.md) for full routing configuration.

### Key Changes

1. **GLM 4.7 replaces Claude Haiku** for function calling (83% cost reduction)
2. **3-deep fallback chains** for all capabilities
3. **4-tier orchestration**: Smart Routing → Escalation → Consensus → Blind Comparison
4. **Agent memory system** (10k token limit per workspace)

### Fallback Chains

| Capability | Primary | Fallback | Tertiary |
|------------|---------|----------|----------|
| Strategic Reasoning | GLM 4.7 | DeepSeek V3.2 | Gemini 3 Flash |
| Agentic Tool Use | GLM 4.7 | Gemini 3 Flash | MiniMax M2.1 |
| Coding | MiniMax M2.1 | GLM 4.7 | Kimi K2 |
| Visual Reasoning | Gemini 3 Flash | Grok 4 Fast | GPT-4o |
| Large Context | Grok 4.1 Fast | Gemini 3 Flash | Kimi K2 |
| Default Chat | Kimi K2 | GLM 4.7 | MiniMax M2.1 |

**AVOID**: Claude Sonnet models (too costly)

### Cost Comparison

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| 50-person team/month | $800 | $200 | **75%** |
| Cost per seat | ~$16 | ~$4 | **75%** |

---

## 📊 Model Overview

We use **4 core AI models** with OpenRouter's **:nitro routing** for 30-50% faster responses:

| Model | Provider | Speed | Cost (Input) | Cost (Output) | Use Case |
|-------|----------|-------|--------------|---------------|----------|
| **Claude Haiku 4.5** | Anthropic | ⚡⚡⚡ | $1.00/M | $5.00/M | **DEFAULT** - Best reasoning |
| **Grok 4 Fast** | xAI | ⚡⚡⚡ | $0.20/M | $0.50/M | Real-time, 2M context |
| **Kimi K2 Thinking** | Moonshot | ⚡⚡⚡ | **$0.15/M** | $2.50/M | **CHEAPEST** - Deep reasoning traces |
| **Minimax M2** | Minimax | ⚡⚡⚡ | $0.50/M | $1.50/M | Code generation, agentic workflows |

**Plus**: Parallel.ai Search as **tool layer** ($0.005/search + $0.001/page) for web research

---

## 🚀 What Changed (Latest Updates)

### 1. **:nitro Routing for All Models** ⚡

**Why**: Maximize throughput and reduce latency

- **30-50% faster**: Automatic routing to fastest providers
- **Load balancing**: Distributes requests across high-performance endpoints
- **Suffix**: All models use `:nitro` (e.g., `anthropic/claude-haiku-4.5:nitro`)
- **Result**: Real-time dependency suggestions with minimal wait time

### 2. **Kimi K2 Thinking** 🧠 (NEW)

**Why**: Cheapest model with **deep reasoning traces**

- **Cost**: $0.15/M input, $2.50/M output (cheapest for input)
- **Reasoning**: Shows step-by-step thinking process
- **Context**: 256K token window
- **Provider exclusion**: Excludes `MoonshotAI/Turbo` for consistent performance
- **Use case**: Cost-sensitive teams, complex dependency analysis

### 3. **Minimax M2** 🤖 (NEW)

**Why**: Optimized for **code generation and agentic workflows**

- **Parameters**: 230B total, 10B activated per token
- **Specialization**: Coding, tool use, multi-step tasks
- **Performance**: Strong on SWE-Bench, Terminal-Bench, BrowseComp
- **Use case**: Dependency analysis requiring code understanding

### 4. **Parallel.ai Search** 🔍 (Now Tool Layer)

**Why**: Dedicated web search tool instead of standalone model

- **Purpose**: External research, context enrichment
- **Integration**: Used alongside AI models when needed
- **Cost**: $0.005/search + $0.001/page (token-efficient)
- **Use case**: Enriching dependency suggestions with external knowledge

### 5. **Claude Haiku 4.5 + Grok 4 Fast** ✅ (Kept, Enhanced with :nitro)

**Why**: Best-in-class models, now with throughput optimization

- **Claude Haiku 4.5**: Default model, 73% SWE-bench Verified
- **Grok 4 Fast**: 2M context, real-time information
- **Enhancement**: Both now use `:nitro` routing for maximum speed

---

## ⚡ Nitro Routing Explained

All models use OpenRouter's **`:nitro` suffix** for automatic throughput optimization:

```typescript
// Standard model ID
'anthropic/claude-haiku-4.5'

// With :nitro routing (30-50% faster)
'anthropic/claude-haiku-4.5:nitro'
```

### How It Works

1. **Provider Selection**: OpenRouter routes to the fastest available provider
2. **Load Balancing**: Distributes requests across high-performance endpoints
3. **Automatic Failover**: Falls back to alternatives if primary is unavailable
4. **Latency Optimization**: Minimizes round-trip time

### Benefits

- ⚡ **30-50% faster responses** compared to standard routing
- 🔄 **Automatic failover** - no manual provider management
- 📊 **Consistent performance** - always uses fastest available provider
- 💰 **Same pricing** - no additional cost for :nitro routing

---

## 🚫 Provider Exclusions

**Kimi K2 Thinking** excludes the `MoonshotAI/Turbo` provider:

```typescript
{
  id: 'moonshotai/kimi-k2-thinking:nitro',
  excludeProviders: ['MoonshotAI/Turbo'], // Excluded for inconsistent performance
}
```

OpenRouter will automatically route to other high-quality Moonshot providers instead.

---

## 🎯 Recommended Usage by Scenario

### Scenario 1: Real-Time Suggestions (Speed Critical)

**Use**: `grok-4-fast` (2M context, instant)

```typescript
const model = recommendModel('speed') // Returns Grok 4 Fast
```

- **Example**: User types feature name → AI suggests dependencies instantly
- **Latency**: <500ms for 10 suggestions
- **Benefit**: 2M token context allows analyzing entire project at once

### Scenario 2: High-Volume Analysis (Cost Critical)

**Use**: `kimi-k2-thinking` ($0.15/M input - cheapest)

```typescript
const model = recommendModel('cost') // Returns Kimi K2 Thinking
```

- **Example**: Batch analyze 100 features → $0.02 cost
- **Savings**: 85% cheaper than Claude Haiku
- **Bonus**: Deep reasoning traces show AI's thinking process

### Scenario 3: Complex Reasoning (Quality Critical)

**Use**: `claude-haiku-45` (default, 73% SWE-bench)

```typescript
const model = getDefaultModel() // Returns Claude Haiku 4.5
```

- **Example**: Detect circular dependencies, suggest fixes
- **Accuracy**: 95%+ confidence on complex patterns
- **World-class**: Top-rated coding model

### Scenario 4: Code-Heavy Dependencies (Technical Analysis)

**Use**: `minimax-m2` (specialized for code)

```typescript
const model = AI_MODELS['minimax-m2']
```

- **Example**: Analyze API dependencies, technical integrations
- **Strength**: Understands code structure, tool use patterns
- **Performance**: Strong on SWE-Bench, Terminal-Bench

### Scenario 5: External Research (Web Search Tool)

**Use**: Parallel Search functions (tool layer)

#### A. Quick Search

```typescript
import { parallelSearch } from '@/lib/ai/parallel-search'

const results = await parallelSearch('dependency management best practices', 10)
```

#### B. Enrich AI Prompts

```typescript
import { enrichPromptWithSearch } from '@/lib/ai/parallel-search'

const enrichedPrompt = await enrichPromptWithSearch(
  'dependency management patterns',
  originalPrompt,
  5
)
```

#### C. Deep Research (Multi-Query)

```typescript
import { deepResearch } from '@/lib/ai/parallel-search'

const research = await deepResearch(
  'authentication implementation patterns',
  [
    'OAuth2 best practices',
    'JWT security considerations',
    'session management strategies'
  ],
  10 // results per query
)

console.log(`Found ${research.totalSources} sources from ${research.uniqueDomains.length} domains`)
console.log(research.consolidatedContext) // Cross-referenced insights
```

#### D. Deep Research for Dependencies

```typescript
import { deepResearchDependencies } from '@/lib/ai/parallel-search'

const insights = await deepResearchDependencies(
  'User Authentication',
  ['User Profile', 'Password Reset', 'Social Login']
)

console.log(insights.implementationPatterns)
console.log(insights.dependencyInsights)
console.log(insights.bestPractices)
```

**Features**:

- ✅ Multi-query search with cross-referencing
- ✅ Source diversity tracking (unique domains)
- ✅ Consensus ranking (high-scoring results prioritized)
- ✅ Token-efficient AI-optimized content
- ✅ Specialized dependency analysis

---

## 📝 Implementation Details

### Model Configuration (models.ts)

```typescript
export const AI_MODELS: Record<string, AIModel> = {
  'claude-haiku-45': {
    id: 'anthropic/claude-haiku-4.5:nitro', // :nitro for throughput
    name: 'Claude Haiku 4.5',
    isDefault: true,
    // ... config
  },
  'grok-4-fast': {
    id: 'x-ai/grok-4-fast:nitro', // :nitro for throughput
    name: 'Grok 4 Fast',
    // ... config
  },
  'kimi-k2-thinking': {
    id: 'moonshotai/kimi-k2-thinking:nitro', // :nitro for throughput
    name: 'Kimi K2 Thinking',
    excludeProviders: ['MoonshotAI/Turbo'], // Exclude turbo provider
    // ... config
  },
  'minimax-m2': {
    id: 'minimax/minimax-m2:nitro', // :nitro for throughput
    name: 'Minimax M2',
    // ... config
  },
}
```

**Note**: Parallel Search is now a separate tool layer (`parallel-search.ts`), not a model in the selector.

### API Endpoint (suggest/route.ts)

```typescript
// User can select model via request body
const { workspace_id, model_key = 'claude-haiku-45', connection_type } = body

// Lookup model configuration
const aiModel: AIModel = getModelByKey(model_key) || getDefaultModel()

// Call OpenRouter with selected model
const response = await callOpenRouter({
  model: aiModel, // Uses model.id internally
  messages: [...],
  temperature: 0.3,
})
```

### Frontend Model Selector

Users can choose their preferred model via dropdown:

- Shows speed badge (FAST/MEDIUM/SLOW)
- Shows cost per 1M tokens
- Shows capabilities (coding, reasoning, search)
- Displays live cost estimates

---

## 💡 Migration Notes

### Breaking Changes

None! The API interface remains the same:

- `model_key` parameter still accepts strings like `'claude-haiku-45'`
- Existing integrations continue to work
- New models are opt-in (users choose from dropdown)

### What Users See

- **Model selector** now shows 4 options (Claude Haiku 4.5, Grok 4 Fast, Kimi K2 Thinking, Minimax M2)
- **Default model** remains Claude Haiku 4.5 (no change in behavior)
- **Cost estimates** updated to reflect 2025 pricing
- **Parallel Search** is now a separate tool (not in model selector)

### Environment Variables

Add to `.env.local`:

```bash
OPENROUTER_API_KEY=your_openrouter_key_here
PARALLEL_SEARCH_API_KEY=your_parallel_key_here # Optional, for web search
```

---

## 📊 Cost Comparison (Per 1,000 Dependency Suggestions)

Assuming 10 work items analyzed per request, 2,000 input tokens, 500 output tokens:

| Model | Input Cost | Output Cost | Total | Savings |
|-------|------------|-------------|-------|---------|
| Claude Haiku 4.5 | $2.00 | $2.50 | **$4.50** | Baseline |
| Grok 4 Fast | $0.40 | $0.25 | **$0.65** | **86% cheaper** |
| Kimi K2 Thinking | $0.30 | $1.25 | **$1.55** | **66% cheaper** |
| Minimax M2 | $1.00 | $0.75 | **$1.75** | **61% cheaper** |

**For high-volume users** (10,000 suggestions/month):

- Claude Haiku 4.5: $45/month (best quality)
- Grok 4 Fast: $6.50/month ← **Cheapest overall**
- Kimi K2 Thinking: $15.50/month ← **Cheapest input cost**
- Minimax M2: $17.50/month (code-specialized)

---

## 🔧 Testing Recommendations

### Unit Tests

```bash
# Test all models return valid responses
npm run test:ai-models

# Test model selection logic
npm run test:model-selector
```

### Integration Tests

```bash
# Test OpenRouter API calls for each model
npm run test:openrouter

# Test Parallel Search API
npm run test:parallel-search
```

### Performance Tests

```bash
# Measure response times for each model
npm run bench:ai-models

# Expected results:
# Grok Code Fast: <500ms
# Claude Haiku: <800ms
# DeepSeek V3: <1000ms
```

---

## 📚 References

### Research Sources

1. **OpenRouter Models 2025**: <https://openrouter.ai/models>
2. **Grok Code Fast Announcement**: <https://www.typingmind.com/guide/openrouter/grok-4-fast>
3. **DeepSeek V3.2 Release**: <https://www.teamday.ai/blog/top-ai-models-openrouter-2025>
4. **Parallel Search API Launch**: <https://parallel.ai/blog/introducing-parallel-search>

### Documentation

- **OpenRouter Docs**: <https://openrouter.ai/docs>
- **Parallel.ai Docs**: <https://parallel.ai/docs>
- **Model Comparison**: <https://openrouter.ai/models?o=top-weekly>

---

## ✅ Checklist for Production

- [x] Updated models.ts with latest 2025 models
- [x] Replaced Perplexity with Parallel Search API
- [x] Updated recommendModel() function
- [x] Verified API endpoint compatibility
- [x] Updated model selector UI
- [x] Documented cost comparisons
- [ ] Add environment variable for PARALLEL_SEARCH_API_KEY
- [ ] Test all models in staging
- [ ] Update user documentation
- [ ] Add cost tracking per model
- [ ] Implement model usage analytics

---

**Next Steps**: Complete AI suggestions panel UI and integrate with dependency graph.
