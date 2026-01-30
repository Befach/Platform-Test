# Commands & Skills

## MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase** | Migrations, queries, RLS, types |
| **shadcn/ui** | Component installation |
| **Context7** | Library documentation lookup |

## Skills (Auto-Invoke)

| Skill | Trigger |
|-------|---------|
| `parallel-ai` | ALL web search/extraction (MANDATORY) |
| `webapp-testing` | Playwright testing |
| `frontend-design` | Production UI building |
| `document-skills` | xlsx/pdf/docx export |

**NEVER use WebFetch/WebSearch directly** - use parallel-ai skill.

## Slash Commands

### MAKER Workflow (9-Stage TDD-First Pipeline)

| Phase | Command | Task Tracking | Purpose |
|-------|---------|--------------|---------|
| 1 | `/status` | `bd list --ready` | Check current stage, active work, recent completions |
| 2 | `/research` | Research doc | Deep research with parallel-ai, save to docs/research/ |
| 3 | `/plan` | `bd create` + `openspec` (if strategic) | Create formal plan, branch, OpenSpec proposal |
| 4 | `/dev` | `TodoWrite` (TDD cycles) | Implement with TDD, parallel if needed |
| 5 | `/check` | Mark blocked if fails | Type check, lint, code review, security, E2E tests |
| 6 | `/ship` | `bd update --status done` | Push and create PR with full documentation |
| 7 | `/review` | Address feedback | Handle ALL PR issues (GitHub Actions, Greptile, SonarCloud) |
| 8 | `/merge` | Update docs, `bd sync`, archive | Update all docs BEFORE merge, then merge PR |
| 9 | `/verify` | Cross-check docs | Final documentation verification, update if needed |

**Workflow Principles**:
- **TDD Default**: Tests written UPFRONT in RED-GREEN-REFACTOR cycles
- **Research First**: All features start with comprehensive research (parallel-ai + codebase)
- **Security Built-in**: OWASP Top 10 analysis in every feature
- **Documentation Progressive**: Updated at relevant stages, verified at end
- **All PR Issues**: GitHub Actions + Greptile + SonarCloud + others

**Detailed Flow**:

**Phase 1: Status Check** (`/status`)
```bash
cat docs/planning/PROGRESS.md           # Check weekly status
bd list --status in_progress            # Active work
bd list --status done --limit 5         # Recent completions
git log --oneline -10                   # Recent commits
openspec list --active                  # Active proposals

# Determine context:
# - New feature: No active work
# - Continuing work: Resume existing issue
# - Review needed: Work complete, needs merge
```

**Phase 2: Research** (`/research <feature-name>`)
```bash
# Codebase Research (via Explore agent):
# - Similar patterns/implementations
# - Affected files and modules
# - Existing test infrastructure
# - Integration points

# Web Research (MANDATORY: parallel-ai skill):
# - Best practices: "Next.js 16 [feature] best practices 2026"
# - Security: "OWASP Top 10 risks for [feature] 2026"
# - Known issues: GitHub, Stack Overflow, security advisories
# - Library docs: Context7 MCP for official APIs
# - Case studies: Production implementations

# Document to docs/research/<feature-slug>.md:
# - Objective
# - Codebase Analysis (existing patterns, affected modules, tests)
# - Web Research (best practices, known issues, library docs - with sources)
# - Key Decisions & Reasoning (what, why, evidence, alternatives)
# - TDD Test Scenarios (identified UPFRONT)
# - Security Analysis (OWASP Top 10 + feature-specific)
# - Scope Assessment (tactical/strategic, complexity, parallelization)

# Output: Research doc with evidence-based decisions
```

