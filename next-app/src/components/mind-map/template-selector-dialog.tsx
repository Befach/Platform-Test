'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MIND_MAP_TEMPLATES, MindMapTemplate } from '@/lib/templates/mind-map-templates'
import { Sparkles, Check } from 'lucide-react'

interface TemplateSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: MindMapTemplate) => void
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateSelectorDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MindMapTemplate | null>(null)

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onOpenChange(false)
      setSelectedTemplate(null)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'feature':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'research':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Choose a Mind Map Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built template to organize your ideas faster
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {MIND_MAP_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate?.id === template.id
            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-500'
                    : 'hover:border-blue-300'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{template.icon}</span>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`w-fit ${getCategoryColor(template.category)}`}
                  >
                    {template.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3">
                    {template.description}
                  </CardDescription>
                  <div className="text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>📍 {template.nodes.length} nodes</span>
                      <span>•</span>
                      <span>🔗 {template.edges.length} connections</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {selectedTemplate && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">
              Template Preview: {selectedTemplate.name}
            </h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-blue-800 mb-1">Nodes:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.nodes.slice(0, 6).map((node) => (
                    <Badge key={node.id} variant="secondary" className="text-xs">
                      {node.title}
                    </Badge>
                  ))}
                  {selectedTemplate.nodes.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedTemplate.nodes.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
