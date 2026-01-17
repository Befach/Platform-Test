# shadcn/ui Third-Party Registry Component Guide

> **Split Version Available**: This file has been split into smaller files for better AI readability. See [shadcn/README.md](shadcn/README.md) for the organized version.

**Last Updated**: 2025-01-17
**Purpose**: Strategic component selection guide for choosing the right registry based on use case
**Total Registries**: 14 analyzed

---

## Quick Selection Matrix

| Use Case | Primary Registry | Alternative Options | Rationale |
|----------|------------------|---------------------|-----------|
| **Landing Pages** | Magic UI, Aceternity UI | Origin UI, Cult UI | Heavy animations, hero sections, marketing focus |
| **Dashboards** | Kibo UI, Origin UI | HextaUI, shadcn/ui | Tables, charts, data visualization, project management |
| **Authentication** | Origin UI, shadcn/ui | Kokonut UI | Forms, inputs, validation, production-ready |
| **Forms & Data Entry** | Origin UI, Dice UI | shadcn/ui, HextaUI | 50+ input variants, validation, accessibility |
| **AI Chat Interface** | Cult UI, Magic UI | Animate UI | AI agents, streaming, tool calling patterns |
| **Project Management** | Kibo UI | Origin UI, Dice UI | Kanban, Gantt, Calendar, Timeline |
| **Real-time Collaboration** | Kibo UI | Aceternity UI | Cursors, avatars, live presence |
| **Marketing/SaaS** | Aceternity UI, Magic UI | Kokonut UI | Animations, testimonials, pricing tables |
| **Code/Developer Tools** | Kibo UI, Dice UI | shadcn/ui | Code blocks, syntax highlighting, sandboxes |
| **Media/Social** | Kibo UI, Origin UI | Aceternity UI | Video players, stories, reels, image crop |
| **Minimalist/Clean** | shadcn/ui, Origin UI | ReUI | Base components, no heavy animations |
| **3D/Advanced Effects** | Aceternity UI | Magic UI | 3D cards, parallax, advanced animations |

---

## Registry Deep Dive

### 1. shadcn/ui (Official Registry)

**Total Components**: 60+
**Focus**: Foundation components, accessibility-first, production-ready
**Tech Stack**: Radix UI + Tailwind CSS + React Hook Form + Zod

#### Component Categories

**Forms & Input** (17 components)

- Button, Input, Textarea, Label, Checkbox, Radio Group, Switch, Select, Native Select
- Combobox, Input OTP, Input Group, Field, Slider, Toggle, Toggle Group, Calendar, Date Picker

**Data Display** (7 components)

- Table, Data Table (TanStack), Card, Badge, Avatar, Skeleton, Empty

**Navigation** (7 components)

- Breadcrumb, Pagination, Navigation Menu, Menubar, Tabs, Sidebar, Button Group

**Overlays & Dialogs** (9 components)

- Dialog, Alert Dialog, Drawer, Sheet, Popover, Hover Card, Context Menu, Dropdown Menu, Tooltip

**Layout** (6 components)

- Separator, Scroll Area, Aspect Ratio, Resizable, Item, Collapsible

**Feedback** (4 components)

- Alert, Toast, Sonner, Spinner, Progress

**Advanced** (5 components)

- Chart (Recharts), Carousel (Embla), Command Palette, Kbd, Typography

#### Best For

- Core application structure
- Accessible forms and data tables
- Production-ready components with extensive testing
- Base layer before adding animated registries

#### Unique Strengths

- Most mature and tested
- Best accessibility (ARIA compliant)
- Excellent TypeScript support
- Zod + React Hook Form integration

---

### 2. Magic UI

**Total Components**: 150+ (50+ free, 100+ Pro)
**Focus**: Animation-heavy, landing pages, marketing sites
**Tech Stack**: React + TypeScript + Tailwind CSS + Framer Motion

#### Component Categories

**Text Animations**

- Animated gradient text, Typewriter effect, Text reveal, Flip text, Scroll-based text effects

**Interactive Cards**

- Animated cards, Hover effects, 3D transforms, Magnetic buttons

**Backgrounds & Effects**

- Animated backgrounds, Particles, Gradients, Mesh gradients, Dot patterns, Grid backgrounds

**Hero Sections**

- Animated hero components, Spotlight effects, Marquee, Bento grids

**Data Visualization**

- Animated lists, Number counters, Progress bars with motion

**Layout Components**

- Dock (macOS style), Sidebar, Navbar with animations

#### Best For

- SaaS landing pages
- Product marketing sites
- Startup websites
- Animated portfolios

#### Unique Strengths

- Highest quality animations
- Framer Motion integration
- Production-grade performance
- Copy-paste ready with no dependencies

#### Magic UI Pro Features

