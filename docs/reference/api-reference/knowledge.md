# Knowledge API

**Last Updated:** 2026-01-14

[Back to API Reference](README.md)

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
