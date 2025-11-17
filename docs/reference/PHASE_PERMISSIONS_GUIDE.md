# Phase-Based Permissions: Developer Guide

**Quick Reference**: How to implement phase-based permissions in the application

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [TypeScript Types](#typescript-types)
3. [Common Queries](#common-queries)
4. [Permission Checking](#permission-checking)
5. [UI Components](#ui-components)
6. [Best Practices](#best-practices)

---

## Quick Start

### Migration Applied ✅
Migration `20250117000001_create_phase_assignments.sql` creates:
- `user_phase_assignments` table
- `calculate_work_item_phase()` function
- Updated RLS policies on `work_items` table

### What Changed?
- **Before**: All team members can create/edit/delete all work items
- **After**: Members need phase assignments to modify work items (owners/admins bypass)
- **Unchanged**: All team members can view all work items

---

## TypeScript Types

### Add to `lib/supabase/types.ts`

```typescript
export type WorkspacePhase =
  | 'research'
  | 'planning'
  | 'execution'
  | 'review'
  | 'complete';

export interface UserPhaseAssignment {
  id: string;
  team_id: string;
  workspace_id: string;
  user_id: string;
  phase: WorkspacePhase;
  can_edit: boolean;
  assigned_by: string;
  assigned_at: string;
  notes?: string;
}

export interface PhasePermissionCheck {
  hasPermission: boolean;
  reason: 'assigned' | 'owner' | 'admin' | 'no_permission';
  assignment?: UserPhaseAssignment;
}
```

---

## Common Queries

### 1. Get User's Phase Assignments for a Workspace

```typescript
import { createClientComponentClient } from '@/lib/supabase/client';

async function getUserPhaseAssignments(
  workspaceId: string,
  userId: string
): Promise<UserPhaseAssignment[]> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}
```

### 2. Get All Users Assigned to a Phase

```typescript
async function getUsersForPhase(
  workspaceId: string,
  phase: WorkspacePhase
): Promise<UserPhaseAssignment[]> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .select(`
      *,
      user:auth.users(id, email)
    `)
    .eq('workspace_id', workspaceId)
    .eq('phase', phase)
    .eq('can_edit', true);

  if (error) throw error;
  return data || [];
}
```

### 3. Assign User to Phase (Admin Only)

```typescript
async function assignUserToPhase(
  teamId: string,
  workspaceId: string,
  userId: string,
  phase: WorkspacePhase,
  assignedBy: string,
  notes?: string
): Promise<UserPhaseAssignment> {
  const supabase = createClientComponentClient();

  const assignment: Partial<UserPhaseAssignment> = {
    id: Date.now().toString(), // Timestamp-based ID
    team_id: teamId,
    workspace_id: workspaceId,
    user_id: userId,
    phase,
    can_edit: true,
    assigned_by: assignedBy,
    notes
  };

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 4. Remove User from Phase (Admin Only)

```typescript
async function removeUserFromPhase(
  workspaceId: string,
  userId: string,
  phase: WorkspacePhase
): Promise<void> {
  const supabase = createClientComponentClient();

  const { error } = await supabase
    .from('user_phase_assignments')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('phase', phase);

  if (error) throw error;
}
```

### 5. Bulk Assign User to Multiple Phases

```typescript
async function bulkAssignUserToPhases(
  teamId: string,
  workspaceId: string,
  userId: string,
  phases: WorkspacePhase[],
  assignedBy: string
): Promise<UserPhaseAssignment[]> {
  const supabase = createClientComponentClient();

  const assignments = phases.map(phase => ({
    id: Date.now().toString() + phase, // Ensure uniqueness
    team_id: teamId,
    workspace_id: workspaceId,
    user_id: userId,
    phase,
    can_edit: true,
    assigned_by: assignedBy
  }));

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data;
}
```

---

## Permission Checking

### Client-Side Permission Check (With Server Fallback)

```typescript
/**
 * Check if user can edit work items in a specific phase
 * Returns: { hasPermission, reason, assignment }
 */
async function checkPhasePermission(
  workspaceId: string,
  userId: string,
  phase: WorkspacePhase,
  userRole: 'owner' | 'admin' | 'member'
): Promise<PhasePermissionCheck> {
  // Owners and admins always have permission
  if (userRole === 'owner') {
    return { hasPermission: true, reason: 'owner' };
  }
  if (userRole === 'admin') {
    return { hasPermission: true, reason: 'admin' };
  }

  // Check for phase assignment
  const supabase = createClientComponentClient();
  const { data: assignment, error } = await supabase
    .from('user_phase_assignments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('phase', phase)
    .eq('can_edit', true)
    .single();

  if (error || !assignment) {
    return { hasPermission: false, reason: 'no_permission' };
  }

  return {
    hasPermission: true,
    reason: 'assigned',
    assignment
  };
}
```

### Calculate Work Item Phase (Client-Side)

```typescript
/**
 * Calculate which phase a work item is in (matches DB function)
 */
function calculateWorkItemPhase(workItem: {
  status: string;
  has_timeline_breakdown?: boolean;
  owner?: string | null;
}): WorkspacePhase {
  const { status, has_timeline_breakdown, owner } = workItem;

  // Completed items
  if (status === 'completed' || status === 'done') {
    return 'complete';
  }

  // Review status
  if (status === 'review' || status === 'in_review' || status === 'pending_review') {
    return 'review';
  }

  // In progress = execution
  if (status === 'in_progress' && owner) {
    return 'execution';
  }

  // Has timeline = planning
  if (has_timeline_breakdown) {
    return 'planning';
  }

  // Default = research
  return 'research';
}
```

### Pre-Operation Permission Check

```typescript
/**
 * Check permission before creating/updating/deleting work item
 */
async function canModifyWorkItem(
  workItem: {
    workspace_id: string;
    status: string;
    owner?: string | null;
    has_timeline_breakdown?: boolean;
  },
  userId: string,
  userRole: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  // Calculate which phase this work item is in
  const phase = calculateWorkItemPhase(workItem);

  // Check if user has permission for this phase
  const { hasPermission } = await checkPhasePermission(
    workItem.workspace_id,
    userId,
    phase,
    userRole
  );

  return hasPermission;
}
```

---

## UI Components

### 1. Phase Assignment Badge

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { PHASE_CONFIG } from '@/lib/constants/workspace-phases';

interface PhaseAssignmentBadgeProps {
  phase: WorkspacePhase;
  className?: string;
}

export function PhaseAssignmentBadge({ phase, className }: PhaseAssignmentBadgeProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5',
        config.textColor,
        config.borderColor,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </Badge>
  );
}
```

### 2. Phase Assignment Manager (Admin UI)

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PHASE_ORDER } from '@/lib/constants/workspace-phases';

interface PhaseAssignmentManagerProps {
  workspaceId: string;
  userId: string;
  currentAssignments: UserPhaseAssignment[];
  onUpdate: (assignments: UserPhaseAssignment[]) => void;
}

export function PhaseAssignmentManager({
  workspaceId,
  userId,
  currentAssignments,
  onUpdate
}: PhaseAssignmentManagerProps) {
  const [selectedPhases, setSelectedPhases] = useState<Set<WorkspacePhase>>(
    new Set(currentAssignments.map(a => a.phase))
  );

  const handleTogglePhase = (phase: WorkspacePhase) => {
    const newSelected = new Set(selectedPhases);
    if (newSelected.has(phase)) {
      newSelected.delete(phase);
    } else {
      newSelected.add(phase);
    }
    setSelectedPhases(newSelected);
  };

  const handleSave = async () => {
    // Remove unselected assignments
    const toRemove = currentAssignments.filter(
      a => !selectedPhases.has(a.phase)
    );
    for (const assignment of toRemove) {
      await removeUserFromPhase(workspaceId, userId, assignment.phase);
    }

    // Add new assignments
    const toAdd = Array.from(selectedPhases).filter(
      phase => !currentAssignments.some(a => a.phase === phase)
    );
    if (toAdd.length > 0) {
      await bulkAssignUserToPhases(
        currentTeamId,
        workspaceId,
        userId,
        toAdd,
        currentUserId
      );
    }

    // Refresh assignments
    const updated = await getUserPhaseAssignments(workspaceId, userId);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Phase Permissions</h3>
      <div className="space-y-2">
        {PHASE_ORDER.map(phase => {
          const config = PHASE_CONFIG[phase];
          const isSelected = selectedPhases.has(phase);

          return (
            <div key={phase} className="flex items-center gap-3">
              <Checkbox
                id={`phase-${phase}`}
                checked={isSelected}
                onCheckedChange={() => handleTogglePhase(phase)}
              />
              <label
                htmlFor={`phase-${phase}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span>{config.icon}</span>
                <div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {config.description}
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </div>
      <Button onClick={handleSave}>Save Permissions</Button>
    </div>
  );
}
```

### 3. Permission Guard (Wrapper Component)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhasePermissionGuardProps {
  workspaceId: string;
  phase: WorkspacePhase;
  userId: string;
  userRole: 'owner' | 'admin' | 'member';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PhasePermissionGuard({
  workspaceId,
  phase,
  userId,
  userRole,
  children,
  fallback
}: PhasePermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPhasePermission(workspaceId, userId, phase, userRole).then(
      ({ hasPermission }) => setHasPermission(hasPermission)
    );
  }, [workspaceId, userId, phase, userRole]);

  if (hasPermission === null) {
    return <div className="animate-pulse">Loading permissions...</div>;
  }

  if (!hasPermission) {
    return fallback || (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to edit {PHASE_CONFIG[phase].name} phase.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Usage:
<PhasePermissionGuard
  workspaceId={workspaceId}
  phase="execution"
  userId={userId}
  userRole={userRole}
>
  <Button onClick={handleCreateWorkItem}>Create Work Item</Button>
</PhasePermissionGuard>
```

### 4. Conditional Button Rendering

```tsx
'use client';

interface CreateWorkItemButtonProps {
  workspaceId: string;
  targetPhase: WorkspacePhase;
  userId: string;
  userRole: 'owner' | 'admin' | 'member';
}

export function CreateWorkItemButton({
  workspaceId,
  targetPhase,
  userId,
  userRole
}: CreateWorkItemButtonProps) {
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    checkPhasePermission(workspaceId, userId, targetPhase, userRole).then(
      ({ hasPermission }) => setCanCreate(hasPermission)
    );
  }, [workspaceId, userId, targetPhase, userRole]);

  if (!canCreate) {
    return (
      <Button variant="outline" disabled>
        <Lock className="mr-2 h-4 w-4" />
        No Edit Permission
      </Button>
    );
  }

  return (
    <Button onClick={handleCreate}>
      <Plus className="mr-2 h-4 w-4" />
      Create Work Item
    </Button>
  );
}
```

---

## Best Practices

### ✅ DO

1. **Always check permissions client-side** before showing create/edit/delete UI
   ```typescript
   const { hasPermission } = await checkPhasePermission(...);
   if (!hasPermission) {
     // Hide button or show disabled state
   }
   ```

2. **Use TypeScript types** for type safety
   ```typescript
   phase: WorkspacePhase // NOT phase: string
   ```

3. **Cache phase assignments** to avoid repeated queries
   ```typescript
   const assignments = useMemo(() =>
     getUserPhaseAssignments(workspaceId, userId),
     [workspaceId, userId]
   );
   ```

4. **Show clear permission errors** to users
   ```tsx
   <Alert variant="destructive">
     You need '{phase}' phase permission to perform this action
   </Alert>
   ```

5. **Audit permission changes** in admin UI
   ```typescript
   await logPermissionChange({
     action: 'assigned',
     userId,
     phase,
     assignedBy,
     timestamp: new Date()
   });
   ```

### ❌ DON'T

1. **Don't bypass RLS** - Server enforces permissions, client only for UX
   ```typescript
   // ❌ BAD: Assuming permission check
   await supabase.from('work_items').insert(newItem);

   // ✅ GOOD: Check permission first, handle errors
   const { hasPermission } = await checkPhasePermission(...);
   if (!hasPermission) {
     toast.error('No permission');
     return;
   }
   ```

2. **Don't use string literals** for phases
   ```typescript
   // ❌ BAD
   const phase = 'execution';

   // ✅ GOOD
   const phase: WorkspacePhase = 'execution';
   ```

3. **Don't forget to handle owner/admin bypass**
   ```typescript
   // ❌ BAD: Only checking assignments
   const assignment = await getAssignment(userId, phase);
   if (!assignment) return false;

   // ✅ GOOD: Check role first
   if (userRole === 'owner' || userRole === 'admin') return true;
   ```

4. **Don't assign owners/admins to phases** - They bypass anyway
   ```typescript
   // ❌ BAD: Wasted database space
   if (userRole === 'owner') {
     await assignUserToPhase(userId, 'execution');
   }

   // ✅ GOOD: Skip assignment for owners/admins
   if (userRole === 'member') {
     await assignUserToPhase(userId, 'execution');
   }
   ```

5. **Don't hardcode phase values**
   ```typescript
   // ❌ BAD
   if (phase === 'execution' || phase === 'review') { ... }

   // ✅ GOOD: Use constants
   import { PHASE_ORDER } from '@/lib/constants/workspace-phases';
   if (PHASE_ORDER.includes(phase)) { ... }
   ```

---

## Troubleshooting

### Problem: User can't create work items

**Diagnosis**:
```typescript
const { hasPermission, reason } = await checkPhasePermission(
  workspaceId,
  userId,
  phase,
  userRole
);
console.log({ hasPermission, reason, phase, userRole });
```

**Solutions**:
- If `reason === 'no_permission'`: Assign user to phase
- If `userRole === 'member'`: Promote to admin or assign to phase
- If `phase` is wrong: Check `calculateWorkItemPhase()` logic

---

### Problem: Permission check returns false for owner/admin

**Diagnosis**:
```typescript
console.log('User role:', userRole);
console.log('Expected: owner or admin');
```

**Solution**: Verify `userRole` is correctly fetched from `team_members` table

---

### Problem: RLS error when creating assignment

**Error**: `new row violates row-level security policy`

**Solution**: Verify current user is owner/admin in the team
```sql
SELECT role FROM team_members
WHERE user_id = auth.uid() AND team_id = ?;
```

---

## Examples

### Complete Create Work Item Flow

```typescript
async function handleCreateWorkItem(
  workspaceId: string,
  newItem: Partial<WorkItem>,
  userId: string,
  userRole: 'owner' | 'admin' | 'member'
) {
  // 1. Calculate target phase
  const targetPhase = calculateWorkItemPhase({
    status: newItem.status || 'not_started',
    has_timeline_breakdown: false,
    owner: newItem.owner
  });

  // 2. Check permission
  const { hasPermission, reason } = await checkPhasePermission(
    workspaceId,
    userId,
    targetPhase,
    userRole
  );

  if (!hasPermission) {
    toast.error(`No permission to create work items in ${targetPhase} phase`);
    return null;
  }

  // 3. Create work item (RLS will double-check permission)
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('work_items')
    .insert({
      id: Date.now().toString(),
      ...newItem,
      workspace_id: workspaceId
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('row-level security')) {
      toast.error('Permission denied by server');
    } else {
      toast.error(error.message);
    }
    return null;
  }

  toast.success('Work item created successfully');
  return data;
}
```

---

**Ready to implement! 🚀**

For complete migration details, see [PHASE_PERMISSIONS_MIGRATION_SUMMARY.md](../../PHASE_PERMISSIONS_MIGRATION_SUMMARY.md)
