# Form Editor - Internal Architecture

## Overview

`<form-editor>` edits two UCF documents, a form definition and a form-rules rule set, and renders them into a light-DOM page. The source of truth is `this.form` and `this.rules`. The DOM is rebuilt from them on every change, so no state lives in the controls.

## Files

| File | Role |
|---|---|
| `index.js` | The element: state, undo stack, draft storage, toolbar, panes, preview, status, import/export |
| `modules/model.js` | Pure edits: add/move/remove/rename for steps and fields (renames rewrite rules) |
| `modules/conditions.js` | JSON Logic ↔ builder tree (`parseCondition`/`serializeCondition`), plus sentence summaries |
| `modules/view-form.js` | Outline pane, and the form/step/field inspectors |
| `modules/view-rules.js` | Rule list, When/Then/Otherwise builder, services |
| `modules/dom.js` | `h()` and small control builders. No innerHTML. |

## Flow

```
control change → view builds next documents (clone + mutate) → editor.commit({ form?, rules? })
commit → undo push → #save (localStorage) → #render(true) → preview.setup(form, rules, { values }) → fe:change
select({ … }) → #render(false): panes only, the preview keeps its state
```

## Gotchas

- Controls listen to `change`, not `input`, so a re-render never happens mid-typing. `#focusPath` puts focus back on the same control index after a re-render.
- The tree round-trip must be lossless: a rule the builder cannot draw becomes a `raw` node and is serialised back untouched. `test/model.test.js` round-trips every example condition. Add a case when the builder learns a new shape.
- A `wrapped` group (a bare condition at the top) is unwrapped again on save, so opening and closing a rule never changes its JSON.
- Comparing a string field (for example a zip code) with `>`/`<` sets `num`, and the value picker becomes a number input.
- Sample replies are editor-only (`this.samples`, stored in the draft). They are never exported.
- Export is disabled while `validate()` reports errors. Engine `issues` at run time show up in the preview, not the status bar.
