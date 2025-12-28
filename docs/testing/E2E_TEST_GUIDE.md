# E2E Testing Guide

**Last Updated**: 2025-01-19
**Status**: Complete - Comprehensive Testing Infrastructure
**Framework**: Playwright with TypeScript

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Helpers and Fixtures](#test-helpers-and-fixtures)
6. [Debugging Tests](#debugging-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Navigate to the Next.js app directory
cd next-app

# Install Playwright and browsers (already included in package.json)
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### View Test Report

```bash
# Open HTML report of last test run
npm run test:report

# View trace from failed test
npm run test:trace
```

---

## Test Structure

```
next-app/
├── e2e/                          # E2E test files
│   ├── 01-auth.spec.ts          # Authentication tests
│   ├── 02-multi-tenant-isolation.spec.ts  # Security/isolation tests
│   ├── 03-team-management.spec.ts # Team management tests
│   ├── 04-features.spec.ts      # Feature CRUD tests
│   ├── mind-map.spec.ts         # Mind mapping tests
│   ├── dependencies.spec.ts     # Dependency graph tests
│   └── security.spec.ts         # Security tests
│
├── tests/                         # Test utilities and fixtures
│   ├── helpers/
│   │   └── auth.ts              # Authentication helpers
│   ├── fixtures/
│   │   └── test-data.ts         # Test data and fixtures
│   └── utils/
│       ├── database.ts          # Database utilities for test setup
│       └── fixtures.ts          # Playwright fixtures
│
├── playwright.config.ts         # Playwright configuration
├── .env.test                    # Test environment variables
└── package.json                 # Scripts and dependencies
```

---

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test e2e/01-auth.spec.ts
```

### Run Specific Test

```bash
npx playwright test e2e/01-auth.spec.ts -g "should display login page"
```

### Run Tests by Browser

```bash
# Chromium only
npm run test:e2e:chrome

# Firefox only
npm run test:e2e:firefox

# WebKit only
npm run test:e2e:webkit

# Mobile browsers
npm run test:e2e:mobile
```

### Run Tests in Different Modes

```bash
# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# UI mode (interactive)
npm run test:e2e:ui

# Watch mode (re-run on changes)
npm run test:e2e:watch

# Single worker (no parallelization)
npm run test:e2e:single
```

### Generate and View Reports

```bash
# Run tests and generate report
npm run test:e2e

# View HTML report
npm run test:report

# View trace from failed test
npm run test:trace
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/some-page');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click me")');

    // Act
    await button.click();

    // Assert
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

### Using Fixtures (Database Setup)

```typescript
import { test, expect } from '@playwright/test';
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  cleanupTeamData,
} from '../tests/utils/database';

test.describe('My Feature', () => {
  let teamId: string;
  let workspaceId: string;

  test.beforeAll(async () => {
    // Create test data
    const team = await createTeamInDatabase({
      name: 'Test Team',
      ownerId: 'test_user',
    });
    teamId = team.id;

    const workspace = await createWorkspaceInDatabase({
      name: 'Test Workspace',
      teamId: teamId,
    });
    workspaceId = workspace.id;
  });

  test.afterAll(async () => {
    // Cleanup
    await cleanupTeamData(teamId);
  });

  test('should work with test data', async ({ page }) => {
    await page.goto(`/workspaces/${workspaceId}`);

    await expect(page.locator('text=Test Workspace')).toBeVisible();
  });
});
```

### Using Authentication Helpers

```typescript
import { test, expect } from '@playwright/test';
import { loginUser, logoutUser } from '../tests/helpers/auth';
import { TEST_USERS, TEST_PATHS } from '../tests/fixtures/test-data';

test.describe('Authenticated Features', () => {
  test('should login and access dashboard', async ({ page }) => {
    // Login
    await loginUser(page, TEST_USERS.userA.email, TEST_USERS.userA.password);

    // Verify authenticated
    await expect(page).toHaveURL(/dashboard|workspaces/);

    // Logout
    await logoutUser(page);

    // Verify logged out
    await expect(page).toHaveURL(/login/);
  });
});
```

---

## Test Helpers and Fixtures

### Authentication Helpers (`tests/helpers/auth.ts`)

```typescript
// Login user
await loginUser(page, email, password);

// Logout user
await logoutUser(page);

// Get auth token
const token = await getAuthToken(page);

// Create test user
const user = await createTestUser(email, password, teamName);

// Create team
const team = await createTestTeam(page, teamName);

// Create workspace
const workspace = await createTestWorkspace(page, teamId, workspaceName);

// Check if authenticated
const isAuth = await isUserAuthenticated(page);

// Get current user ID
const userId = await getCurrentUserId(page);

// Cleanup test data
await cleanupTestData(userIds, teamIds, workspaceIds);
```

### Database Utilities (`tests/utils/database.ts`)

```typescript
// Create team in database
const team = await createTeamInDatabase({
  name: 'Team Name',
  ownerId: 'user_id',
});

// Create workspace
const workspace = await createWorkspaceInDatabase({
  name: 'Workspace',
  teamId: team.id,
});

// Create work item
const item = await createWorkItemInDatabase({
  title: 'Feature Title',
  type: 'feature',
  status: 'planned',
  priority: 'high',
  teamId: team.id,
  workspaceId: workspace.id,
});

// Add team member
await addTeamMemberInDatabase(userId, teamId, 'member');

// Cleanup team data
await cleanupTeamData(teamId);

// Cleanup workspace
await cleanupWorkspaceData(workspaceId);

// Get IDs by name
const teamId = await getTeamIdByName('Team Name');
const workspaceId = await getWorkspaceIdByName(teamId, 'Workspace');
const itemId = await getWorkItemIdByTitle(workspaceId, 'Feature Title');

// Verify isolation
const isIsolated = await verifyTeamIsolation(userId, teamA, teamB);
```

### Test Data Fixtures (`tests/fixtures/test-data.ts`)

```typescript
// Test users
TEST_USERS.userA
TEST_USERS.userB
TEST_USERS.userC

// Test teams
TEST_TEAMS.teamA
TEST_TEAMS.teamB

// Test workspaces
TEST_WORKSPACES.productRoadmap
TEST_WORKSPACES.mobileApp

// Test work items
TEST_WORK_ITEMS.authentication
TEST_WORK_ITEMS.realTimeSync

// Navigation paths
TEST_PATHS.login
TEST_PATHS.dashboard
TEST_PATHS.features(workspaceId)

// Common selectors
TEST_SELECTORS.createButton
TEST_SELECTORS.deleteButton
TEST_SELECTORS.emailInput
```

---

## Debugging Tests

### UI Mode (Interactive Debugging)

```bash
npm run test:e2e:ui
```

Allows you to:
- Step through tests
- Pause execution
- Inspect elements
- View test timeline
- Re-run individual tests

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector with:
- Step through code
- Set breakpoints
- Inspect DOM
- View console
- Evaluate expressions

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser window for visual inspection.

### Screenshots and Videos

Screenshots and videos are automatically captured on failure:
- `test-results/` - Failed test artifacts
- `playwright-report/` - HTML report with traces

### Add Console Logging

```typescript
test('should debug something', async ({ page }) => {
  console.log('Current URL:', page.url());
  console.log('Page content:', await page.content());

  // Use page.pause() to pause execution
  await page.pause();

  await expect(something).toBeDefined();
});
```

### Inspect Network Requests

```typescript
test('should capture network requests', async ({ page }) => {
  // Wait for network response
  const response = await page.waitForResponse(
    response => response.url().includes('/api/') && response.status() === 200
  );

  console.log('Response:', response.status(), response.url());
});
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
e2e_tests:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
```

---

## Best Practices

### 1. Use Page Object Model (Optional but Recommended)

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }
}

