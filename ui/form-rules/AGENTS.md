# Form Rules - Internal Architecture

## Overview

`@browser.style/form-rules` evaluates JSON rule sets against JSON form definitions. It is a plain ES module, no DOM and no dependencies, so the same file runs in the browser and in Node. Rendering (`<form-flow>`) and the visual editor (`<form-editor>`) are separate, later packages that consume it.

Design proposal: "Rule engine for multi-step forms" (claude.ai artifact, Forms project).

## Modules

| Module | Responsibility |
|--------|----------------|
| `modules/logic.js` | Strict JSON Logic: `apply`, `getPath`, `readsOf`, `operatorsOf` |
| `modules/actions.js` | The closed action list, targets of an action, renaming targets |
| `modules/form.js` | `unwrap` (UCF → plain), `normalizeForm`, `normalizeRuleSet`, `withPatchFields` |
| `modules/evaluate.js` | `evaluate()`: fixed-point evaluation, conflict resolution, effects |
| `modules/validate.js` | `validate()`: static checks of form + rule set |
| `modules/merge.js` | `merge()`, `expirePatches()`: mounting patches safely |
| `modules/events.js` | `handleEvent()`: facts, rule set replacement, event patches |

## Invariants

1. **No I/O in the engine.** `evaluate`, `validate`, `merge` and `handleEvent` take everything as arguments and return new objects. No `Date.now()`, no `fetch`, no randomness. `expirePatches` takes `now` as an argument for that reason.
2. **Declarative evaluation.** `evaluate` recomputes from inputs. Hidden values read as `null`, so evaluation loops until the matched rules and visible fields stop changing (max 16 passes, then it throws). `validate` catches most loops statically.
3. **Strict logic.** Never add `==`; never coerce types in comparisons.
4. **Patches only narrow.** `NARROWING` in actions.js is the list of actions a patch rule may apply to base fields and steps.
5. **Fixtures are the contract.** A behaviour change needs a fixture in `fixtures/`; another runtime (for example .NET) proves itself by passing them.

## Gotchas

- Field ids from patches contain a dot (`offers.travelCover`). `getPath` matches the longest flat key first, so `values.offers.travelCover` resolves to the flat key.
- `evaluate` expects typed values: a select with numeric choices needs a number, not the string `FormData` gives. Converting is the host's job (`<form-flow>`).
- `emit` fires on edges, which needs `input.previous.matched`. Without `previous`, every `on: "enter"` emit in an active `then` or `else` list fires.
