# @browser.style/product-taxonomy

A flexible, zero-dependency web component for searching product taxonomies from any text-based data source. It features a pluggable parser system, an intelligent keyword-based search, and an optional, built-in preview for Schema.org microdata and JSON-LD.

It is a wrapper around the [`@browser.style/auto-suggest`](https://github.com/madsstoumann/browser-style/tree/main/ui/auto-suggest) component.

## Installation

```bash
npm install @browser.style/product-taxonomy
```

## Usage

The component is designed to be generic. You provide a data file and a parser function to tell the component how to read your taxonomy format. Default parsers for Google and Facebook formats are included for convenience.

### Basic Example (Google Taxonomy)

1.  **HTML**: Place the component in your HTML and provide a path to your taxonomy data file.

    ```html
    <product-taxonomy id="google-tax" data="google.txt"></product-taxonomy>
    ```

2.  **JavaScript**: Import the component and one of the default parsers. Then, assign the parser to the component's `parser` property.

    ```javascript
    import {
    	ProductTaxonomy,
    	googleTaxonomyParser,
    } from '@browser.style/product-taxonomy';

    const taxonomyEl = document.getElementById('google-tax');
    taxonomyEl.parser = googleTaxonomyParser;
    ```

### Advanced Example (Custom Parser)

If you have a custom taxonomy format, you can easily support it by writing your own parser function.

**Data file (`custom.txt`)**:

```
SKU-123 :: Electronics | Gadgets | Smart Watches
SKU-456 :: Home & Garden | Kitchen | Appliances
```

**HTML & JS**:

```html
<product-taxonomy id="custom-tax" data="custom.txt"></product-taxonomy>

<script type="module">
	import { ProductTaxonomy } from '@browser.style/product-taxonomy';

	const customTaxonomyEl = document.getElementById('custom-tax');

	// Define a function that processes one line of your file
	const myCustomParser = (line) => {
		const [id, path] = line.split(' :: ');
		if (!id || !path) return null;
		const categories = path.split(' | ').map((c) => c.trim());
		return {
			id,
			name: categories[categories.length - 1],
			path,
			categories,
		};
	};

	// Assign your custom parser
	customTaxonomyEl.parser = myCustomParser;
</script>
```

> **Note on Schema Generation**: The component's ability to generate Schema.org microdata and JSON-LD depends on the object structure returned by your parser. For the schema generation to work correctly, your parser **must** return an object containing these four properties:
> - `id`: The unique category ID.
> - `name`: The final category name.
> - `path`: The full, human-readable category path.
> - `categories`: An array of the individual category names.

### Displaying Schema.org Previews

To help with debugging and verification, you can have the component render a preview of the generated Schema.org markup.

Use the `schema` attribute with space-separated values:

-   `schema="microdata"`: Shows Microdata preview.
-   `schema="json"`: Shows JSON-LD preview.
-   `schema="microdata json"`: Shows both.

```html
<product-taxonomy
	id="google-tax"
	data="google.txt"
	schema="microdata json"
></product-taxonomy>
```

## Attributes

-   `data` **(Required)**: Path to the taxonomy text file.
-   `schema`: Space-separated values. Include "microdata" or "json" to show schema previews.
-   `label`: Label text for the input field.
-   `placeholder`: Placeholder text.
-   `minlength`: Minimum characters before search (default: 2).
-   `max-results`: Maximum number of results to show (default: 50).
-   `list-mode`: Either "datalist" or "ul" (default: "datalist").
-   `noshadow`: Render the underlying `auto-suggest` without a shadow DOM.
-   `required`: Make the field required.
-   `info-template`: Template for info slot text (use `{count}` placeholder, default: 'Loaded {count} categories')

## Properties

-   `parser`: A JavaScript function that takes a string (a line from the data file) and returns a structured object: `{ id, name, path, categories }`. Defaults to `googleTaxonomyParser`.

## Slots

The component supports two named slots inherited from the underlying `auto-suggest` component:

### `slot="info"`
Static, persistent information that remains visible. Automatically updated once when data loads using the `info-template` attribute.
- **Use for:** Data counts, helpful hints, keyboard shortcuts
- **Example:** "5,600 categories loaded", "Use arrow keys to navigate"
- **Template:** Use `info-template="Loaded {count} categories"` to customize the message

### `slot="status"`
Dynamic status updates based on component events. Automatically managed.
- **Updates on:** Loading, searching, results count, errors, selection
- **Example:** "Loading...", "Found 23 results", "No results found"

```html
<product-taxonomy data="google.txt">
  <small slot="info"></small>    <!-- Persistent info -->
  <small slot="status"></small>  <!-- Dynamic status -->
</product-taxonomy>
```

Both slots are optional. If provided, they will be automatically updated by the component.

## Events

-   `taxonomyLoadStart`: Fired when taxonomy data loading begins.
-   `taxonomyLoadEnd`: Fired when loading completes (detail: `{count}`).
-   `taxonomyLoadError`: Fired on loading error.
-   `taxonomySearchStart`: Fired when search begins.
-   `taxonomySearchEnd`: Fired when search completes (detail: `{count}`).
-   `taxonomySelect`: Fired when a category is selected (detail: the full taxonomy item object).
-   `taxonomyClear`: Fired when the selection is cleared.

## API

-   `selectedItem`: (Read-only) Get the currently selected taxonomy item object.
-   `setValue(id, display)`: Set the component's value programmatically.
-   `search(query)`: Trigger a search programmatically.