// In test:
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
});
```

### 2. Use Stable Selectors

```typescript
// Bad - fragile selectors
await page.click('button:nth-child(3)');  // ❌
await page.click('div > div > button');    // ❌

// Good - stable selectors
await page.click('button[data-testid="create-item"]');  // ✅
await page.click('button:has-text("Create")');          // ✅
await page.locator('input[name="email"]').fill('...');  // ✅
```

### 3. Wait for Elements Properly

```typescript
// Bad - arbitrary waits
await page.waitForTimeout(2000);  // ❌

// Good - wait for specific conditions
await page.waitForURL(/dashboard/);  // ✅
await expect(page.locator('.loading')).not.toBeVisible();  // ✅
await page.waitForLoadState('networkidle');  // ✅
```

### 4. Test User Journeys (Integration Tests)

```typescript
test('complete user journey', async ({ page }) => {
  // Sign up
  await page.goto('/signup');
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.click('button:has-text("Sign up")');

  // Create workspace
  await page.click('button:has-text("Create Workspace")');
  await page.fill('input[name="name"]', 'My Project');
  await page.click('button:has-text("Create")');

  // Create feature
  await page.click('button:has-text("Add Feature")');
  await page.fill('input[name="title"]', 'User Auth');
  await page.click('button:has-text("Create")');

  // Verify
  await expect(page.locator('text=User Auth')).toBeVisible();
});
```

### 5. Isolate Tests

```typescript
test.describe('Team Management', () => {
  let teamId: string;

  test.beforeAll(async () => {
    // Create unique test data
    const team = await createTeamInDatabase({
      name: `Team-${Date.now()}`,
      ownerId: `user-${Date.now()}`,
    });
    teamId = team.id;
  });

  test.afterAll(async () => {
    // Clean up - test data only affects this describe block
    await cleanupTeamData(teamId);
  });

  test('test 1', async ({ page }) => {
    // Independent test
  });

  test('test 2', async ({ page }) => {
    // Independent test
  });
});
```

### 6. Use Appropriate Timeouts

```typescript
// Global timeout from config: 30 seconds
// Expect timeout: 10 seconds

