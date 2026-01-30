'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, PenTool, Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const documentTypes = [
  {
    value: 'mindmap',
    label: 'Mind Map',
    description: 'Visual brainstorming with connected nodes',
    icon: Sparkles,
  },
  {
    value: 'document',
    label: 'Document',
    description: 'Rich text document for notes and writing',
    icon: FileText,
  },
  {
    value: 'canvas',
    label: 'Whiteboard',
    description: 'Freeform canvas for drawing and diagrams',
    icon: PenTool,
  },
]

export default function NewCanvasPage({ params }: PageProps) {
  const { id: workspaceId } = use(params)
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<'mindmap' | 'document' | 'canvas'>('mindmap')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Use the rate-limited API endpoint
      const response = await fetch('/api/blocksuite/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          documentType,
          title: title.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.')
        }
        throw new Error(data.error || 'Failed to create canvas')
      }

      // Redirect to the new canvas
      router.push(`/workspaces/${workspaceId}/canvas/${data.document.id}`)
    } catch (err) {
      console.error('Error creating canvas:', err)
      setError(err instanceof Error ? err.message : 'Failed to create canvas')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/workspaces/${workspaceId}/canvas`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Canvas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new canvas for your workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Canvas Details</CardTitle>
              <CardDescription>
                Choose a type and give your canvas a name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter canvas title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              {/* Document type selection */}
              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup
                  value={documentType}
                  onValueChange={(value) => setDocumentType(value as typeof documentType)}
                  disabled={isCreating}
                  className="grid grid-cols-1 gap-3"
                >
                  {documentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Label
                        key={type.value}
                        htmlFor={type.value}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          documentType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value={type.value} id={type.value} />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>

              {/* Error message */}
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              {/* Create button */}
              <div className="flex justify-end gap-3">
                <Link href={`/workspaces/${workspaceId}/canvas`}>
                  <Button variant="outline" disabled={isCreating}>
                    Cancel
                  </Button>
                </Link>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Canvas'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
