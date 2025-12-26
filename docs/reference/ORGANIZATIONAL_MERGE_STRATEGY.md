# Organizational Merge Strategy Configuration

**Date**: 2025-12-24
**Purpose**: Guide for configuring merge strategies at GitHub organization level

---

## Overview

GitHub provides **two levels** for merge strategy configuration:

| Level | Scope | Best For | Enforcement |
|-------|-------|----------|-------------|
| **Organization Rulesets** | All repos or specific repos | Standardizing across multiple projects | Strong (cannot be changed by repo admins) |
| **Repository Settings** | Single repository | Individual project customization | Flexible (repo admins can change) |

---

## Option 1: Organization-Level Rulesets (Recommended for Consistency)

### What Are Repository Rulesets?

**Repository rulesets** are organization-level rules that can:
- Apply to multiple repositories at once
- Enforce merge strategies across your organization
- Override repository-level settings
- Cannot be bypassed by repository administrators

### How to Configure

#### Step 1: Navigate to Organization Settings

**URL Pattern**: `https://github.com/organizations/[YOUR_ORG]/settings/rules`

For your organization: `https://github.com/organizations/Befach-Int/settings/rules`

#### Step 2: Create or Edit a Ruleset

1. Go to **Organization Settings** (requires organization owner/admin permissions)
2. Click **Rules** → **Rulesets** (left sidebar under "Code, planning, and automation")
3. Click **New ruleset** → **New branch ruleset**

#### Step 3: Configure Ruleset Basics

```
Ruleset name: "Main Branch Protection and Merge Strategy"
Enforcement status: Active
Bypass list: (optional - allow org admins to bypass in emergencies)

Target repositories:
○ All repositories (apply to entire org)
● Selected repositories (choose specific repos)
  - Select: Platform-Test

Target branches:
● Include by pattern
  - Pattern: main
  - Pattern: master (if applicable)
```

#### Step 4: Configure Branch Protection Rules

Under **Branch protections**, enable:

```
✅ Require a pull request before merging
   - Required approvals: 0 (for solo dev) or 1+ (for teams)
   - Dismiss stale pull request approvals: ✅
   - Require review from Code Owners: ❌ (unless you have CODEOWNERS file)

✅ Require status checks to pass
   - Require branches to be up to date: ✅
   - Status checks required:
     • test (Playwright E2E tests)
     • Any other CI checks you want to require

✅ Require conversation resolution before merging

✅ Block force pushes
```

#### Step 5: Configure Merge Strategy (The Key Part!)

**Important Note**: As of 2024, GitHub's repository rulesets **do not directly enforce which merge button is available** (squash vs merge commit vs rebase).

**However**, you can achieve similar control using:

1. **Require linear history** (in rulesets):
   - ✅ **Enable "Require linear history"**
   - This effectively **blocks merge commits** (forces squash or rebase only)
   - This is what you want for clean history!

2. **Repository settings** (still need to configure per repo):
   - Even with rulesets, each repository needs merge button settings configured
   - See Option 2 below for repository-level settings

---

## Option 2: Repository-Level Merge Settings (Required Even with Rulesets)

### Why Both Levels?

- **Rulesets**: Enforce that history must be linear (blocks merge commits)
- **Repo settings**: Control which merge buttons are available (squash only)

### Configure Repository Merge Settings

#### For Platform-Test Repository

**Navigate to**: `https://github.com/Befach-Int/Platform-Test/settings`

**Section**: General → Pull Requests

**Configuration**:
```
Pull Request Merges:

✅ Allow squash merging
   └─ Default to pull request title and commit details
   └─ ✅ Default to squash merging (make this the default)

❌ Allow merge commits (UNCHECK THIS)
   └─ This disables the "Merge commit" button

❌ Allow rebase merging (UNCHECK THIS)
   └─ This disables the "Rebase and merge" button

Additional options:
✅ Always suggest updating pull request branches
✅ Automatically delete head branches
```

**Result**:
- Only "Squash and merge" button will be visible
- Merge commits blocked by "Require linear history" (from ruleset)
- Clean, one-commit-per-feature history

---

## Recommended Configuration for Your Organization

Since you already have **organization-level branch protection**, here's the complete setup:

### Organization Ruleset Settings

```yaml
# Location: Organization Settings → Rules → Rulesets
# URL: https://github.com/organizations/Befach-Int/settings/rules

Ruleset Name: "Main Branch Protection"
Enforcement: Active
Target: Platform-Test (or all repositories)
Branch Pattern: main

Rules:
  ✅ Require pull request before merging
     - Approvals: 0 (solo dev)

  ✅ Require status checks to pass
     - test (Playwright)

  ✅ Require linear history ← CRITICAL for merge strategy

  ✅ Block force pushes

  ✅ Require conversation resolution
```

### Repository Settings (Per Repo)

```yaml
# Location: Repository Settings → General → Pull Requests
# URL: https://github.com/Befach-Int/Platform-Test/settings

Merge Buttons:
  ✅ Allow squash merging (default)
  ❌ Allow merge commits (disabled)
  ❌ Allow rebase merging (disabled)

Additional:
  ✅ Auto-delete branches
  ✅ Suggest updating PR branches
```

---

## Verification Checklist

After configuring both levels:

### ✅ Organization Ruleset
- [ ] Navigate to org settings: https://github.com/organizations/Befach-Int/settings/rules
- [ ] Verify "Require linear history" is enabled
- [ ] Verify "Block force pushes" is enabled
- [ ] Verify ruleset applies to `main` branch pattern
- [ ] Verify ruleset applies to Platform-Test repository

