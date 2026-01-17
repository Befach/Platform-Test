# GitHub Repository Configuration Guide

**Last Updated**: 2025-12-24
**Purpose**: Step-by-step instructions for configuring GitHub repository settings to enforce professional Git workflow

---

## Overview

This guide documents the GitHub web UI configuration required to complete the professional Git workflow implementation. These settings enforce workflow rules and enable automated testing.

---

## Part 1: Branch Protection Rules

**Goal:** Prevent direct pushes to main and require PR workflow

### Steps

1. **Navigate to Branch Protection Settings**
   - Go to your GitHub repository
   - Click **Settings** (top navigation)
   - Click **Branches** (left sidebar under "Code and automation")
   - Click **Add rule** button

2. **Configure Branch Name Pattern**

   ```
   Branch name pattern: main
   ```

3. **Enable Required Settings**

   Check these boxes:

   #### ✅ Require a pull request before merging

   - **Require approvals**: `0` (for solo development, allows self-merge)
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ❌ **Require review from Code Owners** (leave unchecked)

   #### ✅ Require status checks to pass before merging

   - ✅ **Require branches to be up to date before merging**
   - **Status checks that are required** (after adding GitHub secrets):
     - Type in search box: `test` (will show after first PR runs)
     - Select: `test` (the Playwright job)

   #### ✅ Require conversation resolution before merging

   #### ❌ Require signed commits

   - Leave unchecked (adds overhead for solo development)

   #### ✅ Require linear history

   - This enforces squash/rebase only, preventing merge commits

   #### ❌ Include administrators

   - Leave unchecked to allow emergency bypasses

   #### ✅ Restrict who can push to matching branches

   - ❌ **Allow force pushes** (leave unchecked)
   - ❌ **Allow deletions** (leave unchecked)

4. **Save Changes**
   - Scroll to bottom
   - Click **Create** button

### Verification

Test that branch protection is working:

```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> README.md
git add .
git commit -m "test: direct push"
git push

# Expected error from local hook:
# 🚫 Direct push to main blocked!

# Try to bypass local hook (should fail from GitHub)
git push --no-verify

# Expected error from GitHub:
# remote: error: GH006: Protected branch update failed
```

---

## Part 2: Merge Strategy Configuration

**Goal:** Enforce "Squash and merge" only for clean, linear Git history

### Steps

1. **Navigate to General Settings**
   - Go to your GitHub repository
   - Click **Settings** (top navigation)
   - Stay on **General** tab (default)

2. **Scroll to "Pull Requests" Section**
   - Scroll down to find "Pull Requests" section

3. **Configure Merge Options**

   #### Allow merge commits

   - ❌ **Uncheck** this box
   - This disables the "Merge" button on PRs

   #### Allow squash merging

   - ✅ **Check** this box
   - ✅ **Default to pull request title and commit details**
   - This becomes the ONLY merge option available

   #### Allow rebase merging

   - ❌ **Uncheck** this box
   - This disables the "Rebase and merge" button on PRs

4. **Enable Additional Options**

   #### Always suggest updating pull request branches

   - ✅ **Check** this box
   - Shows a helpful "Update branch" button when PR is behind main

   #### Automatically delete head branches

   - ✅ **Check** this box
   - Auto-deletes feature branches after merge (cleaner repo)

5. **Save Changes**
   - Scroll to bottom
   - Click **Save changes** button

### Verification

After creating a test PR:

- Only "Squash and merge" button should be visible
- "Merge" and "Rebase and merge" buttons should be hidden
- After merging, feature branch should auto-delete

---

## Part 3: GitHub Secrets Configuration

**Goal:** Enable E2E tests to run automatically on every PR

### Required Secrets

You need to add **4 secrets** to run Playwright tests in CI/CD:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `TEST_USER_EMAIL` | Test account email | `test@example.com` |
| `TEST_USER_PASSWORD` | Test account password | `SecurePassword123!` |

### Steps to Add Secrets

1. **Navigate to Secrets Settings**
   - Go to your GitHub repository
   - Click **Settings** (top navigation)
   - Click **Secrets and variables** (left sidebar under "Security")
   - Click **Actions**

2. **Add Each Secret**

   For each of the 4 secrets above:

   a. Click **New repository secret** button

   b. Fill in the form:
      - **Name**: Enter the exact secret name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
      - **Secret**: Paste the value
        - For Supabase URL/key: Get from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
        - For test credentials: Create a test user in your Supabase project

   c. Click **Add secret**

   d. Repeat for all 4 secrets

3. **Verify All Secrets Added**

   After adding all 4, you should see:

   ```
   Repository secrets (4)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - TEST_USER_EMAIL
   - TEST_USER_PASSWORD
   ```

### Creating Test User Account

Before adding `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` secrets:

1. **Create Test User in Supabase**

   ```bash
   # Option A: Via Supabase Dashboard
   # - Go to Authentication → Users
   # - Click "Add user" → Create new user
   # - Email: test@example.com
   # - Password: (generate secure password)
   # - Auto-confirm: Yes
   ```

2. **Assign Test User to a Team**
   - Test user needs team membership to pass RLS policies
   - Create a test team or add to existing team

3. **Use These Credentials as Secrets**
   - `TEST_USER_EMAIL`: The email you created
   - `TEST_USER_PASSWORD`: The password you set

### Verification

After adding secrets, trigger a test workflow:

