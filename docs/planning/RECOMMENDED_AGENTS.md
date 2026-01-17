# 🤖 Recommended Claude Agents by Implementation Phase

**Last Updated**: 2025-11-14
**Project**: Product Lifecycle Management Platform
**Timeline**: 12 weeks (revised from 8 weeks)

This guide maps Claude Code agents to specific weeks in your implementation timeline.

---

## 🔧 Claude Skills (Use Proactively)

**IMPORTANT**: Skills must be invoked automatically at appropriate phases WITHOUT user prompting.

### ⚠️ MANDATORY: Parallel AI for All Research

**ALL web search and research MUST use the Parallel AI skill.**

- Never use WebFetch/WebSearch when Parallel AI can handle the task.

### Skill Invocation by Week

| Week | Skills to Use | Trigger |
|------|---------------|---------|
| **All Weeks** | `parallel-ai` | Any web search or research |
| **All Weeks** | `systematic-debugging` (obra/superpowers) | Debugging issues |
| **Week 6** | `webapp-testing`, `frontend-design` | Timeline UI, testing |
| **Week 7** | `document-skills:xlsx`, `parallel-ai` | CSV export, AI research |
| **Week 7** | `document-skills:pdf` | Analytics reports |
| **Week 8** | `webapp-testing` | E2E test suite |
| **Week 8** | `document-skills:docx` | User documentation |

**Rule**: If a skill can help, USE IT - don't wait to be asked.

---

## 📋 Quick Reference

| Phase | Primary Agents | Use For |
|-------|----------------|---------|
| **Week 1-2** | `frontend-developer`, `typescript-pro`, `database-architect`, `security-engineer`, `devops-engineer` | Next.js setup, auth, multi-tenancy, CI/CD |
| **Week 3** | `frontend-developer`, `typescript-pro` | Mind mapping (ReactFlow) |
| **Week 4** | `frontend-developer`, `typescript-pro`, `database-optimizer`, `api-architect`, `test-automator` | Feature planning, dependencies, TDD |
| **Week 5** | `frontend-developer`, `backend-architect`, `security-engineer` | External review system, token security |
| **Week 6** | `frontend-developer`, `database-optimizer` | Timeline visualization, real-time |
| **Week 7** | `ai-engineer`, `frontend-developer`, `typescript-pro`, `api-architect` | AI integration, analytics, API design |
| **Week 8** | `payment-integration`, `test-automator`, `docs-architect`, `typescript-pro`, `security-engineer`, `devops-engineer` | Billing, testing, security audit, launch |

---

## Week 1-2: Foundation & Multi-Tenancy

### Primary Agents

#### `frontend-developer`

**Use for:**

- Next.js 15 project initialization
- App Router setup (app directory structure)
- Auth pages (`/app/(auth)/login/page.tsx`, `/signup/page.tsx`)
- Protected route middleware
- Dashboard layout (`/app/(dashboard)/layout.tsx`)
- Navigation sidebar component
- Team/workspace switchers

**Example prompts:**

```
"Create the Next.js 15 app structure with TypeScript and App Router"
"Build the authentication pages using Supabase Auth with magic links"
"Implement the dashboard layout with collapsible sidebar navigation"
```

---

#### `typescript-pro`

**Use for:**

- TypeScript configuration (`tsconfig.json`)
- Generating Supabase types from schema
- Type definitions for features, workspaces, teams
- Zod validation schemas
- Generic type utilities

**Example prompts:**

```
"Generate TypeScript types from Supabase schema"
"Create Zod schemas for feature and workspace validation"
"Set up strict TypeScript configuration for Next.js 15"
```

---

#### `database-architect`

**Use for:**

- Multi-tenant schema design
- Tables: `users`, `teams`, `team_members`, `subscriptions`, `workspaces`
- Row-Level Security (RLS) policies
- Indexes for performance
- Migration scripts

**Example prompts:**

```
"Design a multi-tenant schema with team isolation and RLS policies"
"Create migration for mind_maps, mind_map_nodes, and mind_map_edges tables"
"Set up RLS policies to enforce team-level data access"
```

---

#### `security-engineer`

**Use for:**

