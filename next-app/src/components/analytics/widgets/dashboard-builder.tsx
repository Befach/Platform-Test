'use client'

/**
 * Dashboard Builder (Pro Feature)
 * Drag-and-drop custom dashboard with react-grid-layout
 * Architecture supports future upgrade to Option C (Free-Form Builder)
 */

import { useState, useCallback, useMemo } from 'react'
import GridLayout, { Layout } from 'react-grid-layout/legacy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Save,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  GripVertical,
  Sparkles,
  Lock,
} from 'lucide-react'
import { WidgetPicker } from './widget-picker'
import { WIDGET_REGISTRY, type WidgetId } from './widget-registry'
import type { WidgetInstance } from '@/lib/types/analytics'
import { cn } from '@/lib/utils'

// Import react-grid-layout styles
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface DashboardBuilderProps {
  workspaceId: string
  teamId: string
  initialWidgets?: WidgetInstance[]
  dashboardId?: string
  dashboardName?: string
  onSave?: (widgets: WidgetInstance[], name: string) => Promise<void>
  isPro?: boolean
  className?: string
}

// Grid configuration
const GRID_COLS = 6
const GRID_ROW_HEIGHT = 120
const GRID_MARGIN: [number, number] = [16, 16]

export function DashboardBuilder({
  workspaceId: _workspaceId,
  teamId: _teamId,
  initialWidgets = [],
  dashboardId: _dashboardId,
  dashboardName = 'Custom Dashboard',
  onSave,
  isPro = false,
  className,
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets)
  const [name, setName] = useState(dashboardName)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(dashboardName)

  // Convert widgets to grid layout format
  // In v2, Layout = readonly LayoutItem[], useMemo returns Layout (readonly) for GridLayout
  const layout: Layout = useMemo(() => {
    return widgets.map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: WIDGET_REGISTRY[widget.widgetId as WidgetId]?.minSize.w || 1,
      minH: WIDGET_REGISTRY[widget.widgetId as WidgetId]?.minSize.h || 1,
      maxW: WIDGET_REGISTRY[widget.widgetId as WidgetId]?.maxSize?.w,
      maxH: WIDGET_REGISTRY[widget.widgetId as WidgetId]?.maxSize?.h,
    }))
  }, [widgets])

  // Get list of added widget IDs
  const addedWidgetIds = useMemo(() => {
    return widgets.map((w) => w.widgetId as WidgetId)
  }, [widgets])

  // Handle layout changes from drag/resize
  // In v2, Layout = readonly LayoutItem[], callback receives Layout (the array)
  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        const layoutItem = newLayout.find((l) => l.i === widget.id)
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          }
        }
        return widget
      })
    )
  }, [])

  // Add a widget to the dashboard
  const handleAddWidget = useCallback((widgetId: WidgetId) => {
    const widgetDef = WIDGET_REGISTRY[widgetId]
    if (!widgetDef) return

    // Find the next available position
    const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 0)

    const newWidget: WidgetInstance = {
      id: Date.now().toString(),
      widgetId,
      position: {
        x: 0,
        y: maxY,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h,
      },
      config: {},
    }

    setWidgets((prev) => [...prev, newWidget])
  }, [widgets])

  // Remove a widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
  }, [])

  // Duplicate a widget
  const handleDuplicateWidget = useCallback((widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId)
    if (!widget) return

    const newWidget: WidgetInstance = {
      ...widget,
      id: Date.now().toString(),
      position: {
        ...widget.position,
        y: widget.position.y + widget.position.h,
      },
    }

    setWidgets((prev) => [...prev, newWidget])
  }, [widgets])

  // Save dashboard
  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(widgets, name)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle name edit
  const handleSaveName = () => {
    setName(editNameValue)
    setIsEditingName(false)
  }

  // Render empty state
  if (!isPro) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Custom dashboard builder is available on Pro plans. Upgrade to create
            personalized dashboards with drag-and-drop widgets.
          </p>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="h-8 w-[200px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
              />
              <Button size="sm" variant="ghost" onClick={handleSaveName}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{name}</h2>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setEditNameValue(name)
                  setIsEditingName(true)
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Badge variant="outline" className="ml-2">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <WidgetPicker onAddWidget={handleAddWidget} addedWidgetIds={addedWidgetIds} />
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Dashboard'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GripVertical className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No widgets added</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Start building your custom dashboard by adding widgets from the picker.
            </p>
            <WidgetPicker onAddWidget={handleAddWidget} addedWidgetIds={addedWidgetIds} />
          </CardContent>
        </Card>
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 min-h-[600px]">
          <GridLayout
            className="layout"
            layout={layout}
            cols={GRID_COLS}
            rowHeight={GRID_ROW_HEIGHT}
            width={1200}
            margin={GRID_MARGIN}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            isResizable
            isDraggable
          >
            {widgets.map((widget) => {
              const widgetDef = WIDGET_REGISTRY[widget.widgetId as WidgetId]
              return (
                <div key={widget.id}>
                  <WidgetCard
                    widget={widget}
                    widgetDef={widgetDef}
                    onRemove={() => handleRemoveWidget(widget.id)}
                    onDuplicate={() => handleDuplicateWidget(widget.id)}
                  />
                </div>
              )
            })}
          </GridLayout>
        </div>
      )}
    </div>
  )
}

// Widget Card Component
interface WidgetCardProps {
  widget: WidgetInstance
  widgetDef?: Omit<import('@/lib/types/analytics').WidgetDefinition, 'component'>
  onRemove: () => void
  onDuplicate: () => void
}

function WidgetCard({ widget: _widget, widgetDef, onRemove, onDuplicate }: WidgetCardProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">
            {widgetDef?.name || 'Unknown Widget'}
          </CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Widget content placeholder - actual content rendered based on widgetId */}
        <div className="h-full flex items-center justify-center bg-muted/50 rounded text-muted-foreground text-sm">
          {widgetDef?.description || 'Widget content will appear here'}
        </div>
      </CardContent>
    </Card>
  )
}
