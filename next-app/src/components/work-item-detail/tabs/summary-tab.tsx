'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  ListTodo,
  MessageSquare,
  Pencil,
  Save,
  Target,
  X,
  User,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkItemDetailContext } from '../shared/detail-context'
import {
  statusDisplayMap,
  priorityDisplayMap,
  typeDisplayMap,
} from '@/components/work-board/shared/filter-context'
import { BugWorkflowPanel } from '@/components/work-items/bug-workflow-panel'
import type { BugPhase, BugMetadata } from '@/lib/bug/workflow'

export function SummaryTab() {
  const { workItem, counts, phase, updateWorkItem } = useWorkItemDetailContext()
  const router = useRouter()

  // Inline editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(workItem.description || '')
  const [isSaving, setIsSaving] = useState(false)

  // Calculate quick stats
  const completedTimeline = workItem.status === 'completed' ? counts.timelineItems : 0
  const timelineProgress =
    counts.timelineItems > 0
      ? Math.round((completedTimeline / counts.timelineItems) * 100)
      : 0

  // Save description
  const handleSaveDescription = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editedDescription }),
      })

      if (!response.ok) {
        throw new Error('Failed to update description')
      }

      updateWorkItem({ description: editedDescription })
      setIsEditingDescription(false)
    } catch (error) {
      console.error('Error saving description:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedDescription(workItem.description || '')
    setIsEditingDescription(false)
  }

  // Bug workflow handlers
  const handleBugPhaseChange = async (newPhase: BugPhase) => {
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: newPhase }),
      })

      if (!response.ok) {
        throw new Error('Failed to update phase')
      }

      updateWorkItem({ phase: newPhase })
    } catch (error) {
      console.error('Error updating bug phase:', error)
    }
  }

  const handleBugMetadataUpdate = async (metadata: BugMetadata) => {
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      })

      if (!response.ok) {
        throw new Error('Failed to update metadata')
      }

      updateWorkItem({ metadata })
    } catch (error) {
      console.error('Error updating bug metadata:', error)
    }
  }

  // Get display info
  const statusInfo = statusDisplayMap[workItem.status] || {
    label: workItem.status,
    color: 'bg-gray-100 text-gray-700',
  }
  const priorityInfo = priorityDisplayMap[workItem.priority] || {
    label: workItem.priority,
    color: 'bg-gray-100 text-gray-700',
    icon: 'Circle',
  }
  const typeInfo = typeDisplayMap[workItem.type] || {
    label: workItem.type,
    color: 'bg-gray-100 text-gray-700',
    icon: 'Circle',
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Overview
          </CardTitle>
          <CardDescription>
            Work item details and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDescription(true)}
                  className="h-7 px-2"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px] resize-y"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={isSaving}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {workItem.description || 'No description provided. Click Edit to add one.'}
              </p>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className={cn(statusInfo.color)}>
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className={cn(priorityInfo.color)}>
              {priorityInfo.label} Priority
            </Badge>
            <Badge variant="outline" className={cn(typeInfo.color)}>
              {typeInfo.label}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            {workItem.assigned_to_user && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Assigned to {workItem.assigned_to_user.name || workItem.assigned_to_user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created {new Date(workItem.created_at).toLocaleDateString()}</span>
            </div>
            {workItem.created_by_user && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>by {workItem.created_by_user.name || workItem.created_by_user.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bug Workflow Panel - Only for bugs */}
      {workItem.type === 'bug' && (
        <BugWorkflowPanel
          workItemId={workItem.id}
          currentPhase={(workItem.phase || 'triage') as BugPhase}
          metadata={workItem.metadata}
          reviewEnabled={workItem.review_enabled}
          reviewStatus={workItem.review_status}
          onPhaseChange={handleBugPhaseChange}
          onMetadataUpdate={handleBugMetadataUpdate}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Timeline Items */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.timelineItems}</p>
                <p className="text-xs text-muted-foreground">Timeline Items</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              MVP: {counts.mvpItems} | Short: {counts.shortItems} | Long: {counts.longItems}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.tasks}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  const tabs = document.querySelector('[role="tablist"]')
                  const tasksTab = tabs?.querySelector('[value="tasks"]') as HTMLButtonElement
                  tasksTab?.click()
                }}
              >
                View all tasks →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.feedback}</p>
                <p className="text-xs text-muted-foreground">Feedback</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  const tabs = document.querySelector('[role="tablist"]')
                  const feedbackTab = tabs?.querySelector('[value="feedback"]') as HTMLButtonElement
                  feedbackTab?.click()
                }}
              >
                View feedback →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timelineProgress}%</p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${timelineProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
