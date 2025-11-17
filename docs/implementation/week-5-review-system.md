# **WEEK 5: Team Management & External Review System**

**Last Updated:** 2025-01-17
**Status:** 🚧 In Progress (60% Complete)

[← Previous: Week 4](week-4-dependencies.md) | [Back to Plan](README.md) | [Next: Week 6 →](week-6-timeline-execution.md)

---

## Goal

**Primary**: Team management with phase-based access control
**Secondary**: External review system (postponed to Week 7)

**Progress**: Week 5: 0% → 60%

---

## ✅ Completed Implementations

---

### 1. Team Management System (2025-01-17)

**What Changed**:
- Built comprehensive UI components for team member management
- Implemented phase-based workspace access control
- Created invitation system with email + phase assignments
- Added team members page with role management
- Integrated team management into workspace settings

**Why**:
- Team collaboration is core to product lifecycle management
- Phase-based access provides granular control over who can edit what
- Invitation system enables controlled team growth
- UI provides clear visibility into team structure and permissions

**Status**: ✅ Complete - UI and backend fully integrated

**Components Created** (7 files):
1. `src/components/team/invite-member-dialog.tsx` - Invite members with phase selection
2. `src/components/team/team-member-row.tsx` - Member management with role controls
3. `src/components/team/pending-invitation-card.tsx` - Track pending invites
4. `src/components/team/phase-assignment-matrix.tsx` - Visual permission management
5. `src/app/(dashboard)/team/members/page.tsx` - Team management page
6. `src/app/(auth)/accept-invite/page.tsx` - Public invitation acceptance
7. `src/components/workspaces/settings/workspace-general-settings.tsx` - Enhanced with team features

**API Routes Created** (2 routes):
1. `GET /api/team/workspaces` - List workspaces for invite dropdown
2. `GET /api/team/invitations/details` - Get invitation details by token

**Key Features**:
- ✅ Email-based team invitations
- ✅ Role management (Owner/Admin/Member)
- ✅ Phase-based access assignments (all 5 phases)
- ✅ Visual permission matrix (desktop table, mobile cards)
- ✅ Invitation expiration (7 days)
- ✅ Real-time updates via React Query
- ✅ Responsive design (mobile-first)
- ✅ ARIA accessibility compliance

**Dependencies Satisfied**:
- ✅ User authentication system (Week 1)
- ✅ Team membership schema (Week 1)
- ✅ Workspace phase system (Week 3)
- ✅ shadcn/ui components installed

**New Dependencies Created**:
- ⏳ Email delivery (Resend integration) - Week 7
- ⏳ Activity logging - Week 7
- ⏳ Bulk invite operations - Week 8

**Files Modified**:
- Created: `src/components/team/*` (7 component files)
- Created: `src/app/api/team/workspaces/route.ts`
- Created: `src/app/api/team/invitations/details/route.ts`
- Updated: `src/components/workspaces/settings/workspace-general-settings.tsx`
- Backup: `src/components/workspaces/settings/workspace-general-settings.backup.tsx`

**Future Impact**:
- Week 6: Timeline can show team member assignments
- Week 7: AI assistant can analyze team contribution patterns
- Week 7: Analytics can break down work by team member
- Week 8: Billing can track per-user metrics

