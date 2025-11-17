# Supabase Setup Guide

This guide will help you set up Supabase for the Product Lifecycle Management Platform.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Supabase account (free tier is fine to start)

## Step 1: Create a Supabase Project

### Option A: Create New Project (Recommended)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name**: `product-lifecycle-platform` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click "Create new project"
5. Wait 2-3 minutes for the project to initialize

### Option B: Use Existing Project

If you already have a Supabase project, you can use it. Just make sure to backup any existing data first.

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

## Step 3: Configure Environment Variables

1. In your `next-app` directory, create a `.env.local` file:

```bash
cd next-app
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Apply the Database Migration

### Method 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click "New query"
4. Open the migration file: `supabase/migrations/20250110000001_initial_multitenant_schema.sql`
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click "Run" (or press Ctrl/Cmd + Enter)
8. Wait for execution to complete (should take 5-10 seconds)
9. Check for any errors in the results panel

### Method 2: Using Supabase CLI (Advanced)

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Login to Supabase:

```bash
supabase login
```

3. Link your project:

```bash
supabase link --project-ref your-project-ref
```

Note: Find your project ref in your Supabase project URL: `https://[project-ref].supabase.co`

4. Push the migration:

```bash
supabase db push
```

## Step 5: Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `users`
   - `teams`
   - `team_members`
   - `subscriptions`
   - `workspaces`
   - `mind_maps`
   - `mind_map_nodes`
   - `mind_map_edges`
   - `features`
   - `timeline_items`
   - `linked_items`
   - `review_links`
   - `feedback`
   - `custom_dashboards`
   - `success_metrics`
   - `ai_usage`
   - `invitations`

3. Check that Row Level Security (RLS) is enabled on all tables:
   - Click on any table
   - Click the "Policies" tab
   - You should see multiple policies listed

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**

2. **Enable Email/Password** (for magic links):
   - Toggle "Enable Email provider"
   - Enable "Confirm email" (recommended)
   - Enable "Secure email change" (recommended)

3. **Enable Google OAuth** (optional but recommended):
   - Toggle "Enable Google provider"
   - You'll need to create a Google OAuth app:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select existing
     - Enable Google+ API
     - Create OAuth 2.0 credentials
     - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

4. **Configure Email Templates** (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the magic link email template
   - Add your branding

## Step 7: Generate TypeScript Types

1. Install Supabase CLI if you haven't:

```bash
npm install -g supabase
```

2. Generate types:

```bash
supabase gen types typescript --project-id your-project-ref > src/lib/supabase/types.ts
```

Replace `your-project-ref` with your actual project reference.

3. This will create a `types.ts` file with TypeScript definitions for all your database tables.

## Step 8: Test the Connection

1. Start your Next.js development server:

```bash
cd next-app
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. The middleware should be active (check browser console for any errors)

4. You can test the Supabase connection by creating a simple test page or using the browser console:

```javascript
// In browser console
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)
const { data } = await supabase.from('teams').select('*')
console.log(data) // Should return empty array []
```

## Common Issues & Troubleshooting

### Issue: "relation does not exist" error

**Solution**: The migration wasn't applied. Go back to Step 4 and apply the migration using the Supabase Dashboard SQL Editor.

### Issue: "JWT expired" or auth errors

**Solution**:
1. Check that your `.env.local` file has the correct credentials
2. Restart your Next.js dev server
3. Clear browser cookies and localStorage

### Issue: "Row Level Security policy violation"

**Solution**: RLS policies are working correctly. This means:
- You need to be authenticated to access certain tables
- This is expected behavior for multi-tenant security
- You'll handle this properly once authentication is built

### Issue: Can't connect to Supabase

**Solution**:
1. Check that your Supabase project is active (not paused)
2. Verify the URL and anon key in `.env.local`
3. Check your internet connection
4. Try accessing the Supabase dashboard directly

## Next Steps

Once Supabase is set up:

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ✅ TypeScript types generated
4. ⏭️ Build authentication pages (login, signup, onboarding)
5. ⏭️ Implement team management
6. ⏭️ Create workspace system

## Database Schema Overview

### Multi-Tenancy Structure

```
Team (Organization)
├── Members (owner/admin/member roles)
├── Subscription (Stripe)
└── Workspaces (Projects)
    ├── Phase (lifecycle stage)
    ├── Enabled Modules (toggle features)
    ├── Features
    ├── Mind Maps
    └── Review Links
```

### Key Tables

- **teams**: Organizations that own workspaces
- **team_members**: User membership with roles (owner/admin/member)
- **workspaces**: Projects with phase-based workflows
- **mind_maps**: Visual canvas for brainstorming
- **features**: Main features/epics
- **timeline_items**: MVP/SHORT/LONG breakdown
- **review_links**: External feedback system

### Phases

Workspaces progress through these phases:
1. **research** - Initial discovery
2. **planning** - Detailed planning
3. **review** - Stakeholder review
4. **execution** - Building
5. **testing** - QA and testing
6. **metrics** - Measuring success
7. **complete** - Done

### Modules

Each workspace can enable/disable these modules:
- `research` - AI research chat
- `mind_map` - Visual canvas (ReactFlow)
- `features` - Feature management
- `dependencies` - Dependency graph
- `review` - External feedback
- `execution` - Project execution
- `collaboration` - Real-time collab (Pro only)
- `timeline` - Gantt timeline
- `analytics` - Metrics dashboard
- `ai` - AI assistant

## Security Notes

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only access teams they're members of
- Team members can access all workspaces in their team
- Review links allow public access for feedback
- AI usage is tracked per team

### Multi-Tenant Isolation

- Every table (except users) has a team_id reference
- All queries automatically filter by team_id through RLS
- Users cannot access other teams' data
- Supabase handles query filtering automatically

### API Keys

- **anon key**: Safe to use in client-side code (public)
- **service_role key**: NEVER expose in client code (admin access)
- Use anon key for all client-side operations
- Use service_role only in secure server-side code if needed

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the migration file for any SQL syntax errors
3. Check the Supabase project logs in the dashboard
4. Verify your environment variables are correct
5. Try the troubleshooting steps above

---

**Ready to continue?** Once Supabase is set up, proceed to building the authentication pages!
