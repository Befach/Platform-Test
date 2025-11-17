# Phase Permissions - Quick Reference

## Core Concept
Users can **VIEW all** work items, but only **EDIT work items** in assigned phases (unless they're owner/admin).

## Files & Locations

```
src/lib/types/team.ts                    - Type definitions
src/lib/utils/phase-permissions.ts       - Utility functions
src/lib/hooks/use-phase-permissions.ts   - React hooks
src/lib/constants/workspace-phases.ts    - Phase config & constants
```

## Quick Usage

### 1. Client Component - Check Permission

```tsx
import { usePhasePermissions } from '@/lib/hooks/use-phase-permissions'
import { calculateWorkItemPhase } from '@/lib/constants/workspace-phases'

const { canEdit, loading } = usePhasePermissions({ workspaceId, teamId })
const phase = calculateWorkItemPhase(workItem)

if (canEdit(phase)) {
  return <EditButton />
}
```

### 2. Server Route - Enforce Permission

```tsx
import { canUserEditPhase } from '@/lib/utils/phase-permissions'

const phase = calculateWorkItemPhase(workItem)
const allowed = await canUserEditPhase(userId, workspaceId, teamId, phase)

if (!allowed) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 3. Admin Check

```tsx
import { useIsAdmin } from '@/lib/hooks/use-phase-permissions'

const { isAdmin } = useIsAdmin({ teamId })

if (isAdmin) {
  return <AdminPanel />
}
```

## Available Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `usePhasePermissions()` | Get all permissions | `{ permissions, canEdit(), canView(), loading, error, refetch() }` |
| `useIsAdmin()` | Check admin status | `{ isAdmin, loading, error }` |
| `usePhaseAssignments()` | Get raw assignments | `{ assignments, loading, error }` |

## Available Utils

| Function | Purpose | Use Case |
|----------|---------|----------|
| `getUserPhasePermissions()` | Get full permission map | Server-side permission loading |
| `canUserEditPhase()` | Check single phase | Quick permission check |
| `isUserAdminOrOwner()` | Check admin status | Server-side role check |
| `filterWorkItemsByPhase()` | Filter items by permission | UI filtering |
| `getPhasePermissionBadge()` | Get UI badge config | Display permission badges |
| `validatePhaseAssignment()` | Validate assignment data | Before creating assignment |

## Types

```typescript
// Main types
WorkspacePhase = 'research' | 'planning' | 'execution' | 'review' | 'complete'
TeamRole = 'owner' | 'admin' | 'member'

// Permission object
PhasePermission = {
  can_view: boolean    // Always true for team members
  can_edit: boolean    // True if assigned or admin
  can_delete: boolean  // Same as can_edit
}

// Permission map (all 5 phases)
UserPhasePermissions = Record<WorkspacePhase, PhasePermission>
```

## Permission Rules

| Role | View | Edit | Delete |
|------|------|------|--------|
| **Owner** | All phases | All phases | All phases |
| **Admin** | All phases | All phases | All phases |
| **Member** | All phases | Assigned only | Assigned only |

## Common Patterns

### Pattern 1: Conditional Rendering

```tsx
const { canEdit } = usePhasePermissions({ workspaceId, teamId })
const phase = calculateWorkItemPhase(item)

return (
  <>
    {canEdit(phase) && <EditButton />}
    {!canEdit(phase) && <ViewOnlyBadge />}
  </>
)
```

### Pattern 2: Filter List

```tsx
const { permissions } = usePhasePermissions({ workspaceId, teamId })

const editableItems = filterWorkItemsByPhase(
  workItems,
  calculateWorkItemPhase,
  permissions,
  'edit'
)
```

### Pattern 3: API Protection

```tsx
const phase = calculateWorkItemPhase(workItem)
const canEdit = await canUserEditPhase(userId, workspaceId, teamId, phase)

if (!canEdit) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Pattern 4: Permission Summary

```tsx
const permissions = await getUserPhasePermissions(userId, workspaceId, teamId)
const summary = getPhaseAccessSummary(permissions)

console.log(`User can edit ${summary.editable_phases} phases`)
console.log(`Editable: ${summary.editable_phase_names.join(', ')}`)
```

## Error Handling

```tsx
const { permissions, error, loading } = usePhasePermissions({ workspaceId, teamId })

if (loading) return <Skeleton />
if (error) return <ErrorMessage error={error} />
if (!permissions) return <NoAccess />

// Use permissions...
```

## Database Schema

```sql
-- user_phase_assignments table
CREATE TABLE user_phase_assignments (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  phase TEXT NOT NULL, -- 'research' | 'planning' | 'execution' | 'review' | 'complete'
  can_edit BOOLEAN NOT NULL DEFAULT true,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(workspace_id, user_id, phase)
);
```

## Constants

```typescript
// From workspace-phases.ts
PHASE_ORDER = ['research', 'planning', 'execution', 'review', 'complete']

PHASE_PERMISSIONS = {
  DEFAULT_VIEW: true,
  DEFAULT_EDIT: false,
  DEFAULT_DELETE: false
}
```

## Testing Checklist

- [ ] Non-admin member cannot edit unassigned phases
- [ ] Non-admin member can edit assigned phases
- [ ] Admin can edit all phases
- [ ] Owner can edit all phases
- [ ] All members can view all items
- [ ] RLS policies enforce permissions
- [ ] API routes check permissions
- [ ] UI shows/hides based on permissions

## Common Errors

**Error**: "Module declares WorkspacePhase locally but not exported"
**Fix**: Import from `@/lib/types/team` which re-exports it

**Error**: "Cannot index UserPhasePermissions with WorkspacePhase"
**Fix**: Ensure WorkspacePhase type is properly imported

**Error**: "Permission denied"
**Fix**: Check if user has phase assignment with `can_edit: true`

## Quick Commands

```bash
# Check types compile
npx tsc --noEmit

# Run tests
npm run test

# View schema
npx supabase db diff
```

## Resources

- [Full Usage Guide](./README.md)
- [Type Definitions](./team.ts)
- [Utility Functions](../utils/phase-permissions.ts)
- [React Hooks](../hooks/use-phase-permissions.ts)
- [Phase Config](../constants/workspace-phases.ts)

---

**Remember**: Always enforce permissions on **both frontend (UX) and backend (security)**!
