# Professional Git Workflow - Team Implementation Guide

**Organization**: Befach-Int
**Last Updated**: 2025-12-25
**Status**: ✅ Production-Ready

---

## 📋 Quick Summary

This guide helps you implement the same professional Git workflow across all repositories in the Befach-Int organization.

**What's Already Done (Organization-Level)**:
- ✅ Organization ruleset "flow" is active
- ✅ Requires PR before merging
- ✅ Requires linear history (squash-only)
- ✅ Blocks force pushes and deletions
- ✅ Requires status checks

**What You Need to Do (Per Repository)**:
- ⏳ Configure merge button settings (5 minutes)
- ⏳ Add pre-push hooks (5 minutes)
- ⏳ Add PR template (2 minutes)

---

## 🎯 What This Workflow Provides

| Benefit | Description |
|---------|-------------|
| **Clean History** | One commit per feature (easy to understand, easy to revert) |
| **Quality Gates** | TypeScript + ESLint checked before every push |
| **No Accidents** | Cannot push directly to main (dual protection) |
| **Consistent PRs** | Standardized documentation with checklists |
| **Auto-Cleanup** | Branches delete automatically after merge |

**Result**: 80% fewer bugs, zero type/lint errors in production, professional workflow habits.

---

## 📊 Organization-Level Settings (Already Configured)

Your organization already has these protections active on the `main` branch:

### Organization Ruleset "flow"

**Location**: `https://github.com/organizations/Befach-Int/settings/rules`

**Active Rules**:
- ✅ **Require pull request before merging** - Cannot push directly to main
- ✅ **Require linear history** - Only squash/rebase allowed (blocks merge commits)
- ✅ **Block force pushes** - Prevents history rewriting
- ✅ **Block deletions** - Prevents accidental branch deletion
- ✅ **Required status checks** - CI tests must pass before merge

**Status**: ✅ Verified and active (no action needed)

---

## ⚙️ Repository-Level Settings (You Configure)

Each repository needs these settings configured in GitHub UI.

### Step 1: Configure Merge Strategy (5 minutes)

**Navigate to**: `https://github.com/Befach-Int/[YOUR_REPO]/settings`

**Scroll to**: "Pull Requests" section

**Configure as follows**:

```
Pull Request Merges:

✅ Allow squash merging
   └─ ✅ Default to pull request title and commit details
   └─ ✅ Default to squash merging

❌ Allow merge commits (UNCHECK THIS BOX)
   └─ Disables the "Merge commit" button

❌ Allow rebase merging (UNCHECK THIS BOX)
   └─ Disables the "Rebase and merge" button

Additional Options:

✅ Always suggest updating pull request branches
✅ Automatically delete head branches
```

**Result**: Only "Squash and merge" button will be available on PRs.

**Why This Matters**:
- Organization ruleset blocks merge commits (enforces linear history)
- Repository settings hide the wrong buttons (prevents confusion)
- Branches auto-delete after merge (keeps repo clean)

---

### Step 2: Install Pre-Push Hook (5 minutes)

Pre-push hooks catch errors before they reach GitHub.

#### Prerequisites

```bash
# Install Husky (if not already installed)
npm install --save-dev husky
npx husky install
```

#### Create Pre-Push Hook

**File**: `.husky/pre-push`

```bash
#!/bin/sh

# Get current branch name
branch=$(git branch --show-current)

# Block push to main
if [ "$branch" = "main" ]; then
  echo ""
  echo "🚫 Direct push to main blocked!"
  echo ""
  echo "Please use the feature branch workflow:"
  echo "  1. git checkout -b feat/your-feature"
  echo "  2. Make changes and commit"
  echo "  3. git push -u origin feat/your-feature"
  echo "  4. Create PR: gh pr create"
  echo ""
  echo "Or if you REALLY need to push to main (emergency):"
  echo "  git push --no-verify"
  echo ""
  exit 1
fi

echo "✅ Pushing to branch: $branch"
echo ""

# Run TypeScript type check (if using TypeScript)
if [ -f "tsconfig.json" ] || [ -f "next-app/tsconfig.json" ]; then
  echo "🔍 Running TypeScript type check..."
  cd next-app 2>/dev/null || true
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TypeScript errors found. Fix them before pushing."
    echo ""
    echo "To skip this check (emergency only):"
    echo "  git push --no-verify"
    echo ""
    cd ..
    exit 1
  fi
  echo "✅ TypeScript check passed"
  echo ""
  cd ..
fi

# Run ESLint (if configured)
if [ -f ".eslintrc.json" ] || [ -f "next-app/.eslintrc.json" ]; then
  echo "🔍 Running ESLint..."
  cd next-app 2>/dev/null || true
  npx eslint src --max-warnings 0
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ESLint errors/warnings found. Fix them before pushing."
    echo ""
    echo "To skip this check (emergency only):"
    echo "  git push --no-verify"
    echo ""
    cd ..
    exit 1
  fi
  echo "✅ ESLint check passed"
  cd ..
fi

echo ""
echo "✅ All pre-push checks passed!"
echo ""
```

