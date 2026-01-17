# **WEEK 1-2: Foundation & Multi-Tenancy**

**Last Updated:** 2025-11-14
**Status:** ⏳ In Progress (50% complete)

[← Back to Implementation Plan](README.md) | [Next: Week 3 →](week-3-mind-mapping.md)

---

## Goal

Next.js setup, authentication, teams, workspaces

---

## Tasks

### Day 1-2: Project Setup

- [ ] Initialize Next.js 15 with TypeScript (`npx create-next-app@latest`)
- [ ] Configure `next.config.js` for optimal settings
- [ ] Install core dependencies:

  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install zustand react-query @tanstack/react-query
  npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
  npm install lucide-react class-variance-authority clsx tailwind-merge
  npm install stripe @stripe/stripe-js
  npm install react-hook-form zod @hookform/resolvers
  npm install date-fns recharts
  npm install resend (email)
  ```

- [ ] Set up shadcn/ui:

  ```bash
  npx shadcn-ui@latest init
  ```

- [ ] Configure Tailwind CSS with custom theme

### Day 3-4: Supabase Setup

- [ ] Create Supabase project (or use existing)
- [ ] Create multi-tenant database schema (run SQL migrations)
- [ ] Generate TypeScript types:

  ```bash
  npx supabase gen types typescript --project-id abc > lib/supabase/types.ts
  ```

- [ ] Set up Supabase client (client-side and server-side)
- [ ] Configure environment variables (`.env.local`)

### Day 5-7: Authentication

- [ ] Configure Supabase Auth (magic links + Google OAuth)
- [ ] Build auth pages:
  - [ ] `/app/(auth)/login/page.tsx`
  - [ ] `/app/(auth)/signup/page.tsx`
  - [ ] `/app/(auth)/onboarding/page.tsx` (create first team)
- [ ] Implement session management (middleware)
- [ ] Protected route wrapper (`/app/(dashboard)/layout.tsx`)

### Day 8-10: Team Management

- [ ] Team creation logic
- [ ] Email invitations (Resend integration)
- [ ] Accept invitation flow
- [ ] Role-based access control (RBAC)
- [ ] Team settings page (`/app/(dashboard)/settings/team/page.tsx`)

### Day 11-14: Workspace System

- [ ] Workspace CRUD operations
- [ ] Phase selector (dropdown in header)
- [ ] Module toggle system (`/app/(dashboard)/settings/modules/page.tsx`)
- [ ] Workspace switcher (header)
- [x] Navigation sidebar (collapsible)
  - [x] Dashboard link
  - [x] Mind Map link
  - [x] Features link
  - [x] Dependencies link
  - [x] Timeline link
  - [x] Review link (Pro badge)
  - [x] Analytics link
  - [x] Settings link
  - [x] **Improved with shadcn/ui components and workspace switcher**

---

## Deliverables

✅ Users can sign up, create teams, invite members (5 max on Free)
✅ Teams can create workspaces
✅ Module system functional (toggle on/off)
✅ Phase selector changes UI context
✅ Navigation structure complete

---

## Testing

- [ ] Sign up new user
- [ ] Create team
- [ ] Invite 2 members via email
- [ ] Accept invitations
- [ ] Create workspace
- [ ] Toggle modules on/off
- [ ] Verify RLS policies (can only see own team's data)

---

[← Back to Implementation Plan](README.md) | [Next: Week 3 →](week-3-mind-mapping.md)
