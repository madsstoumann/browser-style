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
| `modules/session.js` | Session helpers: `createSession`, `snapshot` (never special or file values), `resume`, … |
| `modules/types.js` | Field types as data: `defineTypes`, `loadTypes`, `loadPackages`, `typeOf`, `fieldFromType`, `changeType`, `searchTypes`. Core package in `types/core.json`; country packages live in `ui/form-types/*` |
| `modules/show.js` | Texts that follow the answers: `conditionOf` (named condition or JSON Logic), `implicitRules` (showWhen as rules), `matchingCases`, `noteOf` |
| `modules/consent.js` | `consentRecords()`: what each ticked consent field said |

## Invariants

1. **No I/O in the engine.** `evaluate`, `validate`, `merge` and `handleEvent` take everything as arguments and return new objects. No `Date.now()`, no `fetch`, no randomness. `expirePatches` takes `now` as an argument for that reason.
2. **Declarative evaluation.** `evaluate` recomputes from inputs. Hidden values read as `null`, so evaluation loops until the matched rules and visible fields stop changing (max 16 passes, then it throws). `validate` catches most loops statically.
3. **Strict logic.** Never add `==`; never coerce types in comparisons.
4. **Patches only narrow.** `NARROWING` in actions.js is the list of actions a patch rule may apply to base fields and steps.
5. **Fixtures are the contract.** A behaviour change needs a fixture in `fixtures/`; another runtime (for example .NET) proves itself by passing them.

## Gotchas

- Never put a country-specific type or check in core (`types/core.json`, the engine). It goes in a package under `ui/form-types/`, with kinds prefixed by the package name.
- `kind` is editor metadata. The engine evaluates `type`, `ui.widget` and `validation` only.

- Field ids from patches contain a dot (`offers.travelCover`). `getPath` matches the longest flat key first, so `values.offers.travelCover` resolves to the flat key.
- `evaluate` expects typed values: a select with numeric choices needs a number, not the string `FormData` gives. Converting is the host's job (`<form-flow>`).
- `showWhen` rules are generated in every pass from the (patched) form, ids `showWhen:<field>` and `showWhen:step:<id>`, and validated with the rule set's rules at the path they were written (`rule.at`).
- `emit` fires on edges, which needs `input.previous.matched`. Without `previous`, every `on: "enter"` emit in an active `then` or `else` list fires.
