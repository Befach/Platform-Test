'use client'

/**
 * ConnectionMenu Component
 *
 * A Notion-style "/" command menu for connecting entities.
 * Supports 6 entity types with search and type filtering.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ListTodo,
  User,
  Building2,
  Target,
  Lightbulb,
  Paperclip,
  Search,
  Loader2,
  Sparkles,
  Bug,
  Zap,
  LucideIcon,
} from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useConnectionSearch } from '@/lib/hooks/use-connection-search'
import type {
  ConnectionMenuProps,
  ConnectionEntityType,
  AnyConnectionEntity,
  ENTITY_TYPE_CONFIG,
} from './connection-menu-types'

// ============================================================================
// ICON MAPPING
// ============================================================================

const TYPE_ICONS: Record<ConnectionEntityType, LucideIcon> = {
  'work-item': ListTodo,
  member: User,
  department: Building2,
  strategy: Target,
  insight: Lightbulb,
  resource: Paperclip,
}

const WORK_ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  concept: Lightbulb,
  feature: Sparkles,
  bug: Bug,
}

const TYPE_COLORS: Record<ConnectionEntityType, string> = {
  'work-item': '#6366f1',
  member: '#8b5cf6',
  department: '#10b981',
  strategy: '#f59e0b',
  insight: '#ec4899',
  resource: '#3b82f6',
}

const TYPE_LABELS: Record<ConnectionEntityType, string> = {
  'work-item': 'Work Items',
  member: 'Members',
  department: 'Departments',
  strategy: 'Strategies',
  insight: 'Insights',
  resource: 'Resources',
}

// ============================================================================
// ENTITY ITEM COMPONENTS
// ============================================================================

function WorkItemItem({ entity }: { entity: AnyConnectionEntity }) {
  const { metadata } = entity as { metadata: { itemType: string; status: string; priority?: string } }
  const Icon = WORK_ITEM_TYPE_ICONS[metadata.itemType] || ListTodo
  return (
    <div className="flex items-center gap-3 w-full">
      <Icon className="h-4 w-4 shrink-0 text-indigo-500" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        {entity.description && (
          <p className="truncate text-xs text-muted-foreground">{entity.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs capitalize">
          {metadata.itemType}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {metadata.status}
        </Badge>
      </div>
    </div>
  )
}

function MemberItem({ entity }: { entity: AnyConnectionEntity }) {
  const { metadata } = entity as { metadata: { email: string; role: string; avatarUrl?: string } }
  return (
    <div className="flex items-center gap-3 w-full">
      <Avatar className="h-6 w-6">
        <AvatarImage src={metadata.avatarUrl} alt={entity.name} />
        <AvatarFallback className="text-xs">
          {entity.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        <p className="truncate text-xs text-muted-foreground">{metadata.email}</p>
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {metadata.role}
      </Badge>
    </div>
  )
}

function DepartmentItem({ entity }: { entity: AnyConnectionEntity }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="h-6 w-6 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: entity.color ? `${entity.color}20` : '#e5e7eb' }}
      >
        <Building2 className="h-4 w-4" style={{ color: entity.color || '#6b7280' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        {entity.description && (
          <p className="truncate text-xs text-muted-foreground">{entity.description}</p>
        )}
      </div>
    </div>
  )
}

function StrategyItem({ entity }: { entity: AnyConnectionEntity }) {
  const { metadata } = entity as { metadata: { strategyType: string; progress?: number } }
  return (
    <div className="flex items-center gap-3 w-full">
      <Target className="h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        {entity.description && (
          <p className="truncate text-xs text-muted-foreground">{entity.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs capitalize">
          {metadata.strategyType.replace('_', ' ')}
        </Badge>
        {metadata.progress !== undefined && (
          <span className="text-xs text-muted-foreground">{metadata.progress}%</span>
        )}
      </div>
    </div>
  )
}

function InsightItem({ entity }: { entity: AnyConnectionEntity }) {
  const { metadata } = entity as { metadata: { insightType: string; sentiment?: string; votes?: number } }
  return (
    <div className="flex items-center gap-3 w-full">
      <Lightbulb className="h-4 w-4 shrink-0 text-pink-500" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        {entity.description && (
          <p className="truncate text-xs text-muted-foreground">{entity.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs capitalize">
          {metadata.insightType.replace('_', ' ')}
        </Badge>
        {metadata.votes !== undefined && metadata.votes > 0 && (
          <span className="text-xs text-muted-foreground">+{metadata.votes}</span>
        )}
      </div>
    </div>
  )
}

function ResourceItem({ entity }: { entity: AnyConnectionEntity }) {
  const { metadata } = entity as { metadata: { resourceType: string } }
  return (
    <div className="flex items-center gap-3 w-full">
      <Paperclip className="h-4 w-4 shrink-0 text-blue-500" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{entity.name}</p>
        {entity.description && (
          <p className="truncate text-xs text-muted-foreground">{entity.description}</p>
        )}
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {metadata.resourceType}
      </Badge>
    </div>
  )
}

function EntityItem({ entity }: { entity: AnyConnectionEntity }) {
  switch (entity.type) {
    case 'work-item':
      return <WorkItemItem entity={entity} />
    case 'member':
      return <MemberItem entity={entity} />
    case 'department':
      return <DepartmentItem entity={entity} />
    case 'strategy':
      return <StrategyItem entity={entity} />
    case 'insight':
      return <InsightItem entity={entity} />
    case 'resource':
      return <ResourceItem entity={entity} />
    default: {
      // Exhaustive check - this should never be reached
      const _exhaustiveCheck: never = entity
      return null
    }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectionMenu({
  teamId,
  workspaceId,
  open,
  onOpenChange,
  onSelect,
  enabledTypes = ['work-item', 'member', 'department', 'strategy', 'insight', 'resource'],
  trigger,
}: ConnectionMenuProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ConnectionEntityType | 'all'>('all')

  const { search, resultsByType, loading, error, clearResults } = useConnectionSearch()

  // Perform search when query or filter changes
  useEffect(() => {
    if (!open) return

    const types = activeFilter === 'all' ? enabledTypes : [activeFilter]

    const timeoutId = setTimeout(() => {
      search({
        query: searchQuery,
        teamId,
        workspaceId,
        types,
        limit: 10,
      })
    }, 200) // Debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeFilter, teamId, workspaceId, open, enabledTypes, search])

  // Clear results when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setActiveFilter('all')
      clearResults()
    }
  }, [open, clearResults])

  const handleSelect = useCallback(
    (entity: AnyConnectionEntity) => {
      onSelect(entity)
      onOpenChange(false)
    },
    [onSelect, onOpenChange]
  )

  // Get filtered types with results
  const typesWithResults = enabledTypes.filter(
    (type) => activeFilter === 'all' || activeFilter === type
  )

  const hasResults = typesWithResults.some((type) => resultsByType[type]?.length > 0)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Search className="h-4 w-4 mr-1" />
            <span className="text-muted-foreground">/</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search to connect..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b overflow-x-auto">
            <Button
              variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs shrink-0"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            {enabledTypes.map((type) => {
              const Icon = TYPE_ICONS[type]
              return (
                <Button
                  key={type}
                  variant={activeFilter === type ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => setActiveFilter(type)}
                >
                  <Icon className="h-3 w-3 mr-1" style={{ color: TYPE_COLORS[type] }} />
                  {TYPE_LABELS[type]}
                </Button>
              )
            })}
          </div>

          <CommandList className="max-h-[400px]">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && !hasResults && (
              <CommandEmpty>
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : searchQuery ? (
                  <span>No results for "{searchQuery}"</span>
                ) : (
                  <span>Type to search...</span>
                )}
              </CommandEmpty>
            )}

            {!loading &&
              typesWithResults.map((type, index) => {
                const entities = resultsByType[type]
                if (!entities || entities.length === 0) return null

                const Icon = TYPE_ICONS[type]

                return (
                  <div key={type}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup
                      heading={
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-3.5 w-3.5"
                            style={{ color: TYPE_COLORS[type] }}
                          />
                          <span>{TYPE_LABELS[type]}</span>
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-xs ml-auto"
                          >
                            {entities.length}
                          </Badge>
                        </div>
                      }
                    >
                      {entities.map((entity) => (
                        <CommandItem
                          key={`${entity.type}-${entity.id}`}
                          value={`${entity.type}-${entity.id}`}
                          onSelect={() => handleSelect(entity)}
                          className="cursor-pointer"
                        >
                          <EntityItem entity={entity} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                )
              })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ConnectionMenu