- Authentication implementation (Supabase Auth)
- JWT token validation
- API route protection
- Environment variable security
- OWASP security best practices
- Input validation and sanitization

**Example prompts:**

```
"Review authentication implementation for security vulnerabilities"
"Implement secure API route protection with middleware"
"Set up environment variable validation for sensitive keys"
"Audit the multi-tenant implementation for data leakage risks"
```

---

#### `devops-engineer`

**Use for:**

- CI/CD pipeline setup (GitHub Actions)
- Vercel project configuration
- Environment variable management
- Build optimization
- Preview deployment strategy

**Example prompts:**

```
"Set up GitHub Actions workflow for automated testing and deployment"
"Configure Vercel project with proper environment variables"
"Create preview deployment strategy for pull requests"
"Optimize Next.js build configuration for production"
```

---

## Week 3: Mind Mapping (CRITICAL FEATURE)

### Primary Agents

#### `frontend-developer`

**Use for:**

- ReactFlow integration
- Custom node components (5 types: idea, feature, epic, module, user-story)
- Drag-and-drop canvas
- Zoom/pan controls
- Real-time collaboration (live cursors)
- Export functionality (PNG, SVG, JSON)

**Example prompts:**

```
"Build a ReactFlow canvas component with custom node types"
"Create 5 custom node components for mind mapping with different icons and styles"
"Implement drag-and-drop positioning and connection creation"
"Add real-time collaboration with Supabase Realtime"
```

---

#### `typescript-pro`

**Use for:**

- ReactFlow types (Node, Edge, CustomNodeData)
- Mind map state management types
- Canvas position and viewport types

**Example prompts:**

```
"Create TypeScript types for ReactFlow custom nodes with 5 node types"
"Define types for mind map canvas state and Supabase sync"
```

---

## Week 4: Feature Planning & Dependencies

### Primary Agents

#### `frontend-developer`

**Use for:**

- Dashboard feature cards
- Feature list (grid/table view)
- Feature CRUD modals
- Dependency graph (ReactFlow)
- Link types (dependency, blocks, complements, relates)
- Critical path visualization

**Example prompts:**

```
"Build a feature card component with timeline breakdown and difficulty badges"
"Create a dependency graph using ReactFlow with 4 link types"
"Implement critical path highlighting in the dependency graph"
```

---

#### `typescript-pro`

**Use for:**

- Feature type definitions
- Dependency graph types
- Timeline item types
- Linked item types and relationships
- Type guards for feature validation

**Example prompts:**

```
"Create comprehensive TypeScript types for features, timeline items, and dependencies"
"Define discriminated unions for different link types"
"Build type guards to validate feature relationships"
```

---

#### `database-optimizer`

**Use for:**

- Query optimization for feature loading
- Indexing strategies for `features`, `timeline_items`, `linked_items`
- Circular dependency detection query
- Performance tuning for large feature sets

**Example prompts:**

```
"Optimize the query for loading features with timeline items and dependencies"
"Create indexes for workspace_id, team_id, and created_at columns"
"Write a SQL function to detect circular dependencies in linked_items"
```

---

#### `api-architect`

**Use for:**

- API route design for feature CRUD
- RESTful endpoint patterns
- Request/response validation
- Error handling middleware
- API documentation

**Example prompts:**

```
"Design RESTful API routes for feature management"
"Implement consistent error handling across all API routes"
"Create API validation middleware using Zod schemas"
"Document API endpoints with OpenAPI/Swagger"
```

---

#### `test-automator`

**Use for:**

- TDD setup for feature CRUD
- Unit tests for business logic
- Integration tests for API routes
- Test fixtures and factories
- Jest configuration

**Example prompts:**

```
"Set up Jest and React Testing Library for component testing"
"Write TDD tests for feature creation, update, and deletion"
"Create test fixtures for features and timeline items"
"Implement integration tests for feature API routes"
```

---

## Week 5: External Review System

### Primary Agents

#### `frontend-developer`

**Use for:**

- Review link generator modal (3 tabs: invite, public, iframe)
- External review page (`/app/public/review/[token]/page.tsx`)
- Feedback form (ratings, comments, attachments)
- Review dashboard (team view)
- Iframe embed view

