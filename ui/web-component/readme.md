# WebComponent Base Class

`WebComponent` is a foundational HTMLElement class designed to simplify the creation of custom web components. It provides built-in support for different rendering modes (Shadow DOM, DOM, Declarative Shadow DOM) and flexible stylesheet management.

## Features

*   **Multiple Rendering Modes**:
    *   `shadow` (default): Renders content into a Shadow DOM. Styles are automatically adopted.
    *   `dom`: Renders content directly into the component's Light DOM (i.e., the standard DOM). Styles are loaded but not automatically applied, allowing for manual integration or build-step processing.
    *   `dsd`: Renders content wrapped in a `<template shadowrootmode="open">...</template>`, enabling Declarative Shadow DOM. Styles are included within the template if not manually handled.
*   **Flexible Stylesheet Handling**:
    *   **Automatic Loading**: By default, attempts to load `index.css` from the same directory as the component's JavaScript file.
    *   **Custom Stylesheet URL**: Use the `styles` attribute to specify a URL for a custom CSS file.
    *   **Manual Style Management**: Setting the `styles` attribute to `"none"` (`styles="none"`) prevents automatic style application (e.g., `adoptedStyleSheets` or `<style>` tag in declarative mode), while still loading the default `index.css`. This allows developers to import or manage styles through other means (e.g., a build process), using the loaded styles available in the component instance.
*   **Style Caching**: 
    *   Stylesheets fetched via URL are cached, so multiple components requesting the same URL fetch it only once.
    *   For Declarative Shadow DOM, a `shared-styles-id` attribute allows multiple component instances to share a single `CSSStyleSheet` object on the client, with the style content rendered only once in the initial HTML.
*   **Easy Templating**: Subclasses should override the `_getTemplate()` method to provide their HTML content.

## How to Use

### 1. Extend the `WebComponent` Class

Create your custom component by extending `WebComponent`.

```javascript
// filepath: /path/to/your-component/my-custom-element.js
import WebComponent from '/path/to/web-component/index.js'; // Adjust path as needed

class MyCustomElement extends WebComponent {
  constructor() {
    super();
    // Your component-specific initialization
  }

  // Override _getTemplate to define your component's HTML structure
  _getTemplate() {
    return `
      <p>Hello from My Custom Element!</p>
      <button>Click Me</button>
    `;
  }

  // You can still use connectedCallback, disconnectedCallback, etc.
  // for component-specific logic.
  connectedCallback() {
    super.connectedCallback(); // Call super's connectedCallback to ensure styles and rendering
    // Your additional logic after rendering
    const button = this.shadowRoot?.querySelector('button') || this.querySelector('button');
    button?.addEventListener('click', () => console.log('Button clicked!'));
  }
}

customElements.define('my-custom-element', MyCustomElement);
```

### 2. Define Component Content

Override the `_getTemplate()` method in your subclass. This method should return an HTML string representing your component's internal structure.

```javascript
// In your MyCustomElement class:
_getTemplate() {
  return `
    <h1>${this.getAttribute('title') || 'Default Title'}</h1>
    <div><slot></slot></div>
  `;
}
```

### 3. Use in HTML

```html
<!-- Default: Shadow DOM, tries to load ./index.css relative to my-custom-element.js -->
<my-custom-element title="My Shadow DOM Element">
  Content for slot
</my-custom-element>

<!-- DOM rendering -->
<my-custom-element render-mode="dom" title="My DOM Element">
  DOM content
</my-custom-element>

<!-- Declarative Shadow DOM -->
<my-custom-element render-mode="dsd" title="My Declarative Element">
  Declarative content
</my-custom-element>

<!-- Declarative Shadow DOM with shared styles -->
<!-- First instance renders the style block, subsequent ones reuse it -->
<my-custom-element render-mode="dsd" shared-styles-id="my-unique-style-id" title="Shared DSD 1">
  Content for shared DSD 1
</my-custom-element>
<my-custom-element render-mode="dsd" shared-styles-id="my-unique-style-id" title="Shared DSD 2">
  Content for shared DSD 2
</my-custom-element>

<!-- Custom stylesheet URL -->
<my-custom-element styles="/path/to/custom-styles.css" title="Styled Element">
  Styled content
</my-custom-element>

<!-- Manual style handling (styles="none" loads default index.css but doesn't apply it) -->
<my-custom-element styles="none" title="Manually Styled Element">
  Content here, default styles loaded but not applied, managed externally
</my-custom-element>
```

## Attributes

*   **`render-mode`**:
    *   Values: `shadow` (default), `dom`, `dsd`.
    *   Determines where the component's content (from `_getTemplate()`) is rendered.
    *   If this attribute is omitted, it defaults to `shadow`.
*   **`styles`**:
    *   Value: A URL string, or the specific string `"none"`.
    *   If a URL, specifies the path to a CSS file to be loaded and applied for the component.
    *   If `"none"`, the default `index.css` is loaded but *not* automatically applied. The styles are available on the instance for manual use.
    *   If not provided, it defaults to loading and applying `index.css` from the same directory as the component's script.
