# Auth & Users API

**Last Updated:** 2026-01-14

[Back to API Reference](README.md)

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
