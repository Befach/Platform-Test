'use client'

import { useState, FormEvent, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'

const PHASES = [
  { value: 'research', label: 'Research', description: 'Discovery and validation' },
  { value: 'planning', label: 'Planning', description: 'Detailed planning' },
  { value: 'review', label: 'Review', description: 'Stakeholder review' },
  { value: 'execution', label: 'Execution', description: 'Building features' },
  { value: 'testing', label: 'Testing', description: 'Quality assurance' },
  { value: 'metrics', label: 'Metrics', description: 'Success measurement' },
  { value: 'complete', label: 'Complete', description: 'Project complete' },
]

const MODULES = [
  { id: 'research', name: 'AI Research', description: 'AI-powered research assistant' },
  { id: 'mind_map', name: 'Mind Map', description: 'Visual brainstorming canvas' },
  { id: 'features', name: 'Features', description: 'Feature management' },
  { id: 'dependencies', name: 'Dependencies', description: 'Dependency graph' },
  { id: 'review', name: 'Review', description: 'External feedback system (Pro)' },
  { id: 'execution', name: 'Execution', description: 'Project execution tracking' },
  { id: 'collaboration', name: 'Collaboration', description: 'Real-time collab (Pro)' },
  { id: 'timeline', name: 'Timeline', description: 'Gantt timeline view' },
  { id: 'analytics', name: 'Analytics', description: 'Metrics dashboard' },
  { id: 'ai', name: 'AI Assistant', description: 'AI chat assistant' },
]

interface EditWorkspaceDialogProps {
  workspace: {
    id: string
    name: string
    description: string | null
    phase: string
    enabled_modules: string[] | null
    team_id: string
  }
  trigger?: React.ReactNode
}

export function EditWorkspaceDialog({ workspace, trigger }: EditWorkspaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description || '')
  const [phase, setPhase] = useState(workspace.phase)
  const [enabledModules, setEnabledModules] = useState<string[]>(
    workspace.enabled_modules || []
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(workspace.name)
      setDescription(workspace.description || '')
      setPhase(workspace.phase)
      setEnabledModules(workspace.enabled_modules || [])
      setShowDeleteConfirm(false)
    }
  }, [open, workspace])

  const toggleModule = (moduleId: string) => {
    setEnabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name,
          description: description || null,
          phase,
          enabled_modules: enabledModules,
        })
        .eq('id', workspace.id)

      if (error) throw error

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating workspace:', error)
      alert(error.message || 'Failed to update workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id)

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting workspace:', error)
      alert(error.message || 'Failed to delete workspace')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Settings</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Update your workspace configuration and enabled modules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Current Phase</Label>
            <Select value={phase} onValueChange={setPhase} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a phase" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Enabled Modules</Label>
            <div className="space-y-3 border rounded-lg p-4">
              {MODULES.map((module) => (
                <div key={module.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {module.description}
                    </div>
                  </div>
                  <Switch
                    checked={enabledModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
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
                  Delete Workspace
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
