# Implementation Plan: Fix Responsive Layouts

**Branch**: `001-fix-responsive-layouts` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-responsive-layouts/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Audit and repair TrackFlow's responsive behavior across all existing application screens and shared UI patterns. The technical approach is to preserve the current Next.js App Router and Tailwind-based visual system, then normalize shell layout, navigation, page padding, cards, dense rows, forms, modals, charts, and tables so every primary screen works at 320px, 375px, 425px, 768px, 1024px, and 1440px without mobile page-level horizontal scrolling.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 14.2.5  
**Primary Dependencies**: Next.js App Router, Tailwind CSS 3.4.1, React Query 5, React Hook Form 7, Recharts 2, lucide-react  
**Storage**: Existing Prisma-backed application data; no schema or persistence changes planned for this feature  
**Testing**: `npm run lint`, `npm run build`, local browser responsive checks at 320px, 375px, 425px, 768px, 1024px, and 1440px  
**Target Platform**: Responsive web application in modern desktop and mobile browsers  
**Project Type**: Next.js full-stack web application with client-rendered dashboard screens and API routes  
**Performance Goals**: Keep responsive layout changes visually stable with no unnecessary remounting or data refetching during viewport changes  
**Constraints**: Preserve existing design style, routes, user workflows, data contracts, authentication behavior, and API behavior; eliminate mobile page-level horizontal scrolling at 425px and below  
**Scale/Scope**: Existing pages under `src/app`, shared shell components under `src/components/layout`, tracker components under `src/components/tracker`, and shared global Tailwind component classes in `src/app/globals.css`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` still contains placeholder principles and no ratified, enforceable constraints. No constitution violations are identified. This feature will use the project-local requirements in `spec.md` as its quality gate: preserve existing functionality, avoid unrelated redesign, and verify responsive behavior at the listed viewport widths.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-responsive-layouts/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── insights/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── projects/page.tsx
│   ├── reports/page.tsx
│   ├── settings/page.tsx
│   └── tracker/page.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Providers.tsx
│   │   └── Sidebar.tsx
│   └── tracker/
│       ├── EntryModal.tsx
│       ├── EntryRow.tsx
│       ├── StatsRow.tsx
│       └── TimerBar.tsx
├── lib/
└── types/
```

**Structure Decision**: This is a single Next.js application. Responsive work should stay within existing page components, shared layout components, tracker components, and global Tailwind component classes. No new app package, backend module, or data layer is needed.

## Complexity Tracking

No constitution violations or additional architectural complexity are required.

## Phase 0: Research

Research is captured in [research.md](./research.md). Key decisions:

- Use a mobile-first responsive shell with an adaptive navigation pattern instead of keeping the fixed desktop sidebar on small screens.
- Normalize page containers and shared component classes before making page-specific fixes.
- Handle data-dense tables and rows with contained horizontal scroll or stacked/card-like mobile presentation so the page itself never overflows.
- Keep charts and dense cards inside responsive containers with stable minimum sizing and appropriate stacking.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](./data-model.md): Defines responsive UI surfaces and validation states; confirms no persistent data model changes.
- [contracts/responsive-ui-contract.md](./contracts/responsive-ui-contract.md): Defines the UI contract every page and shared pattern must satisfy.
- [quickstart.md](./quickstart.md): Defines local verification steps and viewport checklist.

## Post-Design Constitution Check

The design remains within existing project boundaries and introduces no new architectural complexity, storage changes, or external services. With the constitution still placeholder-only, there are no enforceable gate violations.
