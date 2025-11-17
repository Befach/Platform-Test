'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lock, UserCheck, Users, Mail } from 'lucide-react';
import { WORKSPACE_PHASES, type WorkspacePhase } from '@/lib/constants/workspace-phases';
import { cn } from '@/lib/utils';

export interface PhasePermission {
  phase: WorkspacePhase;
  canAssign: boolean;
  canView: boolean;
  leadName?: string;
  leadEmail?: string;
  workloadCount?: number;
}

interface PhaseSelectProps {
  value: WorkspacePhase | undefined;
  onValueChange: (value: WorkspacePhase) => void;
  permissions: PhasePermission[];
  disabled?: boolean;
  required?: boolean;
  showWorkload?: boolean;
  className?: string;
}

export function PhaseSelect({
  value,
  onValueChange,
  permissions,
  disabled = false,
  required = false,
  showWorkload = true,
  className,
}: PhaseSelectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const getPermissionBadge = (permission: PhasePermission) => {
    if (permission.canAssign) {
      return (
        <Badge
          variant="secondary"
          className="shrink-0 text-xs bg-emerald-100 text-emerald-700 border-emerald-200"
        >
          CAN ASSIGN
        </Badge>
      );
    }

    if (permission.canView) {
      return (
        <Badge
          variant="secondary"
          className="shrink-0 text-xs bg-slate-100 text-slate-600 border-slate-200"
        >
          VIEW ONLY
        </Badge>
      );
    }

    return (
      <Badge
        variant="secondary"
        className="shrink-0 text-xs bg-red-100 text-red-700 border-red-200"
      >
        NO ACCESS
      </Badge>
    );
  };

  const getTooltipContent = (permission: PhasePermission) => {
    const phaseName = WORKSPACE_PHASES.find((p) => p.id === permission.phase)?.label || permission.phase;

    if (permission.canAssign) {
      return (
        <div className="space-y-2 max-w-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold">You can assign work items</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You have edit permission for the {phaseName} phase. You can create and assign work items to this phase.
          </p>
          {permission.leadName && (
            <div className="pt-2 border-t space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">Phase Lead:</span>
              </div>
              <p className="text-sm">{permission.leadName}</p>
              {permission.leadEmail && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{permission.leadEmail}</span>
                </div>
              )}
            </div>
          )}
          {showWorkload && permission.workloadCount !== undefined && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Current workload: {permission.workloadCount} items in {phaseName}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (permission.canView) {
      return (
        <div className="space-y-2 max-w-xs">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            <span className="font-semibold">View-only access</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You can view work items in {phaseName} but cannot create or assign items to this phase.
          </p>
          {permission.leadName && (
            <div className="pt-2 border-t space-y-1">
              <p className="text-sm font-medium">To get edit access, contact:</p>
              <p className="text-sm">{permission.leadName}</p>
              {permission.leadEmail && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${permission.leadEmail}?subject=Request access to ${phaseName} phase`}
                    className="hover:underline"
                  >
                    {permission.leadEmail}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2 max-w-xs">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-red-500" />
          <span className="font-semibold">No access</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You don't have access to the {phaseName} phase. Contact your team admin to request access.
        </p>
      </div>
    );
  };

  const selectedPhase = WORKSPACE_PHASES.find((p) => p.id === value);
  const selectedPermission = permissions.find((p) => p.phase === value);

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Phase
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>

        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          required={required}
        >
          <SelectTrigger
            className="w-full"
            aria-required={required}
            aria-label="Select phase for work item"
          >
            <SelectValue placeholder="Select phase...">
              {selectedPhase && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedPhase.color }}
                    aria-hidden="true"
                  />
                  <span>{selectedPhase.label}</span>
                  {selectedPermission && (
                    <span className="ml-auto">{getPermissionBadge(selectedPermission)}</span>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {permissions.map((permission) => {
              const phase = WORKSPACE_PHASES.find((p) => p.id === permission.phase);
              if (!phase) return null;

              const isDisabled = !permission.canAssign;

              return (
                <Tooltip key={phase.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div>
                      <SelectItem
                        value={phase.id}
                        disabled={isDisabled}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          isDisabled && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: phase.color }}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{phase.label}</span>
                          <div className="flex items-center gap-2">
                            {showWorkload && permission.workloadCount !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                ({permission.workloadCount})
                              </span>
                            )}
                            {getPermissionBadge(permission)}
                          </div>
                        </div>
                      </SelectItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-sm">
                    {getTooltipContent(permission)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </SelectContent>
        </Select>

        {required && (
          <p className="text-xs text-muted-foreground">
            * Required field
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
