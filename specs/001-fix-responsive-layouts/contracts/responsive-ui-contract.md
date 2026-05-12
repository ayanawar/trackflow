# Responsive UI Contract

Every existing TrackFlow page and shared UI surface must satisfy this contract before the feature is complete.

## Supported Viewports

| Class | Width |
|-------|-------|
| Narrow mobile | 320px |
| Mobile | 375px |
| Large mobile | 425px |
| Tablet | 768px |
| Laptop | 1024px |
| Desktop | 1440px |

## Global Contract

- Page-level horizontal scrolling must be absent at 320px, 375px, and 425px.
- Content must not overlap, clip critical text, or push primary actions outside the visible viewport.
- Buttons and icon controls must remain readable, tappable, and visually aligned.
- Long user-generated values must wrap, truncate, or be contained without breaking their parent layout.
- Spacing must feel consistent between pages at the same viewport width.
- Existing routes, API calls, query keys, form fields, and user workflows must remain unchanged.

## Shell and Navigation Contract

- Navigation must be available on every authenticated page at every supported width.
- On mobile widths, navigation must not permanently consume a fixed desktop sidebar width.
- Main content must be allowed to shrink without forcing overflow.
- Active navigation state and sign-out access must remain discoverable.

## Header Contract

- Page headers must wrap or stack title, metadata, and primary actions when horizontal space is limited.
- Header actions must not overlap titles or subtitles.
- Header padding must scale down on mobile and preserve the current visual style.

## Cards and Grids Contract

- Cards must stack on narrow widths and increase columns only when space allows.
- Card content must not overflow when values are long.
- Repeated card grids must preserve consistent gaps and alignment.
- Large desktop layouts must constrain content enough to remain scannable.

## Forms and Modals Contract

- Inputs, labels, helper text, validation messages, and action buttons must fit within the viewport.
- Two-column form groups must stack when columns become too narrow.
- Modals must use viewport-aware width and height, with internal scrolling when content exceeds available height.
- Modal primary and secondary actions must remain reachable on mobile.

## Tables, Rows, and Dense Data Contract

- Data-dense tables must not cause page-level horizontal scrolling.
- Any horizontal scrolling must be contained inside the table or data component.
- Mobile row presentations must keep primary content, duration/status, and row actions accessible.
- Hover-only actions must also be reachable on touch devices.

## Charts and Media Contract

- Charts must render inside responsive containers without overflowing their card.
- Chart labels must remain legible enough to identify the data at each supported width.
- Images and media must scale within their parent container without distortion or layout breakage.

## Verification Contract

For each supported viewport, verify:

- Auth login and register pages.
- Tracker page, including timer bar, stats row, entry row, running banner, and entry modal.
- Dashboard page, including summary cards, chart, project breakdown, and weekly cards.
- Reports page, including filters, summary cards, empty table state, and populated table state.
- Projects page, including empty state, project cards, create modal, and edit modal.
- Insights page, including prompt form, quick prompts, loading state, and response state.
- Settings page, including profile form, account card, and danger zone.
