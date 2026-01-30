---
description: Create PR with comprehensive documentation
---

Push code and create a pull request with full context and documentation links.

# Ship

This command creates a PR after validation passes.

## Usage

```bash
/ship
```

## What This Command Does

### Step 1: Verify /check Passed
Ensure all validation completed successfully.

### Step 2: Update Beads
```bash
bd update <id> --status done
bd sync
```

### Step 3: Push Branch
```bash
git push -u origin <branch-name>
```

### Step 4: Create PR

```bash
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
```

## Example Output

```
✓ Validation: /check passed
✓ Beads: Marked done & synced (bd-x7y2)
✓ Pushed: feat/stripe-billing
✓ PR created: https://github.com/.../pull/123
  - Beads linked: bd-x7y2
  - OpenSpec linked: openspec/changes/stripe-billing/
  - Research linked: docs/research/stripe-billing.md
  - Test coverage documented
  - Security review documented

PR Summary:
  - 18 commits (across 3 parallel tracks + integration)
  - 42 test cases, all passing
  - OWASP Top 10 security review completed
  - 3 key architectural decisions documented

⏸️  PR created, awaiting automated checks (Greptile, SonarCloud, GitHub Actions)

Next: /review <pr-number> (after automated checks complete)
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD
5. /check                → Validate
6. /ship                 → Create PR (you are here)
7. /review               → Address comments
8. /merge                → Merge and cleanup
9. /verify               → Final documentation check
```

## Tips

- **Complete PR body**: Include all research, decisions, and test coverage
- **Link everything**: Research doc, OpenSpec, Beads issue
- **Document security**: OWASP Top 10 review in PR body
- **Test coverage**: Show all test scenarios passing
- **Wait for checks**: Let GitHub Actions, Greptile, SonarCloud run
- **NO auto-merge**: Always wait for /review phase