```bash
# Create test branch
git checkout -b test/e2e-ci

# Make empty commit to trigger workflow
git commit --allow-empty -m "test: trigger E2E tests in CI"

# Push to trigger PR workflow
git push -u origin test/e2e-ci

# Create PR
gh pr create --title "Test E2E CI/CD" --body "Testing automated E2E tests"

# Watch workflow run:
# - Go to Actions tab on GitHub
# - Should see "Playwright E2E Tests" running
# - Wait 2-5 minutes for completion
# - Should see green checkmark ✅
```

If tests fail with "Missing secrets" error:

- Double-check secret names match exactly (case-sensitive)
- Verify Supabase URL/key are correct
- Ensure test user exists and is confirmed

---

## Part 4: Status Checks Requirement (After First PR)

**Important:** You can only add required status checks AFTER they've run at least once.

### Steps

1. **Wait for First PR with Tests**
   - Create a PR (tests will run automatically)
   - Wait for "test" job to complete (green checkmark ✅)

2. **Update Branch Protection Rule**
   - Settings → Branches → Edit rule for `main`
   - Scroll to "Require status checks to pass before merging"
   - In the search box, type: `test`
   - Select `test` (the Playwright job)
   - Scroll down and click **Save changes**

3. **Verify Required Status**
   - Create a new PR
   - Try to merge before tests complete (should be blocked)
   - After tests pass, merge button becomes available

---

## Complete Configuration Checklist

Use this checklist to verify all settings are configured:

### Branch Protection

- [ ] Branch protection rule created for `main`
- [ ] "Require a pull request before merging" enabled
- [ ] "Require status checks to pass" enabled (after first PR)
- [ ] "Require linear history" enabled
- [ ] "Restrict who can push" enabled
- [ ] Force pushes and deletions disabled

### Merge Strategy

- [ ] Squash merging enabled (only option)
- [ ] Merge commits disabled
- [ ] Rebase merging disabled
- [ ] "Always suggest updating PR branches" enabled
- [ ] "Automatically delete head branches" enabled

### GitHub Secrets (4 total)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added
- [ ] `TEST_USER_EMAIL` added
- [ ] `TEST_USER_PASSWORD` added

### E2E Tests

- [ ] Test user created in Supabase
- [ ] Test user assigned to a team
- [ ] First PR created to trigger workflow
- [ ] Playwright tests passing in Actions tab
- [ ] `test` status check added to branch protection

### Verification

- [ ] Direct push to `main` blocked (tested locally)
- [ ] Direct push to `main` blocked via `--no-verify` (tested via GitHub)
- [ ] PR created successfully with template
- [ ] E2E tests run automatically on PR
- [ ] Only "Squash and merge" button visible on PR
- [ ] Feature branch auto-deleted after merge

---

## Troubleshooting

### Issue: "Status check 'test' not found"

**Cause:** Status checks don't appear until they've run at least once.

**Solution:**

1. Create a test PR
2. Wait for "Playwright E2E Tests" workflow to complete
3. Return to branch protection settings
4. Add `test` as required status check

---

### Issue: E2E tests fail with "Missing Supabase URL"

**Cause:** Secrets not configured or named incorrectly.

**Solution:**

1. Go to Settings → Secrets and variables → Actions
2. Verify all 4 secrets exist
3. Check secret names match exactly (case-sensitive):
   - `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
4. If wrong, delete and recreate with correct name

---

### Issue: "Cannot merge - Required status check is failing"

**Cause:** E2E tests are failing.

**Solution:**

1. Click "Details" link next to failing check
2. Review test failure logs
3. Fix the issue locally
4. Commit and push fix
5. Tests will re-run automatically

---

### Issue: "Can still merge without approval"

**Expected behavior:** For solo development, 0 approvals required allows self-merge.

If you want stricter controls:

1. Settings → Branches → Edit rule
2. "Require approvals" → Change to `1`
3. Note: You'll need to approve your own PRs (extra click)

---

## Emergency Bypass Procedure

If you need to bypass these protections (production hotfix):

### Local Hook Bypass

```bash
git push --no-verify
```

### GitHub Branch Protection Bypass

**Option A:** Use administrator privileges (if configured)

- Settings → Branches → Edit rule → ✅ "Include administrators"
- WARNING: This disables protection for all admins

**Option B:** Temporarily disable branch protection

1. Settings → Branches → Delete rule for `main`
2. Make urgent fix and push
3. Re-create branch protection rule immediately after

**IMPORTANT:** Document all bypasses in PR description!

---

## Next Steps

After completing GitHub configuration:

1. **Test Full Workflow**
   - Create a feature branch
   - Make a small change
   - Push and create PR
   - Verify all checks run
   - Merge using "Squash and merge"
   - Verify branch auto-deleted

2. **Update Documentation**
   - Mark GitHub setup complete in implementation checklist
   - Update team/stakeholders on new workflow

3. **Monitor Success Metrics**
   - Track bugs prevented by pre-push checks
   - Measure time to merge
   - Review E2E test failure rate

---

## Reference Links

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)

---

**Configuration Complete!** 🎉

Your repository now enforces:

- ✅ PR workflow (no direct main pushes)
- ✅ Automated type checking
- ✅ Automated linting
- ✅ Automated E2E testing
- ✅ Squash-and-merge only
- ✅ Clean, linear Git history
