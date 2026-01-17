# MCP Usage Guide

**Last Updated**: 2025-11-15
**Purpose**: Comprehensive guide for using Model Context Protocol (MCP) servers in the project

---

## Active MCP Servers

The project uses **5 active MCP servers** for enhanced development capabilities:

1. **Supabase MCP** - Database management, migrations, real-time
2. **Playwright MCP** - E2E testing and browser automation
3. **Parallel Search MCP** - Multi-source web search for AI research
4. **Parallel Task MCP** - Task orchestration and automation
5. **Vercel MCP** - Deployment management and monitoring

---

## Supabase MCP (Essential)

### When to Use

- Creating database migrations (`CREATE TABLE`, `ALTER TABLE`, RLS policies)
- Running complex queries (joins, aggregations, transactions)
- Setting up real-time subscriptions
- Generating TypeScript types from schema
- Optimizing queries and indexes
- Creating PostgreSQL functions and triggers

### Example Prompts

**Database Migrations**:

```
"Create migration for mind_maps table with team_id and RLS policies"
"Add indexes to features table for team_id and workspace_id"
"Create RLS policies for team-based access to workspaces table"
```

**Real-time Subscriptions**:

```
"Set up Supabase Realtime subscriptions for workspace changes"
"Create real-time listener for features table filtered by team_id"
```

**TypeScript Generation**:

```
"Generate TypeScript types from current schema"
"Update TypeScript types after adding mind_maps table"
```

**Query Optimization**:

```
"Optimize the query for loading features with timeline_items"
"Add composite index for (team_id, workspace_id, created_at)"
"Analyze slow query for dashboard analytics"
```

### Advanced Usage

**Complex Migration with Functions**:

```
"Create migration that:
1. Adds 'status' column to features table
2. Creates trigger to update updated_at timestamp
3. Adds CHECK constraint for status enum values
4. Updates RLS policies to include status filtering"
```

**Performance Analysis**:

```
"Analyze the performance of queries in the features module"
"Suggest indexes for improving dashboard load times"
"Identify N+1 query issues in the current schema"
```

---

## Playwright MCP (Testing)

### When to Use

- Creating E2E test suites (Week 8)
- Testing user flows (auth, feature CRUD, mind mapping)
- Stripe payment testing (test mode)
- Screenshot capture for documentation
- CI/CD integration (GitHub Actions)

### Example Prompts

**E2E Test Creation**:

```
"Create Playwright tests for authentication and onboarding flow"
"Generate E2E tests for the review system with public links"
"Write tests for feature creation, editing, and deletion"
```

**Interactive Testing**:

```
"Test the mind map canvas drag-and-drop functionality"
"Test real-time collaboration features with multiple users"
"Test Stripe checkout flow in test mode"
```

**Visual Testing**:

```
"Capture screenshots of all dashboard pages for documentation"
"Take screenshots of mobile responsive layouts"
```

### Advanced Usage

**Complete Flow Testing**:

```
"Create E2E test for complete user journey:
1. Sign up with magic link
2. Create workspace
3. Add features to roadmap
4. Create review link
5. Submit feedback as external reviewer
6. View analytics dashboard"
```

**CI/CD Integration**:

```
"Set up Playwright tests to run in GitHub Actions on every PR"
"Configure parallel test execution for faster CI/CD"
"Add visual regression testing to CI pipeline"
```

---

## Parallel Search MCP (AI Research)

### When to Use

- Multi-source web search (Tavily, Perplexity, Exa, Brave)
- Competitive analysis and market research (Week 7)
- Knowledge base population with web sources
- AI-powered content discovery
- Real-time trend analysis
- Semantic search across multiple engines

### Example Prompts

**Best Practices Research**:

```
"Search for best practices in product roadmap management"
"Find latest UX patterns for mind mapping interfaces"
"Research modern approaches to dependency visualization"
```

**Competitive Analysis**:

```
"Find competitive analysis on similar SaaS platforms"
"Research pricing strategies for PLM tools"
"Analyze feature sets of top 5 roadmap management tools"
```

**Technical Research**:

