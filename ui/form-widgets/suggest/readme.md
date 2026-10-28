# Form widget: Search suggestions

`ui.widget: "auto-suggest"` on a string field with `options.source` draws [`<auto-suggest>`](../../auto-suggest/) in [`<form-flow>`](../../form-flow/). The field type is `suggest/search` ("Search with suggestions").

```html
<form-flow form="…" packages="/ui/form-widgets/suggest/types.json"></form-flow>
```

The service (`services.<name>` in the rule set) is asked with a GET to its `url`, with the answers it `send`s as query parameters and `q` set to the typed text. It answers `[{ value, label }]`; `ui.suggest.valuePath` and `ui.suggest.displayPath` name other keys. The answer is the text in the box: suggestions help, they do not restrict. Without this package the same field gets the built-in native suggestion list.

`<auto-suggest>` writes its label and placeholder into its template as HTML, so the adapter escapes them; it is a pre-v4 component with Shadow DOM, styled here by `auto-suggest.css` from the base form tokens.
