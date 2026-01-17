# AI & Analytics API

**Last Updated:** 2026-01-14

[Back to API Reference](README.md)

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
