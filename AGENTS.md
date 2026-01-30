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

## Task Tracking Strategy

We use a **three-tier system** for managing work across sessions and agents:

### 1. TodoWrite (Claude Tasks) - Session Memory
**Scope**: Single coding session
**Visibility**: Claude Code only
**Persistence**: Ephemeral (cleared when session ends)

**When to use**:
- Tracking active work during current session
- Breaking down implementation into steps
- Monitoring progress as you code

**Example (TDD Pattern - Tests Written UPFRONT)**:
```markdown
TodoWrite (TDD):
  1. ✓ Write test: payments table migration validation (RED)
  2. ✓ Create migration for payments table (GREEN)
  3. ✓ Write test: RLS policies verification (RED)
  4. ✓ Add RLS policies (GREEN)
  5. ☐ Write test: webhook handler tests (RED)
  6. ☐ Implement webhook handler (GREEN)
  7. ☐ Write test: UI component tests (RED)
  8. ☐ Add UI components (GREEN)
  9. ☐ Write test: E2E payment flow (RED)
  10. ☐ Implement E2E integration (GREEN)
  11. ☐ Refactor: optimize and clean up
```

**Note**: All development uses TDD approach - tests written before implementation.

### 2. Beads - Persistent Issue Tracker
**Scope**: Multi-session, long-running
**Visibility**: ALL agents (Claude, Cursor, Windsurf, etc.)
**Persistence**: Git-backed (`.beads/issues.jsonl`)

**When to use**:
- Features spanning multiple sessions
- Bugs that need tracking
- Work that multiple agents might touch
- Cross-agent coordination

**Commands**:
```bash
bd create "Add Stripe payment integration"        # Create issue
bd list --ready                                   # Show unblocked tasks
bd show <id>                                      # View details
bd update <id> --status in_progress               # Update status
bd update <id> --status blocked --comment "reason" # Mark blocked
bd update <id> --status done                      # Complete
bd sync                                           # Commit + push
```

**Status values**: `not_started`, `in_progress`, `blocked`, `done`

### 3. OpenSpec - Strategic Proposals
**Scope**: Architecture changes, major features
**Visibility**: ALL agents (git-backed)
**Persistence**: Permanent record in `openspec/changes/`

**When to use**:
- New features requiring design approval
- Breaking changes
- Architecture shifts
- Performance/security patterns

**Commands**:
```bash
openspec list                          # Active proposals
openspec list --specs                  # Current capabilities
openspec show <change-id>              # View details
openspec validate <change-id> --strict # Validate proposal
openspec archive <change-id> --yes     # Mark complete
```

### Decision Framework

| Type of Work | System | Duration | Example |
|--------------|--------|----------|---------|
| **In-session steps** | TodoWrite | Minutes-Hours | "5 steps to implement login" |
| **Tactical issues** | Beads | Hours-Days | "Fix auth validation bug" |
| **Strategic work** | OpenSpec | Days-Weeks | "Add OAuth2 authentication" |

### Workflow Integration

#### **Single-Agent, Single-Session** (Quick Fix)
```bash
# Use TodoWrite only (even quick fixes use TDD when applicable)
TodoWrite (TDD):
  1. ☐ Write test: component renders correctly (RED)
  2. ☐ Fix typo in component (GREEN)
  3. ☐ Verify test passes
  4. ☐ Commit and push

# No Beads/OpenSpec needed for simple fixes
```

#### **Multi-Session Feature** (Standard)
```bash
# Day 1: Create Beads issue
bd create "Implement user profile editing"
bd show <id>  # Status: not_started

# Start session with TodoWrite (TDD - Tests UPFRONT)
TodoWrite (TDD):
  1. ☐ Write test: component structure tests (RED)
  2. ☐ Design component structure (GREEN)
  3. ☐ Write test: API endpoint tests (RED)
  4. ☐ Create API endpoint (GREEN)
  5. ☐ Write test: UI form tests (RED)
  6. ☐ Build UI form (GREEN)
  7. ☐ Write test: validation tests (RED)
  8. ☐ Add validation (GREEN)
  9. ☐ Refactor: optimize and clean up

# Work on tasks, marking complete as you go
# End of day
bd update <id> --status in_progress --comment "Completed API and UI structure"
bd sync && git push

# Day 2: Continue
bd show <id>  # See previous progress
# Use TodoWrite for remaining tasks
# When done
bd update <id> --status done
bd sync && git push
```