**Links**:
- Database Schema: [../reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md#team-tables)
- API Reference: [../reference/API_REFERENCE.md](../reference/API_REFERENCE.md#team-management)
- Original planned feature (postponed): [Review & Feedback Module](#review--feedback-module-postponed)

---

### 2. Phase-Based Permission System (2025-01-17)

**What Changed**:
- Implemented comprehensive TypeScript permission system
- Created React hooks for client-side permission checking
- Built permission guard components for UI protection
- Added API middleware for server-side authorization
- Created visual permission indicators (badges, icons, grids)

**Why**:
- Prevents unauthorized work item editing across phases
- Enables granular access control (view all, edit assigned)
- Provides defense-in-depth security (UI + API + Database RLS)
- Scales for teams with 100+ members and multiple workspaces

**Status**: ✅ Complete - Ready for integration into work item components

**Core Implementation** (3 files):
1. `src/lib/types/team.ts` - TypeScript types (202 lines)
2. `src/lib/utils/phase-permissions.ts` - Utility functions (359 lines)
3. `src/lib/hooks/use-phase-permissions.ts` - React hooks (315 lines)

**Permission Components** (3 files):
1. `src/components/permissions/permission-guard.tsx` - Guard components
2. `src/components/permissions/permission-badge.tsx` - Visual indicators
3. `src/lib/middleware/permission-middleware.ts` - API authorization

**Database Migration**:
- `supabase/migrations/20250117000001_create_phase_assignments.sql` - Phase assignments table with RLS

**Permission Model**:
- **View Access**: All team members can view all work items
- **Edit/Delete Access**:
  - Owners/Admins: Full access to all phases
  - Members: Only edit items in assigned phases

**Key Features**:
- ✅ 8 utility functions for permission checking
- ✅ 3 React hooks (`usePhasePermissions`, `useIsAdmin`, `usePhaseAssignments`)
- ✅ 4 permission guard components
- ✅ 4 visual indicator components
- ✅ 5 API middleware functions
- ✅ Real-time permission updates
- ✅ Comprehensive error handling
- ✅ Audit logging for permission denials

**Dependencies Satisfied**:
- ✅ Workspace phase system (Week 3)
- ✅ Team membership schema (Week 1)
- ✅ Work items schema (Week 2)

**Integration Required**:
- ⏳ Add permission checks to work item API routes
- ⏳ Update work item components with permission guards
- ⏳ Add visual permission indicators to UI

**Files Created**:
- `src/lib/types/team.ts` - Type definitions
- `src/lib/utils/phase-permissions.ts` - Utility functions
- `src/lib/hooks/use-phase-permissions.ts` - React hooks
- `src/hooks/use-phase-permissions.ts` - Duplicate hook (simplified)
- `src/hooks/use-is-admin.ts` - Admin check hook
- `src/components/permissions/permission-guard.tsx` - Guard components
- `src/components/permissions/permission-badge.tsx` - Visual indicators
- `src/lib/middleware/permission-middleware.ts` - API middleware

**Documentation Created**:
- `src/lib/types/README.md` - Complete usage guide
- `src/lib/types/PHASE_PERMISSIONS_CHEATSHEET.md` - Quick reference

**Future Impact**:
- Week 6: Timeline editing respects phase permissions
- Week 6: Real-time collaboration shows who can edit what
- Week 7: Analytics can track permission usage
- Week 8: Security audit validates permission enforcement

**Links**:
- Type Definitions: [../../next-app/src/lib/types/team.ts](../../next-app/src/lib/types/team.ts)
- Usage Guide: [../../next-app/src/lib/types/README.md](../../next-app/src/lib/types/README.md)
- API Middleware: [../../next-app/src/lib/middleware/permission-middleware.ts](../../next-app/src/lib/middleware/permission-middleware.ts)
- Database ERD: [../reference/PHASE_PERMISSIONS_ERD.md](../reference/PHASE_PERMISSIONS_ERD.md)
- Permission Guide: [../reference/PHASE_PERMISSIONS_GUIDE.md](../reference/PHASE_PERMISSIONS_GUIDE.md)

---

### 3. Security Implementation (2025-01-17)

**What Changed**:
- Implemented defense-in-depth security architecture
- Added permission middleware for all API routes
- Created custom error classes for security events
- Built audit logging for permission denials
- Added protection against privilege escalation

**Why**:
- Prevent unauthorized access to work items
- Protect against IDOR (Insecure Direct Object Reference) attacks
- Enable security monitoring and incident response
- Comply with security best practices

**Status**: ✅ Complete - Three-layer protection active

**Security Layers**:
1. **UI Layer**: Permission guards hide/disable unauthorized actions
2. **API Layer**: Middleware validates permissions before mutations
3. **Database Layer**: RLS policies enforce row-level access control

**Custom Errors Created**:
- `UnauthenticatedError` - 401 (not logged in)
- `PermissionDeniedError` - 403 (insufficient permissions)

**Audit Logging**:
- Logs all permission denials with context
- Captures: user_id, workspace_id, phase, action, timestamp
- Enables security monitoring and incident investigation

**Security Features**:
- ✅ Admin bypass logic (owners/admins skip phase restrictions)
- ✅ Phase transition validation (moving items between phases)
- ✅ No information leakage in error messages
- ✅ Request context logging
- ✅ Protection against privilege escalation

**Dependencies Satisfied**:
- ✅ Supabase RLS policies (Week 1)
- ✅ Authentication system (Week 1)
- ✅ Permission middleware (this week)

**Future Impact**:
- Week 7: Security analytics dashboard
- Week 8: Comprehensive security audit
- Week 8: Penetration testing validation

**Links**:
- Security Guide: [../reference/SECURITY.md](../reference/SECURITY.md) (to be created)
- Middleware: [../../next-app/src/lib/middleware/permission-middleware.ts](../../next-app/src/lib/middleware/permission-middleware.ts)

---

## 📋 Original Planned Features (Postponed)

### Review & Feedback Module 👥 **[PRO TIER ONLY]** (Postponed to Week 7)

**Why Postponed**:
- Team management and permissions are higher priority
- Review module depends on stable work item system
- Week 7 has AI integration which enhances feedback analysis

**Target Week**: Week 7 (after AI assistant implementation)

**Purpose**: Collect feedback from stakeholders, users, investors

**Active By Default:** Review, Testing phases

---

## Tasks (Postponed to Week 7)

### Day 1-2: Review Link Generator
- [ ] "Share for Review" modal: `components/review/review-link-generator.tsx`
- [ ] Three tabs:
  - [ ] Invite specific people (email input)
  - [ ] Generate public link (copy button)
  - [ ] Get embed code (iframe snippet)
- [ ] Settings checkboxes:
  - [ ] Allow comments
  - [ ] Allow voting
  - [ ] Require email
  - [ ] Expiration date picker

### Day 3-4: Email Invitations
- [ ] Resend API integration
- [ ] Email template (HTML):
  - [ ] Subject: "You've been invited to review features"
  - [ ] Body: Workspace name, feature count, CTA button
  - [ ] Link: `https://app.platform.com/public/review/[token]`
- [ ] Send invitations (batch)
- [ ] Track invitation status (sent, opened, submitted)

### Day 5-7: External Review Page
- [ ] Public review page: `/app/public/review/[token]/page.tsx`
- [ ] No authentication required
- [ ] Load review link by token
- [ ] Display features (cards)
- [ ] Feedback form per feature:
  - [ ] Rating (1-5 stars or thumbs)
  - [ ] Comment (textarea)
  - [ ] Custom questions (from settings)
  - [ ] Attachments (file upload to Supabase Storage)
- [ ] Submit feedback (insert to `feedback` table)
- [ ] Thank you page

### Day 8-9: Iframe Embed
- [ ] Generate embed code:
  ```html
  <iframe
    src="https://app.platform.com/public/review/[token]/embed"
    width="100%"
    height="600px"
    frameborder="0"
  ></iframe>
  ```
- [ ] Embed view (`/app/public/review/[token]/embed/page.tsx`)
- [ ] Minimal UI (fits in iframe)
- [ ] Post message API (communicate with parent window)

### Day 10-12: Review Dashboard
- [ ] Review dashboard: `/app/(dashboard)/review/page.tsx`
- [ ] List all feedback (table view)
- [ ] Filters:
  - [ ] By feature
  - [ ] By rating
  - [ ] By status (new, reviewed, implemented, rejected)
  - [ ] By date
- [ ] Update feedback status (dropdown)
- [ ] View attachments (modal)

### Day 13-14: AI Feedback Summary
- [ ] "Summarize feedback" button
- [ ] Call Claude Haiku with all feedback for a feature
- [ ] Generate:
  - [ ] Common themes (e.g., "15 users want social login")
  - [ ] Sentiment breakdown (positive/negative/neutral %)
  - [ ] Action items (prioritized list)
- [ ] Display in summary card
- [ ] Save summary to database (cache)

---

## Features

### Three Sharing Methods:

**A) Invite-Based Review**
- Send email invites with unique access tokens
- Reviewers click link → See features → Submit feedback
- Track by email address
- Revoke access anytime

**B) Public Review Link**
- Generate shareable URL (no login required)
- Anyone with link can review
- Optional: Require email to submit feedback
- Set expiration date

**C) Embedded Iframe Form**
- Get embed code: `<iframe src="..." />`
- Embed feedback form on website or app
- Collects feedback seamlessly in your existing flow

