# @browser.style/product-taxonomy

A factory for configuring the [`@browser.style/auto-suggest`](https://github.com/madsstoumann/browser-style/tree/main/ui/auto-suggest) component to search product taxonomies. It includes ready-to-use parsers for Google and Facebook product feeds and can automatically render Schema.org previews for selected categories.

This package has been refactored to a factory-based approach. It no longer provides a `<product-taxonomy>` web component.

## Installation

```bash
npm install @browser.style/product-taxonomy @browser.style/auto-suggest
```

> **Note**: This package is a configuration layer and requires `@browser.style/auto-suggest` as a `peerDependency`. You must have both installed.

## Usage

The factory enhances a standard `<auto-suggest>` element, handling the data fetching, parsing, and setup.

### Basic Example (Google Taxonomy)

1.  **HTML**: Place an `<auto-suggest>` component in your HTML.

    ```html
    <auto-suggest
      id="google-taxonomy"
      label="Google Product Category"
      placeholder="e.g., headphones, coffee, toys"
      noshadow
    ></auto-suggest>
    ```

2.  **JavaScript**: Import the factory and a parser. Then, call the factory with the element and your options.

    ```javascript
    import { createTaxonomySelector, googleTaxonomyParser } from '@browser.style/product-taxonomy';
    import '@browser.style/auto-suggest';

    const autoSuggestEl = document.getElementById('google-taxonomy');

    createTaxonomySelector(autoSuggestEl, {
      dataUrl: 'google.txt', // Path to the local taxonomy file
      parser: googleTaxonomyParser
    });
    ```

### Displaying Schema.org Previews

The factory can automatically render a preview of the generated Schema.org markup. To enable this, add the `schema` attribute to your `<auto-suggest>` element. The factory will detect it and inject the preview elements into the DOM.

-   `schema="microdata"`: Shows Microdata preview.
-   `schema="jsonld"`: Shows JSON-LD preview.
-   `schema="microdata jsonld"`: Shows both.

```html
<auto-suggest
  id="google-taxonomy"
  label="Google Product Category"
  schema="microdata jsonld"
></auto-suggest>
```

### Advanced Example (Custom Parser)

You can support any taxonomy format by writing a custom parser function.

**Data file (`custom.txt`)**:

```
SKU-123 :: Electronics | Gadgets | Smart Watches
SKU-456 :: Home & Garden | Kitchen | Appliances
```

**HTML & JS**:

```html
<auto-suggest id="custom-taxonomy" label="Custom Category"></auto-suggest>

<script type="module">
  import { createTaxonomySelector } from '@browser.style/product-taxonomy';
  import '@browser.style/auto-suggest';

  const autoSuggestEl = document.getElementById('custom-taxonomy');

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

  // Use your custom parser in the factory
  createTaxonomySelector(autoSuggestEl, {
    dataUrl: 'custom.txt',
    parser: myCustomParser
  });
</script>
```

> **Note on Schema Generation**: For the schema preview to work correctly, your parser **must** return an object containing these four properties: `id`, `name`, `path`, and `categories`.

## Factory API

### `createTaxonomySelector(autoSuggestElement, options)`

-   **`autoSuggestElement`**: The `<auto-suggest>` DOM element to enhance.
-   **`options`**: An object with the following properties:
    -   `dataUrl` (required): The URL or local path to the taxonomy data file.
    -   `parser` (required): A function that takes a line of text from the data file and returns a structured object.

## Component API

For attributes, properties, events, and slots, please refer to the documentation for the [`@browser.style/auto-suggest`](https://github.com/madsstoumann/browser-style/tree/main/ui/auto-suggest) component. The factory configures the `auto-suggest` component, which then behaves according to its own API.

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
<auto-suggest id="my-taxonomy">
  <small slot="info"></small>    <!-- Persistent info -->
  <small slot="status"></small>  <!-- Dynamic status -->
</auto-suggest>
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
