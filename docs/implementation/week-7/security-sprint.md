# Week 7: Security & Infrastructure Sprint

**Last Updated:** 2026-01-14
**Sprint Duration:** 2025-12-25 to 2025-12-28

[Back to Week 7 Overview](README.md)

---

## Overview

Post-Week 7 sprint focused on comprehensive security hardening and CI/CD improvements.

---

## Security Hardening

### CodeQL Alerts Resolved (67 total)

| Category | Count | Examples |
|----------|-------|----------|
| ReDoS | 12 | Regex patterns vulnerable to backtracking |
| HTML Injection | 8 | Unsanitized user input |
| Prototype Pollution | 5 | Object property access issues |
| Insecure Randomness | 3 | Math.random() usage |
| Other | 39 | Various security patterns |

### SonarCloud Critical Issues Fixed

- postMessage origin validation
- Array.sort stability issues
- Unvalidated redirects

### Archive Cleanup

- Deleted `/archive/vanilla-version/` (25+ alerts)
- Removed legacy code no longer in use

### Workflow Security

- Added `permissions: contents: read` to all workflows
- Restricted GitHub Actions permissions

---

## Code Quality

### ESLint/TypeScript Issues Fixed

- **316 issues** fixed across **40+ files**
- Categories: unused variables, type assertions, any types

### E2E Test Stability

- Improved from ~60% to ~90% pass rate
- Chromium-only CI for consistency
- Reduced flaky tests

---

## CI/CD Improvements

### Greptile AI Code Review

- Configured for all PRs
- Automatic review comments on code changes
- Security-focused analysis

### Dependabot Optimization

- E2E skip for bot PRs (reduces CI load)
- Automatic label assignment

### Workflow Concurrency

- Added concurrency groups
- Prevents duplicate workflow runs

### Vercel Deploy Optimization

- ~60% fewer deploys
- Skip deploys for non-production changes

---

## Dependency Updates

### Major Updates

| Package | Version | PR |
|---------|---------|---|
| Next.js | 16.0.1 -> 16.1.1 | #17 |
| @modelcontextprotocol/sdk | 1.21.0 -> 1.25.1 | #13 |

### Patch Updates

| Package | Version | PR |
|---------|---------|---|
| nodemailer | patch | #14 |
| js-yaml | patch | #15 |
| body-parser | patch | #16 |
| **27 production deps** | Various | #27 |

---

## Dependabot Production Dependencies Fix (2025-12-28)

**What Changed:**

- Fixed Dependabot PR #24 with 27 production dependency updates
- Resolved breaking changes in major version upgrades
- Pinned `@ai-sdk/react` to v2 (v3 requires AI SDK 6 which is BETA)
- Upgraded `react-grid-layout` to v2 using legacy API
- Removed `@types/react-grid-layout` (v2 includes TypeScript types)
- Created missing `automated` GitHub label

**Breaking Changes Resolved:**

| Package | From | To | Fix Applied |
|---------|------|-----|-------------|
| `@ai-sdk/react` | 2.0.104 | 3.0.3 (blocked) | Pinned to v2 |
| `react-grid-layout` | 1.5.2 | 2.1.1 | Use legacy import |
| `@types/react-grid-layout` | 1.3.6 | - | Removed |

**Why:**

- AI SDK v6 is BETA (announced Dec 2025) - not production-ready
- react-grid-layout v2 has legacy compatibility layer
- React 19.2.3 includes security patch (CVE-2025-55182)

**Files Modified:**

- `next-app/package.json` - Pinned versions
- `next-app/src/components/analytics/widgets/dashboard-builder.tsx` - Legacy import
- `next-app/package-lock.json` - Regenerated

**PRs:**

- Closed: #24 (original Dependabot PR)
- Merged: #27 (fix PR with all updates)

---

## Dependencies Created

- [Post-launch] AI SDK v6 migration when stable
- [Post-launch] react-grid-layout v2 native API migration

---

[Back to Week 7 Overview](README.md)