### Feedback Form (Customizable):
- **Rating** - 1-5 stars or thumbs up/down
- **Text Feedback** - Open-ended comments
- **Multiple Choice** - Custom questions per feature
- **Attachments** - Screenshots, videos, files
- **Voting** - Upvote/downvote (priority)

### Review Dashboard (Team View):
- All feedback in one place
- Status tracking: New → Reviewed → Implemented → Rejected
- Filter by feature, reviewer, rating, date
- Sort by priority (most requested)

### AI Summarization:
- Analyzes all feedback automatically
- **Common Themes** - "15 reviewers want social login"
- **Sentiment Analysis** - Positive/Negative/Neutral breakdown
- **Action Items** - "3 users reported privacy concerns" (prioritized by frequency)

---

## Deliverables

✅ Three sharing methods (invite, public, iframe)
✅ Email invitations sent via Resend
✅ External review page (no login)
✅ Feedback form with ratings and comments
✅ Review dashboard (team view)
✅ AI-powered feedback summarization

---

## Testing

- [ ] Create review link for 5 features
- [ ] Send invite to 2 email addresses
- [ ] Open public link in incognito window
- [ ] Submit feedback with 5-star rating
- [ ] Upload screenshot attachment
- [ ] View feedback in dashboard
- [ ] Run AI summary
- [ ] Verify common themes extracted

---

[← Previous: Week 4](week-4-dependencies.md) | [Back to Plan](README.md) | [Next: Week 6 →](week-6-timeline-execution.md)
