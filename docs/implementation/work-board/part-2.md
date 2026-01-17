```

**Task Grouping Options**:
- All (flat list)
- By Module (Inspiration/Resources/Scope/Review)
- By Timeline (MVP/SHORT/LONG)
- By Assignee

**Database Change Required**:
```sql
ALTER TABLE product_tasks
ADD COLUMN module TEXT CHECK (module IN ('inspiration', 'resources', 'scope', 'feedback', NULL));
```

---

## Implementation Sessions

### Session 1: Tab Structure + Summary + Tasks (~8-10h)

1. Create 8-Tab Structure shell (~2h)
2. Build Tracking Sidebar component (~2h)
3. Summary Tab (overview, timeline, dependencies) (~2h)
4. Tasks Tab (universal tasks with grouping) (~3-4h)

### Session 2: Scope + Feedback + Phase Progression

1. Scope Tab (milestones, risks, criteria) (~3-4h)
2. Feedback Tab (linked feedback) (~2h)
3. Phase Progression Prompts (~2h)

### Session 3: Resources + Inspiration + Polish

1. Resources Tab (~2h)
2. Inspiration Tab (~2h)
3. Soft Guidance System (~2h)
4. AI Copilot Tab (placeholder) (~1h)
5. Metrics Tab (Coming Soon) (~0.5h)

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/work-items/detail/work-item-detail-client.tsx` | Client wrapper with 8-tab structure |
| `components/work-items/detail/tracking-sidebar.tsx` | Sidebar with inline editing |
| `components/work-items/detail/tab-summary.tsx` | Overview, timeline, dependencies |
| `components/work-items/detail/tab-inspiration.tsx` | Research & reference cards |
| `components/work-items/detail/tab-resources.tsx` | Tools, APIs, integrations |
| `components/work-items/detail/tab-scope.tsx` | Milestones, risks, criteria |
| `components/work-items/detail/tab-tasks.tsx` | Universal tasks with grouping |
| `components/work-items/detail/tab-feedback.tsx` | Linked feedback |
| `components/work-items/detail/tab-metrics.tsx` | Coming Soon placeholder |
| `components/work-items/detail/tab-ai-copilot.tsx` | AI placeholder |
| `components/work-items/detail/phase-guidance.tsx` | Phase-aware empty states |
| `components/work-items/detail/dependencies-section.tsx` | Dependencies display |

---

# Part 8: Feedback Module (Full Platform)

**Status**: PLANNING COMPLETE - Future Implementation
**Target**: Week 7 (External Review System)
**Estimated Time**: ~40-50 hours total

---

## Core Concept

A **comprehensive multi-channel feedback collection platform** for gathering user insights at any product lifecycle stage.

**Important**: This is SEPARATE from the Feedback Tab:

- **Feedback Tab** = Shows feedback linked to a specific work item
- **Feedback Module** = Full platform for surveys, voting, collection

---

## Feedback Collection Channels

| Channel | Build/Integrate | Notes |
|---------|-----------------|-------|
| **Email Surveys** | 🔗 Resend | Already integrated |
| **WhatsApp** | 🔗 Twilio | API verified |
| **SMS** | 🔗 Twilio | Same provider |
| **Web Popups** | 🏗️ Build | React component |
| **iFrame Embeds** | 🏗️ Build | Embeddable widget |
| **Public Links** | 🏗️ Build | Shareable URLs |
| **API Webhooks** | 🏗️ Build | Receive external feedback |

---

## Feedback Types by Stage

| Phase | Feedback Types |
|-------|----------------|
| **Research** | Idea validation surveys, market research polls |
| **Planning** | Feature prioritization voting, concept testing |
| **Execution** | Beta tester feedback, usability testing, bug reports |
| **Review/Complete** | NPS, CSAT surveys, feature adoption feedback |

---

## Key Features

**Survey Builder** (Built In-House):

- Drag-and-drop question builder
- MCQ, rating, open-ended, NPS question types
- Logic branching and skip patterns
- Custom branding/theming

**Distribution**:

