/**
 * Test Data Generator for Features Table
 *
 * Generates realistic test data for development and testing.
 * AI assistants can use these functions to create mock data quickly.
 *
 * ⚠️ SECURITY WARNING: This module is for development/testing only.
 * Production guards are in place to prevent accidental use.
 *
 * @module features/test-data
 */

import type {
  WorkItem,
  TimelineItem,
  LinkedItem,
  AnyWorkItemPhase,
  WorkItemPriority,
  TimelinePhase,
  DifficultyLevel,
} from '@/lib/types/work-items'
import { generateTextId } from './utils'

/**
 * Security guard to prevent test data generation in production
 * @throws {Error} If called in production environment
 */
function assertDevelopmentEnvironment(functionName: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[SECURITY] ${functionName} cannot be used in production. ` +
      'Test data generators are for development/testing only.'
    )
  }
}

/**
 * Sample work item names by type
 */
const SAMPLE_NAMES = {
  epic: [
    'User Authentication System',
    'Payment Processing Infrastructure',
    'Content Management Platform',
    'Real-time Collaboration Features',
    'Analytics Dashboard',
  ],
  feature: [
    'Social Login Integration',
    'Email Verification',
    'Two-Factor Authentication',
    'Password Reset Flow',
    'User Profile Management',
    'Stripe Checkout',
    'Subscription Management',
    'Invoice Generation',
  ],
  story: [
    'As a user, I want to login with Google',
    'As an admin, I want to view user activity',
    'As a user, I want to export my data',
    'As a developer, I want to see API logs',
  ],
  task: [
    'Set up Auth0 configuration',
    'Create login form component',
    'Add password validation',
    'Write API endpoint tests',
    'Update database schema',
  ],
  bug: [
    'Login button not working on mobile',
    'Session timeout not clearing user data',
    'Password field accepting invalid characters',
    'Email validation too strict',
  ],
}

/**
 * Sample purposes/descriptions
 */
const SAMPLE_PURPOSES = [
  'Allow users to authenticate securely and access their accounts',
  'Enable seamless payment processing for subscriptions and one-time purchases',
  'Provide administrators with tools to manage content and users',
  'Implement real-time collaboration features for team productivity',
  'Track and visualize user behavior and system performance',
  'Integrate with third-party authentication providers',
  'Ensure data security and compliance with industry standards',
  'Improve user experience and reduce friction in key workflows',
]

/**
 * Sample tags
 */
const SAMPLE_TAGS = [
  'backend',
  'frontend',
  'database',
  'auth',
  'payments',
  'analytics',
  'ui/ux',
  'api',
  'security',
  'performance',
  'testing',
  'documentation',
]

/**
 * Sample integration systems
 */
const SAMPLE_INTEGRATIONS = [
  'Auth0',
  'Stripe',
  'Twilio',
  'SendGrid',
  'AWS S3',
  'Cloudflare',
  'Google Analytics',
  'Sentry',
  'Slack',
  'GitHub',
]

/**
 * Generate a random work item
 *
 * @param overrides - Fields to override in the generated item
 * @returns Generated work item
 *
 * @example
 * const item = generateTestWorkItem({ status: 'completed', priority: 'high' })
 */
export function generateTestWorkItem(
  overrides: Partial<WorkItem> = {}
): WorkItem {
  assertDevelopmentEnvironment('generateTestWorkItem')

  const types = ['concept', 'feature', 'enhancement', 'bug'] as const
  // Type-aware phases: features/enhancements use design→launch, concepts use ideation→validated, bugs use triage→verified
  const featurePhases: AnyWorkItemPhase[] = ['design', 'build', 'refine', 'launch']
  const conceptPhases: AnyWorkItemPhase[] = ['ideation', 'research', 'validated', 'rejected']
  const bugPhases: AnyWorkItemPhase[] = ['triage', 'investigating', 'fixing', 'verified']
  const priorities: WorkItemPriority[] = ['low', 'medium', 'high', 'critical']

  const type = overrides.type || types[Math.floor(Math.random() * types.length)]

  // Select appropriate phase based on type
  let phaseOptions: AnyWorkItemPhase[]
  if (type === 'concept') {
    phaseOptions = conceptPhases
  } else if (type === 'bug') {
    phaseOptions = bugPhases
  } else {
    phaseOptions = featurePhases // feature, enhancement
  }

  const phase =
    overrides.phase || phaseOptions[Math.floor(Math.random() * phaseOptions.length)]
  const priority =
    overrides.priority || priorities[Math.floor(Math.random() * priorities.length)]

  const names = SAMPLE_NAMES[type as keyof typeof SAMPLE_NAMES] || SAMPLE_NAMES.feature
  const name =
    overrides.name || names[Math.floor(Math.random() * names.length)]
  const purpose =
    overrides.purpose ||
    SAMPLE_PURPOSES[Math.floor(Math.random() * SAMPLE_PURPOSES.length)]

  const numTags = Math.floor(Math.random() * 4)
  const tags = overrides.tags || (
    numTags > 0
      ? Array.from(
          { length: numTags },
          () => SAMPLE_TAGS[Math.floor(Math.random() * SAMPLE_TAGS.length)]
        )
      : []
  )

  return {
    id: overrides.id || generateTextId(),
    team_id: overrides.team_id || 'team_test',
    workspace_id: overrides.workspace_id || 'workspace_test',
    name,
    type,
    purpose,
    phase, // Phase IS the status for work items
    priority,
    tags,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    created_by: overrides.created_by || 'user_test',
    user_id: null,
    department_id: null,
    is_enhancement: false,
    enhances_work_item_id: null,
    version: null,
    version_notes: null,
    review_enabled: false,
    review_status: null,
  } as WorkItem
}

/**
 * Generate multiple random work items
 *
 * @param count - Number of items to generate
 * @param overrides - Fields to override in all generated items
 * @returns Array of generated work items
 *
 * @example
 * const items = generateTestWorkItems(10, { team_id: 'team_123' })
 */
export function generateTestWorkItems(
  count: number,
  overrides: Partial<WorkItem> = {}
): WorkItem[] {
  assertDevelopmentEnvironment('generateTestWorkItems')

  return Array.from({ length: count }, () => generateTestWorkItem(overrides))
}

/**
 * Generate a random timeline item
 *
 * @param workItemId - Work item ID this timeline belongs to
 * @param overrides - Fields to override in the generated item
 * @returns Generated timeline item
 *
 * @example
 * const timeline = generateTestTimelineItem('work_123', { timeline: 'MVP' })
 */
export function generateTestTimelineItem(
  workItemId: string,
  overrides: Partial<TimelineItem> = {}
): TimelineItem {
  assertDevelopmentEnvironment('generateTestTimelineItem')

  const phases: TimelinePhase[] = ['MVP', 'SHORT', 'LONG']
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard']

  const timeline =
    overrides.timeline || phases[Math.floor(Math.random() * phases.length)]
  const difficulty =
    overrides.difficulty ||
    difficulties[Math.floor(Math.random() * difficulties.length)]

  const descriptions = [
    'Implement basic functionality with core features',
    'Add enhanced features and integrations',
    'Optimize performance and add advanced capabilities',
    'Include comprehensive error handling and edge cases',
  ]

  return {
    id: overrides.id || generateTextId(),
    team_id: overrides.team_id || 'team_test',
    workspace_id: overrides.workspace_id || 'workspace_test',
    work_item_id: workItemId,
    timeline,
    description:
      overrides.description ||
      descriptions[Math.floor(Math.random() * descriptions.length)],
    difficulty,
    status: 'not_started', // Timeline items have separate status field for task execution
    actual_end_date: null,
    actual_hours: null,
    actual_start_date: null,
    assigned_to: null,
    blockers: null,
    category: null,
    created_at: overrides.created_at || new Date().toISOString(),
    estimated_hours: null,
    integration_type: null,
    is_blocked: false,
    phase: null,
    phase_transitions: null,
    planned_end_date: null,
    planned_start_date: null,
    progress_percent: null,
    updated_at: new Date().toISOString(),
    user_id: null,
  } as TimelineItem
}

/**
 * Generate timeline items for a work item
 *
 * @param workItemId - Work item ID to generate timelines for
 * @param phases - Which phases to generate ('MVP', 'SHORT', 'LONG')
 * @returns Array of generated timeline items
 *
 * @example
 * const timelines = generateTestTimelines('work_123', ['MVP', 'SHORT'])
 */
export function generateTestTimelines(
  workItemId: string,
  phases: TimelinePhase[] = ['MVP']
): TimelineItem[] {
  assertDevelopmentEnvironment('generateTestTimelines')

  return phases.map((phase) =>
    generateTestTimelineItem(workItemId, {
      timeline: phase,
    })
  )
}

/**
 * Generate a random linked item
 *
 * @param sourceTimelineId - Source timeline item ID
 * @param targetTimelineId - Target timeline item ID
 * @param overrides - Fields to override in the generated item
 * @returns Generated linked item
 *
 * @example
 * const link = generateTestLinkedItem('timeline_1', 'timeline_2', {
 *   relationship_type: 'blocks'
 * })
 */
export function generateTestLinkedItem(
  sourceTimelineId: string,
  targetTimelineId: string,
  overrides: Partial<LinkedItem> = {}
): LinkedItem {
  assertDevelopmentEnvironment('generateTestLinkedItem')

  const relationshipTypes = ['blocks', 'depends_on', 'relates_to'] as const

  return {
    id: overrides.id || generateTextId(),
    team_id: overrides.team_id || 'team_test',
    source_item_id: sourceTimelineId,
    target_item_id: targetTimelineId,
    relationship_type:
      overrides.relationship_type ||
      relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
    created_at: overrides.created_at || new Date().toISOString(),
  }
}

/**
 * Generate a complete dataset with work items, timelines, and links
 *
 * @param workItemCount - Number of work items to generate
 * @param options - Generation options
 * @returns Complete dataset
 *
 * @example
 * const dataset = generateTestDataset(20, {
 *   timelinesPerItem: ['MVP', 'SHORT'],
 *   linkProbability: 0.3
 * })
 *
 * // Use in component:
 * <FeaturesViewWrapper
 *   initialWorkItems={dataset.workItems}
 *   timelineItems={dataset.timelineItems}
 *   ...
 * />
 */
export function generateTestDataset(
  workItemCount: number,
  options: {
    teamId?: string
    workspaceId?: string
    timelinesPerItem?: TimelinePhase[]
    linkProbability?: number
  } = {}
): {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  linkedItems: LinkedItem[]
} {
  assertDevelopmentEnvironment('generateTestDataset')

  const {
    teamId = 'team_test',
    workspaceId = 'workspace_test',
    timelinesPerItem = ['MVP'],
    linkProbability = 0.2,
  } = options

  // Generate work items
  const workItems = generateTestWorkItems(workItemCount, {
    team_id: teamId,
    workspace_id: workspaceId,
  })

  // Generate timeline items
  const timelineItems: TimelineItem[] = []
  workItems.forEach((workItem) => {
    const timelines = generateTestTimelines(workItem.id, timelinesPerItem)
    timelineItems.push(...timelines)
  })

  // Generate linked items
  const linkedItems: LinkedItem[] = []
  for (let i = 0; i < timelineItems.length - 1; i++) {
    if (Math.random() < linkProbability) {
      const source = timelineItems[i]
      const target = timelineItems[Math.floor(Math.random() * timelineItems.length)]
      if (source.id !== target.id) {
        linkedItems.push(
          generateTestLinkedItem(source.id, target.id, { team_id: teamId })
        )
      }
    }
  }

  return { workItems, timelineItems, linkedItems }
}

/**
 * Generate realistic test data for a specific scenario
 *
 * @param scenario - Scenario name
 * @returns Dataset for the scenario
 *
 * @example
 * const dataset = generateTestScenario('ecommerce')
 * // Returns realistic e-commerce related work items
 */
export function generateTestScenario(scenario: 'auth' | 'ecommerce' | 'social' | 'analytics'): {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  linkedItems: LinkedItem[]
} {
  assertDevelopmentEnvironment('generateTestScenario')

  const scenarios = {
    auth: {
      items: [
        { name: 'User Authentication System', type: 'feature', phase: 'build' as const },
        { name: 'Social Login Integration', type: 'feature', phase: 'launch' as const },
        { name: 'Email Verification', type: 'feature', phase: 'build' as const },
        { name: 'Two-Factor Authentication', type: 'feature', phase: 'design' as const },
        { name: 'Password Reset Flow', type: 'feature', phase: 'refine' as const },
      ],
      tags: ['auth', 'security', 'backend', 'api'],
    },
    ecommerce: {
      items: [
        { name: 'Payment Processing', type: 'feature', phase: 'build' as const },
        { name: 'Stripe Integration', type: 'feature', phase: 'launch' as const },
        { name: 'Shopping Cart', type: 'feature', phase: 'refine' as const },
        { name: 'Order Management', type: 'feature', phase: 'design' as const },
        { name: 'Invoice Generation', type: 'feature', phase: 'design' as const },
      ],
      tags: ['payments', 'ecommerce', 'stripe', 'backend'],
    },
    social: {
      items: [
        { name: 'Social Features', type: 'feature', phase: 'build' as const },
        { name: 'User Profiles', type: 'feature', phase: 'launch' as const },
        { name: 'Follow System', type: 'feature', phase: 'build' as const },
        { name: 'Activity Feed', type: 'feature', phase: 'design' as const },
        { name: 'Notifications', type: 'feature', phase: 'refine' as const },
      ],
      tags: ['social', 'frontend', 'realtime', 'ui/ux'],
    },
    analytics: {
      items: [
        { name: 'Analytics Dashboard', type: 'feature', phase: 'build' as const },
        { name: 'Event Tracking', type: 'feature', phase: 'launch' as const },
        { name: 'User Insights', type: 'feature', phase: 'refine' as const },
        { name: 'Custom Reports', type: 'feature', phase: 'design' as const },
        { name: 'Data Export', type: 'feature', phase: 'design' as const },
      ],
      tags: ['analytics', 'dashboard', 'charts', 'data'],
    },
  }

  const config = scenarios[scenario]
  const workItems = config.items.map((item) =>
    generateTestWorkItem({
      ...item,
      tags: config.tags.slice(0, Math.floor(Math.random() * 3) + 1),
    })
  )

  const timelineItems: TimelineItem[] = []
  workItems.forEach((workItem) => {
    timelineItems.push(...generateTestTimelines(workItem.id, ['MVP', 'SHORT']))
  })

  const linkedItems: LinkedItem[] = []
  for (let i = 0; i < timelineItems.length - 1; i++) {
    if (Math.random() < 0.3) {
      linkedItems.push(
        generateTestLinkedItem(timelineItems[i].id, timelineItems[i + 1].id)
      )
    }
  }

  return { workItems, timelineItems, linkedItems }
}