**Example prompts:**

```
"Create a review link generator with three sharing methods"
"Build an external review page with no authentication required"
"Implement a feedback form with star ratings and file uploads"
```

---

#### `backend-architect`

**Use for:**

- Review link token generation
- Email invitation system (Resend API)
- Feedback submission API route
- Access control for external reviews
- Expiration date logic

**Example prompts:**

```
"Implement secure token generation for review links"
"Build email invitation system using Resend API"
"Create API route for public feedback submission with validation"
```

---

#### `security-engineer`

**Use for:**

- Review link token security
- Rate limiting for public endpoints
- CSRF protection for feedback forms
- XSS prevention in feedback content
- Access control validation
- Token expiration enforcement

**Example prompts:**

```
"Audit review link token generation for security vulnerabilities"
"Implement rate limiting for public feedback submission"
"Add CSRF protection to external review forms"
"Validate and sanitize user-submitted feedback content"
```

---

## Week 6: Timeline Visualization & Execution

### Primary Agents

#### `frontend-developer`

**Use for:**

- Timeline component (react-big-calendar or vis-timeline)
- Gantt chart rendering
- Drag-to-reschedule functionality
- Swimlanes (by team, status, category)
- Dependency arrows (SVG)
- Real-time cursors and presence

**Example prompts:**

```
"Integrate react-big-calendar for timeline visualization"
"Implement drag-to-reschedule with date validation against dependencies"
"Create swimlanes grouped by team with color-coded features"
"Add SVG arrows connecting dependent features on timeline"
```

---

#### `database-optimizer`

**Use for:**

- Real-time subscription setup (Supabase Realtime)
- Performance optimization for timeline queries
- Presence tracking (online users)
- Activity feed queries

**Example prompts:**

```
"Set up Supabase Realtime subscriptions for workspace changes"
"Optimize query for loading features with dates for timeline view"
"Implement presence tracking for online team members"
```

---

## Week 7: AI Integration & Analytics

### Primary Agents

#### `ai-engineer`

**Use for:**

- OpenRouter API integration
- Model routing logic (Claude Haiku, Perplexity, Grok)
- Tool calling implementation (20+ AI tools)
- Streaming chat responses (Server-Sent Events)
- Usage tracking (messages per user per month)
- Approval workflow for agentic actions

**Example prompts:**

```
"Integrate OpenRouter API with model routing based on task type"
"Implement streaming chat with Server-Sent Events"
"Build tool calling system with 20+ AI tools for feature management"
"Create approval workflow for AI actions with preview/diff view"
"Track AI usage per user and enforce monthly quotas"
```

---

#### `frontend-developer`

**Use for:**

- AI chat panel (left sidebar)
- Agentic panel (right sidebar)
- Inline AI suggestions
- Custom dashboard builder (drag-and-drop widgets)
- Chart widgets (10 types: line, bar, pie, scatter, etc.)
- AI insights widget

**Example prompts:**

```
"Build AI chat panel with streaming message display"
"Create agentic panel with tool approval workflow"
"Implement custom dashboard builder with drag-and-drop widgets"
"Build 10 chart widget types using Recharts"
```

---

#### `typescript-pro`

**Use for:**

- AI message types and chat state
- Tool calling types and schemas
- Analytics dashboard types
- Chart data types
- Custom dashboard configuration types

**Example prompts:**

```
"Create TypeScript types for AI chat messages and streaming state"
"Define types for AI tool calling system with 20+ tools"
"Build types for custom dashboard configuration and widget data"
"Implement types for analytics queries and chart data"
```

---

#### `api-architect`

**Use for:**

- OpenRouter API integration patterns
- Streaming SSE endpoint design
- AI tool API routes
- Analytics API endpoints
- Usage tracking API

**Example prompts:**

```
"Design API routes for OpenRouter integration with streaming"
"Implement SSE endpoint for real-time AI chat streaming"
"Create API routes for AI tool execution with approval workflow"
"Build analytics API endpoints with aggregation and filtering"
```

---

## Week 8: Billing, Testing & Launch

### Primary Agents

#### `payment-integration`

**Use for:**