- 50+ blocks and templates
- Complete landing page sections
- Advanced animation patterns
- Priority support

---

### 3. Aceternity UI

**Total Components**: 100+ (80+ free, 20+ Pro packs)
**Focus**: 3D effects, advanced animations, visual storytelling
**Tech Stack**: Next.js + React + Tailwind CSS + Framer Motion

#### Component Categories by Type

**Backgrounds (25+ components)**

- Dotted Glow Background, Background Ripple Effect, Sparkles, Aurora Background
- Background Beams, Background Boxes, Background Lines, Meteors, Shooting Stars
- Vortex, Spotlight, Canvas Reveal Effect, SVG Mask Effect, Grid/Dot Backgrounds
- Wavy Background, Gradient Animation, Google Gemini Effect, Glowing Effect

**Card Components (15+ variants)**

- 3D Card Effect, Evervault Card, Card Stack, Card Hover Effect, Wobble Card
- Expandable Card, Card Spotlight, Focus Cards, Infinite Moving Cards, Draggable Card
- Comet Card, Glare Card, Direction Aware Hover, Tooltip Card, Pixelated Canvas

**Text Effects (12 components)**

- Encrypted Text, Layout Text Flip, Colourful Text, Text Generate Effect, Typewriter Effect
- Flip Words, Text Hover Effect, Container Text Flip, Hero Highlight, Text Reveal Card

**Scroll & Parallax (5 components)**

- Parallax Scroll, Sticky Scroll Reveal, Macbook Scroll, Container Scroll Animation, Hero Parallax

**Navigation (7 components)**

- Floating Navbar, Navbar Menu, Sidebar, Floating Dock (macOS style)
- Tabs, Resizable Navbar, Sticky Banner

**Buttons (4 components)**

- Tailwind CSS Buttons, Hover Border Gradient, Moving Border, Stateful Button

**Forms & Inputs (3 components)**

- Signup Form, Placeholders And Vanish Input, File Upload

**Layout & Grid (3 components)**

- Layout Grid, Bento Grid, Container Cover

**Data Visualization (4 components)**

- GitHub Globe, World Map, Timeline, Codeblock

**3D Components (2 components)**

- 3D Pin, 3D Marquee

**Specialized (10+ components)**

- Animated Modal, Animated Tooltip, Link Preview, Images Slider, Carousel
- Apple Cards Carousel, Testimonials, Compare, Following Pointer, Lens

#### Best For

- Premium landing pages
- Product showcases
- Storytelling websites
- High-end SaaS marketing

#### Unique Strengths

- Most advanced 3D effects
- Highest visual impact
- Perfect for "wow factor"
- Used by Google, Microsoft, Cisco employees

#### Aceternity UI Pro

- 70+ premium component packs
- 8+ complete templates
- Lifetime updates
- Advanced animation patterns

---

### 4. Origin UI (coss.com)

**Total Components**: 600+ across 40+ categories
**Focus**: Complete form library, data entry, comprehensive coverage
**Tech Stack**: Tailwind CSS + React + Base UI

#### Complete Component List

| Component | Count | Category | Use Cases |
|-----------|-------|----------|-----------|
| **Input** | 59 | Forms | Text fields, search, number, email, phone validation |
| **Button** | 54 | Interaction | Primary, secondary, icon, loading, grouped buttons |
| **Select** | 51 | Forms | Dropdowns, multi-select, searchable, grouped options |
| **Calendar & Date Picker** | 28 | Input | Single date, range, time picker, datetime combinations |
| **Slider** | 27 | Input | Range, multi-thumb, vertical, labeled sliders |
| **Avatar** | 23 | Display | User avatars, groups, status indicators, fallbacks |
| **Notification** | 22 | Feedback | Toast, banner, inline alerts, action notifications |
| **Dialog** | 21 | Modals | Confirmations, forms, multi-step, fullscreen |
| **Accordion** | 20 | Layout | FAQ, collapsible content, nested accordions |
| **Checkbox** | 20 | Forms | Single, groups, indeterminate, labeled checkboxes |
| **Radio** | 20 | Forms | Single selection, cards, images, grouped options |
| **Table** | 20 | Data Display | Sortable, filterable, paginated, expandable rows |
| **Tabs** | 20 | Navigation | Horizontal, vertical, pills, underlined styles |
| **Navbar** | 20 | Navigation | Top, sticky, mobile responsive, with dropdowns |
| **Textarea** | 19 | Forms | Auto-resize, character count, validation |
| **Stepper** | 17 | Forms | Multi-step forms, progress tracking, validation |
| **Switch** | 17 | Forms | Toggle on/off, labeled, sizes, colors |
| **Tree** | 15 | Navigation | File explorer, hierarchical data, expandable nodes |
| **Dropdown** | 15 | Navigation | Menu, actions, nested, with icons |
| **File Upload** | 14 | Input | Drag-drop, multiple files, progress, previews |
| **Badge** | 13 | Labels | Status, counts, removable, colors, sizes |
| **Banner** | 12 | Messaging | Announcements, warnings, info bars |
| **Alert** | 12 | Feedback | Success, error, warning, info alerts |
| **Timeline** | 12 | Display | Vertical, horizontal, events, milestones |
| **Pagination** | 12 | Navigation | Page numbers, prev/next, jump to page |
| **Tooltip** | 12 | Tooltips | Hover, click, positioning, arrows |
| **Image Cropper** | 11 | Media | Aspect ratios, zoom, rotate, preview |
| **Popover** | 9 | Tooltips | Rich content, forms, menus, positioning |
| **Breadcrumb** | 8 | Navigation | Path navigation, separators, truncation |
| **Event Calendar** | 1 | Calendar | Month view, event management |

