/**
 * System Templates Registry
 *
 * Client-side registry for system templates.
 * These mirror the templates inserted in the database migration.
 * Used for:
 * - Instant access without database queries
 * - Template previews in galleries
 * - Fallback when database is unavailable
 */

import { SystemTemplate, TemplateData } from './template-types'

// ============================================================================
// SYSTEM TEMPLATE IDS
// ============================================================================

/**
 * Known system template IDs
 */
export const SYSTEM_TEMPLATE_IDS = {
  // Development mode
  MVP_STARTER: 'system_dev_mvp_starter',
  SAAS_PRODUCT: 'system_dev_saas_product',
  // Launch mode
  LAUNCH_CHECKLIST: 'system_launch_checklist',
  LAUNCH_MARKETING: 'system_launch_marketing',
  // Growth mode
  GROWTH_FEEDBACK: 'system_growth_feedback',
  GROWTH_ANALYTICS: 'system_growth_analytics',
  // Maintenance mode
  TECH_DEBT: 'system_maint_tech_debt',
  STABILITY: 'system_maint_stability',
} as const

export type SystemTemplateId = (typeof SYSTEM_TEMPLATE_IDS)[keyof typeof SYSTEM_TEMPLATE_IDS]

// ============================================================================
// SYSTEM TEMPLATES DATA
// ============================================================================

/**
 * System templates registry
 * Mirrors the database templates for client-side access
 */
