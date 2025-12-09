/**
 * Playwright Global Setup
 *
 * Runs once before all tests to validate environment and prepare for testing.
 * This ensures tests have the required configuration before starting.
 */

import { chromium, firefox, webkit, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Running global test setup...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY', // Required for RLS bypass in test setup
    'TEST_USER_A_EMAIL',
    'TEST_USER_A_PASSWORD',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Missing optional environment variable: ${envVar}`);
    }
  }

  // 2. Verify Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Try a simple query to verify connection
      const { error } = await supabase.from('teams').select('id').limit(1);

      if (error) {
        warnings.push(`Supabase connection issue: ${error.message}`);
      } else {
        console.log('✅ Supabase connection verified');
      }
    } catch (e) {
      warnings.push(`Failed to connect to Supabase: ${e}`);
    }
  }

  // 3. Check browser installations (warn only, don't fail)
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'Firefox', launcher: firefox },
    { name: 'WebKit', launcher: webkit },
  ];

  for (const browser of browsers) {
    try {
      const instance = await browser.launcher.launch({ headless: true });
      await instance.close();
      console.log(`✅ ${browser.name}: Installed and working`);
    } catch (e) {
      warnings.push(`${browser.name} not installed. Run: npx playwright install ${browser.name.toLowerCase()}`);
    }
  }

  // 4. Verify test user credentials format
  if (process.env.TEST_USER_A_EMAIL && process.env.TEST_USER_A_PASSWORD) {
    if (!process.env.TEST_USER_A_EMAIL.includes('@')) {
      warnings.push('TEST_USER_A_EMAIL does not appear to be a valid email');
    }
    if (process.env.TEST_USER_A_PASSWORD.length < 6) {
      warnings.push('TEST_USER_A_PASSWORD appears too short');
    }
    console.log('✅ Test user credentials configured');
  }

  // 5. Check for service role key (needed for database tests)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Service role key configured (all database tests enabled)');
  } else {
    warnings.push(
      'SUPABASE_SERVICE_ROLE_KEY not set - 80 database tests will be SKIPPED.\n' +
      '      Copy .env.test.example to .env.test and add your service role key to run the full test suite.\n' +
      '      Get the key from: Supabase Dashboard > Settings > API > service_role (secret)'
    );
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  // Fail on errors
  if (errors.length > 0) {
    console.error('\n❌ Errors (tests cannot proceed):');
    errors.forEach((e) => console.error(`   - ${e}`));
    throw new Error(`Global setup failed: ${errors.join(', ')}`);
  }

  console.log('\n✅ Global setup complete!\n');
}

export default globalSetup;
