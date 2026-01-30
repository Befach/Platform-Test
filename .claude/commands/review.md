---
description: Address ALL PR issues (GitHub Actions, Greptile, SonarCloud, CI/CD)
---

Process ALL pull request issues including GitHub Actions failures, Greptile inline comments, SonarCloud analysis, and other CI/CD checks.

# Review

This command handles ALL issues that arise after creating a pull request.

## Usage

```bash
/review <pr-number>
```

## What This Command Does

### Step 1: Fetch Complete PR Status
```bash
# Get full PR details including all checks
gh pr view <pr-number> --json number,url,isDraft,reviews,statusCheckRollup,comments

# Check individual status checks
gh pr checks <pr-number>
```

Review ALL status checks:
- GitHub Actions workflows
- Greptile code review (inline comments + summary)
- SonarCloud quality gate
- Any other CI/CD integrations
- Vercel deployments
- Security scanners

### Step 2: Address GitHub Actions Failures

If any GitHub Actions workflows fail:

```bash
# View failed workflow logs
gh run view <run-id> --log-failed

# Identify failure cause:
# - Build failures
# - Test failures
# - Lint/type check failures
# - Deployment failures
# - Security scan failures
```

**For each failure**:
1. **Analyze the error**: Read logs to understand root cause
2. **Fix the issue**: Make necessary code changes
3. **Re-run checks**: GitHub Actions will auto-rerun on push
4. **Document fix**: Note what was fixed in commit message

**Common GitHub Actions Issues**:
- Build failures: Missing dependencies, compilation errors
- Test failures: Failing test cases (should not happen if /check passed)
- Lint failures: Code style violations
- Type failures: TypeScript type errors
- Deployment failures: Env vars, configuration issues

### Step 3: Process Greptile Review

Greptile provides TWO types of feedback:
1. **Inline comments** on specific code lines
2. **Summary** with overall recommendations

#### 3A. Check Greptile Inline Comments
```bash
# View all PR comments (includes Greptile inline comments)
gh pr view <pr-number> --comments --json comments
```

For each Greptile inline comment:
- **What Greptile does**: AI code review bot that provides context-aware suggestions
- **How it helps**: Catches bugs, suggests improvements, identifies security issues, recommends best practices

Categorize each comment:
- **Valid**: Should be implemented (security issue, bug, clear improvement)
- **Invalid**: Greptile misunderstood context
- **Conflicting**: Contradicts research decisions with good reason
- **Out of scope**: Valid but not for this PR

#### 3B. Check Greptile Summary
```bash
# Greptile usually posts a summary comment on the PR
# Review the overall assessment and recommendations
```

The summary typically includes:
- Overall code quality assessment
- Key issues to address
- Security concerns
- Performance considerations
- Best practice violations

### Step 4: Analyze SonarCloud (via sonarcloud skill)

```bash
# Use sonarcloud skill to query PR-specific issues
/sonarcloud
```

**What SonarCloud does**: Static code analysis for quality, security, and maintainability

**How it helps**:
- Identifies code smells and technical debt
- Finds security vulnerabilities (complementing OWASP Top 10)
- Calculates code coverage
- Tracks code duplication
- Assesses maintainability

**Query PR-specific data**:
- Quality gate status (pass/fail)
- New issues introduced in this PR
- Security hotspots
- Code coverage changes
- Technical debt added

**Prioritize issues**:
1. **Blocker/Critical**: Must fix before merge
2. **Major**: Should fix if valid
3. **Minor/Info**: Optional improvements

### Step 5: Check Other CI/CD Tools

Review any other automated checks:
- **Vercel**: Preview deployment successful?
- **Security scanners**: Any vulnerabilities detected?
- **Custom scripts**: Any failures?
- **Dependency checks**: Outdated or vulnerable packages?

### Step 6: Categorize and Prioritize ALL Issues

Create a master list of all issues from:
- GitHub Actions failures
- Greptile inline comments
- Greptile summary recommendations
- SonarCloud issues
- Other CI/CD tool failures

Prioritize by:
1. **Critical**: Blocks merge (failing tests, security vulnerabilities, build failures)
2. **High**: Should address (valid bugs, important improvements)
3. **Medium**: Optional but valuable (code quality, best practices)
4. **Low**: Nice to have (minor refactorings, style suggestions)

### Step 7: Address Issues Systematically

For **GitHub Actions failures** (Critical):
```bash
# Fix the issue
# Commit with clear description
git add .
git commit -m "fix: resolve GitHub Actions failure in <workflow-name>

- Fixed: [specific issue]
- Root cause: [explanation]
- Solution: [what was changed]"

git push
# Actions will auto-rerun
```

For **Greptile inline comments** (Valid):
```bash
# Fix the issue
# Reply to inline comment (NOT separate comment)
gh pr comment <pr-number> --body-file - <<EOF
**Addressing comment on <file>:<line>**

✓ Fixed: [description of change]
Commit: <commit-sha>

[Optional: reasoning if decision was reconsidered]
EOF

# Mark comment as resolved (via GitHub web or API)
```

For **Greptile inline comments** (Invalid/Conflicting):
```bash
# Reply with reasoning
gh pr comment <pr-number> --body-file - <<EOF
**Re: comment on <file>:<line>**

This approach is correct because:
- Reasoning: [from research doc]
- Evidence: [link to research source]
- Alternative considered: [what Greptile suggested]
- Why rejected: [specific reason]

See: docs/research/<feature-slug>.md (Decision #X)
EOF

# Mark comment as resolved
```

