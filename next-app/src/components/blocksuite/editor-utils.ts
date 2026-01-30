/**
 * BlockSuite Editor Utilities
 *
 * Shared utilities for BlockSuite editor components.
 * These utilities are extracted to avoid code duplication between
 * blocksuite-editor.tsx and simple-canvas.tsx.
 */

import type { MutableRefObject } from 'react'

/** Editor element type with optional remove method */
export type EditorElement = {
  remove?: () => void
  _checkInterval?: ReturnType<typeof setInterval>
}

/**
 * Safely clears all child nodes from a container element
 * This avoids innerHTML which can be an XSS vector
 */
export function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * Clean up BlockSuite editor from DOM
 *
 * Handles the common cleanup pattern for BlockSuite editors:
 * 1. Tries editor.remove() if available
 * 2. Falls back to removeChild() for manual cleanup
 * 3. Clears the editor and doc refs
 *
 * @param editorRef - Ref to the editor instance
 * @param containerRef - Ref to the container DOM element
 * @param logPrefix - Prefix for console warnings (e.g., '[SimpleCanvas]')
 */
export function cleanupBlockSuiteEditor(
  editorRef: MutableRefObject<unknown>,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  logPrefix = '[BlockSuite]'
): void {
  if (editorRef.current && containerRef.current) {
    try {
      const editor = editorRef.current as EditorElement
      if (typeof editor.remove === 'function') {
        editor.remove()
      } else if (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }
    } catch (e) {
      console.warn(`${logPrefix} Cleanup warning:`, e)
    }
    editorRef.current = null
  }
}

/**
 * Clean up editor interval timer if present
 *
 * @param editorRef - Ref to the editor instance
 */
export function cleanupEditorInterval(
  editorRef: MutableRefObject<unknown>
): void {
  const editor = editorRef.current as EditorElement | null
  if (editor?._checkInterval) {
    clearInterval(editor._checkInterval)
  }
}
