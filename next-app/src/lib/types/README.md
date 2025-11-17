# Phase Permission System - Usage Guide

This directory contains comprehensive TypeScript type definitions and utilities for the phase-based permission system.

## Files Overview

### 1. `team.ts` - Type Definitions
Core types for teams, members, roles, and permissions.

**Key Exports:**
- `WorkspacePhase` - Phase type ('research' | 'planning' | 'execution' | 'review' | 'complete')
- `TeamRole` - User role type ('owner' | 'admin' | 'member')
- `UserPhaseAssignment` - Database record for phase assignment
- `TeamMember` - Team member with user data
- `TeamMemberWithPhases` - Team member with phase assignments
- `PhasePermission` - Permission object (can_view, can_edit, can_delete)
- `UserPhasePermissions` - Map of all phases to permissions
- `InvitationWithPhases` - Invitation with phase access
- `PhasePermissionBadge` - UI badge configuration

### 2. `../utils/phase-permissions.ts` - Utility Functions
Server and client-side functions for permission checking.

**Key Functions:**
- `getUserPhaseAssignments(userId, workspaceId)` - Get user's phase assignments
- `getUserPhasePermissions(userId, workspaceId, teamId)` - Get full permission map
- `canUserEditPhase(userId, workspaceId, teamId, phase)` - Check single phase
- `isUserAdminOrOwner(userId, teamId)` - Check admin status
- `filterWorkItemsByPhase(items, calculatePhase, permissions, filterType)` - Filter items
- `getPhasePermissionBadge(phase, permission)` - Get UI badge
- `canUserPerformAction(userId, workspaceId, teamId, itemPhase, action)` - Check action
- `getPhaseAccessSummary(permissions)` - Get summary
- `validatePhaseAssignment(assignment)` - Validate assignment data

### 3. `../hooks/use-phase-permissions.ts` - React Hooks
Client-side React hooks for permission management.

**Key Hooks:**
- `usePhasePermissions({ workspaceId, teamId })` - Main hook for permissions
- `useIsAdmin({ teamId })` - Check admin status
- `usePhaseAssignments({ workspaceId })` - Get raw assignments

### 4. `../constants/workspace-phases.ts` - Phase Configuration
Phase definitions, colors, and calculation logic.

**Key Exports:**
- `PHASE_CONFIG` - Phase metadata (colors, icons, descriptions)
- `PHASE_ORDER` - Array of phases in order
- `PHASE_PERMISSIONS` - Default permission constants
- `calculateWorkItemPhase(item)` - Determine item's phase
- `calculatePhaseDistribution(items)` - Get phase stats

## Usage Examples

### Example 1: Check Permissions in Component

```tsx
'use client'

import { usePhasePermissions } from '@/lib/hooks/use-phase-permissions'
import { calculateWorkItemPhase } from '@/lib/constants/workspace-phases'

export function WorkItemCard({ workItem, workspaceId, teamId }) {
  const { permissions, loading, canEdit } = usePhasePermissions({
    workspaceId,
    teamId,
  })

  if (loading) return <Skeleton />

  const phase = calculateWorkItemPhase(workItem)
  const canEditItem = canEdit(phase)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{workItem.name}</CardTitle>
        <Badge>{phase}</Badge>
      </CardHeader>
      <CardContent>
        <p>{workItem.description}</p>
      </CardContent>
      <CardFooter>
        {canEditItem ? (
          <Button onClick={() => handleEdit(workItem)}>Edit</Button>
        ) : (
          <Button variant="ghost" disabled>
            View Only
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

### Example 2: Server-Side Permission Check

```tsx
// app/api/work-items/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { canUserEditPhase } from '@/lib/utils/phase-permissions'
import { calculateWorkItemPhase } from '@/lib/constants/workspace-phases'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get work item
  const { data: workItem } = await supabase
    .from('work_items')
    .select('*, workspace:workspaces(team_id)')
    .eq('id', params.id)
    .single()

  if (!workItem) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Calculate phase and check permission
  const phase = calculateWorkItemPhase(workItem)
  const canEdit = await canUserEditPhase(
    user.id,
    workItem.workspace_id,
    workItem.workspace.team_id,
    phase
  )

  if (!canEdit) {
    return NextResponse.json(
      { error: 'You do not have permission to edit items in this phase' },
      { status: 403 }
    )
  }

  // Proceed with update...
  const updates = await request.json()
  // ...
}
```

### Example 3: Filter Items by Permission

```tsx
'use client'

import { usePhasePermissions } from '@/lib/hooks/use-phase-permissions'
import { filterWorkItemsByPhase, calculateWorkItemPhase } from '@/lib/utils/phase-permissions'

export function WorkItemList({ workItems, workspaceId, teamId }) {
  const { permissions, loading } = usePhasePermissions({ workspaceId, teamId })

  if (loading) return <LoadingState />

  // Show only items user can edit
  const editableItems = filterWorkItemsByPhase(
    workItems,
    calculateWorkItemPhase,
    permissions!,
    'edit' // Filter type
  )

  return (
    <div>
      <h2>Items You Can Edit ({editableItems.length})</h2>
      {editableItems.map(item => (
        <WorkItemCard key={item.id} workItem={item} />
      ))}
    </div>
  )
}
```

### Example 4: Show Permission Badges

```tsx
'use client'

import { usePhasePermissions } from '@/lib/hooks/use-phase-permissions'
import { getPhasePermissionBadge } from '@/lib/utils/phase-permissions'
import { PHASE_ORDER } from '@/lib/constants/workspace-phases'