For **Greptile summary recommendations**:
```bash
# Add a PR comment addressing the summary
gh pr comment <pr-number> --body "## Greptile Summary Response

Addressed all key recommendations:
- [Recommendation 1]: ✓ Fixed in commit <sha>
- [Recommendation 2]: ✓ Explained (see inline response)
- [Recommendation 3]: ⏭️ Out of scope for this PR (created issue bd-xxx)

All critical and high-priority items resolved."
```

For **SonarCloud issues** (via sonarcloud skill):
```bash
# For critical/blocker issues: Fix immediately
# For security vulnerabilities: Fix immediately
# For code smells: Fix if valid, justify if not

# After fixes, SonarCloud will re-analyze on next push
```

For **other CI/CD failures**:
```bash
# Debug the specific tool's logs
# Fix the underlying issue
# Commit and push
# Verify the check passes
```

### Step 8: Commit ALL Fixes

```bash
git add .
git commit -m "fix: address ALL PR review feedback

GitHub Actions:
- Fixed: [list of workflow failures resolved]

Greptile:
- Fixed: [list of valid inline comments addressed]
- Explained: [list of invalid comments with reasoning]
- Summary: [key recommendations addressed]

SonarCloud:
- Fixed: [security vulnerabilities and critical issues]
- Justified: [code smells that are intentional]

Other CI/CD:
- Fixed: [any other tool failures]

All review feedback resolved, all checks passing."

git push
```

### Step 9: Verify ALL Checks Pass

```bash
# Wait for checks to complete
gh pr checks <pr-number>

# Ensure all status checks are green:
# ✓ GitHub Actions workflows
# ✓ Greptile review (no unresolved critical comments)
# ✓ SonarCloud quality gate
# ✓ Other CI/CD checks
```

### Step 10: Update Beads

```bash
bd update <id> --comment "PR review complete: all issues addressed, all checks passing"
bd sync
```

## Example Output

```
✓ GitHub Actions: 3 workflows
  - Build: ✓ Passing (was failing, fixed missing dependency)
  - Tests: ✓ Passing
  - Deploy Preview: ✓ Passing

✓ Greptile Review:
  Inline Comments: 8 total
  - Valid: 5 → Fixed & replied inline
  - Invalid: 2 → Explained with research evidence & replied inline
  - Out of scope: 1 → Noted for future work & replied inline
  - All marked resolved ✓

  Summary:
  - Key recommendations: 3/3 addressed
  - Overall assessment: Ready for merge
  - Posted summary response comment ✓

✓ SonarCloud (via sonarcloud skill):
  Quality Gate: ✓ Passing
  Issues: 3 total
  - Security: 1 → Fixed (SQL injection risk)
  - Code smells: 2 → 1 fixed, 1 justified
  - Coverage: Maintained at 85%

✓ Vercel Preview: ✓ Deployed successfully
✓ Security Scan: ✓ No vulnerabilities

✓ All Issues Addressed:
  - Critical: 2/2 fixed (GitHub Actions build, SonarCloud security)
  - High: 5/5 fixed (Greptile valid comments)
  - Medium: 3/3 addressed (1 fixed, 2 explained)
  - Low: 0 (none found)

✓ Fixes committed: 3c4d5e6
✓ All checks passing: ✓
✓ Beads updated: Ready for merge

Next: /merge <pr-number> (user approval required)
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD
5. /check                → Validate
6. /ship                 → Create PR
7. /review               → Address ALL PR issues (you are here)
8. /merge                → Merge and cleanup
9. /verify               → Final documentation check
```

## Understanding the Tools

### Greptile
- **What it is**: AI-powered code review bot
- **How it helps**:
  - Context-aware code analysis
  - Catches bugs and security issues
  - Suggests improvements and best practices
  - Provides inline comments and summary
- **How to use feedback**:
  - Inline comments: Address specific code issues
  - Summary: Get overall assessment and key recommendations
  - Reply directly to each comment (not separate)
  - Mark resolved after addressing

### SonarCloud (via sonarcloud skill)
- **What it is**: Static code analysis platform
- **How it helps**:
  - Quality gate enforcement
  - Security vulnerability detection
  - Code smell identification
  - Technical debt tracking
  - Test coverage analysis
- **How to use the skill**:
  - Query PR-specific issues
  - Get quality metrics
  - Identify security hotspots
  - Track code coverage changes
- **Prioritization**:
  - Blocker/Critical: Must fix
  - Major: Should fix if valid
  - Minor/Info: Optional

### GitHub Actions
- **What it is**: CI/CD automation platform
- **How it helps**:
  - Automated testing
  - Build verification
  - Deployment automation
  - Security scanning
  - Quality checks
- **Common failures**:
  - Build: Dependencies, compilation
  - Tests: Failing test cases
  - Lint: Code style violations
  - Deploy: Configuration issues

## Tips

- **Address ALL issues**: Not just Greptile and SonarCloud
- **Prioritize critical**: Fix blockers first (GitHub Actions failures, security issues)
- **Reply inline to Greptile**: Respond to each comment directly
- **Post summary response**: Address Greptile's overall assessment
- **Use sonarcloud skill**: Don't just check the web UI
- **Verify all checks**: Ensure everything is green before /merge
- **Update Beads**: Keep issue status current
- **Research if needed**: Use parallel-ai for unclear suggestions
- **Document fixes**: Clear commit messages for all fixes
- **Don't leave unresolved**: Address every comment and check
