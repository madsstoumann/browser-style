# Base

Base CSS for browser.style components.

## Polyfills

- [`polyfills/attr-fallback.js`](polyfills/readme.md) — typed `attr()` for
  Safari/Firefox. Components that read `fill=` / `ink=` / `ring=` / `value=` etc.
  lose the value entirely there (it does **not** degrade to the `attr()` fallback);
  each component ships an `@supports` block for the no-JS case, and this restores
  per-element values on top. No-op in Chromium.