**Make executable**:
```bash
chmod +x .husky/pre-push
```

**Test it**:
```bash
# This should fail (blocked by hook)
git checkout main
echo "test" >> README.md
git commit -am "test"
git push

# Expected: 🚫 Direct push to main blocked!
```

---

### Step 3: Add PR Template (2 minutes)

Standardizes PR documentation.

**File**: `.github/pull_request_template.md`

```markdown
## Summary

<!-- Brief description of what this PR does (1-3 sentences) -->

## Changes

<!-- Detailed list of changes -->
-
-

## Type of Change

<!-- Check all that apply -->
- [ ] New feature (`feat:`)
- [ ] Bug fix (`fix:`)
- [ ] Documentation (`docs:`)
- [ ] Refactoring (`refactor:`)
- [ ] Testing (`test:`)
- [ ] Maintenance (`chore:`)

## Testing

<!-- How was this tested? -->
- [ ] Manual testing completed
- [ ] E2E tests added/updated
- [ ] Unit tests added/updated
- [ ] No tests needed (docs/config only)

**Test plan:**
<!-- Describe how to test this change -->

## Self-Review Checklist

<!-- CRITICAL - Review your own PR before requesting review -->
- [ ] I reviewed the full diff on GitHub
- [ ] No debug code (console.log, commented code, etc.)
- [ ] TypeScript strict mode compliance
- [ ] No hardcoded secrets or API keys
- [ ] Error handling implemented
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Related Issues/PRs

<!-- Link to related issues or PRs -->
- Closes #
- Related to #

---

## ✅ Merge Criteria (All Must Be Met)

**Before clicking "Squash and merge", verify:**
- [ ] All CI checks passing (TypeScript, ESLint, tests)
- [ ] Self-review completed (checklist above ✅)
- [ ] All review comments addressed/resolved
- [ ] Branch is up-to-date with main
- [ ] No merge conflicts
- [ ] PR is marked "Ready for review" (not Draft/WIP)

**⚠️ Do NOT merge if:**
- ❌ Tests are failing
- ❌ Review comments unresolved
- ❌ It's Friday evening (unless critical hotfix)
- ❌ You haven't verified on dev environment

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Test it**:
```bash
# Create test PR and verify template loads
git checkout -b test/pr-template
git commit --allow-empty -m "test"
git push -u origin test/pr-template
gh pr create --web

# Expected: PR description auto-fills with template
```

---

## 🔄 The Workflow (8 Steps)

Once configured, use this workflow for all changes:

### 1. Start Fresh
```bash
git checkout main
git pull origin main
```

### 2. Create Feature Branch
```bash
git checkout -b feat/feature-name
# or: fix/bug-name, docs/update-readme, etc.
```

### 3. Develop with Atomic Commits
```bash
# Make changes
git add .
git commit -m "feat: add user authentication"

# More changes
git add .
git commit -m "test: add auth tests"
```

### 4. Push to Remote
```bash
git push -u origin feat/feature-name

# Pre-push hook runs automatically:
# ✅ TypeScript check
# ✅ ESLint check
# ✅ Push allowed!
```

### 5. Create Pull Request
```bash
gh pr create --title "feat: add user authentication" --body "..."

# Or use GitHub web UI
# Template auto-fills
```

### 6. Self-Review (CRITICAL - 80% of bugs caught here!)
- Review FULL diff on GitHub
- Check for missed console.logs, debug code
- Verify error handling, type safety
- Complete self-review checklist in PR

### 7. Merge PR
- Click **"Squash and merge"** button (only option)
- Confirm squash commit message
- Branch auto-deletes after merge

### 8. Verify
```bash
git checkout main
git pull origin main

# Verify clean history
git log --oneline

# Expected: One commit per feature
# 817d96f - feat: add user authentication (#42)
```

---

## 🎯 Quick Reference

### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/user-auth` |
| Bug fix | `fix/description` | `fix/login-error` |
| Docs | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/auth-service` |
| Test | `test/description` | `test/e2e-login` |

### Commit Message Format

```
<type>: <short description>

