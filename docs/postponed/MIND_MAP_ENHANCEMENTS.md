# Mind Map Enhancements - Implementation Plan

**Status**: Postponed to Week 8+ (after core modules complete)
**Estimated Total Effort**: ~70 days
**Last Updated**: 2025-11-14
**Original Date**: 2025-01-13

---

## Overview

This document outlines tldraw-inspired enhancements to our existing ReactFlow-based mind mapping module. These features will be implemented **after** completing all other pending modules (Dependencies, Review, Execution, Timeline, Collaboration, Research, Analytics, AI Assistant).

### Why ReactFlow (Not tldraw)?

After comprehensive analysis:

- **ReactFlow**: MIT license, purpose-built for node graphs, already integrated
- **tldraw**: Proprietary license (watermark required), designed for freehand drawing
- **Decision**: Keep ReactFlow, cherry-pick best tldraw features

**ReactFlow Score**: 8.65/10
**tldraw Score**: 4.55/10

---

## Current Mind Map Status

### ✅ Completed Features (Week 3)

- ReactFlow canvas integration
- 5 node types: idea, problem, solution, feature, question
- Custom node styling per type
- Create/edit/delete nodes and edges
- Template system (Product Development, User Research, Technical Architecture, etc.)
- Convert nodes to work items
- Auto-save with debouncing
- PNG export
- Database integration with Supabase
- Multi-tenant RLS policies
- React Query caching with optimistic updates

### 🎯 Deferred Enhancements (To Be Implemented Later)

This document contains 23 additional features across 3 implementation phases.

---

## Phase 1: Quick Wins (6 days)

High-impact, low-effort features that significantly improve user experience.

### 1. Enhanced Keyboard Shortcuts System (1 day)

**Goal**: Speed up node creation and canvas navigation with keyboard shortcuts.

**Shortcuts to Implement**:

```typescript
// Add Node Shortcuts
'1' → Add Idea node
'2' → Add Problem node
'3' → Add Solution node
'4' → Add Feature node
'5' → Add Question node

// View Controls
'Ctrl+F' → Fit view
'Ctrl+=' → Zoom in
'Ctrl+-' → Zoom out
'Ctrl+0' → Reset zoom to 100%

// Selection & Editing
'Ctrl+A' → Select all nodes
'Ctrl+D' → Duplicate selected nodes
'Delete' → Delete selected nodes
'Escape' → Deselect all

// Undo/Redo (see Feature #6)
'Ctrl+Z' → Undo
'Ctrl+Y' / 'Ctrl+Shift+Z' → Redo
```

**Implementation**:

**File**: `next-app/src/lib/hooks/use-keyboard-shortcuts.ts` (NEW)

```typescript
import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category: 'add' | 'view' | 'selection' | 'editing' | 'undo'
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Export shortcut definitions for help modal
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Will be populated in mind-map-canvas.tsx
]
```

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'

// Inside component:
const shortcuts = [
  { key: '1', action: () => createNode('idea'), description: 'Add Idea node', category: 'add' },
  { key: '2', action: () => createNode('problem'), description: 'Add Problem node', category: 'add' },
  { key: '3', action: () => createNode('solution'), description: 'Add Solution node', category: 'add' },
  { key: '4', action: () => createNode('feature'), description: 'Add Feature node', category: 'add' },
  { key: '5', action: () => createNode('question'), description: 'Add Question node', category: 'add' },
  { key: 'f', ctrl: true, action: () => fitView(), description: 'Fit view', category: 'view' },
  { key: '=', ctrl: true, action: () => zoomIn(), description: 'Zoom in', category: 'view' },
  { key: '-', ctrl: true, action: () => zoomOut(), description: 'Zoom out', category: 'view' },
  { key: 'a', ctrl: true, action: () => selectAll(), description: 'Select all', category: 'selection' },
  { key: 'd', ctrl: true, action: () => duplicateSelected(), description: 'Duplicate', category: 'editing' },
  { key: 'Delete', action: () => deleteSelected(), description: 'Delete selected', category: 'editing' },
]