- Schedule campaigns
- Audience targeting
- Multi-channel delivery
- Reminder automation

**Embeddable Widgets**:

- Feature voting widget
- Quick feedback popup
- In-app feedback button
- Public roadmap voting

**Analysis**:

- Response aggregation
- AI sentiment analysis (OpenRouter)
- Priority scoring
- Link feedback to work items

---

## Implementation Priority

| Priority | Feature | Complexity |
|----------|---------|------------|
| **P1** | Public feedback link + basic form | Low |
| **P1** | Link feedback to work items | Low |
| **P2** | Embeddable voting widget | Medium |
| **P2** | Email survey distribution | Medium |
| **P3** | WhatsApp/SMS integration | High |
| **P3** | SurveyMonkey/Typeform import | High |
| **P4** | Survey builder with logic | High |
| **P4** | AI sentiment analysis | High |

---

# Part 9: Integrations Module

**Status**: PLANNING COMPLETE - Future Implementation
**Target**: Week 7-8
**Estimated Time**: ~34 hours total

---

## Build vs. Integrate Decision Matrix

| Feature | Recommendation | Rationale |
|---------|----------------|-----------|
| **Survey Builder** | 🏗️ BUILD | Core to platform, better UX |
| **Voting Widgets** | 🏗️ BUILD | Simple, embedded in ecosystem |
| **Email Distribution** | 🔗 Resend | Already integrated |
| **WhatsApp Surveys** | 🔗 Twilio | Complex infrastructure |
| **SMS Distribution** | 🔗 Twilio | Same provider |
| **SurveyMonkey Import** | 🔗 API | Import, not compete |
| **Typeform Import** | 🔗 API | Import, not replace |
| **AI UI Prototypes** | 🏗️ BUILD | Core differentiator |
| **NPS/CSAT Scoring** | 🏗️ BUILD | Simple calculation |
| **Sentiment Analysis** | 🏗️ BUILD | Use OpenRouter |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATIONS MODULE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  CONNECTED SERVICES (Team Settings > Integrations)                          │
│  📧 Email (Resend)         ✅ Connected     [Configure]                      │
│  📱 WhatsApp (Twilio)      ⚪ Not Connected [Connect]                        │
│  💬 SMS (Twilio)           ⚪ Not Connected [Connect]                        │
│  📋 SurveyMonkey           ⚪ Not Connected [Connect]                        │
│  📝 Typeform               ⚪ Not Connected [Connect]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  BUILT-IN FEATURES (Always Available)                                        │
│  📊 Survey Builder         [Create Survey]                                   │
│  🗳️ Voting Widgets         [Create Widget]                                   │
│  🎨 AI UI Prototypes       [Generate Mockup]                                 │
│  📈 Analytics Dashboard    [View Analytics]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
CREATE TABLE team_integrations (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    connected_by TEXT REFERENCES users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, provider)
);

