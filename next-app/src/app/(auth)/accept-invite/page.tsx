'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select(
          `
          *,
          teams:team_id (
            name,
            plan
          )
        `
        )
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (fetchError || !data) {
        setError('Invitation not found or already accepted')
        setLoading(false)
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      setInvitation(data)
      setLoading(false)

      // Auto-accept if user is already authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && user.email === data.email) {
        // User is authenticated and email matches, auto-accept
        await acceptInvitation(user, data)
      }
    } catch (err: any) {
      console.error('Error loading invitation:', err)
      setError(err.message || 'Failed to load invitation')
      setLoading(false)
    }
  }

  const acceptInvitation = async (user: any, invitationData: any) => {
    setAccepting(true)

    try {
      // Create user profile if it doesn't exist
      await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
        },
        { onConflict: 'id' }
      )

      // Add user as team member
      const memberId = `member_${Date.now()}`
      const { error: memberError } = await supabase.from('team_members').insert({
        id: memberId,
        team_id: invitationData.team_id,
        user_id: user.id,
        role: invitationData.role,
      })

      if (memberError) throw memberError

      // Create phase assignments if provided
      if (invitationData.phase_assignments && Array.isArray(invitationData.phase_assignments)) {
        const phaseAssignments = invitationData.phase_assignments.map((assignment: any) => ({
          id: `assignment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          team_id: invitationData.team_id,
          workspace_id: assignment.workspace_id,
          user_id: user.id,
          phase: assignment.phase,
          can_edit: assignment.can_edit ?? true,
          assigned_by: invitationData.invited_by,
          assigned_at: new Date().toISOString(),
          notes: `Auto-assigned via invitation on ${new Date().toLocaleDateString()}`,
        }))

        if (phaseAssignments.length > 0) {
          const { error: assignmentError } = await supabase
            .from('user_phase_assignments')
            .insert(phaseAssignments)

          if (assignmentError) {
            console.error('Error creating phase assignments:', assignmentError)
            // Don't throw - invitation is still accepted, just log the error
          }
        }
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationData.id)

      if (updateError) throw updateError

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      setError(error.message || 'Failed to accept invitation')
      setAccepting(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)

    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to signup with return URL
        const returnUrl = encodeURIComponent(`/accept-invite?token=${token}`)
        router.push(`/signup?returnTo=${returnUrl}`)
        return
      }

      // Check if user's email matches invitation
      if (user.email !== invitation.email) {
        setError(
          `This invitation was sent to ${invitation.email}. Please sign in with that email address.`
        )
        setAccepting(false)
        return
      }

      await acceptInvitation(user, invitation)
    } catch (error: any) {
      console.error('Error in handleAccept:', error)
      setError(error.message || 'Failed to accept invitation')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join a team on Product Lifecycle Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Team</span>
                <span className="font-semibold">{invitation.teams.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Your Role</span>
                <span className="font-semibold capitalize">
                  {invitation.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-semibold capitalize">
                  {invitation.teams.plan}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Accept the invitation to join the team</li>
                <li>Access all team workspaces and projects</li>
                <li>Start collaborating with your team members</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
            size="lg"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