useKeyboardShortcuts(shortcuts)
```

---

### 2. Keyboard Shortcuts Help Modal (0.5 days)

**Goal**: Help users discover and learn keyboard shortcuts.

**Trigger**: Press `/` or click "Shortcuts" button in toolbar.

**Implementation**:

**File**: `next-app/src/components/mind-map/keyboard-shortcuts-dialog.tsx` (NEW)

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'

interface ShortcutGroup {
  category: string
  shortcuts: Array<{
    keys: string
    description: string
  }>
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Add Nodes',
    shortcuts: [
      { keys: '1', description: 'Add Idea node' },
      { keys: '2', description: 'Add Problem node' },
      { keys: '3', description: 'Add Solution node' },
      { keys: '4', description: 'Add Feature node' },
      { keys: '5', description: 'Add Question node' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl + F', description: 'Fit view' },
      { keys: 'Ctrl + =', description: 'Zoom in' },
      { keys: 'Ctrl + -', description: 'Zoom out' },
      { keys: 'Ctrl + 0', description: 'Reset zoom' },
    ],
  },
  {
    category: 'Selection',
    shortcuts: [
      { keys: 'Ctrl + A', description: 'Select all' },
      { keys: 'Escape', description: 'Deselect all' },
    ],
  },
  {
    category: 'Editing',
    shortcuts: [
      { keys: 'Ctrl + C', description: 'Copy' },
      { keys: 'Ctrl + V', description: 'Paste' },
      { keys: 'Ctrl + D', description: 'Duplicate' },
      { keys: 'Delete', description: 'Delete selected' },
      { keys: 'Ctrl + Z', description: 'Undo' },
      { keys: 'Ctrl + Y', description: 'Redo' },
    ],
  },
]

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="font-semibold mb-3">{group.category}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Update**: `next-app/src/components/mind-map/mind-map-toolbar.tsx`

```typescript
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'

// Add to toolbar:
<KeyboardShortcutsDialog />
```

---

### 3. Right-Click Context Menu (1 day)

**Goal**: Quick access to common node actions via right-click.

**Menu Items**:

- Edit (open edit dialog)
- Duplicate
- Change Type (submenu with 5 node types)
- Delete

- ---

- Copy
- Paste (if clipboard has nodes)

**Dependencies**: Install shadcn/ui ContextMenu

```bash
npx shadcn-ui@latest add context-menu
```

**Implementation**:

**File**: `next-app/src/components/mind-map/node-context-menu.tsx` (NEW)

```typescript
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { NodeType } from '@/lib/types/mind-map'

interface NodeContextMenuProps {
  children: React.ReactNode
  nodeId: string
  nodeType: NodeType
  onEdit: () => void
  onDuplicate: () => void
  onChangeType: (newType: NodeType) => void
  onDelete: () => void
  onCopy: () => void
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  idea: '💡 Idea',
  problem: '❌ Problem',
  solution: '✅ Solution',
  feature: '⭐ Feature',
  question: '❓ Question',
}

export function NodeContextMenu({
  children,
  nodeId,
  nodeType,
  onEdit,
  onDuplicate,
  onChangeType,
  onDelete,
  onCopy,
}: NodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onEdit}>
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          Duplicate
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Change Type</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
              <ContextMenuItem
                key={type}
                onClick={() => onChangeType(type as NodeType)}
                disabled={type === nodeType}
              >
                {label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCopy}>
          Copy
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-600">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
```

**Update**: `next-app/src/components/mind-map/node-types/base-node.tsx`

```typescript
import { NodeContextMenu } from '../node-context-menu'

// Wrap node content:
<NodeContextMenu
  nodeId={id}
  nodeType={data.node_type}
  onEdit={() => data.onEdit?.(id)}
  onDuplicate={() => data.onDuplicate?.(id)}
  onChangeType={(newType) => data.onChangeType?.(id, newType)}
  onDelete={() => data.onDelete?.(id)}
  onCopy={() => data.onCopy?.(id)}
>
  {/* Existing node content */}
</NodeContextMenu>
```

---

### 4. Copy/Paste with Smart Positioning (1 day)

**Goal**: Copy nodes and paste them with 50px offset, maintaining connections.

**Features**:

- Ctrl+C to copy selected nodes
- Ctrl+V to paste nodes at 50px offset from originals
- Maintain edges between pasted nodes
- Generate new IDs for pasted nodes

**Implementation**:

**File**: `next-app/src/lib/hooks/use-clipboard.ts` (NEW)

```typescript
import { useState } from 'react'
import { Node, Edge } from '@xyflow/react'
import { MindMapNode } from '@/lib/types/mind-map'

