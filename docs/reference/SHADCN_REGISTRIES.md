# shadcn/ui Registry Reference

**Last Updated**: 2025-11-26
**Purpose**: Comprehensive reference for third-party shadcn component registries

---

## Quick Reference

Install components from any registry:
```bash
npx shadcn@latest add [component] --registry [registry-name]
```

---

## Tier 1: Critical for This Project

### 1. Cult UI - AI Agent Patterns (Week 7)

**URL**: https://www.cult-ui.com/
**Install**: `npx shadcn@latest add [component] --registry cult-ui`

| Component | Description | Use Case |
|-----------|-------------|----------|
| Agent - Multi-Step Tool | Sequential tool execution | AI Assistant agentic mode |
| Agent - Orchestrator | Coordinates worker agents | Complex AI workflows |
| Agent - Routing | Classifies requests | Customer support AI |
| Agent - Parallelization | Concurrent execution | Batch processing |
| Agent - Evaluator | Quality assessment | AI response validation |
| Agent - Tool Pattern | External API integration | Tool calling |

**AI Chat Components**:
- `chat-input` - Message input with file upload
- `chat-message` - Message bubbles with markdown
- `chat-message-area` - Scrollable message container
- `ai-input-with-suggestions` - Autocomplete input

### 2. Kibo UI - Project Management (Week 6)

**URL**: https://kiboui.com/
**Install**: `npx shadcn@latest add [component] --registry kibo-ui`

| Component | Description | Alternative |
|-----------|-------------|-------------|
| **Gantt Chart** | Timeline visualization | **NONE** - Only Kibo has this |
| **Kanban Board** | Task management | Dice UI (basic) |
| **Real-time Cursor** | Live collaboration | **NONE** |
| Timeline | Event timeline | Multiple options |
| Roadmap | Product roadmap view | Custom build |

**Critical**: Kibo UI is the ONLY shadcn registry with a Gantt chart component.

### 3. Origin UI - Form Components (All Weeks)

**URL**: https://originui.com/
**Install**: `npx shadcn@latest add [component] --registry origin-ui`

600+ components including:
- 59 input variants
- 51 select components
- 28 date pickers
- 27 checkbox/radio styles
- 18 textarea variants
- 16 file upload components

---

## Tier 2: High Value

### 4. Aceternity UI - Visual Effects

**URL**: https://ui.aceternity.com/
**Use For**: Hero sections, landing pages, marketing

Key components:
- `background-beams` - Animated background
- `spotlight` - Cursor spotlight effect
- `text-generate-effect` - Typewriter animation
- `3d-card` - 3D hover cards

### 5. Magic UI - Animations

**URL**: https://magicui.design/
**Use For**: Micro-interactions, loading states

Key components:
- `animated-beam` - Connection animations
- `blur-fade` - Entrance animations
- `dot-pattern` - Background patterns
- `shimmer-button` - Loading buttons

### 6. Luxe UI - Premium Components

**URL**: https://luxeui.com/
**Use For**: Pro tier features, premium feel

Key components:
- `premium-card` - Elevated cards
- `glass-morphism` - Frosted glass effect
- `gradient-border` - Animated borders

---

## Tier 3: Specialized

### 7. AI Component Registries

| Registry | Focus | Best For |
|----------|-------|----------|
| @assistant-ui | Chat primitives | AI chat interfaces |
| @gaia | LLM components | Model integration |
| @prompt-kit | Prompt building | Prompt engineering UI |

### 8. Data Visualization

| Registry | Components | Use Case |
|----------|------------|----------|
| tremor | Charts, dashboards | Analytics (Week 7) |
| nivo | D3-based charts | Custom visualizations |

### 9. Marketing & Landing

| Registry | Focus |
|----------|-------|
| ibelick/background-snippets | Background effects |
| jollyui | Playful animations |
| indie-ui | Startup aesthetics |

---

## Implementation by Week

### Week 6: Timeline & Execution
```bash
# Gantt chart - REQUIRED
npx shadcn@latest add gantt-chart --registry kibo-ui

# Kanban board
npx shadcn@latest add kanban --registry kibo-ui

# Real-time collaboration
npx shadcn@latest add cursor --registry kibo-ui
```

### Week 7: AI Integration
```bash
# AI chat components
npx shadcn@latest add chat-input --registry cult-ui
npx shadcn@latest add chat-message --registry cult-ui

# AI agent patterns
npx shadcn@latest add agent-multi-step --registry cult-ui

# Analytics dashboards
npx shadcn@latest add area-chart --registry tremor
```

### Week 8: Billing & Polish
```bash
# Premium components for Pro tier
npx shadcn@latest add premium-card --registry luxe-ui

# Visual effects for marketing
npx shadcn@latest add background-beams --registry aceternity-ui
```

---

## Selection Guide

### Need a component? Check in this order:

1. **shadcn/ui core** - Check official registry first
2. **Origin UI** - For form components (largest selection)
3. **Kibo UI** - For project management (Gantt, Kanban)
4. **Cult UI** - For AI components
5. **Aceternity/Magic UI** - For visual effects

### Decision Matrix

| Need | First Choice | Alternative |
|------|--------------|-------------|
| Form inputs | Origin UI | shadcn core |
| Gantt chart | Kibo UI | Custom build |
| AI chat | Cult UI | @assistant-ui |
| Animations | Magic UI | Aceternity |
| Charts | Tremor | Recharts |
| Kanban | Kibo UI | Dice UI |

---

## Installation Notes

1. **Check compatibility** - Ensure registry supports your shadcn version
2. **Review dependencies** - Some components need additional packages
3. **Test styling** - Verify with your theme/tailwind config
4. **Check bundle size** - Animation libraries can be heavy

---

## Resources

- **Official Directory**: https://ui.shadcn.com/docs/directory
- **Registry Protocol**: https://ui.shadcn.com/docs/registry
- **80+ Registries Listed**: As of 2025

---

**See Also**:
- [COMPONENT_SELECTION_QUICK_REFERENCE.md](COMPONENT_SELECTION_QUICK_REFERENCE.md)
- [SHADCN_REGISTRY_COMPONENT_GUIDE.md](SHADCN_REGISTRY_COMPONENT_GUIDE.md)