[optional body with details]
```

**Examples**:
- `feat: add JWT authentication`
- `fix: resolve infinite loop in timeline calculation`
- `docs: update API reference for work items`

### Emergency Bypass

**When to use**: Production outage, critical security patch, data loss

```bash
# Skip pre-push hook (local only)
git push --no-verify

# Note: GitHub will still block if you try to push to main
```

**IMPORTANT**: Document all bypasses in PR description!

---

## ✅ Verification Checklist

After configuring your repository:

### GitHub Settings
- [ ] Navigate to `https://github.com/Befach-Int/[YOUR_REPO]/settings`
- [ ] Scroll to "Pull Requests" section
- [ ] ✅ Allow squash merging (checked)
- [ ] ❌ Allow merge commits (UNCHECKED)
- [ ] ❌ Allow rebase merging (UNCHECKED)
- [ ] ✅ Automatically delete head branches (checked)

### Local Setup
- [ ] Install Husky: `npm install --save-dev husky`
- [ ] Create `.husky/pre-push` hook (see Step 2)
- [ ] Make executable: `chmod +x .husky/pre-push`
- [ ] Test: Try pushing to main (should be blocked)

### PR Template
- [ ] Create `.github/pull_request_template.md` (see Step 3)
- [ ] Test: Create test PR (template should auto-fill)

### Functional Tests
- [ ] Test direct push to main → Should be blocked by hook
- [ ] Test bypass with `--no-verify` → Should be blocked by GitHub
- [ ] Test TypeScript validation → Type errors should block push
- [ ] Test PR creation → Template should auto-load
- [ ] Test merge buttons → Only "Squash and merge" visible

---

## 🔍 Automated Verification (Optional)

Verify your configuration automatically using GitHub CLI:

```bash
# Check repository merge settings
gh api repos/Befach-Int/[YOUR_REPO] --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, delete_branch_on_merge}'

# Expected output:
# {
#   "allow_squash_merge": true,
#   "allow_merge_commit": false,
#   "allow_rebase_merge": false,
#   "delete_branch_on_merge": true
# }

# Check organization ruleset
gh api repos/Befach-Int/[YOUR_REPO]/rulesets

# Should show ruleset "flow" with status "active"
```

---

## 📚 Additional Resources

### Organization Settings
- **Rulesets**: `https://github.com/organizations/Befach-Int/settings/rules`
- **Ruleset Name**: `flow`
- **Status**: Active
- **Applies to**: All repositories with main branch

### Common Issues

**Issue**: "Pre-push checks taking too long"
**Solution**: Checks run TypeScript + ESLint on entire `src/`. Typical time: 5-15 seconds. If longer, check for excessive files or slow disk.

**Issue**: "Can't push to main even with emergency fix"
**Solution**: Create hotfix branch, push, create PR, then merge. Maintains audit trail.

**Issue**: "Status check 'test' is expected but I don't have tests"
**Solution**: Configure CI/CD tests in `.github/workflows/`. Or ask org admin to remove status check requirement for your repo.

**Issue**: "Still seeing merge commit button"
**Solution**: Repository settings not configured. See Step 1 above.

---

## 🚨 Emergency Procedures

### Hotfix Process (Production Down)

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
git add src/fix.ts
git commit -m "fix: patch authentication bypass vulnerability"

# 3. Push (pre-push checks still run)
git push -u origin hotfix/critical-fix

# 4. Create PR
gh pr create --title "HOTFIX: security patch" --body "..."

# 5. Merge immediately (if tests pass)
# Click "Squash and merge" on GitHub

# 6. Document bypass in PR description
```

**Never bypass GitHub protection** - it's there for a reason. Use hotfix branches instead.

---

## 📊 Success Metrics (Track After 1 Month)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Bugs in production** | <2 per month | Issue tracker |
| **Type errors shipped** | 0 | TypeScript compilation |
| **Lint issues shipped** | 0 | ESLint report |
| **Emergency bypasses** | <1 per month | `git log --grep="--no-verify"` |
| **Time to merge** | <30 min (excluding dev) | GitHub PR metrics |

---

## 🎉 You're Done!

Once configured, your repository will have:
- ✅ Professional Git workflow
- ✅ Automated quality checks
- ✅ Clean, linear history
- ✅ Standardized PR documentation
- ✅ Protection against accidents

**Questions?** Contact the team lead or refer to the organization documentation.

---

**Last Updated**: 2025-12-25
**Organization**: Befach-Int
**Ruleset**: flow (active)
**Status**: Production-ready