export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  // -------------------------------------------------------------------------
  // DEVELOPMENT MODE TEMPLATES
  // -------------------------------------------------------------------------
  {
    id: 'system_dev_mvp_starter',
    team_id: null,
    name: 'MVP Starter',
    description:
      'Quick setup for building a minimum viable product with essential departments and starter work items',
    icon: 'rocket',
    mode: 'development',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
        { name: 'Product', color: '#10b981', icon: 'briefcase' },
      ],
      workItems: [
        { name: 'Define MVP scope', type: 'concept', purpose: 'Identify core features for initial release' },
        { name: 'User authentication', type: 'feature', purpose: 'Enable users to sign up and log in' },
        { name: 'Core feature #1', type: 'feature', purpose: 'Primary value proposition' },
      ],
      tags: ['mvp', 'launch-blocker', 'v1.0'],
    },
  },
  {
    id: 'system_dev_saas_product',
    team_id: null,
    name: 'SaaS Product',
    description: 'Complete setup for a SaaS application with billing, auth, and analytics departments',
    icon: 'cloud',
    mode: 'development',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
        { name: 'Product', color: '#10b981', icon: 'briefcase' },
        { name: 'Design', color: '#8b5cf6', icon: 'palette' },
        { name: 'Marketing', color: '#f59e0b', icon: 'megaphone' },
      ],
      workItems: [
        { name: 'User authentication & SSO', type: 'feature', purpose: 'Secure access with social login options' },
        { name: 'Subscription billing', type: 'feature', purpose: 'Recurring payment processing' },
        { name: 'Team management', type: 'feature', purpose: 'Multi-user collaboration' },
        { name: 'Analytics dashboard', type: 'feature', purpose: 'Usage insights for customers' },
        { name: 'Onboarding flow', type: 'feature', purpose: 'Guide new users to value' },
      ],
      tags: ['saas', 'subscription', 'multi-tenant', 'analytics'],
    },
  },

  // -------------------------------------------------------------------------
  // LAUNCH MODE TEMPLATES
  // -------------------------------------------------------------------------
  {
    id: 'system_launch_checklist',
    team_id: null,
    name: 'Pre-Launch Checklist',
    description: 'Essential items to verify before going live',
    icon: 'check-circle',
    mode: 'launch',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
        { name: 'QA', color: '#ef4444', icon: 'shield' },
      ],
      workItems: [
        { name: 'Security audit', type: 'feature', purpose: 'Verify no critical vulnerabilities' },
        { name: 'Performance testing', type: 'feature', purpose: 'Ensure app handles expected load' },
        { name: 'Error monitoring setup', type: 'feature', purpose: 'Track issues in production' },
        { name: 'Backup & recovery test', type: 'feature', purpose: 'Verify data can be restored' },
        { name: 'Documentation review', type: 'feature', purpose: 'Ensure docs are up to date' },
      ],
      tags: ['pre-launch', 'checklist', 'qa'],
    },
  },
  {
    id: 'system_launch_marketing',
    team_id: null,
    name: 'Product Launch Campaign',
    description: 'Marketing-focused launch preparation',
    icon: 'megaphone',
    mode: 'launch',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Marketing', color: '#f59e0b', icon: 'megaphone' },
        { name: 'Content', color: '#ec4899', icon: 'file-text' },
        { name: 'Product', color: '#10b981', icon: 'briefcase' },
      ],
      workItems: [
        { name: 'Landing page launch', type: 'feature', purpose: 'Convert visitors to signups' },
        { name: 'Email announcement', type: 'feature', purpose: 'Notify waitlist and subscribers' },
        { name: 'Social media campaign', type: 'feature', purpose: 'Build buzz on launch day' },
        { name: 'Press kit preparation', type: 'feature', purpose: 'Materials for media coverage' },
        { name: 'Launch day support plan', type: 'feature', purpose: 'Handle surge in support requests' },
      ],
      tags: ['launch', 'marketing', 'campaign'],
    },
  },

  // -------------------------------------------------------------------------
  // GROWTH MODE TEMPLATES
  // -------------------------------------------------------------------------
  {
    id: 'system_growth_feedback',
    team_id: null,
    name: 'User Feedback Loop',
    description: 'Systematic approach to collecting and acting on user feedback',
    icon: 'message-square',
    mode: 'growth',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Product', color: '#10b981', icon: 'briefcase' },
        { name: 'Customer Success', color: '#3b82f6', icon: 'headphones' },
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
      ],
      workItems: [
        { name: 'Feedback collection system', type: 'feature', purpose: 'Gather user input systematically' },
        { name: 'NPS survey implementation', type: 'feature', is_enhancement: true, purpose: 'Track customer satisfaction' },
        { name: 'Feature request tracker', type: 'feature', purpose: 'Prioritize user-requested features' },
        { name: 'User interview process', type: 'feature', is_enhancement: true, purpose: 'Deep dive into user needs' },
      ],
      tags: ['feedback', 'nps', 'user-research'],
    },
  },
  {
    id: 'system_growth_analytics',
    team_id: null,
    name: 'Growth Analytics Setup',
    description: 'Track and optimize key growth metrics',
    icon: 'bar-chart-3',
    mode: 'growth',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Growth', color: '#10b981', icon: 'trending-up' },
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
        { name: 'Marketing', color: '#f59e0b', icon: 'megaphone' },
      ],
      workItems: [
        { name: 'Analytics dashboard', type: 'feature', purpose: 'Visualize key metrics' },
        { name: 'Funnel tracking', type: 'feature', is_enhancement: true, purpose: 'Identify conversion bottlenecks' },
        { name: 'A/B testing framework', type: 'feature', purpose: 'Data-driven feature decisions' },
        { name: 'Cohort analysis', type: 'feature', is_enhancement: true, purpose: 'Understand retention by cohort' },
        { name: 'Referral program', type: 'feature', purpose: 'Leverage word-of-mouth growth' },
      ],
      tags: ['analytics', 'growth', 'metrics', 'ab-testing'],
    },
  },

  // -------------------------------------------------------------------------
  // MAINTENANCE MODE TEMPLATES
  // -------------------------------------------------------------------------
  {
    id: 'system_maint_tech_debt',
    team_id: null,
    name: 'Tech Debt Sprint',
    description: 'Focused effort to reduce technical debt',
    icon: 'wrench',
    mode: 'maintenance',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [{ name: 'Engineering', color: '#6366f1', icon: 'code-2' }],
      workItems: [
        { name: 'Dependency updates', type: 'feature', is_enhancement: true, purpose: 'Update outdated packages' },
        { name: 'Code refactoring', type: 'feature', is_enhancement: true, purpose: 'Improve code quality and maintainability' },
        { name: 'Test coverage improvement', type: 'feature', is_enhancement: true, purpose: 'Add missing tests' },
        { name: 'Documentation update', type: 'feature', is_enhancement: true, purpose: 'Keep docs current with codebase' },
        { name: 'Performance optimization', type: 'feature', is_enhancement: true, purpose: 'Improve app speed and efficiency' },
      ],
      tags: ['tech-debt', 'refactoring', 'maintenance'],
    },
  },
  {
    id: 'system_maint_stability',
    team_id: null,
    name: 'Stability Focus',
    description: 'Improve system reliability and monitoring',
    icon: 'activity',
    mode: 'maintenance',
    is_system: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_data: {
      departments: [
        { name: 'Engineering', color: '#6366f1', icon: 'code-2' },
        { name: 'DevOps', color: '#64748b', icon: 'server' },
      ],
      workItems: [
        { name: 'Error monitoring review', type: 'feature', is_enhancement: true, purpose: 'Address recurring errors' },
        { name: 'Alerting improvements', type: 'feature', is_enhancement: true, purpose: 'Better incident detection' },
        { name: 'Backup verification', type: 'feature', is_enhancement: true, purpose: 'Ensure data safety' },
        { name: 'Load testing', type: 'feature', is_enhancement: true, purpose: 'Verify system handles peak load' },
        { name: 'Security patches', type: 'bug', purpose: 'Apply latest security updates' },
      ],
      tags: ['stability', 'monitoring', 'devops', 'security'],
    },
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a system template by ID
 */
export function getSystemTemplateById(id: string): SystemTemplate | undefined {
  return SYSTEM_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get system templates by mode
 */
export function getSystemTemplatesByMode(mode: string): SystemTemplate[] {
  return SYSTEM_TEMPLATES.filter((t) => t.mode === mode)
}

/**
 * Get all system templates grouped by mode
 */
export function getSystemTemplatesGroupedByMode(): Record<string, SystemTemplate[]> {
  return SYSTEM_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.mode]) {
        acc[template.mode] = []
      }
      acc[template.mode].push(template)
      return acc
    },
    {} as Record<string, SystemTemplate[]>
  )
}

/**
 * Get template preview summary
 */
export function getTemplatePreviewSummary(template: SystemTemplate): {
  departmentCount: number
  workItemCount: number
  tagCount: number
  departmentNames: string[]
  workItemTypes: string[]
} {
  const { departments, workItems, tags } = template.template_data
  return {
    departmentCount: departments.length,
    workItemCount: workItems.length,
    tagCount: tags.length,
    departmentNames: departments.map((d) => d.name),
    workItemTypes: [...new Set(workItems.map((w) => w.type))],
  }
}
