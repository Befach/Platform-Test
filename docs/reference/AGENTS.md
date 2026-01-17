# Agents & AI Services Reference

Complete documentation of all agents, AI models, libraries, and external services used in the Product Lifecycle Management Platform.

---

## 1. AI Models (via OpenRouter Gateway)

All AI models are accessed through the **OpenRouter API** - a unified gateway for multiple AI providers.

| Model | Provider | Purpose | Pricing (per 1M tokens) |
|-------|----------|---------|-------------------------|
| **Claude Haiku 4.5** | Anthropic | Default model, semantic analysis, best reasoning | $1.00 input / $5.00 output |
| **GLM 4.7** | Z-AI | Strategic reasoning, agentic tool use, function calling | Primary for tool use |
| **Grok 4 Fast** | xAI | Real-time info, 2M context window, speed-critical tasks | $0.20 input / $0.50 output |
| **Kimi K2 Thinking** | Moonshot | Cost-effective deep reasoning, 256K context | $0.15 input (cheapest) |
| **MiniMax M2.1** | MiniMax | Coding, technical analysis, 230B parameters | $0.50 input / $1.50 output |
| **Gemini 3 Flash** | Google | Visual reasoning, multimodal analysis | Vision analysis |

### Model Routing Features

- `:nitro` suffix for automatic throughput optimization (30-50% faster)
- 3-deep fallback chains for all capabilities
- Capability-based routing (not model-name-based)

### Download/Access

- **OpenRouter**: <https://openrouter.ai/>
- **API Documentation**: <https://openrouter.ai/docs>

---

## 2. AI SDKs & Frameworks

### Installation

```bash
# Core AI SDK
npm install ai @ai-sdk/react

# OpenRouter Provider
npm install @openrouter/ai-sdk-provider

# Assistant UI Components
npm install @assistant-ui/react @assistant-ui/react-ai-sdk
```

### Package Details

| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `ai` | v5.0.104 | Vercel AI SDK core | <https://sdk.vercel.ai/docs> |
| `@ai-sdk/react` | v2.0.104 | React hooks for streaming & tool use | <https://sdk.vercel.ai/docs> |
| `@openrouter/ai-sdk-provider` | v1.5.4 | OpenRouter provider plugin | <https://openrouter.ai/docs> |
| `@assistant-ui/react` | v0.11.53 | UI components for AI assistants | <https://www.assistant-ui.com/> |

---

## 3. External Services

### Database & Authentication - Supabase

```bash
npm install @supabase/supabase-js @supabase/ssr
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | v2.89.0 | PostgreSQL client, Auth, Real-time |
| `@supabase/ssr` | v0.8.0 | Server-side auth handling |

- **Sign up**: <https://supabase.com/>
- **Documentation**: <https://supabase.com/docs>

---

### Web Search & Research - Parallel.ai

| Service | Purpose | Cost |
|---------|---------|------|
| Parallel.ai Search | Web search, context enrichment, deep research | $0.005/search + $0.001/page |

**Features:**

- `parallelSearch()` - Single query web search
- `deepResearch()` - Multi-query cross-referencing
- `deepResearchDependencies()` - Dependency analysis

- **API**: <https://parallel.ai/>
- **Documentation**: <https://docs.parallel.ai/>

---

### Email - Zoho ZeptoMail

```bash
npm install zeptomail
```

| Package | Version | Purpose |
|---------|---------|---------|
| `zeptomail` | latest | Transactional email (invitations, notifications) |

- **Sign up**: <https://www.zoho.com/zeptomail/>
- **Documentation**: <https://www.zoho.com/zeptomail/help/>

---

### Payments - Razorpay

```bash
npm install razorpay
```

| Package | Version | Purpose |
|---------|---------|---------|
| `razorpay` | latest | Payment processing, subscriptions |

- **Sign up**: <https://razorpay.com/>
- **Documentation**: <https://razorpay.com/docs/>

---

### Monitoring - Vercel Speed Insights

```bash
npm install @vercel/speed-insights
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@vercel/speed-insights` | v1.3.1 | Performance monitoring |

- **Documentation**: <https://vercel.com/docs/speed-insights>

---

## 4. MCP Servers (Minimal - Context Efficient)

Only essential MCP. Other tools use CLI for context efficiency.

| Server | Purpose | Install Command |
|--------|---------|-----------------|
| **Context7 MCP** | Real-time library documentation | `claude mcp add context7 --scope user` |

**CLI-Based (No MCP - More Context Efficient):**

- Supabase → `supabase` CLI
- Playwright → `npx playwright` CLI
- GitHub → `gh` CLI
- Vercel → `vercel` CLI
- shadcn/ui → `npx shadcn-ui` CLI
- Filesystem → Built-in tools

- **MCP Documentation**: <https://modelcontextprotocol.io/>

---

## 5. Agentic Tools (38+ Built-in Tools)

These tools are built into the platform for AI-assisted workflows.

### Creation Tools

| Tool | Purpose |
|------|---------|
| `createWorkItem` | Create features, bugs, enhancements |
| `createTask` | Create execution tasks |
| `createFeatureFromFeedback` | Convert user feedback to features |
| `createMindMapNode` | Add nodes to mind maps |
| `createTemplate` | Create workspace templates |

### Analysis Tools

| Tool | Purpose |
|------|---------|
| `analyzeFeedback` | Analyze user feedback sentiment & themes |
| `suggestDependencies` | Recommend feature dependencies |
| `detectRisks` | Identify project risks |
| `analyzeProgress` | Progress analysis & reporting |
| `compareAlternatives` | Compare implementation approaches |

### Optimization Tools

| Tool | Purpose |
|------|---------|
| `prioritizeFeatures` | Calculate feature priorities |
| `balanceWorkload` | Distribute team workload |
| `estimateEffort` | Time/story point estimation |
| `optimizeTimeline` | Schedule optimization |
| `suggestSequencing` | Dependency-based sequencing |

### Strategy Tools

| Tool | Purpose |
|------|---------|
| `alignToStrategy` | Strategic alignment analysis |
| `suggestOKRs` | OKR generation |
| `improveAcceptanceCriteria` | Quality improvement suggestions |
| `validateSuccessMetrics` | Metric validation |
| `mapToInitiatives` | Initiative mapping |

---

## 6. UI & Visualization Libraries

### Installation

```bash
# Mind Mapping & Graphs
npm install @xyflow/react