#### **Multi-Agent Workflow** (Collaboration)
```bash
# Agent 1 (Claude Code): Planning
bd create "Add real-time notifications"
openspec proposal create add-notifications
# Write proposal.md, tasks.md
git add openspec/ && git commit -m "proposal: real-time notifications"
bd update <id> --status in_progress
git push && bd sync

# Agent 2 (Cursor): Implementation
git pull && bd sync
bd show <id>  # See status
openspec show add-notifications  # Read proposal
# Implement from tasks.md
git push && bd sync

# Agent 3 (Claude Code): Review
git pull && bd sync
bd show <id>
# Code review
bd update <id> --status done
openspec archive add-notifications --yes
git push && bd sync
```

#### **Strategic Feature** (Architecture Change)
```bash
# 1. Create OpenSpec proposal (requires approval)
openspec proposal create add-two-factor-auth
# Write: proposal.md, tasks.md, design.md, spec deltas

# 2. Create Beads issue for tracking
bd create "Implement 2FA system (see openspec/changes/add-two-factor-auth)"

# 3. Request approval (PR)
git add openspec/ && git commit -m "proposal: two-factor authentication"
git push

# 4. After approval, implement with TodoWrite (TDD - Tests UPFRONT)
bd update <id> --status in_progress
TodoWrite (TDD):
  1. ☐ Write test: 2FA tables migration validation (RED)
  2. ☐ Add 2FA tables (migration) (GREEN)
  3. ☐ Write test: TOTP generation tests (RED)
  4. ☐ Implement TOTP generation (GREEN)
  5. ☐ Write test: QR code UI tests (RED)
  6. ☐ Create QR code UI (GREEN)
  7. ☐ Write test: backup codes tests (RED)
  8. ☐ Add backup codes (GREEN)
  9. ☐ Write test: E2E 2FA flow (RED)
  10. ☐ Implement E2E integration (GREEN)
  11. ☐ Refactor: optimize and clean up

# 5. Complete
bd update <id> --status done
openspec archive add-two-factor-auth --yes
git push && bd sync
```

### Best Practices

1. **TDD (Test-Driven Development)**: DEFAULT approach for all features - write tests UPFRONT in RED-GREEN-REFACTOR cycles
2. **TodoWrite**: Always use for active coding sessions with 3+ steps, structured as TDD cycles
3. **Beads**: Create issues at start of work that spans multiple sessions
4. **OpenSpec**: Write proposals BEFORE implementing major features
5. **Sync regularly**: Run `bd sync` at end of every session
6. **Cross-agent**: Always use Beads when work might switch agents
7. **Status updates**: Update Beads status as work progresses (not just at end)
8. **Blockers**: Mark blocked immediately with reason: `bd update <id> --status blocked --comment "Waiting for API key"`

**TDD Workflow**:
- **RED**: Write failing test first (what should the code do?)
- **GREEN**: Write minimal code to make test pass (does it work?)
- **REFACTOR**: Clean up and optimize (is it maintainable?)
- **Repeat**: One cycle per feature/function

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Use Beads to create issues for follow-up:
   ```bash
   bd create "Finish E2E tests for payment flow"
   bd create "Fix TypeScript error in webhook handler"
   ```
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update Beads status** - Update all issues worked on during session:
   ```bash
   bd update <completed-id> --status done
   bd update <in-progress-id> --status in_progress --comment "Completed API, UI pending"
   bd update <blocked-id> --status blocked --comment "Waiting for Stripe webhook test credentials"
   ```
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync                    # Syncs Beads issues to git
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - TodoWrite todos are cleared; Beads issues persist for next agent/session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
