'use client'

import { useEffect } from 'react'

/**
 * React Grab - DEV ONLY - 66% faster UI changes for Claude Code
 * Provides exact file paths + line numbers when clicking elements
 *
 * react-grab auto-initializes when imported on the client side.
 * It doesn't export a component - just importing it sets up the global API.
 */
export function ReactGrabWrapper() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Dynamic import triggers react-grab auto-initialization
      import('react-grab').catch((err) => {
        console.warn('Failed to load react-grab:', err)
      })
    }
  }, [])

  return null
}