### ✅ Repository Settings
- [ ] Navigate to repo settings: https://github.com/Befach-Int/Platform-Test/settings
- [ ] Scroll to "Pull Requests" section
- [ ] Verify only "Allow squash merging" is checked
- [ ] Verify "Default to squash merging" is selected
- [ ] Verify "Automatically delete head branches" is checked

### ✅ Test the Configuration
```bash
# Create test PR with multiple commits
git checkout -b test/merge-strategy
echo "commit 1" >> test.txt && git add . && git commit -m "test: commit 1"
echo "commit 2" >> test.txt && git add . && git commit -m "test: commit 2"
echo "commit 3" >> test.txt && git add . && git commit -m "test: commit 3"
git push -u origin test/merge-strategy

# Create PR
gh pr create --title "test: verify merge strategy" --body "Testing squash-only"

# On GitHub:
# 1. Go to PR page
# 2. Verify ONLY "Squash and merge" button is visible
# 3. Click "Squash and merge"
# 4. Verify all 3 commits become 1 commit on main
# 5. Verify branch auto-deleted after merge
```

---

## Benefits of Organization-Level Configuration

| Benefit | Description |
|---------|-------------|
| **Consistency** | All repositories follow the same standards |
| **Cannot be overridden** | Repo admins cannot disable these rules |
| **Centralized management** | Update rules once, applies everywhere |
| **Audit trail** | Organization-level logs track all changes |
| **Scales well** | Add new repositories, rules auto-apply |

---

## Limitations to Be Aware Of

### What Organization Rulesets CAN Enforce:
- ✅ Require linear history (blocks merge commits)
- ✅ Require pull requests
- ✅ Require status checks
- ✅ Block force pushes
- ✅ Require conversation resolution

### What Organization Rulesets CANNOT Enforce:
- ❌ Which merge buttons are available (squash vs rebase)
- ❌ Auto-delete branches setting
- ❌ Default merge method

**Workaround**: Configure these at repository level (still consistent if you standardize across org)

---

## Alternative: GitHub App for Merge Strategy Enforcement

If you need stricter control, consider using a GitHub App:

### Option: Probot Auto-Merge
- **Purpose**: Automatically enforce merge strategies
- **How**: Bot checks PR and only allows squash merge
- **Setup**: Requires GitHub App installation

### Option: Branch Protection Bot
- **Purpose**: Additional checks beyond GitHub's built-in protection
- **How**: Validates merge method before allowing merge
- **Setup**: Self-hosted or third-party service

**Recommendation**: For solo development, repository-level settings + organization rulesets are sufficient. GitHub Apps add complexity.

---

## Step-by-Step: Enable for Your Organization

### Step 1: Verify Current Ruleset

```bash
# Check if ruleset already exists
# Navigate to: https://github.com/organizations/Befach-Int/settings/rules

# Look for:
# - Ruleset name containing "main" or "branch protection"
# - Target: Platform-Test
# - Status: Active
```

### Step 2: Edit Existing Ruleset

If you already have a ruleset (since you mentioned creating branch protection at org level):

1. Click **Edit** on your existing ruleset
2. Scroll to **Rules** section
3. Find **"Require linear history"**
4. ✅ **Enable this checkbox**
5. Click **Save changes**

### Step 3: Configure Repository Settings

```bash
# Navigate to repository settings
# URL: https://github.com/Befach-Int/Platform-Test/settings

# Scroll to "Pull Requests" section
# Configure as shown in Option 2 above
```

### Step 4: Test the Setup

Create a test PR and verify:
- Only "Squash and merge" button appears
- Merge creates single commit
- Branch auto-deletes after merge

---

## Troubleshooting

### Issue: "Require linear history" Not Available

**Cause**: Older organization plan or ruleset type
**Solution**: Ensure you're using "Branch rulesets" (not legacy branch protection)

**Check**:
- Organization Settings → Rules → Rulesets (new)
- NOT: Repository Settings → Branches (legacy)

---

### Issue: Multiple Merge Buttons Still Visible

**Cause**: Repository settings not configured
**Solution**: Configure repository-level merge button settings (Option 2)

**Why**: Rulesets enforce linear history, but don't hide merge buttons
**Fix**: Repository settings control which buttons are visible

---

### Issue: Cannot Save Ruleset Changes

**Cause**: Insufficient permissions
**Solution**: Requires organization owner or admin role

**To check**: Organization Settings → People → Your role

---

## Documentation References

- **GitHub Rulesets**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets
- **Merge Strategies**: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges
- **Linear History**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-linear-history

---

## Summary: Your Complete Setup

### ✅ Organization Level (Rulesets)
**URL**: https://github.com/organizations/Befach-Int/settings/rules

**Key Setting**: ✅ **Require linear history** (blocks merge commits)

**Additional Settings**:
- Require pull request
- Require status checks (test)
- Block force pushes

### ✅ Repository Level (Settings)
**URL**: https://github.com/Befach-Int/Platform-Test/settings

**Key Setting**: ✅ **Allow squash merging only** (disables other merge methods)

**Additional Settings**:
- Default to squash merging
- Auto-delete branches

### 🎯 Result
- Merge commits: **Blocked** (by org ruleset)
- Rebase merging: **Hidden** (by repo settings)
- Squash merging: **Only option available**
- History: **Always linear and clean**

---

**Next Step**: Verify "Require linear history" is enabled in your organization ruleset, then configure repository merge button settings.
