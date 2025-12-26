'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { DEPARTMENT_PRESETS, type DepartmentInsert } from '@/lib/types/department';
import { cn } from '@/lib/utils';
import {
  Folder,
  Code2,
  Palette,
  Megaphone,
  Users,
  Briefcase,
  Shield,
  Cog,
  FlaskConical,
  Headphones,
} from 'lucide-react';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  'code-2': Code2,
  palette: Palette,
  megaphone: Megaphone,
  users: Users,
  briefcase: Briefcase,
  shield: Shield,
  cog: Cog,
  'flask-conical': FlaskConical,
  headphones: Headphones,
};

interface DepartmentPresetsProps {
  /** Team ID to create departments for */
  teamId: string;
  /** Callback when departments are created successfully */
  onCreated: () => void;
  /** Callback to open custom department creation */
  onCreateCustom?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DepartmentPresets
 *
 * Displays preset department suggestions for teams that have no departments yet.
 * Allows users to select and create multiple departments at once.
 *
 * @example
 * <DepartmentPresets
 *   teamId={teamId}
 *   onCreated={() => refetchDepartments()}
 *   onCreateCustom={() => openCreateModal()}
 * />
 */
export function DepartmentPresets({
  teamId,
  onCreated,
  onCreateCustom,
  className,
}: DepartmentPresetsProps) {
  const [selectedPresets, setSelectedPresets] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle preset selection
  const togglePreset = (index: number) => {
    const newSelected = new Set(selectedPresets);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPresets(newSelected);
  };

  // Select all presets
  const selectAll = () => {
    setSelectedPresets(new Set(DEPARTMENT_PRESETS.map((_, i) => i)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPresets(new Set());
  };

  // Create selected departments
  const createSelectedDepartments = async () => {
    if (selectedPresets.size === 0) return;

    setIsCreating(true);
    setError(null);

    try {
      // Create departments sequentially to ensure proper sort_order
      // Use numeric compare to avoid alphabetical sorting of numbers
      for (const index of Array.from(selectedPresets).sort((a, b) => a - b)) {
        const preset = DEPARTMENT_PRESETS[index];
        const department: DepartmentInsert = {
          team_id: teamId,
          name: preset.name,
          description: preset.description,
          color: preset.color,
          icon: preset.icon,
          is_default: index === 0 && selectedPresets.size > 0, // First selected becomes default
        };

        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(department),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create department');
        }
      }

      setSelectedPresets(new Set());
      onCreated();
    } catch (err) {
      console.error('Error creating departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to create departments');
    } finally {
      setIsCreating(false);
    }
  };

  // Render icon for a preset
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName] || Folder;
    return <IconComponent className={className} />;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Get Started with Departments</CardTitle>
        </div>
        <CardDescription>
          Departments help organize work items by team or function.
          Select the ones that match your organization, or create custom ones.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preset grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEPARTMENT_PRESETS.map((preset, index) => {
            const isSelected = selectedPresets.has(index);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => togglePreset(index)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                  'hover:border-primary/50 hover:bg-accent/50',
                  isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/20'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  className="mt-0.5"
                  aria-label={`Select ${preset.name}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: preset.color }}
                      aria-hidden="true"
                    />
                    {renderIcon(preset.icon, 'h-4 w-4 shrink-0 text-muted-foreground')}
                    <span className="font-medium truncate">{preset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Selection controls */}
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={selectAll}
            >
              Select all
            </Button>
            <span className="text-muted-foreground">·</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>

          <div className="flex-1" />

          {/* Create custom */}
          {onCreateCustom && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCustom}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Custom
            </Button>
          )}

          {/* Create selected */}
          <Button
            size="sm"
            onClick={createSelectedDepartments}
            disabled={selectedPresets.size === 0 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create {selectedPresets.size > 0 && `(${selectedPresets.size})`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline version for empty states
 */
export function DepartmentPresetsInline({
  teamId,
  onCreated,
  className,
}: Omit<DepartmentPresetsProps, 'onCreateCustom'>) {
  const [isCreating, setIsCreating] = useState(false);

  // Create first 3 presets as quick start
  const quickStart = async () => {
    setIsCreating(true);
    try {
      for (let i = 0; i < 3; i++) {
        const preset = DEPARTMENT_PRESETS[i];
        await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: teamId,
            name: preset.name,
            description: preset.description,
            color: preset.color,
            icon: preset.icon,
            is_default: i === 0,
          }),
        });
      }
      onCreated();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <span>No departments yet.</span>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0"
        onClick={quickStart}
        disabled={isCreating}
      >
        {isCreating ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3 mr-1" />
        )}
        Quick start with presets
      </Button>
    </div>
  );
}
