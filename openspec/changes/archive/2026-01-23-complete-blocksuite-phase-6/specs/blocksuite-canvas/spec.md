## ADDED Requirements

### Requirement: Node Selection Events

The MindMapCanvas component SHALL fire onNodeSelect callback when a user selects a node.

#### Scenario: Single node selection

- **WHEN** user clicks on a mind map node
- **THEN** onNodeSelect callback is invoked with (nodeId, nodeText)

#### Scenario: Selection cleared

- **WHEN** user clicks on empty canvas area
- **THEN** selection state is cleared (selectedNodeId = null)

#### Scenario: Keyboard selection

- **WHEN** user uses Tab or arrow keys to navigate nodes
- **THEN** onNodeSelect callback is invoked for the newly focused node

---

### Requirement: Mind Map Toolbar

The MindMapCanvas component SHALL provide a toolbar for common operations.

#### Scenario: Add child node

- **WHEN** user clicks "Add Node" button with a node selected
- **THEN** a new child node is added to the selected node

#### Scenario: Add sibling node

- **WHEN** user clicks "Add Sibling" button with a non-root node selected
- **THEN** a new sibling node is added at the same level

#### Scenario: Delete node

- **WHEN** user clicks "Delete" button with a node selected
- **THEN** the node and its descendants are removed

#### Scenario: Change style

- **WHEN** user selects a style from dropdown (Classic, Bubble, Box, Wireframe)
- **THEN** the mind map renders with the selected style

#### Scenario: Zoom controls

- **WHEN** user clicks zoom in/out buttons
- **THEN** canvas viewport zooms accordingly

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

#### Scenario: Batch processing

- **WHEN** more than 100 orphaned files exist
- **THEN** only 100 files are processed per run (to prevent timeouts)
