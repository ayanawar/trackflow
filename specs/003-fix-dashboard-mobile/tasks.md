---
description: "Task list for Dashboard Mobile Responsive Fix"
---

# Tasks: Dashboard Mobile Responsive Fix

**Input**: Design documents from `/specs/003-fix-dashboard-mobile/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Scope**: All changes are confined to `src/app/dashboard/page.tsx` — three targeted class edits.
**No tests requested** in spec; verification is visual (browser DevTools device emulation).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or fully independent)
- **[Story]**: Which user story this task belongs to

## Path Conventions

Single Next.js project — `src/` at repository root.

---

## Phase 1: Setup

**Purpose**: Confirm no dependencies or tooling changes are needed before editing.

- [x] T001 Confirm dev server starts cleanly with `npm run dev` and Dashboard page loads at `/dashboard`

---

## Phase 2: Foundational

**Purpose**: No blocking prerequisites for this fix. All user story tasks can begin immediately after T001.

*(No foundational tasks — the change set is self-contained within a single existing file.)*

---

## Phase 3: User Story 1 — Dashboard Readable on Small Screens (Priority: P1) 🎯 MVP

**Goal**: Stack the chart/projects panel vertically on mobile and tablet; reduce outer padding on mobile.

**Independent Test**: Open `/dashboard` in DevTools with iPhone 14 Pro preset (390×844). Verify: (1) no horizontal scrollbar, (2) "Hours per Day" section and "Projects" section are stacked vertically, (3) chart title fits on one line.

### Implementation for User Story 1

- [x] T002 [US1] In `src/app/dashboard/page.tsx` line 30: change outer wrapper class from `"p-7 flex-1 overflow-y-auto"` to `"p-4 sm:p-7 flex-1 overflow-y-auto"`
- [x] T003 [US1] In `src/app/dashboard/page.tsx` line 44: change chart/projects grid class from `"grid grid-cols-[1fr_260px] gap-5"` to `"grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5"`

**Checkpoint**: At 390px viewport, chart and Projects panel are stacked vertically with no overflow. ✓

---

## Phase 4: User Story 2 — Weekly Timeline Legible on Mobile (Priority: P2)

**Goal**: Wrap the 7-day daily timeline in a horizontal-scroll container so each cell remains readable on small screens.

**Independent Test**: On a 390px viewport, scroll to the timeline strip. Swipe left/right — all 7 day cells are visible and readable without any cells being cut off.

### Implementation for User Story 2

- [x] T004 [US2] In `src/app/dashboard/page.tsx` lines 92–106: wrap the `<div className="grid grid-cols-7 gap-2 mt-5">` in an outer `<div className="overflow-x-auto mt-5">` and move the `mt-5` and grid classes to the inner div, adding `min-w-[500px]` to the inner grid div. Remove `mt-5` from the outer grid since it moves to the wrapper.

**Checkpoint**: On 390px viewport, the timeline strip scrolls horizontally; all 7 cells (with day labels and time values) are legible. ✓

---

## Phase 5: User Story 3 — Layout Unchanged on Desktop (Priority: P3)

**Goal**: Verify the desktop experience is unaffected by the responsive changes.

**Independent Test**: At 1280px viewport, chart and Projects panel render side by side (chart flex-1 + 260px panel). 7-day timeline shows as a single horizontal row with no scroll.

### Implementation for User Story 3

- [ ] T005 [US3] Visual regression check: open `/dashboard` in DevTools at 1280px viewport. Confirm chart/projects renders side by side with `lg:grid-cols-[1fr_260px]` layout.
- [ ] T006 [US3] Visual regression check: at 1280px, confirm the 7-day timeline shows all 7 columns in one row without a scroll container activating (`min-w-[500px]` is satisfied at this width).
- [ ] T007 [US3] Visual regression check: open `/dashboard` at 768px (iPad Mini) in DevTools. Confirm chart/projects stack vertically (mobile layout applies below 1024px).

**Checkpoint**: Desktop layout visually identical to pre-fix at ≥1024px. Tablet correctly uses stacked layout at 768px. ✓

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T008 [P] Full-width check: test at 320px (smallest common mobile) — confirm no overflow and all sections readable
- [ ] T009 [P] Landscape check: rotate DevTools to landscape 844×390 (iPhone 14 Pro landscape) — confirm layout remains functional
- [ ] T010 Empty-state check: verify "No projects yet" text in the Projects panel is visible at all viewport sizes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 3)**: Depends only on T001 (server running)
- **User Story 2 (Phase 4)**: Independent of US1 — can be applied in the same file edit pass
- **User Story 3 (Phase 5)**: Depends on T002, T003, T004 being complete (verification step)
- **Polish (Phase 6)**: Depends on all implementation tasks complete

### User Story Dependencies

- **US1 (P1)**: Start after T001 — no dependency on US2 or US3
- **US2 (P2)**: Start after T001 — no dependency on US1 or US3
- **US3 (P3)**: Verification only — depends on US1 + US2 implementation complete

### Within-Story Order

- T002 and T003 are in different regions of the same file — apply sequentially in one edit session
- T004 is a structural wrapper change — apply in its own edit after T002/T003 to avoid conflicts

---

## Parallel Example: All Implementation Tasks (Single Developer)

Because all changes are in one file, the fastest path is a single editing session:

```
Session 1 (single pass through page.tsx):
  T002 → update outer wrapper padding (line 30)
  T003 → update chart/projects grid (line 44)
  T004 → wrap timeline in scroll container (lines 92–106)
```

Then verify:
```
Session 2 (DevTools verification):
  T005 → 1280px desktop check
  T006 → timeline desktop check
  T007 → 768px tablet check
  T008 → 320px mobile check
  T009 → landscape check
  T010 → empty state check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 — confirm server running
2. Complete T002 + T003 — padding + grid fix
3. **STOP and VALIDATE**: open DevTools at 390px, confirm stacked layout ✓
4. Optionally stop here if only P1 is needed

### Incremental Delivery

1. T001 → T002 → T003 → validate US1 (chart/projects stacked)
2. T004 → validate US2 (timeline scrolls)
3. T005–T007 → validate US3 (desktop unchanged)
4. T008–T010 → polish checks

---

## Notes

- All changes are additive Tailwind responsive prefixes — zero risk of breaking unrelated pages
- `lg:` prefix (≥1024px) is the chosen desktop threshold (per clarification session)
- `min-w-[500px]` on the timeline gives each of 7 cells ~68px — verified readable for values like "1h 30m"
- No new dependencies, no API changes, no data model changes
