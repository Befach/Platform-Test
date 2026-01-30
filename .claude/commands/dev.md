---
description: TDD development with parallel orchestration
---

Implement features using Test-Driven Development with intelligent parallelization.

# Development

This command handles implementation with TDD as the default approach.

## Usage

```bash
/dev
```

## What This Command Does

### Step 1: Analyze Complexity & Dependencies

Read OpenSpec tasks.md (if strategic) and identify:
- All files to be created/modified
- **Independent files**: Can run in parallel tracks
- **Co-dependent files**: Must run sequentially
- **Shared foundation**: Create first, then parallelize

**Example Dependency Analysis**:
```
INDEPENDENT (Can Parallelize):
- Track A: API endpoint (/api/payments) → No dependencies
- Track B: UI components (PaymentForm.tsx) → No dependencies
- Track C: Database migration (add_payments.sql) → No dependencies

CO-DEPENDENT (Must Sequence):
- Step 1: Types (types/payment.ts) → FIRST
- Step 2: API uses types → AFTER Step 1
- Step 3: UI uses types → AFTER Step 1

Decision: Parallel tracks possible after types created
```

### Step 2: Create TodoWrite (TDD Pattern)

**TESTS WRITTEN UPFRONT** - Before implementation

Structure as RED-GREEN-REFACTOR cycles:
1. Write failing test (RED)
2. Implement minimal solution (GREEN)
3. Refactor and clean up
4. Repeat

### Step 3: Execute Development

**Option A: Sequential** (Simple, no parallelization needed)

```
TodoWrite (TDD):
  1. ☐ Write test: payment-validation.test.ts (RED)
  2. ☐ Implement: validation logic (GREEN)
  3. ☐ Refactor: extract helpers
  4. ☐ Write test: payment-errors.test.ts (RED)
  5. ☐ Implement: error handling (GREEN)
  6. ☐ Refactor: clean up
  7. ☐ Write test: payment-db.test.ts (RED)
  8. ☐ Implement: database layer (GREEN)
  9. ☐ Refactor: optimize queries
  10. ☐ Write test: payment-flow.e2e.ts (RED)
  11. ☐ Implement: E2E integration (GREEN)
  12. ☐ Refactor: final cleanup
```

**Option B: Parallel** (Complex, independent tracks)

```
Step 1: Create shared types (sequential)
TodoWrite (Foundation):
  1. ☐ Write test: types.test.ts
  2. ☐ Create: types/payment.ts

Step 2: Launch 3 parallel tracks

Track 1 (backend-architect):
TodoWrite (TDD):
  1. ☐ Write test: api endpoint tests
  2. ☐ Implement: /api/payments
  3. ☐ Refactor

Track 2 (frontend-developer):
TodoWrite (TDD):
  1. ☐ Write test: component tests
  2. ☐ Implement: PaymentForm.tsx
  3. ☐ Refactor

Track 3 (database-architect):
TodoWrite (TDD):
  1. ☐ Write test: migration tests
  2. ☐ Implement: add_payments.sql
  3. ☐ Refactor

Step 3: Integration (sequential)
TodoWrite (TDD):
  1. ☐ Write test: E2E flow
  2. ☐ Integrate: all tracks
  3. ☐ Refactor
```

### Step 4: Update Beads Throughout

```bash
# When starting
bd update <id> --status in_progress

# Mid-session progress
bd update <id> --comment "API done, UI pending"

# If blocked
bd update <id> --status blocked --comment "Reason"
```

### Step 5: Commit After Each GREEN Cycle

```bash
git add .
git commit -m "test: add payment validation tests"

git add .
git commit -m "feat: implement payment validation"

git add .
git commit -m "refactor: extract validation helpers"

# Regular pushes
git push
```

## Example Output (Sequential)

```
✓ TodoWrite: 12/12 TDD cycles completed
✓ Tests written first: 4 test files (42 test cases)
✓ Implementation: All tests passing
✓ Beads updated: bd-x7y2 in_progress → ready for review
✓ Commits: 12 commits (1 per TDD cycle)

Ready for /check
```

## Example Output (Parallel)

```
✓ Dependency Analysis: 3 independent tracks + 1 shared foundation
✓ Foundation: types/payment.ts created (tests passing)
✓ Parallel Execution:
  - Track 1 (API): Completed (tests passing)
  - Track 2 (UI): Completed (tests passing)
  - Track 3 (DB): Completed (tests passing)
✓ Integration: E2E tests passing
✓ Beads updated: bd-x7y2 in_progress → ready for review
✓ Commits: 18 commits (from 3 tracks + integration)

Ready for /check
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD (you are here)
5. /check                → Validate
6. /ship                 → Create PR
7. /review               → Address comments
8. /merge                → Merge and cleanup
9. /verify               → Final documentation check
```

## Tips

- **TDD is mandatory**: Always write tests first
- **Commit after each cycle**: RED → commit test, GREEN → commit impl, REFACTOR → commit cleanup
- **Parallel for independence**: Only parallelize truly independent tracks
- **Update Beads regularly**: Keep status current for handoffs
- **Tests must pass**: Don't move to /check with failing tests
