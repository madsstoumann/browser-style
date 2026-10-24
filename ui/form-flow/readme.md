# Form Flow

`<form-flow>` renders a multi-step form from a JSON form definition and a [form-rules](../form-rules/) rule set. Fields are plain native controls in light DOM, styled by `@browser.style/base` form.css; steps use the `.ui-step` list from `ui/step`.

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/step/ui-step.css">
<link rel="stylesheet" href="/ui/form-flow/index.css">

<form-flow
  form="insurance.form.json"
  rules="insurance.rules.json"
  explain>
</form-flow>

<script type="module" src="/ui/form-flow/index.js"></script>
```

Or from objects: `flow.setup(definition, rules, { values, context, facts, step, previous })`.

## How it works

Every input re-runs `evaluate()` and applies the result:

| Rule result | In the DOM |
| --- | --- |
| Field hidden | Its label or group gets `hidden`, its controls `disabled` (so they are not submitted; the value stays in memory) |
| Field disabled / required | `disabled` / `required`, and the `<abbr>` marker |
| Options narrowed | `<option>`s, radios and checkboxes outside the list are hidden and disabled |
| `setValue` | The control is updated |
| Option no longer available | `setCustomValidity()` on the control |
| An issue with a message (constraint, check, `invalid` rule) | `setCustomValidity(message)`; a `warning` shows as `<small part="warning">` after the field and does not block |
| Step skipped | The step's `<fieldset>` is `disabled` and left out of the step list |

**Next** validates the current step with native constraint validation. **Send** validates every visible step and dispatches `ff:submit`.

## Effects and events

- `fetch` effects are sent to the service URL with the fields the service declares in `send` (POST as JSON, or GET as query parameters with `"method": "GET"`). The reply is merged as a patch: its fields appear in their slot, its steps after the step the fetch named. Set `flow.fetcher = async (effect, service) => patch` to use a proxy or a mock; return `undefined` to fall back to the built-in request.
- A fetch with `wait` (a backend check) holds Next and Send, with `aria-busy` on the button, until the reply is merged.
- `flow.functions = { name: fn }` passes host functions (operators and field checks) to the engine; today's date is passed as `today` in the user's time zone. The advanced demo is `loan.html`.
- `goto` needs nothing from the host: the engine's `path` already leaves out the steps passed over, so Next lands on the target and Back returns along the path.
- `emit` effects are dispatched as `ff:emit`.
- `flow.receive(event)` applies an incoming event the rule set listens for (facts, a newer rule set, a patch).
- `flow.context = { … }` and `flow.facts = { … }` re-evaluate.

| Event | Detail |
| --- | --- |
| `ff:change` | `{ values, state }` after every evaluation |
| `ff:step` | `{ step }` |
| `ff:emit` | `{ type, data, rule, where }` |
| `ff:submit` | `{ form, rules, version, values, state }` |
| `ff:error` | `{ error, errors?, effect?, event? }` |
| `ff:track` | An analytics event, see below |

## Attributes

| Attribute | |
| --- | --- |
| `form`, `rules` | URLs of the form definition and the rule set |
| `explain` | Shows a "Why" list of which rule decided what |
| `track-context` | Context keys `form.start` may carry (default `channel campaign`) |
| `label-prev`, `label-next`, `label-submit`, `label-unavailable`, `label-required` | Button and message texts |

## Field types

| Property | Control |
| --- | --- |
| `string` | `<input>`; `ui.widget` may be `email`, `tel`, `url`, `date`, `time`, … or `textarea` |
| `number`, `integer` | `<input type="number">` with `validation.minimum` / `maximum` |
| `boolean` | `<input type="checkbox" role="switch">` |
| `select` | `<select>`; a radio group with `ui.widget: "radio"`; checkboxes with `options.multiple` |

Values are typed from the definition: a choice `30` comes back as the number `30`.

## Tracking

form-flow describes the funnel as `ff:track` events and hands each one to `flow.tracker`. Every event has the same envelope, so a backend can store it as one flat row:

```json
{ "type": "step.leave", "form": "form-loan", "rules": "loan", "version": 1,
  "session": "s_7f3a…", "seq": 14, "at": "2026-10-24T09:12:03Z",
  "step": "economy", "index": 1, "path": ["you", "economy", "loan", "review"],
  "data": { "ms": 41200, "direction": "next" } }
