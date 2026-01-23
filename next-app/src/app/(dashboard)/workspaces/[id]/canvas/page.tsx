import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, FileText, PenTool, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Document type icons
const typeIcons = {
  mindmap: Sparkles,
  document: FileText,
  canvas: PenTool,
}

// Document type labels
const typeLabels = {
  mindmap: 'Mind Map',
  document: 'Document',
  canvas: 'Whiteboard',
}

export default async function CanvasListPage({ params }: PageProps) {
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

  // Get BlockSuite documents for this workspace
  const { data: canvases, error: canvasError } = await supabase
    .from('blocksuite_documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('team_id', workspace.team_id)
    .order('updated_at', { ascending: false })

  if (canvasError) {
    console.error('Error fetching canvases:', canvasError)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Canvas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create mind maps, documents, and whiteboards
              </p>
            </div>
            <Link href={`/workspaces/${workspaceId}/canvas/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Canvas
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div>Loading canvases...</div>}>
          {canvases && canvases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {canvases.map((canvas) => {
                const Icon = typeIcons[canvas.document_type as keyof typeof typeIcons] || FileText
                const label = typeLabels[canvas.document_type as keyof typeof typeLabels] || 'Canvas'

                return (
                  <Link
                    key={canvas.id}
                    href={`/workspaces/${workspaceId}/canvas/${canvas.id}`}
                  >
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {label}
                          </span>
                        </div>
                        <CardTitle className="text-lg mt-2">
                          {canvas.title || 'Untitled'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          {canvas.updated_at
                            ? `Updated ${formatDistanceToNow(new Date(canvas.updated_at))} ago`
                            : 'No updates yet'}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <PenTool className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No canvases yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first canvas to start brainstorming
              </p>
              <Link href={`/workspaces/${workspaceId}/canvas/new`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Canvas
                </Button>
              </Link>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
