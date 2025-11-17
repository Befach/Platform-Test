'use client'

import { useState, FormEvent } from 'react'
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

interface CreateWorkspaceDialogProps {
  teamId: string
  onSuccess?: () => void
}

export function CreateWorkspaceDialog({ teamId, onSuccess }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState('research')
  const [enabledModules, setEnabledModules] = useState<string[]>([
    'research',
    'mind_map',
    'features',
    'timeline',
  ])

  const router = useRouter()
  const supabase = createClient()

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
      const workspaceId = `workspace_${Date.now()}`

      const { error } = await supabase.from('workspaces').insert({
        id: workspaceId,
        team_id: teamId,
        name,
        description,
        phase,
        enabled_modules: enabledModules,
      })

      if (error) throw error

      // Reset form
      setName('')
      setDescription('')
      setPhase('research')
      setEnabledModules(['research', 'mind_map', 'features', 'timeline'])
      setOpen(false)

      // Refresh the page to show new workspace
      router.refresh()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating workspace:', error)
      alert(error.message || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Create Workspace</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Set up a new project workspace with custom phases and modules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q2 Product Launch"
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
              placeholder="Describe the goals and scope of this workspace..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Starting Phase</Label>
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
            <p className="text-xs text-muted-foreground">
              You can enable/disable modules later from workspace settings.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
