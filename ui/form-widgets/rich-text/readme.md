# Form widget: Rich text

`ui.widget: "rich-text"` on a string field draws [`<rich-text>`](../../rich-text/) in [`<form-flow>`](../../form-flow/). The field type is `rich-text/text` ("Formatted text" in the editor's picker).

```html
<form-flow form="…" packages="/ui/form-widgets/rich-text/types.json"></form-flow>
```

| Setting | Meaning |
| --- | --- |
| `ui.toolbar` | The `<rich-text>` toolbar, default `b,i,u|ol,ul|link,unlink` |
| `validation.maxLength` | Counts the HTML, not the visible text |

The value is HTML, cut down to an allowlist (`p br b strong i em u s ul ol li a h2 h3 h4 blockquote hr`, links only `http(s):` and `mailto:`) when it is read and when it is written back, so a pasted script or `onerror` never reaches the answers. **A server must still clean or escape it** before showing it anywhere (a backoffice, an email): anything can be posted. `<rich-text>` is a pre-v4 component with Shadow DOM; the adapter does not depend on that and keeps working when it is converted.