#### Best For

- Form-heavy applications
- Admin dashboards
- Data entry systems
- E-commerce checkout flows

#### Unique Strengths

- Largest component variety (600+ total)
- Most input/form variants (59 inputs, 51 selects)
- Complete coverage for standard UI needs
- Dark mode on all components

---

### 5. Kibo UI

**Total Components**: 40+
**Focus**: Project management, collaboration, developer tools
**Tech Stack**: React + TypeScript + Tailwind CSS + Radix UI

#### Component Categories

**Project Management (6 components)**

- Calendar (grid view), Gantt (timeline), Kanban (board), List, Table, Roadmap (all view types)

**Collaboration (2 components)**

- Avatar Stack (overlapping avatars), Cursor (real-time presence)

**Code (4 components)**

- Code Block (syntax highlighting + copy), Contribution Graph (GitHub-style)
- Sandbox (component preview), Snippet (tabbed code display)

**Forms (5 components)**

- Choicebox (card-styled radio/checkbox), Combobox (autocomplete)
- Dropzone (file upload), Mini Calendar (date picker), Tags (multi-label)

**Images (2 components)**

- Image Crop (aspect ratios), Image Zoom (zoom functionality)

**Finance (2 components)**

- Credit Card (payment display), Ticker (finance ticker)

**Social (3 components)**

- Stories (carousel format), Reel (Instagram-style), Video Player (media-chrome)

**Callouts (2 components)**

- Announcement (badge-style), Banner (full-width)

**Other (14+ components)**

- Color Picker (Figma-inspired), Comparison (slider-based), Deck (Tinder cards)
- Dialog Stack (multi-step wizards), Editor (rich text), Glimpse (URL preview)
- Marquee (scrolling), Pill (badges), QR Code, Rating (stars)
- Relative Time (timezone), Spinner, Status (uptime), Theme Switcher, Tree, Typography

#### Pre-composed Blocks

- Codebase (file explorer + viewer)
- Collaborative Canvas (real-time)
- Form (event creation)
- Hero (product intro)
- Pricing (plan comparison)
- Roadmap (all views)

#### Best For

- Product roadmap tools
- Project management apps
- Developer documentation sites
- SaaS dashboards with Gantt/Kanban

#### Unique Strengths

- ONLY registry with Gantt chart
- Real-time collaboration components
- GitHub-style contribution graph
- Video player and media components
- Rich text editor component

---

### 6. Cult UI

**Total Components**: 15+ (6 AI blocks, 6 templates, 3 components)
**Focus**: AI-powered applications, full-stack templates
**Tech Stack**: Next.js + Supabase + Tailwind CSS + shadcn/ui

#### Components

- Toolbar Expandable (step-based expandable toolbar)

#### AI-Powered Blocks

1. **Gemini Flash Image Editor** - Generate/edit images with version history
2. **Agent - Multi-Step Tool Pattern** - Sequential AI with web search + analysis
3. **Agent - Orchestrator Pattern** - Specialized workers for project management
4. **Agent - Routing Pattern** - Route requests to specialized AI agents with streaming
5. **Gemini Flash Text** - Text generation + market research with charts
6. **Gemini Flash Image Generator** - Image generation with rate limiting

#### Full-Stack Templates

1. **Logo GPT** - AI logo generation with DALL-E + token currency
2. **Directory** - Automated directory with AI enrichment + web scraping
3. **Travel Stash** - PWA for travel planning with offline support
4. **Landing Page** - Framer Motion animations
5. **Cult SEO** - Website analysis with crawling + performance testing
6. **Manifest** - Vector embedding for RAG-based AI

#### Best For

- AI chat applications
- Multi-agent AI systems
- Full-stack SaaS products
- AI image generation tools

#### Unique Strengths

- ONLY registry with AI agent patterns
- Google Gemini + OpenAI + Claude integrations
- Full-stack authentication templates
- Production-ready AI workflows
- "Configured for vibe coding"

