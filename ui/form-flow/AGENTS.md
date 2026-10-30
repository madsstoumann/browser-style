# Form Flow - Internal Architecture

## Overview

`<form-flow>` is a light-DOM custom element that renders a form definition (UCM-shaped, steps as `structure.layout` entries of type `step`) and applies a `@browser.style/form-rules` rule set on every input. Light DOM is deliberate: `@browser.style/base` form.css must style the native controls.

## Flow

```
setup(definition, rules) → #render() builds every step's fieldset once
input/change → #values[name] = #readValue(name) → update()
update() → evaluate(definition, expirePatches(rules, now), { values, context, facts, previous })
        → #syncPatchFields → #applyFields → #applySteps → #applyExplain → #runEffects → ff:change
fetch effect → POST (or this.fetcher) → merge() → #rules updated → update()
```

## Gotchas

- `#values` keeps every value, also of hidden fields and unmounted patch fields; the engine decides what is submitted. Do not read values from the DOM on submit.
- `previous.matched` is passed back in so `emit` fires on edges only.
- A fetch runs once per effect `key` (service + sent values); a new key re-fetches and `merge` replaces the patch for that owner.
- Patch fields are rendered into `[data-slot]` containers when they first appear in `state.fields`, and removed when they disappear.
- `noValidate` is set on the form: steps are validated one at a time in `#validStep`, because hidden steps' required controls would otherwise block submit.
- A required boolean relies on native `required` (must be checked); the engine counts `false` as a value.
- Tracking (`tracking.js`) is fed from a few hooks: `update()` (view, rule and error edges), `#onInput` (start, revisit, called before `update()` so the first error counts), `#goTo(step, via)` (every step change goes through it, with the reason), `#validStep` (blocked), `#fetchPatch` (service timing). A new navigation path must call `#goTo`, not set `#current`, or the funnel loses a step.
- Layout modes (`this.present`, from `structure.present` or the `mode` attribute): in `page` and `reveal`, `#current` is the furthest section reached, not the one on screen. `#applySteps` moves it forward while `#complete()` holds (valid controls and at least one answer), calling `tracking.step(…, mode)` directly, the one place besides `#goTo` that does. `#goTo` never moves it backwards there; it only scrolls. Hiding is by `fieldset.hidden`; `#validStep` still validates hidden-but-on-path sections, so Send opens an invalid one further down.
- Result panels render once in `#render` (`#renderPanel`); their fields are normal fields, so `#applyFields` / `#applyTexts` handle them. `#applySteps` only toggles each panel's `hidden` from `state.panels`.
- `index.css` ends with `[hidden] { display: none !important }`; keep it last and important: the step list's ui-step stylesheet is outside the layer.
- Abandon listens on `document` / `window` from `connectedCallback`; it fires once per hide and is re-armed when the page is visible again.

## Sessions (session.js)

- `FlowSession` is a controller next to the element, not part of it: it calls `setup()` with `values`, `facts`, `step` and `previous` to resume, and listens to `ff:change` (debounced save) and `ff:submit`.
- A step inserted by a service patch is not on the path until its fetch returns, so the saved step is kept in `#pendingStep` and visited on a later `ff:change`, unless the person navigates first.
- `#restoring` guards the `ff:change` that `setup()` itself fires, so a resume or reset is not saved straight back.
- The done view hides the re-rendered (empty) form instead of removing it, so late `update()` calls (a fetch returning) still find their elements.
- Pure session logic lives in `form-rules/modules/session.js`; keep storage and DOM out of it.
