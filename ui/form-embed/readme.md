# Form Embed

`<form-embed>` puts a published form on any site by id. It loads one bundle (form, rules and the names of the host functions the form needs), imports those functions from a reviewed registry, and runs [`<form-flow>`](../form-flow/) inside it.

```html
<script type="module" src="https://v4.browser.style/ui/form-embed/index.js"></script>

<form-embed form-id="loan" version="1"></form-embed>
```

The client page does not need `@browser.style/base`: the embed brings its own form styles.

## Attributes

| Attribute | Purpose |
| --- | --- |
| `form-id`, `version` | Loads `forms/{form-id}/{version}.json` next to the script; no `version` loads `latest.json` |
| `src` | A bundle URL instead of `form-id` + `version` |
| `mode` | `shadow` (default) or `light`. `iframe` is planned and reports an `ff:error` for now |
| `stylesheet` | A client stylesheet adopted after the form styles (Shadow DOM) |
| `explain`, `label-prev`, `label-next`, `label-submit`, `label-required`, `label-unavailable` | Passed on to `<form-flow>` |

## Shadow DOM or light DOM

- **`mode="shadow"`** keeps the page's CSS out and the form's CSS in. Font and colour are inherited from the page. Theme it with `--form-*` properties, `::part()` and `stylesheet`.
- **`mode="light"`** renders into the page, so the site's own CSS styles the fields. The form styles are wrapped in `@scope (form-embed)` and sit in cascade layers, so they never touch the rest of the page and any unlayered site rule wins.

## Styling

```css
form-embed {
  --form-accent: #0b6e4f;
  --form-radius: 0;
  --form-font: system-ui;
  &::part(input) { background: #f4faf7; }
  &::part(button-primary) { min-inline-size: 12ch; }
}
```

| Property | Default |
| --- | --- |
| `--form-accent`, `--form-accent-text` | browser.style accent |
| `--form-text`, `--form-text-muted` | inherited colour, and a 70% mix of it |
| `--form-surface`, `--form-surface-alt`, `--form-border`, `--form-button` | base surface colours (`light-dark()`) |
| `--form-error`, `--form-warning` | base red and orange |
| `--form-focus` | the accent |
| `--form-font`, `--form-font-size` | `inherit`, `1rem` |
| `--form-radius`, `--form-gap` | `0.25rem`, `1.5rem` |

The public names are prefixed on purpose: the internal tokens (`--color-text`, `--color-accent` …) are set on the host from them, so a client's own tokens of the same name never leak in.

Parts: `form`, `steps`, `step`, `field`, `group`, `slot`, `label`, `input`, `hint`, `warning`, `nav`, `button`, `button-primary`, `explain`.

## Host functions

A bundle lists function names (`"functions": ["dk-cpr"]`). They resolve through [functions/registry.json](functions/registry.json), name → module; a name that is not there fails the load, so a check can never pass silently. Forms never carry script URLs.

The client may add its own synchronous functions; they win on a name clash:

```js
document.querySelector('form-embed').functions = { 'acme-customer-no': value => /^\d{8}$/.test(value) ? null : { code: 'acme', message: 'Eight digits' } };
```

## Services

Service URLs in a bundle resolve against the bundle, not the client page. Calls go straight from the browser, so a service must send CORS headers for the client's origin and need no secret key, and the client's CSP lists its host in `connect-src`.

## Events and API

The `ff:*` events of `<form-flow>` (`ff:change`, `ff:step`, `ff:emit`, `ff:submit`, `ff:error`) cross the shadow root unchanged; `<form-embed>` adds `ff:ready` with `{ id, version }`.

Properties and methods: `functions`, `context`, `facts`, `receive(event)`, `goTo(step)`, `state`, `values`, `bundle`, `flow` (the inner `<form-flow>`), `ready` (a promise).

## Client CSP

`script-src` and `connect-src` for the form host (plus `'self'` in `connect-src` when using `stylesheet`), and `img-src` for the field icons. The styles are constructed stylesheets, so no `style-src` exception is needed.

## Publishing a bundle

```sh
node ui/form-embed/publish.js loan 1 ui/form-rules/examples/loan.form.json ui/form-rules/examples/loan.rules.json
```

Writes `forms/loan/1.json` and `forms/loan/latest.json`, with the function names found in the JSON. It stands in for the editor or CMS publish step.
