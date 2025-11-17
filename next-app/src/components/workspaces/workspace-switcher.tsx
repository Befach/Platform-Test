'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  team_id: string;
  teams?: {
    plan: 'free' | 'pro' | 'enterprise';
  };
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  teamPlan: 'free' | 'pro' | 'enterprise';
  workspaces: Workspace[];
  collapsed: boolean;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  currentWorkspaceName,
  teamPlan,
  workspaces,
  collapsed,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelectWorkspace = (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) {
      setOpen(false);
      return;
    }

    router.push(`/workspaces/${workspaceId}`);
    setOpen(false);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-blue-100 text-blue-700';
      case 'enterprise':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (collapsed) {
    // Show only the first letter as an avatar when collapsed
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {currentWorkspaceName.charAt(0).toUpperCase()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Find workspace..." />
            <CommandList>
              <CommandEmpty>No workspaces found.</CommandEmpty>
              <CommandGroup>
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    onSelect={() => handleSelectWorkspace(workspace.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-medium text-white">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          getPlanBadgeColor(workspace.teams?.plan || 'free')
                        )}
                      >
                        {(workspace.teams?.plan || 'free').toUpperCase()}
                      </Badge>
                      {workspace.id === currentWorkspaceId && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    // Future: Open create workspace dialog
                    setOpen(false);
                  }}
                  className="text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Expanded sidebar view
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-2 h-auto py-2"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-600 text-sm font-medium text-white">
              {currentWorkspaceName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="truncate font-semibold text-sm w-full text-left">
                {currentWorkspaceName}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {teamPlan} Plan
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Find workspace..." />
          <CommandList>
            <CommandEmpty>No workspaces found.</CommandEmpty>
            <CommandGroup>
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  onSelect={() => handleSelectWorkspace(workspace.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-600 text-sm font-medium text-white">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{workspace.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        getPlanBadgeColor(workspace.teams?.plan || 'free')
                      )}
                    >
                      {(workspace.teams?.plan || 'free').toUpperCase()}
                    </Badge>
                    {workspace.id === currentWorkspaceId && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  // Future: Open create workspace dialog
                  setOpen(false);
                }}
                className="text-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
