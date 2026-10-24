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
