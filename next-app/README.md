# Product Lifecycle Management Platform

A modern, multi-tenant SaaS platform for managing product roadmaps with phase-based workflows, mind mapping, and AI-powered features.

## Tech Stack

- **Framework**: Next.js 15 with App Router, TypeScript, Turbopack
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Auth**: Supabase Auth (magic links + OAuth)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **State**: Zustand + React Query
- **Billing**: Stripe
- **AI**: OpenRouter (multi-model routing)
- **Email**: Resend

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

Follow the comprehensive guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Quick steps:
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Apply the database migration from `supabase/migrations/`
3. Copy your credentials to `.env.local`

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
next-app/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/              # Authentication pages
│   │   ├── (dashboard)/         # Main app pages
│   │   └── api/                 # API routes
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── ...                  # Feature components
│   ├── lib/
│   │   ├── supabase/            # Supabase clients
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   ├── middleware.ts    # Auth middleware
│   │   │   └── types.ts         # Database types
│   │   └── utils.ts             # Utility functions
│   └── middleware.ts            # Next.js middleware
├── supabase/
│   └── migrations/              # Database migrations
├── public/                      # Static assets
└── README.md
```

## Database Schema

### Core Tables

- **users**: User profiles (extends Supabase auth)
- **teams**: Organizations with billing
- **team_members**: User membership with roles
- **workspaces**: Projects with phase-based workflows
- **features**: Main features/epics
- **timeline_items**: MVP/SHORT/LONG breakdown
- **mind_maps**: Visual brainstorming canvas
- **review_links**: External feedback system

### Multi-Tenancy

All data is isolated by `team_id` with Row Level Security (RLS) policies ensuring users can only access their team's data.

### Phases

Workspaces progress through lifecycle phases:
1. **research** - Discovery and validation
2. **planning** - Detailed planning
3. **review** - Stakeholder review
4. **execution** - Building features
5. **testing** - Quality assurance
6. **metrics** - Success measurement
7. **complete** - Project complete

### Modules

Each workspace can enable/disable features:
- `research` - AI research chat
- `mind_map` - Visual canvas
- `features` - Feature management
- `dependencies` - Dependency graph
- `review` - External feedback (Pro only)
- `execution` - Project execution
- `collaboration` - Real-time collab (Pro only)
- `timeline` - Gantt timeline
- `analytics` - Metrics dashboard
- `ai` - AI assistant

## Features

### Phase 1: Foundation (Week 1-2) ✅
- [x] Next.js 15 setup with TypeScript
- [x] Supabase multi-tenant database schema
- [x] Authentication middleware
- [ ] Auth pages (login, signup, onboarding)
- [ ] Team management
- [ ] Workspace CRUD

### Phase 2: Core Features (Week 3-4)
- [ ] Mind mapping with ReactFlow
- [ ] Feature management
- [ ] Timeline visualization
- [ ] Dependency graph

### Phase 3: Collaboration (Week 5-6)
- [ ] External review system
- [ ] Real-time collaboration
- [ ] Team roles and permissions

### Phase 4: AI & Analytics (Week 7-8)
- [ ] AI assistant integration
- [ ] OpenRouter multi-model routing
- [ ] Analytics dashboards
- [ ] Usage tracking

### Phase 5: Billing & Launch (Week 8)
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Usage limits enforcement
- [ ] Production deployment

## Development

### Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Database Migrations

Create a new migration:

```bash
# Create migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Apply migrations via Supabase Dashboard SQL Editor
# Or use Supabase CLI:
supabase db push
```

### Type Generation

Generate TypeScript types from Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-ref > src/lib/supabase/types.ts
```

## Pricing Model

### Free Tier
- 5 team members
- 50 AI messages/month (shared)
- Basic features
- Community support

### Pro Tier
- **$40/month** base (includes 5 users)
- **+$5/user/month** for additional users
- **1,000 AI messages per user per month**
- All features unlocked
- Priority support
- External review system
- Real-time collaboration
- Custom analytics

### Custom Models (Add-on)
- Users provide their own API keys
- Access to premium models: GPT-4o, Claude Opus, Gemini Pro, etc.
- No additional cost (uses user's API credits)

## AI Integration

### Model Routing Strategy

- **Primary (95%)**: Claude Haiku 4.5 - Fast, cheap, excellent quality
- **Research**: Perplexity Sonar - Deep research and citations
- **Semantic**: Exa API - Finding similar content
- **Speed**: Grok 4 Fast - Auto-complete and suggestions
- **Fallback**: GLM-4-Plus - Free tier overflow

### AI Features

- Feature generation from text
- Dependency suggestion
- Risk analysis
- Time estimation
- Mind map generation
- Research assistance
- Code snippet generation
- Documentation writing

## Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Supabase
supabase login       # Login to Supabase CLI
supabase link        # Link to your project
supabase db push     # Apply migrations
supabase gen types   # Generate TypeScript types
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `RESEND_API_KEY`

## Contributing

This is an open-source project (MIT License). Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- Documentation: [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
- Supabase Setup: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Issues: [GitHub Issues](https://github.com/yourusername/product-lifecycle-platform/issues)

## License

MIT License - See LICENSE file for details

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.
