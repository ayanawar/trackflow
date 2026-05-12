# Research: Fix Responsive Layouts

## Decision: Use a mobile-first application shell

**Rationale**: The current shell uses a fixed-width sticky sidebar that consumes too much horizontal space on narrow viewports. A mobile-first shell lets content own the viewport on phones while preserving the existing sidebar experience on wider screens.

**Alternatives considered**:

- Keep the sidebar visible at all widths: rejected because it makes 320px and 375px layouts too constrained.
- Create separate mobile pages: rejected because it duplicates UI and increases maintenance risk.

## Decision: Normalize shared spacing and sizing before page-specific fixes

**Rationale**: Many pages repeat header, padding, card, button, input, and modal patterns. Centralizing responsive defaults in shared classes and layout components reduces duplicated fixes and keeps behavior consistent across tracker, dashboard, reports, projects, settings, insights, and auth screens.

**Alternatives considered**:

- Patch every page independently: rejected because it risks inconsistent spacing and future regressions.
- Redesign the visual system: rejected because the specification requires preserving existing style and functionality.

## Decision: Contain dense data instead of allowing page overflow

**Rationale**: Reports tables and tracker rows can contain long descriptions, projects, tags, and time ranges. On mobile, dense content should either scroll inside its own container or reflow into readable stacked content, but the full page must not become wider than the viewport.

**Alternatives considered**:

- Hide columns permanently on mobile: acceptable only for secondary metadata, but rejected as the default because it can reduce task usefulness.
- Shrink text aggressively: rejected because readability is a core requirement.

## Decision: Preserve current component hierarchy and data contracts

**Rationale**: The feature is a responsive UI quality pass. It should not change authentication, API routes, Prisma models, query keys, form payloads, or data semantics. Keeping the existing hierarchy minimizes regression risk and focuses implementation on layout behavior.

**Alternatives considered**:

- Introduce a new component library: rejected because it would expand scope and alter the design language.
- Introduce new persistent responsive preferences: rejected because users did not request configurable layout behavior.

## Decision: Verify with fixed representative viewport widths

**Rationale**: The spec defines 320px, 375px, 425px, 768px, 1024px, and 1440px as acceptance widths. These cover narrow mobile, common mobile, large mobile, tablet, laptop, and desktop layouts and are enough to catch the current high-risk breakpoints.

**Alternatives considered**:

- Test only browser presets: rejected because presets can miss the exact required widths.
- Test every possible width: rejected because it is inefficient; fixed representative widths plus responsive constraints give stronger practical coverage.
