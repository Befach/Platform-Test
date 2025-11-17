'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Trash2, Mail } from 'lucide-react'

interface PendingInvitationsListProps {
  invitations: any[]
  teamId: string
}

export function PendingInvitationsList({
  invitations,
  teamId,
}: PendingInvitationsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Ensure invitations is always an array
  const safeInvitations = Array.isArray(invitations) ? invitations : []

  const handleDelete = async () => {
    if (!deletingId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', deletingId)

      if (error) throw error

      setDeletingId(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting invitation:', error)
      alert(error.message || 'Failed to delete invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId)
    setLoading(true)

    try {
      // Send invitation email
      const emailResponse = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      alert('Invitation email sent successfully!')
      router.refresh()
    } catch (error: any) {
      console.error('Error resending invitation:', error)
      alert(error.message || 'Failed to resend invitation')
    } finally {
      setLoading(false)
      setResendingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {safeInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">
                Role: {invitation.role} • Invited{' '}
                {new Date(invitation.created_at).toLocaleDateString()}
                {' • Expires '}
                {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Pending</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleResend(invitation.id)}
                disabled={loading}
                title="Resend invitation email"
              >
                <Mail className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingId(invitation.id)}
                disabled={loading}
                title="Delete invitation"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation? The invited user
              will no longer be able to accept this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