- Razorpay integration (Orders, Subscriptions, Customer Portal)
- Webhook handling (subscription events)
- Feature gates (5 users on Free, Pro features)
- Usage enforcement (AI messages per month)
- Billing settings page

**Note**: Using Razorpay instead of Stripe (Stripe is invite-only in India).

**Example prompts:**

```
"Integrate Razorpay Orders for Pro plan subscription"
"Implement Razorpay webhook handler for subscription lifecycle events"
"Create feature gates to limit Free users to 5 team members"
"Build billing settings page with usage indicators and upgrade CTA"
```

---

#### `test-automator`

**Use for:**

- Playwright E2E test suite
- Test scenarios (auth, team creation, feature CRUD, billing)
- Jest unit tests (permissions, billing logic)
- Test fixtures and mocks
- CI/CD integration (GitHub Actions)

**Example prompts:**

```
"Create Playwright E2E tests for authentication and onboarding flow"
"Write tests for team creation, invites, and feature CRUD operations"
"Implement unit tests for permission checks and billing calculations"
"Set up GitHub Actions workflow for automated testing"
```

---

#### `docs-architect`

**Use for:**

- User documentation (getting started, feature walkthroughs)
- Developer documentation (architecture, API reference)
- Self-hosting guide (Docker, environment variables)
- Migration guide (from vanilla app to Next.js)
- README, CONTRIBUTING, CODE_OF_CONDUCT

**Example prompts:**

```
"Create comprehensive user documentation for all 10 modules"
"Write developer documentation including architecture and API reference"
"Build self-hosting guide with Docker Compose setup"
"Generate README with setup instructions and feature overview"
```

---

#### `typescript-pro`

**Use for:**

- Payment types (Razorpay webhooks, subscriptions)
- Test types and mock data
- E2E test page object models
- Type-safe environment variable validation

**Example prompts:**

```
"Create TypeScript types for Razorpay webhook events"
"Define types for test fixtures and mock data"
"Build type-safe environment variable validation schema"
"Implement page object model types for Playwright tests"
```

---

#### `security-engineer`

**Use for:**

- Security audit (OWASP top 10)
- Penetration testing recommendations
- Dependency vulnerability scanning
- Production security checklist
- API security review
- Payment security validation

**Example prompts:**

```
"Perform comprehensive security audit for OWASP top 10 vulnerabilities"
"Review Razorpay integration for security best practices"
"Audit all API routes for authentication and authorization issues"
"Create production security checklist and deployment guidelines"
```

---

#### `devops-engineer`

**Use for:**

- Production deployment strategy
- Environment variable management (Vercel)
- Monitoring and logging setup
- Performance optimization
- CDN and edge configuration
- Backup and disaster recovery

**Example prompts:**

```
"Create production deployment checklist and rollback strategy"
"Configure Vercel environment variables for staging and production"
"Set up monitoring and alerting for critical application metrics"
"Optimize Next.js production build for performance and caching"
```

---

## Cross-Cutting Agents (Use Throughout)

### `code-reviewer`

**Use after completing features:**

- Code quality checks
- Security vulnerability scanning
- Performance optimization suggestions
- Best practices enforcement

**Example prompts:**

```
"Review the mind mapping implementation for security and performance issues"
"Check the Razorpay integration for security best practices"
```

---

### `debugger`

**Use when encountering issues:**

- Error investigation
- Stack trace analysis
- Environment debugging
- Performance bottlenecks

**Example prompts:**

```
"Debug the Supabase Realtime subscription not updating in real-time"
"Investigate why dependency arrows are not rendering correctly"
```

---

## 🎯 Agent Selection Tips

1. **Start with specialized agents** - Use specific agents like `payment-integration` for Razorpay, `security-engineer` for auth
2. **Fall back to general agents** - Use `frontend-developer` if no specialized agent exists
3. **Combine agents** - Launch multiple agents in parallel for complex tasks
4. **Use `code-reviewer` proactively** - Review code after each major feature
5. **Security first** - Always use `security-engineer` for auth, payments, and external-facing features
6. **Type safety throughout** - Use `typescript-pro` beyond just setup (Weeks 1-2, 3, 4, 7, 8)
7. **Test early and often** - Start TDD in Week 4, not just Week 8
8. **API consistency** - Use `api-architect` for all API route design (Weeks 4, 7, 8)
9. **DevOps from day one** - Set up CI/CD in Week 1, not just at launch