interface ClipboardData {
  nodes: MindMapNode[]
  edges: Edge[]
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)

  const copy = (selectedNodes: MindMapNode[], allEdges: Edge[]) => {
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id))

    // Only include edges where both source and target are selected
    const connectedEdges = allEdges.filter(
      edge => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    )

    setClipboard({
      nodes: selectedNodes,
      edges: connectedEdges,
    })
  }

  const paste = (
    mindMapId: string,
    teamId: string,
    createNode: (node: Partial<MindMapNode>) => Promise<{ node: MindMapNode }>,
    createEdge: (edge: { source_node_id: string; target_node_id: string }) => Promise<void>
  ) => {
    if (!clipboard) return

    const timestamp = Date.now()
    const idMap = new Map<string, string>() // Old ID → New ID

    // Create nodes with 50px offset
    clipboard.nodes.forEach(async (node, index) => {
      const newId = `${timestamp}-${index}`
      idMap.set(node.id, newId)

      await createNode({
        mind_map_id: mindMapId,
        team_id: teamId,
        node_type: node.node_type,
        title: `${node.title} (Copy)`,
        description: node.description,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: node.data,
        style: node.style,
      })
    })

    // Create edges with new IDs
    setTimeout(() => {
      clipboard.edges.forEach(async (edge) => {
        const newSourceId = idMap.get(edge.source)
        const newTargetId = idMap.get(edge.target)

        if (newSourceId && newTargetId) {
          await createEdge({
            source_node_id: newSourceId,
            target_node_id: newTargetId,
          })
        }
      })
    }, 500) // Wait for nodes to be created
  }

  return {
    copy,
    paste,
    hasClipboard: !!clipboard,
  }
}
```

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { useClipboard } from '@/lib/hooks/use-clipboard'

const { copy, paste, hasClipboard } = useClipboard()

// Add to keyboard shortcuts:
{
  key: 'c',
  ctrl: true,
  action: () => {
    const selectedNodes = nodes.filter(n => n.selected)
    copy(selectedNodes, edges)
  },
  description: 'Copy',
  category: 'editing'
},
{
  key: 'v',
  ctrl: true,
  action: () => paste(mindMapId, teamId, createNode, createEdge),
  description: 'Paste',
  category: 'editing'
},
```

---

### 5. Lasso Selection Tool (0.5 days)

**Goal**: Drag to select multiple nodes at once.

**Implementation**: ReactFlow already supports this with `selectionMode` prop.

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { SelectionMode } from '@xyflow/react'

<ReactFlow
  nodes={nodes}
  edges={edges}
  // ... other props
  selectionMode={SelectionMode.Partial} // Enable lasso selection
  selectionKeyCode={null} // No modifier key required
  multiSelectionKeyCode="Shift" // Hold Shift for multi-select
  panOnDrag={[1, 2]} // Pan with middle or right mouse button
/>
```

**User Experience**:

- Click and drag to draw selection area
- All nodes partially/fully inside area are selected
- Hold Shift to add/remove from selection

---

### 6. Improved Undo/Redo with @xyflow/history (1 day)

**Goal**: Track canvas changes and allow undo/redo with Ctrl+Z/Y.

**Dependencies**: Install @xyflow/history

```bash
npm install @xyflow/history
```

**Implementation**:

**File**: `next-app/src/lib/hooks/use-mind-map-history.ts` (NEW)

```typescript
import { useUndoRedo } from '@xyflow/history'

export function useMindMapHistory() {
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo({
    maxHistorySize: 50,
    debounce: 500, // Auto-snapshot after 500ms of inactivity
  })

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    takeSnapshot,
  }
}
```

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { useMindMapHistory } from '@/lib/hooks/use-mind-map-history'

const { undo, redo, canUndo, canRedo } = useMindMapHistory()

// Add to keyboard shortcuts:
{
  key: 'z',
  ctrl: true,
  action: undo,
  description: 'Undo',
  category: 'undo'
},
{
  key: 'y',
  ctrl: true,
  action: redo,
  description: 'Redo',
  category: 'undo'
},
```