```
"Research latest trends in AI-powered product planning tools"
"Gather information on mind mapping UX patterns"
"Find best practices for multi-tenant SaaS architectures"
```

**Knowledge Base Building**:

```
"Search for comprehensive guides on ReactFlow best practices"
"Find technical documentation on Supabase real-time features"
"Gather resources on building AI agents with tool calling"
```

### Advanced Usage

**Multi-Source Comparison**:

```
"Search across Tavily, Perplexity, and Exa for:
- Current state of AI-powered product management
- Comparison with traditional roadmap tools
- Market trends and user preferences
Synthesize findings into a competitive analysis report"
```

**Trend Analysis**:

```
"Track trends in product management SaaS over the past year:
- Popular features being added
- Pricing model evolution
- Integration priorities
Identify opportunities for differentiation"
```

---

## Parallel Task MCP (Automation)

### When to Use

- Multi-agent task orchestration
- Complex workflow automation
- Parallel task execution
- Task dependency management
- Automated testing workflows
- CI/CD pipeline integration

### Example Prompts

**Parallel Execution**:

```
"Orchestrate database migration, frontend build, and deployment in parallel"
"Run unit tests, E2E tests, and linting in parallel"
```

**Complex Workflows**:

```
"Automate the workflow for feature creation, testing, and deployment"
"Set up multi-step task pipeline for code review and testing"
"Coordinate parallel tasks for schema updates across multiple tables"
```

**CI/CD Automation**:

```
"Create automation pipeline that:
1. Runs migrations on staging
2. Builds Next.js app
3. Runs tests in parallel
4. Deploys to Vercel
5. Runs smoke tests"
```

### Advanced Usage

**Multi-Agent Coordination**:

```
"Orchestrate parallel tasks with dependencies:
1. Agent A: Create migration file
2. Agent B: Update TypeScript types (waits for A)
3. Agent C: Write API routes (waits for B)
4. Agent D: Write tests (waits for C)
5. Agent E: Deploy (waits for D)"
```

**Automated Refactoring**:

```
"Coordinate refactoring across multiple files:
- Update all feature references to work_items
- Update database queries
- Update TypeScript types
- Update API routes
- Run tests to verify"
```

---

## Vercel MCP (Deployment)

### When to Use

- Production deployments
- Environment variable management
- Build monitoring and logs
- Domain configuration
- Preview deployments
- Performance analytics

### Example Prompts

**Deployment**:

```
"Deploy to production and verify environment variables"
"Create preview deployment for feature branch"
```

**Monitoring**:

```
"Check build logs for the latest deployment"
"Monitor performance metrics for production deployment"
"Check for deployment errors in the last 24 hours"
```

**Configuration**:

```
"Set up custom domain with SSL"
"Update environment variables for production"
"Configure build settings for optimal performance"
```

### Advanced Usage

**Deployment Pipeline**:

```
"Set up automated deployment pipeline:
1. Deploy to staging on push to develop
2. Run E2E tests on staging URL
3. Deploy to production on merge to main
4. Monitor for errors
5. Rollback if error rate > threshold"
```

**Performance Optimization**:

```
"Analyze production deployment metrics:
- Build time trends
- Bundle size over time
- Core Web Vitals
- API response times
Suggest optimizations"
```

---

## MCP Best Practices

### 1. When to Use MCPs vs. Direct Commands

**Use MCP when**:

- ✅ Complex operations requiring context (migrations, complex queries)
- ✅ Multi-step workflows (test creation, deployment pipelines)
- ✅ Operations requiring domain expertise (search strategies, test patterns)
- ✅ Integration with external services (Supabase, Vercel, search engines)

**Use direct commands when**:

- ✅ Simple file operations (read, write, edit)
- ✅ Basic git commands (status, commit, push)
- ✅ Simple npm commands (install, run dev)

### 2. Combining MCPs

MCPs can work together for complex workflows:

```
"Using Supabase MCP: Create migration for new analytics table
Then using Parallel Task MCP: Generate TypeScript types and update API routes in parallel
Finally using Playwright MCP: Create E2E tests for analytics dashboard"
```

