'use client';

import { LogOut, Settings, User, HelpCircle, KeyboardIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient, resetClient } from '@/lib/supabase/client';
import { UserAvatar } from './user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserProfileDropdownProps {
  user: {
    id: string;
    name?: string | null;
    email?: string;
    avatar_url?: string | null;
  };
  teamRole?: 'owner' | 'admin' | 'member';
}

const roleColors = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export function UserProfileDropdown({ user, teamRole = 'member' }: UserProfileDropdownProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    resetClient(); // Clear singleton immediately after signOut completes
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 w-full justify-start px-3 py-2 h-auto hover:bg-sidebar-accent"
        >
          <UserAvatar user={user} size="md" />
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm font-semibold truncate">
                {user.name || user.email}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs px-1.5 py-0', roleColors[teamRole])}
              >
                {roleLabels[teamRole]}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground truncate w-full">
              {user.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <KeyboardIcon className="mr-2 h-4 w-4" />
          <span>Keyboard Shortcuts</span>
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+K</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Import cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
