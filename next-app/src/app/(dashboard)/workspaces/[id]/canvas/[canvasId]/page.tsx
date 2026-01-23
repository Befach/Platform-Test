import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CanvasEditor } from './_components/canvas-editor'

interface PageProps {
  params: Promise<{
    id: string
    canvasId: string
  }>
}

export default async function CanvasDetailPage({ params }: PageProps) {
  const { id: workspaceId, canvasId } = await params
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

  // Get canvas document
  const { data: canvas, error: canvasError } = await supabase
    .from('blocksuite_documents')
    .select('*')
    .eq('id', canvasId)
    .eq('team_id', workspace.team_id)
    .single()

  if (canvasError || !canvas) {
    redirect(`/workspaces/${workspaceId}/canvas`)
  }

  // Check if user has edit access (member or higher)
  const canEdit = ['owner', 'admin', 'member'].includes(teamMember.role)

  return (
    <CanvasEditor
      documentId={canvas.id}
      teamId={workspace.team_id}
      workspaceId={workspaceId}
      documentType={canvas.document_type as 'mindmap' | 'document' | 'canvas'}
      title={canvas.title || 'Untitled'}
      readOnly={!canEdit}
    />
  )
}
