# Feature Specification: Dashboard Mobile Responsive Fix

**Feature Branch**: `003-fix-dashboard-mobile`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "fix the responsive layout for the Dashboard page to work properly on mobile view"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Readable on Small Screens (Priority: P1)

A user opens the TrackFlow app on a mobile phone (portrait mode) and navigates to the Dashboard page. All sections — stat summary, chart, projects panel, and daily timeline — display correctly within the viewport without horizontal overflow, cut-off content, or broken layouts.

**Why this priority**: This is the core usability failure shown in the screenshot. The chart/projects side-by-side layout is broken on mobile, rendering the Dashboard unusable on small devices.

**Independent Test**: Open the Dashboard on a device or emulator with a 390px-wide viewport. Verify all content is readable and no horizontal scroll bar appears.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (≤640px wide), **When** the Dashboard page is loaded, **Then** the three stat cards (Today / This Week / This Month) stack or shrink without text truncation or overflow.
2. **Given** a mobile viewport, **When** the Dashboard page is loaded, **Then** the "Hours per Day" bar chart and "Projects" panel are stacked vertically (one above the other), not side by side.
3. **Given** a mobile viewport, **When** the Dashboard page is loaded, **Then** the bar chart title "Hours per Day (Last 7 Days)" is fully visible on one line or wraps gracefully without cutting into the chart area.

---

### User Story 2 - Weekly Timeline Legible on Mobile (Priority: P2)

A user scrolls to the bottom of the Dashboard on mobile and can clearly read each day's time value in the 7-day timeline strip.

**Why this priority**: The 7-column fixed grid shrinks each cell to an unreadable size on small screens. Users need to be able to see daily summaries at a glance.

**Independent Test**: On a 390px viewport, scroll to the daily timeline. Each day label and time value should be readable without zoom.

**Acceptance Scenarios**:

1. **Given** a mobile viewport, **When** the 7-day timeline renders, **Then** the cells are displayed in a horizontally scrollable strip — users swipe left/right to view all 7 days, with no wrapping.
2. **Given** a mobile viewport, **When** a day has a non-zero time value, **Then** the value (e.g., "1h 30m") is not truncated or cut off.

---

### User Story 3 - Layout Unchanged on Desktop (Priority: P3)

An existing desktop user opens the Dashboard and sees the same layout as before — stat cards in a row, chart beside the projects panel, and a 7-column daily timeline.

**Why this priority**: The fix must be additive for mobile only and must not regress the desktop experience.

**Independent Test**: Open the Dashboard at a 1280px viewport. Verify the chart and projects panel remain side by side, stat cards remain in a 3-column row, and the 7-day grid remains a single horizontal row.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (≥1024px wide), **When** the Dashboard page is loaded, **Then** the chart and projects panel render side by side (chart flex-1, projects panel 260px fixed width).
2. **Given** a desktop viewport, **When** the Dashboard page is loaded, **Then** the daily timeline shows 7 columns in a single horizontal row.

---

### Edge Cases

- What happens when screen width is between 641px and 1023px (tablet)? The chart and projects panel stack vertically (same as mobile), giving each section full width.
- How does the chart render when there is no data (empty state)? The "No projects yet" empty state in the Projects panel must remain visible on all screen sizes.
- What happens if the user rotates their phone to landscape? The layout should remain functional and not overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Dashboard page MUST render without horizontal overflow on viewports ≥320px wide.
- **FR-002**: On viewports ≤1023px wide (mobile and tablet), the "Hours per Day" chart section and the "Projects" panel MUST stack vertically rather than appear side by side.
- **FR-003**: On mobile viewports, the three stat summary cards (Today, This Week, This Month) MUST remain fully readable — text values must not be truncated or overflow the card.
- **FR-004**: On mobile viewports, the 7-day daily timeline MUST be horizontally scrollable (swipe left/right) so each cell's label and time value are legible without wrapping.
- **FR-005**: On desktop viewports (≥1024px wide), the existing two-column chart/projects layout MUST be preserved unchanged.
- **FR-006**: On desktop viewports, the 7-column daily timeline grid MUST remain as a single horizontal row.
- **FR-007**: The bar chart MUST resize responsively and fill available width on all screen sizes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero horizontal scroll on any viewport ≥320px wide when viewing the Dashboard.
- **SC-002**: All text content on the Dashboard page is readable (no truncation of labels or values) on a standard mobile viewport (390px × 844px).
- **SC-003**: Desktop layout is visually identical before and after the fix at 1280px viewport width.
- **SC-004**: The fix introduces no visual regressions on tablet viewports (768px–1023px).

## Clarifications

### Session 2026-05-13

- Q: How should the 7-day daily timeline behave on mobile viewports? → A: Horizontal scroll strip — cells don't wrap; user swipes left/right to see all 7 days.
- Q: On tablet viewports (641px–1023px), should the chart and projects panel stack vertically or remain side by side? → A: Stack vertically (same as mobile layout) — both sections get full width.

## Assumptions

- The fix is scoped to the Dashboard page (`/dashboard`) only; other pages are out of scope.
- "Mobile viewport" means ≤640px wide, following Tailwind CSS's default `sm` breakpoint.
- The existing dark theme, color palette, and component styles remain unchanged.
- The chart library (Recharts `ResponsiveContainer`) already handles internal chart resizing; only the outer layout grid needs adjustment.
- No changes to data fetching, API calls, or business logic are required.
