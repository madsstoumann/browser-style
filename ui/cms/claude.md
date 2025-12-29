# CMS Integration Layer

## Overview

The `cms` directory contains **CMS-specific wrappers** that adapt browser.style UI components for use within Content Management Systems. Currently, Contentful is the primary supported CMS.

## Architecture

```
cms/
└── contentful/
    ├── README.md              # Setup and usage documentation
    ├── web-config-csp/        # CSP editor for Contentful
    ├── web-config-manifest/   # Manifest editor for Contentful
    ├── web-config-robots/     # Robots.txt editor for Contentful
    └── web-config-security/   # Security.txt editor for Contentful
```

## Contentful Integration

### Purpose

Wraps browser.style web components as **Contentful Apps** that can be installed as custom field editors within Contentful spaces.

### Supported Components

| Component | Contentful Field Type | Data Format |
|-----------|----------------------|-------------|
| web-config-csp | JSON object | CSP policy configuration |
| web-config-robots | Long text | robots.txt string |
| web-config-security | Long text | security.txt string |
| web-config-manifest | JSON object | manifest.json object |

### How It Works

1. Each wrapper is an HTML page that loads:
   - The Contentful App SDK
   - The browser.style component
   - Import maps for module resolution

2. The wrapper:
   - Initializes Contentful SDK: `contentfulApp.init()`
   - Loads existing field value: `api.field.getValue()`
   - Saves changes on update: `api.field.setValue(data)`
   - Handles validation if needed

### Import Map Requirement

**Critical**: All Contentful app HTML files must include an import map:

```html
<script type="importmap">
  {
    "imports": {
      "@browser.style/web-config-shared": "https://browser.style/ui/web-config-shared/index.js"
    }
  }
</script>
```

Without this, browsers cannot resolve bare module specifiers like `@browser.style/web-config-shared`.

## Contentful Setup

### 1. Create App

1. Go to Contentful Organization → Apps → Create app
2. Set App URL: `https://browser.style/ui/cms/contentful/[component]/`
3. Enable **Entry field** location
4. Select appropriate field type

### 2. Install to Space

Install the app to your Contentful space(s).

### 3. Configure Content Model

1. Add field of matching type (JSON object or Long text)
2. In Appearance tab, select the custom app
3. Save content type

## Security Headers

Apps served from `/ui/cms/contentful/*` require special headers:

- **CSP**: Must allow iframe embedding from `*.contentful.com`
- **No X-Frame-Options**: Conflicts with CSP frame-ancestors
- **No Permissions-Policy**: CMS apps need flexible permissions

These are configured via Cloudflare Rules.

## Adding New CMS Integrations

### Contentful

1. Create directory: `/ui/cms/contentful/[component-name]/`
2. Create `index.html` with:
   - Contentful SDK script
   - Import map for dependencies
   - Component import and initialization
3. Handle field lifecycle (getValue/setValue)
4. Register app in Contentful

### Other CMS Platforms

The same pattern can be extended to other CMS platforms:

```
cms/
├── contentful/
├── sanity/        # Future: Sanity.io integration
├── strapi/        # Future: Strapi integration
└── wordpress/     # Future: WordPress Gutenberg blocks
```

## Key Files

- **[contentful/README.md](contentful/README.md)**: Detailed setup instructions and troubleshooting

## Component Event Mapping

Each Contentful wrapper listens for specific events from the underlying component:

| Wrapper | Component Event | Contentful Action |
|---------|----------------|-------------------|
| web-config-csp | `csp-change` | `api.field.setValue(policy)` + validation |
| web-config-manifest | `manifest-change` | `api.field.setValue(event.detail)` |
| web-config-robots | `robtxt-change` | `api.field.setValue(robotsTxt)` |
| web-config-security | `sec-change` | `api.field.setValue(securityTxt)` |

### CSP Validation

The CSP wrapper performs additional validation:
- Checks for high-severity security issues from evaluations
- Blocks publishing via `api.field.setInvalid()` when issues exist
- Clears validation with `api.field.setInvalid(false)` when resolved

### Backwards Compatibility

The robots and security wrappers support both data formats:
- **String** (current): Stores the raw output text
- **Object** (legacy): Stores the structured config object

```javascript
// Robots/Security loading logic
if (typeof currentValue === 'string' && currentValue.trim()) {
  editor.value = currentValue;  // New format
} else if (currentValue && typeof currentValue === 'object') {
  editor.config = currentValue; // Legacy format
}
```

## Component Ready Pattern

All wrappers use a ready-wait pattern to handle async component initialization:

```javascript
// 1. Wait for custom element definition
await customElements.whenDefined('web-config-xxx');

// 2. Create and append element
const editor = document.createElement('web-config-xxx');
app.appendChild(editor);

// 3. Wait for component's internal ready promise (with timeout)
await Promise.race([
  editor.ready,
  new Promise((_, reject) => setTimeout(() => reject(), 10000))
]);

// 4. Load initial data
editor.value = currentValue;
```

## File Structure

```
cms/
├── claude.md                          # This documentation
└── contentful/
    ├── README.md                      # Setup instructions (detailed)
    ├── web-config-csp/
    │   └── index.html                 # CSP editor wrapper (121 lines)
    ├── web-config-manifest/
    │   └── index.html                 # Manifest editor wrapper (72 lines)
    ├── web-config-robots/
    │   └── index.html                 # Robots.txt editor wrapper (87 lines)
    └── web-config-security/
        └── index.html                 # Security.txt editor wrapper (87 lines)
```

## Debugging Tips

1. **App not loading?** Check import map is present and correct
2. **Data not saving?** Verify field type matches component requirements
3. **Iframe blocked?** Check Cloudflare security headers
4. **Module resolution error?** Import map must be before module scripts
5. **Component not initializing?** Check console for `ready` promise timeout errors