**Update**: `next-app/src/components/mind-map/mind-map-toolbar.tsx`

```typescript
import { Undo, Redo } from 'lucide-react'

// Add undo/redo buttons:
<Button
  variant="outline"
  size="sm"
  onClick={undo}
  disabled={!canUndo}
>
  <Undo className="h-4 w-4" />
</Button>
<Button
  variant="outline"
  size="sm"
  onClick={redo}
  disabled={!canRedo}
>
  <Redo className="h-4 w-4" />
</Button>
```

---

### 7. Grid Snapping Toggle (0.5 days)

**Goal**: Enable/disable snapping nodes to grid for precise alignment.

**Features**:

- Toggle grid snapping with Ctrl+G
- 20px snap distance
- Visual grid overlay when enabled

**Implementation**:

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
const [snapToGrid, setSnapToGrid] = useState(false)

<ReactFlow
  nodes={nodes}
  edges={edges}
  // ... other props
  snapToGrid={snapToGrid}
  snapGrid={[20, 20]}
>
  {snapToGrid && <Background gap={20} size={1} color="#e0e0e0" />}
</ReactFlow>

// Add to keyboard shortcuts:
{
  key: 'g',
  ctrl: true,
  action: () => setSnapToGrid(!snapToGrid),
  description: 'Toggle grid snapping',
  category: 'view'
},
```

**Update**: `next-app/src/components/mind-map/mind-map-toolbar.tsx`

```typescript
import { Grid } from 'lucide-react'

<Button
  variant={snapToGrid ? 'default' : 'outline'}
  size="sm"
  onClick={() => setSnapToGrid(!snapToGrid)}
>
  <Grid className="h-4 w-4 mr-2" />
  {snapToGrid ? 'Grid On' : 'Grid Off'}
</Button>
```

---

## Phase 2: Power User Features (19 days)

Features for advanced users and larger teams.

### 8. Export to SVG (1 day)

**Goal**: Export canvas as vector SVG (scalable, smaller file size).

**Dependencies**: Install html-to-image

```bash
npm install html-to-image
```

**Implementation**:

**File**: `next-app/src/lib/utils/export-canvas.ts` (NEW)

```typescript
import { toPng, toSvg } from 'html-to-image'

export async function exportCanvasToPNG(
  element: HTMLElement,
  filename: string
) {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Export to PNG failed:', error)
    throw error
  }
}

