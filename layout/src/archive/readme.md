# Archived demo pages

Pages parked out of the build. `src/demo.js` copies `src/pages/*.html` into `dist/` —
it reads that one directory only and filters on `.html`, so anything in here is never
copied and never appears in the generated `dist/index.html`.

To bring one back, move it into `src/pages/` and run `npm run build:demo`.

| File | Why it was archived |
|------|---------------------|
| `scroll-test.html` | Raw `scroll-timeline` / `view-timeline` sandbox. Not a `<lay-out>` demo — it uses no layout attributes and documents nothing in the public API. |
