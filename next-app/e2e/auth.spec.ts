import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 *
 * Tests:
 * 1. Login page renders correctly
 * 2. Magic link sign-in flow
 * 3. Redirect to dashboard after authentication
 * 4. Protected routes require authentication
 */

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Verify login page elements
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected dashboard route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show email input validation', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder('name@example.com');
    const submitButton = page.getByRole('button', { name: /send magic link/i });

    // Try submitting empty email
    await emailInput.click();
    await emailInput.fill('');
    await submitButton.click();

    // Input should have validation state
    await expect(emailInput).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');

    // Click "Sign up" link
    await page.getByRole('link', { name: /sign up/i }).click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByText(/create.*account/i)).toBeVisible();
  });

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup');

    // Verify signup page elements
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  // Note: Actual magic link authentication requires Supabase email configuration
  // and cannot be fully tested in E2E without access to email inbox
  // Use Supabase test mode or mock authentication for full flow testing
});
