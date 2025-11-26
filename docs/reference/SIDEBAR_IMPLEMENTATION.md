# Sidebar Implementation Knowledge

**Last Updated**: 2025-11-26
**Status**: Complete - Production Ready

---

## Overview

The application uses **shadcn/ui Sidebar component** for consistent, collapsible navigation with proper state persistence and smooth animations.

---

## Component Architecture

### Key Files
| File | Purpose |
|------|---------|
| `src/components/ui/sidebar.tsx` | Core shadcn/ui sidebar (DO NOT modify heavily) |
| `src/components/layout/app-sidebar.tsx` | Application sidebar (workspace switcher, navigation) |
| `src/components/layout/app-top-bar.tsx` | Top bar with profile menu (top-right) |
| `src/app/(dashboard)/workspaces/[id]/page.tsx` | Integration point |

### Structure
```tsx
<SidebarProvider defaultOpen={cookieValue}>
  <AppSidebar workspaceId={...} workspaceName={...} workspaces={[...]} />
  <SidebarInset>
    <header>
      <SidebarTrigger />
      <AppTopBar />
    </header>
    <main>{content}</main>
  </SidebarInset>
</SidebarProvider>
```

---

## Critical Settings

### Sidebar Width (`sidebar.tsx`)
```tsx
const SIDEBAR_WIDTH = "16rem"        // Expanded
const SIDEBAR_WIDTH_ICON = "3rem"    // Collapsed (DO NOT change)
```

### Collapsible Mode (`app-sidebar.tsx`)
```tsx
<Sidebar collapsible="icon">  // Required for icon-only collapse
```

### State Persistence (`page.tsx`)
```tsx
const cookieStore = await cookies()
const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true'
```

---

## Hydration Fix

**Problem**: Radix UI DropdownMenu generates different IDs server vs client.

**Solution**: Add `suppressHydrationWarning`:
```tsx
<Button variant="ghost" suppressHydrationWarning>
  <Avatar>...</Avatar>
</Button>

<Comp
  data-slot="sidebar-menu-button"
  suppressHydrationWarning
  {...props}
/>
```

**Applied to**:
- `sidebar.tsx` (SidebarMenuButton ~line 521)
- `app-top-bar.tsx` (Profile button ~line 56)

---

## Animation Rules

### DO
- ✅ Keep default widths (3rem collapsed, 16rem expanded)
- ✅ Use `collapsible="icon"` for smooth collapse
- ✅ Let shadcn/ui handle transitions
- ✅ Use standard `gap-1` spacing

### DON'T
- ❌ Change `SIDEBAR_WIDTH_ICON`
- ❌ Add custom `group-data-[collapsible=icon]/sidebar:gap-*`
- ❌ Override button sizes in collapsed state

---

## Profile Menu

**Location**: Top-right corner (in `AppTopBar`)

**Z-Index**:
```tsx
<DropdownMenuContent className="w-56 z-[100]" align="end">
```

**Menu Items**: Profile, Settings, Billing, Log out

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Sidebar not adjusting | Use `group-data-[collapsible=icon]/sidebar` selector |
| Dropdown hidden | Add `z-[100]` to DropdownMenuContent |
| Jerky animation | Revert to default shadcn/ui settings |
| Hydration errors | Add `suppressHydrationWarning` |

---

## CSS Selector Pattern

```tsx
// ✅ CORRECT - Uses /sidebar modifier
className="group-data-[collapsible=icon]/sidebar:size-8"

// ❌ WRONG - Missing /sidebar
className="group-data-[collapsible=icon]:size-8"
```

---

## Testing Checklist

- [ ] Collapse/expand animation smooth
- [ ] Icons stay same size in both states
- [ ] Content adjusts when sidebar collapses
- [ ] Profile dropdown above all elements
- [ ] No hydration warnings
- [ ] State persists (cookie)
- [ ] Mobile responsive

---

## Key Learnings

1. Never customize shadcn/ui defaults excessively
2. Use `suppressHydrationWarning` for Radix triggers
3. Top bar z-[70], dropdowns z-[100]
4. Group modifiers need `/sidebar` suffix
5. Cookie persistence better than localStorage for SSR

---

**Reference**: https://ui.shadcn.com/docs/components/sidebar
