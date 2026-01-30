'use client'

/**
 * Example Integration: How to use the Onboarding System
 *
 * This file demonstrates how to integrate the onboarding components
 * into your dashboard or main application layout.
 */

import { OnboardingProvider, useOnboarding } from './onboarding-provider'
import { OnboardingChecklist, ChecklistItem } from './onboarding-checklist'
import { TourStep } from './product-tour'
import { Button } from '@/components/ui/button'

// Define your product tour steps
const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content: 'Access all modules from this sidebar. Click any module to get started.',
    placement: 'right',
    spotlightPadding: 12,
  },
  {
    target: '[data-tour="command-palette"]',
    title: 'Command Palette',
    content: 'Press Cmd+K (or Ctrl+K) anytime to open the command palette for quick navigation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="workspace-selector"]',
    title: 'Workspace Selector',
    content: 'Switch between different projects and workspaces here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="create-button"]',
    title: 'Quick Create',
    content: 'Create new features, tasks, or mind maps with one click.',
    placement: 'left',
  },
]

// Define your onboarding checklist
const checklistItems: ChecklistItem[] = [
  {
    id: 'create_workspace',
    title: 'Create your first workspace',
    description: 'Set up a workspace to organize your product development',
    completed: false,
    action: {
      label: 'Create Workspace',
      href: '/workspaces/new',
    },
  },
  {
    id: 'add_feature',
    title: 'Add your first feature',
    description: 'Start planning by adding a feature to your roadmap',
    completed: false,
    action: {
      label: 'Add Feature',
      onClick: () => {
        // Open create feature dialog
        console.log('Open create feature dialog')
      },
    },
  },
  {
    id: 'create_canvas',
    title: 'Try the canvas tool',
    description: 'Brainstorm ideas with our BlockSuite canvas',
    completed: false,
    action: {
      label: 'Open Canvas',
      href: '/canvas',
    },
  },
  {
    id: 'invite_team',
    title: 'Invite team members',
    description: 'Collaborate with your team on product development',
    completed: false,
    action: {
      label: 'Invite Team',
      href: '/team/invite',
    },
  },
  {
    id: 'explore_analytics',
    title: 'Explore analytics dashboard',
    description: 'See how to track your product metrics and success',
    completed: false,
    action: {
      label: 'View Analytics',
      href: '/analytics',
    },
  },
]

/**
 * Example Dashboard Component with Onboarding
 */
function DashboardContent() {
  const { state, completeChecklistItem, startTour } = useOnboarding()

  const enhancedChecklistItems = checklistItems.map((item) => ({
    ...item,
    completed: state.checklistItems[item.id] || false,
  }))

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your product lifecycle management platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Your dashboard content goes here */}
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">Your dashboard content</p>
          </div>
        </div>

        {/* Sidebar with Onboarding Checklist */}
        <div className="space-y-6">
          {/* Onboarding Checklist */}
          {!state.hasCompletedTour && (
            <OnboardingChecklist
              items={enhancedChecklistItems}
              onItemComplete={completeChecklistItem}
              onDismiss={() => {
                // Handle dismiss - could save preference to not show again
              }}
            />
          )}

          {/* Restart Tour Button (for demo/testing) */}
          <Button variant="outline" onClick={startTour} className="w-full">
            🎯 Restart Product Tour
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Example App Layout with Onboarding Provider
 */
export function ExampleIntegration({
  children,
  userName,
  userId,
}: {
  children?: React.ReactNode
  userName?: string
  userId?: string
}) {
  return (
    <OnboardingProvider
      tourSteps={tourSteps}
      userName={userName}
      userId={userId}
    >
      {children || <DashboardContent />}
    </OnboardingProvider>
  )
}

/**
 * Usage Instructions:
 *
 * 1. Wrap your main layout/dashboard with OnboardingProvider:
 *
 *    ```tsx
 *    import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
 *
 *    export default function DashboardLayout({ children }) {
 *      return (
 *        <OnboardingProvider tourSteps={tourSteps} userName={user.name} userId={user.id}>
 *          <AppSidebar data-tour="sidebar" />
 *          <main>{children}</main>
 *        </OnboardingProvider>
 *      )
 *    }
 *    ```
 *
 * 2. Add data-tour attributes to elements you want to highlight:
 *
 *    ```tsx
 *    <div data-tour="sidebar">Navigation</div>
 *    <button data-tour="create-button">Create</button>
 *    ```
 *
 * 3. Use the onboarding checklist in your dashboard:
 *
 *    ```tsx
 *    import { useOnboarding } from '@/components/onboarding/onboarding-provider'
 *    import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist'
 *
 *    function Dashboard() {
 *      const { state, completeChecklistItem } = useOnboarding()
 *
 *      return (
 *        <OnboardingChecklist
 *          items={checklistItems}
 *          onItemComplete={completeChecklistItem}
 *        />
 *      )
 *    }
 *    ```
 *
 * 4. Manually trigger the tour:
 *
 *    ```tsx
 *    const { startTour } = useOnboarding()
 *    <Button onClick={startTour}>Start Tour</Button>
 *    ```
 */
