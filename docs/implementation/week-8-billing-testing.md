# **WEEK 8: Billing, Testing & Launch**

**Last Updated:** 2025-11-30
**Status:** ❌ Not Started

[← Previous: Week 7](week-7/README.md) | [Back to Plan](README.md)

---

## Goal
Razorpay integration (India-compatible), UI polish, production-ready

> **Note**: Using Razorpay instead of Stripe because Stripe is invite-only in India.

---

## Tasks

### Day 1-3: Razorpay Integration
- [ ] Set up Razorpay account (razorpay.com)
  - Select "Individual/Unregistered Business" type
  - Documents needed: PAN card + Aadhaar + Bank account (savings OK)
  - No GST required (exempt under ₹40 lakh turnover)
  - Verification takes 24-48 hours
- [ ] Install npm package: `npm install razorpay @types/razorpay`
- [ ] Configure environment variables:
  ```env
  # Start with test keys, switch to live after verification
  RAZORPAY_KEY_ID=rzp_test_xxxxx
  RAZORPAY_KEY_SECRET=xxxxx
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
  ```
- [ ] Create subscription plans in Razorpay Dashboard:
  - [ ] Pro plan: ₹3,000/month (recurring)
  - [ ] Additional user: ₹400/month (metered)
- [ ] Pricing page: `/app/(marketing)/pricing/page.tsx`
  - [ ] Free vs Pro comparison table
  - [ ] [Upgrade to Pro] button
- [ ] API Routes:
  - [ ] `/api/razorpay/create-order` - Create payment order
  - [ ] `/api/razorpay/verify` - Verify payment signature
  - [ ] `/api/razorpay/subscription` - Manage subscriptions
- [ ] Webhook handler: `/app/api/webhooks/razorpay/route.ts`
  - [ ] `subscription.activated`
  - [ ] `subscription.charged`
  - [ ] `subscription.cancelled`
  - [ ] `payment.failed`
- [ ] Update `teams.plan` and `subscriptions` table

### Day 4-5: Feature Gates
- [ ] Implement `canUpgrade()` helper (`lib/utils/billing.ts`)
- [ ] Check plan before:
  - [ ] Adding 6th team member (Free limit: 5)
  - [ ] Sending AI message (Free limit: 50/month)
  - [ ] Enabling Review module (Pro only)
  - [ ] Enabling Agentic AI (Pro only)
  - [ ] Creating custom dashboard (Pro only)
- [ ] Show upgrade modal when limit reached

### Day 6-7: Customer Portal
- [ ] Billing settings page: `/app/(dashboard)/settings/billing/page.tsx`
- [ ] Display current plan (Free/Pro)
- [ ] Show usage:
  - [ ] Team members (5/5 on Free)
  - [ ] AI messages (847/1,000 this month)
  - [ ] Storage (1.2GB/50GB)
- [ ] [Upgrade to Pro] button
- [ ] [Manage Subscription] button (Razorpay customer portal)

### Day 8-10: UI Polish
- [ ] Add loading states (skeletons):
  - [ ] Feature cards
  - [ ] Timeline
  - [ ] Analytics charts
- [ ] Error boundaries (`components/shared/error-boundary.tsx`)
- [ ] Empty states:
  - [ ] No features yet (illustration + CTA)
  - [ ] No workspaces (onboarding flow)
  - [ ] No feedback (instructions)
- [ ] Onboarding tooltips (Shepherd.js or custom)
- [ ] Mobile responsive design:
  - [ ] Collapsible sidebar (hamburger menu)
  - [ ] Stack cards vertically on small screens
  - [ ] Touch-friendly controls
- [ ] Dark mode toggle (Settings → Appearance)

### Day 11-12: Testing & QA
- [ ] E2E tests (Playwright):
  - [ ] Auth flow (signup → onboarding → first workspace)
  - [ ] Team creation and invites
  - [ ] Feature CRUD
  - [ ] Mind map creation
  - [ ] External review flow
  - [ ] Razorpay upgrade flow (test mode)