---

### 7. JollyUI

**Total Components**: 10+ (small, focused collection)
**Focus**: React Aria accessibility, form-heavy use cases
**Tech Stack**: React Aria + shadcn/ui + Tailwind CSS

#### Available Components

- Payment Method Card (card number, expiration, CVC)
- Create Account Form (email/password + social login)
- Date Picker (month/day/year fields)
- Cookie Settings (preference management with toggles)
- Tabs System (Tab, TabList, TabPanel, related subcomponents)
- Blog/Changelog Display (content presentation with titles)

#### Best For

- Accessibility-first applications
- Form-heavy authentication flows
- Cookie consent and preference management
- Blog and content sites

#### Unique Strengths

- React Aria foundation (best accessibility)
- WAI-ARIA compliant
- Practical, real-world patterns
- Copy-paste ready

---

### 8. Animate UI

**Total Components**: Estimated 20-30 (limited documentation)
**Focus**: Fully animated components, motion-first design
**Tech Stack**: React + TypeScript + Tailwind CSS + Framer Motion + shadcn CLI

#### Known Components

- Flip Card
- Management Bar
- Notification List
- Pin List
- Playful Todolist
- Radial Intro
- Radial Nav
- Share Button
- User Presence Avatar

#### Best For

- Motion-heavy interfaces
- Interactive dashboards
- Animated notifications
- Playful UX

#### Unique Strengths

- All components animated by default
- shadcn CLI compatible
- Open-source and customizable

---

### 9. ReUI

**Total Components**: 50+
**Focus**: shadcn/ui + animated effects, clean design
**Tech Stack**: React + TypeScript + Tailwind CSS + Motion

#### Component Categories (from keywords)

**Core UI** - Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Chart, Checkbox, Collapsible, Command, Context Menu

**Data & Tables** - Data Grid, Data Grid Table, Data Grid Drag & Drop

**Dialogs & Menus** - Dialog, Drawer, Dropdown Menu, Hover Card, Menubar, Navigation Menu, Nested Menu

**Forms & Input** - Form, Input, Input OTP, KBD, Label, Radio Group, Select, Textarea, Toggle, Toggle Group

**Layout** - List, Pagination, Progress, Resizable, Scroll Area, Scrollspy, Separator, Sheet, Skeleton, Slider, Spinners, Switch, Table, Tabs, Tooltip

**Special** - Popover, Sonner (toast notifications)

#### Best For

- Clean, professional designs
- Motion effects without overwhelming
- shadcn/ui extension
- Business applications

#### Unique Strengths

- Motion library integration
- Nested menu support
- Scrollspy component
- Data grid with drag & drop

---

### 10. Dice UI

**Total Components**: 29 components + 8 utilities
**Focus**: Advanced interactions, data management, accessibility
**Tech Stack**: React + TypeScript + Tailwind CSS + shadcn/ui

#### Complete Component List

**Interactive Controls (10 components)**

- Angle Slider, Avatar Group, Checkbox Group, Color Picker, Color Swatch
- Combobox, Compare Slider, Mask Input, Rating, Tags Input

**Data & Display (8 components)**

- Circular Progress, Data Grid (virtualized), Data Table, Listbox
- Marquee, QR Code, Relative Time Card, Scroller

**Content Management (8 components)**

- Cropper, Editable, File Upload, Kanban, Mention, Sortable, Stack, Stepper

**UI Elements (2 components)**

- Kbd, Segmented Input

**Utilities (8 utilities)**

- Client Only, Composition, Direction Provider, Hitbox, Portal, Presence, Visually Hidden, Visually Hidden Input

#### Best For

- Data-heavy applications
- Kanban boards
- Image/video editing features
- Advanced form controls

#### Unique Strengths

- Angle slider (unique component)
- High-performance data grid
- Cropper with zoom/rotation
- Compare slider (before/after)
- Virtualized table support

---

### 11. Eldora UI

**Total Components**: 150+
**Focus**: Animated components, landing page blocks, templates
**Tech Stack**: React + TypeScript + Tailwind CSS + Headless UI + Framer Motion

#### Component Categories

- Animated components (motion effects)
- Landing page blocks
- Full templates
- Dark mode by default on all components

#### Best For

- Landing pages with animations
- Marketing sites
- Portfolio sites
- Startups

#### Unique Strengths

- 150+ components
- Dark mode built-in
- Active Discord community
- Portfolio template included

---

### 12. HextaUI

**Total Components**: 50+ components + blocks
**Focus**: Extended shadcn/ui components, modern design
**Tech Stack**: React + TypeScript + Tailwind CSS + Radix UI

#### Known Components

- Avatar, Button, Drawer, Separator, Toggle, File Upload
- Date Picker, Dropdown Menu, Select, Sidebar, Typewriter
- All standard shadcn/ui components extended

