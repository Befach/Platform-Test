/**
 * Product Tasks Types
 *
 * TypeScript types for the two-track task system.
 * Tasks can be standalone OR linked to work items.
 */

// Task status
export type TaskStatus = 'todo' | 'in_progress' | 'done'

// Task types (categories of work)
export type TaskType =
  | 'research'
  | 'design'
  | 'development'
  | 'qa'
  | 'marketing'
  | 'ops'
  | 'admin'

// Task priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

// Base product task (database row)
export interface ProductTask {
  id: string
  workspace_id: string
  team_id: string
  work_item_id: string | null // null = standalone task (parent feature level)
  timeline_item_id: string | null // null = not linked to timeline item (MVP/SHORT/LONG level)
  title: string
  description: string | null
  status: TaskStatus
  task_type: TaskType
  priority: TaskPriority
  assigned_to: string | null // UUID
  due_date: string | null // ISO timestamp
  estimated_hours: number | null
  actual_hours: number | null
  order_index: number
  created_by: string // UUID
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

// Task with related data (from API)
export interface ProductTaskWithRelations extends ProductTask {
  assigned_user?: {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
  } | null
  created_by_user?: {
    id: string
    email: string
    name: string | null
  } | null
  work_item?: {
    id: string
    name: string
    type: string
    status: string
  } | null
  timeline_item?: {
    id: string
    name: string
    timeframe: string // 'mvp' | 'short' | 'long'
    phase: string | null
  } | null
}

// Task creation payload
export interface CreateTaskPayload {
  workspace_id: string
  team_id: string
  work_item_id?: string | null // Link to work item (feature level)
  timeline_item_id?: string | null // Link to timeline item (MVP/SHORT/LONG level)
  title: string
  description?: string | null
  status?: TaskStatus
  task_type?: TaskType
  priority?: TaskPriority
  assigned_to?: string | null
  due_date?: string | null
  estimated_hours?: number | null
  order_index?: number
}

// Task update payload
export interface UpdateTaskPayload {
  title?: string
  description?: string | null
  status?: TaskStatus
  task_type?: TaskType
  priority?: TaskPriority
  assigned_to?: string | null
  due_date?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  order_index?: number
  work_item_id?: string | null // Can link/unlink from work item (feature level)
  timeline_item_id?: string | null // Can link/unlink from timeline item (MVP/SHORT/LONG level)
}

// Task statistics
export interface TaskStats {
  total: number
  by_status: {
    todo: number
    in_progress: number
    done: number
  }
  by_type: {
    research: number
    design: number
    development: number
    qa: number
    marketing: number
    ops: number
    admin: number
  }
  standalone_count: number
  linked_count: number
  overdue_count: number
  completion_percentage: number
}

// Task filter options
export interface TaskFilters {
  workspace_id: string
  team_id: string
  work_item_id?: string // Filter by work item (feature level)
  timeline_item_id?: string // Filter by timeline item (MVP/SHORT/LONG level)
  standalone?: boolean // Only tasks with neither work_item_id nor timeline_item_id
  status?: TaskStatus
  task_type?: TaskType
  assigned_to?: string
}

// Task type metadata for UI
export const TASK_TYPE_CONFIG: Record<TaskType, {
  label: string
  icon: string
  color: string
}> = {
  research: {
    label: 'Research',
    icon: 'Search',
    color: 'bg-purple-100 text-purple-800',
  },
  design: {
    label: 'Design',
    icon: 'Palette',
    color: 'bg-pink-100 text-pink-800',
  },
  development: {
    label: 'Development',
    icon: 'Code',
    color: 'bg-blue-100 text-blue-800',
  },
  qa: {
    label: 'QA',
    icon: 'TestTube',
    color: 'bg-green-100 text-green-800',
  },
  marketing: {
    label: 'Marketing',
    icon: 'Megaphone',
    color: 'bg-orange-100 text-orange-800',
  },
  ops: {
    label: 'Operations',
    icon: 'Settings',
    color: 'bg-gray-100 text-gray-800',
  },
  admin: {
    label: 'Admin',
    icon: 'Shield',
    color: 'bg-slate-100 text-slate-800',
  },
}

// Task status metadata for UI
export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label: string
  icon: string
  color: string
}> = {
  todo: {
    label: 'To Do',
    icon: 'Circle',
    color: 'bg-gray-100 text-gray-800',
  },
  in_progress: {
    label: 'In Progress',
    icon: 'Clock',
    color: 'bg-blue-100 text-blue-800',
  },
  done: {
    label: 'Done',
    icon: 'CheckCircle',
    color: 'bg-green-100 text-green-800',
  },
}

// Task priority metadata for UI
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, {
  label: string
  icon: string
  color: string
}> = {
  low: {
    label: 'Low',
    icon: 'ArrowDown',
    color: 'text-gray-500',
  },
  medium: {
    label: 'Medium',
    icon: 'Minus',
    color: 'text-yellow-500',
  },
  high: {
    label: 'High',
    icon: 'ArrowUp',
    color: 'text-orange-500',
  },
  critical: {
    label: 'Critical',
    icon: 'AlertTriangle',
    color: 'text-red-500',
  },
}