- [ ] Unit tests (Jest):
  - [ ] Permission checks (`canAddMember()`, `canUpgrade()`)
  - [ ] Billing calculations
  - [ ] Feature gate logic
- [ ] Load testing (Vercel Analytics)
- [ ] Security audit (dependency check)

### Day 13-14: Documentation & Launch
- [ ] **User Documentation:**
  - [ ] Getting Started Guide
  - [ ] Feature walkthroughs (10 modules)
  - [ ] Video tutorials (record 5 screencasts)
  - [ ] FAQ
  - [ ] Keyboard shortcuts reference
- [ ] **Developer Documentation:**
  - [ ] README.md (setup instructions)
  - [ ] CONTRIBUTING.md (PR guidelines)
  - [ ] CODE_OF_CONDUCT.md
  - [ ] ARCHITECTURE.md (system design)
  - [ ] API.md (component API reference)
  - [ ] DATABASE_SCHEMA.md
- [ ] **Self-Hosting Guide:**
  - [ ] Docker Compose setup
  - [ ] Environment variables reference
  - [ ] Supabase project setup
  - [ ] Deployment guides (DigitalOcean, AWS, Railway)
  - [ ] Migration from vanilla app (import JSON)
- [ ] **Open Source Release:**
  - [ ] GitHub repository setup
  - [ ] LICENSE (MIT)
  - [ ] Issue templates (bug, feature)
  - [ ] PR template
  - [ ] CI/CD pipeline (GitHub Actions)
  - [ ] CHANGELOG.md
- [ ] **Deploy to Production:**
  - [ ] Vercel deployment
  - [ ] Custom domain (optional)
  - [ ] Environment variables
  - [ ] Sentry (error tracking)
  - [ ] Plausible (analytics)
- [ ] **Marketing Materials:**
  - [ ] Landing page (`/app/(marketing)/page.tsx`)
  - [ ] Screenshots (10 key features)
  - [ ] Demo video (2-3 minutes)
  - [ ] Product Hunt post (prepare)
  - [ ] Social media posts

---

## Project Structure {#project-structure}

