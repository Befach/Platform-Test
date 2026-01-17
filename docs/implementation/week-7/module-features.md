# Week 7: Module Features

**Last Updated:** 2026-01-14

[Back to Week 7 Overview](README.md)

---

## AI Assistant Module

**Active By Default:** All phases (always on, adapts to context)
**Purpose:** AI-powered assistance at every step

### Interface 1: Research Chat

**Location:** Left sidebar panel (always accessible)

**Features:**

- Chat interface with message history
- Web search buttons: **[Deep Research]** (Perplexity Sonar), **[Find Similar]** (Exa semantic)
- Save responses to Knowledge Base
- Multi-turn conversations (context aware)
- Rich formatting (code blocks, tables, bullet lists)
- Attachments (upload images, files)

**Models Used:**

- Primary: Claude Haiku 4.5 (general chat)
- Research: Perplexity Sonar (web search)
- Semantic: Exa API (finding similar content)

### Interface 2: Agentic Execution Panel [PRO TIER ONLY]

**Location:** Right sidebar panel (toggle on/off)

**Features:**

- Tool Calling Interface - AI uses tools to perform actions
- Preview Actions - See exactly what AI will do before execution
- Approval Workflow: AI proposes → User previews → Approve/Deny → Execute
- Batch Operations: "Create 10 features from CSV", "Assign all MVP features to Alex"
- Action History Log - Audit trail of all AI actions

**Model:** Claude Haiku 4.5 (best at tool calling with JSON)

**Available Tools (20+):**

| Category | Tools | Description |
|----------|-------|-------------|
| Feature Management | `create_feature`, `update_feature`, `delete_feature` | CRUD operations |
| Dependencies | `create_dependency`, `suggest_dependencies`, `analyze_critical_path` | Link features |
| Planning | `prioritize_features`, `estimate_difficulty`, `suggest_timeline` | Planning help |
| Execution | `assign_team`, `generate_execution_steps`, `update_status` | Tracking |
| Mind Mapping | `create_mind_map`, `convert_nodes_to_features`, `suggest_connections` | Visual ideation |
| Feedback | `analyze_feedback`, `summarize_reviews`, `extract_action_items` | Review insights |
| Research | `search_research`, `find_similar_features`, `get_market_data` | Information |
| Export | `export_data`, `generate_report`, `create_presentation` | Data output |
| Text | `improve_description`, `generate_user_story`, `translate_content` | Writing help |
| Analysis | `check_duplicates`, `identify_gaps`, `calculate_metrics` | Insights |

### Interface 3: Inline AI Assistance

**Location:** Throughout UI (context menus, floating buttons)

**Features:**

- "Improve this" buttons - Inline on text fields
- "Suggest..." actions - Context-aware recommendations
- Auto-complete - As you type (feature names, descriptions)
- Smart suggestions - Proactive AI help

**Model:** Grok 4 Fast (speed) or Claude Haiku (quality)

### AI Model Routing Strategy

**Goal:** Minimize cost while maximizing quality

| Task Type | Model | Cost | Why |
|-----------|-------|------|-----|
| Tool calling (agentic) | Claude Haiku 4.5 | $0.25/1M | Best at structured output |
| General chat | Claude Haiku 4.5 | $0.25/1M | Great quality, fast |
| Deep research | Perplexity Sonar | $1/1M | Web search capability |
| Semantic search | Exa API | $0.01/query | Finding similar content |
| Auto-complete (speed) | Grok 4 Fast | $0.50/1M | 2-3x faster response |
| Free tier overflow | GLM-4-Plus | $0.10/1M | 10x cheaper fallback |

---

## Analytics & Metrics Module

**Purpose:** Measure success, track performance, generate insights

### Pre-built Dashboards (4 Standard)

**1. Feature Overview**

- Total features by status (pie chart)
- Progress over time (line chart)
- Features by category (bar chart)
- Completion rate (percentage)

**2. Dependency Health**

- Critical path visualization (network graph)
- Blocked features (list with reasons)
- Risk score (gauge: Low/Medium/High)
- Bottlenecks (features blocking many others)

**3. Team Performance**

- Features completed per member (bar chart)
- Average completion time (metric card)
- Workload distribution (heatmap)
- Velocity trend (line chart)

**4. Success Metrics**

- Expected vs Actual (comparison table)
- Feature success rate (percentage)
- User feedback trends (line chart)
- Goals achieved (progress bars)

### Custom Dashboard Builder [PRO ONLY]

- Drag-and-drop widgets
- Chart Types (10+): Line, Bar, Pie, Scatter, Heatmap, Funnel, Gauge, Area, Radar, Treemap
- Widget Types: Metric Cards, Charts, Tables, Text Blocks, AI Insights

---

## Feedback Module

