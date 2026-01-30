<!-- OPENSPEC:START -->
Open `openspec/AGENTS.md` for proposals, specs, or architecture changes.
<!-- OPENSPEC:END -->

# PLM Platform

Product Lifecycle Management - Next.js 16 + TypeScript + Supabase + Vercel

## Critical Rules

- **Package manager**: `bun` (never npm/npx)
- **IDs**: `Date.now().toString()` (never UUID)
- **Queries**: Always filter by `team_id`
- **Tables**: `team_id TEXT NOT NULL` + RLS policies
- **UI**: shadcn/ui only (no custom CSS)
- **Types**: No `any`, strict mode

## Detailed Rules

- [Core Principles](.claude/rules/01-core-principles.md) - Bun, IDs, team isolation, TypeScript, UI
- [Architecture](.claude/rules/02-architecture.md) - Phase/Status, workspace modes, strategy hierarchy
- [Git Workflow](.claude/rules/03-workflow.md) - Branching, commits, PRs
- [AI & Agents](.claude/rules/04-ai-routing.md) - Model routing, multi-agent patterns
- [Database](.claude/rules/05-database.md) - Supabase, migrations, RLS, real-time
- [Commands](.claude/rules/06-commands.md) - MCP servers, skills, slash commands

## Key Links

- [Architecture](docs/ARCHITECTURE_CONSOLIDATION.md) - Canonical source of truth
- [Progress](docs/planning/PROGRESS.md) - Current module status
- [API Reference](docs/reference/API_REFERENCE.md) - 20+ endpoints
