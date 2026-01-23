'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import {
  BlockSuiteEditor,
  BlockSuiteCanvasEditor,
  BlockSuitePageEditor,
  MindMapCanvasWithToolbar,
  DEFAULT_SAMPLE_TREE,
  BlockSuiteMindmapStyle,
  BlockSuiteLayoutType,
  type BlockSuiteMindmapNode
} from '@/components/blocksuite'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * BlockSuite Editor Test Page
 *
 * SECURITY: This page is only accessible in development mode.
 * In production, it returns a 404 to prevent exposure.
 *
 * This page tests the BlockSuite integration to verify:
 * - SSR-safe dynamic imports work correctly
 * - Editor mounts and initializes properly
 * - Both page and edgeless modes function
 * - Change callbacks fire correctly
 *
 * Access at: /test/blocksuite (development only)
 */

/**
 * Security check at build time.
 * In Next.js, process.env.NODE_ENV is replaced at build time by webpack/turbopack.
 * When building for production (NODE_ENV=production), this will be 'false'
 * and the component will return notFound() immediately.
 * This is safe because production builds always set NODE_ENV=production.
 */
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

export default function BlockSuiteTestPage() {
  const [editorReady, setEditorReady] = useState(false)
  const [changeCount, setChangeCount] = useState(0)
  const [currentMode, setCurrentMode] = useState<'page' | 'edgeless'>('edgeless')

  // Block access in production - show 404
  // This check happens before any renders
  if (!IS_DEVELOPMENT) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">BlockSuite Editor Test</h1>
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
            DEV ONLY
          </span>
        </div>
        <p className="text-muted-foreground">
          Testing the BlockSuite React wrapper with SSR-safe dynamic imports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Editor Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${editorReady ? 'text-green-600' : 'text-yellow-600'}`}>
              {editorReady ? 'Ready' : 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Change Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{currentMode}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mindmap" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mindmap">Mind Map (Full)</TabsTrigger>
          <TabsTrigger value="generic">Generic Editor</TabsTrigger>
          <TabsTrigger value="canvas">Canvas Editor</TabsTrigger>
          <TabsTrigger value="page">Page Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="mindmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mind Map with Full Toolbar</CardTitle>
              <CardDescription>
                Complete mind mapping experience with toolbar controls: add/delete nodes, change styles & layouts, zoom, undo/redo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden h-[600px]">
                <MindMapCanvasWithToolbar
                  documentId="test-mindmap"
                  initialTree={DEFAULT_SAMPLE_TREE}
                  style={BlockSuiteMindmapStyle.FOUR}
                  layout={BlockSuiteLayoutType.BALANCE}
                  onTreeChange={(tree: BlockSuiteMindmapNode) => {
                    console.log('Mind map tree changed:', tree)
                  }}
                  onNodeSelect={(nodeId: string, text: string) => {
                    console.log('Node selected:', nodeId, text)
                  }}
                  showToolbar={true}
                  toolbarPosition="top"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generic BlockSuite Editor</CardTitle>
              <CardDescription>
                Configurable mode via props. Currently: {currentMode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={currentMode === 'edgeless' ? 'default' : 'outline'}
                  onClick={() => setCurrentMode('edgeless')}
                >
                  Canvas Mode
                </Button>
                <Button
                  variant={currentMode === 'page' ? 'default' : 'outline'}
                  onClick={() => setCurrentMode('page')}
                >
                  Page Mode
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <BlockSuiteEditor
                  key={currentMode} // Force remount on mode change
                  mode={currentMode}
                  onReady={() => {
                    setEditorReady(true)
                    console.log('BlockSuite editor ready!')
                  }}
                  onChange={() => {
                    setChangeCount((c) => c + 1)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canvas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Canvas Editor (Edgeless Mode)</CardTitle>
              <CardDescription>
                Pre-configured for whiteboard/canvas editing with mind maps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <BlockSuiteCanvasEditor
                  onReady={() => console.log('Canvas editor ready!')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="page" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Editor (Document Mode)</CardTitle>
              <CardDescription>
                Pre-configured for document editing with rich text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <BlockSuitePageEditor
                  onReady={() => console.log('Page editor ready!')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <ul>
            <li>BlockSuite packages v0.19.5 integrated</li>
            <li>SSR-safe via dynamic imports with ssr: false</li>
            <li>Uses Schema + DocCollection API from @blocksuite/store</li>
            <li>Web Components mounted to React refs</li>
            <li>Change events via historyUpdated slot</li>
            <li><strong>Mind Map with Toolbar:</strong> Full interactive experience with add/delete nodes, style changes (Classic/Bubble/Box/Wireframe), layout options (Right/Left/Balanced), zoom controls, and undo/redo</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
