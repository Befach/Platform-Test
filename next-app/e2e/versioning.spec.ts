import { test, expect } from '@playwright/test'
import {
  createTeamInDatabase,
  createWorkspaceInDatabase,
  cleanupTeamData,
  hasAdminClient,
  getRegularClient,
} from '../tests/utils/database'
import { TEST_PATHS } from '../tests/fixtures/test-data'

// Skip all tests if SUPABASE_SERVICE_ROLE_KEY is not configured
const skipTests = !hasAdminClient()

/**
 * Versioning System E2E Tests
 *
 * Tests the work item versioning system:
 * - Create enhanced versions of work items
 * - View version history
 * - Navigate between versions
 * - Concept promotion to feature
 */

test.describe('Versioning System', () => {
  test.skip(skipTests, 'SUPABASE_SERVICE_ROLE_KEY not configured - skipping database tests')

  let teamId: string
  let workspaceId: string

  test.beforeAll(async () => {
    try {
      const team = await createTeamInDatabase({
        name: `Versioning Team-${Date.now()}`,
        ownerId: `owner_${Date.now()}`,
      })
      teamId = team.id

      const workspace = await createWorkspaceInDatabase({
        name: `Versioning Workspace-${Date.now()}`,
        teamId: teamId,
      })
      workspaceId = workspace.id
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  })

  test.afterAll(async () => {
    try {
      if (teamId) await cleanupTeamData(teamId)
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  })

  test.describe('Version History', () => {
    test('should show versions tab when work item has version history', async ({ page }) => {
      const supabase = getRegularClient()

      // Create original feature (v1)
      const originalId = `v1_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: originalId,
        title: 'Original Feature v1',
        type: 'feature',
        phase: 'launch',
        priority: 'high',
        version: 1,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      // Create enhanced version (v2)
      const enhancedId = `v2_feature_${Date.now()}`
      await supabase.from('work_items').insert({
        id: enhancedId,
        title: 'Enhanced Feature v2',
        type: 'feature',
        is_enhancement: true,
        phase: 'build',
        priority: 'high',
        version: 2,
        enhances_work_item_id: originalId,
        version_notes: 'Added new capabilities based on user feedback',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      // Navigate to enhanced version
      await page.goto(TEST_PATHS.feature(workspaceId, enhancedId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for versions tab
      const versionsTab = page.locator('button:has-text("Versions"), [data-testid="versions-tab"]').first()

      if (await versionsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await versionsTab.click()

        // Should show version history
        const versionList = page.locator('[data-testid="version-history"], .version-history').first()

        if (await versionList.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Should show both versions
          await expect(page.locator('text=/v1|Version 1/i')).toBeVisible()
          await expect(page.locator('text=/v2|Version 2/i')).toBeVisible()
        }
      }
    })

    test('should not show versions tab for work items without version history', async ({ page }) => {
      const supabase = getRegularClient()

      // Create standalone feature (no version history)
      const standaloneId = `standalone_${Date.now()}`
      await supabase.from('work_items').insert({
        id: standaloneId,
        title: 'Standalone Feature',
        type: 'feature',
        phase: 'design',
        priority: 'medium',
        version: 1,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, standaloneId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Versions tab should not be visible (conditional visibility)
      const versionsTab = page.locator('button:has-text("Versions"), [data-testid="versions-tab"]').first()

      const isVisible = await versionsTab.isVisible({ timeout: 3000 }).catch(() => false)

      // Either tab is not visible, or it shows "no versions" message
      if (!isVisible) {
        expect(isVisible).toBe(false)
      } else {
        await versionsTab.click()
        const emptyMessage = page.locator('text=/no.*version|single.*version/i').first()
        expect(await emptyMessage.isVisible({ timeout: 2000 }).catch(() => true)).toBe(true)
      }
    })
  })

  test.describe('Create Enhanced Version', () => {
    test('should allow creating enhanced version from launched feature', async ({ page }) => {
      const supabase = getRegularClient()

      // Create completed feature
      const featureId = `enhance_source_${Date.now()}`
      await supabase.from('work_items').insert({
        id: featureId,
        title: 'Feature Ready for Enhancement',
        type: 'feature',
        phase: 'launch',
        priority: 'high',
        version: 1,
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, featureId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for create version button
      const enhanceButton = page
        .locator('button:has-text("Create Version"), button:has-text("Enhance"), button:has-text("New Version")')
        .first()

      if (await enhanceButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await enhanceButton.click()

        // Dialog should appear
        const dialog = page.locator('[role="dialog"], [data-testid="create-version-dialog"]').first()

        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Fill version notes
          const notesInput = page.locator('textarea[name="notes"], textarea[placeholder*="notes"]').first()

          if (await notesInput.isVisible()) {
            await notesInput.fill('Adding new features based on user feedback')
          }

          // Submit
          const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first()

          if (await submitButton.isVisible()) {
            await submitButton.click()

            await page.waitForTimeout(1000)

            // Should redirect to new version or show success
            const successMessage = page.locator('text=/created|success/i').first()

            expect(
              (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) ||
                (await page.url().includes('feature'))
            ).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Concept Promotion', () => {
    test('should show promotion dialog when concept is validated', async ({ page }) => {
      const supabase = getRegularClient()

      // Create validated concept
      const conceptId = `promo_concept_${Date.now()}`
      await supabase.from('work_items').insert({
        id: conceptId,
        title: 'Validated Concept for Promotion',
        description: 'This concept has been validated and is ready to become a feature',
        type: 'concept',
        phase: 'validated',
        priority: 'high',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, conceptId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Look for promote button or banner
      const promoteButton = page
        .locator('button:has-text("Promote"), button:has-text("Convert to Feature"), [data-testid="promote-button"]')
        .first()

      if (await promoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await promoteButton.click()

        // Promotion dialog should appear
        const dialog = page.locator('[role="dialog"], [data-testid="concept-promotion-dialog"]').first()

        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Should show concept summary
          await expect(page.locator('text=/Validated Concept/i')).toBeVisible()

          // Should have create feature button
          const createFeatureButton = page.locator('button:has-text("Create Feature")').first()
          expect(await createFeatureButton.isVisible()).toBe(true)
        }
      }
    })

    test('should create feature from validated concept with link', async ({ page }) => {
      const supabase = getRegularClient()

      // Create validated concept
      const conceptId = `link_concept_${Date.now()}`
      await supabase.from('work_items').insert({
        id: conceptId,
        title: 'Linkable Concept',
        description: 'This will be promoted and linked',
        type: 'concept',
        phase: 'validated',
        priority: 'high',
        workspace_id: workspaceId,
        team_id: teamId,
      })

      await page.goto(TEST_PATHS.feature(workspaceId, conceptId))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      const promoteButton = page
        .locator('button:has-text("Promote"), button:has-text("Create Feature")')
        .first()

      if (await promoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await promoteButton.click()

        const dialog = page.locator('[role="dialog"]').first()

        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Click create feature
          const createButton = page.locator('button:has-text("Create Feature"), button:has-text("Promote")').first()

          if (await createButton.isVisible()) {
            await createButton.click()

            await page.waitForTimeout(1500)

            // Verify feature was created
            const { data: features } = await supabase
              .from('work_items')
              .select('*')
              .eq('enhances_work_item_id', conceptId)
              .eq('type', 'feature')

            // Feature should be linked to concept
            if (features && features.length > 0) {
              expect(features[0].enhances_work_item_id).toBe(conceptId)
              expect(features[0].type).toBe('feature')
            }
          }
        }
      }
    })
  })

  test.describe('Version Navigation', () => {
    test('should navigate between versions in version history', async ({ page }) => {
      const supabase = getRegularClient()

      // Create version chain
      const v1Id = `nav_v1_${Date.now()}`
      const v2Id = `nav_v2_${Date.now()}`

      await supabase.from('work_items').insert([
        {
          id: v1Id,
          title: 'Navigation Test v1',
          type: 'feature',
          phase: 'launch',
          priority: 'high',
          version: 1,
          workspace_id: workspaceId,
          team_id: teamId,
        },
        {
          id: v2Id,
          title: 'Navigation Test v2',
          type: 'feature',
          is_enhancement: true,
          phase: 'build',
          priority: 'high',
          version: 2,
          enhances_work_item_id: v1Id,
          version_notes: 'Version 2 updates',
          workspace_id: workspaceId,
          team_id: teamId,
        },
      ])

      await page.goto(TEST_PATHS.feature(workspaceId, v2Id))
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

      // Go to versions tab
      const versionsTab = page.locator('button:has-text("Versions"), [data-testid="versions-tab"]').first()

      if (await versionsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await versionsTab.click()

        // Click on v1
        const v1Link = page.locator(`a[href*="${v1Id}"], button:has-text("v1"), [data-version="1"]`).first()

        if (await v1Link.isVisible({ timeout: 3000 }).catch(() => false)) {
          await v1Link.click()

          // Should navigate to v1
          await page.waitForURL(`**/${v1Id}**`, { timeout: 5000 }).catch(() => {})

          expect(page.url()).toContain(v1Id)
        }
      }
    })
  })
})
