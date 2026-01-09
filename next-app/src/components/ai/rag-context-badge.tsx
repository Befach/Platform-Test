'use client'

import { Database, Brain, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RAGContextBadgeProps {
  /** Number of mind map sources being used */
  mindMapCount: number
  /** Number of document sources being used */
  documentCount: number
  /** Additional CSS classes */
  className?: string
}

/**
 * RAG Context Badge
 *
 * Shows the number of knowledge sources (mind maps and documents)
 * being used to augment the AI response. Provides visibility into
 * the RAG retrieval process.
 *
 * @example
 * ```tsx
 * <RAGContextBadge
 *   mindMapCount={2}
 *   documentCount={3}
 * />
 * // Displays: "Using: 2 mind maps, 3 documents"
 * ```
 */
export function RAGContextBadge({
  mindMapCount,
  documentCount,
  className,
}: RAGContextBadgeProps) {
  const total = mindMapCount + documentCount

  if (total === 0) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md',
        className
      )}
    >
      <Database className="h-3 w-3" />
      <span className="flex items-center gap-1">
        Using:
        {mindMapCount > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Brain className="h-3 w-3 text-purple-500" />
            {mindMapCount}
          </span>
        )}
        {mindMapCount > 0 && documentCount > 0 && <span>,</span>}
        {documentCount > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <FileText className="h-3 w-3 text-blue-500" />
            {documentCount}
          </span>
        )}
      </span>
    </div>
  )
}