**Phase 3: Plan** (`/plan <feature-slug>`)
```bash
# Read research doc
cat docs/research/<feature-slug>.md

# Determine scope:
# Tactical: Skip OpenSpec, create Beads only
# Strategic: Create OpenSpec proposal first

# If strategic:
openspec proposal create <feature-slug>
# Write: proposal.md (problem, solution, alternatives, impact)
#        tasks.md (TDD-ordered implementation checklist)
#        design.md (technical decisions from research)
#        specs/<capability>/spec.md (delta changes)
openspec validate <feature-slug> --strict

# Always: Create Beads issue
bd create "<feature-name> (see openspec/changes/<feature-slug> if strategic)"
bd show <id>

# Create branch
git checkout -b feat/<feature-slug>

# If strategic: Commit proposal and wait for approval
git add openspec/ docs/research/
git commit -m "proposal: <feature-name>

Research documented in docs/research/<feature-slug>.md
OpenSpec proposal in openspec/changes/<feature-slug>/"

git push -u origin feat/<feature-slug>
gh pr create --title "Proposal: <feature-name>" \
  --body "See openspec/changes/<feature-slug>/proposal.md"
# ⏸️ WAIT FOR APPROVAL
```

**Phase 4: Development** (`/dev`)
```bash
# Analyze complexity & dependencies:
# - Independent files (can parallelize)
# - Co-dependent files (must sequence)
# - Shared foundation (create first)

# Create TodoWrite with TDD pattern (TESTS UPFRONT):
TodoWrite (TDD - Sequential):
  1. ☐ Write test: validation.test.ts (RED)
  2. ☐ Implement: validation logic (GREEN)
  3. ☐ Refactor: extract helpers
  4. ☐ Write test: errors.test.ts (RED)
  5. ☐ Implement: error handling (GREEN)
  6. ☐ Refactor: clean up
  7. ☐ Write test: e2e-flow.test.ts (RED)
  8. ☐ Implement: E2E integration (GREEN)
  9. ☐ Refactor: final cleanup

# OR parallel if complex (launch agents for independent tracks)

# Update Beads throughout:
bd update <id> --status in_progress
bd update <id> --comment "API done, UI pending"

# Commit after each GREEN cycle:
git commit -m "test: add validation tests"
git commit -m "feat: implement validation"
git commit -m "refactor: extract validation helpers"
git push
```

**Phase 5: Validation** (`/check`)
```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Code review (if available)
/code-review:code-review

# Security Review (MANDATORY):
# - OWASP Top 10 checklist
# - Automated scan: bun audit
# - Manual review of security test scenarios
# - Verify security mitigations implemented

# E2E tests (includes security tests from TDD)
bun run test:e2e

# If any fail:
bd update <id> --status blocked --comment "Reason"
bd create "Fix <issue-description>"
# Fix and re-run /check
```

**Phase 6: Ship** (`/ship`)
```bash
# Update Beads
bd update <id> --status done
bd sync

# Push
git push -u origin <branch-name>

# Create PR with comprehensive body:
gh pr create --title "feat: <feature-name>" --body "$(cat <<'EOF'
## Summary
[Auto-generated from commits and research doc]

## Research
See: docs/research/<feature-slug>.md

## Beads Issue
Closes: <issue-id>

## OpenSpec (if strategic)
See: openspec/changes/<feature-slug>/

## Key Decisions
[From research doc - 3-5 key decisions with reasoning]

## TDD Test Coverage
- Unit tests: [count] tests, [X] scenarios
- Integration tests: [count] tests
- E2E tests: [count] tests
- All tests passing ✓

## Security Review
- OWASP Top 10: All mitigations implemented
- Security tests: [count] scenarios passing
- Automated scan: No vulnerabilities

## Test Plan
- [x] Type check passing
- [x] Lint passing
- [x] Code review passing
- [x] E2E tests passing
- [x] Security review completed

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# ⏸️ PR created, awaiting automated checks
```

**Phase 7: Review** (`/review <pr-number>`)
```bash
# Fetch complete PR status:
gh pr view <pr-number> --json number,url,statusCheckRollup,comments
gh pr checks <pr-number>

# Address ALL issues:
# 1. GitHub Actions failures (build, test, lint, deploy)
#    - View logs: gh run view <run-id> --log-failed
#    - Fix issue, commit, push (auto-reruns)

# 2. Greptile inline comments + summary
#    - Categorize: Valid / Invalid / Conflicting / Out of scope
#    - Fix valid comments
#    - Reply inline (NOT separate): gh pr comment <pr-number> --body "..."
#    - Mark resolved
#    - Post summary response comment

# 3. SonarCloud (via sonarcloud skill)
#    - Query PR-specific issues: /sonarcloud
#    - Fix critical/blocker issues immediately
#    - Fix security vulnerabilities
#    - Address valid code smells

# 4. Other CI/CD checks (Vercel, security scanners, etc.)

# Commit all fixes:
git add .
git commit -m "fix: address ALL PR review feedback

GitHub Actions:
- Fixed: [list]

Greptile:
- Fixed: [valid comments]
- Explained: [invalid comments]
- Summary: [addressed]

SonarCloud:
- Fixed: [security + critical]
- Justified: [intentional code smells]

All review feedback resolved, all checks passing."

git push

# Update Beads:
bd update <id> --comment "PR review complete: all issues addressed, all checks passing"
bd sync

# Verify ALL checks green:
gh pr checks <pr-number>
```

