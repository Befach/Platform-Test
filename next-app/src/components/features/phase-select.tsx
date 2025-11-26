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

  const selectedPhase = WORKSPACE_PHASES.find((p) => p.id === value);
  const selectedPermission = permissions.find((p) => p.phase === value);

  return (
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
                <SelectItem
                  key={phase.id}
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
  );
}
