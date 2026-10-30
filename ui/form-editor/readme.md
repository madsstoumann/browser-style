# Form Editor

`<form-editor>` is a visual editor for multi-step forms and their rules. It is meant for developers and content editors alike. It produces exactly two JSON documents, both UCF content:

> The whole system (JSON formats, operators and actions, custom functions, sessions, tracking, embedding, what is deferred) is explained in the [forms guide](../../docs/forms.md).

- **`<form-id>.form.json`** is the form definition (model `form-definition`), and is what `<form-flow>` renders.
- **`<rules-id>.rules.json`** is the rule set (model `form-rules`), and is what `@browser.style/form-rules` evaluates.

Demo: [/ui/form-editor/](https://browser.style/ui/form-editor/)

## Use

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/ui/step/ui-step.css">
<link rel="stylesheet" href="/ui/form-flow/index.css">
<link rel="stylesheet" href="/ui/form-editor/index.css">

<form-editor
  form="insurance.form.json"
  rules="insurance.rules.json"
  samples='{ "offers": "offers.patch.json" }'>
</form-editor>
<script type="module" src="/ui/form-editor/index.js"></script>
```

`types` lists the installed field type packages (URLs of their `types.json`, space-separated); the core package is always installed. The **+ Field** button and **Change type** open a searchable picker grouped by type, with types from other packages under *From installed packages*. A package's `functions` (its checks) are loaded with it. Set `editor.types` to pass a registry from `loadPackages()` directly.

```html
<form-editor types="/ui/form-types/dk/types.json /ui/form-types/banking/types.json"></form-editor>
```

`snippets` lists snippet files (space-separated URLs), offered in the picker under *Snippets: several fields at once*. A snippet adds a group of fields with their rules, variables and services; ids that are taken are renamed, and the rules follow. `ui/form-editor/snippets/` has `address`, `contact` and `consent`; set `editor.snippets` to pass them directly. See the [forms guide](../../docs/forms.md#snippets).

Widget packages from [form-widgets](../form-widgets/) can be listed in `types` too; the preview then draws their controls.

`functions` is the URL of a module whose default export is `{ name: fn }`: the host functions the rules call (see form-rules § Validation). The editor offers them as field checks, validates with them and passes them to the preview; set `editor.functions` to pass them directly. The demo opens the advanced loan example with `?example=loan`.

All attributes are optional. `form` and `rules` give the example that the **Example** button restores. `samples` maps a service name to a sample reply (a form patch), which the preview uses in place of calling the service. Without attributes, the editor starts with an empty form.

The editor saves a draft in `localStorage` (`form-editor:draft:<form URL>`, one per example) on every change and restores it on load.

## The page

| Part | What it does |
|---|---|
| Toolbar | Shows the form title and the Form, Rules and JSON tabs (JSON only when Advanced is on). Also has Undo/Redo (Ctrl/Cmd+Z, Shift for redo), Example, New, Import, Export and the Advanced toggle. |
| Outline | Lists steps, their fields (with their type's glyph) and their slots, then the result panels. **+ Field** opens the type picker; **+ Step** adds a step; **+ Result panel** adds a panel, and its **+ Text or value** picker offers only text blocks and calculated values. |
| Form view | Edits whichever is selected: the form (title, ids, rule set version, and **How it is shown**: one step at a time, all on one page or one page that unfolds, *Move on when a choice is made*, *Nothing is sent (a calculator)*; the preview follows it), a result panel (heading, place, hidden, delete), a step (name, hidden, slots, order, and **Save fields as snippet…**, kept in this browser under *Your snippets* in the picker, or downloaded) or a field (label, id, help, type (Change type), required, hidden, privacy, and the settings its type lists: choices, placeholder, min/max, length, pattern, checks, starting value, text, consent wording and notice, file limits, value source, the variable and format of a calculated value, the row fields and row limits of a repeating group, the service a list comes from, privacy (none, personal, special) and, for non-personal choices, whether the chosen option may go to analytics, and the step). Renaming a field id also updates every rule, action and service that names it. Deleting a field lists the rules that use it. |
| Texts that follow the answers | Each choice has **Text shown when chosen** (`note`). A text block has **Texts that depend on the answers**: cases reading *When [named condition] Show: [text]*, every match or the first. Fields and steps have **Show this field / step**: Always or a named condition (`showWhen`). The picker lists named conditions by title, **+ New named condition…** adds one, and **Edit "…"** builds it with the rule pickers. See the [guide](../../docs/forms.md#texts-that-follow-the-answers). |
| Rules view | Shows each rule as a sentence ("When Age group is at least 30–49 and Zip code is above 2000: offer only Plus, Senior in Plan."). Text fields offer *contains*, *does not contain*, *starts with* and *ends with*, ignoring case unless *match case* is ticked, and any comparison can be against a value or against another field. Opening a rule shows a **When** builder (All/Any groups, field, operator and value pickers fitted to the field), plus **Then** and **Otherwise** action rows. A condition the builder cannot draw stays as a custom JSON block, which can be edited when Advanced is on. When the form has a repeating group, **Runs** makes a rule run *For each row of* it (`forEach`): conditions then offer the row's fields and its row number, and actions the row verbs on its cells ("For each row of Order lines: when Product is Cake: make Note for the baker required."). Renaming the list renames its row rules too. Actions include `invalid` (a message on a field, blocking or only warning) and `set`/`add` on variables. **Named conditions** are yes/no variables built with the same pickers ("Is senior customer"); rules pick them like a field, and **Save as named condition…** turns a rule's When into one. Each rule can carry a **Note** for editors, and **Copy rule** / **Paste rule** move a rule, with its variables and services, between forms. With more than three rules, a search box and a field picker filter the list. Also edits variables (start value, or a calculation with Advanced on) and services (URL, method, which fields they send, timeout, sample reply; a fetch can be marked *wait for it*). A rule can be marked *Track this rule in analytics* (`"track": true`, see form-flow § Tracking). With Advanced on, it also edits the events the rule set listens for. |
| Preview | A live `<form-flow explain>` showing the current documents. Values the user has typed survive edits. **Restart** clears them. |
| Status | Shows the `validate()` result. **Export is blocked while there are problems.** |

**Advanced** shows ids, priorities, a field's pattern, the listen list and the raw JSON. It is off by default so content editors work with pickers and sentences only.

**Import** accepts one or more JSON files and detects each one's model: a form definition, a rule set, or a form patch (which becomes the sample reply of the first service). Plain, non-UCF documents are wrapped as UCF.

## API

| Member | |
|---|---|
| `load(form, rules?, samples?)` | Starts editing these documents. Undo history is cleared. |
| `output` | `{ form, rules }`, a copy of what Export downloads. |
| `setSample(service, text)` | Sets the preview's sample reply for a service. |
| `undo()`, `redo()` | |
| `fe:change` | Fired after every edit. `detail` is `output`. |
| `fe:export` | Fired on export. `detail` is `output`. |

The editing helpers are in `modules/model.js` (pure, Node-safe), and the condition ↔ builder conversion and the sentence summaries are in `modules/conditions.js`. Both are tested with `npm test`.