---

## 📊 Optimization Summary

**Total Agents Available**: 50+ specialized agents
**Project-Recommended Agents**: 15 primary + cross-cutting

**Primary Agents by Week**:

- **Week 1-2**: `frontend-developer`, `typescript-pro`, `database-architect`, `security-auditor`, `deployment-engineer`
- **Week 3**: `frontend-developer`, `typescript-pro`
- **Week 4**: `frontend-developer`, `typescript-pro`, `database-optimizer`, `api-design-principles`, `test-automator`
- **Week 5**: `frontend-developer`, `backend-architect`, `security-auditor`
- **Week 6**: `frontend-developer`, `database-optimizer`
- **Week 7**: `ai-engineer`, `frontend-developer`, `typescript-pro`, `api-design-principles`
- **Week 8**: `payment-integration`, `test-automator`, `docs-architect`, `security-auditor`, `deployment-engineer`

**Cross-Cutting Agents** (use throughout):

- `code-reviewer` - After each major feature
- `debugger` - When encountering issues
- `Explore` - For codebase exploration
- `Plan` - For architecture decisions

**Configuration Score**: 10/10

---

## 📝 How to Use This Guide

```bash
# Week 3: Mind Mapping
You: "Launch frontend-developer and typescript-pro agents in parallel to build the mind mapping canvas with ReactFlow"

# Week 7: AI Integration
You: "Launch ai-engineer agent to implement OpenRouter integration with tool calling"

# Week 8: Testing
You: "Launch test-automator agent to create Playwright E2E test suite"
```

---

## 🔄 Multi-Agent Orchestration Patterns

### Pattern 1: Parallel Specialists

**Use when**: Feature needs multiple specializations simultaneously

**Example - Mind Mapping Canvas**:

```
Launch in SINGLE message:
1. frontend-developer → Build ReactFlow canvas UI
2. typescript-pro → Create MindMapNode, MindMapEdge types
3. database-architect → Design mind_maps, mind_map_nodes tables
```

### Pattern 2: Sequential Pipeline

**Use when**: Output of one agent feeds into another

**Example - New API Endpoint**:

```
Step 1: api-architect → Design endpoint structure, request/response shape
Step 2: typescript-pro → Create TypeScript types from design
Step 3: test-automator → Write tests first (TDD)
Step 4: backend implementation → Build the actual endpoint
Step 5: frontend-developer → Create UI to consume the API
```

### Pattern 3: Review Gate

**Use when**: Critical feature needs quality assurance before merge

**Example - Payment Integration**:

```
1. payment-integration → Implement Razorpay Orders/Subscriptions
2. security-auditor → Audit for vulnerabilities, webhook security
3. test-automator → E2E payment flow tests
4. code-reviewer → Final quality check
```

### Pattern 4: Exploration → Implementation

**Use when**: Uncertain scope or multiple valid approaches

**Example - Performance Optimization**:

```
1. Explore agent → Identify bottlenecks (queries, renders, network)
2. [Choose based on findings]:
   - database-optimizer → If DB queries are slow
   - frontend-developer → If render performance issues
   - devops-engineer → If infrastructure/caching needed
3. debugger → Verify improvements
```

### Context Handoff Protocol

When switching agents mid-feature:

```
## Handoff to [next-agent]

### Completed by [previous-agent]:
- [List completed items]
- Files modified: [paths]
- Key decisions: [choices made and why]

### Your Task:
- [Specific deliverables]
- Build upon: [what to reference/extend]
- Constraints: [any limitations or requirements]
- Success criteria: [how to know when done]
```

---

## 📚 Complete Agent Catalog

### Core Agents (Built-in)

| Agent | Use For |
|-------|---------|
| `Explore` | Fast codebase exploration, file searching, pattern discovery |
| `Plan` | Designing implementation plans, architecture decisions |
| `general-purpose` | Multi-step tasks, complex research |

