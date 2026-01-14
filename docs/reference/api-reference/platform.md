# Platform API

**Last Updated:** 2026-01-14

[Back to API Reference](README.md)

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

- **[ARCHITECTURE.md](../../architecture/ARCHITECTURE.md)** - System architecture and data flows
- **[database-schema.md](../../architecture/database-schema.md)** - Complete database schema
- **[CLAUDE.md](../../../CLAUDE.md)** - Project guidelines and coding standards

---

**API Version:** 1.2
**Last Updated:** 2025-12-02
**Changelog:** See [CHANGELOG.md](../CHANGELOG.md)
