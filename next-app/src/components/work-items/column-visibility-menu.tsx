'use client'

import { useState, useEffect } from 'react'
import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ColumnVisibility {
  type: boolean
  timeline: boolean
  phase: boolean // Phase IS the status for work items
  priority: boolean
  department: boolean
  purpose: boolean
  integration: boolean
  tags: boolean
  links: boolean
  date: boolean
}

const DEFAULT_VISIBILITY: ColumnVisibility = {
  type: true,
  timeline: true,
  phase: true, // Phase IS the status
  priority: true,
  department: true,
  purpose: false,
  integration: false,
  tags: true,
  links: true,
  date: false,
}

interface ColumnVisibilityMenuProps {
  onVisibilityChange: (visibility: ColumnVisibility) => void
}

export function ColumnVisibilityMenu({ onVisibilityChange }: ColumnVisibilityMenuProps) {
  const [visibility, setVisibility] = useState<ColumnVisibility>(DEFAULT_VISIBILITY)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('table-column-visibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setVisibility({ ...DEFAULT_VISIBILITY, ...parsed })
        onVisibilityChange({ ...DEFAULT_VISIBILITY, ...parsed })
      } catch (e) {
        console.error('Failed to parse column visibility from localStorage')
      }
    } else {
      onVisibilityChange(DEFAULT_VISIBILITY)
    }
  }, [])

  const toggleColumn = (column: keyof ColumnVisibility) => {
    const newVisibility = { ...visibility, [column]: !visibility[column] }
    setVisibility(newVisibility)
    onVisibilityChange(newVisibility)
    localStorage.setItem('table-column-visibility', JSON.stringify(newVisibility))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="h-4 w-4 mr-2" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={visibility.type}
          onCheckedChange={() => toggleColumn('type')}
        >
          Type
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.timeline}
          onCheckedChange={() => toggleColumn('timeline')}
        >
          Timeline
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.phase}
          onCheckedChange={() => toggleColumn('phase')}
        >
          Phase
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.priority}
          onCheckedChange={() => toggleColumn('priority')}
        >
          Priority
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.department}
          onCheckedChange={() => toggleColumn('department')}
        >
          Department
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.tags}
          onCheckedChange={() => toggleColumn('tags')}
        >
          Tags
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.links}
          onCheckedChange={() => toggleColumn('links')}
        >
          Links
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={visibility.purpose}
          onCheckedChange={() => toggleColumn('purpose')}
        >
          Purpose
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.integration}
          onCheckedChange={() => toggleColumn('integration')}
        >
          Integration
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.date}
          onCheckedChange={() => toggleColumn('date')}
        >
          Date
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