### Frontend & UI

| Agent | Use For |
|-------|---------|
| `frontend-developer` | React 19, Next.js 15, components, state, accessibility |
| `ui-ux-designer` | Interface designs, wireframes, design systems |
| `ui-visual-validator` | Screenshot analysis, visual regression testing |

### Backend & API

| Agent | Use For |
|-------|---------|
| `backend-architect` | API design, microservices, distributed systems |
| `fastapi-pro` | FastAPI, async APIs, Pydantic V2 |
| `django-pro` | Django 5.x, DRF, Celery |
| `graphql-architect` | GraphQL federation, performance, security |
| `api-design-principles` | REST/GraphQL API design standards |

### Database

| Agent | Use For |
|-------|---------|
| `database-architect` | Schema design, technology selection, modeling |
| `database-optimizer` | Query optimization, indexing, N+1 resolution |
| `database-admin` | Cloud databases, automation, reliability |
| `sql-pro` | Complex queries, OLTP/OLAP optimization |
| `database-migration` | Zero-downtime migrations, data transformation |

### TypeScript & JavaScript

| Agent | Use For |
|-------|---------|
| `typescript-pro` | Advanced types, generics, strict type safety |
| `javascript-pro` | ES6+, async patterns, Node.js |
| `typescript-advanced-types` | Conditional types, mapped types, utilities |
| `nodejs-backend-patterns` | Express/Fastify, middleware, API patterns |

### Testing & Quality

| Agent | Use For |
|-------|---------|
| `test-automator` | AI-powered test automation, CI/CD integration |
| `tdd-orchestrator` | Red-green-refactor discipline, TDD governance |
| `e2e-testing-patterns` | Playwright, Cypress, reliable test suites |
| `code-reviewer` | Code quality, security scanning, performance |

### Security

| Agent | Use For |
|-------|---------|
| `security-auditor` | DevSecOps, vulnerability assessment, compliance |
| `backend-security-coder` | Input validation, authentication, API security |
| `frontend-security-coder` | XSS prevention, client-side security |
| `auth-implementation-patterns` | JWT, OAuth2, session management, RBAC |

### DevOps & Cloud

| Agent | Use For |
|-------|---------|
| `deployment-engineer` | CI/CD pipelines, GitOps, deployment automation |
| `cloud-architect` | AWS/Azure/GCP, IaC, FinOps |
| `kubernetes-architect` | K8s, service mesh, GitOps |
| `terraform-specialist` | IaC automation, state management |
| `devops-troubleshooter` | Incident response, debugging, observability |

### AI & ML

| Agent | Use For |
|-------|---------|
| `ai-engineer` | LLM applications, RAG systems, agents |
| `prompt-engineer` | Prompting techniques, LLM optimization |
| `ml-engineer` | PyTorch, TensorFlow, model serving |
| `rag-implementation` | Vector databases, semantic search |

### Payments & Billing

| Agent | Use For |
|-------|---------|
| `payment-integration` | Stripe, PayPal, checkout flows, PCI compliance |
| `billing-automation` | Recurring payments, subscriptions, invoicing |

### Documentation

| Agent | Use For |
|-------|---------|
| `docs-architect` | Technical documentation, architecture guides |
| `api-documenter` | OpenAPI 3.1, developer portals |
| `tutorial-engineer` | Step-by-step tutorials, educational content |

### Debugging & Performance

| Agent | Use For |
|-------|---------|
| `debugger` | Error investigation, stack traces, issues |
| `performance-engineer` | OpenTelemetry, load testing, optimization |
| `observability-engineer` | Monitoring, logging, SLI/SLO management |

### Other Languages

| Agent | Use For |
|-------|---------|
| `python-pro` | Python 3.12+, async, uv, ruff |
| `golang-pro` | Go 1.21+, concurrency, microservices |
| `rust-pro` | Rust 1.75+, systems programming |
| `java-pro` | Java 21+, Spring Boot 3.x |
| `csharp-pro` | C#, .NET, enterprise patterns |

---

**Last Updated**: 2025-12-08
**Project**: Product Lifecycle Management Platform
**Timeline**: 8 weeks
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Vercel
