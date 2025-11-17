'use client'

import { useState, FormEvent, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, Check, UserPlus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { PhaseAssignmentMatrix } from '@/components/team/phase-assignment-matrix'
import { TeamMembersList } from '@/components/teams/team-members-list'
import Link from 'next/link'

interface WorkspaceGeneralSettingsProps {
  workspace: {
    id: string
    name: string
    description: string | null
    phase: string
    team_id: string
  }
  currentUserId?: string
}

type SidebarBehavior = 'expanded' | 'collapsed' | 'hover'

export function WorkspaceGeneralSettings({ workspace, currentUserId }: WorkspaceGeneralSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sidebarBehavior, setSidebarBehavior] = useState<SidebarBehavior>('expanded')
  const [sidebarSaved, setSidebarSaved] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member')
  const [phaseMatrixOpen, setPhaseMatrixOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Load sidebar behavior preference from localStorage
  useEffect(() => {
    const savedBehavior = localStorage.getItem('workspace-sidebar-behavior') as SidebarBehavior
    if (savedBehavior) {
      setSidebarBehavior(savedBehavior)
    }
  }, [])

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // Try to join with public.users table (will work after setup)
        const { data, error } = await supabase
          .from('team_members')
          .select('id, user_id, role, joined_at, users(email, name)')
          .eq('team_id', workspace.team_id)
          .order('joined_at', { ascending: true})

        if (error) {
          // If join fails (table doesn't exist), fall back to basic query
          console.warn('Users table join failed, using fallback:', error)
          const { data: basicData, error: basicError } = await supabase
            .from('team_members')
            .select('id, user_id, role, joined_at')
            .eq('team_id', workspace.team_id)
            .order('joined_at', { ascending: true})

          if (basicError) throw basicError

          // Show user_id as placeholder
          const membersWithPlaceholder = (basicData || []).map(member => ({
            ...member,
            users: {
              email: member.user_id,
              name: null
            }
          }))

          setTeamMembers(membersWithPlaceholder)

          // Find current user's role
          if (currentUserId) {
            const currentMember = basicData?.find(m => m.user_id === currentUserId)
            if (currentMember) {
              setCurrentUserRole(currentMember.role)
            }
          }
          setLoadingMembers(false)
          return
        }

        // Success with users join
        setTeamMembers(data || [])

        // Find current user's role
        if (currentUserId) {
          const currentMember = data?.find(m => m.user_id === currentUserId)
          if (currentMember) {
            setCurrentUserRole(currentMember.role)
          }
        }
      } catch (error) {
        console.error('Error loading team members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadTeamMembers()
  }, [workspace.team_id, currentUserId, supabase])

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

  const handleSidebarBehaviorChange = (behavior: SidebarBehavior) => {
    setSidebarBehavior(behavior)
    localStorage.setItem('workspace-sidebar-behavior', behavior)

    // Also update the collapsed state if needed
    if (behavior === 'collapsed') {
      localStorage.setItem('workspace-sidebar-collapsed', 'true')
    } else if (behavior === 'expanded') {
      localStorage.setItem('workspace-sidebar-collapsed', 'false')
    }

    setSidebarSaved(true)
    setTimeout(() => setSidebarSaved(false), 2000)

    // Reload to apply changes
    window.location.reload()
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

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  return (
    <div className="space-y-6">
      {/* General Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your workspace name and description
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

      {/* Sidebar Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Preferences</CardTitle>
          <CardDescription>
            Control how the sidebar behaves across all workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Sidebar Behavior</Label>
            <div className="space-y-2">
              {/* Expanded Option */}
              <button
                type="button"
                onClick={() => handleSidebarBehaviorChange('expanded')}
                className={`w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  sidebarBehavior === 'expanded'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center shrink-0 mt-0.5">
                  {sidebarBehavior === 'expanded' && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Expanded</div>
                  <p className="text-sm text-muted-foreground">
                    Sidebar stays open by default
                  </p>
                </div>
              </button>

              {/* Collapsed Option */}
              <button
                type="button"
                onClick={() => handleSidebarBehaviorChange('collapsed')}
                className={`w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  sidebarBehavior === 'collapsed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center shrink-0 mt-0.5">
                  {sidebarBehavior === 'collapsed' && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Collapsed</div>
                  <p className="text-sm text-muted-foreground">
                    Sidebar stays minimized by default
                  </p>
                </div>
              </button>

              {/* Expand on Hover Option */}
              <button
                type="button"
                onClick={() => handleSidebarBehaviorChange('hover')}
                className={`w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  sidebarBehavior === 'hover'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center shrink-0 mt-0.5">
                  {sidebarBehavior === 'hover' && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Expand on Hover</div>
                  <p className="text-sm text-muted-foreground">
                    Sidebar expands temporarily when you hover over it
                  </p>
                </div>
              </button>
            </div>

            {sidebarSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Preference saved - page will reload</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage who has access to this workspace
              </CardDescription>
            </div>
            {canManage && (
              <Link href="/team/members">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Team Members List with Edit Permissions */}
              <TeamMembersList
                members={teamMembers.map(member => ({
                  ...member,
                  users: member.users || null
                }))}
                currentUserId={currentUserId || ''}
                currentUserRole={currentUserRole}
                teamId={workspace.team_id}
                workspaceId={workspace.id}
                workspaceName={workspace.name}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {canManage && (
                  <>
                    <InviteMemberDialog
                      teamId={workspace.team_id}
                      preSelectedWorkspaceId={workspace.id}
                      trigger={
                        <Button variant="outline" className="flex-1">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Invite Member
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPhaseMatrixOpen(true)}
                    >
                      Phase Access Matrix
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
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

      {/* Phase Assignment Matrix Dialog */}
      <PhaseAssignmentMatrix
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        teamId={workspace.team_id}
        open={phaseMatrixOpen}
        onOpenChange={setPhaseMatrixOpen}
      />
    </div>
  )
}
