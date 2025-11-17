'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Crown, Shield, User, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { TeamMember, TeamRole } from '@/lib/types/team'

interface TeamMemberRowProps {
  member: TeamMember
  currentUserId?: string
  currentUserRole: TeamRole
  teamId: string
  onPhaseAccessClick?: (member: TeamMember) => void
}

export function TeamMemberRow({
  member,
  currentUserId,
  currentUserRole,
  teamId,
  onPhaseAccessClick,
}: TeamMemberRowProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const isCurrentUser = member.user_id === currentUserId
  const canManage =
    (currentUserRole === 'owner' || currentUserRole === 'admin') &&
    !isCurrentUser &&
    member.role !== 'owner'

  // Get initials for avatar
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const displayName = member.users?.name || member.users?.email?.split('@')[0] || 'Unknown User'
  const initials = member.users ? getInitials(member.users.name, member.users.email) : 'U'

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async (newRole: TeamRole) => {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      return response.json()
    },
    onSuccess: (_, newRole) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      toast({
        title: 'Role updated',
        description: `Member role changed to ${newRole}`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      toast({
        title: 'Member removed',
        description: 'Team member has been removed from the team.',
      })
      setShowRemoveDialog(false)
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove member',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const getRoleBadgeStyles = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'member':
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      case 'member':
        return <User className="h-3 w-3" />
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{displayName}</p>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">
                  You
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {member.users?.email || 'No email'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role Badge/Selector */}
          {canManage ? (
            <Select
              value={member.role}
              onValueChange={(value) => changeRoleMutation.mutate(value as TeamRole)}
              disabled={changeRoleMutation.isPending}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue>
                  <div className="flex items-center gap-1.5">
                    {getRoleIcon(member.role)}
                    <span className="text-xs font-medium">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Member</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className={`text-xs border ${getRoleBadgeStyles(member.role)}`}>
              <span className="flex items-center gap-1.5">
                {getRoleIcon(member.role)}
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            </Badge>
          )}

          {/* Phase Access Button */}
          {onPhaseAccessClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPhaseAccessClick(member)}
              className="hidden sm:flex"
            >
              Phase Access
            </Button>
          )}

          {/* Remove Button */}
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRemoveDialog(true)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="sr-only">Remove member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{displayName}</strong> from the team? They
              will lose access to all workspaces and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