#### Theme Presets

- Default, Retro Blue, Purple, Night Wind, Orbiter, Soft Orange
- Light & dark modes for each theme

#### Best For

- Extended shadcn/ui needs
- Multiple theme support
- Professional design
- Corporate applications

#### Unique Strengths

- 6 theme presets (most of any registry)
- OKLCH color space
- 400+ GitHub stars
- Community-driven

---

### 13. Shadix UI

**Total Components**: Limited (newer registry)
**Focus**: Animated interactions, confirmation flows
**Tech Stack**: TypeScript + Framer Motion + Tailwind CSS + shadcn/ui

#### Known Components

- Action Button (confirmation popup for destructive actions)
- Motion Dialog (multiple animation variants: Ripple, Zoom)

#### Best For

- Animated modals
- Confirmation flows
- Destructive action safeguards
- Modern interactions

#### Unique Strengths

- Framer Motion animations
- Fully typed TypeScript
- Easy shadcn CLI integration
- Accessible design

---

## Component Availability Matrix

### Forms & Input Components

| Component | shadcn/ui | Origin UI | Kibo UI | Dice UI | HextaUI | Magic UI | Aceternity |
|-----------|-----------|-----------|---------|---------|---------|----------|------------|
| **Basic Input** | ✅ (7) | ✅ (59) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Select/Dropdown** | ✅ | ✅ (51) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Date Picker** | ✅ | ✅ (28) | ✅ Mini | ✅ | ✅ | ✅ | ❌ |
| **File Upload** | ❌ | ✅ (14) | ✅ Dropzone | ✅ | ✅ | ✅ | ✅ |
| **Rich Text Editor** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Color Picker** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tags Input** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Angle Slider** | ❌ | ❌ | ❌ | ✅ ONLY | ❌ | ❌ | ❌ |
| **Mask Input** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Data Display Components

| Component | shadcn/ui | Origin UI | Kibo UI | Dice UI | Aceternity | Magic UI |
|-----------|-----------|-----------|---------|---------|------------|----------|
| **Table** | ✅ + TanStack | ✅ (20) | ✅ | ✅ | ❌ | ❌ |
| **Data Grid** | ❌ | ❌ | ❌ | ✅ Virtualized | ❌ | ❌ |
| **Kanban** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Gantt Chart** | ❌ | ❌ | ✅ ONLY | ❌ | ❌ | ❌ |
| **Calendar** | ✅ | ✅ (28) | ✅ Grid | ❌ | ❌ | ❌ |
| **Timeline** | ❌ | ✅ (12) | ❌ | ❌ | ✅ | ❌ |
| **Charts** | ✅ Recharts | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tree** | ❌ | ✅ (15) | ✅ | ❌ | ❌ | ❌ |

### Project Management Components

| Component | Kibo UI | Dice UI | Origin UI | shadcn/ui |
|-----------|---------|---------|-----------|-----------|
| **Kanban** | ✅ | ✅ | ❌ | ❌ |
| **Gantt** | ✅ ONLY | ❌ | ❌ | ❌ |
| **Calendar View** | ✅ | ❌ | ✅ | ✅ |
| **List View** | ✅ | ✅ Listbox | ❌ | ❌ |
| **Table View** | ✅ | ✅ | ✅ | ✅ |
| **Roadmap Block** | ✅ All views | ❌ | ❌ | ❌ |

### Animation & Effects

| Component | Aceternity | Magic UI | Eldora UI | Animate UI | Kokonut UI |
|-----------|------------|----------|-----------|------------|------------|
| **Background Effects** | ✅ (25+) | ✅ | ✅ | ✅ | ✅ |
| **Text Animations** | ✅ (12) | ✅ | ✅ | ✅ | ✅ |
| **3D Effects** | ✅ (10+) | ✅ | ❌ | ❌ | ❌ |
| **Card Animations** | ✅ (15+) | ✅ | ✅ | ✅ | ✅ |
| **Parallax** | ✅ (5) | ✅ | ❌ | ❌ | ❌ |
| **Scroll Effects** | ✅ | ✅ | ✅ | ❌ | ✅ |

### Collaboration Components

| Component | Kibo UI | Aceternity | Others |
|-----------|---------|------------|--------|
| **Live Cursors** | ✅ | ✅ Following Pointer | ❌ |
| **Avatar Stack** | ✅ | ❌ | ✅ Dice UI |
| **Presence** | ✅ User Presence | ❌ | ❌ |
| **Real-time Canvas** | ✅ Block | ❌ | ❌ |

### Media Components

