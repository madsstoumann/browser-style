# Web Config Robots

## Overview

Web Config Robots is a **visual web component** (`<web-config-robots>`) for managing `robots.txt` files. It provides an intuitive interface for organizing bots into Allow/Disallow sections with support for external bot lists and advanced directives.

## Architecture

### Package Structure

```
web-config-robots/
├── README.md             # User documentation
├── index.html            # Demo page
├── package.json          # NPM package configuration
├── fixtures/             # Test fixtures
└── src/
    ├── index.js          # Main web component
    └── index.css         # Component styles
```

### Component Family

Part of the web-config suite with consistent design:
- web-config-csp (Content Security Policy)
- web-config-manifest (Web App Manifest)
- **web-config-robots** (robots.txt)
- web-config-security (security.txt)

## Features

- **Visual Management**: Allow/Disallow sections with bot chips
- **Advanced Settings**: Host, Clean-param, Request-rate, Visit-time support
- **Global Path Rules**: Manage `User-agent: *` rules separately
- **Search & Filter**: Find bots in long lists
- **External Bot Lists**: Load from URLs (AI robots.txt repository)
- **Quick Actions**: Move bots between sections, add custom entries
- **Localization**: English (`en`) and Danish (`da`) support
- **Live Preview**: Real-time robots.txt output
- **Import/Export**: Parse and generate robots.txt files

## Usage

### Basic

```html
<web-config-robots></web-config-robots>

<script type="module">
  import '@browser.style/web-config-robots/src/index.js';
</script>
```

### Load Existing robots.txt

```html
<web-config-robots src="https://example.com/robots.txt"></web-config-robots>
```

### Preload AI Bots to Disallow

```html
<web-config-robots
  disallow="https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.txt">
</web-config-robots>
```

### Load Multiple Lists

```html
<web-config-robots
  allow="https://example.com/search-engines.txt"
  disallow="https://example.com/ai-bots.txt">
</web-config-robots>
```

## API

### Attributes

| Attribute | Description |
|-----------|-------------|
| `src` | URL to load complete robots.txt file |
| `allow` | URL to load bots for Allow section |
| `disallow` | URL to load bots for Disallow section |
| `lists` | Comma-separated URLs for Quick Import buttons |
| `initial-config` | JSON string for initial configuration |
| `lang` | UI language (`en` or `da`) |

### Properties

#### `config` (getter/setter)

```javascript
const manager = document.querySelector('web-config-robots');

// Set
manager.config = {
  allow: ['Googlebot', 'Bingbot'],
  disallow: ['GPTBot', 'CCBot'],
  cleanParam: ['ref /articles/']
};

// Get
console.log(manager.config);
```

#### `robotsTxt` (getter)

Get generated robots.txt string:

```javascript
console.log(manager.robotsTxt);
// # Allowed Bots
// User-agent: Googlebot
// Allow: /
// ...
```

### Methods

#### `fromString(robotsTxtString)`

Parse robots.txt string:

```javascript
await manager.fromString(`
User-agent: Googlebot
Allow: /

User-agent: GPTBot
Disallow: /
`);
```

### Events

#### `robtxt-change`

Fired when configuration changes:

```javascript
manager.addEventListener('robtxt-change', (e) => {
  console.log('Config:', e.detail.config);
  console.log('Robots.txt:', e.detail.robotsTxt);

  // Save to backend
  localStorage.setItem('robotsConfig', JSON.stringify(e.detail.config));
});
```

## Configuration Object

```javascript
{
  allow: ['Googlebot', 'Bingbot'],      // Allowed bot names
  disallow: ['GPTBot', 'CCBot'],        // Disallowed bot names
  sitemaps: ['https://example.com/sitemap.xml'],
  crawlDelay: 10,
  host: 'https://example.com',
  cleanParam: ['ref /articles/', 'sid /session/'],
  requestRate: '1/5',                   // 1 request per 5 seconds
  visitTime: '0600-0800'                // Visit window
}
```

## UI Features

### Bot Chips

Each bot displays as a chip with:
- **⇄** Move to other section
- **×** Remove from list

### Quick Add

- Type custom bot names in input
- Use datalist suggestions
- Click quick-add buttons

### Search/Filter

Filter through bot lists using the search input.

### Live Preview

Shows generated robots.txt in real-time.

## Styling

```css
web-config-robots {
  --robtxt-manager-accent: hsl(211, 100%, 95%);
  --robtxt-manager-accent-dark: hsl(211, 50%, 50%);
  --robtxt-manager-buttonface: #efefef;
  --robtxt-manager-bdrs: .5rem;
  --robtxt-manager-ff-mono: 'Courier New', monospace;
  --robtxt-manager-gap: 1rem;
  --robtxt-allow-color: hsl(120, 50%, 45%);
  --robtxt-allow-bg: hsl(120, 50%, 95%);
  --robtxt-disallow-color: hsl(0, 80%, 50%);
  --robtxt-disallow-bg: hsl(0, 80%, 95%);
}
```

## Integration

### Contentful

See `/ui/cms/contentful/web-config-robots/` for Contentful CMS integration.

Field type: **Long text**

## Advanced Directives

### Clean-param

Tells crawlers to ignore URL parameters:

```
Clean-param: ref /articles/
# /articles/page?ref=twitter → /articles/page
```

### Request-rate

Limit crawl rate:

```
Request-rate: 1/5
# 1 request per 5 seconds
```

### Visit-time

Specify crawl window:

```
Visit-time: 0600-0800
# Only crawl between 6am-8am
```

## Related Resources

- [AI Robots.txt Repository](https://github.com/ai-robots-txt/ai.robots.txt)
- [Google robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)

## Debugging Tips

1. **Bots not loading?** Check URL is accessible (CORS)
2. **Preview not updating?** Verify event listener
3. **Parser errors?** Check robots.txt format
4. **UI language wrong?** Set `lang` attribute
