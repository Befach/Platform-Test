'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { NodeType, NODE_TYPE_CONFIGS, MindMapNode } from '@/lib/types/mind-map'
import { Loader2, Trash2, ArrowRight } from 'lucide-react'

interface NodeEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: MindMapNode | null
  onSave: (nodeId: string, updates: Partial<MindMapNode>) => Promise<void>
  onDelete?: (nodeId: string) => void
  onConvert?: (nodeId: string) => void
}

export function NodeEditDialog({
  open,
  onOpenChange,
  node,
  onSave,
  onDelete,
  onConvert,
}: NodeEditDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [nodeType, setNodeType] = useState<NodeType>('idea')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when node changes
  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setDescription(node.description || '')
      setNodeType(node.node_type)
      setShowDeleteConfirm(false)
    }
  }, [node])

  const handleSave = async () => {
    if (!node) return

    setLoading(true)
    try {
      await onSave(node.id, {
        title,
        description: description || undefined,
        node_type: nodeType,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save node:', error)
      alert('Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (!node) return
    onDelete?.(node.id)
    onOpenChange(false)
  }

  const handleConvert = () => {
    if (!node) return
    onConvert?.(node.id)
    onOpenChange(false)
  }

  if (!node) return null

  const currentConfig = NODE_TYPE_CONFIGS[nodeType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentConfig.icon}</span>
            Edit {currentConfig.label} Node
          </DialogTitle>
          <DialogDescription>
            Update the node title, description, and type
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter node title..."
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this node..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Node Type Selector */}
          <div className="space-y-2">
            <Label>Node Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map((type) => {
                const config = NODE_TYPE_CONFIGS[type]
                const isSelected = nodeType === type
                return (
                  <button
                    key={type}
                    onClick={() => setNodeType(type)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-current ring-2 ring-offset-2'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{
                      color: config.color,
                      backgroundColor: isSelected ? config.bgColor : 'white',
                      borderColor: isSelected ? config.borderColor : undefined,
                    }}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <span className="text-xs font-medium">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Converted Badge */}
          {node.converted_to_work_item_id && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <Badge className="bg-green-100 text-green-800 mb-2">
                ✨→📋 Converted to Feature
              </Badge>
              <p className="text-xs text-green-700">
                This node has been converted to a feature. Changes made here will not affect the feature.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1">
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Node
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!node.converted_to_work_item_id && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleConvert}
                disabled={loading}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert to Feature
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !title.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
