# Form Embed - Internal Architecture

## Overview

`<form-embed>` is the client-site wrapper around `<form-flow>`: bundle loading, the function registry, scoped styles and parts. `<form-flow>` stays generic and is not changed by this package. Proposal and decisions: https://claude.ai/artifact/Ry7zPiZ9d1Ua1mAp1hovN3.

Shadow DOM is a deliberate exception to the v4 light-DOM rule (decided by Mads, 2026-10-24): both modes are supported through `mode`.

## Flow

```
connectedCallback → load()
  bundle (forms/{id}/{version}.json) + sheetFor(mode) + client stylesheet, in parallel
  → loadFunctions(bundle.functions) via functions/registry.json
  → #mount: shadow root or light DOM, adopt sheets, new <form-flow>, pass label-* attributes
  → flow.setup(form, resolveServices(rules, bundleUrl)) → ff:ready
```

## Styles

`sheetFor()` fetches `embed.css` + base `form.css` + `button.css` + `ui-step.css` + `form-flow/index.css` and builds one constructed sheet per mode, cached per page:

- `embed.css` maps `--form-*` onto the base tokens on `:host`, plus `[hidden] { display: none !important }` (base core.css is not loaded).
- The other sheets go into `@scope (form-flow)`, with `:root` rewritten to `:scope` (form.css declares its input tokens on `:root`, and its top-level `&` rules need a scope).
- Light mode rewrites `:host` to `:scope` and wraps everything in `@scope (form-embed)`; the sheet is adopted on the element's root node.
- Relative `url()`s are made absolute against each sheet's URL.

## Gotchas

- These source sheets are fetched raw; if they gain `@import`, constructed sheets drop it.
- Parts on controls (`input`, `label`, `hint`, `button`, `button-primary`) are added by a MutationObserver, because patch fields mount later. Moving them into `<form-flow>`'s renderer is the cleaner follow-up.
- Host functions must be synchronous: `evaluate()` is.
- Rule sets may be UCF-wrapped (`{ model, fields }`); `resolveServices` handles both shapes.