| Component | Kibo UI | Dice UI | Origin UI | Aceternity |
|-----------|---------|---------|-----------|------------|
| **Video Player** | ✅ | ✅ | ❌ | ❌ |
| **Image Crop** | ✅ | ✅ | ✅ (11) | ❌ |
| **Image Zoom** | ✅ | ❌ | ❌ | ✅ Lens |
| **Stories** | ✅ | ❌ | ❌ | ❌ |
| **Reel** | ✅ | ❌ | ❌ | ❌ |
| **Compare Slider** | ❌ | ✅ | ❌ | ✅ |

### AI & Developer Tools

| Component | Cult UI | Kibo UI | Dice UI | Aceternity |
|-----------|---------|---------|---------|------------|
| **AI Agent Patterns** | ✅ (3) ONLY | ❌ | ❌ | ❌ |
| **Code Block** | ❌ | ✅ | ❌ | ✅ |
| **Syntax Highlighting** | ❌ | ✅ | ❌ | ✅ |
| **Sandbox** | ❌ | ✅ | ❌ | ❌ |
| **File Explorer** | ❌ | ✅ Block | ❌ | ❌ |
| **Contribution Graph** | ❌ | ✅ ONLY | ❌ | ✅ GitHub Globe |

---

## Strategic Recommendations by Module

### Mind Mapping Module (Week 3)

**Primary**: shadcn/ui
**Additions**: Aceternity UI (Canvas Reveal, Background Beams)

**Rationale**:

- Use shadcn/ui for controls (buttons, dialogs, tooltips)
- Add Aceternity's Canvas Reveal for node hover effects
- Background Beams for visual polish

**Components Needed**:

- `shadcn/ui`: Button, Dialog, Tooltip, Dropdown Menu, Popover
- `Aceternity`: Canvas Reveal Effect, Background Beams (optional)

---

### Feature Planning Module (Week 4)

**Primary**: Origin UI
**Additions**: shadcn/ui (Data Table), Kibo UI (Rich Text Editor)

**Rationale**:

- Origin UI has 59 input variants for custom fields
- shadcn/ui Data Table for feature list
- Kibo UI for rich text descriptions

**Components Needed**:

- `Origin UI`: Input (59 variants), Select (51 variants), Date Picker, Textarea
- `shadcn/ui`: Data Table, Badge, Card
- `Kibo UI`: Editor (rich text)

---

### Dependency Management Module (Week 4)

**Primary**: shadcn/ui
**Additions**: Aceternity UI (Background Lines for graph visualization)

**Rationale**:

- Custom ReactFlow implementation for graph
- shadcn/ui for controls and modals
- Aceternity for visual enhancement

**Components Needed**:

- `shadcn/ui`: Button, Dialog, Dropdown Menu, Badge, Tooltip
- `Aceternity`: Background Lines, Tracing Beam (optional)

---

### Review & Feedback Module (Week 5)

**Primary**: Origin UI
**Additions**: shadcn/ui, Kokonut UI

**Rationale**:

- Origin UI for extensive form variants (feedback forms)
- shadcn/ui for core structure
- Kokonut UI for polished review cards

**Components Needed**:

- `Origin UI`: Input, Textarea, Radio, Checkbox, Rating (if exists)
- `shadcn/ui`: Card, Avatar, Badge, Toast
- `Dice UI`: Rating component

---

### Timeline Visualization Module (Week 6)

**Primary**: Kibo UI (Gantt chart)
**Additions**: shadcn/ui

**Rationale**:

- ONLY registry with Gantt chart component
- Kibo UI also has Calendar, List, Table views
- shadcn/ui for controls

**Components Needed**:

- `Kibo UI`: Gantt, Calendar, List, Table, Roadmap Block
- `shadcn/ui`: Dropdown Menu, Button, Dialog, Tabs

---

### Project Execution Module (Week 6)

**Primary**: Kibo UI
**Additions**: Dice UI, shadcn/ui

**Rationale**:

- Kibo UI has Kanban + all project management views
- Dice UI for additional Kanban variant
- shadcn/ui for base components

**Components Needed**:

- `Kibo UI`: Kanban, Avatar Stack, Status, Mini Calendar
- `Dice UI`: Kanban (alternative), Tags Input
- `shadcn/ui`: Badge, Card, Dropdown Menu

---

### Collaboration Module (Week 6)

**Primary**: Kibo UI
**Additions**: Aceternity UI (cursors)

**Rationale**:

- Kibo UI has Cursor + Avatar Stack + Collaborative Canvas
- Aceternity UI for Following Pointer effect
- shadcn/ui for base components

**Components Needed**:

- `Kibo UI`: Cursor, Avatar Stack, Collaborative Canvas Block
- `Aceternity`: Following Pointer, Pointer Highlight
- `shadcn/ui`: Tooltip, Popover

---

### Analytics & Metrics Module (Week 7)

**Primary**: shadcn/ui (Chart with Recharts)
**Additions**: Kibo UI (dashboard blocks)

