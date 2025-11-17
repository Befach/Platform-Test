'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Mail, X, Clock, Loader2, Shield, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface PendingInvitation {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  expires_at: string
  invited_by_user?: {
    name: string | null
    email: string
  } | null
}

interface PendingInvitationCardProps {
  invitation: PendingInvitation
  teamId: string
}

export function PendingInvitationCard({ invitation, teamId }: PendingInvitationCardProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Cancel invitation mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/team/invitations/${invitation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel invitation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations', teamId] })
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to cancel invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const getRoleBadgeStyles = (role: 'admin' | 'member') => {
    return role === 'admin'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getRoleIcon = (role: 'admin' | 'member') => {
    return role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />
  }

  const isExpired = new Date(invitation.expires_at) < new Date()
  const createdAt = new Date(invitation.created_at)
  const expiresAt = new Date(invitation.expires_at)

  return (
    <Card className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Invitation details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {/* Email */}
            <p className="font-medium truncate">{invitation.email}</p>

            {/* Role and Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs border ${getRoleBadgeStyles(invitation.role)}`}
              >
                <span className="flex items-center gap-1.5">
                  {getRoleIcon(invitation.role)}
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </span>
              </Badge>

              {isExpired ? (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Pending
                </Badge>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sent {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
              {!isExpired && (
                <>
                  <span>•</span>
                  <span>Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}</span>
                </>
              )}
            </div>

            {/* Invited by */}
            {invitation.invited_by_user && (
              <p className="text-xs text-muted-foreground">
                Invited by{' '}
                {invitation.invited_by_user.name || invitation.invited_by_user.email}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Cancel button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {cancelMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="sr-only">Cancel invitation</span>
        </Button>
      </div>
    </Card>
  )
}