*   **`shared-styles-id`**:
    *   Value: A string identifier.
    *   Used in conjunction with `render-mode="dsd"`.
    *   When set, the first component instance on the page with this specific ID that successfully loads its styles will render the `<style>` block (with its `id` attribute set to this `shared-styles-id`) into its Declarative Shadow DOM template. This occurs only if `styles` is not set to `"none"`.
    *   Subsequent instances with the same `shared-styles-id` will not render the `<style>` block in their DSD template.
    *   On the client-side, all instances sharing the same `shared-styles-id` will adopt the same `CSSStyleSheet` object (if `styles` is not `"none"`). The initially rendered inline `<style>` tag from the "source" instance is removed after its sheet is adopted.
    *   This optimizes by reducing redundant style text in the DOM and allowing shared `CSSStyleSheet` objects.
    *   **Interaction with `styles="none"`**: If `styles="none"` is present, the `shared-styles-id` attribute is effectively ignored. No style block will be rendered for the shared ID, and no automatic adoption of shared stylesheets will occur for that instance. The component will load its default styles into its internal `_styleData` property, but their application is entirely manual.

## Stylesheet Loading and Application Logic

1.  **URL Determination**:
    *   If the `styles` attribute is present, its value is used as the stylesheet URL.
    *   If the `styles` attribute is `"none"` or not set, the component attempts to construct a URL for `index.css` relative to its own script file's location (using `import.meta.url`).
    *   A fallback to a relative `./index.css` is used if `import.meta.url` is unavailable (e.g., in non-module scripts or some testing environments), with a warning.

2.  **Fetching and Caching**:
    *   The component determines the stylesheet URL to load:
        *   If `styles` attribute provides a URL, that URL is used.
        *   If `styles` attribute is `"none"` or not set, `index.css` (relative to the component script) is targeted.
    *   Fetched stylesheets (both the `CSSStyleSheet` object and its text content) are cached statically (`WebComponent.#loadedStylesheets`). If another component instance requests the same URL, the cached version is used. All instances will have `this.#styleData` populated if loading is successful.

3.  **Style Application (if `styles` is NOT set to `"none"`)**:
    *   **`render-mode="shadow"`**: The loaded `CSSStyleSheet` is added to the `adoptedStyleSheets` array of the component's shadow root.
    *   **`render-mode="dsd"`**:
        *   **Server-Side Rendering (SSR)**: If the component's HTML is server-rendered with a `<template shadowrootmode="open">...</template>`, the browser parses this and attaches the shadow root.
            *   **With `shared-styles-id`**: The server should ensure only the first instance with a given `shared-styles-id` includes the `<style id="your-shared-id">...</style>` block in its DSD template.
            *   **Without `shared-styles-id`**: The server includes a `<style data-webcomponent-dsd-style>...</style>` tag in the DSD template.
        *   **Client-Side Initialization/Hydration**:
            *   If `this.shadowRoot` already exists (e.g., from SSR), `render()` is skipped on initial connection. Styles are loaded, and client-side enhancements (adopting stylesheets, removing inline `<style>` tags from the shadow root) are applied.
            *   If `this.shadowRoot` does not exist (purely client-side rendering or SSR without DSD template):
                *   `render()` is called. It imperatively attaches a shadow root (`this.attachShadow({ mode: 'open' })`).
                *   The shadow root's `innerHTML` is populated with the component's template and the appropriate style block (`<style id="shared-id">` or `<style data-webcomponent-dsd-style>`).
                *   Client-side enhancements then adopt the stylesheet and remove the inline style tag.
        *   The goal is for the client to "hydrate" or enhance the DSD, primarily by adopting `CSSStyleSheet` objects for performance and removing redundant inline `<style>` tags.
    *   **`render-mode="dom"`**: Styles are loaded and available via `this.#styleData`, but not automatically applied to the Light DOM by the base component (even if `styles` is not `"none"`). The developer is responsible for including them.

4.  **Manual Styles (if `styles="none"` attribute IS present)**:
    *   The default stylesheet (`index.css`) is loaded and cached as described above, and `this.#styleData` is populated.
    *   No automatic application of styles occurs (no `adoptedStyleSheets`, no injected `<style>` tag). This allows the developer full control over how and when the styles are used, using the content of `this.#styleData`.

## Declarative Shadow DOM (DSD) - SSR and CSR Scenarios

This section details how the `WebComponent` base class handles Declarative Shadow DOM in different rendering scenarios.

### 1. Server-Side Rendering (SSR) with DSD

*   **Server Output**:
    *   The server is responsible for rendering the custom element with its DSD template.
        Example:
        ```html
        <my-element render-mode="dsd" name="SSR DSD">
            <template shadowrootmode="open">
                <!-- Optional: <style> block for non-shared or first shared instance -->
                <style data-webcomponent-dsd-style>/* CSS for my-element */</style>
                <!-- Template content -->
                <p>Hello, SSR DSD!</p>
            </template>
        </my-element>
        ```
    *   **Shared Styles**: If using `shared-styles-id`, the server should only include the `<style id="your-shared-id">...</style>` block within the DSD template of the *first* instance encountered with that specific ID on the page. Subsequent instances with the same `shared-styles-id` should have their DSD template rendered *without* this style block.