> **Full Design Spec:** See [work-board-3.0.md Part 8](../work-board-3.0.md#part-8-feedback-module-full-platform)

**Purpose:** Collect, analyze, and act on stakeholder and user feedback

### Multi-Channel Collection

| Channel | Description | Implementation |
|---------|-------------|----------------|
| In-App Widget | Floating feedback button | Build in-house |
| Public Links | Shareable feedback forms | Build in-house |
| Email Collection | Parse incoming emails | Resend/Postmark webhooks |
| Embeddable Iframe | External site integration | Build in-house (Pro) |
| SMS/WhatsApp | Text-based feedback | Twilio integration |
| Survey Imports | Import from SurveyMonkey/Typeform | API integration |

### AI-Powered Analysis

- Sentiment analysis (positive/neutral/negative)
- Auto-categorization (feature request, bug, question, praise)
- Theme extraction (group similar feedback)
- Action item extraction

### Feedback Lifecycle

```
New → Reviewed → Linked to Work Item → Implemented → Closed
```

---

## Integrations Module

> **Full Design Spec:** See [work-board-3.0.md Part 9](../work-board-3.0.md#part-9-integrations-module)

**Purpose:** Connect external services for enhanced feedback collection

### Build vs Integrate Decision Matrix

| Feature | Decision | Reason |
|---------|----------|--------|
| Custom Forms | BUILD | Core differentiator |
| AI Summarization | BUILD | Already have Claude |
| Email Parsing | BUILD | Simple webhooks |
| SMS/WhatsApp | INTEGRATE | Twilio is mature |
| Survey Imports | INTEGRATE | Complex APIs |
| Video Calls | INTEGRATE | Not core |

### Database Schema

```sql
CREATE TABLE team_integrations (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  provider TEXT NOT NULL,  -- 'twilio', 'surveymonkey', 'typeform'
  config JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## AI Visual Prototypes Module

> **Full Design Spec:** See [work-board-3.0.md Part 10](../work-board-3.0.md#part-10-ai-visual-prototype-feature)

**Purpose:** Generate visual UI mockups from text prompts

**Features:**

- Text-to-UI Generation - Describe a feature, get React/HTML code
- Interactive Preview - Sandboxed iframe with basic interactivity
- Feedback Collection - Share via public link, collect votes and comments
- Version History - Track iterations and compare side-by-side

### Database Schema

```sql
CREATE TABLE ui_prototypes (
  id TEXT PRIMARY KEY,
  work_item_id TEXT REFERENCES work_items(id),
  prompt TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  preview_url TEXT,
  version INT DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prototype_votes (
  id TEXT PRIMARY KEY,
  prototype_id TEXT REFERENCES ui_prototypes(id),
  user_id TEXT,  -- NULL for anonymous
  vote INT CHECK (vote IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### AI Generation Prompt Template

```
Generate a React component using shadcn/ui for: {user_prompt}

Context from work item:
- Title: {work_item.title}
- Description: {work_item.description}
- Resources: {work_item.resources}

Requirements:
- Use shadcn/ui components (Button, Card, Input, etc.)
- Use Tailwind CSS for styling
- Make it responsive
- Include basic interactivity
```

---

## Deliverables Summary

### AI & Analytics (Days 1-14)

- [x] AI chat panel with streaming responses
- [x] Agentic panel with tool calling
- [x] 20+ AI tools implemented
- [x] Usage tracking (1,000 msgs/user/month)
- [x] 4 pre-built analytics dashboards
- [x] Custom dashboard builder (Pro)

### Feedback & Integrations (Days 15-21)

- [x] Feedback Module with multi-channel collection
- [x] In-app widget, public links, email collection
- [x] AI-powered feedback analysis
- [x] Integrations Module (`team_integrations` table)
- [x] Twilio integration for SMS/WhatsApp
- [x] Survey imports (SurveyMonkey, Typeform)
- [x] AI Visual Prototype generation
- [x] Prototype preview and feedback collection

---

## Testing Checklists

### AI & Analytics Tests

- [ ] Open AI chat, send 5 messages
- [ ] Click [Deep Research], verify Perplexity used
- [ ] Open agentic panel
- [ ] Ask AI to "Create 3 features from this list"
- [ ] Verify preview appears
- [ ] Approve, verify features created
- [ ] Check usage counter increments
- [ ] View analytics dashboards
- [ ] Create custom dashboard with 5 widgets
- [ ] Verify data displays correctly

### Feedback Module Tests

- [ ] Submit feedback via in-app widget
- [ ] Generate public feedback link, submit external feedback
- [ ] Verify sentiment analysis runs on submission
- [ ] Test feedback auto-categorization
- [ ] Convert feedback to work item
- [ ] Link existing feedback to work item
- [ ] Update feedback status through lifecycle

### Integrations Module Tests

- [ ] Connect Twilio integration (test credentials)
- [ ] Send test SMS feedback message
- [ ] Import survey from SurveyMonkey/Typeform
- [ ] Disconnect integration, verify data retained
- [ ] Test OAuth2 flow for third-party services

### AI Visual Prototype Tests

- [ ] Generate prototype from text prompt
- [ ] Verify React/HTML code generated
- [ ] Test sandboxed iframe preview renders
- [ ] Share prototype via public link
- [ ] Submit vote and comment on prototype
- [ ] Create new version, compare side-by-side

---

[Back to Week 7 Overview](README.md)
