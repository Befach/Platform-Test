# Testing Documentation

> **Purpose**: Quality assurance, E2E testing guides, and security audit reports
> **Last Updated**: 2026-01-14

[← Back to Docs Index](../INDEX.md) | [← Back to Root](../../README.md)

---

## Documents

| Document | Purpose |
| -------- | ------- |
| [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md) | Playwright E2E testing setup and patterns |
| [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) | Security audit findings and recommendations |

---

## Quick Reference

### Running Tests

```bash
# Run all E2E tests
cd next-app && npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui
```

### Test Configuration

- **Framework**: Playwright
- **Browser**: Chromium (CI), all browsers (local)
- **Parallel**: 4 workers

---

[← Back to Docs Index](../INDEX.md) | [← Back to Root](../../README.md)
