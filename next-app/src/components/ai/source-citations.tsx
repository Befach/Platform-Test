'use client'

import { FileText, Brain, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Source item from RAG retrieval
 */
export interface RAGSource {
  /** Unique identifier */
  id: string
  /** Display name of the source */
  name: string
  /** Type of source */
  type: 'mindmap' | 'document'
  /** Source type from database (e.g., 'blocksuite_mindmap', 'document', 'url') */
  sourceType: string
  /** Similarity score (0-1) */
  similarity: number
  /** Mind map ID if type is mindmap */
  mindMapId?: string
  /** Document ID if type is document */
  documentId?: string
}

interface SourceCitationsProps {
  /** List of sources used in the response */
  sources: RAGSource[]
  /** Additional CSS classes */
  className?: string
  /** Callback when a source is clicked */
  onSourceClick?: (source: RAGSource) => void
}

/**
 * Source Citations Component
 *
 * Displays clickable citations for knowledge sources used in the AI response.
 * Groups sources by type (mind maps vs documents) and shows similarity scores.
 *
 * @example
 * ```tsx
 * <SourceCitations
 *   sources={ragSources}
 *   onSourceClick={(source) => navigateToSource(source)}
 * />
 * ```
 */
export function SourceCitations({
  sources,
  className,
  onSourceClick,
}: SourceCitationsProps) {
  if (sources.length === 0) return null

  const mindMaps = sources.filter((s) => s.type === 'mindmap')
  const documents = sources.filter((s) => s.type === 'document')

  const renderSource = (source: RAGSource) => (
    <button
      key={source.id}
      onClick={() => onSourceClick?.(source)}
      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left w-full group"
    >
      {source.type === 'mindmap' ? (
        <Brain className="h-3.5 w-3.5 text-purple-500 shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
      )}
      <span className="truncate flex-1">{source.name}</span>
      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {Math.round(source.similarity * 100)}%
      </span>
      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )

  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Sources Used
      </h4>

      {mindMaps.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-purple-500" />
            Mind Maps ({mindMaps.length})
          </h5>
          <div className="space-y-0.5">{mindMaps.map(renderSource)}</div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-blue-500" />
            Documents ({documents.length})
          </h5>
          <div className="space-y-0.5">{documents.map(renderSource)}</div>
        </div>
      )}
    </div>
  )
}