### 3. Error Handling

When MCP operations fail:

1. **Read error messages carefully** - MCPs provide detailed context
2. **Check prerequisites** - Ensure dependencies exist (tables, APIs, etc.)
3. **Verify permissions** - RLS policies, API keys, environment variables
4. **Try incremental approach** - Break complex operations into steps

### 4. Context Optimization

To reduce token usage:

- ✅ Be specific in prompts (table names, exact operations)
- ✅ Reference existing patterns ("Create migration similar to mind_maps")
- ✅ Use docs cross-references ("Follow pattern in CODE_PATTERNS.md")
- ❌ Don't repeat full context every time

---

## MCP Integration Patterns

### Pattern 1: Database-First Development

```
1. Supabase MCP: Design and create migration
2. Supabase MCP: Generate TypeScript types
3. Code: Implement API routes using types
4. Playwright MCP: Create E2E tests
5. Vercel MCP: Deploy and monitor
```

### Pattern 2: Feature Development Workflow

```
1. Parallel Search MCP: Research best practices
2. Code: Implement feature based on research
3. Supabase MCP: Add database tables if needed
4. Playwright MCP: Create tests
5. Parallel Task MCP: Run all checks in parallel
6. Vercel MCP: Deploy to preview
```

### Pattern 3: Testing & Deployment Pipeline

```
1. Code: Make changes
2. Parallel Task MCP: Run linting, type-check, unit tests in parallel
3. Playwright MCP: Run E2E tests
4. Vercel MCP: Deploy to staging
5. Playwright MCP: Run smoke tests on staging
6. Vercel MCP: Deploy to production
```

---

## Troubleshooting

### Supabase MCP Issues

**Problem**: Migration fails with RLS error
**Solution**: Check team_members table exists and has correct structure

**Problem**: TypeScript types not updating
**Solution**: Run `npx supabase gen types typescript --local > lib/supabase/types.ts`

### Playwright MCP Issues

**Problem**: Tests fail in CI but pass locally
**Solution**: Check for timing issues, add explicit waits

**Problem**: Element not found
**Solution**: Use `data-testid` attributes, avoid brittle selectors

### Parallel Search MCP Issues

**Problem**: Search returns no results
**Solution**: Refine query, try different search engines

**Problem**: Rate limiting
**Solution**: Space out requests, use caching

### Vercel MCP Issues

**Problem**: Build fails
**Solution**: Check environment variables, build logs

**Problem**: Deployment stuck
**Solution**: Check Vercel dashboard, may need to cancel and redeploy

---

## Quick Reference

| Task | MCP | Example Prompt |
|------|-----|----------------|
| Create migration | Supabase | "Create migration for X table with RLS" |
| Run E2E tests | Playwright | "Test user flow for X feature" |
| Research patterns | Parallel Search | "Find best practices for X" |
| Automate workflow | Parallel Task | "Orchestrate X, Y, Z in parallel" |
| Deploy to prod | Vercel | "Deploy and verify environment variables" |
| Optimize queries | Supabase | "Analyze query performance for X" |
| Test payments | Playwright | "Test Stripe checkout flow" |
| Market research | Parallel Search | "Competitive analysis for X" |
| CI/CD setup | Parallel Task | "Set up pipeline for testing and deployment" |
| Monitor deployment | Vercel | "Check build logs and performance metrics" |

---

## Summary

**Key Takeaways**:

1. **Supabase MCP**: Database operations, migrations, real-time
2. **Playwright MCP**: Testing user flows, visual testing, CI/CD
3. **Parallel Search MCP**: Research, competitive analysis, knowledge building
4. **Parallel Task MCP**: Workflow automation, parallel execution, CI/CD
5. **Vercel MCP**: Deployment, monitoring, performance optimization

**Remember**: MCPs are tools that work best when:

- Prompts are specific and contextual
- Operations are complex enough to benefit from automation
- Multiple MCPs are combined for comprehensive workflows

---

**See Also**:

- [Main Implementation Plan](../implementation/README.md)
