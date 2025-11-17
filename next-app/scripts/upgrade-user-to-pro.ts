/**
 * Admin script to upgrade a user's team to pro plan
 * Usage: npx tsx scripts/upgrade-user-to-pro.ts <email>
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/supabase/types';

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('Usage: npx tsx scripts/upgrade-user-to-pro.ts <email>');
  process.exit(1);
}

async function upgradeUserToPro(userEmail: string) {
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log(`🔍 Looking for user: ${userEmail}...`);

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ Error: User not found');
      console.error(userError);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Find user's teams
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams:team_id (
          id,
          name,
          plan,
          member_count
        )
      `)
      .eq('user_id', user.id);

    if (teamMembersError) {
      console.error('❌ Error fetching teams');
      console.error(teamMembersError);
      process.exit(1);
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.error('❌ Error: User is not a member of any teams');
      process.exit(1);
    }

    console.log(`\n📋 Found ${teamMembers.length} team(s):\n`);

    // Upgrade each team to pro
    let successCount = 0;
    for (const member of teamMembers) {
      const team = member.teams as any;

      console.log(`  • ${team.name}`);
      console.log(`    - Current plan: ${team.plan}`);
      console.log(`    - Role: ${member.role}`);
      console.log(`    - Members: ${team.member_count}`);

      if (team.plan === 'pro') {
        console.log(`    ✅ Already on Pro plan\n`);
        successCount++;
        continue;
      }

      // Update team to pro
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          plan: 'pro',
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id);

      if (updateError) {
        console.error(`    ❌ Failed to upgrade: ${updateError.message}\n`);
      } else {
        console.log(`    ✅ Upgraded to Pro plan!\n`);
        successCount++;
      }
    }

    console.log(`\n🎉 Success! Upgraded ${successCount}/${teamMembers.length} team(s) to Pro plan`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the upgrade
upgradeUserToPro(email);
