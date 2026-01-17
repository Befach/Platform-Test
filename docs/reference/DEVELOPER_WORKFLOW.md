# Professional Developer Workflow Guide

**Last Updated**: 2025-12-23
**Purpose**: Complete tutorial for professional git-based development workflow
**Audience**: Solo developers learning industry-standard practices

---

## Table of Contents

1. [Introduction](#introduction)
2. [The 8-Step Workflow](#the-8-step-workflow)
3. [Detailed Step-by-Step Guide](#detailed-step-by-step-guide)
4. [Pull Request Template](#pull-request-template)
5. [Self-Review Checklist](#self-review-checklist)
6. [Enforcing the Workflow](#enforcing-the-workflow)
7. [Integration with Phase Commands](#integration-with-phase-commands)
8. [Common Mistakes & Fixes](#common-mistakes--fixes)
9. [Advanced Topics](#advanced-topics)
10. [Learning Resources](#learning-resources)

---

## Introduction

### Why This Workflow Matters (Even for Solo Developers)

**Common Misconception**: "I'm working alone, so I don't need branches, PRs, or code review."

**Reality**: Professional workflows prevent bugs, enable safe experimentation, and provide rollback points. Even solo developers benefit from:

| Benefit | How It Helps |
|---------|--------------|
| **Self-Review** | Catches 80% of bugs before production |
| **Rollback Points** | Easy to undo changes if something breaks |
| **Experimentation** | Try ideas on branches without breaking main |
| **Clear History** | Know exactly what changed and when |
| **Professional Habits** | Builds skills for team collaboration |

**Real-World Impact**:

- **Time Saved**: 10-25 min overhead per feature, saves 2-4 hours debugging production issues
- **Bugs Prevented**: Self-review catches type errors, missing edge cases, broken links
- **Confidence**: Main branch always works, deployments are stress-free

---

## The 8-Step Workflow

### Overview: Idea → Deployed Feature

**Golden Rule**: Main branch is ALWAYS production-ready. Never commit directly to main.

```
┌─────────────────────────────────────────────────────────────┐
│                    PROFESSIONAL WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Start Fresh    →  Pull latest main                       │
│  2. Create Branch  →  feat/new-feature                       │
│  3. Develop        →  Code, commit, iterate                  │
│  4. Push           →  Push to remote branch                  │
│  5. Create PR      →  Open pull request                      │
│  6. Self-Review    →  Review diff, fix issues ⚠️ CRITICAL   │
│  7. Merge          →  Squash and merge to main               │
│  8. Verify         →  Test on production                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Step | Command | Time | Critical? |
|------|---------|------|-----------|
| 1. Start fresh | `git checkout main && git pull` | 10s | ✅ |
| 2. Create branch | `git checkout -b feat/name` | 5s | ✅ |
| 3. Develop | Code → `git add` → `git commit -m "feat: ..."` | 30-180min | - |
| 4. Push | `git push -u origin feat/name` | 10s | ✅ |
| 5. Create PR | `gh pr create --title "..." --body "..."` | 3-5min | ✅ |
| 6. Self-review | Review diff on GitHub, fix issues | 5-15min | 🚨 CRITICAL |
| 7. Merge | `gh pr merge --squash` | 30s | ✅ |
| 8. Verify | Test on production | 2-5min | ✅ |

**Total Overhead**: ~10-25 minutes beyond development time
**Bugs Prevented**: ~80% caught before production (via self-review)

---

## Detailed Step-by-Step Guide

### Step 1: Start Fresh (Pull Latest Main)

**Purpose**: Ensure you're building on the latest stable code.

**Commands**:

```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main
```

**Why It Matters**:

- Prevents merge conflicts later
- Ensures you're not working on outdated code
- Synchronizes with any deployments made since last pull

**Common Mistake**: Forgetting this step and creating branch from stale main
**Fix**: If you realize later, rebase your branch: `git rebase main`

---

### Step 2: Create Feature Branch

**Purpose**: Isolate your changes from production code.

**Commands**:

```bash
# Create and switch to new branch
git checkout -b feat/new-feature-name
```

**Branch Naming Conventions**:

| Type | Format | Example |
|------|--------|---------|
| **Feature** | `feat/description` | `feat/work-item-review-system` |
| **Bug fix** | `fix/description` | `fix/timeline-calculation-loop` |
| **Docs** | `docs/description` | `docs/update-api-reference` |
| **Refactor** | `refactor/description` | `refactor/auth-service` |
| **Test** | `test/description` | `test/e2e-workspace-crud` |

**Best Practices**:

- ✅ Use descriptive names (not `feat/update` or `fix/bug`)
- ✅ Keep names under 50 characters
- ✅ Use kebab-case (hyphens, not underscores)
- ❌ Don't include issue numbers in branch name (put in PR description)

**Why It Matters**:

- Main branch stays stable while you experiment
- Easy to see what each branch does
- Can work on multiple features in parallel (using git worktrees)

---

### Step 3: Develop (Code, Commit, Iterate)

**Purpose**: Implement your feature with atomic commits.

**Commands**:

```bash
# Make changes to files
# ... edit code ...

# Check what changed
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user profile settings page"

# Continue iterating
# ... more changes ...
git add .
git commit -m "feat: add validation to profile form"
```

**Commit Message Format**:

```
<type>: <short description (50 chars max)>

[Optional body explaining WHY this change was made]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring (no functional change)
- `test`: Adding tests
- `chore`: Maintenance (dependency updates, config)

**Good Examples**:

```
feat: add dark mode toggle to user settings
fix: resolve infinite loop in timeline calculation
docs: update API reference for work items endpoint
refactor: extract auth logic to separate service
test: add E2E tests for workspace CRUD
chore: update shadcn/ui components to v2.0
```

**Bad Examples** (Don't Do This):

```
Update files  (too vague)
fix bug  (not descriptive)
changes  (meaningless)
WIP  (work in progress - commit when done!)
asdf  (definitely no!)
```

**Atomic Commits Best Practice**:

- Each commit = one logical change
- Commit often (every 30-60 min of work)
- Makes it easy to revert specific changes
- Creates clear history

**Why It Matters**:

- Clear commit history helps you understand what changed
- Easy to revert bad commits
- Makes code review easier
- Professional habit for team work

---

### Step 4: Push to Remote Branch

**Purpose**: Backup your work and prepare for PR creation.

**Commands**:

```bash
# First push (creates remote branch)
git push -u origin feat/new-feature-name

# Subsequent pushes (after more commits)
git push
```

**The `-u` Flag**:

- Sets upstream tracking
- Only needed on first push
- After that, just `git push` works

**Why It Matters**:

- Backs up your work to GitHub (not just local)
- Required before creating pull request
- Enables collaboration (others can see your branch)

---

### Step 5: Create Pull Request

**Purpose**: Document your changes and prepare for review.

**Commands**:

```bash
# Using GitHub CLI (recommended)
gh pr create --title "Add user profile settings" --body "See PR description"

# Alternative: Use GitHub web interface
# Navigate to: https://github.com/YOUR_USERNAME/YOUR_REPO/pulls
# Click "New Pull Request"
```

**PR Title Best Practices**:

- ✅ Descriptive and clear: "Add user profile settings page"
- ✅ Matches commit message format: "feat: add user profile settings"
- ❌ Vague: "Update code" or "Fix issue"

**PR Description** (see template in next section for details):

- Summary of what changed
- Why you made this change
- What testing was done
- Screenshots for UI changes
- Related issues or tickets

**Why It Matters**:

- Creates permanent record of what changed
- Enables self-review process (next step)
- Documents decisions for future reference
- Shows GitHub diff for easy review

---

### Step 6: Self-Review (CRITICAL STEP)

**Purpose**: Catch bugs, typos, and logic errors BEFORE merging to production.

**How to Do It**:

1. **Open PR on GitHub** → Click "Files changed" tab
2. **Read through EVERY line** of the diff
3. **Check for issues** using checklist below
4. **Leave comments** on lines that need fixes
5. **Make fixes locally**, commit, and push
6. **Re-review** until no issues remain

**Self-Review Checklist** (covered in detail below):

- [ ] Code quality (no console.logs, proper error handling)
- [ ] Security (no hardcoded secrets, proper auth checks)
- [ ] Testing (edge cases covered, errors handled)
- [ ] Documentation (comments added, docs updated)
- [ ] Performance (no unnecessary re-renders, efficient queries)
- [ ] User experience (error messages clear, loading states present)

**Why This Step Is CRITICAL**:

| Without Self-Review | With Self-Review |
|-------------------|------------------|
| 80% of bugs ship to production | 80% of bugs caught before merge |
| Debug issues in production (stressful) | Fix issues locally (calm) |
| Risk of breaking main branch | Main branch stays stable |
| No learning from mistakes | Learn by reviewing own code |

**Real Example**:

```
❌ Without review: Merge immediately → Production breaks → 2 hours debugging

✅ With review: Spot missing null check in 5 minutes → Add fix → Merge safely
```

**Time Investment**: 5-15 minutes
**Bugs Prevented**: 80% (industry data)

---

### Step 7: Merge to Main

**Purpose**: Integrate your feature into the production codebase.

**Commands**:

```bash
# Using GitHub CLI (squash merge recommended)
gh pr merge --squash

# Alternative: Use GitHub web interface
# Click "Squash and merge" button
```

**Merge Strategies**:

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Squash and Merge** | Solo projects, feature branches | Clean history, one commit per feature | Loses individual commit history |
| **Merge Commit** | Team projects, long-lived branches | Preserves full history | Cluttered main branch |
| **Rebase and Merge** | Linear history preference | Clean, linear history | Rewrites commit history |

**Recommendation for Solo Developers**: Use **Squash and Merge**

- Main branch shows one commit per feature
- Easy to understand history
- Easy to revert entire features

**After Merge**:

```bash
# Switch back to main
git checkout main

# Pull the merge commit
git pull origin main

# Delete local feature branch (cleanup)
git branch -d feat/new-feature-name

# Delete remote branch (optional - GitHub can auto-delete)
git push origin --delete feat/new-feature-name
```

**Why It Matters**:

- Keeps main branch clean and organized
- Makes it easy to see what changed in production
- Provides clear rollback points if needed

---

### Step 8: Verify on Production

**Purpose**: Ensure your changes work correctly in production environment.

**Steps**:

1. **Wait for deployment** (Vercel auto-deploys main branch)
2. **Visit production URL**: <https://platform-test-cyan.vercel.app>
3. **Test the feature** you just deployed
4. **Check for errors** in browser console
5. **Verify edge cases** work as expected

**Production Checklist**:

- [ ] Feature visible and functional
- [ ] No console errors
- [ ] Mobile responsive (test on phone)
- [ ] Loading states work
- [ ] Error handling works (test invalid inputs)

**If Issues Found**:

1. Create new branch: `fix/production-issue`
2. Fix the issue
3. Follow steps 3-8 again (quick hotfix)

**Why It Matters**:

- Catches environment-specific issues
- Ensures deployment succeeded
- Verifies feature works for real users
- Builds confidence in deployment process

---

## Pull Request Template

Copy-paste this template when creating PRs:

```markdown
## Summary
[One paragraph: What does this PR do?]

## What Changed
- [Bullet point 1: Specific change made]
- [Bullet point 2: Another change]
- [Bullet point 3: etc.]

## Why
[One paragraph: Why was this change necessary? What problem does it solve?]

## Testing
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Type check clean (`npx tsc --noEmit`)
- [ ] Manual testing complete (describe what you tested)
- [ ] Edge cases tested (describe edge cases)

## Documentation
- [ ] PROGRESS.md updated (if feature completion)
- [ ] CHANGELOG.md entry added (if DB migration or API change)
- [ ] Week file updated (`docs/implementation/week-X-Y.md`)
- [ ] API reference updated (if API changes)

## Screenshots
[Add before/after screenshots for UI changes]

## Related
Closes #[issue number if applicable]
Related to: [links to related PRs or docs]

## Deployment Notes
[Any special instructions for deployment? Environment variables? Database migrations?]
```

**Example Filled Template**:

```markdown
## Summary
Add work item review system allowing team members to approve/reject work items before execution.

## What Changed
- Created `work_item_versions` table for version history
- Added `review_status` column to `work_items` table
- Built review panel component with approve/reject buttons
- Added POST /api/work-items/[id]/review endpoint
- Created E2E tests for review workflow

## Why
Teams needed a formal approval process before starting work on features to ensure alignment and reduce wasted effort.

## Testing
- [x] E2E tests passing (`npm run test:e2e:chrome -- e2e/review-process.spec.ts`)
- [x] Type check clean
- [x] Manual testing: Created work item, submitted for review, approved successfully
- [x] Edge cases: Tested rejection with comments, tested permissions (only assigned reviewers can review)

## Documentation
- [x] PROGRESS.md updated (Week 7: 90% → 92%)
- [x] CHANGELOG.md entry added (2025-12-23 - Database & Features sections)
- [x] Week file updated (`docs/implementation/week-7/README.md`)
- [x] API reference updated (added /api/work-items/[id]/review endpoint)

## Screenshots
[Screenshot of review panel with approve/reject buttons]
[Screenshot of version history tab]

## Related
Addresses user feedback from Week 6 testing

## Deployment Notes
Run database migration: `supabase/migrations/20251223_add_review_system.sql`
```

---

## Self-Review Checklist

Use this checklist when reviewing your own PR:

### 1. Code Quality

- [ ] No `console.log()` statements left in code
- [ ] No commented-out code blocks
- [ ] Proper error handling (try/catch, error states)
- [ ] Functions have clear names and single responsibility
- [ ] No hardcoded values (use constants or env vars)
- [ ] TypeScript strict mode passes (`npx tsc --noEmit`)

### 2. Security

- [ ] No API keys or secrets in code
- [ ] No sensitive data in console.log
- [ ] Authentication checked on protected routes
- [ ] Authorization checked (team_id filtering)
- [ ] Input validation on all user inputs (Zod schemas)
- [ ] SQL injection prevented (parameterized queries)

### 3. Testing

- [ ] Edge cases handled (empty states, null values, errors)
- [ ] Loading states present (skeleton, spinner)
- [ ] Error states present (error messages, retry buttons)
- [ ] E2E tests cover main user flow
- [ ] Manual testing done on localhost

### 4. Documentation

- [ ] Complex logic has comments explaining WHY
- [ ] Public functions have JSDoc comments
- [ ] README updated if setup process changed
- [ ] API reference updated if endpoints changed
- [ ] CHANGELOG.md entry added for user-facing changes

### 5. Performance

- [ ] No unnecessary re-renders (React DevTools profiler checked)
- [ ] Database queries use indexes (team_id, workspace_id)
- [ ] Images optimized and lazy-loaded
- [ ] No memory leaks (subscriptions cleaned up)
- [ ] Bundle size reasonable (check with `npm run build`)

### 6. User Experience

- [ ] Error messages are user-friendly (not technical)
- [ ] Success feedback provided (toast messages)
- [ ] Mobile responsive (test on small screen)
- [ ] Keyboard accessible (tab navigation works)
- [ ] Loading states prevent confusion

**How to Use This Checklist**:

1. Open your PR on GitHub
2. Go through each item while viewing the diff
3. Check off items or leave comments on lines that need fixes
4. Make fixes locally, commit, push
5. Re-review until all items checked

---

## Enforcing the Workflow

Even solo developers benefit from enforced workflows to prevent accidentally breaking main.

### Option A: Branch Protection (Recommended for Solo)

**Setup Time**: 5 minutes
**Strictness**: Medium (can bypass for emergencies)
**Best For**: Solo developers who want reminders but need flexibility

**Steps**:

1. Go to GitHub → Your Repository → Settings → Branches
2. Click "Add rule" under Branch protection rules
3. Branch name pattern: `main`
4. Enable these settings:
   - ☑ **Require a pull request before merging**
   - ☑ **Require approvals**: 0 (allows self-merge)
   - ☑ **Allow specified actors to bypass**: [Your username]
5. Click "Create"

**What This Does**:

- ✅ Forces you to create PRs (can't push directly to main)
- ✅ Enables self-review workflow
- ✅ Allows you to bypass for urgent hotfixes
- ✅ No blocked deployments (0 approvals required)

**When to Bypass**:

- Critical production bug that needs immediate fix
- Urgent security patch
- Configuration change that doesn't need review

---

### Option B: Pre-Push Hook (Strict)

**Setup Time**: 10 minutes
**Strictness**: High (completely blocks direct pushes)
**Best For**: Solo developers who want strict enforcement

**Steps**:

1. **Install Husky** (git hook manager):

```bash
cd next-app
npm install --save-dev husky
```

1. **Initialize Husky**:

```bash
npx husky install
```

1. **Create pre-push hook**:

```bash
npx husky add .husky/pre-push
```

1. **Edit `.husky/pre-push` file**:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Get current branch name
branch=$(git branch --show-current)

# Block push to main
if [ "$branch" = "main" ]; then
  echo "🚫 Direct push to main blocked!"
  echo ""
  echo "Create a feature branch instead:"
  echo "  git checkout -b feat/your-feature"
  echo ""
  echo "Or if you REALLY need to push to main:"
  echo "  git push --no-verify"
  exit 1
fi

echo "✅ Pushing to branch: $branch"
```

1. **Make hook executable**:

```bash
chmod +x .husky/pre-push
```

1. **Commit the hook**:

```bash
git add .husky/pre-push
git commit -m "chore: add pre-push hook to block main"
git push
```

**What This Does**:

- 🚫 **Completely blocks** direct pushes to main
- ✅ Forces you to use feature branches
- ✅ Provides helpful error message with instructions
- ⚠️ Can bypass with `git push --no-verify` (for emergencies)

**Testing the Hook**:

```bash
# Should be blocked
git checkout main
git push origin main
# Output: "🚫 Direct push to main blocked!"

# Should work
git checkout -b feat/test
git push origin feat/test
# Output: "✅ Pushing to branch: feat/test"
```

---

### Comparison: Branch Protection vs Pre-Push Hook

| Aspect | Branch Protection | Pre-Push Hook |
|--------|------------------|---------------|
| **Enforcement** | GitHub-side | Local machine |
| **Strictness** | Medium (can bypass) | High (blocks locally) |
| **Setup** | 5 min (web interface) | 10 min (npm install) |
| **Works offline** | No | Yes |
| **Bypassing** | Easy (checkbox) | Requires `--no-verify` |
| **Best for** | Solo devs wanting reminders | Solo devs wanting strict rules |

**Recommendation**: Start with **Branch Protection** (Option A). If you find yourself bypassing too often, stick with it. If you want stricter enforcement, add **Pre-Push Hook** (Option B) as well.

---

## Integration with Phase Commands

The phase-specific commands automate parts of this workflow while preserving critical manual review steps:

### How Phase Commands Map to Workflow Steps

| Workflow Step | Phase Command | What It Does |
|---------------|---------------|--------------|
| Step 1: Start fresh | `/status-check` | Reads current progress, selects next task |
| Step 2: Create branch | `/research-plan` | **Creates feature branch automatically** |
| Step 3: Develop | `/parallel-dev` | Implements with parallel agents, commits changes |
| Step 4-5: Push + Create PR | `/deploy` | **Pushes to remote + Creates PR (STOPS HERE)** |
| Step 6: Self-review | **(Manual)** | **Review PR on GitHub - CRITICAL!** |
| Step 7: Merge | `/merge` | **Squash-merges PR after your approval** |
| Step 8: Verify | (Manual) | Test on production URL |

**IMPORTANT**: `/deploy` does NOT auto-merge! It creates the PR and waits for you to manually review (Step 6) before you run `/merge`.

### Example: Using Phase Commands

```
You: /research-plan

Claude:
✅ Research & Planning Complete

**Branch Created**: feat/enable-e2e-cicd  ← Step 2 automated!

Plan:
1. Add Supabase secrets to GitHub
2. Edit .github/workflows/playwright.yml
3. Test with manual trigger

✅ Run `/parallel-dev` to implement.

---

You: /parallel-dev

Claude:
✅ Development Complete

Changes:
- Edited .github/workflows/playwright.yml
- Enabled automatic PR triggers

Committed: "ci: enable automated E2E tests on push/PR"  ← Step 3 automated!

✅ Run `/quality-review` to verify.

---

You: /deploy

Claude:
✅ PR Created Successfully

PR URL: https://github.com/.../pull/49  ← Steps 4-5 automated!

🛑 NEXT STEP: Manual Self-Review Required (Step 6)

Go to the PR URL and:
1. Review the full diff carefully
2. Check all automated test results
3. Verify merge criteria checklist
4. Look for bugs, security issues, debug code

When self-review complete, run: /merge

---

You: (Reviews PR on GitHub for 10 minutes, finds and fixes a typo)

You: /merge

Claude:
🔍 Validating merge criteria...
✅ All tests passing
✅ Self-review completed
✅ No merge conflicts
✅ Branch up-to-date with main

🔄 Squash-merging PR #49...
✅ PR merged: feat: enable automated E2E tests on push/PR
✅ Branch deleted: feat/enable-e2e-cicd
✅ Switched to main
✅ Pulled latest changes

📝 New commit on main:
   a1b2c3d - ci: enable automated E2E tests on push/PR (#49)

Next step: Verify on production (Step 8)
```

### What Stays Manual vs Automated

| Step | Manual or Automated? | Why |
|------|---------------------|-----|
| 1. Start fresh | Automated (`/status-check`) | Safe to automate |
| 2. Create branch | Automated (`/research-plan`) | Safe to automate |
| 3. Develop | Automated (`/parallel-dev`) | Claude writes code |
| 4-5. Push + Create PR | Automated (`/deploy`) | Safe to automate |
| 6. Self-review | **MANUAL - REQUIRED** | **Critical step - catches 80% of bugs!** |
| 7. Merge | Automated (`/merge`) | Only after you approve in Step 6 |
| 8. Verify | **Manual** | You need to test live site |

**Key Insight**: Phase commands handle the tedious parts (branch creation, commits, PR creation) but **YOU still do the critical thinking** (self-review is MANDATORY before `/merge` command will work).

**The Workflow Flow**:

1. `/research-plan` → Creates branch (Step 2)
2. `/parallel-dev` → Implements code (Step 3)
3. `/deploy` → **Creates PR and STOPS** (Steps 4-5)
4. **YOU manually review** on GitHub (Step 6) ← This is where bugs are caught!
5. `/merge` → Only works if Step 6 complete (Step 7)
6. **YOU manually verify** on production (Step 8)

---

## Common Mistakes & Fixes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **Forgot to pull main** | Merge conflicts when pushing | `git checkout main && git pull && git rebase main` |
| **Committed to main directly** | Can't push (if hook enabled) | `git checkout -b feat/temp && git push` |
| **Made typo in commit message** | Embarrassing history | `git commit --amend -m "fixed message"` (before push) |
| **Need to undo last commit** | Wrong files committed | `git reset HEAD~1` (keeps changes) or `git reset --hard HEAD~1` (deletes changes) |
| **Branch out of date with main** | Merge conflicts in PR | `git checkout feat/branch && git rebase main` |
| **Pushed secrets to GitHub** | Security vulnerability | 1. Rotate secrets immediately<br>2. Add to .gitignore<br>3. Force push with secrets removed |
| **PR too large to review** | 500+ line diff | Create multiple smaller PRs - one feature at a time |
| **Forgot to create branch** | Working on main | `git checkout -b feat/temp` (moves commits to new branch) |
| **Want to delete branch** | Too many branches | `git branch -d branch-name` (local) or `git push origin --delete branch-name` (remote) |

---

## Advanced Topics

### Git Worktrees for Parallel Development

**Problem**: You're working on `feat/feature-a` but need to quickly fix a bug on main without losing your progress.

**Solution**: Git worktrees let you check out multiple branches simultaneously in different directories.

**Setup**:

```bash
# Your main project directory
cd ~/projects/platform-test

# Create worktree for bug fix
git worktree add ../platform-test-bugfix fix/urgent-bug

# Now you have TWO directories:
# 1. ~/projects/platform-test (feat/feature-a branch)
# 2. ~/projects/platform-test-bugfix (fix/urgent-bug branch)

# Work in bug fix directory
cd ../platform-test-bugfix
# ... make fixes ...
git add . && git commit -m "fix: urgent bug"
git push -u origin fix/urgent-bug

# Create PR and merge
gh pr create --title "Fix urgent bug" --body "..."
gh pr merge --squash

# Go back to feature work
cd ~/projects/platform-test
# Continue working on feat/feature-a

# Cleanup when done
git worktree remove ../platform-test-bugfix
```

**Benefits**:

- ✅ No context switching (keep both branches open)
- ✅ No stashing or committing half-done work
- ✅ Work on multiple features in parallel
- ✅ Different dev servers for each worktree

**When to Use**:

- Urgent hotfixes while working on features
- Reviewing someone else's PR locally
- Working on multiple features simultaneously
- Testing changes without affecting main branch

---

## Learning Resources

### Official Documentation

- [Git Branching - Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) - Git fundamentals
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow) - Official GitHub workflow
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials) - Comprehensive git guides

### Best Practices

- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message standards
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/) - The 7 rules
- [Git Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow) - Detailed explanation

### Interactive Learning

- [Learn Git Branching](https://learngitbranching.js.org/) - Visual, interactive tutorial
- [GitHub Skills](https://skills.github.com/) - Hands-on GitHub courses
- [Git Immersion](http://gitimmersion.com/) - Step-by-step git tutorial

### Advanced Topics

- [Pro Git Book](https://git-scm.com/book/en/v2) - Free comprehensive book
- [Git Worktrees Tutorial](https://www.gitkraken.com/learn/git/git-worktree) - Parallel development
- [Rebase vs Merge](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) - When to use each

### YouTube Channels

- [Fireship](https://www.youtube.com/c/Fireship) - Git in 100 seconds series
- [The Net Ninja](https://www.youtube.com/c/TheNetNinja) - Git & GitHub tutorial playlist
- [Traversy Media](https://www.youtube.com/c/TraversyMedia) - Git crash courses

---

## Summary

### Key Takeaways

1. **Main branch is always production-ready** - Never commit directly to main
2. **Self-review catches 80% of bugs** - Always review your own PRs
3. **Atomic commits create clear history** - One commit = one logical change
4. **Branch names should be descriptive** - `feat/add-user-profile` not `feat/update`
5. **Squash and merge keeps main clean** - One commit per feature
6. **10-25 min overhead saves 2-4 hours debugging** - Workflow pays for itself

### The Professional Developer Mindset

**Beginner Thinking**: "I just want to write code and ship it fast!"

**Professional Thinking**: "I want to write code that works, ship it safely, and sleep well at night."

The workflow overhead (10-25 minutes) is an investment that prevents:

- 🚫 Production bugs that take hours to debug
- 🚫 Breaking changes that affect users
- 🚫 Losing work due to bad commits
- 🚫 Unclear history that makes debugging impossible

**Embrace the workflow. It makes you a better developer.**

---

**Last Updated**: 2025-12-23
**Related**: [CLAUDE.md](../../CLAUDE.md) - Quick reference version
**Next Steps**: Practice the 8-step workflow on a small feature to build muscle memory