export async function exportCanvasToSVG(
  element: HTMLElement,
  filename: string
) {
  try {
    const dataUrl = await toSvg(element, {
      backgroundColor: '#ffffff',
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Export to SVG failed:', error)
    throw error
  }
}
```

**Update**: `next-app/src/components/mind-map/mind-map-toolbar.tsx`

```typescript
import { exportCanvasToPNG, exportCanvasToSVG } from '@/lib/utils/export-canvas'
import { FileImage, FileType } from 'lucide-react'

// Replace existing export button with dropdown menu:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => exportCanvasToPNG(canvasRef.current, 'mindmap.png')}>
      <FileImage className="h-4 w-4 mr-2" />
      Export as PNG
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportCanvasToSVG(canvasRef.current, 'mindmap.svg')}>
      <FileType className="h-4 w-4 mr-2" />
      Export as SVG
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 9. Alignment Tools (2 days)

**Goal**: Align selected nodes (left, center, right, top, middle, bottom) and distribute evenly.

**Features**:

- Align left/center/right
- Align top/middle/bottom
- Distribute horizontally/vertically
- Show toolbar when 2+ nodes selected

**Implementation**:

**File**: `next-app/src/lib/utils/node-alignment.ts` (NEW)

```typescript
import { Node } from '@xyflow/react'

export function alignNodes(
  nodes: Node[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Node[] {
  if (nodes.length < 2) return nodes

  const positions = nodes.map(n => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    width: n.width || 150,
    height: n.height || 80,
  }))

  let referenceValue: number

  switch (alignment) {
    case 'left':
      referenceValue = Math.min(...positions.map(p => p.x))
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, x: referenceValue },
      }))

    case 'center':
      referenceValue = positions.reduce((sum, p) => sum + p.x + p.width / 2, 0) / positions.length
      return nodes.map(n => {
        const nodeWidth = n.width || 150
        return {
          ...n,
          position: { ...n.position, x: referenceValue - nodeWidth / 2 },
        }
      })

    case 'right':
      referenceValue = Math.max(...positions.map(p => p.x + p.width))
      return nodes.map(n => {
        const nodeWidth = n.width || 150
        return {
          ...n,
          position: { ...n.position, x: referenceValue - nodeWidth },
        }
      })

    case 'top':
      referenceValue = Math.min(...positions.map(p => p.y))
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, y: referenceValue },
      }))

    case 'middle':
      referenceValue = positions.reduce((sum, p) => sum + p.y + p.height / 2, 0) / positions.length
      return nodes.map(n => {
        const nodeHeight = n.height || 80
        return {
          ...n,
          position: { ...n.position, y: referenceValue - nodeHeight / 2 },
        }
      })

    case 'bottom':
      referenceValue = Math.max(...positions.map(p => p.y + p.height))
      return nodes.map(n => {
        const nodeHeight = n.height || 80
        return {
          ...n,
          position: { ...n.position, y: referenceValue - nodeHeight },
        }
      })

    default:
      return nodes
  }
}

export function distributeNodes(
  nodes: Node[],
  direction: 'horizontal' | 'vertical'
): Node[] {
  if (nodes.length < 3) return nodes

  const sorted = [...nodes].sort((a, b) => {
    if (direction === 'horizontal') {
      return a.position.x - b.position.x
    }
    return a.position.y - b.position.y
  })

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  if (direction === 'horizontal') {
    const totalSpace = last.position.x - first.position.x
    const spacing = totalSpace / (sorted.length - 1)

    return sorted.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        x: first.position.x + spacing * index,
      },
    }))
  } else {
    const totalSpace = last.position.y - first.position.y
    const spacing = totalSpace / (sorted.length - 1)

    return sorted.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        y: first.position.y + spacing * index,
      },
    }))
  }
}
```

**File**: `next-app/src/components/mind-map/alignment-toolbar.tsx` (NEW)

```typescript
import { Button } from '@/components/ui/button'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  SeparatorHorizontal,
  SeparatorVertical,
} from 'lucide-react'

interface AlignmentToolbarProps {
  selectedCount: number
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (direction: 'horizontal' | 'vertical') => void
}

export function AlignmentToolbar({
  selectedCount,
  onAlign,
  onDistribute,
}: AlignmentToolbarProps) {
  if (selectedCount < 2) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg p-2 flex gap-2 z-10">
      <div className="flex gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('top')}
          title="Align Top"
        >
          <AlignVerticalJustifyStart className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('middle')}
          title="Align Middle"
        >
          <AlignVerticalJustifyCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAlign('bottom')}
          title="Align Bottom"
        >
          <AlignVerticalJustifyEnd className="h-4 w-4" />
        </Button>
      </div>
      {selectedCount >= 3 && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDistribute('horizontal')}
            title="Distribute Horizontally"
          >
            <SeparatorHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDistribute('vertical')}
            title="Distribute Vertically"
          >
            <SeparatorVertical className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

### 10. Enhanced Minimap Customization (1 day)

**Goal**: Improve minimap with customizable node colors and toggle visibility.

**Implementation**:

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { MiniMap } from '@xyflow/react'

const [showMinimap, setShowMinimap] = useState(true)

const nodeColor = (node: Node) => {
  switch (node.data.node_type) {
    case 'idea': return '#3b82f6'
    case 'problem': return '#ef4444'
    case 'solution': return '#10b981'
    case 'feature': return '#f59e0b'
    case 'question': return '#8b5cf6'
    default: return '#6b7280'
  }
}

<ReactFlow>
  {showMinimap && (
    <MiniMap
      nodeColor={nodeColor}
      nodeStrokeWidth={3}
      nodeBorderRadius={8}
      position="bottom-right"
      style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
      }}
    />
  )}
</ReactFlow>

// Add to toolbar:
<Button
  variant={showMinimap ? 'default' : 'outline'}
  size="sm"
  onClick={() => setShowMinimap(!showMinimap)}
>
  <Map className="h-4 w-4 mr-2" />
  Minimap
</Button>
```

---

### 11. Search & Filter Nodes (2 days)

**Goal**: Search nodes by title/description, filter by node type.

**Implementation**:

**File**: `next-app/src/components/mind-map/node-search.tsx` (NEW)

```typescript
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { NodeType } from '@/lib/types/mind-map'

interface NodeSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTypes: NodeType[]
  onTypeToggle: (type: NodeType) => void
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  idea: '💡 Ideas',
  problem: '❌ Problems',
  solution: '✅ Solutions',
  feature: '⭐ Features',
  question: '❓ Questions',
}

export function NodeSearch({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypeToggle,
}: NodeSearchProps) {
  return (
    <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4 w-80 z-10">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
          <Badge
            key={type}
            variant={selectedTypes.includes(type as NodeType) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onTypeToggle(type as NodeType)}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```typescript
import { NodeSearch } from './node-search'

const [searchQuery, setSearchQuery] = useState('')
const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([])

// Filter nodes based on search and type filters
const filteredNodes = useMemo(() => {
  return nodes.filter(node => {
    const matchesSearch = searchQuery === '' ||
      node.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedTypes.length === 0 ||
      selectedTypes.includes(node.data.node_type)

    return matchesSearch && matchesType
  })
}, [nodes, searchQuery, selectedTypes])

// Highlight matching nodes
const highlightedNodes = filteredNodes.map(node => ({
  ...node,
  style: {
    ...node.style,
    opacity: searchQuery || selectedTypes.length > 0 ? 1 : 0.3,
  },
}))

<ReactFlow nodes={highlightedNodes} edges={edges}>
  <NodeSearch
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    selectedTypes={selectedTypes}
    onTypeToggle={(type) => {
      setSelectedTypes(prev =>
        prev.includes(type)
          ? prev.filter(t => t !== type)
          : [...prev, type]
      )
    }}
  />
</ReactFlow>
```

---

### 12. Auto-Layout Algorithm with elkjs (5 days)

**Goal**: Automatically organize nodes with hierarchical layout algorithms.

**Dependencies**: Install elkjs

```bash
npm install elkjs
```

**Algorithms to Support**:

1. **Hierarchical** (top-to-bottom, left-to-right)
2. **Force-Directed** (organic, balanced)
3. **Radial** (circular, hub-and-spoke)
4. **Tree** (parent-child relationships)

**Implementation**: (Complex - detailed spec available on request)

---

### 13. Viewport Following (Pro Tier) (3 days)

**Goal**: Follow other users' viewports in real-time collaboration.

**Features**:

- Show colored rectangles for each user's viewport
- Click to jump to user's view
- Show user avatar and name

**Database Schema**:

```sql
CREATE TABLE mind_map_viewports (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewport JSONB NOT NULL, -- { x, y, zoom }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**: (Requires Supabase Realtime subscriptions)

---

### 14. Live Cursors (Pro Tier) (5 days)

**Goal**: Show other users' cursors in real-time.

**Features**:

- Colored cursor with user name
- Smooth interpolation
- Fade out after inactivity

**Database Schema**:

```sql
CREATE TABLE mind_map_cursors (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position JSONB NOT NULL, -- { x, y }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**: (Requires Supabase Realtime and WebSocket optimization)

---

## Phase 3: Advanced Features (45 days)

Premium features for enterprise and power users.

### 15. Edge Labels & Relationship Types (3 days)

**Goal**: Label connections between nodes with relationship types.

**Relationship Types**:

- **depends-on** (requires completion)
- **relates-to** (related but independent)
- **causes** (causal relationship)
- **supports** (evidence/reasoning)
- **custom** (user-defined label)

**Implementation**:

**Update Database Schema**:

```sql
ALTER TABLE mind_map_edges ADD COLUMN label TEXT;
ALTER TABLE mind_map_edges ADD COLUMN edge_type TEXT DEFAULT 'relates-to';
```

**Update**: `next-app/src/components/mind-map/mind-map-canvas.tsx`

```tsx
import { EdgeLabelRenderer } from '@xyflow/react'

const edgeTypes = {
  labeled: (props: EdgeProps) => (
    <>
      <BaseEdge {...props} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${props.labelX}px, ${props.labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white px-2 py-1 border rounded text-xs"
        >
          {props.data?.label || 'relates-to'}
        </div>
      </EdgeLabelRenderer>
    </>
  ),
}

<ReactFlow
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
/>
```

---

### 16. Presentation Mode (3 days)

**Goal**: Full-screen mode with focus on one node at a time, navigation controls.

**Features**:

- Enter presentation mode (fullscreen)
- Navigate between nodes (Next/Previous)
- Zoom focus on current node
- ESC to exit

**Implementation**: (Detailed spec available on request)

---

### 17. Version History & Snapshots (7 days)

**Goal**: Save canvas snapshots, restore previous versions, compare changes.

**Database Schema**:

```sql
CREATE TABLE mind_map_snapshots (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**: (Complex - requires diff visualization)

---

### 18. Node Templates (4 days)

**Goal**: Save custom node configurations as reusable templates.

**Templates to Include**:

- User Story template (As a [role], I want [feature], so that [benefit])
- SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
- Design Sprint (Understand, Diverge, Decide, Prototype, Test)
- Technical Specification (Requirements, Architecture, Implementation, Testing)

**Implementation**: (Similar to existing canvas templates)

---

### 19. Comments & Annotations (5 days)

**Goal**: Add comments to nodes, threaded discussions, @ mentions.

**Database Schema**:

```sql
CREATE TABLE mind_map_comments (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES mind_map_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**: (Requires real-time subscriptions for live updates)

---

### 20. Touch Gestures for Mobile (5 days)

**Goal**: Pinch to zoom, two-finger pan, long-press context menu.

**Implementation**: Use React's touch event handlers

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    // Store initial pinch distance
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    setInitialPinchDistance(distance)
  }
}

const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    // Calculate zoom based on pinch distance
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    const scale = distance / initialPinchDistance
    zoomTo(currentZoom * scale)
  }
}
```

---

### 21. Node Resize Handles (3 days)

**Goal**: Click and drag to resize nodes.

**Implementation**: ReactFlow supports this with `NodeResizer` component

```typescript
import { NodeResizer } from '@xyflow/react'

<NodeResizer
  minWidth={150}
  minHeight={80}
  maxWidth={600}
  maxHeight={400}
  isVisible={selected}
  color="#3b82f6"
/>
```

---

### 22. Zoom Presets & Named Views (3 days)

**Goal**: Save custom zoom levels and viewport positions.

**Presets**:

- Overview (zoom out to see all)
- Focus (zoom to selected node)
- Custom (save current view)

**Database Schema**:

```sql
CREATE TABLE mind_map_views (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  viewport JSONB NOT NULL, -- { x, y, zoom }
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 23. Export to Markdown (3 days)

**Goal**: Convert mind map to structured Markdown document.

**Output Format**:

```markdown
# Mind Map: Product Roadmap

## Ideas 💡
- New onboarding flow
- Mobile app version

## Problems ❌
- High churn rate
  - Solution: Improve retention features

## Features ⭐
- User authentication (MVP)
- Dashboard analytics (SHORT)
- AI assistant (LONG)
```

**Implementation**:

```typescript
function exportToMarkdown(nodes: MindMapNode[], edges: MindMapEdge[]): string {
  const grouped = groupNodesByType(nodes)

  let markdown = `# Mind Map: ${mindMap.name}\n\n`

  Object.entries(grouped).forEach(([type, typeNodes]) => {
    markdown += `## ${getTypeLabel(type)}\n`
    typeNodes.forEach(node => {
      markdown += `- ${node.title}\n`
      if (node.description) {
        markdown += `  ${node.description}\n`
      }

      // Find connected nodes
      const connections = edges.filter(e => e.source_node_id === node.id)
      connections.forEach(conn => {
        const target = nodes.find(n => n.id === conn.target_node_id)
        if (target) {
          markdown += `  - ${target.title}\n`
        }
      })
    })
    markdown += '\n'
  })

  return markdown
}
```

---

## Implementation Timeline

### Total Effort: ~70 days

| Phase | Duration | Features | Priority |
|-------|----------|----------|----------|
| **Phase 1** | 6 days | 7 quick wins | **Implement after other modules** |
| **Phase 2** | 19 days | 6 power user | Optional (based on user feedback) |
| **Phase 3** | 45 days | 10 advanced | Pro tier only |

---

## Dependencies

### NPM Packages to Install

```bash
# Phase 1
npm install @xyflow/history html-to-image

# Phase 2
npm install elkjs

# shadcn/ui components
npx shadcn-ui@latest add context-menu
npx shadcn-ui@latest add dropdown-menu
```

---

## Pro Tier Features

These features require Pro subscription:

1. **Live Cursors** (Phase 2) - Real-time cursor positions
2. **Viewport Following** (Phase 2) - Follow other users' views
3. **Version History** (Phase 3) - Canvas snapshots
4. **Comments & Annotations** (Phase 3) - Threaded discussions
5. **Custom Node Templates** (Phase 3) - Save reusable templates

---

## Testing Strategy

### Unit Tests (Jest)

- `use-keyboard-shortcuts.ts` - Test shortcut matching
- `use-clipboard.ts` - Test copy/paste with ID mapping
- `node-alignment.ts` - Test alignment calculations
- `export-canvas.ts` - Test export functions

### E2E Tests (Playwright)

- Test keyboard shortcuts (press 1-5 to add nodes)
- Test context menu (right-click → Edit/Duplicate/Delete)
- Test copy/paste (Ctrl+C/V)
- Test lasso selection (drag to select)
- Test undo/redo (Ctrl+Z/Y)
- Test grid snapping (Ctrl+G toggle)
- Test export (PNG/SVG download)

---

## Migration Notes

All features are **additive** - no breaking changes to existing mind map functionality.

### Database Migrations Required

1. **Edge Labels** (Phase 3, Feature #15):

```sql
-- Add label and edge_type columns
ALTER TABLE mind_map_edges ADD COLUMN label TEXT;
ALTER TABLE mind_map_edges ADD COLUMN edge_type TEXT DEFAULT 'relates-to';
```

1. **Snapshots** (Phase 3, Feature #17):

```sql
-- Create snapshots table
CREATE TABLE mind_map_snapshots (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

1. **Comments** (Phase 3, Feature #19):

```sql
-- Create comments table
CREATE TABLE mind_map_comments (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES mind_map_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

1. **Saved Views** (Phase 3, Feature #22):

```sql
-- Create views table
CREATE TABLE mind_map_views (
  id TEXT PRIMARY KEY,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  viewport JSONB NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Performance Considerations

### Large Canvas Optimization

- Virtualize nodes (only render visible nodes)
- Debounce auto-save to 2 seconds
- Lazy load node images
- Use React.memo for node components

### Real-time Collaboration Optimization

- Throttle cursor position updates to 50ms
- Batch viewport updates
- Use Supabase Realtime filters for team_id

### Export Optimization

- Use Web Workers for large canvas exports
- Compress SVG output
- Limit export resolution to 4K max

---

## User Feedback Collection

After Phase 1 implementation, collect user feedback on:

1. Most-used keyboard shortcuts
2. Desired auto-layout algorithms
3. Export format preferences
4. Feature requests for Phase 2

Use this data to prioritize Phase 2 and Phase 3 features.

---

## Next Steps

1. **Complete pending modules first**:
   - Dependencies (Week 4)
   - Review (Week 5)
   - Execution (Week 6)
   - Timeline (Week 6)
   - Collaboration (Week 6)
   - Research (Week 7)
   - Analytics (Week 7)
   - AI Assistant (Week 7)

2. **Return to mind map enhancements**:
   - Implement Phase 1 (6 days)
   - Gather user feedback
   - Prioritize Phase 2 features
   - Consider Pro tier for Phase 3

---

## Related Documents

- [Implementation Plan](../implementation/README.md) - Overall project roadmap
- [Recommended Agents](../planning/RECOMMENDED_AGENTS.md) - Claude agents for each phase
- [Project Guidelines](../../CLAUDE.md) - Project guidelines and standards

---

**Document Status**: Ready for implementation after other modules are complete
**Last Review**: 2025-01-13
**Next Review**: After completing Dependencies module
