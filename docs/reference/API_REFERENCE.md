# 📘 API REFERENCE

**Last Updated:** 2025-12-03
**Version:** 1.3
**Base URL (Production):** `https://platform-test-cyan.vercel.app`
**Base URL (Development):** `http://localhost:3000`

---

## 🔐 AUTHENTICATION

All API routes require authentication unless explicitly marked as **[PUBLIC]**.

**Authentication Method:** Supabase Auth (session-based)
- Client-side: Automatic via `@supabase/auth-helpers-nextjs`
- Server-side: Extract session from request headers

**Headers Required:**
```http
Cookie: sb-access-token=<token>; sb-refresh-token=<refresh-token>
```

---

## 📋 TABLE OF CONTENTS

1. [Auth API](#auth-api)
2. [User API](#user-api) *(New)*
3. [Teams API](#teams-api)
4. [Team Members API](#team-members-api) *(New)*
5. [Workspaces API](#workspaces-api)
6. [Work Items API](#work-items-api) *(New)*
7. [Timeline Items API](#timeline-items-api) *(New)*
8. [Product Tasks API](#product-tasks-api) *(New)*
9. [Resources API](#resources-api) *(New)*
10. [Mind Maps API](#mind-maps-api)
11. [Dependencies API](#dependencies-api)
12. [Review & Feedback API](#review-feedback-api)
13. [Search API](#search-api) *(New)*
14. [AI Assistant API](#ai-assistant-api)
15. [Strategies API](#strategies-api) *(New)*
16. [Analytics API](#analytics-api)
17. [Integrations API](#integrations-api) *(New - MCP Gateway)*
18. [Webhooks](#webhooks)

---

## 🔐 AUTH API

### POST `/api/auth/signup`
**[PUBLIC]** Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

---

### POST `/api/auth/login`
**[PUBLIC]** Sign in existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": { /* user object */ },
  "session": { /* session object */ }
}
```

---

### POST `/api/auth/logout`
Sign out current user

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/session`
Get current user session

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "expires_at": "2025-01-15T12:00:00Z"
  }
}
```

---

## 👤 USER API

### GET `/api/user/profile`
Get current user profile

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2025-01-14T12:00:00Z"
}
```

---

### GET `/api/user/teams`
Get all teams the current user belongs to

**Response (200 OK):**
```json
{
  "teams": [
    {
      "id": "1736857200000",
      "name": "Acme Corp",
      "role": "owner",
      "plan": "pro"
    }
  ]
}
```

---

## 👥 TEAMS API

### POST `/api/teams`
Create a new team

**Request Body:**
```json
{
  "name": "Acme Corp",
  "plan": "free"
}
```

**Response (201 Created):**
```json
{
  "team": {
    "id": "1736857200000",
    "name": "Acme Corp",
    "owner_id": "uuid",
    "plan": "free",
    "member_count": 1,
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/teams`
List all teams for current user

**Response (200 OK):**
```json
{
  "teams": [
    {
      "id": "1736857200000",
      "name": "Acme Corp",
      "role": "owner",
      "member_count": 5,
      "plan": "pro"
    }
  ]
}
```

---

### GET `/api/teams/:teamId`
Get team details

**Response (200 OK):**
```json
{
  "team": {
    "id": "1736857200000",
    "name": "Acme Corp",
    "owner_id": "uuid",
    "plan": "pro",
    "member_count": 5,
    "stripe_customer_id": "cus_xxx",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "members": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "joined_at": "2025-01-14T12:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/teams/:teamId`
Update team details

**Request Body:**
```json
{
  "name": "Acme Corporation"
}
```

**Response (200 OK):**
```json
{
  "team": { /* updated team object */ }
}
```

---

### DELETE `/api/teams/:teamId`
Delete team (owner only)

**Response (204 No Content)**

---

### POST `/api/teams/:teamId/members`
Invite team member

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response (201 Created):**
```json
{
  "invitation": {
    "id": "1736857200001",
    "email": "newmember@example.com",
    "expires_at": "2025-01-21T12:00:00Z"
  },
  "message": "Invitation sent via email"
}
```

---

### DELETE `/api/teams/:teamId/members/:userId`
Remove team member

**Response (204 No Content)**

---

## 👥 TEAM MEMBERS API

### GET `/api/team/members`
Get all members of current team

**Query Parameters:**
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "members": [
    {
      "id": "1736857200001",
      "user_id": "uuid",
      "email": "member@example.com",
      "name": "Jane Doe",
      "role": "member",
      "phase_assignments": ["research", "review"],
      "joined_at": "2025-01-14T12:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/team/members/:id`
Update team member role

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "member": {
    "id": "1736857200001",
    "role": "admin"
  }
}
```

---

### GET `/api/team/invitations`
Get all pending invitations

**Response (200 OK):**
```json
{
  "invitations": [
    {
      "id": "1736857200002",
      "email": "newuser@example.com",
      "role": "member",
      "phase_assignments": ["research"],
      "expires_at": "2025-01-21T12:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

### POST `/api/team/invitations`
Send team invitation with phase assignments

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member",
  "phase_assignments": ["research", "review"]
}
```

**Response (201 Created):**
```json
{
  "invitation": {
    "id": "1736857200002",
    "email": "newuser@example.com",
    "token": "invite_token_xxx"
  }
}
```

---

### POST `/api/team/invitations/accept`
Accept a team invitation

**Request Body:**
```json
{
  "token": "invite_token_xxx"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "team_id": "1736857200000"
}
```

---

### GET `/api/team/phase-assignments`
Get phase assignments for team members

**Response (200 OK):**
```json
{
  "assignments": [
    {
      "user_id": "uuid",
      "phase": "research",
      "is_lead": true
    }
  ]
}
```

---

### POST `/api/team/phase-assignments`
Assign user to phase

**Request Body:**
```json
{
  "user_id": "uuid",
  "phase": "research",
  "is_lead": false
}
```

**Response (201 Created):**
```json
{
  "assignment": {
    "id": "1736857200003",
    "user_id": "uuid",
    "phase": "research"
  }
}
```

---

## 🏢 WORKSPACES API

### POST `/api/workspaces`
Create workspace

**Request Body:**
```json
{
  "team_id": "1736857200000",
  "name": "Mobile App Project",
  "description": "Building a fitness tracking app",
  "phase": "research",
  "enabled_modules": ["research", "mind_map", "features"]
}
```

**Response (201 Created):**
```json
{
  "workspace": {
    "id": "1736857200002",
    "team_id": "1736857200000",
    "name": "Mobile App Project",
    "phase": "research",
    "enabled_modules": ["research", "mind_map", "features"],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/workspaces`
List all workspaces for team

**Query Parameters:**
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "workspaces": [
    {
      "id": "1736857200002",
      "name": "Mobile App Project",
      "phase": "execution",
      "feature_count": 25
    }
  ]
}
```

---

### GET `/api/workspaces/:workspaceId`
Get workspace details

**Response (200 OK):**
```json
{
  "workspace": {
    "id": "1736857200002",
    "team_id": "1736857200000",
    "name": "Mobile App Project",
    "phase": "execution",
    "enabled_modules": ["features", "timeline", "execution"],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### PATCH `/api/workspaces/:workspaceId`
Update workspace

**Request Body:**
```json
{
  "phase": "review",
  "enabled_modules": ["features", "timeline", "review"]
}
```

**Response (200 OK):**
```json
{
  "workspace": { /* updated workspace */ }
}
```

---

### DELETE `/api/workspaces/:workspaceId`
Delete workspace

**Response (204 No Content)**

---

## 📋 FEATURES API

### POST `/api/features`
Create feature

**Request Body:**
```json
{
  "team_id": "1736857200000",
  "workspace_id": "1736857200002",
  "name": "User Authentication",
  "type": "Feature",
  "purpose": "Secure login system with email/password and social OAuth",
  "timeline_items": [
    {
      "timeline": "MVP",
      "usp": "Basic email/password login",
      "difficulty": "Medium",
      "integration_type": "Backend"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "feature": {
    "id": "1736857200003",
    "name": "User Authentication",
    "type": "Feature",
    "purpose": "Secure login system...",
    "timeline_items": [ /* timeline items */ ],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/features`
List features

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `timeline` (optional): Filter by timeline (MVP, SHORT, LONG)
- `status` (optional): Filter by status

**Response (200 OK):**
```json
{
  "features": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "timeline_items": [ /* items */ ],
      "dependencies_count": 3
    }
  ],
  "total": 25
}
```

---

### GET `/api/features/:featureId`
Get feature details

**Response (200 OK):**
```json
{
  "feature": {
    "id": "1736857200003",
    "name": "User Authentication",
    "type": "Feature",
    "purpose": "Secure login system...",
    "timeline_items": [ /* timeline items */ ],
    "dependencies": [ /* linked items */ ],
    "created_at": "2025-01-14T12:00:00Z",
    "updated_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### PATCH `/api/features/:featureId`
Update feature

**Request Body:**
```json
{
  "purpose": "Updated description",
  "timeline_items": [ /* updated items */ ]
}
```

**Response (200 OK):**
```json
{
  "feature": { /* updated feature */ }
}
```

---

### DELETE `/api/features/:featureId`
Delete feature

**Response (204 No Content)**

---

## 📝 WORK ITEMS API

Work Items are the primary unit of trackable work (features, bugs, enhancements).

### GET `/api/work-items`
Get all work items for a workspace

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `type`: Filter by type (concept, feature, bug)
- `is_enhancement`: Filter for enhancement features (boolean)
- `status`: Filter by status
- `phase`: Filter by phase

**Response (200 OK):**
```json
{
  "work_items": [
    {
      "id": "1736857200010",
      "workspace_id": "1736857200002",
      "name": "User Authentication",
      "type": "feature",
      "status": "in_progress",
      "phase": "research",
      "parent_id": null,
      "is_epic": false,
      "created_at": "2025-01-14T12:00:00Z"
    }
  ]
}
```

---

### POST `/api/work-items`
Create a new work item

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "name": "Payment Integration",
  "type": "feature",
  "purpose": "Enable payment processing",
  "phase": "research",
  "parent_id": null
}
```

**Response (201 Created):**
```json
{
  "work_item": {
    "id": "1736857200011",
    "name": "Payment Integration",
    "type": "feature"
  }
}
```

---

### GET `/api/work-items/:id`
Get work item details

**Response (200 OK):**
```json
{
  "work_item": {
    "id": "1736857200010",
    "name": "User Authentication",
    "type": "feature",
    "status": "in_progress",
    "phase": "research",
    "timeline_items": [],
    "children": []
  }
}
```

---

### PATCH `/api/work-items/:id`
Update work item

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "completed",
  "phase": "complete"
}
```

**Response (200 OK):**
```json
{
  "work_item": { /* updated */ }
}
```

---

### PATCH `/api/work-items/:id/status`
Update work item status only

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### GET `/api/work-items/:id/children`
Get child work items (for epics)

**Response (200 OK):**
```json
{
  "children": [
    {
      "id": "1736857200012",
      "name": "Login Page",
      "type": "feature",
      "parent_id": "1736857200010"
    }
  ]
}
```

---

## 📅 TIMELINE ITEMS API

Timeline items represent breakdown of work items into MVP/SHORT/LONG phases.

### GET `/api/timeline-items`
Get timeline items for a work item

**Query Parameters:**
- `work_item_id` (required): Parent work item ID

**Response (200 OK):**
```json
{
  "timeline_items": [
    {
      "id": "1736857200020",
      "work_item_id": "1736857200010",
      "timeline": "MVP",
      "usp": "Basic login functionality",
      "difficulty": "Medium",
      "status": "not_started",
      "start_date": null,
      "end_date": null
    }
  ]
}
```

---

### POST `/api/timeline-items`
Create timeline item

**Request Body:**
```json
{
  "work_item_id": "1736857200010",
  "timeline": "MVP",
  "usp": "Basic login",
  "difficulty": "Medium"
}
```

**Response (201 Created):**
```json
{
  "timeline_item": {
    "id": "1736857200021",
    "timeline": "MVP"
  }
}
```

---

### PATCH `/api/timeline-items/:id`
Update timeline item

**Request Body:**
```json
{
  "status": "in_progress",
  "start_date": "2025-01-20",
  "end_date": "2025-02-01"
}
```

**Response (200 OK):**
```json
{
  "timeline_item": { /* updated */ }
}
```

---

## ✅ PRODUCT TASKS API

Product tasks are granular execution items under timeline items.

### GET `/api/product-tasks`
Get tasks for a timeline item

**Query Parameters:**
- `timeline_item_id` (required): Parent timeline item ID
- `status`: Filter by status

**Response (200 OK):**
```json
{
  "tasks": [
    {
      "id": "1736857200030",
      "timeline_item_id": "1736857200020",
      "title": "Create login form component",
      "description": "Build React component for login",
      "status": "not_started",
      "priority": "high",
      "assignee_id": null,
      "due_date": "2025-01-25"
    }
  ]
}
```

---

### POST `/api/product-tasks`
Create a new task

**Request Body:**
```json
{
  "timeline_item_id": "1736857200020",
  "title": "Create login form",
  "description": "Build the form component",
  "priority": "high",
  "due_date": "2025-01-25"
}
```

**Response (201 Created):**
```json
{
  "task": {
    "id": "1736857200031",
    "title": "Create login form"
  }
}
```

---

### PATCH `/api/product-tasks/:id`
Update task

**Request Body:**
```json
{
  "status": "completed",
  "assignee_id": "uuid"
}
```

**Response (200 OK):**
```json
{
  "task": { /* updated */ }
}
```

---

### GET `/api/product-tasks/stats`
Get task statistics

**Query Parameters:**
- `workspace_id` (required): Workspace ID

**Response (200 OK):**
```json
{
  "stats": {
    "total": 45,
    "completed": 20,
    "in_progress": 15,
    "not_started": 10,
    "completion_rate": 0.44
  }
}
```

---

### POST `/api/product-tasks/:id/convert`
Convert task to work item

**Response (200 OK):**
```json
{
  "work_item": {
    "id": "1736857200032",
    "name": "Create login form",
    "type": "feature"
  }
}
```

---

## 📎 RESOURCES API

Resources are external links, documentation, and inspiration that can be linked to work items.
Features: full-text search, many-to-many linking, soft-delete with 30-day recycle bin, complete audit trail.

### GET `/api/resources`
List resources with optional filtering

**Query Parameters:**
- `team_id` (required): Team ID
- `workspace_id` (optional): Filter by workspace
- `type` (optional): Filter by type (reference, inspiration, documentation, media, tool)
- `include_deleted` (optional): Include soft-deleted resources
- `limit` (optional, default: 50): Items per page
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1736857200100",
      "title": "React Documentation",
      "url": "https://react.dev",
      "resource_type": "documentation",
      "source_domain": "react.dev",
      "is_deleted": false,
      "linked_work_items_count": 3,
      "created_at": "2025-01-14T12:00:00Z"
    }
  ]
}
```

---

### POST `/api/resources`
Create a new resource

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "team_id": "1736857200000",
  "title": "Stripe API Reference",
  "url": "https://stripe.com/docs/api",
  "description": "Official Stripe API documentation",
  "resource_type": "documentation",
  "work_item_id": "1736857200010",
  "tab_type": "resource",
  "context_note": "Use for payment integration"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "1736857200101",
    "title": "Stripe API Reference",
    "url": "https://stripe.com/docs/api",
    "resource_type": "documentation",
    "source_domain": "stripe.com"
  }
}
```

---

### GET `/api/resources/:id`
Get resource details with linked work items

**Response (200 OK):**
```json
{
  "data": {
    "id": "1736857200100",
    "title": "React Documentation",
    "url": "https://react.dev",
    "description": "Official React docs",
    "notes": "Great resource for hooks patterns",
    "resource_type": "documentation",
    "is_deleted": false,
    "linked_work_items": [
      {
        "id": "1736857200010",
        "name": "User Authentication",
        "tab_type": "resource"
      }
    ]
  }
}
```

---

### PATCH `/api/resources/:id`
Update resource or restore from trash

**Request Body (update):**
```json
{
  "title": "Updated Title",
  "notes": "Updated notes"
}
```

**Request Body (restore - use query param `?action=restore`):**
```json
{}
```

**Response (200 OK):**
```json
{
  "data": { /* updated resource */ }
}
```

---

### DELETE `/api/resources/:id`
Soft delete or permanent delete

**Query Parameters:**
- `permanent` (optional): If `true`, permanently delete (skip trash)

**Response (200 OK - soft delete):**
```json
{
  "message": "Resource moved to trash"
}
```

**Response (204 No Content - permanent delete)**

---

### GET `/api/resources/search`
Full-text search across resources

**Query Parameters:**
- `team_id` (required): Team ID
- `q` (required): Search query
- `workspace_id` (optional): Filter by workspace
- `type` (optional): Filter by resource type
- `limit` (optional, default: 20): Max results

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1736857200100",
      "title": "React Documentation",
      "url": "https://react.dev",
      "resource_type": "documentation",
      "rank": 0.85
    }
  ],
  "total": 15
}
```

---

### GET `/api/resources/:id/history`
Get audit trail for a resource

**Response (200 OK):**
```json
{
  "data": [
    {
      "action": "created",
      "performed_at": "2025-01-14T12:00:00Z",
      "actor": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "changes": { "title": { "old": null, "new": "React Docs" } }
    },
    {
      "action": "linked",
      "performed_at": "2025-01-14T12:05:00Z",
      "actor": { /* ... */ },
      "work_item_id": "1736857200010"
    }
  ],
  "resource": {
    "id": "1736857200100",
    "title": "React Documentation"
  }
}
```

---

### GET `/api/work-items/:id/resources`
Get resources linked to a work item, organized by tab

**Response (200 OK):**
```json
{
  "data": {
    "inspiration": [
      {
        "work_item_id": "1736857200010",
        "resource_id": "1736857200100",
        "tab_type": "inspiration",
        "context_note": "Competitor analysis",
        "resource": { /* full resource object */ }
      }
    ],
    "resources": [
      {
        "work_item_id": "1736857200010",
        "resource_id": "1736857200101",
        "tab_type": "resource",
        "resource": { /* full resource object */ }
      }
    ]
  }
}
```

---

### POST `/api/work-items/:id/resources`
Link a resource to work item or create and link new resource

**Request Body (link existing):**
```json
{
  "resource_id": "1736857200100",
  "tab_type": "inspiration",
  "context_note": "Relevant for UI design"
}
```

**Request Body (create and link):**
```json
{
  "title": "New Resource",
  "url": "https://example.com",
  "resource_type": "reference",
  "tab_type": "resource"
}
```

**Response (201 Created):**
```json
{
  "message": "Resource linked successfully"
}
```

---

### DELETE `/api/work-items/:id/resources`
Unlink a resource from work item

**Query Parameters:**
- `resource_id` (required): Resource ID to unlink

**Response (200 OK):**
```json
{
  "message": "Resource unlinked successfully"
}
```

---

## 🧠 MIND MAPS API

### POST `/api/mind-maps`
Create mind map

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "name": "Product Brainstorm",
  "canvas_data": {
    "nodes": [],
    "edges": []
  }
}
```

**Response (201 Created):**
```json
{
  "mind_map": {
    "id": "1736857200004",
    "name": "Product Brainstorm",
    "canvas_data": { /* ReactFlow data */ },
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/mind-maps/:mindMapId`
Get mind map

**Response (200 OK):**
```json
{
  "mind_map": {
    "id": "1736857200004",
    "name": "Product Brainstorm",
    "canvas_data": {
      "nodes": [
        {
          "id": "node_1",
          "type": "idea",
          "label": "Social Features",
          "position": { "x": 100, "y": 100 }
        }
      ],
      "edges": []
    }
  }
}
```

---

### PATCH `/api/mind-maps/:mindMapId`
Update mind map canvas

**Request Body:**
```json
{
  "canvas_data": {
    "nodes": [ /* updated nodes */ ],
    "edges": [ /* updated edges */ ]
  }
}
```

**Response (200 OK):**
```json
{
  "mind_map": { /* updated mind map */ }
}
```

---

### POST `/api/mind-maps/:mindMapId/convert-to-features`
Convert mind map nodes to features

**Request Body:**
```json
{
  "node_ids": ["node_1", "node_2", "node_3"]
}
```

**Response (200 OK):**
```json
{
  "features": [
    {
      "id": "1736857200005",
      "name": "Social Features",
      "source_node_id": "node_1"
    }
  ],
  "message": "Successfully converted 3 nodes to features"
}
```

---

## 🔗 DEPENDENCIES API

### POST `/api/dependencies`
Create dependency link

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "from_feature_id": "1736857200003",
  "to_feature_id": "1736857200005",
  "type": "dependency",
  "reason": "Authentication required before social features"
}
```

**Response (201 Created):**
```json
{
  "dependency": {
    "id": "1736857200006",
    "from_feature_id": "1736857200003",
    "to_feature_id": "1736857200005",
    "type": "dependency",
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/dependencies`
Get dependency graph

**Query Parameters:**
- `workspace_id` (required): Workspace ID

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "type": "Feature"
    }
  ],
  "edges": [
    {
      "id": "1736857200006",
      "source": "1736857200003",
      "target": "1736857200005",
      "type": "dependency"
    }
  ]
}
```

---

### POST `/api/dependencies/analyze`
Analyze critical path and bottlenecks

**Request Body:**
```json
{
  "workspace_id": "1736857200002"
}
```

**Response (200 OK):**
```json
{
  "critical_path": [
    { "id": "1736857200003", "name": "User Authentication" },
    { "id": "1736857200005", "name": "Social Features" }
  ],
  "critical_path_duration": 45,
  "bottlenecks": [
    {
      "feature_id": "1736857200003",
      "blocking_count": 5,
      "message": "Blocks 5 other features"
    }
  ],
  "circular_dependencies": []
}
```

---

## 👥 REVIEW & FEEDBACK API

### POST `/api/review-links`
Create review link

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "type": "public",
  "feature_ids": ["1736857200003", "1736857200005"],
  "settings": {
    "allow_comments": true,
    "allow_voting": true,
    "require_email": false
  },
  "expires_at": "2025-01-21T12:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "review_link": {
    "id": "1736857200007",
    "token": "abc123xyz",
    "type": "public",
    "url": "https://platform.com/public/review/abc123xyz",
    "expires_at": "2025-01-21T12:00:00Z"
  }
}
```

---

### GET `/public/review/:token` **[PUBLIC]**
Get review page data

**Response (200 OK):**
```json
{
  "workspace": {
    "name": "Mobile App Project"
  },
  "features": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "purpose": "Secure login system..."
    }
  ],
  "settings": {
    "allow_comments": true,
    "allow_voting": true
  }
}
```

---

### POST `/api/feedback` **[PUBLIC]**
Submit feedback

**Request Body:**
```json
{
  "review_link_token": "abc123xyz",
  "feature_id": "1736857200003",
  "rating": 5,
  "comment": "Great feature!",
  "reviewer_email": "reviewer@example.com"
}
```

**Response (201 Created):**
```json
{
  "feedback": {
    "id": "1736857200008",
    "feature_id": "1736857200003",
    "rating": 5,
    "status": "new",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "message": "Thank you for your feedback!"
}
```

---

### GET `/api/feedback`
List all feedback

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `feature_id` (optional): Filter by feature
- `status` (optional): Filter by status (new, reviewed, implemented, rejected)

**Response (200 OK):**
```json
{
  "feedback": [
    {
      "id": "1736857200008",
      "feature_id": "1736857200003",
      "rating": 5,
      "comment": "Great feature!",
      "status": "new",
      "created_at": "2025-01-14T12:00:00Z"
    }
  ],
  "total": 15
}
```

---

## 🤖 AI ASSISTANT API

### POST `/api/ai/chat`
Send chat message (streaming response)

**Request Body:**
```json
{
  "message": "What are the best authentication methods for SaaS apps?",
  "model": "claude-haiku",
  "workspace_id": "1736857200002"
}
```

**Response (Server-Sent Events):**
```
data: {"type":"start"}

data: {"type":"chunk","text":"Based on current research..."}

data: {"type":"chunk","text":" OAuth 2.0 with PKCE is recommended..."}

data: {"type":"done"}
```

---

### POST `/api/ai/suggest`
Get AI suggestions

**Request Body:**
```json
{
  "type": "dependencies",
  "feature_id": "1736857200003",
  "workspace_id": "1736857200002"
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "type": "dependency",
      "from_feature_id": "1736857200003",
      "to_feature_id": "1736857200009",
      "reason": "Authentication needed before user profiles",
      "confidence": 0.92
    }
  ]
}
```

---

### POST `/api/ai/tools/:toolName`
Execute AI tool (agentic mode)

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "params": {
    "name": "Payment Integration",
    "purpose": "Stripe checkout flow",
    "timeline": "SHORT"
  }
}
```

**Response (200 OK):**
```json
{
  "result": {
    "feature_id": "1736857200010",
    "message": "Feature created successfully"
  },
  "action_log": {
    "tool": "create_feature",
    "timestamp": "2025-01-14T12:00:00Z"
  }
}
```

---

## 🎯 STRATEGIES API

The Strategies module provides OKR/Pillar management with hierarchical structure and AI-powered alignment suggestions.

### GET `/api/strategies`
List all strategies for a workspace with hierarchy support

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID
- `parent_id` (optional): Filter by parent (use "null" for root)
- `type` (optional): Filter by type (pillar, objective, key_result, initiative)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1736857200100",
      "team_id": "1736857200000",
      "workspace_id": "1736857200001",
      "parent_id": null,
      "type": "pillar",
      "title": "Customer Experience",
      "description": "Improve customer satisfaction scores",
      "status": "active",
      "progress": 65,
      "sort_order": 0,
      "owner_id": "uuid",
      "created_at": "2025-01-14T12:00:00Z",
      "updated_at": "2025-01-14T12:00:00Z",
      "children": [
        {
          "id": "1736857200101",
          "type": "objective",
          "title": "Reduce support ticket volume",
          "progress": 40,
          "children": []
        }
      ]
    }
  ]
}
```

---

### POST `/api/strategies`
Create a new strategy

**Request Body:**
```json
{
  "team_id": "1736857200000",
  "workspace_id": "1736857200001",
  "parent_id": null,
  "type": "pillar",
  "title": "Customer Experience",
  "description": "Improve customer satisfaction scores",
  "status": "draft",
  "owner_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "1736857200100",
  "team_id": "1736857200000",
  "workspace_id": "1736857200001",
  "type": "pillar",
  "title": "Customer Experience",
  "status": "draft",
  "progress": 0,
  "sort_order": 0,
  "created_at": "2025-01-14T12:00:00Z"
}
```

---

### GET `/api/strategies/[id]`
Get a single strategy with its children

**Response (200 OK):**
```json
{
  "id": "1736857200100",
  "type": "pillar",
  "title": "Customer Experience",
  "description": "Improve customer satisfaction scores",
  "status": "active",
  "progress": 65,
  "children": [/* nested children */],
  "owner": {
    "id": "uuid",
    "name": "John Doe"
  }
}
```

---

### PUT `/api/strategies/[id]`
Update a strategy

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "active",
  "progress": 75
}
```

**Response (200 OK):**
```json
{
  "id": "1736857200100",
  "title": "Updated Title",
  "status": "active",
  "progress": 75,
  "updated_at": "2025-01-14T13:00:00Z"
}
```

---

### DELETE `/api/strategies/[id]`
Delete a strategy and all its children (cascade)

**Response (200 OK):**
```json
{
  "message": "Strategy deleted successfully",
  "deleted_count": 3
}
```

---

### POST `/api/strategies/[id]/reorder`
Reorder a strategy within the hierarchy (drag-drop support)

**Request Body:**
```json
{
  "parent_id": "1736857200100",
  "sort_order": 2,
  "team_id": "1736857200000",
  "workspace_id": "1736857200001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "strategy": {
    "id": "1736857200101",
    "parent_id": "1736857200100",
    "sort_order": 2
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid move (circular reference, invalid parent)
- `404 Not Found`: Strategy not found

---

### GET `/api/strategies/stats`
Get strategy statistics for a workspace

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "total": 12,
  "byType": {
    "pillar": 2,
    "objective": 4,
    "key_result": 4,
    "initiative": 2
  },
  "byStatus": {
    "draft": 2,
    "active": 8,
    "completed": 2,
    "archived": 0
  },
  "avgProgress": 58,
  "alignedWorkItems": 15,
  "unalignedWorkItems": 5
}
```

---

### POST `/api/ai/strategies/suggest`
Get AI-powered alignment suggestions for work items

**Request Body:**
```json
{
  "workspace_id": "1736857200001",
  "team_id": "1736857200000"
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "workItemId": "1736857200050",
      "workItemTitle": "Improve checkout flow",
      "suggestedStrategyId": "1736857200100",
      "suggestedStrategyTitle": "Customer Experience",
      "confidence": 0.85,
      "reasoning": "This work item directly addresses customer experience by improving the checkout process."
    }
  ]
}
```

---

## 📊 ANALYTICS API

The Analytics module provides 4 pre-built dashboards plus a custom dashboard builder (Pro feature).

### GET `/api/analytics/overview`
Get Feature Overview dashboard data - work item metrics and status breakdowns

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "metrics": {
    "totalWorkItems": 25,
    "completedWorkItems": 12,
    "inProgressWorkItems": 8,
    "blockedWorkItems": 2
  },
  "statusBreakdown": [
    { "name": "Planned", "value": 5, "color": "#94a3b8" },
    { "name": "In Progress", "value": 8, "color": "#3b82f6" },
    { "name": "Completed", "value": 12, "color": "#22c55e" }
  ],
  "typeBreakdown": [
    { "name": "Feature", "value": 18, "color": "#8b5cf6" },
    { "name": "Bug", "value": 5, "color": "#ef4444" },
    { "name": "Enhancement", "value": 2, "color": "#06b6d4" }
  ],
  "recentActivity": [
    {
      "id": "1736857200010",
      "type": "status_change",
      "description": "User Auth moved to Completed",
      "timestamp": "2025-01-14T12:00:00Z",
      "workItemId": "1736857200003"
    }
  ],
  "trends": {
    "completionRate": 0.48,
    "velocityTrend": "up",
    "weeklyCompleted": [3, 5, 4, 6, 8]
  }
}
```

---

### GET `/api/analytics/dependencies`
Get Dependency Health dashboard data - dependency graph analysis and bottlenecks

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "metrics": {
    "totalDependencies": 45,
    "healthyDependencies": 38,
    "blockedDependencies": 3,
    "circularDependencies": 0
  },
  "healthDistribution": [
    { "name": "Healthy", "value": 38, "color": "#22c55e" },
    { "name": "At Risk", "value": 4, "color": "#f59e0b" },
    { "name": "Blocked", "value": 3, "color": "#ef4444" }
  ],
  "dependencyTypeBreakdown": [
    { "name": "Blocks", "value": 20, "color": "#ef4444" },
    { "name": "Depends On", "value": 15, "color": "#3b82f6" },
    { "name": "Related To", "value": 10, "color": "#8b5cf6" }
  ],
  "criticalPath": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "status": "completed"
    },
    {
      "id": "1736857200005",
      "name": "Social Features",
      "status": "in_progress"
    }
  ],
  "bottlenecks": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "blockingCount": 5,
      "severity": "high"
    }
  ],
  "orphanedItems": [
    {
      "id": "1736857200099",
      "name": "Isolated Feature",
      "type": "feature"
    }
  ]
}
```

---

### GET `/api/analytics/performance`
Get Team Performance dashboard data - team metrics and productivity analysis

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "metrics": {
    "totalMembers": 8,
    "activeMembers": 6,
    "avgTasksPerMember": 4.5,
    "avgCompletionTime": 3.2
  },
  "memberPerformance": [
    {
      "id": "uuid-1",
      "name": "John Doe",
      "avatar": "https://...",
      "tasksCompleted": 15,
      "tasksInProgress": 3,
      "avgCycleTime": 2.8
    }
  ],
  "workloadDistribution": [
    { "name": "John Doe", "value": 18, "color": "#3b82f6" },
    { "name": "Jane Smith", "value": 12, "color": "#8b5cf6" }
  ],
  "velocityTrend": [
    { "week": "W1", "completed": 5, "planned": 6 },
    { "week": "W2", "completed": 8, "planned": 7 },
    { "week": "W3", "completed": 6, "planned": 8 }
  ],
  "phaseDistribution": [
    { "name": "Research", "members": 2 },
    { "name": "Development", "members": 4 },
    { "name": "Testing", "members": 2 }
  ]
}
```

---

### GET `/api/analytics/alignment`
Get Strategy Alignment dashboard data - OKR/Pillar alignment and progress

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "metrics": {
    "totalStrategies": 5,
    "alignedWorkItems": 20,
    "unalignedWorkItems": 5,
    "avgProgress": 45
  },
  "strategyProgress": [
    {
      "id": "1736857200020",
      "name": "Improve User Onboarding",
      "type": "objective",
      "progress": 65,
      "workItemCount": 8,
      "status": "on_track"
    }
  ],
  "alignmentBreakdown": [
    { "name": "Aligned", "value": 20, "color": "#22c55e" },
    { "name": "Unaligned", "value": 5, "color": "#94a3b8" }
  ],
  "strategyTypeBreakdown": [
    { "name": "Objective", "value": 3, "color": "#3b82f6" },
    { "name": "Key Result", "value": 8, "color": "#8b5cf6" },
    { "name": "Pillar", "value": 2, "color": "#06b6d4" }
  ],
  "atRiskStrategies": [
    {
      "id": "1736857200021",
      "name": "Reduce Churn",
      "progress": 15,
      "expectedProgress": 40,
      "gap": 25
    }
  ],
  "unlinkedWorkItems": [
    {
      "id": "1736857200099",
      "name": "Feature without strategy",
      "type": "feature"
    }
  ]
}
```

---

### POST `/api/analytics/dashboards`
Create custom dashboard (Pro Feature)

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "team_id": "1736857200000",
  "name": "Team Performance",
  "widgets": [
    {
      "id": "widget-1",
      "widgetId": "total-work-items",
      "position": { "x": 0, "y": 0, "w": 1, "h": 1 },
      "config": {}
    },
    {
      "id": "widget-2",
      "widgetId": "status-breakdown-chart",
      "position": { "x": 1, "y": 0, "w": 2, "h": 2 },
      "config": {}
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "dashboard": {
    "id": "1736857200011",
    "name": "Team Performance",
    "widgets": [ /* widget instances */ ],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

**Available Widget IDs:**
| Category | Widget IDs |
|----------|------------|
| Metrics | `total-work-items`, `completion-rate`, `blocked-items`, `health-score`, `velocity`, `cycle-time` |
| Charts | `status-breakdown-chart`, `type-breakdown-chart`, `timeline-distribution`, `dependency-flow`, `burndown-chart` |
| Lists | `recent-activity`, `critical-path`, `bottlenecks`, `at-risk-items` |
| Progress | `strategy-progress`, `phase-progress`, `team-workload`, `sprint-progress` |

---

## 🔌 INTEGRATIONS API

External integrations via MCP Gateway (270+ integrations).

### GET `/api/integrations`
List all integrations for the authenticated user's team.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status (`connected`, `expired`, `error`) |
| `provider` | string | Filter by provider (`github`, `jira`, `slack`, etc.) |

**Response (200 OK):**
```json
{
  "integrations": [
    {
      "id": "1701234567890",
      "provider": "github",
      "name": "GitHub",
      "status": "connected",
      "providerAccountName": "acme-corp",
      "scopes": ["repo", "read:user"],
      "lastSyncAt": "2025-12-03T10:00:00Z",
      "createdAt": "2025-12-01T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

### POST `/api/integrations`
Create a new integration and initiate OAuth flow.

**Request Body:**
```json
{
  "provider": "github",
  "name": "GitHub Integration",
  "scopes": ["repo", "read:user"]
}
```

**Response (201 Created):**
```json
{
  "integration": {
    "id": "1701234567890",
    "provider": "github",
    "name": "GitHub Integration",
    "status": "pending",
    "scopes": ["repo", "read:user"],
    "createdAt": "2025-12-03T12:00:00Z"
  },
  "oauthUrl": "https://github.com/login/oauth/authorize?..."
}
```

---

### GET `/api/integrations/[id]`
Get details for a specific integration, including sync logs.

**Response (200 OK):**
```json
{
  "id": "1701234567890",
  "provider": "github",
  "name": "GitHub",
  "status": "connected",
  "scopes": ["repo", "read:user"],
  "lastSyncAt": "2025-12-03T10:00:00Z",
  "syncLogs": [
    {
      "id": "1701234567891",
      "sync_type": "import",
      "status": "completed",
      "items_synced": 15,
      "duration_ms": 1234
    }
  ]
}
```

---

### DELETE `/api/integrations/[id]`
Disconnect and delete an integration.

**Response (200 OK):**
```json
{
  "message": "Integration deleted"
}
```

---

### POST `/api/integrations/[id]/sync`
Trigger a sync operation for an integration.

**Request Body:**
```json
{
  "syncType": "import",
  "workspaceId": "ws123",
  "sourceEntity": "issues",
  "targetEntity": "work_items"
}
```

**Response (200 OK):**
```json
{
  "syncLogId": "1701234567892",
  "status": "completed",
  "itemsSynced": 15,
  "duration": 1234
}
```

---

### GET `/api/integrations/oauth/callback`
OAuth callback handler (redirects to settings page with status).

**Query Parameters (from OAuth provider):**
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Authorization code |
| `state` | string | CSRF protection state |
| `error` | string | Error code (if OAuth failed) |

**Redirects to:** `/settings/integrations?success=...` or `/settings/integrations?error=...`

---

### GET `/api/workspaces/[id]/integrations`
List integrations enabled for a workspace.

**Response (200 OK):**
```json
{
  "integrations": [
    {
      "id": "1701234567890",
      "provider": "github",
      "name": "GitHub",
      "status": "connected",
      "enabled": true,
      "enabledTools": ["github_list_repos", "github_list_issues"],
      "defaultProject": "acme/product"
    }
  ],
  "count": 1
}
```

---

### POST `/api/workspaces/[id]/integrations`
Enable an integration for a workspace.

**Request Body:**
```json
{
  "integrationId": "1701234567890",
  "enabledTools": ["github_list_repos", "github_list_issues"],
  "defaultProject": "acme/product"
}
```

**Response (201 Created):**
```json
{
  "message": "Integration enabled for workspace",
  "accessId": "1701234567893"
}
```

---

### Supported Providers

| Provider | Category | Tools |
|----------|----------|-------|
| `github` | Development | `list_repos`, `list_issues`, `create_issue`, `list_pull_requests` |
| `jira` | Project Management | `list_projects`, `list_issues`, `create_issue`, `transition_issue` |
| `linear` | Project Management | `list_issues`, `create_issue`, `list_projects`, `list_cycles` |
| `notion` | Documentation | `list_pages`, `get_page`, `create_page`, `search` |
| `slack` | Communication | `list_channels`, `send_message`, `search_messages` |
| `figma` | Design | `list_files`, `get_file`, `export_images` |

---

## 🔔 WEBHOOKS

### POST `/api/webhooks/stripe`
Stripe webhook handler

**[PUBLIC - Verified with Stripe signature]**

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Request Headers:**
```http
Stripe-Signature: t=1234567890,v1=abc123...
```

**Request Body:** (Stripe event object)

**Response (200 OK):**
```json
{
  "received": true
}
```

---

### POST `/api/webhooks/resend`
Email webhook handler (delivery status)

**[PUBLIC - Verified with Resend signature]**

**Events Handled:**
- `email.delivered`
- `email.bounced`
- `email.opened`

**Response (200 OK):**
```json
{
  "received": true
}
```

---

## 📐 COMMON PATTERNS

### Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be authenticated to access this resource",
    "details": {
      /* optional additional context */
    }
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

### Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

### Rate Limiting

**Free Tier:**
- 100 requests/minute per user
- 50 AI messages/month per team

**Pro Tier:**
- 500 requests/minute per user
- 1,000 AI messages/user/month

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1736857260
```

---

## 🔧 SDK & Client Libraries

### JavaScript/TypeScript
```bash
npm install @platform/api-client
```

**Usage:**
```typescript
import { PlatformClient } from '@platform/api-client';

const client = new PlatformClient({
  apiKey: process.env.PLATFORM_API_KEY
});

const features = await client.features.list({
  workspace_id: 'workspace_id'
});
```

### Python (Coming Soon)
```bash
pip install platform-api
```

### Ruby (Coming Soon)
```bash
gem install platform-api
```

---

## 📚 ADDITIONAL RESOURCES

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flows
- **[database-schema.md](../implementation/database-schema.md)** - Complete database schema
- **[CLAUDE.md](../../CLAUDE.md)** - Project guidelines and coding standards

---

**API Version:** 1.2
**Last Updated:** 2025-12-02
**Changelog:** See [CHANGELOG.md](CHANGELOG.md)
