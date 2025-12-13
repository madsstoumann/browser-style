# Web Config Robots Web Component

A visual web component for managing `robots.txt` files. Built with the same look and feel as the Web Config CSP component.

## Features

- 📋 **Visual Management**: Organize bots into Allow and Disallow sections
- ⚙️ **Advanced Settings**: Support for Host, Clean-param, Request-rate, and Visit-time
- 🔍 **Search & Filter**: Quickly find bots from long lists
- 🌐 **External Bot Lists**: Load bot lists from URLs (like the AI robots.txt repository)
- ⚡ **Quick Actions**: Move bots between sections, add custom entries
- 🎨 **Clean UI**: Matching design with Web Config CSP
- 🔔 **Event-Driven**: Listen for changes with `robtxt-change` events
- 💾 **Import/Export**: Parse and generate robots.txt files

## Installation

```html
<script type="module" src="./ui/web-config/web-config-robots/src/index.js"></script>
```

## Basic Usage

```html
<!-- Load existing robots.txt file -->
<robtxt-manager
  src="https://example.com/robots.txt"
></robtxt-manager>

<!-- Preload AI bots into disallow section -->
<web-config-robots
	disallow="https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.txt"
></web-config-robots>

<!-- Preload search engines into allow section -->
<web-config-robots
  allow="https://example.com/search-engines.txt"
></web-config-robots>

<!-- Load both allow and disallow lists -->
<web-config-robots
  allow="https://example.com/search-engines.txt"
  disallow="https://example.com/ai-bots.txt"
></web-config-robots>
```

## Attributes

### `src`
URL to load a complete robots.txt file. The component will parse the file and populate all sections including allow, disallow, sitemaps, and crawl-delay settings.

Example:
```html
<web-config-robots
  src="https://example.com/robots.txt">
</web-config-robots>
```

### `allow`
URL to load a list of bots to **allow**. The component will parse a robots.txt file to extract User-agent entries and automatically add them to the Allow section.

Example:
```html
<web-config-robots
  allow="https://example.com/search-engines.txt">
</web-config-robots>
```

### `disallow`
URL to load a list of bots to **disallow**. The component will parse a robots.txt file to extract User-agent entries and automatically add them to the Disallow section.

Example:
```html
<web-config-robots
	allow="https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.txt"
></web-config-robots>
```

### `initial-config`
JSON string to set initial configuration.

Example:
```html
<robtxt-manager
  initial-config='{"allow":["Googlebot","Bingbot"],"disallow":["GPTBot"],"cleanParam":["ref /articles/", "sid /session/"]}'>
</robtxt-manager>
```

> **Note on Clean-param:** The `Clean-param` directive tells crawlers to ignore specific URL parameters.
> In the example `ref /articles/`:
> - `ref` is the parameter to ignore.
> - `/articles/` is the path prefix where this rule applies.
> This means `/articles/some-page?ref=twitter` will be treated as `/articles/some-page`.
> You can add multiple `Clean-param` directives (one per line in the UI).

### `lang`
Set the language for the UI. Supported languages: `en` (English), `da` (Danish). Defaults to `en`.

Example:
```html
<robtxt-manager lang="da"></robtxt-manager>
```

You can also change the language dynamically:
```javascript
const manager = document.querySelector('robtxt-manager');
manager.setAttribute('lang', 'da');
manager.lang = 'da';
manager.render();
```

## JavaScript API

### Properties

#### `config` (getter/setter)
Get or set the current configuration.

```javascript
const manager = document.querySelector('robtxt-manager');

// Set config
manager.config = {
  allow: ['Googlebot', 'Bingbot'],
  disallow: ['GPTBot', 'CCBot']
};

// Get config
const config = manager.config;
// Returns: { allow: [...], disallow: [...] }
```

#### `robotsTxt` (getter)
Get the generated robots.txt string.

