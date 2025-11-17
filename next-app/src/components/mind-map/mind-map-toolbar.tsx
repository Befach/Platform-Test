'use client'

import { Button } from '@/components/ui/button'
import { NodeType, NODE_TYPE_CONFIGS } from '@/lib/types/mind-map'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  FileJson,
  Image,
  Sparkles,
} from 'lucide-react'

interface MindMapToolbarProps {
  onAddNode: (nodeType: NodeType) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  onExportPNG?: () => void
  onExportJSON?: () => void
  onOpenTemplates?: () => void
}

export function MindMapToolbar({
  onAddNode,
  onZoomIn,
  onZoomOut,
  onFitView,
  onExportPNG,
  onExportJSON,
  onOpenTemplates,
}: MindMapToolbarProps) {
  const nodeTypes: NodeType[] = ['idea', 'problem', 'solution', 'feature', 'question']

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-slate-200 flex-wrap">
      {/* Add Node Buttons */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-slate-600 mr-2">
          Add Node:
        </span>
        {nodeTypes.map((type) => {
          const config = NODE_TYPE_CONFIGS[type]
          return (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => onAddNode(type)}
              className="gap-2"
              style={{
                borderColor: config.borderColor,
                color: config.color,
              }}
              title={`Add ${config.label} node - ${config.description}`}
            >
              <span className="text-base">{config.icon}</span>
              <span className="hidden sm:inline">{config.label}</span>
            </Button>
          )
        })}
      </div>

      <div className="w-px h-8 bg-slate-200" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-slate-600 mr-2">
          View:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onFitView}
          title="Fit to View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-8 bg-slate-200" />

      {/* Export Options */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-slate-600 mr-2">
          Export:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPNG}
          className="gap-2"
          title="Export as PNG Image"
        >
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">PNG</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportJSON}
          className="gap-2"
          title="Export as JSON"
        >
          <FileJson className="h-4 w-4" />
          <span className="hidden sm:inline">JSON</span>
        </Button>
      </div>

      <div className="w-px h-8 bg-slate-200" />

      {/* Templates */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenTemplates}
        className="gap-2"
        title="Apply a template"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Templates</span>
      </Button>
    </div>
  )
}