**Phase 8: Merge** (`/merge <pr-number>`)
```bash
# Update ALL relevant documentation BEFORE merge:

# A. Update PROGRESS.md:
# - Add feature to completed list
# - Include: feature name, completion date, Beads ID, PR number, research doc link

# B. Update API_REFERENCE.md (if API changes):
# - Document new endpoints
# - Request/response schemas
# - Authentication requirements
# - Example requests

# C. Update architecture docs (if strategic):
# - Update diagrams
# - Document new patterns
# - Update system overview
# - Add decision records (ADRs)

# D. Update README.md (if user-facing):
# - Features list
# - Configuration options
# - Installation/setup steps
# - Usage examples

# E. Update testing docs (if new patterns):
# - New test utilities
# - Testing strategy
# - Examples

# Commit documentation updates:
git add docs/ README.md
git commit -m "docs: update project documentation for <feature-name>

- Updated PROGRESS.md: Marked <feature> as complete
- Updated API_REFERENCE.md: Added <endpoints> (if applicable)
- Updated architecture docs: <changes> (if applicable)
- Updated README.md: <changes> (if applicable)

Closes: <beads-id>
See: docs/research/<feature-slug>.md"

git push

# Merge PR:
gh pr merge <pr-number> --squash --delete-branch

# Archive OpenSpec (if strategic):
openspec archive <feature-slug> --yes

# Sync and cleanup:
bd sync
git checkout main && git pull
```

**Phase 9: Verify** (`/verify`)
```bash
# Cross-check ALL documentation files:

# A. docs/planning/PROGRESS.md:
# ✓ Feature listed? ✓ Completion date? ✓ Beads ID? ✓ PR number? ✓ Research doc link?

# B. docs/reference/API_REFERENCE.md (if API changes):
# ✓ Endpoints documented? ✓ Schemas complete? ✓ Auth requirements? ✓ Examples?

# C. docs/architecture/ (if strategic):
# ✓ Diagrams updated? ✓ Patterns documented? ✓ System overview current? ✓ ADRs added?

# D. README.md (if user-facing):
# ✓ Features updated? ✓ Config options? ✓ Setup steps? ✓ Usage examples?

# E. docs/testing/ (if new patterns):
# ✓ Test utilities documented? ✓ Strategy updated? ✓ Examples included?

# F. docs/research/<feature-slug>.md (if exists):
# ✓ Document exists? ✓ All sections complete? ✓ Key decisions? ✓ TDD scenarios? ✓ OWASP Top 10?

# Verify cross-references:
# ✓ PROGRESS.md → research doc valid?
# ✓ Research doc in merged PR?
# ✓ API_REFERENCE.md ↔ code consistent?
# ✓ Architecture docs ↔ implementation aligned?
# ✓ README.md examples work?

# If any missing/incomplete: Update now
git add docs/ README.md
git commit -m "docs: post-merge documentation verification

Cross-checked and updated all documentation after <feature-name> merge:
- Updated: [list]
- Fixed: [what was missing/incomplete]
- Verified: All cross-references consistent"

git push

# ✅ Workflow complete! Ready for next task: /status
```

### Operational

| Command | Purpose |
|---------|---------|
| `/db-migration` | RLS + team_id template |
| `/security-review` | OWASP Top 10 check |

## Quick Reference

```bash
# Dev server
cd next-app && bun run dev

# Build
bun run build && bun run lint

# Test
bun run test:e2e

# shadcn/ui
bunx shadcn-ui@latest add [component]
```
