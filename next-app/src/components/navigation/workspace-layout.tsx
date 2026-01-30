'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'
import { AppSidebar } from './app-sidebar'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  workspaceId: string
  workspaceName?: string
  teamId?: string
}

export function WorkspaceLayout({
  children,
  workspaceId,
  workspaceName,
  teamId,
}: WorkspaceLayoutProps) {
  const router = useRouter()

  // Global keyboard shortcuts for navigation
  useHotkeys('g h', () => router.push('/dashboard'), { preventDefault: true })
  useHotkeys('g f', () => router.push(`/workspaces/${workspaceId}/features`), { preventDefault: true })
  useHotkeys('g m', () => router.push(`/workspaces/${workspaceId}/canvas`), { preventDefault: true })
  useHotkeys('g d', () => router.push(`/workspaces/${workspaceId}/dependencies`), { preventDefault: true })
  useHotkeys('g t', () => router.push(`/workspaces/${workspaceId}/timeline`), { preventDefault: true })
  useHotkeys('g r', () => router.push(`/workspaces/${workspaceId}/reviews`), { preventDefault: true })
  useHotkeys('g a', () => router.push(`/workspaces/${workspaceId}/analytics`), { preventDefault: true })

  return (
    <div className="min-h-screen flex">
      <AppSidebar workspaceId={workspaceId} workspaceName={workspaceName} teamId={teamId} />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