```javascript
const robotsTxt = manager.robotsTxt;
console.log(robotsTxt);
// Output:
// # Allowed Bots
// User-agent: Googlebot
// Allow: /
// ...
```

### Methods

#### `fromString(robotsTxtString)`
Parse a robots.txt string and update the configuration.

```javascript
const robotsTxtContent = `
User-agent: Googlebot
Allow: /

User-agent: GPTBot
Disallow: /
`;

await manager.fromString(robotsTxtContent);
```

## Events

### `robtxt-change`
Dispatched whenever the configuration changes.

```javascript
manager.addEventListener('robtxt-change', (event) => {
  console.log('Config:', event.detail.config);
  console.log('Robots.txt:', event.detail.robotsTxt);
});
```

Event detail structure:
```javascript
{
  config: {
    allow: ['Googlebot', 'Bingbot'],
    disallow: ['GPTBot']
  },
  robotsTxt: '# Allowed Bots\nUser-agent: Googlebot\n...'
}
```

## UI Features

### Allow/Disallow Sections
Two collapsible sections organize bots into allowed and disallowed categories.

### Bot Chips
Each bot is displayed as a chip with two buttons:
- **⇄** Move to the other section
- **×** Remove from the list

### Quick Add
- Type custom bot names in the input field
- Use the datalist suggestions from loaded bots
- Click quick-add buttons for available bots

### Search/Filter
When a bot list is loaded, use the search input to filter through hundreds of bots.

### Live Preview
The robots.txt output section shows the generated file in real-time.

## Styling

The component uses CSS custom properties for theming:

```css
robtxt-manager {
  --robtxt-manager-accent: hsl(211, 100%, 95%);
  --robtxt-manager-accent-dark: hsl(211, 50%, 50%);
  --robtxt-manager-buttonface: #efefef;
  --robtxt-manager-bdrs: .5rem;
  --robtxt-manager-ff-mono: 'Courier New', monospace;
  --robtxt-manager-ff-system: system-ui, sans-serif;
  --robtxt-manager-gap: 1rem;
  --robtxt-manager-focus-c: hsl(211, 5%, 60%);
  --robtxt-allow-color: hsl(120, 50%, 45%);
  --robtxt-allow-bg: hsl(120, 50%, 95%);
  --robtxt-disallow-color: hsl(0, 80%, 50%);
  --robtxt-disallow-bg: hsl(0, 80%, 95%);
}
```

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Robots.txt Manager</title>
</head>
<body>
  <!-- Preload AI bots into disallow section -->
  <robtxt-manager
    id="manager"
    disallow="https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.txt"
  ></robtxt-manager>

  <script type="module" src="./ui/robtxt-manager/src/index.js"></script>
  <script>
    const manager = document.getElementById('manager');

    // Listen for changes
    manager.addEventListener('robtxt-change', (e) => {
      console.log('Configuration updated:', e.detail.config);

      // Save to backend, localStorage, etc.
      localStorage.setItem('robotsConfig', JSON.stringify(e.detail.config));
    });

    // Dynamically load bots into allow section
    manager.setAttribute('allow', 'https://example.com/search-engines.txt');

    // Restore from storage
    const saved = localStorage.getItem('robotsConfig');
    if (saved) {
      manager.config = JSON.parse(saved);
    }

    // Or set config programmatically
    manager.config = {
      allow: ['Googlebot', 'Bingbot', 'DuckDuckBot'],
      disallow: ['GPTBot', 'CCBot', 'ChatGPT-User']
    };
  </script>
</body>
</html>
```

## Demo

Open [demo.html](./demo.html) to see the component in action with interactive examples.

## Browser Support

Modern browsers with support for:
- Web Components (Custom Elements v1)
- Shadow DOM
- ES Modules
- CSS Custom Properties
- Fetch API

## Related Resources

- [AI Robots.txt Repository](https://github.com/ai-robots-txt/ai.robots.txt) - Comprehensive list of AI bot user-agents
- [Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)
