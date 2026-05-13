# Implementation Plan: Dashboard Mobile Responsive Fix

**Branch**: `003-fix-dashboard-mobile` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-fix-dashboard-mobile/spec.md`

## Summary

The Dashboard page (`src/app/dashboard/page.tsx`) uses three hardcoded CSS grid layouts that do not adapt to small viewports: a fixed 2-column chart/projects grid (`grid-cols-[1fr_260px]`), a fixed 7-column daily timeline (`grid-cols-7`), and a fixed 3-column stat card row (`grid-cols-3`). On mobile screens (≤640px) these cause overflow, text wrapping, and unreadable content. The fix adds Tailwind responsive prefixes to stack panels vertically on mobile/tablet and adds a horizontal-scroll container around the timeline.

## Technical Context

**Language/Version**: TypeScript / Next.js 14.2.5 / React 18  
**Primary Dependencies**: Tailwind CSS (default breakpoints), Recharts 2.12.7  
**Storage**: N/A (UI-only change)  
**Testing**: Visual regression — browser resize / DevTools device emulation  
**Target Platform**: Web (mobile browsers, 320px–2560px viewport width)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: No new JS/CSS weight; layout shifts must not cause re-renders  
**Constraints**: Must not alter desktop layout (≥1024px); single-file change preferred  
**Scale/Scope**: One page component, three grid containers

**Tailwind breakpoints** (standard, no overrides in `tailwind.config.ts`):
- `sm` = 640px — mobile/tablet boundary for stat cards
- `lg` = 1024px — boundary for chart/projects column layout (per clarification)

## Constitution Check

Constitution file is a blank template — no project-specific gates defined. Proceeding without gate violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-dashboard-mobile/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← N/A (no data changes)
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
src/
└── app/
    └── dashboard/
        └── page.tsx     ← only file changed
```

## Phase 0: Research

### Finding 1 — Responsive Grid for Chart/Projects Panel

**Decision**: Replace `grid grid-cols-[1fr_260px]` with `grid grid-cols-1 lg:grid-cols-[1fr_260px]`.

**Rationale**: Tailwind's `lg:` prefix (≥1024px) applies the 2-column desktop layout at and above the `lg` breakpoint, stacking vertically below it. This satisfies the clarified decision: mobile (≤640px) and tablet (641px–1023px) both get stacked layout; desktop (≥1024px) retains the fixed 260px sidebar.

**Alternatives considered**: `md:grid-cols-[1fr_260px]` (768px threshold) — rejected because at 768px the chart would only get ~460px with a 260px panel, which is cramped.

---

### Finding 2 — Horizontal Scroll for 7-Day Timeline

**Decision**: Wrap the `grid grid-cols-7` container in an `overflow-x-auto` div with a `min-w-[500px]` constraint on the inner grid.

**Rationale**: This is the standard mobile pattern for fixed-column date strips (used in Google Calendar, Notion, etc.). The `500px` minimum ensures each of the 7 cells is ~68px wide — enough to render a label ("Wed") and a value ("1h 30m") legibly. The outer div clips overflow and provides native touch scroll on iOS/Android. A negative margin (`-mx-7 px-7` at large screens) is not needed since the padding is handled by the parent wrapper.

**Alternatives considered**:
- 2-row wrap (4+3 grid) — rejected (per user clarification in `/speckit.clarify`)
- Single-column list — rejected (too much vertical space for a summary strip)

---

### Finding 3 — Stat Cards Row

**Decision**: No change to `grid-cols-3` — keep as-is.

**Rationale**: At 390px viewport, three 3-column cells are ~114px wide each. The content (label + time value like "0m" or "1h 30m") fits within this width. The existing `stat-card` class already uses `p-4 sm:p-5` for responsive padding, and the value uses `text-xl sm:text-2xl font-mono break-words` which allows wrapping. Screenshots confirm this renders acceptably at 390px.

---

### Finding 4 — Outer Padding

**Decision**: Change the main content wrapper from `p-7` to `p-4 sm:p-7`.

**Rationale**: A fixed `p-7` (28px on all sides) on a 390px screen leaves only 334px of usable width. Reducing to `p-4` (16px) on mobile gives 358px — 7% more space, meaningfully reducing pressure on the stat cards and timeline. The `page-body` utility in globals.css already does this pattern (`p-4 sm:p-6 lg:p-7`); this fix aligns the dashboard with that convention.

## Phase 1: Design & Contracts

### Data Model

No data model changes. This is a pure presentation layer fix — no new entities, no API changes, no schema migrations.

### Contracts

No interface contracts to define. The dashboard consumes existing hooks (`useStats`, `useProjects`) with unchanged return shapes.

### Concrete Change Set

The entire fix is contained in `src/app/dashboard/page.tsx`. Three targeted class changes:

**Change 1 — Outer padding (line 30)**:
```
Before: "p-7 flex-1 overflow-y-auto"
After:  "p-4 sm:p-7 flex-1 overflow-y-auto"
```

**Change 2 — Chart/Projects grid (line 44)**:
```
Before: "grid grid-cols-[1fr_260px] gap-5"
After:  "grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5"
```

**Change 3 — Daily timeline (lines 92–106)**:
```
Before: <div className="grid grid-cols-7 gap-2 mt-5">
After:  <div className="overflow-x-auto mt-5">
          <div className="grid grid-cols-7 gap-2 min-w-[500px]">
            ...existing cells...
          </div>
        </div>
```

### Verification Plan

1. Open DevTools → Toggle Device Toolbar → set to iPhone 14 Pro (390×844)
2. Navigate to `/dashboard`
3. Verify: no horizontal scrollbar on the page body
4. Verify: chart and projects panel are stacked vertically
5. Verify: chart title "Hours per Day (Last 7 Days)" renders on one line
6. Verify: timeline strip scrolls horizontally, cells are readable
7. Switch to iPad Mini (768×1024) → verify stacked layout applies
8. Switch to 1280px desktop → verify side-by-side layout is unchanged

## Complexity Tracking

No constitution violations. No complexity justification needed.
