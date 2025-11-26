'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, Settings } from 'lucide-react'
import type { TeamRole } from '@/lib/types/team'

interface TeamGeneralSettingsProps {
    team: {
        id: string
        name: string
        created_at: string
    }
    currentUserRole: TeamRole
}

export function TeamGeneralSettings({ team, currentUserRole }: TeamGeneralSettingsProps) {
    const [teamName, setTeamName] = useState(team.name)
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const router = useRouter()
    const supabase = createClient()
    const isOwner = currentUserRole === 'owner'

    const handleSaveTeamName = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!team.id || !isOwner) return

        setLoading(true)
        setSaved(false)

        try {
            const { error } = await supabase
                .from('teams')
                .update({ name: teamName })
                .eq('id', team.id)

            if (error) throw error

            setSaved(true)
            router.refresh()
            setTimeout(() => setSaved(false), 3000)
        } catch (error: any) {
            console.error('Error updating team name:', error)
            alert(error.message || 'Failed to update team name')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTeam = async () => {
        if (!team.id || !isOwner) return

        setLoading(true)

        try {
            const { error } = await supabase.from('teams').delete().eq('id', team.id)

            if (error) throw error

            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            console.error('Error deleting team:', error)
            alert(error.message || 'Failed to delete team')
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        General Information
                    </CardTitle>
                    <CardDescription>Update your organization name and basic settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveTeamName} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="team-name">Organization Name *</Label>
                            <Input
                                id="team-name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                disabled={loading || !isOwner}
                                placeholder="e.g., Acme Inc."
                            />
                            {!isOwner && (
                                <p className="text-xs text-muted-foreground">
                                    Only organization owners can update the name
                                </p>
                            )}
                        </div>

                        {isOwner && (
                            <div className="flex items-center gap-2 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                                {saved && (
                                    <span className="text-sm text-green-600">✓ Saved successfully</span>
                                )}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {isOwner && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible actions that will permanently delete your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showDeleteConfirm ? (
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm mb-1">Delete this organization</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Once you delete an organization, there is no going back. All workspaces,
                                        features, and data will be permanently deleted.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={loading}
                                    className="ml-4"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Organization
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-2">
                                        ⚠️ Confirm Organization Deletion
                                    </h4>
                                    <p className="text-sm text-red-700">
                                        Are you absolutely sure you want to delete <strong>{team.name}</strong>?
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDeleteTeam}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Yes, Delete Permanently
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
