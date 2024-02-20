## Attributes
```html
<ui-editor
  files="components.json, global.json, plugins.json, tools.json"
  logo="/logo.svg"
  open="true"
  openkey="."
  selectable="component,part"
  togglekey=",">
</ui-editor>
```

### Selectable
This attribute is a comma-delimited string of selectable nodes.
If you don't set the `selectable`-attribute, *all nodes* will be selectable.
Otherwise, only nodes with a matching `data`-attribute will be selactable.

Example:
With `selectable="component,part"`, nodes with a `data-component` or `data-part`-attribute will be selectable. Notice, that `selectable` expects the `camelcase`-version. So:

```html
<div data-my-cool-component="">
```

Should be:
```html
<ui-editor selectable="myCoolComponent">
  ```

## Components and Parts

- `data-component`
- `data-part`


## Multiple Ways of Styling

### Utility
A utility-class consists of the following parts:

`BREAKPOINT` · `BREAKPOINT DELIMITER` · `PREFIX` · `PREFIX DELIMITER` · `VALUE`

An example from Tailwind. For the `md`-breakpoint, set `margin-left` to `2`:

```html
<div class="md:ml-2">...</div>
```

In that example, `md` is the breakpoint, `:` is the breakpoint-delimiter, `ml` is the prefix, `-` is the prefix-delimiter, and `2` is the `value`.

The breakpoint-delimiter can only be used *once* per entry, but the prefix-delimiter can be used (but not recommended) multiple types in the same entry. The first instance will be used as the delimiter.

### Parts
Parts can be set and shared across multiple types of component.

Example:
```html
<!--Card Component-->
<div class="c-card" data-component="card">
  <h2 data-part="headline">Headline</h2>
</div>

<!--Article Component-->
<article class="c-article" data-component="article">
  <h2 data-part="headline">Headline</h2>
</article>
```

In the example above, both components have a `data-part="headline"`. In the visual editor, both components will be able to select the same headline-style, but only components with the *same* `data-component`-attribute will be updated.

### Properties
If you want to update a CSS Custom Property, use the `data-property`-attribute. 
To set a CSS unit with it, use the `data-unit`-attribute.

Example:
```html
<input type="range" data-property="--fs" value="50">
```

Will return:
```html
--fs: 50;
```

With `data-unit`:

```html
<input type="range" data-property="--fs" data-unit="px" value="50">
```

It will set:
```html
--fs: 50px;
```

### Scope
If you don't set a scope, the property will be set on the input-node itself.
To set the property on *another node*, use the `data-scope`-attribute with one of these values:

- `fieldset`: returns the closest fieldset
- `form`: returns the form, the input belongs to
- `next`: returns nextElementSibling
- `parent`: returns parentNode
- `prev`: returns previousElementSibling
- `root`: returns document.documentElement
- `self`: returns the input itself, same as blank

If `data-scope` has *another* value than the ones mentioned above, a `querySelector` will be used, example:

```html
<input type="range" data-property="--fs" data-unit="px" data-scope="body">
```

---

## Keyboard Shortcuts
For all keyboard-shortcuts: Press `Ctrl+Shift` in addition to the shortcut.

| Key | Description |
| --- | --- |
| , | Toggle the app. Change in `togglekey`-attribute |
| . | Toggle the app *and* open the editor with the last selected element. Change in `openkey`-attribute |
| ↑ | Select parent |
| ↓ | Select first child |
| → | Select next sibling |
| ← | Select previous sibling |
| ⌫ | Delete selected
| ⇞ | Switch position with previous sibling |
| ⇟ | Switch position with next sibling |
| ↖ | Move to first within parent |
| ↘ | Move to last within parent |
| c | Copy selected |
| r | Replace selected |
| v | Paste selected |
| x | Cut selected |
| y | Redo |
| z | Undo |
| 1 | Go to first tool |
| 2 | Go to second tool |
| 3 | Go to third tool |
| 4 | Go to forth tool |

### Navigation

