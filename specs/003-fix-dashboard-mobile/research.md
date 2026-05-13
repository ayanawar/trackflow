# Research: Dashboard Mobile Responsive Fix

**Date**: 2026-05-13 | **Branch**: `003-fix-dashboard-mobile`

## Decision Log

| # | Decision | Rationale | Alternatives Rejected |
|---|----------|-----------|----------------------|
| 1 | `grid-cols-1 lg:grid-cols-[1fr_260px]` for chart/projects | lg (1024px) breakpoint matches clarified tablet+mobile stacking requirement | `md:` (768px) leaves chart cramped at tablet width |
| 2 | `overflow-x-auto` wrapper + `min-w-[500px]` inner grid for timeline | Standard mobile date-strip pattern; 500px gives ~68px per cell — readable for labels + time values | 2-row wrap (user rejected); single-column list (too tall) |
| 3 | No change to `grid-cols-3` stat cards | 390px viewport gives ~114px per card — sufficient for existing content | N/A |
| 4 | `p-4 sm:p-7` outer padding | Gains 12px horizontal space on mobile; aligns with existing `page-body` utility convention | Fixed `p-7` wastes 12px on each side at mobile widths |

## No NEEDS CLARIFICATION items remaining

All ambiguities resolved via `/speckit.clarify` session (2026-05-13):
- Timeline mobile behavior → horizontal scroll strip
- Tablet layout (641–1023px) → stack vertically (same as mobile)
