# 📘 API Reference

**Last Updated:** 2026-01-14
**Version:** 1.3
**Base URL (Production):** `https://platform-test-cyan.vercel.app`
**Base URL (Development):** `http://localhost:3000`

[Back to Reference](../README.md)

---

## 🔐 Authentication

All API routes require authentication unless explicitly marked as **[PUBLIC]**.

**Authentication Method:** Supabase Auth (session-based)

- Client-side: Automatic via `@supabase/auth-helpers-nextjs`
- Server-side: Extract session from request headers

**Headers Required:**

```http
Cookie: sb-access-token=<token>; sb-refresh-token=<refresh-token>
```

---

## 📋 Documents

| Document | Lines | Endpoints |
|----------|-------|-----------|
| [auth-users.md](auth-users.md) | ~415 | Auth, User, Teams, Team Members |
| [workspaces.md](workspaces.md) | ~545 | Workspaces, Work Items, Timeline Items, Product Tasks |
| [knowledge.md](knowledge.md) | ~588 | Resources, Mind Maps, Dependencies, Features, Review & Feedback |
| [ai-analytics.md](ai-analytics.md) | ~576 | AI Assistant, Strategies, Analytics |
| [platform.md](platform.md) | ~361 | Integrations, Webhooks, Common Patterns, SDK |

---

## Quick Reference

### Auth & Users (auth-users.md)

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/users/me` - Get current user
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/invitations` - Invite member

### Workspaces (workspaces.md)

- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/work-items` - List work items
- `POST /api/work-items` - Create work item
- `GET /api/timeline-items` - List timeline items
- `GET /api/product-tasks` - List tasks

### Knowledge (knowledge.md)

- `GET /api/resources` - List resources
- `GET /api/mind-maps` - List mind maps
- `POST /api/mind-maps` - Create mind map
- `GET /api/dependencies` - List dependencies
- `GET /api/feedback` - List feedback

### AI & Analytics (ai-analytics.md)

- `POST /api/ai/sdk-chat` - AI chat (streaming)
- `POST /api/ai/agent` - Agentic mode
- `GET /api/strategies` - List strategies
- `GET /api/analytics/overview` - Dashboard data

### Platform (platform.md)

- `POST /api/mcp/oauth` - MCP OAuth flow
- `GET /api/mcp/connections` - List connections
- `POST /api/webhooks` - Create webhook

---

[Back to Reference](../README.md)