**Rationale**:

- shadcn/ui Chart component uses Recharts (10+ chart types)
- Kibo UI has dashboard blocks and typography
- Origin UI for custom metric inputs

**Components Needed**:

- `shadcn/ui`: Chart, Card, Badge, Tabs, Select
- `Kibo UI`: Typography, Pill
- `Origin UI`: Input, Select (for custom metrics)

---

### AI Assistant Module (Week 7)

**Primary**: Cult UI
**Additions**: Magic UI, shadcn/ui

**Rationale**:

- Cult UI has AI agent patterns (Multi-Step, Orchestrator, Routing)
- Magic UI for animated chat bubbles
- shadcn/ui for core structure

**Components Needed**:

- `Cult UI`: Agent patterns (3 types), Gemini integration blocks
- `Magic UI`: Animated List (for chat messages), Typewriter
- `shadcn/ui`: Textarea, Button, Card, Scroll Area

---

### Research & Discovery Module (Week 7)

**Primary**: Cult UI
**Additions**: shadcn/ui, Magic UI

**Rationale**:

- Cult UI has web search integration
- Magic UI for animated search results
- shadcn/ui for core structure

**Components Needed**:

- `Cult UI`: Multi-Step Tool Pattern (web search)
- `Magic UI`: Animated List, Marquee
- `shadcn/ui`: Input, Card, Tabs, Scroll Area, Command Palette

---

## Installation Priority

### Week 3 (Mind Mapping)

```bash
# shadcn/ui components
npx shadcn-ui@latest add button dialog tooltip dropdown-menu popover

# Aceternity UI (copy-paste from website)
# - Canvas Reveal Effect (optional)
# - Background Beams (optional)
```

### Week 4 (Feature Planning + Dependencies)

```bash
# shadcn/ui components
npx shadcn-ui@latest add data-table badge card tabs select

# Origin UI (copy-paste from coss.com)
# - Input (select needed variants)
# - Select (select needed variants)
# - Date Picker
# - Textarea

# Kibo UI (copy-paste from kokonutui.com)
# - Editor (rich text)
```

### Week 5 (Review & Feedback)

```bash
# Origin UI
# - Input, Textarea, Radio, Checkbox

# Dice UI
# - Rating

# shadcn/ui
npx shadcn-ui@latest add card avatar badge toast
```

### Week 6 (Timeline + Execution + Collaboration)

```bash
# Kibo UI (CRITICAL for Gantt)
# - Gantt, Kanban, Calendar, Avatar Stack, Cursor, Roadmap Block

# shadcn/ui
npx shadcn-ui@latest add dropdown-menu tabs
```

### Week 7 (AI + Analytics + Research)

```bash
# Cult UI
# - AI Agent patterns (all 3)
# - Gemini integration blocks

# Magic UI
# - Animated List
# - Typewriter Effect

# shadcn/ui
npx shadcn-ui@latest add chart scroll-area command
```

---

## Registry Selection Decision Tree

```
START: What are you building?

├─ Forms & Data Entry?
│  ├─ Standard forms → shadcn/ui
│  ├─ Complex validation → Origin UI (59 inputs)
│  └─ Rich text editing → Kibo UI (Editor)
│
├─ Data Visualization?
│  ├─ Charts & graphs → shadcn/ui (Chart/Recharts)
│  ├─ Tables → shadcn/ui (Data Table)
│  ├─ Kanban → Kibo UI or Dice UI
│  └─ Gantt → Kibo UI (ONLY option)
│
├─ Landing Page?
│  ├─ Heavy animations → Aceternity UI
│  ├─ Marketing focus → Magic UI
│  └─ Clean/minimal → Origin UI or shadcn/ui
│
├─ AI Features?
│  ├─ Chat interface → Cult UI (agent patterns)
│  ├─ Image generation → Cult UI (Gemini blocks)
│  └─ Tool calling → Cult UI (orchestrator)
│
├─ Real-time Collaboration?
│  ├─ Live cursors → Kibo UI
│  ├─ Presence → Kibo UI
│  └─ Avatar stack → Kibo UI or Dice UI
│
├─ Media/Social?
│  ├─ Video player → Kibo UI
│  ├─ Image crop → Kibo UI or Dice UI
│  └─ Stories/Reels → Kibo UI (ONLY)
│
└─ Developer Tools?
   ├─ Code blocks → Kibo UI or Aceternity
   ├─ File explorer → Kibo UI
   └─ Contribution graph → Kibo UI (ONLY)
```

---

## Context Optimization Strategy

### Problem

Adding all 14 registries would consume excessive context (20k+ tokens).

### Solution: Just-in-Time Component Selection

1. **Use this guide to identify which registry has the component you need**
2. **Only reference/install from 1-2 registries per module**
3. **Avoid loading multiple registries for the same component type**

