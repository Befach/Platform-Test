'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { AppTopBar } from './app-top-bar'

interface DashboardHeaderProps {
    userEmail?: string
    userName?: string
}

export function DashboardHeader({ userEmail, userName }: DashboardHeaderProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Hide header for Work Board (work-items view) - it has its own header
    const view = searchParams.get('view')
    if (view === 'work-items') {
        return null
    }

    const getSectionName = () => {
        if (pathname.includes('/team/settings')) return 'Team Settings'
        if (pathname.includes('/team/members')) return 'Team Members'

        // Workspace views
        const view = searchParams.get('view')
        if (view) {
            switch (view) {
                case 'dashboard': return 'Dashboard'
                case 'canvas': return 'Canvas'
                case 'work-items': return 'Features'
                case 'timeline': return 'Timeline'
                case 'dependencies': return 'Dependencies'
                case 'analytics': return 'Analytics'
                case 'team': return 'Team'
                default: return 'Dashboard'
            }
        }

        // Workspace sub-pages
        if (pathname.includes('/data-library')) return 'Data Library'
        if (pathname.includes('/reports')) return 'Reports'
        if (pathname.includes('/assistant')) return 'Word Assistant'
        if (pathname.includes('/settings')) return 'Settings'

        return 'Dashboard'
    }

    return (
        <header className="relative z-[70] flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
            <div className="flex flex-1 items-center justify-between">
                <h1 className="text-lg font-semibold">{getSectionName()}</h1>
                <div className="flex items-center gap-2">
                    <AppTopBar
                        sectionName=""
                        userEmail={userEmail}
                        userName={userName}
                    />
                </div>
            </div>
        </header>
    )
}