// For slower operations
await page.waitForLoadState('networkidle', { timeout: 15000 });

// For specific element wait
await expect(element).toBeVisible({ timeout: 5000 });
```

---

## Troubleshooting

### Issue: Tests Pass Locally but Fail in CI

**Causes**:
- Different environment variables
- Time zone differences
- Network differences
- Database state

**Solutions**:
```bash
# Use same environment
npm run test:e2e

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Run with CI flag
CI=true npm run test:e2e
```

### Issue: Tests Are Flaky (Intermittently Fail)

**Causes**:
- Timing issues (element not ready)
- Network flakiness
- Concurrent test interference
- Random ID collisions

**Solutions**:
```typescript
// Use proper waits
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();

// Ensure unique data
const uniqueName = `item-${Date.now()}-${Math.random()}`;

// Run single worker
npm run test:e2e:single

// Check test isolation
test.afterEach(async ({ page }) => {
  // Ensure cleanup
  // Clear localStorage, delete data, etc.
});
```

### Issue: Authentication Not Working

**Causes**:
- Auth helper assumes specific page structure
- Auth method doesn't match implementation
- Session not persisted

**Solutions**:
```typescript
// Check actual login form structure
await page.goto('/login');
await page.pause();  // Inspect page

// Update helpers to match actual form
await page.fill('[data-testid="email-input"]', email);

// Verify session persisted
const token = await page.evaluate(() => localStorage.getItem('sb-auth-token'));
console.log('Token:', token);
```

### Issue: Selectors Not Finding Elements

**Solutions**:
```typescript
// Use debugging
await page.pause();  // Pause to inspect

// Try alternative selectors
// If looking for button
page.locator('button:has-text("Create")');
page.locator('[data-testid="create-button"]');
page.getByRole('button', { name: 'Create' });

// Check if element is in viewport
const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);

// Check DOM
console.log(await page.content());
```

### Issue: Database Operations Failing

**Solutions**:
```typescript
// Verify Supabase connection
const { data, error } = await supabase.from('teams').select('*').limit(1);
console.log('Supabase error:', error);

// Check RLS policies
// Verify team_id in query
// Ensure user has permission

// Use transaction for complex operations
try {
  const team = await createTeamInDatabase(...);
  const workspace = await createWorkspaceInDatabase({...teamId: team.id});
} catch (error) {
  await cleanupTeamData(team.id);
  throw error;
}
```

### Issue: Timeout Errors

**Solutions**:
```typescript
// Increase timeout for slow operations
await page.waitForURL(/path/, { timeout: 15000 });
await expect(element).toBeVisible({ timeout: 10000 });

// Use shorter waits for fast operations
await page.click('button');  // 5 second action timeout

// Check if page is unresponsive
await page.waitForLoadState('networkidle', { timeout: 10000 });

// Debug what's hanging
console.log('Current URL:', page.url());
console.log('Is loading:', await page.evaluate(() => document.readyState));
```

---

## Test Coverage

### Current Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| Authentication | 12 | ✅ Complete |
| Multi-Tenant Isolation | 15 | ✅ Complete |
| Team Management | 18 | ✅ Complete |
| Features/Work Items | 16 | ✅ Complete |
| Mind Mapping | 7 | ⏳ Partial |
| Dependencies | 8 | ⏳ Partial |
| **Total** | **76** | **60% Complete** |

### Next Steps

- [ ] Add API integration tests (REST endpoints)
- [ ] Add performance tests (load time thresholds)
- [ ] Add visual regression tests (screenshot comparison)
- [ ] Add accessibility tests (WCAG compliance)
- [ ] Add mobile-specific tests
- [ ] Implement test parallelization optimizations

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Supabase Docs**: https://supabase.com/docs
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Debugging**: https://playwright.dev/docs/debug
- **CI/CD**: https://playwright.dev/docs/ci

---

## Contact & Support

For issues or questions about E2E testing:

1. Check this guide's Troubleshooting section
2. Review test file comments
3. Run tests in UI mode for interactive debugging
4. Check Playwright documentation

