# Quickstart: Fix Responsive Layouts

## 1. Install and verify dependencies

```bash
npm install
```

## 2. Run static checks

```bash
npm run lint
npm run build
```

## 3. Start the app

```bash
npm run dev
```

Open the local URL printed by Next.js.

## 4. Prepare representative app states

- Sign in with the demo account shown on the login page, or register a local account.
- Ensure there is at least one project.
- Ensure tracker entries include short and long descriptions, tags, project names, and multiple dates.
- Check empty states as well as populated states where possible.

## 5. Responsive viewport checklist

Verify each page at these widths:

- 320px
- 375px
- 425px
- 768px
- 1024px
- 1440px

At each width, confirm:

- No page-level horizontal scrolling on mobile widths.
- Navigation is accessible and does not overlap content.
- Headers and primary actions fit or stack cleanly.
- Cards, forms, rows, tables, charts, and modals remain readable and usable.
- Long text values do not break their containers.
- Existing workflows still work: start/stop timer, add/edit entry, create/edit project, filter/export reports, ask an insight question, update settings.

## 6. Completion criteria

The feature is ready when:

- All viewport checks pass for every primary screen and shared pattern.
- `npm run lint` passes.
- `npm run build` passes.
- No responsive fix changes API behavior, data persistence, authentication flow, or route structure.
