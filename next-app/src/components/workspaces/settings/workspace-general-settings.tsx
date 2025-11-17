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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'

const PHASES = [
  { value: 'research', label: 'Research', description: 'Discovery and validation' },
  { value: 'planning', label: 'Planning', description: 'Detailed planning' },
  { value: 'review', label: 'Review', description: 'Stakeholder review' },
  { value: 'execution', label: 'Execution', description: 'Building features' },
  { value: 'testing', label: 'Testing', description: 'Quality assurance' },
  { value: 'metrics', label: 'Metrics', description: 'Success measurement' },
  { value: 'complete', label: 'Complete', description: 'Project complete' },
]

interface WorkspaceGeneralSettingsProps {
  workspace: {
    id: string
    name: string
    description: string | null
    phase: string
    team_id: string
  }
}

export function WorkspaceGeneralSettings({ workspace }: WorkspaceGeneralSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description || '')
  const [phase, setPhase] = useState(workspace.phase)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name,
          description: description || null,
          phase,
        })
        .eq('id', workspace.id)

      if (error) throw error

      setSaved(true)
      router.refresh()

      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
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
    <div className="space-y-6">
      {/* General Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your workspace name, description, and current phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g., Mobile App v2.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={loading}
                placeholder="Describe the purpose and goals of this workspace..."
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
              <p className="text-xs text-muted-foreground">
                Track your workspace through the product development lifecycle
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">✓ Saved successfully</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently delete this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">Delete this workspace</h4>
                <p className="text-sm text-muted-foreground">
                  Once you delete a workspace, there is no going back. All features, timelines, and data will be permanently deleted.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="ml-4"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Confirm Deletion</h4>
                <p className="text-sm text-red-700">
                  Are you absolutely sure you want to delete <strong>{workspace.name}</strong>? This action cannot be undone and will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>All features and work items</li>
                  <li>Timeline items and dependencies</li>
                  <li>Mind maps and research data</li>
                  <li>Review links and feedback</li>
                  <li>All analytics and metrics</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Yes, Delete Permanently
                    </>
                  )}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