*   **Browser Behavior**: The browser parses the `<template shadowrootmode="open">` and automatically attaches the shadow root to the `my-element` instance. The content, including any inline `<style>` tags, becomes part of this shadow root.
*   **Client-Side Hydration (`connectedCallback`)**:
    1.  `#updateAttributeCache()`: Reads attributes.
    2.  `#loadStyles()`: Fetches (or retrieves from cache) the `CSSStyleSheet` object and its text, storing it in `this.#styleData`.
    3.  **SSR Detection**: The component checks if `this.#_renderMode === 'dsd'` and if `this.shadowRoot` already exists. If both are true, it assumes SSR DSD.
    4.  **Skip `render()`**: Because the shadow root and its content are already provided by SSR, the main `this.render()` method (which populates `innerHTML`) is skipped for this initial setup.
    5.  `#performDsdClientSideEnhancements()`: This method is crucial for hydration:
        *   It looks up or creates the `CSSStyleSheet` object (especially important for shared styles to ensure all instances use the same sheet object).
        *   It adds this `CSSStyleSheet` to `this.shadowRoot.adoptedStyleSheets`.
        *   It removes the original inline `<style>` tag (e.g., `<style id="your-shared-id">` or `<style data-webcomponent-dsd-style>`) from `this.shadowRoot` to avoid style duplication and leverage the performance benefits of adopted stylesheets.
*   **Attribute Changes (Client-Side)**:
    *   If an observed attribute changes after hydration, `attributeChangedCallback` triggers.
    *   `#loadStyles()` may run again if relevant attributes changed.
    *   `this.render()` is called. Since `this.shadowRoot` now exists, the DSD logic within `render()` will update `this.shadowRoot.innerHTML` directly with the new content and the appropriate style block (which is then processed by `#performDsdClientSideEnhancements`).

### 2. Client-Side Rendering (CSR) with DSD

*   **Initial HTML**: The page might only contain the custom element tag, without the DSD template.
    Example:
    ```html
    <my-element render-mode="dsd" name="CSR DSD"></my-element>
    ```
*   **Client-Side Initialization (`connectedCallback`)**:
    1.  `#updateAttributeCache()`: Reads attributes.
    2.  `#loadStyles()`: Fetches/retrieves styles.
    3.  **SSR Detection Fails**: The component sees `this.#_renderMode === 'dsd'` but `this.shadowRoot` does *not* exist.
    4.  `this.render()` is called.
    5.  **Inside `render()` for DSD (when `!this.shadowRoot`)**:
        *   A shadow root is imperatively attached: `this.#root.attachShadow({ mode: 'open' })`. (Note: `this.#root` is the host element itself when `render-mode` is `dsd` or `dom`).
        *   The `innerHTML` of this newly created `this.shadowRoot` is populated with the component's template content (from `_getTemplate()`) and the appropriate style block:
            *   **Shared Styles**: If `this.#_sharedStylesId` is present and its styles (`this.#styleData.cssText`) are available, the `<style id="shared-id">...</style>` block is included. The `WebComponent.#registeredSharedStyleIds` set is checked and updated here to ensure that if multiple client-side instances with the same shared ID are initializing, the conceptual "first" one makes its style definition available (though all will adopt the same sheet object).
            *   **Non-Shared Styles**: The `<style data-webcomponent-dsd-style>...</style>` block is included.
    6.  `#performDsdClientSideEnhancements()`: Operates as described above, adopting the stylesheet into `this.shadowRoot.adoptedStyleSheets` and removing the inline `<style>` tag that was just added by `render()`.
*   **Attribute Changes (Client-Side)**:
    *   Handled identically to the SSR case after initial hydration: `render()` updates `this.shadowRoot.innerHTML`, and `#performDsdClientSideEnhancements()` refines the styles.

### Summary of DSD Style Handling

*   **Goal**: Efficiently apply styles using `adoptedStyleSheets` and minimize redundant style text in the DOM.
*   **SSR**: Server provides initial styles inline within the DSD template. Client JavaScript upgrades this to use `adoptedStyleSheets` and removes the inline tag.
*   **CSR (DSD mode)**: Client JavaScript imperatively creates the shadow root, injects content and an inline style tag, then immediately upgrades to `adoptedStyleSheets` and removes the inline tag.
*   **Shared Styles (`shared-styles-id`)**:
    *   Ensures only one `<style id="shared-id">` block is rendered in the initial HTML (if SSR'd, server handles this; if CSR, the `WebComponent.#registeredSharedStyleIds` helps manage this for client-side first-comers).
    *   All instances (SSR or CSR) with the same `shared-styles-id` will share a single `CSSStyleSheet` object in memory via `WebComponent.#sharedStyleSheets`, which is then adopted.

## Overriding Base Behavior

*   **`_getTemplate()`**: Essential to override for defining component HTML.
*   **Lifecycle Callbacks (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`)**: Can be extended. Remember to call `super.connectedCallback()` if you override it, to ensure the base class's rendering and style loading logic is executed.
*   **`#loadStyles()`**: While a private method, its behavior is influenced by attributes. Advanced customization might involve forking the base class.
