'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'

export default function MemberCheckPage() {
  const [email, setEmail] = useState('nitin@befach.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkMemberStatus = async () => {
    if (!email) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/debug/member-status?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check member status')
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to check member status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Member Status Checker</CardTitle>
          <CardDescription>
            Debug tool to check the status of a team member by email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={checkMemberStatus} disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2">Search Details</h3>
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>Team ID:</strong> {result.teamId}</p>
                <p><strong>Your Role:</strong> {result.currentUserRole}</p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Invitations ({result.invitations?.length || 0})
                </h3>
                {result.invitations && result.invitations.length > 0 ? (
                  <div className="space-y-2">
                    {result.invitations.map((inv: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded border">
                        <p><strong>Status:</strong> {inv.accepted_at ? 'Accepted' : 'Pending'}</p>
                        <p><strong>Role:</strong> {inv.role}</p>
                        <p><strong>Created:</strong> {new Date(inv.created_at).toLocaleString()}</p>
                        {inv.accepted_at && (
                          <p><strong>Accepted:</strong> {new Date(inv.accepted_at).toLocaleString()}</p>
                        )}
                        <p><strong>Expires:</strong> {new Date(inv.expires_at).toLocaleString()}</p>
                        <p className={inv.expires_at > new Date().toISOString() ? 'text-green-600' : 'text-red-600'}>
                          {inv.expires_at > new Date().toISOString() ? '✓ Valid' : '✗ Expired'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No invitations found</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">
                  User Account ({result.existingUsers?.length || 0})
                </h3>
                {result.existingUsers && result.existingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {result.existingUsers.map((user: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded border">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No user account found</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">Team Member Status</h3>
                {result.memberWithEmail ? (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-green-800 font-semibold mb-2">✓ Member Found in Team</p>
                    <p><strong>Member ID:</strong> {result.memberWithEmail.id}</p>
                    <p><strong>User ID:</strong> {result.memberWithEmail.user_id}</p>
                    <p><strong>Role:</strong> {result.memberWithEmail.role}</p>
                    <p><strong>Joined:</strong> {new Date(result.memberWithEmail.joined_at).toLocaleString()}</p>
                    {result.memberWithEmail.users && (
                      <>
                        <p><strong>Name:</strong> {result.memberWithEmail.users.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {result.memberWithEmail.users.email}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-yellow-800 font-semibold">⚠ Member NOT found in team</p>
                    <p className="text-sm mt-2">This user is not listed as a team member.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">
                  All Team Members ({result.teamMembers?.length || 0})
                </h3>
                {result.teamMembers && result.teamMembers.length > 0 ? (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {result.teamMembers.map((member: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded border text-sm">
                        <p>
                          <strong>{member.users?.email || 'Unknown'}</strong> ({member.role})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team members found</p>
                )}
              </div>

              {result.errors && Object.values(result.errors).some(e => e) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-red-800">Database Errors</h3>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(result.errors, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