```

`session` is random per run (not a user id, not stored); `seq` orders events sent in batches.

| Event | When | `data` |
| --- | --- | --- |
| `form.view` | The form is rendered | |
| `form.start` | First input | `entry`, `context` (only the `track-context` keys) |
| `step.view` | A step is shown | `from`, `via`: `start`, `resume`, `next`, `back`, `goto`, `rule`, `submit`, `goTo()` |
| `step.leave` | A step is left | `ms` on the step, `direction` |
| `step.blocked` | Next or Send refused | `fields`, `codes` |
| `field.error` | A field gets a message the user sees | `field`, `code`, `level`, `rule?` |
| `field.revisit` | A field on an earlier step is changed again | `field` |
| `rule.enter` / `rule.leave` | A rule with `"track": true` starts or stops matching | `rule` |
| `service.request` / `service.reply` / `service.error` | A fetch runs | `service`, `wait`, `ms`, `status` |
| `form.submit` | Sent | `ms`, `jumps`, `patches`, `warnings?`, `choices?` |
| `form.abandon` | The page is hidden or left before Send | `lastField`, `ms`, `choices?` |
| `form.resume` | A saved session is reopened (instead of `form.view`; the run counts as started) | `age?` |

**Ids, never values.** Events carry field, step and rule ids, issue codes and durations. The only values are `choices`: the chosen option of `select` fields marked `"track": true` in the form definition (the loan demo marks `purpose` and `term`). Never mark a field whose options are personal.

**Consent** is the host's call: set `flow.tracker` only when consent allows, or use a tracker that buffers until it is granted.

### Trackers

```js
import { beacon, dataLayer, combine } from '/ui/form-flow/trackers/index.js';

const tracker = combine(beacon('/api/form-events', { consent: false }), dataLayer());
flow.tracker = tracker;
// later, from the consent banner:
tracker.grant();
```

| Tracker | Does |
| --- | --- |
| `beacon(url, { batch: 20, interval: 10000, consent: true, send })` | Queues events and posts them as a JSON array every `interval` ms or `batch` events, and on `pagehide` with `navigator.sendBeacon` (as `text/plain`, so no CORS preflight). `grant()` sends what was buffered, `revoke()` drops it. The endpoint only appends rows. |
| `dataLayer({ name: 'dataLayer', prefix: 'form_' })` | Pushes `{ event: 'form_step_view', form_id, form_session, form_step, form_path, … }` to `window.dataLayer` for Google Tag Manager / GA4: flat snake_case parameters, at most 25. |
| `combine(...trackers)` | Hands every event to each, and forwards `flush`, `grant` and `revoke`. |

A tracker is any function `event => {}`; an optional `flush()` is called after `form.submit` and `form.abandon`. The event logic lives in `tracking.js` (tested in Node: `npm test`).

## Saving and resuming (sessions)

`session.js` saves a partly filled form and makes a sent form final. Demo: `session.html`.

```js
import FlowSession, { MockServer } from '@browser.style/form-flow/session.js';

const session = new FlowSession(flow, {
  owner: { kind: 'anonymous' },          // or { kind: 'user', sub: 'login-subject' }
  server: new MockServer(),             // the draft store; a mock until there is a backend
  send: async (detail) => ({ reference: 'AB-1234' }) // the real submission; returns the receipt
});
await session.start();
```

| Who | Where the draft is kept | How long |
| --- | --- | --- |
| Anonymous, by default | `sessionStorage`, this tab only | Until the tab closes |
| Anonymous, after `session.saveOnDevice()` | `localStorage` | 30 days from the start |
| Anonymous, after `session.emailLink(email)` | The server, opened with a one-time link (`#resume=…`) | 30 days from the start |
| Signed in | The server, one draft per form | 90 days after the last change |

- Only values of visible fields are saved. Fields with `privacy: "special"` (health, national id) are never saved and must be filled in again; `personal` fields are saved once the person chose to keep the draft.
- On resume the draft is checked against the current form and rules: removed fields and options that are no longer allowed come back in `ff:resumed` as `changes`.
- A resumed draft starts a tracking run with `form.resume` (and `age` in hours) instead of `form.view`. Set `flow.tracker` after `await session.start()`, so the run from the first render, before the resume, is not reported.
- `session.discard()` deletes every copy and starts over; `session.forgetHere()` removes the copies in this browser (call it on logout).
- After submit, every copy becomes a tombstone without answers. The form is cleared and hidden, `[part="done"]` shows the receipt, `done` is set on `<form-flow>`, and other tabs of the same draft lock through `BroadcastChannel`. A page restored with Back checks again.
- The server must enforce the same: no save after submit (`409`), the same receipt for a repeated submit, tokens stored hashed and used once. `MockServer` shows the contract.

| Event | `detail` |
| --- | --- |
| `ff:resumed` | `{ session, changes, migrated }` |
| `ff:resume-failed` | `{ reason }`: `link`, `expired`, `reset`, … |
| `ff:saved` | `{ session }` |
| `ff:link` | `{ email, url, expires }` (a real backend emails the url instead) |
| `ff:discarded` | `{ session }` |
| `ff:done` | `{ session }` |
