/**
 * Database Utilities for E2E Testing
 *
 * Provides direct database access for test setup and cleanup.
 * This allows tests to create complex data scenarios without
 * simulating through the UI.
 *
 * IMPORTANT: Uses service role key for admin operations (bypasses RLS)
 * and anon key for testing RLS policies from user perspective.
 *
 * NOTE: If SUPABASE_SERVICE_ROLE_KEY is not set, tests that require
 * admin operations will be gracefully skipped rather than failing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Track if we've already warned about missing service key
let hasWarnedAboutMissingKey = false;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Regular client (subject to RLS) - for user-perspective testing
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS) - for test setup and cleanup
let adminClient: SupabaseClient | null = null;

/**
 * Check if the admin client (service role key) is available
 * Use this to conditionally skip tests that require admin access
 */
export function hasAdminClient(): boolean {
  return !!supabaseServiceRoleKey;
}

/**
 * Get admin client that bypasses RLS (uses service role key)
 * Use this for test setup/cleanup, NOT for testing user access
 * Returns null if service role key is not configured (tests should skip)
 */
export function getAdminClient(): SupabaseClient | null {
  if (!adminClient) {
    if (!supabaseServiceRoleKey) {
      if (!hasWarnedAboutMissingKey) {
        console.warn(
          '\n⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Database admin operations will be skipped.\n' +
          '   Add it to .env.test file to run the full test suite.\n'
        );
        hasWarnedAboutMissingKey = true;
      }
      return null;
    }
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return adminClient;
}

/**
 * Get regular client (subject to RLS) - for user perspective testing
 */
export function getRegularClient(): SupabaseClient {
  return supabase;
}

/**
 * Create a real Supabase auth user for testing
 * Returns user ID and email that can be used for authentication
 * Returns null if admin client is not available
 */
export async function createTestAuthUser(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const admin = getAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return { id: data.user.id, email: data.user.email! };
}

/**
 * Delete a test auth user
 * Silently returns if admin client is not available
 */
export async function deleteTestAuthUser(userId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) {
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    console.error(`Failed to delete test user ${userId}:`, error.message);
  }
}

/**
 * Type for the link properties returned by generateLink
 * The Supabase types don't include access_token/refresh_token but the runtime API provides them
 */
interface GenerateLinkPropertiesWithTokens {
  access_token?: string;
  refresh_token?: string;
  hashed_token?: string;
  verification_type?: string;
  redirect_to?: string;
}

/**
 * Create a Supabase client authenticated as a specific user
 * Use this to test RLS policies from that user's perspective
 * Returns null if admin client is not available
 */
export async function createClientAsUser(userId: string): Promise<SupabaseClient | null> {
  const admin = getAdminClient();
  if (!admin) {
    return null;
  }

  // Generate a magic link token for the user
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: (await admin.auth.admin.getUserById(userId)).data.user?.email || '',
  });

  // Cast properties to include runtime token properties
  const properties = data?.properties as GenerateLinkPropertiesWithTokens | undefined;

  if (error || !properties?.access_token) {
    throw new Error(`Failed to create client as user: ${error?.message}`);
  }

  // Create a new client with the user's session
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  await userClient.auth.setSession({
    access_token: properties.access_token,
    refresh_token: properties.refresh_token || '',
  });

  return userClient;
}

/**
 * Create a test team directly in the database
 */
