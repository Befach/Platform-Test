import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateMindMapForm } from '@/components/mind-maps/create-mind-map-form'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewMindMapPage({ params }: PageProps) {
  const { id: workspaceId } = await params
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace to verify access
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*, team:teams!inner(*)')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    redirect('/dashboard')
  }

  // Get team member role
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', workspace.team_id)
    .eq('user_id', user.id)
    .single()

  if (!teamMember) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Mind Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a canvas type and get started
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateMindMapForm
            workspaceId={workspaceId}
            teamId={workspace.team_id}
            userId={user.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
