'use client'

/**
 * Embeddable Widget Page
 *
 * A compact, iframe-embeddable feedback form.
 * Supports URL parameters for customization:
 * - theme: light | dark | auto
 * - primaryColor: hex color (URL encoded)
 * - position: bottom-right | bottom-left | top-right | top-left
 *
 * Communicates with parent window via postMessage.
 */

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Loader2,
  MessageSquare,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Send,
  CheckCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateFormLoadToken } from '@/lib/security/honeypot'

// Compact form schema
const widgetSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  email: z.string().email().optional().or(z.literal('')),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  website: z.string().max(0).optional(),
  _formLoadTime: z.string(),
})

type WidgetFormValues = z.infer<typeof widgetSchema>

interface WorkspaceInfo {
  id: string
  name: string
  icon?: string
}

export default function WidgetPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string

  // URL customization params
  const theme = searchParams.get('theme') || 'auto'
  const primaryColor = searchParams.get('primaryColor') || '#3B82F6'
  const requireEmail = searchParams.get('requireEmail') === 'true'

  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formLoadTime] = useState(() => generateFormLoadToken())

  const form = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      title: '',
      description: '',
      email: '',
      sentiment: 'neutral',
      website: '',
      _formLoadTime: formLoadTime,
    },
  })

  // Fetch workspace info
  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const response = await fetch(`/api/public/workspaces/${workspaceId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Widget not available')
        }

        setWorkspace(data.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspace()
  }, [workspaceId])

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    }
    // 'auto' uses system preference
  }, [theme])

  // Get the parent origin for secure postMessage communication
  // Wildcard fallback is intentional - this is a PUBLIC widget embeddable on any domain
  const getParentOrigin = (): string => {
    try {
      if (document.referrer) {
        return new URL(document.referrer).origin
      }
    } catch {
      // Invalid referrer URL
    }
    return '*' // Public widget: wildcard is acceptable
  }

  // Notify parent of resize and other events
  const notifyParent = (type: string, data?: any) => {
    if (window.parent !== window) {
      const targetOrigin = getParentOrigin()
      window.parent.postMessage(
        { source: 'feedback-widget', type, workspaceId, ...data },
        targetOrigin
      )
    }
  }

  // Close widget
  const handleClose = () => {
    notifyParent('close')
  }

  const onSubmit = async (data: WidgetFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: data.title,
          description: data.description,
          email: data.email || undefined,
          sentiment: data.sentiment,
          website: data.website,
          _formLoadTime: data._formLoadTime,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit')
      }

      setSubmitted(true)
      notifyParent('submitted', { id: result.data.id })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error && !workspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium">Thank you!</p>
            <p className="text-sm text-muted-foreground">
              Your feedback has been submitted.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false)
              form.reset()
            }}
          >
            Submit another
          </Button>
        </div>
      </div>
    )
  }

  const sentimentButtons = [
    { value: 'positive' as const, icon: ThumbsUp, label: '👍', color: 'text-green-600' },
    { value: 'neutral' as const, icon: Minus, label: '😐', color: 'text-gray-500' },
    { value: 'negative' as const, icon: ThumbsDown, label: '👎', color: 'text-red-500' },
  ]

  return (
    <div
      className="min-h-screen bg-background p-4"
      style={{ '--primary': primaryColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {workspace?.icon ? (
            <span className="text-lg">{workspace.icon}</span>
          ) : (
            <MessageSquare className="h-5 w-5" style={{ color: primaryColor }} />
          )}
          <span className="font-medium text-sm">{workspace?.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Sentiment - Emoji style for compact widget */}
          <FormField
            control={form.control}
            name="sentiment"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-center gap-2">
                  {sentimentButtons.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => field.onChange(s.value)}
                      className={cn(
                        'h-10 w-10 rounded-full text-xl transition-all',
                        field.value === s.value
                          ? 'bg-primary/10 ring-2 ring-primary scale-110'
                          : 'hover:bg-muted'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="What's your feedback about?"
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Tell us more..."
                    rows={3}
                    className="text-sm resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (optional based on settings) */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={requireEmail ? "Your email *" : "Email (optional)"}
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Honeypot - Hidden */}
          <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
            <Input
              {...form.register('website')}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <input type="hidden" {...form.register('_formLoadTime')} />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </form>
      </Form>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Powered by {workspace?.name}
      </p>
    </div>
  )
}