export async function createTeamInDatabase(
  teamData: {
    name: string;
    ownerId: string;
  },
): Promise<{ id: string; name: string }> {
  try {
    const teamId = `team_${Date.now()}`;

    const { data, error} = await supabase
      .from('teams')
      .insert([
        {
          id: teamId,
          name: teamData.name,
          owner_id: teamData.ownerId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
    };
  } catch (error) {
    console.error('Failed to create team in database:', error);
    throw error;
  }
}

/**
 * Create a test workspace directly in the database
 */
export async function createWorkspaceInDatabase(
  workspaceData: {
    name: string;
    description?: string;
    teamId: string;
    phase?: string;
  },
): Promise<{ id: string; name: string; teamId: string }> {
  try {
    const workspaceId = `workspace_${Date.now()}`;

    const { data, error } = await supabase
      .from('workspaces')
      .insert([
        {
          id: workspaceId,
          name: workspaceData.name,
          description: workspaceData.description || '',
          team_id: workspaceData.teamId,
          phase: workspaceData.phase || 'research',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      teamId: data.team_id,
    };
  } catch (error) {
    console.error('Failed to create workspace in database:', error);
    throw error;
  }
}

/**
 * Create a test work item directly in the database
 */
export async function createWorkItemInDatabase(
  workItemData: {
    title: string;
    description?: string;
    type: 'feature' | 'bug' | 'concept';
    phase: string;
    priority: string;
    workspaceId: string;
    teamId: string;
    is_enhancement?: boolean;
  },
): Promise<{ id: string; title: string }> {
  try {
    const workItemId = `item_${Date.now()}`;

    const { data, error } = await supabase
      .from('work_items')
      .insert([
        {
          id: workItemId,
          name: workItemData.title,
          description: workItemData.description || '',
          type: workItemData.type,
          phase: workItemData.phase,
          priority: workItemData.priority,
          workspace_id: workItemData.workspaceId,
          team_id: workItemData.teamId,
          is_enhancement: workItemData.is_enhancement || false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating work item:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.name,
    };
  } catch (error) {
    console.error('Failed to create work item in database:', error);
    throw error;
  }
}

/**
 * Add a team member to a team
 */
export async function addTeamMemberInDatabase(
  userId: string,
  teamId: string,
  role: 'owner' | 'admin' | 'member' | 'viewer' = 'member',
): Promise<void> {
  try {
    const { error } = await supabase
      .from('team_members')
      .insert([
        {
          user_id: userId,
          team_id: teamId,
          role: role,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to add team member in database:', error);
    throw error;
  }
}

/**
 * Clean up all test data for a team
 */
export async function cleanupTeamData(teamId: string): Promise<void> {
  try {
    // Delete workspaces (cascades to features, etc.)
    await supabase
      .from('workspaces')
      .delete()
      .eq('team_id', teamId);

    // Delete team members
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    // Delete team
    await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    console.log(`Cleaned up test data for team: ${teamId}`);
  } catch (error) {
    console.error('Error during team cleanup:', error);
    // Don't throw - cleanup errors shouldn't fail tests
  }
}

/**
 * Clean up work items in a workspace
 */
export async function cleanupWorkspaceData(workspaceId: string): Promise<void> {
  try {
    // Delete features (timeline items cascade)
    await supabase
      .from('work_items')
      .delete()
      .eq('workspace_id', workspaceId);

    // Delete mind maps and nodes
    await supabase
      .from('mind_maps')
      .delete()
      .eq('workspace_id', workspaceId);

    // Delete workspace
    await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    console.log(`Cleaned up test data for workspace: ${workspaceId}`);
  } catch (error) {
    console.error('Error during workspace cleanup:', error);
  }
}

/**
 * Get team ID by name (for test verification)
 */
export async function getTeamIdByName(teamName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .eq('name', teamName)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting team ID:', error);
    return null;
  }
}

/**
 * Get workspace ID by name and team ID
 */
export async function getWorkspaceIdByName(
  teamId: string,
  workspaceName: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('team_id', teamId)
      .eq('name', workspaceName)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting workspace ID:', error);
    return null;
  }
}

/**
 * Get work item ID by title
 */
export async function getWorkItemIdByTitle(
  workspaceId: string,
  title: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('work_items')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('title', title)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting work item ID:', error);
    return null;
  }
}

/**
 * Verify team isolation - check that user can't see other team's data
 */
export async function verifyTeamIsolation(
  userId: string,
  ownTeamId: string,
  otherTeamId: string,
): Promise<boolean> {
  try {
    // Check if user has access to own team
    const { data: ownTeam, error: ownError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', ownTeamId)
      .single();

    if (ownError || !ownTeam) {
      console.error('User should have access to own team');
      return false;
    }

    // Check that user doesn't have access to other team
    const { data: otherTeam, error: otherError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', otherTeamId)
      .single();

    // Should error or return null - user shouldn't have access
    if (otherTeam && !otherError) {
      console.error('User should not have access to other team');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying team isolation:', error);
    return false;
  }
}

/**
 * Create a test resource directly in the database
 */
export async function createResourceInDatabase(
  resourceData: {
    title: string;
    url?: string;
    description?: string;
    notes?: string;
    resourceType?: 'reference' | 'inspiration' | 'documentation' | 'media' | 'tool';
    workspaceId: string;
    teamId: string;
    createdBy: string;
  },
): Promise<{ id: string; title: string }> {
  try {
    const resourceId = `resource_${Date.now()}`;

    const { data, error } = await supabase
      .from('resources')
      .insert([
        {
          id: resourceId,
          title: resourceData.title,
          url: resourceData.url || null,
          description: resourceData.description || null,
          notes: resourceData.notes || null,
          resource_type: resourceData.resourceType || 'reference',
          workspace_id: resourceData.workspaceId,
          team_id: resourceData.teamId,
          created_by: resourceData.createdBy,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating resource:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
    };
  } catch (error) {
    console.error('Failed to create resource in database:', error);
    throw error;
  }
}

/**
 * Link a resource to a work item
 */
export async function linkResourceToWorkItem(
  resourceId: string,
  workItemId: string,
  teamId: string,
  addedBy: string,
  tabType: 'inspiration' | 'resource' = 'resource',
): Promise<void> {
  try {
    const { error } = await supabase
      .from('work_item_resources')
      .insert([
        {
          work_item_id: workItemId,
          resource_id: resourceId,
          team_id: teamId,
          tab_type: tabType,
          added_by: addedBy,
          added_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error linking resource:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to link resource in database:', error);
    throw error;
  }
}

/**
 * Get resource by ID
 */
export async function getResourceById(
  resourceId: string,
): Promise<{ id: string; title: string; is_deleted: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, is_deleted')
      .eq('id', resourceId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting resource:', error);
    return null;
  }
}

/**
 * Get resource audit log entries
 */
export async function getResourceAuditLog(
  resourceId: string,
): Promise<Array<{ action: string; performed_at: string }>> {
  try {
    const { data, error } = await supabase
      .from('resource_audit_log')
      .select('action, performed_at')
      .eq('resource_id', resourceId)
      .order('performed_at', { ascending: false });

    if (error) {
      console.error('Error getting audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get audit log:', error);
    return [];
  }
}

/**
 * Search resources by query
 */
export async function searchResources(
  teamId: string,
  query: string,
): Promise<Array<{ id: string; title: string }>> {
  try {
    const { data, error } = await supabase
      .rpc('search_resources', {
        p_team_id: teamId,
        p_query: query,
        p_limit: 50,
        p_offset: 0,
      });

    if (error) {
      console.error('Error searching resources:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to search resources:', error);
    return [];
  }
}

/**
 * Cleanup resources for a team
 */
export async function cleanupResourcesData(teamId: string): Promise<void> {
  try {
    // Delete work_item_resources junction entries
    await supabase
      .from('work_item_resources')
      .delete()
      .eq('team_id', teamId);

    // Delete resource audit logs
    await supabase
      .from('resource_audit_log')
      .delete()
      .eq('team_id', teamId);

    // Delete resources
    await supabase
      .from('resources')
      .delete()
      .eq('team_id', teamId);

    console.log(`Cleaned up resources data for team: ${teamId}`);
  } catch (error) {
    console.error('Error during resources cleanup:', error);
  }
}

/**
 * Reset database to clean state (WARNING: only for test databases!)
 */
export async function resetTestDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Cannot reset database outside of test environment');
  }

  try {
    console.log('Resetting test database...');

    // Delete all test data in order of dependencies
    const { data: workspaces } = await supabase.from('workspaces').select('id');

    if (workspaces) {
      const workspaceIds = workspaces.map(w => w.id);
      for (const workspaceId of workspaceIds) {
        await cleanupWorkspaceData(workspaceId);
      }
    }

    const { data: teams } = await supabase.from('teams').select('id');

    if (teams) {
      const teamIds = teams.map(t => t.id);
      for (const teamId of teamIds) {
        await cleanupTeamData(teamId);
      }
    }

    console.log('Test database reset complete');
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
}
