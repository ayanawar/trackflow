# Tasks: Fix Responsive Layouts

**Input**: Design documents from `/specs/001-fix-responsive-layouts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/responsive-ui-contract.md, quickstart.md

**Tests**: No formal test files were requested. Responsive verification tasks use the viewport checklist from quickstart.md and the UI contract.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the responsive audit baseline and identify the shared surfaces that affect all stories.

- [x] T001 Inspect current responsive behavior for shell, navigation, auth pages, tracker, dashboard, reports, projects, insights, and settings using specs/001-fix-responsive-layouts/quickstart.md
- [x] T002 [P] Inventory repeated responsive utility patterns and shared class usage in src/app/globals.css
- [x] T003 [P] Inventory authenticated shell and navigation layout constraints in src/components/layout/AppShell.tsx and src/components/layout/Sidebar.tsx
- [x] T004 [P] Inventory data-dense tracker and report surfaces in src/components/tracker/EntryRow.tsx, src/components/tracker/TimerBar.tsx, and src/app/reports/page.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared responsive foundations that MUST be complete before individual user story work.

**CRITICAL**: No user story implementation should begin until this phase is complete.

- [x] T005 Define mobile-first page, card, button, input, label, and stat-card responsive defaults in src/app/globals.css
- [x] T006 Refactor AppShell to support mobile-first main content sizing and desktop shell behavior in src/components/layout/AppShell.tsx
- [x] T007 Refactor Sidebar into responsive navigation that remains accessible on mobile and preserves desktop sidebar behavior in src/components/layout/Sidebar.tsx
- [x] T008 Normalize authenticated page header spacing and wrapping conventions in src/app/tracker/page.tsx, src/app/dashboard/page.tsx, src/app/reports/page.tsx, src/app/projects/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx
- [x] T009 Normalize authenticated page content padding and max-width conventions in src/app/tracker/page.tsx, src/app/dashboard/page.tsx, src/app/reports/page.tsx, src/app/projects/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx

**Checkpoint**: Shared responsive shell and global component defaults are ready for user story implementation.

---

## Phase 3: User Story 1 - Use the App on Mobile Without Layout Breakage (Priority: P1) MVP

**Goal**: A user on 320px, 375px, and 425px widths can use every page and shared UI pattern without clipping, overlap, unreadable text, or page-level horizontal scrolling.

**Independent Test**: Review all application screens at 320px, 375px, and 425px using specs/001-fix-responsive-layouts/quickstart.md and confirm primary tasks remain usable with no page-level horizontal scrolling.

### Implementation for User Story 1

- [x] T010 [P] [US1] Make login and register auth cards fit narrow mobile screens in src/app/auth/login/page.tsx and src/app/auth/register/page.tsx
- [x] T011 [US1] Make tracker topbar, add-entry action, running banner, and entries heading stack cleanly on mobile in src/app/tracker/page.tsx
- [x] T012 [US1] Make TimerBar inputs, project picker, tag control, timer display, and start-stop action reflow without overflow in src/components/tracker/TimerBar.tsx
- [x] T013 [P] [US1] Make StatsRow cards readable and stacked appropriately on mobile in src/components/tracker/StatsRow.tsx
- [x] T014 [US1] Make EntryRow content, duration, metadata, and touch actions accessible without hover-only behavior on mobile in src/components/tracker/EntryRow.tsx
- [x] T015 [US1] Make EntryModal viewport-aware with narrow-width layout, internal scrolling, stacked time inputs, and reachable actions in src/components/tracker/EntryModal.tsx
- [x] T016 [US1] Make dashboard summary cards, chart card, project breakdown, and weekly day cards stack or contain content on mobile in src/app/dashboard/page.tsx
- [x] T017 [US1] Make reports filters wrap and reports table avoid page-level horizontal scrolling on mobile in src/app/reports/page.tsx
- [x] T018 [US1] Make project cards and project create/edit modal usable on mobile in src/app/projects/page.tsx
- [x] T019 [US1] Make insights prompt form, submit action, quick prompts, loading state, and response card fit mobile widths in src/app/insights/page.tsx
- [x] T020 [US1] Make settings profile, account, and danger-zone cards fit mobile widths in src/app/settings/page.tsx
- [ ] T021 [US1] Verify no page-level horizontal scrolling and no clipped primary actions at 320px, 375px, and 425px using specs/001-fix-responsive-layouts/quickstart.md

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Navigate and Review Content on Tablet and Laptop Screens (Priority: P2)

**Goal**: A user on 768px and 1024px widths can navigate and scan dashboard content, cards, forms, and data areas with consistent spacing and readable typography.

**Independent Test**: Review all application screens at 768px and 1024px using specs/001-fix-responsive-layouts/quickstart.md and confirm layout transitions preserve hierarchy, spacing, and functionality.

### Implementation for User Story 2

- [x] T022 [US2] Tune responsive navigation transition between mobile navigation and desktop sidebar behavior in src/components/layout/Sidebar.tsx
- [x] T023 [P] [US2] Tune dashboard tablet and laptop grid, chart, project breakdown, and weekly card density in src/app/dashboard/page.tsx
- [x] T024 [P] [US2] Tune tracker tablet and laptop spacing across timer, stats, running banner, and entry groups in src/app/tracker/page.tsx and src/components/tracker/TimerBar.tsx
- [x] T025 [P] [US2] Tune reports filter layout, summary cards, and contained table presentation at 768px and 1024px in src/app/reports/page.tsx
- [x] T026 [P] [US2] Tune projects, insights, and settings content widths and card grids at 768px and 1024px in src/app/projects/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx
- [ ] T027 [US2] Verify navigation, grids, cards, forms, charts, and tables at 768px and 1024px using specs/001-fix-responsive-layouts/quickstart.md

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Use Large Desktop Layouts Efficiently (Priority: P3)

**Goal**: A user on a 1440px desktop can use the app without content stretching awkwardly, losing alignment, or becoming too sparse to scan efficiently.

**Independent Test**: Review all application screens at 1440px using specs/001-fix-responsive-layouts/quickstart.md and confirm content alignment, maximum widths, and spacing remain intentional.

### Implementation for User Story 3

- [x] T028 [US3] Add desktop content width and alignment constraints for dashboard, tracker, reports, projects, insights, and settings pages in src/app/dashboard/page.tsx, src/app/tracker/page.tsx, src/app/reports/page.tsx, src/app/projects/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx
- [x] T029 [P] [US3] Tune large-desktop dashboard and report layouts so charts, tables, and cards remain scannable in src/app/dashboard/page.tsx and src/app/reports/page.tsx
- [x] T030 [P] [US3] Tune large-desktop project, insight, settings, login, and register layouts to preserve the current visual style without oversized spacing in src/app/projects/page.tsx, src/app/insights/page.tsx, src/app/settings/page.tsx, src/app/auth/login/page.tsx, and src/app/auth/register/page.tsx
- [ ] T031 [US3] Verify all primary screens at 1440px using specs/001-fix-responsive-layouts/quickstart.md

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and regression checks across all responsive stories.

- [x] T032 Consolidate any duplicated responsive classes introduced during implementation in src/app/globals.css and affected src/app/**/*.tsx files
- [ ] T033 Verify existing user workflows still work after responsive fixes in src/app/tracker/page.tsx, src/app/projects/page.tsx, src/app/reports/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx
- [x] T034 Run lint validation using npm run lint from package.json
- [x] T035 Run production build validation using npm run build from package.json
- [ ] T036 Run final viewport checklist at 320px, 375px, 425px, 768px, 1024px, and 1440px using specs/001-fix-responsive-layouts/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user story work.
- **User Story 1 (Phase 3)**: Depends on Foundational completion; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should be validated after US1 to avoid mobile regressions.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and should be validated after US1 and US2 to avoid mobile/tablet regressions.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational, but should preserve US1 mobile behavior.
- **User Story 3 (P3)**: Can start after Foundational, but should preserve US1 and US2 behavior.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel during Setup.
- T010, T013, and later page-specific US1 tasks can be split by file after T005-T009 are complete.
- T023, T024, T025, and T026 can run in parallel because they touch mostly separate screens.
- T029 and T030 can run in parallel because they touch different screen groups.

---

## Parallel Example: User Story 1

```text
Task: "T010 [US1] Make login and register auth cards fit narrow mobile screens in src/app/auth/login/page.tsx and src/app/auth/register/page.tsx"
Task: "T013 [US1] Make StatsRow cards readable and stacked appropriately on mobile in src/components/tracker/StatsRow.tsx"
Task: "T018 [US1] Make project cards and project create/edit modal usable on mobile in src/app/projects/page.tsx"
Task: "T020 [US1] Make settings profile, account, and danger-zone cards fit mobile widths in src/app/settings/page.tsx"
```

## Parallel Example: User Story 2

```text
Task: "T023 [US2] Tune dashboard tablet and laptop grid, chart, project breakdown, and weekly card density in src/app/dashboard/page.tsx"
Task: "T025 [US2] Tune reports filter layout, summary cards, and contained table presentation at 768px and 1024px in src/app/reports/page.tsx"
Task: "T026 [US2] Tune projects, insights, and settings content widths and card grids at 768px and 1024px in src/app/projects/page.tsx, src/app/insights/page.tsx, and src/app/settings/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate mobile widths at 320px, 375px, and 425px.
5. Proceed only after mobile has no page-level horizontal scrolling.

### Incremental Delivery

1. Setup and Foundational phases establish the responsive shell and shared class behavior.
2. US1 makes the whole app usable on mobile and is the MVP.
3. US2 improves tablet and laptop transitions without regressing mobile.
4. US3 improves large desktop layout without regressing smaller widths.
5. Polish verifies all widths and workflows together.

### Validation Gates

- After US1: 320px, 375px, and 425px pass for every primary screen.
- After US2: 768px and 1024px pass while US1 widths still pass.
- After US3: 1440px passes while US1 and US2 widths still pass.
- Final: `npm run lint`, `npm run build`, and the full quickstart viewport checklist pass.

## Notes

- [P] tasks use different files or mostly independent screen groups.
- [US1], [US2], and [US3] labels map directly to the user stories in spec.md.
- Avoid changing API routes, Prisma schema, authentication behavior, query keys, or form payload semantics.
- Prefer shared responsive defaults first, then page-specific fixes only where needed.