ALTER TABLE team_integrations ENABLE ROW LEVEL SECURITY;
```

---

## Implementation Order

| Phase | Integration | Time |
|-------|-------------|------|
| **1** | Email (Resend extend) | ~2h |
| **1** | AI UI Prototypes | ~4h |
| **2** | Survey Builder | ~6h |
| **2** | Voting Widget | ~4h |
| **3** | Twilio (WhatsApp + SMS) | ~6h |
| **3** | SurveyMonkey Import | ~4h |
| **4** | Typeform Import | ~4h |
| **4** | Advanced Analytics | ~4h |

---

# Part 10: AI Visual Prototype Feature

**Status**: PLANNING COMPLETE
**Target**: Week 7 (with Feedback Module)
**Estimated Time**: ~9 hours

---

## Feature Overview

Generate UI mockups with AI from natural language descriptions.

**User Flow**:

1. User describes UI idea in natural language
2. AI generates React/HTML code via OpenRouter
3. Preview renders in iframe sandbox
4. User shares link for visual feedback voting
5. Stakeholders vote/comment on the design

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI VISUAL PROTOTYPE GENERATOR                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Describe your UI idea:                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ "A login form with email and password fields, a 'Remember me'         │ │
│  │  checkbox, and a gradient blue submit button. Modern and minimal."     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                           [✨ Generate]      │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │          LIVE PREVIEW                    │  │  CODE (editable)         │  │
│  │  [iframe sandbox renders here]           │  │  export function Login() │  │
│  └─────────────────────────────────────────┘  └──────────────────────────┘  │
│  [💾 Save] [🔗 Share for Feedback] [📋 Copy Code] [♻️ Regenerate]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
CREATE TABLE ui_prototypes (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    generated_code TEXT NOT NULL,
    preview_url TEXT,
    share_token TEXT UNIQUE,
    vote_count INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prototype_votes (
    id TEXT PRIMARY KEY,
    prototype_id TEXT REFERENCES ui_prototypes(id) ON DELETE CASCADE,
    voter_email TEXT,
    vote INTEGER CHECK (vote IN (-1, 0, 1)),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Priority

| Step | Task | Time |
|------|------|------|
| 1 | API route `/api/ai/generate-prototype` | ~2h |
| 2 | Iframe sandbox renderer component | ~2h |
| 3 | Save/share prototype functionality | ~2h |
| 4 | Public voting page (no auth) | ~2h |
| 5 | Link prototypes to work items | ~1h |

---

## Related Documentation

- **Week 6**: [Timeline & Execution](week-6-timeline-execution.md) - Work Item Detail Page
- **Week 7**: [AI Integration & Analytics](../week-7/README.md) - Feedback Module, AI features
- **Product Tasks**: [Week 5](week-5-review-system.md) - Tasks implementation

---

# Part 11: Feedback & Insights UI System

**Status**: ✅ IMPLEMENTATION COMPLETE
**Completed**: 2025-12-02
**Estimated Time**: ~16 hours
**Actual Time**: ~14 hours (2 sessions)

---

## Overview

A comprehensive system for collecting public feedback, managing customer insights, and enabling stakeholder voting—all without requiring authentication for external users.

**Key Design Decisions**:

- **Security**: Multi-layer (honeypot + time check + rate limiting), CAPTCHA-ready
- **Widget**: Enabled by default with easy disable toggle
- **Voting**: Team-configurable verification (teams choose if email required)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PUBLIC ROUTES (No Auth Required)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  /feedback/[workspaceId]    → Public feedback form                       │
│  /widget/[workspaceId]      → Embeddable iframe widget                   │
│  /vote/[insightId]          → Public voting page                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PUBLIC API ROUTES                                                        │
│  POST /api/public/feedback        → Submit anonymous feedback             │
│  GET  /api/public/workspaces/[id] → Validate workspace + get settings     │
│  GET  /api/public/insights/[id]   → Get sanitized insight for voting      │
│  POST /api/public/insights/[id]/vote → Submit vote                        │
├─────────────────────────────────────────────────────────────────────────┤
│  SECURITY LAYER                                                           │
│  🍯 Honeypot Fields    → Hidden inputs bots fill out                      │
│  ⏱️ Time Validation    → Reject submissions < 3 seconds                   │
│  🚦 Rate Limiting      → 10 feedback / 30 votes per 15 min per IP         │
│  🔒 CAPTCHA Ready      → Interface for reCAPTCHA/hCaptcha integration     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components Created

### Security Utilities (`src/lib/security/`)

| File | Purpose |
|------|---------|
| `honeypot.ts` | Spam prevention with hidden fields + time check |
| `rate-limit.ts` | In-memory rate limiting with auto-cleanup |
| `index.ts` | Security exports |

### Insights Dashboard (`src/components/insights/`)

| File | Purpose |
|------|---------|
| `insights-dashboard.tsx` | Main dashboard with tabs (all/triage/linked) |
| `insights-dashboard-stats.tsx` | Stats cards with clickable filters |
| `insight-detail-sheet.tsx` | Slide-over panel for insight details |
| `insight-triage-queue.tsx` | Keyboard-driven rapid review UI |
| `hooks/use-insight-shortcuts.ts` | Vim-style keyboard navigation |
| `public-vote-card.tsx` | External voting UI with configurable verification |

### Feedback Components (`src/components/feedback/`)

| File | Purpose |
|------|---------|
| `public-feedback-form.tsx` | Simplified form with honeypot integration |
| `feedback-thank-you.tsx` | Success confirmation component |
| `feedback-widget-embed.tsx` | Embed code generator with live preview |

### Work Item Integration (`src/components/work-items/`)

| File | Purpose |
|------|---------|
| `linked-insights-section.tsx` | Shows/manages insights linked to work item |

### Settings (`src/components/settings/`)

| File | Purpose |
|------|---------|
| `workspace-feedback-settings.tsx` | Full admin panel for feedback config |

### Public Pages (`src/app/(public)/`)

| Path | Purpose |
|------|---------|
| `layout.tsx` | Minimal layout with gradient background |
| `feedback/[workspaceId]/page.tsx` | Public feedback submission |
| `widget/[workspaceId]/page.tsx` | Embeddable widget with URL params |
| `vote/[insightId]/page.tsx` | Public voting page |

### Insights Dashboard Page (`src/app/(dashboard)/`)

| Path | Purpose |
|------|---------|
| `workspaces/[id]/insights/page.tsx` | Dashboard route for insights |

---

## Keyboard Shortcuts (Triage Queue)

| Key | Action |
|-----|--------|
| `j` / `↓` | Next insight |
| `k` / `↑` | Previous insight |
| `R` | Mark as Reviewed |
| `A` | Mark as Actionable |
| `D` | Archive (Dismiss) |
| `L` | Link to work item |
| `Enter` | Open detail sheet |
| `/` | Focus search |
| `?` | Show help |

---

## Database Migration

**Migration**: `20251202120000_add_public_feedback_settings.sql`

```sql
-- Added to workspaces table:
ALTER TABLE workspaces ADD COLUMN public_feedback_settings JSONB DEFAULT '{
  "enabled": true,
  "widget_enabled": true,
  "voting_enabled": true,
  "require_email_verification": false
}'::jsonb;

