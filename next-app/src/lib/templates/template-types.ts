/**
 * Workspace Template Types
 *
 * Types for the workspace template system that supports:
 * - System templates (pre-defined, read-only)
 * - Team templates (user-created, team-scoped)
 */

import { WorkspaceMode } from '@/lib/types/workspace-mode'

// ============================================================================
// TEMPLATE DATA TYPES
// ============================================================================

/**
 * Department definition within a template
 */
export interface TemplateDepartment {
  name: string
  color: string
  icon: string
}

/**
 * Work item definition within a template
 */
export interface TemplateWorkItem {
  name: string
  type: 'concept' | 'feature' | 'bug'
  purpose: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  department?: string // Department name reference
  is_enhancement?: boolean
}

/**
 * Template data structure stored in JSONB
 */
export interface TemplateData {
  departments: TemplateDepartment[]
  workItems: TemplateWorkItem[]
  tags: string[]
}

// ============================================================================
// TEMPLATE ENTITY TYPES
// ============================================================================

/**
 * Base template interface (common fields)
 */
export interface BaseTemplate {
  id: string
  name: string
  description: string | null
  icon: string
  mode: WorkspaceMode
  template_data: TemplateData
}

/**
 * System template (pre-defined, no team_id)
 */
export interface SystemTemplate extends BaseTemplate {
  team_id: null
  is_system: true
  created_by: null
  created_at: string
  updated_at: string
}

/**
 * Team template (user-created, has team_id)
 */
export interface TeamTemplate extends BaseTemplate {
  team_id: string
  is_system: false
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Union type for any template
 */
export type WorkspaceTemplate = SystemTemplate | TeamTemplate

// ============================================================================
// TEMPLATE GALLERY TYPES
// ============================================================================

/**
 * Template category for gallery display
 */
export interface TemplateCategory {
  mode: WorkspaceMode
  label: string
  description: string
  templates: WorkspaceTemplate[]
}

/**
 * Template preview props
 */
export interface TemplatePreviewProps {
  template: WorkspaceTemplate
  onSelect?: () => void
  onClose?: () => void
}

// ============================================================================
// TEMPLATE APPLICATION TYPES
// ============================================================================

/**
 * Options for applying a template to a workspace
 */
export interface ApplyTemplateOptions {
  /** Template ID to apply */
  templateId: string
  /** Target workspace ID */
  workspaceId: string
  /** Whether to create departments from template */
  createDepartments: boolean
  /** Whether to create work items from template */
  createWorkItems: boolean
  /** Whether to add tags to workspace */
  addTags: boolean
}

/**
 * Result of applying a template
 */
export interface ApplyTemplateResult {
  success: boolean
  departmentsCreated: number
  workItemsCreated: number
  tagsAdded: number
  errors?: string[]
}

// ============================================================================
// CREATE TEMPLATE TYPES
// ============================================================================

/**
 * Input for creating a new team template
 */
export interface CreateTemplateInput {
  name: string
  description?: string
  icon?: string
  mode: WorkspaceMode
  template_data: TemplateData
}

/**
 * Input for updating an existing template
 */
export interface UpdateTemplateInput {
  name?: string
  description?: string
  icon?: string
  template_data?: Partial<TemplateData>
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a template is a system template
 */
export function isSystemTemplate(template: WorkspaceTemplate): template is SystemTemplate {
  return template.is_system === true
}

/**
 * Check if a template is a team template
 */
export function isTeamTemplate(template: WorkspaceTemplate): template is TeamTemplate {
  return template.is_system === false
}

// ============================================================================
// TEMPLATE ICONS
// ============================================================================

/**
 * Available icons for templates
 */
export const TEMPLATE_ICONS = [
  'layout-template',
  'rocket',
  'cloud',
  'check-circle',
  'megaphone',
  'message-square',
  'bar-chart-3',
  'wrench',
  'activity',
  'sparkles',
  'zap',
  'layers',
  'briefcase',
  'users',
  'target',
  'flag',
  'compass',
  'map',
  'folder',
  'file-text',
] as const

export type TemplateIcon = (typeof TEMPLATE_ICONS)[number]