### Example: Feature Planning Module

**BAD** (wastes context):

```
Ask about: shadcn/ui inputs + Origin UI inputs + HextaUI inputs
Result: 100+ input variants loaded, 5k+ tokens
```

**GOOD** (strategic):

```
Use: Origin UI (59 inputs) + shadcn/ui (Data Table only)
Result: Exactly what's needed, ~2k tokens
```

### Registry Context Cost Estimates

| Registry | Avg Tokens per Component | Total if Loaded |
|----------|--------------------------|-----------------|
| shadcn/ui | ~300 | 18,000 (60 components) |
| Origin UI | ~200 | 120,000 (600 components) |
| Aceternity UI | ~500 | 50,000 (100 components) |
| Magic UI | ~400 | 60,000 (150 components) |
| Kibo UI | ~350 | 14,000 (40 components) |
| Cult UI | ~800 | 12,000 (15 items) |
| Dice UI | ~300 | 8,700 (29 components) |

**Total if all loaded**: 282,700 tokens (exceeds most context windows)

### Optimization Rules

1. **Never load entire registries** - Only reference specific components
2. **Use this guide as a lookup** - Don't load all registry docs
3. **Stack registries strategically**:
   - Base layer: shadcn/ui (always)
   - Specialty layer: 1-2 registries per module
4. **Prefer multi-purpose components** (e.g., Kibo UI Gantt over custom build)

---

## FAQ

### Q: Can I mix components from different registries?

**A**: Yes! All registries are built on shadcn/ui, Radix UI, or Tailwind CSS. They're designed to work together. Just ensure consistent theming.

### Q: Which registry should I start with?

**A**: Always start with **shadcn/ui** as your base. Add specialty registries only when you need specific components (e.g., Gantt chart from Kibo UI).

### Q: Are Pro versions worth it?

**A**:

- **Aceternity UI Pro**: Yes, if you need 70+ premium packs + templates
- **Magic UI Pro**: Yes, for landing page blocks and templates
- **Kibo UI**: Free tier has all core components
- **Cult UI**: Templates are worth it for AI apps

### Q: How do I install components from third-party registries?

**A**: Most are copy-paste (not CLI):

1. Visit registry website
2. Find component
3. Copy code
4. Paste into your project
5. Adjust imports/dependencies

**Exception**: shadcn/ui uses CLI (`npx shadcn-ui@latest add [component]`)

### Q: Which registry has the best accessibility?

**A**:

1. **shadcn/ui** (Radix UI foundation, ARIA compliant)
2. **JollyUI** (React Aria foundation)
3. **Origin UI** (Base UI foundation)

### Q: Can I use multiple animation libraries?

**A**: Yes, but be cautious:

- Aceternity UI (Framer Motion)
- Magic UI (Framer Motion)
- Animate UI (Framer Motion)

All use Framer Motion, so they're compatible. Don't mix with other animation libraries (e.g., GSAP, Anime.js).

### Q: Which registry is best for mobile?

**A**: All registries support responsive design via Tailwind CSS. Origin UI has the most mobile-tested components (600+ variants).

### Q: Do I need to worry about bundle size?

**A**: Components are copy-pasted into your project, so you only ship what you use. No external dependencies (except Framer Motion for animated registries).

---

## Maintenance & Updates

This guide will be updated as:

- New registries emerge
- Existing registries add components
- Best practices evolve
- Project needs change

**Update Triggers**:

- New registry with unique components
- Major registry version updates
- Community feedback on missing components
- Post-implementation lessons learned

**Review Schedule**:

- End of each implementation week
- When encountering missing components
- Before starting new modules

---

## Additional Resources

### Registry Websites

- shadcn/ui: <https://ui.shadcn.com>
- Magic UI: <https://magicui.design>
- Aceternity UI: <https://ui.aceternity.com>
- Origin UI: <https://coss.com/origin>
- Kibo UI: <https://kibo-ui.com>
- Cult UI: <https://cult-ui.com>
- Dice UI: <https://www.diceui.com>
- Kokonut UI: <https://kokonutui.com>
- JollyUI: <https://www.jollyui.dev>
- Animate UI: <https://animate-ui.com>
- ReUI: <https://reui.io>
- Eldora UI: <https://www.eldoraui.site>
- HextaUI: <https://hextaui.com>
- Shadix UI: <https://shadix-ui.vercel.app>

### Community Resources

- Awesome shadcn/ui: <https://github.com/birobirobiro/awesome-shadcn-ui>
- shadcn/ui Discord: <https://discord.com/invite/shadcn>
- Registry comparisons: <https://www.shadcn.io/templates>

---

**Last Updated**: 2025-01-17
**Next Review**: End of Week 4 (Feature Planning module completion)