export function PhasePermissionPanel({ workspaceId, teamId }) {
  const { permissions, loading } = usePhasePermissions({ workspaceId, teamId })

  if (loading) return <Skeleton />

  return (
    <div className="space-y-2">
      <h3>Your Phase Access</h3>
      {PHASE_ORDER.map(phase => {
        const permission = permissions![phase]
        const badge = getPhasePermissionBadge(phase, permission)

        return (
          <div key={phase} className="flex items-center gap-2">
            <span className="capitalize">{phase}</span>
            <Badge className={badge.color}>
              {badge.icon === 'unlock' && '🔓'}
              {badge.icon === 'eye' && '👁️'}
              {badge.icon === 'lock' && '🔒'}
              {badge.label}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
```

### Example 5: Admin Check

```tsx
'use client'

import { useIsAdmin } from '@/lib/hooks/use-phase-permissions'

export function AdminPanel({ teamId }) {
  const { isAdmin, loading } = useIsAdmin({ teamId })

  if (loading) return <Skeleton />
  if (!isAdmin) return <AccessDenied />

  return (
    <div>
      <h2>Admin Settings</h2>
      <ManageTeamMembers teamId={teamId} />
      <ManagePhaseAssignments teamId={teamId} />
    </div>
  )
}
```

### Example 6: Get Permission Summary

```tsx
import { getUserPhasePermissions, getPhaseAccessSummary } from '@/lib/utils/phase-permissions'

export async function generateUserReport(userId: string, workspaceId: string, teamId: string) {
  const permissions = await getUserPhasePermissions(userId, workspaceId, teamId)
  const summary = getPhaseAccessSummary(permissions)

  return {
    total_phases: summary.total_phases,
    editable_phases: summary.editable_phases,
    view_only_phases: summary.view_only_phases,
    can_edit: summary.editable_phase_names, // ['research', 'planning']
    can_view_only: summary.view_only_phase_names, // ['execution', 'review', 'complete']
  }
}
```

### Example 7: Validate Assignment Before Creating

```tsx
import { validatePhaseAssignment } from '@/lib/utils/phase-permissions'

export async function createPhaseAssignment(data: {
  user_id: string
  workspace_id: string
  phase: string
  can_edit: boolean
}) {
  // Validate first
  const validation = validatePhaseAssignment(data)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Proceed with creation
  const supabase = createClient()
  const { data: assignment, error } = await supabase
    .from('user_phase_assignments')
    .insert({
      ...data,
      assigned_by: currentUserId,
      assigned_at: new Date().toISOString(),
    })
    .select()
    .single()

  return assignment
}
```

## Permission Logic Summary

### View Access
- **All team members** can view all work items regardless of phase
- View permission cannot be restricted

### Edit/Delete Access
- **Owners and Admins** can edit/delete any item in any phase
- **Members** can only edit/delete items in phases they're assigned to with `can_edit: true`
- Edit and delete permissions are identical

### RLS Implementation
The database enforces these rules via Row-Level Security:
- `SELECT` policy allows all team members to view
- `UPDATE`/`DELETE` policies check user role OR phase assignment

### Phase Assignment
- Created by admins/owners
- Can be workspace-specific (different assignments per workspace)
- Includes optional notes for context
- Tracks who assigned and when

## Best Practices

1. **Use Hooks in Components**: For reactive permission checking
2. **Use Utils in API Routes**: For server-side permission enforcement
3. **Always Check Permissions**: Before showing edit/delete buttons
4. **Filter on Frontend**: Use `filterWorkItemsByPhase` for better UX
5. **Enforce on Backend**: RLS and API route checks are security critical
6. **Cache Permissions**: Hooks automatically cache, avoid repeated queries
7. **Validate Assignments**: Always use `validatePhaseAssignment` before creating

## Testing

```tsx
// Test permission checking
import { canUserEditPhase } from '@/lib/utils/phase-permissions'

describe('Phase Permissions', () => {
  it('allows admins to edit all phases', async () => {
    const canEdit = await canUserEditPhase(
      'admin_user_id',
      'workspace_123',
      'team_456',
      'execution'
    )
    expect(canEdit).toBe(true)
  })

  it('restricts members to assigned phases', async () => {
    const canEdit = await canUserEditPhase(
      'member_user_id',
      'workspace_123',
      'team_456',
      'execution'
    )
    expect(canEdit).toBe(false) // Not assigned to execution
  })
})
```

## Migration Notes

When migrating existing code:
1. Replace direct role checks with `isUserAdminOrOwner`
2. Add phase permission checks before edit/delete operations
3. Use `getUserPhasePermissions` instead of querying assignments directly
4. Update UI to show permission badges with `getPhasePermissionBadge`
5. Test with non-admin users to ensure restrictions work

## Troubleshooting

**Q: User can't edit even though they should**
- Check if phase assignment exists in `user_phase_assignments` table
- Verify `can_edit: true` on assignment
- Check if user is in correct team
- Verify RLS policies are enabled

**Q: Permissions not updating after assignment change**
- Call `refetch()` from `usePhasePermissions` hook
- Clear React Query cache if needed
- Check browser console for Supabase errors

**Q: How to debug permission issues**
- Use `getPhaseAccessSummary` to see user's full permissions
- Check `getUserPhaseAssignments` to see raw assignment data
- Verify team membership with `isUserAdminOrOwner`
- Check browser network tab for failed permission queries
