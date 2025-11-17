'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { Crown, Shield, User, Trash2, Settings } from 'lucide-react'
import { ComprehensiveMemberEditor } from '@/components/team/comprehensive-member-editor'

interface TeamMember {
  id: string
  role: string
  joined_at: string
  user_id: string
  users: {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
  } | null
}

interface TeamMembersListProps {
  members: TeamMember[]
  currentUserId: string
  currentUserRole: string
  teamId: string
  workspaceId?: string
  workspaceName?: string
}

export function TeamMembersList({
  members,
  currentUserId,
  currentUserRole,
  teamId,
  workspaceId,
  workspaceName,
}: TeamMembersListProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      console.error('Error updating role:', error)
      alert(error.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removingMemberId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', removingMemberId)

      if (error) throw error

      setRemovingMemberId(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error removing member:', error)
      alert(error.message || 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId
          const canChangeRole =
            isAdmin &&
            !isCurrentUser &&
            member.role !== 'owner' &&
            currentUserRole === 'owner'
          const canRemove = isAdmin && !isCurrentUser && member.role !== 'owner'

          // Skip members without user data
          if (!member.users) {
            return null
          }

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {member.users.name
                    ? member.users.name.charAt(0).toUpperCase()
                    : member.users.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {member.users.name || member.users.email}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.users.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {canChangeRole ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getRoleBadgeColor(member.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </Badge>
                )}

                {/* Edit Permissions button (only show if workspace context is available) */}
                {isAdmin && workspaceId && workspaceName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMember(member)}
                    disabled={loading}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Permissions
                  </Button>
                )}

                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemovingMemberId(member.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog
        open={removingMemberId !== null}
        onOpenChange={(open) => !open && setRemovingMemberId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team? They
              will lose access to all workspaces and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comprehensive Member Editor */}
      {editingMember && workspaceId && workspaceName && (
        <ComprehensiveMemberEditor
          member={{
            id: editingMember.id,
            user_id: editingMember.user_id,
            team_id: teamId,
            role: editingMember.role as 'owner' | 'admin' | 'member',
            users: editingMember.users
          }}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          currentUserRole={currentUserRole as 'owner' | 'admin' | 'member'}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        />
      )}
    </>
  )
}
