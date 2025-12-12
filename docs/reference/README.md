# 📚 Technical Reference Documentation

**Last Updated:** 2025-12-09

[← Back to Root](../../README.md)

---

## 📋 DOCUMENTS IN THIS FOLDER

### **[API_REFERENCE.md](API_REFERENCE.md)**
Complete API documentation for all 20+ endpoints.

**Use when:**
- Building API integrations
- Understanding request/response formats
- Implementing authentication
- Debugging API calls

**Covers:**
- Auth API (signup, login, session)
- Teams API (CRUD, members, invitations)
- Workspaces API (CRUD, modules, phases)
- Features API (CRUD, timeline items)
- Mind Maps API (canvas, nodes, convert to features)
- Dependencies API (links, critical path analysis)
- Review & Feedback API (public links, feedback submission)
- AI Assistant API (chat, suggestions, tool calling)
- Analytics API (dashboards, metrics)
- Webhooks (Razorpay, email delivery)

---

### **[ARCHITECTURE.md](ARCHITECTURE.md)**
System architecture documentation with visual Mermaid diagrams.

**Use when:**
- Understanding system design
- Planning new features
- Debugging data flows
- Onboarding new developers

**Includes:**
- 10+ Mermaid diagrams
- High-level architecture
- Multi-tenant architecture
- Database ERD (20+ tables)
- Authentication flow
- Data flows (mind map → features, dependencies)
- API architecture
- Real-time collaboration architecture
- Deployment architecture (Vercel + Supabase)
- Security architecture
- Technology stack breakdown

---

### **[CHANGELOG.md](CHANGELOG.md)**
Complete migration and feature implementation history.

**Use when:**
- Understanding what changed and when
- Debugging migration issues
- Tracking breaking changes
- Understanding undocumented decisions

**Tracks:**
- 44 database migrations
- Breaking changes
- Undocumented decisions
- Feature additions
- Schema changes

**Format:** Semantic versioning with dates

---

## 🔗 RELATED DOCUMENTATION

- **[Database Schema](../implementation/database-schema.md)** - Detailed database design
- **[Implementation Plan](../implementation/README.md)** - Week-by-week guide
- **[Planning Documents](../planning/README.md)** - Progress and timeline tracking
- **[CLAUDE.md](../../CLAUDE.md)** - Project guidelines and coding standards

---

## 🎯 QUICK REFERENCE LINKS

### Common API Routes
- `POST /api/auth/signup` - Create user account
- `POST /api/teams` - Create team
- `POST /api/workspaces` - Create workspace
- `POST /api/features` - Create feature
- `POST /api/mind-maps/:id/convert-to-features` - Convert nodes to features
- `POST /api/ai/chat` - Send AI chat message (streaming)

### Key Architecture Components
- **Frontend**: Next.js 15 App Router
- **Database**: Supabase PostgreSQL (multi-tenant)
- **Auth**: Supabase Auth (magic links + OAuth)
- **Real-time**: Supabase Realtime (WebSocket)
- **AI**: OpenRouter (Claude Haiku, Perplexity, Grok)
- **Payments**: Razorpay (subscriptions + metered billing)
- **Email**: Resend (transactional)
- **Deployment**: Vercel (serverless)

---

[← Back to Root](../../README.md)
