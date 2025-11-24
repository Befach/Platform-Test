import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MindMapsList } from '@/components/mind-maps/mind-maps-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MindMapsPage({ params }: PageProps) {
  const { id: workspaceId } = await params
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
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

  // Get mind maps for this workspace
  const { data: mindMaps, error: mindMapsError } = await supabase
    .from('mind_maps')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('team_id', workspace.team_id)
    .order('updated_at', { ascending: false })

  if (mindMapsError) {
    console.error('Error fetching mind maps:', mindMapsError)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mind Maps</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize work items and create free-form diagrams
              </p>
            </div>
            <Link href={`/workspaces/${workspaceId}/mind-maps/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Mind Map
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div>Loading mind maps...</div>}>
          <MindMapsList
            mindMaps={mindMaps || []}
            workspaceId={workspaceId}
            teamId={workspace.team_id}
          />
        </Suspense>
      </div>
    </div>
  )
}
