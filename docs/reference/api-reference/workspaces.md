# Workspaces API

**Last Updated:** 2026-01-14

[Back to API Reference](README.md)

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
