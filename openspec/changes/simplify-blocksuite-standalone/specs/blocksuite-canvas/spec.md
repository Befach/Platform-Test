## ADDED Requirements

### Requirement: Standalone Canvas Editor

The SimpleCanvas component SHALL provide a standalone BlockSuite editor for creating and editing content.

#### Scenario: Create mindmap canvas

- **WHEN** user navigates to `/workspaces/[id]/canvas/new` and selects "mindmap" type
- **THEN** a new `blocksuite_documents` record is created with `document_type = 'mindmap'`
- **AND** user is redirected to the canvas editor

#### Scenario: Create document canvas

- **WHEN** user navigates to `/workspaces/[id]/canvas/new` and selects "document" type
- **THEN** a new `blocksuite_documents` record is created with `document_type = 'document'`
- **AND** PageEditor mode is used instead of EdgelessEditor

#### Scenario: Create whiteboard canvas

- **WHEN** user navigates to `/workspaces/[id]/canvas/new` and selects "canvas" type
- **THEN** a new `blocksuite_documents` record is created with `document_type = 'canvas'`
- **AND** EdgelessEditor mode is used for freeform whiteboard

#### Scenario: Auto-save on edit

- **WHEN** user makes changes to canvas content
- **THEN** changes are automatically persisted via HybridProvider (debounced 2s)
- **AND** real-time sync broadcasts to other connected clients

#### Scenario: Load existing canvas

- **WHEN** user navigates to `/workspaces/[id]/canvas/[canvasId]`
- **THEN** Yjs state is loaded from Supabase Storage
- **AND** canvas renders with persisted content

---

### Requirement: Canvas List View

The canvas list page SHALL display all BlockSuite documents for the workspace.

#### Scenario: List all canvases

- **WHEN** user navigates to `/workspaces/[id]/canvas/`
- **THEN** all `blocksuite_documents` for the workspace are listed
- **AND** each shows title, document_type, and last_sync_at

#### Scenario: Filter by type

- **WHEN** user selects a document type filter
- **THEN** only documents of that type are shown

#### Scenario: Create new canvas

- **WHEN** user clicks "New Canvas" button
- **THEN** user is navigated to `/canvas/new` page

---

### Requirement: Legacy Route Redirect

The system SHALL redirect legacy mind map routes to the new canvas routes.

#### Scenario: Mind maps redirect

- **WHEN** user navigates to `/workspaces/[id]/mind-maps/*`
- **THEN** user is redirected to `/workspaces/[id]/canvas/`

---

## MODIFIED Requirements

### Requirement: Node Selection Events

The SimpleCanvas component SHALL expose selection state for integration purposes.

#### Scenario: Node selection available

- **WHEN** user selects an element in the canvas
- **THEN** selection state is available via BlockSuite's native selection API
- **AND** consuming components can subscribe to selection changes

> **Note**: Simplified from custom callback pattern to native BlockSuite selection API.

---

### Requirement: Persistent Rate Limiting

The BlockSuite API endpoints SHALL enforce rate limits using persistent storage.

#### Scenario: Rate limit enforced

- **WHEN** client exceeds 60 requests per minute to /state endpoint
- **THEN** HTTP 429 response is returned with Retry-After header

#### Scenario: Rate limit headers

- **WHEN** any request is made to BlockSuite endpoints
- **THEN** response includes X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers

#### Scenario: Rate limit identifier

- **WHEN** authenticated user makes request
- **THEN** rate limit is tracked per user ID

#### Scenario: Anonymous rate limit

- **WHEN** unauthenticated request is made
- **THEN** rate limit is tracked per IP address

> **Note**: Unchanged from Phase 6 - already implemented and working.

---

### Requirement: Orphaned Storage Cleanup

The system SHALL automatically clean up orphaned storage files.

#### Scenario: Daily cleanup execution

- **WHEN** cron job runs at scheduled time (3 AM UTC)
- **THEN** files in storage bucket without corresponding database records are deleted

#### Scenario: Grace period respected

- **WHEN** file is less than 24 hours old
- **THEN** file is NOT deleted (allows for in-flight uploads)

#### Scenario: Audit logging

- **WHEN** orphaned file is deleted
- **THEN** deletion is logged with file path and timestamp

> **Note**: Unchanged from Phase 6 - implementation pending (optional feature).

---

## REMOVED Requirements

### Requirement: Mind Map Toolbar

**Reason**: Toolbar functionality replaced by BlockSuite's built-in EdgelessEditor toolbar.

**Migration**: Users use native BlockSuite toolbar for zoom, undo/redo, and element manipulation. No custom React toolbar needed.

---

### Requirement: Work Item Conversion

**Reason**: Decoupling BlockSuite from work item domain.

**Migration**: Work item conversion removed. Users create work items separately from canvas content. No automatic node-to-work-item flow.