# Charts & Analytics
npm install recharts

# Rich Content Editing
npm install @blocksuite/affine @blocksuite/presets

# AI Response Rendering
npm install react-markdown react-syntax-highlighter
```

### Package Details

| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `@xyflow/react` | v12.10.0 | Mind mapping canvas, dependency graphs | <https://reactflow.dev/> |
| `recharts` | v3.6.0 | Analytics dashboards, charts | <https://recharts.org/> |
| `@blocksuite/affine` | v0.18.7 | Rich content editing | <https://blocksuite.io/> |
| `react-markdown` | v10.1.0 | AI-generated markdown rendering | <https://github.com/remarkjs/react-markdown> |
| `react-syntax-highlighter` | v16.1.0 | Code highlighting in AI responses | <https://github.com/react-syntax-highlighter/react-syntax-highlighter> |

---

## 7. State Management

### Installation

```bash
npm install zustand @tanstack/react-query react-hook-form
```

### Package Details

| Package | Version | Purpose | Documentation |
|---------|---------|---------|---------------|
| `zustand` | v5.0.8 | Global state management | <https://zustand.docs.pmnd.rs/> |
| `@tanstack/react-query` | v5.90.15 | Server state management | <https://tanstack.com/query> |
| `react-hook-form` | v7.69.0 | Form state management | <https://react-hook-form.com/> |

---

## 8. Claude Code Agents (Recommended by Phase)

These are specialized Claude agents recommended for different implementation phases.

### Foundation Phase

| Agent | Purpose |
|-------|---------|
| `frontend-developer` | UI/Next.js setup |
| `typescript-pro` | Types & configuration |
| `database-architect` | Schema design |
| `security-engineer` | Auth & security |
| `devops-engineer` | CI/CD pipelines |

### AI Integration Phase

| Agent | Purpose |
|-------|---------|
| `ai-engineer` | OpenRouter integration, tool use |
| `api-architect` | OpenRouter API routes |

### Cross-Cutting Agents

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Code quality review |
| `debugger` | Issue investigation |
| `Explore` | Codebase exploration |
| `Plan` | Architecture decisions |

---

## 9. Code Review Tools

### Greptile

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Greptile | AI-powered code review, PR analysis | `greptile.json` |

- **Sign up**: <https://greptile.com/>
- **Documentation**: <https://docs.greptile.com/>

---

## 10. Complete Installation Commands

### All Packages at Once

```bash
# AI-related packages
npm install ai @ai-sdk/react @openrouter/ai-sdk-provider @assistant-ui/react @assistant-ui/react-ai-sdk

# Database & Auth
npm install @supabase/supabase-js @supabase/ssr

# External Services
npm install razorpay zeptomail @vercel/speed-insights

# UI & Visualization
npm install @xyflow/react recharts @blocksuite/affine @blocksuite/presets react-markdown react-syntax-highlighter

