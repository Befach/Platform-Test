'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface CreateTimelineItemDialogProps {
  featureId: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  orderIndex: number
}

export function CreateTimelineItemDialog({
  featureId,
  timeline,
  orderIndex,
}: CreateTimelineItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<string>('MEDIUM')
  const [estimatedHours, setEstimatedHours] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!title.trim()) {
        throw new Error('Title is required')
      }

      const itemId = `timeline_item_${Date.now()}`

      // Create timeline item
      const { error } = await supabase.from('timeline_items').insert({
        id: itemId,
        feature_id: featureId,
        title: title.trim(),
        description: description.trim() || null,
        timeline,
        difficulty,
        order_index: orderIndex,
        estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
      })

      if (error) throw error

      // Reset form
      setTitle('')
      setDescription('')
      setDifficulty('MEDIUM')
      setEstimatedHours('')
      setOpen(false)

      // Refresh the page
      router.refresh()
    } catch (error: any) {
      console.error('Error creating timeline item:', error)
      alert(error.message || 'Failed to create timeline item')
    } finally {
      setLoading(false)
    }
  }

  const timelineLabels = {
    MVP: 'MVP',
    SHORT: 'Short Term',
    LONG: 'Long Term',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Add {timelineLabels[timeline]} Item</DialogTitle>
            <DialogDescription>
              Add a new item to the {timelineLabels[timeline]} timeline
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., User login page"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs to be done..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="e.g., 8"
                />
              </div>
            </div>
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
              {loading ? 'Creating...' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