-- Public helper functions with security:
CREATE FUNCTION check_public_feedback_enabled(workspace_id TEXT) ...
CREATE FUNCTION get_workspace_public_settings(workspace_id TEXT) ...
```

---

## Widget Embed System

### URL Parameters

```
/widget/[workspaceId]?theme=light|dark|auto
                     &primaryColor=#3B82F6
                     &requireEmail=true|false
```

### PostMessage Communication

```javascript
// Widget → Parent: Notify success
window.parent.postMessage({
  type: 'feedback-submitted',
  workspaceId: '...',
  timestamp: Date.now()
}, '*')
```

### Generated Embed Code

```html
<button id="feedback-widget-btn">Feedback</button>
<script>
document.getElementById('feedback-widget-btn').onclick = function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'https://yourapp.com/widget/abc123?theme=auto';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;...';
  document.body.appendChild(iframe);
};
</script>
```

---

## Rate Limiting Strategy

```typescript
const LIMITS = {
  feedback: { requests: 10, window: 15 * 60 * 1000 },  // 10 per 15 min
  vote: { requests: 30, window: 15 * 60 * 1000 },      // 30 per 15 min
}

// In-memory store with automatic cleanup every 5 minutes
const ipStore = new Map<string, { count: number, resetAt: number }>()
```

---

## CAPTCHA-Ready Architecture

```typescript
interface CaptchaProvider {
  name: 'recaptcha' | 'hcaptcha' | 'turnstile'
  siteKey: string
  verify: (token: string) => Promise<boolean>
}

// Placeholder for future integration
export function verifyCaptcha(
  provider: CaptchaProvider,
  token: string
): Promise<boolean> {
  // TODO: Implement provider-specific verification
  return Promise.resolve(true)
}
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-02 | Session 1: Database migration, dashboard stats, detail sheet | Claude |
| 2025-12-02 | Session 2: Triage queue, public pages, widget, voting, settings | Claude |
