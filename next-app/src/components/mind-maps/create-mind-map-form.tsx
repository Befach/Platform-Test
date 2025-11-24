'use client'

/**
 * Create Mind Map Form Component
 *
 * Allows users to choose between:
 * 1. Work Items Visualization Canvas (auto-generated)
 * 2. Free-Form Mind Map (user-created with shapes)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { CanvasType, CANVAS_TYPE_CONFIGS } from '@/lib/types/mind-map'
import { cn } from '@/lib/utils'

export interface CreateMindMapFormProps {
  workspaceId: string
  teamId: string
  userId: string
}

export function CreateMindMapForm({ workspaceId, teamId, userId }: CreateMindMapFormProps) {
  const router = useRouter()
  const [canvasType, setCanvasType] = useState<CanvasType>('freeform')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch(`/api/mind-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          canvas_type: canvasType,
        }),
      })

      if (!response.ok) throw new Error('Failed to create mind map')

      const mindMap = await response.json()

      // Redirect based on canvas type
      if (canvasType === 'work_items_visualization') {
        router.push(`/workspaces/${workspaceId}/mind-maps/${mindMap.id}?view=visualization`)
      } else {
        router.push(`/workspaces/${workspaceId}/mind-maps/${mindMap.id}?view=freeform`)
      }
    } catch (error) {
      console.error('Error creating mind map:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const canvasTypes: CanvasType[] = ['work_items_visualization', 'freeform']

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Canvas Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Canvas Type</Label>
            <RadioGroup value={canvasType} onValueChange={(value) => setCanvasType(value as CanvasType)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canvasTypes.map((type) => {
                  const config = CANVAS_TYPE_CONFIGS[type]
                  const isSelected = canvasType === type

                  return (
                    <label key={type} htmlFor={type} className="cursor-pointer">
                      <Card
                        className={cn(
                          'transition-all hover:border-blue-300',
                          isSelected && 'border-blue-500 ring-2 ring-blue-100'
                        )}
                      >
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={type} id={type} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{config.icon}</span>
                                <CardTitle className="text-base">{config.label}</CardTitle>
                              </div>
                              <CardDescription className="text-sm">
                                {config.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="text-xs text-muted-foreground">
                            {type === 'work_items_visualization' ? (
                              <ul className="space-y-1 list-disc list-inside">
                                <li>Auto-generated from work items</li>
                                <li>4 view modes (dependency, blocking, hierarchical, architecture)</li>
                                <li>Real-time updates when work items change</li>
                                <li>ELK.js layout algorithms</li>
                              </ul>
                            ) : (
                              <ul className="space-y-1 list-disc list-inside">
                                <li>User-created with 7 shape types</li>
                                <li>Customizable colors and formatting</li>
                                <li>Link to work items for live data</li>
                                <li>Free-form positioning and connections</li>
                              </ul>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  )
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Name Input */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter mind map name..."
              required
              className="mt-1.5"
            />
          </div>

          {/* Description Input */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this mind map for?"
              rows={3}
              className="mt-1.5"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Mind Map'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
