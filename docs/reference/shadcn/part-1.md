# shadcn/ui Third-Party Registry Component Guide

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
