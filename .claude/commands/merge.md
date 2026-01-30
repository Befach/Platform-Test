---
description: Update docs, merge PR, archive, cleanup
---

Update project documentation, merge the pull request, archive proposals, and clean up.

# Merge

This command completes the feature by merging the PR and updating documentation.

## Usage

```bash
/merge <pr-number>
```

## What This Command Does

### Step 1: Final Verification
```bash
gh pr checks <pr-number>  # Ensure all checks pass
gh pr view <pr-number> --json reviewDecision  # Check approval status
```

### Step 2: Update Project Documentation (BEFORE merge)

**A. Update PROGRESS.md**:
```bash
# Add feature to completed list with:
# - Feature name
# - Completion date
# - Beads issue ID
# - PR number
# - Research doc link
```

**B. Update API_REFERENCE.md** (if API changes):
```bash
# Document:
# - New endpoints
# - Request/response schemas
# - Authentication requirements
# - Example requests
```

**C. Update Architecture docs** (if strategic):
```bash
# Update:
# - docs/architecture/ diagrams
# - New patterns introduced
# - System architecture overview
# - Decision records (ADRs) if applicable
```

**D. Update README.md** (if user-facing):
```bash
# Update:
# - Features list
# - Configuration options
# - Installation/setup steps
# - Usage examples
```

**E. Update Testing docs** (if new patterns):
```bash
# Document:
# - New test utilities
# - Testing strategy
# - Examples
```

**F. Commit documentation updates**:
```bash
git add docs/ README.md
git commit -m "docs: update project documentation for <feature-name>

- Updated PROGRESS.md: Marked <feature> as complete
- Updated API_REFERENCE.md: Added <endpoints> (if applicable)
- Updated architecture docs: <changes> (if applicable)
- Updated README.md: <changes> (if applicable)

Closes: <beads-id>
See: docs/research/<feature-slug>.md"

git push
```

### Step 3: Merge PR
```bash
gh pr merge <pr-number> --squash --delete-branch
```

### Step 4: Archive OpenSpec (if strategic)
```bash
openspec archive <feature-slug> --yes
```

### Step 5: Sync Beads
```bash
bd sync
```

### Step 6: Switch to Main
```bash
git checkout main
git pull
```

### Step 7: Verify Cleanup
- Documentation updated: ✓
- Branch deleted: ✓
- OpenSpec archived (if strategic): ✓
- Beads synced: ✓

## Example Output

```
✓ Documentation Updates:
  - docs/planning/PROGRESS.md: Feature marked complete
  - docs/reference/API_REFERENCE.md: 3 new endpoints documented
  - docs/architecture/: Payment system diagram updated
  - README.md: Billing features added
  - Committed: docs: update project documentation

✓ PR checks: All passing
✓ PR approval: Approved by user
✓ PR merged: squash-merge to main
✓ Branch deleted: feat/stripe-billing
✓ OpenSpec archived: openspec/changes/stripe-billing/ (if strategic)
✓ Beads synced
✓ Switched to main

Merge complete!

Summary:
  - Feature: Stripe billing integration
  - Research: docs/research/stripe-billing.md
  - Beads: bd-x7y2 (closed)
  - OpenSpec: Archived (if strategic)
  - PR: #123 (merged)
  - Commits: 18 (across 3 parallel tracks + integration)
  - Tests: 42 test cases, all passing
  - Documentation: Updated across 4 files

Next: /verify (cross-check all documentation)
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD
5. /check                → Validate
6. /ship                 → Create PR
7. /review               → Address comments
8. /merge                → Merge and cleanup (you are here)
9. /verify               → Final documentation check
```

## Tips

- **Update docs BEFORE merge**: All documentation must be current
- **Verify PR approval**: Ensure user has approved the PR
- **Squash merge**: Keep main branch history clean
- **Archive OpenSpec**: Strategic proposals get archived after merge
- **Sync Beads**: Ensure Beads database is up-to-date
- **Switch to main**: Ready for next feature
- **Run /verify**: Final documentation verification step