```
roadmap-platform/
├── next-app/                           # Next.js application
│   ├── app/
│   │   ├── (auth)/                     # Auth route group (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── onboarding/page.tsx     # Create first team
│   │   ├── (dashboard)/                # Dashboard route group (with sidebar)
│   │   │   ├── layout.tsx              # Dashboard layout (sidebar + header)
│   │   │   ├── dashboard/page.tsx      # Feature cards view
│   │   │   ├── mindmap/page.tsx        # Mind map canvas (ReactFlow)
│   │   │   ├── features/
│   │   │   │   ├── page.tsx            # Feature list
│   │   │   │   └── [id]/page.tsx       # Feature detail
│   │   │   ├── dependencies/page.tsx   # Dependency graph (ReactFlow)
│   │   │   ├── timeline/page.tsx       # Timeline view (Gantt)
│   │   │   ├── review/page.tsx         # Review dashboard (Pro)
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx            # Pre-built dashboards
│   │   │   │   └── custom/page.tsx     # Custom dashboard builder (Pro)
│   │   │   └── settings/
│   │   │       ├── modules/page.tsx    # Enable/disable modules
│   │   │       ├── team/page.tsx       # Team management
│   │   │       ├── ai/page.tsx         # AI model config
│   │   │       └── billing/page.tsx    # Razorpay billing
│   │   ├── (marketing)/                # Marketing route group
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   └── docs/[...slug]/page.tsx # MDX documentation
│   │   ├── public/
│   │   │   └── review/[token]/
│   │   │       ├── page.tsx            # External review (no auth)
│   │   │       └── embed/page.tsx      # Iframe embed
│   │   └── api/
│   │       ├── auth/callback/route.ts  # Supabase Auth callback
│   │       ├── webhooks/razorpay/route.ts # Razorpay webhook handler
│   │       └── ai/
│   │           ├── chat/route.ts       # Streaming chat
│   │           └── tools/[tool]/route.ts # AI tool execution
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (30+)
│   │   ├── dashboard/
│   │   │   ├── feature-card.tsx
│   │   │   ├── metrics-panel.tsx
│   │   │   └── workspace-selector.tsx
│   │   ├── mindmap/
│   │   │   ├── mind-map-canvas.tsx      # Main ReactFlow canvas
│   │   │   ├── node-types/              # 5 custom node components
│   │   │   └── ai-mind-map-tools.tsx    # AI buttons
│   │   ├── timeline/
│   │   │   ├── timeline-grid.tsx        # react-big-calendar wrapper
│   │   │   └── dependency-arrows.tsx    # SVG arrows
│   │   ├── dependencies/
│   │   │   └── dependency-graph.tsx     # ReactFlow graph
│   │   ├── review/
│   │   │   ├── review-link-generator.tsx
│   │   │   └── feedback-form.tsx
│   │   ├── analytics/
│   │   │   ├── dashboard-builder.tsx    # Drag-and-drop builder
│   │   │   └── chart-widgets/           # 10 chart types
│   │   ├── ai/
│   │   │   ├── chat-panel.tsx           # Left sidebar chat
│   │   │   └── agentic-panel.tsx        # Right sidebar agent
│   │   └── shared/
│   │       ├── sidebar-nav.tsx          # Main navigation
│   │       └── rich-text-editor.tsx     # Tiptap editor
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Client-side Supabase
│   │   │   ├── server.ts                # Server-side Supabase (RSC)
│   │   │   └── types.ts                 # Generated TypeScript types
│   │   ├── razorpay/
│   │   │   ├── client.ts                # Razorpay API client
│   │   │   └── webhooks.ts              # Webhook handler logic
│   │   ├── ai/
│   │   │   ├── openrouter.ts            # OpenRouter API client
│   │   │   ├── model-router.ts          # Select optimal model
│   │   │   └── tools/                   # 20+ AI tool implementations
│   │   └── utils/
│   │       ├── permissions.ts           # RBAC
│   │       └── billing.ts               # Feature gates
│   ├── hooks/
│   │   ├── use-team.ts                  # Team context hook
│   │   └── use-workspace.ts             # Workspace context hook
│   ├── store/                            # Zustand stores
│   │   ├── team-store.ts                # Current team state
│   │   └── workspace-store.ts           # Current workspace state
│   ├── supabase/migrations/             # SQL migration files
│   ├── tests/
│   │   ├── e2e/                         # Playwright tests
│   │   └── unit/                        # Jest tests
│   └── package.json
├── docs/                                 # Documentation (Markdown)
│   ├── getting-started.md
│   ├── user-guide/
│   ├── developer/
│   └── self-hosting/
├── .github/workflows/
│   ├── ci.yml                           # Lint and test on PR
│   └── deploy.yml                       # Auto-deploy to Vercel
├── LICENSE                              # MIT License
└── README.md                            # Main project README
```

---

## Deliverables

✅ Razorpay billing fully integrated
✅ Feature gates enforced (5 users, 1,000 msgs)
✅ UI polished (loading, errors, empty states)
✅ Mobile responsive
✅ E2E and unit tests passing
✅ Comprehensive documentation (user + dev + self-hosting)
✅ Open source on GitHub (MIT License)
✅ Deployed to production (Vercel)
✅ Monitoring active (Sentry, Plausible)

---

## Testing

- [ ] Run Playwright E2E suite (all tests pass)
- [ ] Run Jest unit tests (all tests pass)
- [ ] Manual testing checklist:
  - [ ] Sign up new user
  - [ ] Create team
  - [ ] Invite 5 members
  - [ ] Try to invite 6th member (should block)
  - [ ] Create workspace
  - [ ] Create mind map with 10 nodes
  - [ ] Convert nodes to features
  - [ ] Create dependencies
  - [ ] View timeline
  - [ ] Share for review (public link)
  - [ ] Submit feedback
  - [ ] View analytics
  - [ ] Upgrade to Pro
  - [ ] Verify all features unlocked
  - [ ] Send 1,000 AI messages (should hit limit)
  - [ ] Add custom API key
  - [ ] Test on mobile device

---

[← Previous: Week 7](week-7/README.md) | [Back to Plan](README.md)
