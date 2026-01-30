'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SimpleCanvas } from '@/components/blocksuite'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Check, Loader2 } from 'lucide-react'

interface CanvasEditorProps {
  documentId: string
  teamId: string
  workspaceId: string
  documentType: 'mindmap' | 'document' | 'canvas'
  title: string
  readOnly: boolean
}

export function CanvasEditor({
  documentId,
  teamId,
  workspaceId,
  documentType,
  title,
  readOnly,
}: CanvasEditorProps) {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const handleReady = useCallback(() => {
    setIsReady(true)
  }, [])

  const handleSaveStatusChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/workspaces/${workspaceId}/canvas`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {documentType === 'mindmap' ? 'Mind Map' : documentType}
                  {readOnly && ' (Read Only)'}
                </p>
              </div>
            </div>

            {/* Save status indicator */}
            <div className="flex items-center gap-2">
              {!isReady ? (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="text-sm text-yellow-600 flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                <span className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <SimpleCanvas
          documentId={documentId}
          teamId={teamId}
          documentType={documentType}
          readOnly={readOnly}
          onReady={handleReady}
          onSaveStatusChange={handleSaveStatusChange}
          className="h-full"
        />
      </div>
    </div>
  )
}
