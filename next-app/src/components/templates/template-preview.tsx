'use client'

/**
 * TemplatePreview Component
 *
 * Shows a detailed preview of a template including:
 * - Full description
 * - Departments that will be created
 * - Work items that will be created
 * - Tags that will be added
 * - Apply options (checkboxes)
 */

import {
  Rocket,
  Cloud,
  CheckCircle,
  Megaphone,
  MessageSquare,
  BarChart3,
  Wrench,
  Activity,
  LayoutTemplate,
  Sparkles,
  Zap,
  Layers,
  Briefcase,
  Users,
  Target,
  Flag,
  Compass,
  Map,
  Folder,
  FileText,
  LucideIcon,
  Building2,
  ListTodo,
  Tags,
  Code2,
  Palette,
  Headphones,
  TrendingUp,
  Server,
  Shield,
  X,
  Bug,
  Lightbulb,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  WorkspaceTemplate,
  TemplateDepartment,
  TemplateWorkItem,
  isSystemTemplate,
} from '@/lib/templates/template-types'
import { WORKSPACE_MODE_CONFIG, WorkspaceMode } from '@/lib/types/workspace-mode'

// ============================================================================
// ICON MAPPING
// ============================================================================

const TEMPLATE_ICON_MAP: Record<string, LucideIcon> = {
  'layout-template': LayoutTemplate,
  rocket: Rocket,
  cloud: Cloud,
  'check-circle': CheckCircle,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  'bar-chart-3': BarChart3,
  wrench: Wrench,
  activity: Activity,
  sparkles: Sparkles,
  zap: Zap,
  layers: Layers,
  briefcase: Briefcase,
  users: Users,
  target: Target,
  flag: Flag,
  compass: Compass,
  map: Map,
  folder: Folder,
  'file-text': FileText,
}

const DEPT_ICON_MAP: Record<string, LucideIcon> = {
  'code-2': Code2,
  briefcase: Briefcase,
  palette: Palette,
  megaphone: Megaphone,
  shield: Shield,
  'file-text': FileText,
  headphones: Headphones,
  'trending-up': TrendingUp,
  server: Server,
}

const WORK_ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  concept: Lightbulb,
  feature: Sparkles,
  bug: Bug,
}

function getTemplateIcon(iconName: string): LucideIcon {
  return TEMPLATE_ICON_MAP[iconName] || LayoutTemplate
}

function getDeptIcon(iconName: string): LucideIcon {
  return DEPT_ICON_MAP[iconName] || Building2
}

function getWorkItemIcon(type: string): LucideIcon {
  return WORK_ITEM_TYPE_ICONS[type] || ListTodo
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DepartmentItem({ dept }: { dept: TemplateDepartment }) {
  const Icon = getDeptIcon(dept.icon)
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div
        className="flex h-8 w-8 items-center justify-center rounded"
        style={{ backgroundColor: `${dept.color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: dept.color }} />
      </div>
      <span className="font-medium">{dept.name}</span>
    </div>
  )
}

function WorkItemItem({ item }: { item: TemplateWorkItem }) {
  const Icon = getWorkItemIcon(item.type)
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {item.type}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.purpose}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TemplatePreviewProps {
  template: WorkspaceTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply?: (template: WorkspaceTemplate) => void
}

export function TemplatePreview({
  template,
  open,
  onOpenChange,
  onApply,
}: TemplatePreviewProps) {
  if (!template) return null

  const Icon = getTemplateIcon(template.icon)
  const modeConfig = WORKSPACE_MODE_CONFIG[template.mode as WorkspaceMode]
  const { departments, workItems, tags } = template.template_data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${modeConfig.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: modeConfig.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex items-center gap-2">
                {template.name}
                {isSystemTemplate(template) && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: modeConfig.color,
                    color: modeConfig.color,
                  }}
                >
                  {modeConfig.name}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-220px)]">
          <div className="space-y-6 pr-4">
            {/* Description */}
            {template.description && (
              <div>
                <h4 className="mb-2 font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            )}

            <Separator />

            {/* Departments */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Departments ({departments.length})</h4>
              </div>
              <div className="grid gap-2">
                {departments.map((dept, i) => (
                  <DepartmentItem key={i} dept={dept} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Work Items */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Work Items ({workItems.length})</h4>
              </div>
              <div className="grid gap-2">
                {workItems.map((item, i) => (
                  <WorkItemItem key={i} item={item} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Tags ({tags.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {onApply && (
          <div className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onApply(template)}>Apply Template</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default TemplatePreview