# State Management
npm install zustand @tanstack/react-query react-hook-form
```

---

## 11. Key Configuration Files

| File | Purpose |
|------|---------|
| `next-app/src/lib/ai/models.ts` | Model definitions & configuration |
| `next-app/src/lib/ai/models-config.ts` | Capability-based routing config |
| `next-app/src/lib/ai/tools/` | Tool implementations |
| `CLAUDE.md` | Master project guidelines |
| `greptile.json` | AI code review config |
| `docs/reference/AI_MODELS.md` | Detailed model documentation |

---

## 12. Environment Variables Required

Create a `.env.local` file with these variables:

```env
# OpenRouter - AI Model Gateway
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase - Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay - Payments
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Zoho ZeptoMail - Email
ZEPTOMAIL_API_KEY=your_zeptomail_api_key

# Parallel.ai - Web Search
PARALLEL_API_KEY=your_parallel_api_key
```

---

## Quick Links

| Service | Sign Up | Documentation |
|---------|---------|---------------|
| OpenRouter | <https://openrouter.ai/> | <https://openrouter.ai/docs> |
| Supabase | <https://supabase.com/> | <https://supabase.com/docs> |
| Razorpay | <https://razorpay.com/> | <https://razorpay.com/docs/> |
| Zoho ZeptoMail | <https://www.zoho.com/zeptomail/> | <https://www.zoho.com/zeptomail/help/> |
| Parallel.ai | <https://parallel.ai/> | <https://docs.parallel.ai/> |
| Vercel | <https://vercel.com/> | <https://vercel.com/docs> |
| Greptile | <https://greptile.com/> | <https://docs.greptile.com/> |

---

## 13. Claude Code Plugins & Marketplaces

### Plugin Marketplaces

```bash
/plugin marketplace add wshobson/agents
/plugin marketplace add netresearch/claude-code-marketplace
/plugin marketplace add claude-market/marketplace
```

### Plugins to Install (from wshobson/agents)

| Plugin | Purpose |
|--------|---------|
| `javascript-typescript` | Next.js 15 app development |
| `backend-development` | API architecture |
| `frontend-development` | React/UI components |
| `database-design` | Supabase schemas |
| `security-scanning` | SAST security |
| `full-stack-orchestration` | End-to-end workflows |
| `tdd-workflows` | Test-driven development |
| `code-review` | Quality assurance |
| `llm-applications` | OpenRouter AI integration |

```bash
/plugin install javascript-typescript
/plugin install backend-development
/plugin install frontend-development
/plugin install database-design
/plugin install security-scanning
/plugin install full-stack-orchestration
/plugin install tdd-workflows
/plugin install code-review
/plugin install llm-applications
```

### Skills to Install (from netresearch)

| Skill | Purpose |
|-------|---------|
| `git-workflow-skill` | Git branching & Conventional Commits |
| `github-project-skill` | GitHub repository setup |
| `security-audit-skill` | OWASP security audit patterns |
| `cli-tools-skill` | Auto-install 74+ CLI tools |
| `claude-coach-plugin` | Self-improving learning system |

```bash
/plugin install git-workflow-skill
/plugin install github-project-skill
/plugin install security-audit-skill
/plugin install cli-tools-skill
/plugin install claude-coach-plugin
```

---

## 14. OpenSpec Workflow (Spec-Driven Development)

### Installation

```bash
npm install -g @fission-ai/openspec@latest
openspec init
```

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/openspec:proposal [feature]` | Create proposal with specs & tasks |
| `/openspec:apply [change]` | Implement tasks |
| `/openspec:archive [change]` | Merge & archive completed change |

### OPSX Actions (Experimental - Fluid Workflow)

| Action | Purpose |
|--------|---------|
| `/opsx:explore` | Think through ideas |
| `/opsx:new` | Initiate change with schema |
| `/opsx:continue` | Create next artifact |
| `/opsx:ff` | Fast-forward all planning |
| `/opsx:apply` | Implement tasks |
| `/opsx:sync` | Merge delta specs |
| `/opsx:archive` | Complete & archive |

### CLI Commands

```bash
openspec list          # View active changes
openspec view          # Interactive dashboard
openspec validate      # Validate change
openspec update        # Refresh agent instructions
```

### Workflow

1. `/openspec:proposal` → Draft proposal & specs
2. Review & validate with `openspec validate`
3. `/openspec:apply` → Implement tasks
4. `/openspec:archive` → Merge & archive

- **OpenSpec**: <https://github.com/Fission-AI/OpenSpec>
- **OPSX Workflow**: <https://github.com/Fission-AI/OpenSpec/blob/main/docs/experimental-workflow.md>
