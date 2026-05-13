# Data Model: Fix Responsive Layouts

This feature does not introduce or modify persistent application data. The model below describes the responsive UI surfaces that must be audited and validated.

## Responsive Surface

**Represents**: A page, shared layout, or reusable component whose layout must adapt across supported viewport widths.

**Fields**:

- `name`: Human-readable surface name, such as "Tracker page" or "Entry modal".
- `location`: Source path or shared class where the surface is implemented.
- `surfaceType`: One of `page`, `layout`, `navigation`, `card`, `form`, `table`, `modal`, `chart`, `row`, `button`, `image`, or `shared-style`.
- `viewportCoverage`: Required widths: 320px, 375px, 425px, 768px, 1024px, 1440px.
- `responsiveBehavior`: Expected adaptation, such as stack, wrap, contain overflow, preserve fixed action size, or constrain max width.
- `validationState`: One of `not-reviewed`, `needs-fix`, `fixed`, or `verified`.

**Validation Rules**:

- Every primary route and shared UI pattern must have a validation state of `verified` before completion.
- Mobile widths at 425px and below must not create page-level horizontal scrolling.
- Any contained horizontal scroll must be limited to the data-dense component that needs it.

## Primary Surfaces

| Surface | Location | Surface Type | Required Validation |
|---------|----------|--------------|---------------------|
| App shell | `src/components/layout/AppShell.tsx` | layout | Shell adapts from mobile to desktop without content overlap |
| Sidebar/navigation | `src/components/layout/Sidebar.tsx` | navigation | Navigation remains accessible on mobile and desktop |
| Global component classes | `src/app/globals.css` | shared-style | Cards, buttons, inputs, labels, and stat cards have responsive defaults |
| Auth login | `src/app/auth/login/page.tsx` | page/form | Auth card fits small screens and remains readable |
| Auth register | `src/app/auth/register/page.tsx` | page/form | Longer form fits small screens without clipped actions |
| Tracker | `src/app/tracker/page.tsx` | page | Header, timer, stats, rows, and modal remain usable |
| Timer bar | `src/components/tracker/TimerBar.tsx` | form/row | Inputs, picker, tag control, timer, and action button reflow cleanly |
| Stats row | `src/components/tracker/StatsRow.tsx` | card/grid | Summary cards stack or reflow at supported widths |
| Entry row | `src/components/tracker/EntryRow.tsx` | row | Long content and row actions remain accessible on mobile |
| Entry modal | `src/components/tracker/EntryModal.tsx` | modal/form | Modal supports narrow width and limited viewport height |
| Dashboard | `src/app/dashboard/page.tsx` | page/chart/card | Summary cards, chart, projects, and weekly cards reflow |
| Reports | `src/app/reports/page.tsx` | page/table/form | Filters and table avoid page-level horizontal overflow |
| Projects | `src/app/projects/page.tsx` | page/card/modal | Cards and project modal remain usable at all widths |
| Insights | `src/app/insights/page.tsx` | page/form/card | Prompt input, submit action, chips, and response fit small screens |
| Settings | `src/app/settings/page.tsx` | page/form/card | Profile and account sections fit small screens |

## State Transitions

1. `not-reviewed` → `needs-fix`: A surface is inspected and a responsive issue is found.
2. `not-reviewed` → `verified`: A surface is inspected and already satisfies the contract.
3. `needs-fix` → `fixed`: Code changes are applied to resolve the responsive issue.
4. `fixed` → `verified`: The surface passes viewport checks at all required widths.
