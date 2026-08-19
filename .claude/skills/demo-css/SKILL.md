---
name: demo-css
description: Use when a CSS edit does not show up on a demo page, when starting a session of CSS iteration on ui/card or ui/base sheets, when dist/demo.<hash>.min.css or a package dist/ bundle looks stale, or when deciding how to rebuild and commit bundled CSS.
argument-hint: "[page or sheet you are working on]"
allowed-tools: Read, Bash, Glob, Grep
---

# Demo CSS bundles — iterate without rebuilding everything

The card demo pages do **not** link the source sheets. They link one bundle. Editing
`ui/card/content.css` and refreshing shows nothing until that bundle is rebuilt — this is
the single most common "my CSS doesn't work" false alarm in this repo.

## Which bundle am I looking at?

| Bundle | Built by | Hashed? | Who links it |
|---|---|---|---|
| `/dist/demo.<hash>.min.css` | `npm run build:demo-css` | **yes** — content hash in the filename | every `ui/card/demo/*.html`, `ui/card/index.html`, `layout/demo-assets/*.html` (~30 files) |
| `ui/{base,card,carousel,reveal}/dist/<name>.min.css` | that package's `npm run build` | **no** — deliberately stable | npm consumers, by a name `package.json` `exports` promises |

Only `ui/base`, `ui/card`, `ui/carousel` and `ui/reveal` have bundles. Leaf packages
(`ui/chip`, `ui/avatar`, …) ship plain sheets and need no build at all — edit and refresh.

## While iterating: watch mode

**Run from the repo root** — the demo bundle is a site-level asset, and its scripts live in
the root `package.json`. From a package directory `npm run dev:demo` fails with
`Missing script: "dev:demo"`.

```bash
npm run dev:demo          # esbuild --watch, rebundles into the CURRENT hashed filename
```

(If you are already inside a package, `node ../../scripts/dev-demo.js` works too — the
script resolves the repo root from its own location, not from the current directory.)

Leave it running, edit any raw sheet (`ui/card/*.css`, `ui/base/*.css`, any `@import`ed
package sheet), refresh the page. No re-hashing, so the ~30 referencing pages stay
untouched and `git status` stays clean while nothing has actually changed — the watcher
uses the same flags as the real build, so unchanged sources reproduce the committed bytes.

Serve the repo from a **fresh port** when verifying (`python3 -m http.server 8xxx`): the
stdlib server sends `Last-Modified` with no `Cache-Control`, and Chromium will keep serving
a stale sheet through a query-string reload of the HTML.

## When the feature is done

```bash
npm run build:demo-css    # bundle + re-hash + rewrite every reference
```

That mints a new `/dist/demo.<hash>.min.css`, deletes the previous one, and rewrites the
~30 files that link it. Commit **the bundle and the rewritten references together** — a
page pointing at a deleted hash is a 404, and a bundle whose bytes disagree with its hash
is exactly the bug the hashing exists to prevent.

Use the fuller `npm run build:demo` when the renderer or the polyfill also changed — it
runs `node ui/card/build.js` (token build + lint + JS minify + package bundles) and
`scripts/inline-polyfill.js` as well.

Package bundles rebuild from their own package: `npm run build -w @browser.style/card`
(or `cd layout && npm run build` for layout CSS, which is generated, not bundled — see the
`build-layout` skill).

## Why the hash exists — do not "simplify" it away

`_headers` serves `/dist/*` as `public, max-age=31536000, immutable`. That is only safe
because the filename changes when the bytes do. At a fixed filename a shipped CSS change
stayed invisible for up to **eight days** at both the browser and the Cloudflare edge,
where neither a hard reload nor a private window could shake it loose — fresh HTML over a
stale stylesheet, which reads as a CSS bug and is not one. It happened twice.

Rules that follow:
- **Never point a page at an unhashed name under `/dist/`.** `scripts/hash-asset.js`
  deletes the old files on purpose, so a missed reference 404s loudly instead of serving
  stale bytes silently.
- **Never hand-edit anything in `dist/`.** It is output; the next build overwrites it.
- The package `dist/` bundles are deliberately **not** hashed — consumers link stable
  names. Do not add hashing there.
- `ui/card/demo/build.shared.js` is a template that emits `HEAD_COMMON` into the generated
  product/article/rental pages. If it changes, rebuild those pages (`npm run build:demo`)
  or the next build reverts your edit.

## Sharp edges

- **`npm run dev:demo` needs a hashed bundle to exist.** On a fresh checkout with no
  `dist/demo.<hash>.min.css`, run `npm run build:demo-css` once first; the script says so
  and exits rather than guessing a name.
- **Overwriting an `immutable` filename is safe locally only.** The dev server sends no
  cache headers. Never deploy a tree where the bundle was last written by the watcher —
  finish with `npm run build:demo-css`.
- **A pushed commit rebuilds Cloudflare Pages.** Bundle churn is not free; batch CSS work
  into one commit rather than pushing per tweak.
