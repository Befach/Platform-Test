# Component Selection Quick Reference

**Purpose**: Rapid component selection without loading full registry docs
**Last Updated**: 2025-01-17

---

## 30-Second Selection Guide

### I need a

**Form component** → Origin UI (59 inputs, 51 selects, 28 date pickers)
**Table/Data Grid** → shadcn/ui (TanStack) or Dice UI (virtualized)
**Kanban board** → Kibo UI or Dice UI
**Gantt chart** → Kibo UI (ONLY option)
**Chart/Graph** → shadcn/ui (Recharts integration)
**Rich text editor** → Kibo UI (ONLY option)
**AI chat interface** → Cult UI (agent patterns)
**3D animation** → Aceternity UI
**Landing page hero** → Magic UI or Aceternity UI
**Real-time cursor** → Kibo UI
**Video player** → Kibo UI
**Code block** → Kibo UI or Aceternity UI
**Rating stars** → Dice UI
**Color picker** → Kibo UI or Dice UI
**Image cropper** → Kibo UI, Dice UI, or Origin UI

---

## Registry Specializations (One-Liner)

| Registry | Best For | Unique Components |
|----------|----------|-------------------|
| **shadcn/ui** | Foundation, accessibility, production-ready | Data Table (TanStack), Chart (Recharts) |
| **Origin UI** | Forms, inputs, complete coverage | 600+ components, 59 inputs, 51 selects |
| **Kibo UI** | Project management, collaboration | Gantt, Kanban, Rich Text Editor, Real-time Cursor |
| **Aceternity UI** | 3D effects, advanced animations | 25+ backgrounds, 15+ card effects, parallax |
| **Magic UI** | Landing pages, marketing, SaaS | 150+ animated components, hero sections |
| **Cult UI** | AI applications, full-stack templates | AI agent patterns, Gemini/OpenAI blocks |
| **Dice UI** | Advanced controls, data management | Angle Slider, Virtualized Data Grid, Cropper |
| **Kokonut UI** | Modern design, animations | 100+ components, dark mode |
| **Eldora UI** | Animated landing pages | 150+ components, templates |
| **HextaUI** | Multiple themes, extended shadcn | 6 theme presets, OKLCH colors |
| **JollyUI** | Accessibility-first, React Aria | WAI-ARIA compliant, form patterns |
| **Animate UI** | Motion-first design | All animated by default |
| **ReUI** | Clean design, motion effects | Nested menus, Scrollspy, Drag & Drop |
| **Shadix UI** | Animated interactions | Confirmation flows, Motion Dialog |

---

## By Module (Platform Test Project)

### Week 3: Mind Mapping

```
shadcn/ui: Button, Dialog, Tooltip, Dropdown Menu, Popover
Aceternity UI: Canvas Reveal (optional), Background Beams (optional)
```

### Week 4: Feature Planning

```
Origin UI: Input, Select, Date Picker, Textarea
shadcn/ui: Data Table, Badge, Card, Tabs
Kibo UI: Editor (rich text)
```

### Week 4: Dependencies

```
shadcn/ui: Button, Dialog, Dropdown Menu, Badge, Tooltip
Aceternity UI: Background Lines (optional)
```

### Week 5: Review & Feedback

```
Origin UI: Input, Textarea, Radio, Checkbox
Dice UI: Rating
shadcn/ui: Card, Avatar, Badge, Toast
```

### Week 6: Timeline Visualization

```
Kibo UI: Gantt, Calendar, List, Table, Roadmap Block
shadcn/ui: Dropdown Menu, Button, Dialog, Tabs
```

### Week 6: Project Execution

```
Kibo UI: Kanban, Avatar Stack, Status
Dice UI: Tags Input
shadcn/ui: Badge, Card, Dropdown Menu
```

### Week 6: Collaboration

```
Kibo UI: Cursor, Avatar Stack, Collaborative Canvas Block
Aceternity UI: Following Pointer (optional)
shadcn/ui: Tooltip, Popover
```

### Week 7: Analytics & Metrics

```
shadcn/ui: Chart, Card, Badge, Tabs, Select
Kibo UI: Typography, Pill
Origin UI: Input, Select (custom metrics)
```

### Week 7: AI Assistant

```
Cult UI: Agent patterns (3 types), Gemini blocks
Magic UI: Animated List, Typewriter
shadcn/ui: Textarea, Button, Card, Scroll Area
```

### Week 7: Research & Discovery

```
Cult UI: Multi-Step Tool Pattern
Magic UI: Animated List, Marquee
shadcn/ui: Input, Card, Tabs, Command Palette
```

---

## Component Not Found?

If you can't find a component in the registries:

1. **Check shadcn/ui first** (most comprehensive base)
2. **Check Origin UI** (600+ components, highest coverage)
3. **Build custom with Radix UI primitives**
4. **Check npm for specialized packages** (e.g., `react-big-calendar`, `react-chartjs-2`)

---

## Installation Cheat Sheet

### shadcn/ui (CLI)

```bash
npx shadcn-ui@latest add button dialog table
```

### All Other Registries (Copy-Paste)

1. Visit registry website
2. Find component
3. Copy code
4. Paste into `components/ui/`
5. Install dependencies if needed

---

## Decision Tree (3 Questions)

### 1. Is it a standard UI element (button, input, dialog)?

**YES** → Use **shadcn/ui**
**NO** → Continue to Q2

### 2. Does it need heavy animation or 3D effects?

**YES** → Use **Aceternity UI** or **Magic UI**
**NO** → Continue to Q3

### 3. Is it a specialized component (Gantt, Kanban, AI)?

**YES** → Use **Kibo UI** (PM), **Cult UI** (AI), or **Dice UI** (advanced controls)
**NO** → Use **Origin UI** (forms) or **shadcn/ui** (base)

---

## Anti-Patterns (DON'T DO THIS)

❌ Loading multiple registries for same component type
❌ Using Origin UI for animations (use Aceternity/Magic instead)
❌ Using Aceternity UI for forms (use Origin UI instead)
❌ Building custom Gantt when Kibo UI has it
❌ Loading entire registry docs into context
❌ Mixing animation libraries (stick with Framer Motion)

✅ Stack registries by specialty (base + specialty)
✅ Use this guide as lookup (don't load all docs)
✅ Install only needed components
✅ Prefer registry component over custom build if available

---

## Context Budget (Per Module)

Aim for **< 3,000 tokens** per module in component selection:

- shadcn/ui base: ~1,000 tokens (5-10 components)
- Specialty registry: ~1,500 tokens (3-5 components)
- Custom code: ~500 tokens

**Total**: ~3,000 tokens (well within budget)

---

## Quick Links

**Full Guide**: [SHADCN_REGISTRY_COMPONENT_GUIDE.md](./SHADCN_REGISTRY_COMPONENT_GUIDE.md)
**shadcn/ui**: <https://ui.shadcn.com>
**Origin UI**: <https://coss.com/origin>
**Kibo UI**: <https://kibo-ui.com>
**Aceternity UI**: <https://ui.aceternity.com>
**Magic UI**: <https://magicui.design>
**Cult UI**: <https://cult-ui.com>

---

**Last Updated**: 2025-01-17
