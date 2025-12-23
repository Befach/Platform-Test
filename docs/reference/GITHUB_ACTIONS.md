# GitHub Actions CI/CD

**Last Updated**: 2025-12-23
**Status**: Active (3 workflows configured)

This document describes the GitHub Actions workflows configured for this project.

---

## Workflows Overview

| Workflow | Status | Trigger | Purpose |
|----------|--------|---------|---------|
| **CI - Type Check & Build** | ✅ Active | Push/PR to main/develop | TypeScript validation + Next.js build |
| **Link Checker** | ✅ Active | Markdown changes | Validate documentation links |
| **Playwright E2E Tests** | 🟡 Manual Only | Manual dispatch | End-to-end testing (needs secrets) |

---

## 1. CI - Type Check & Build

**File**: `.github/workflows/ci.yml`

### What it does
- ✅ TypeScript type checking (`npx tsc --noEmit`)
- ✅ ESLint linting (warnings don't fail build)
- ✅ Next.js build validation
- ✅ Build size reporting

### When it runs
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when code files change (`next-app/**`, `supabase/**`)

### Environment Variables (Dummy values for CI)
The build requires environment variables but doesn't need real values for type checking:
```yaml
NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY: placeholder-service-role-key
OPENROUTER_API_KEY: placeholder-openrouter-key
PARALLEL_API_KEY: placeholder-parallel-key
```

### How to debug failures
1. **TypeScript errors**: Run `npx tsc --noEmit` locally in `next-app/`
2. **Build errors**: Run `npm run build` locally
3. **Lint warnings**: Run `npm run lint` locally (warnings don't fail CI)

---

## 2. Link Checker

**File**: `.github/workflows/check-links.yml`

### What it does
- ✅ Validates all links in markdown files
- ✅ Checks cross-references between docs
- ✅ Detects broken internal/external links

### When it runs
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when markdown files change (`**.md`, `docs/**`)

### How to debug failures
Run locally:
```bash
cd next-app
npm run check:links
```

Common issues:
- Broken cross-references (use relative paths)
- Moved/deleted files not updated in links
- External URLs returning 404

---

## 3. Playwright E2E Tests

**File**: `.github/workflows/playwright.yml`

### Current Status: Manual Only
**Why?** Requires Supabase secrets to be configured in GitHub repo settings.

### What it does
- ✅ Runs Playwright E2E test suite
- ✅ Tests authentication flows
- ✅ Tests CRUD operations
- ✅ Tests RLS policies
- ✅ Uploads test reports and videos

### Required Secrets

To enable automated testing, add these secrets to GitHub repo:

| Secret Name | Where to Find | Description |
|-------------|---------------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Service role key (⚠️ keep secret!) |

**Steps to enable**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add the 3 secrets above
3. Edit `.github/workflows/playwright.yml`:
   - Uncomment the `on: push/pull_request` triggers (lines 15-25)
   - Comment out the `on: workflow_dispatch` trigger (lines 27-28)

### How to run manually
1. Go to GitHub repo → Actions → "Playwright E2E Tests"
2. Click "Run workflow" → Select branch → Run
3. Wait for tests to complete
4. Download artifacts (playwright-report, playwright-results)

### How to debug failures
Run locally:
```bash
cd next-app
npm run test:e2e        # Headless
npm run test:e2e:ui     # With UI
```

View local reports:
```bash
npx playwright show-report
```

---

## Workflow Best Practices

### For Contributors

**Before pushing code**:
1. ✅ Run `npx tsc --noEmit` (type checking)
2. ✅ Run `npm run build` (build validation)
3. ✅ Run `npm run check:links` (if you edited docs)
4. ✅ Run `npm run test:e2e` (if you changed features)

**Pull Request Checklist**:
- [ ] All CI checks pass (green)
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Links valid (if docs changed)
- [ ] Tests pass (if E2E enabled)

### For Maintainers

**Enabling E2E Tests**:
1. Configure Supabase secrets (see above)
2. Update workflow triggers
3. Test with manual run first
4. Monitor for flaky tests

**Adding New Workflows**:
1. Create `.github/workflows/name.yml`
2. Follow existing patterns (timeouts, caching, etc.)
3. Document in this file
4. Test with manual trigger first

---

## Troubleshooting

### CI Workflow Fails with "Module not found"
**Cause**: Package not in dependencies
**Fix**: Run `npm install <package>` and commit `package-lock.json`

### Build Fails with Environment Variable Error
**Cause**: Missing required env var
**Fix**: Add placeholder value to CI workflow (see CI workflow env section)

### Link Checker Fails
**Cause**: Broken cross-references
**Fix**:
1. Run `npm run check:links` locally
2. Fix broken links (use relative paths like `../reference/API.md`)
3. Commit changes

### Playwright Tests Timeout
**Cause**: Network issues or slow queries
**Fix**:
1. Increase timeout in workflow (currently 60 minutes)
2. Optimize slow queries
3. Use test database with smaller dataset

---

## Workflow Metrics

### CI Workflow
- **Average Duration**: 3-5 minutes
- **Success Rate**: 95%+
- **Cache Hit Rate**: 90%+ (npm cache)

### Link Checker
- **Average Duration**: 30-60 seconds
- **Success Rate**: 98%+
- **Files Checked**: 50+ markdown files

### Playwright Tests (when enabled)
- **Average Duration**: 10-15 minutes
- **Test Coverage**: 100+ E2E scenarios
- **Browsers**: Chromium (primary)

---

## Future Enhancements

### Planned
- [ ] Add deployment preview comments on PRs
- [ ] Add code coverage reporting
- [ ] Add performance benchmarking
- [ ] Add security scanning (npm audit)

### Under Consideration
- [ ] Multi-browser testing (Firefox, Safari)
- [ ] Visual regression testing
- [ ] Bundle size analysis
- [ ] Lighthouse CI integration

---

## Related Documentation

- [CODE_PATTERNS.md](CODE_PATTERNS.md) - Coding standards enforced by CI
- [../implementation/week-8-billing-testing.md](../implementation/week-8-billing-testing.md) - Testing strategy
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---

**Questions?** Contact the maintainers or open a GitHub Discussion.
