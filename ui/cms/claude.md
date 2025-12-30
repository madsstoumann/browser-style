# CMS Integration Layer - Internal Architecture

## Overview

The `cms` directory contains **CMS-specific wrappers** that adapt browser.style UI components for embedding within Content Management Systems. These are HTML-based Contentful Apps that wrap web components as custom field editors.

**Component Type:** Contentful App wrappers (HTML + inline JavaScript)

**Supported CMS:** Contentful (primary)

**Key architectural decisions:**
- **HTML-based wrappers**: Each wrapper is an HTML page, not a JavaScript module
- **SDK integration**: Uses Contentful App SDK for field lifecycle management
- **Import maps**: Required for bare module specifier resolution in browsers
- **Event-driven binding**: Custom events bridge component state to CMS fields
- **Fallback mode**: All wrappers support standalone operation without CMS

## Architecture Overview

### Wrapper Lifecycle

```
Browser loads HTML wrapper
  ↓
Load Contentful SDK from CDN (unpkg.com)
  ↓
Define import map for @browser.style/web-config-shared
  ↓
Import web component module
  ↓
Check for Contentful SDK availability
  ↓
contentfulExtension.init(async (api) => { ... })
  ↓
  customElements.whenDefined('web-config-xxx')
  ↓
  Create and append component to DOM
  ↓
  Wait for component.ready promise (10s timeout)
  ↓
  Load field value: api.field.getValue()
  ↓
  Set value on component property
  ↓
  Listen for component change events
  ↓
  Save changes: api.field.setValue(data)
  ↓
  api.window.startAutoResizer()
  ↓
If SDK unavailable → Fallback to standalone mode
```

**Critical timing:** Component `ready` promise must resolve before setting initial value. All wrappers use a 10-second timeout with Promise.race().

## File Structure

```
cms/
├── claude.md                          # This documentation
└── contentful/
    ├── README.md                      # Setup instructions
    ├── web-config-csp/
    │   └── index.html                 # CSP editor wrapper (121 lines)
    ├── web-config-manifest/
    │   └── index.html                 # Manifest editor wrapper (72 lines)
    ├── web-config-robots/
    │   └── index.html                 # Robots.txt editor wrapper (87 lines)
    └── web-config-security/
        └── index.html                 # Security.txt editor wrapper (87 lines)
```

## Wrapper Implementations

### web-config-csp/index.html (121 lines)

Most sophisticated wrapper with validation logic.

**Component Property:** `policy`

**Event Name:** `csp-change`

**Validation Logic (lines 76-92):**
```javascript
if (evaluations) {
  const highSeverityIssues = Object.entries(evaluations)
    .filter(([_, evaluation]) => evaluation.severity === 'high');

  if (highSeverityIssues.length > 0) {
    api.field.setInvalid(`${totalFindings} high-severity security issue(s) detected`);
  } else {
    api.field.setInvalid(false);
  }
}
```

**Unique Features:**
- Blocks publishing when high-severity CSP issues detected
- Uses `api.field.setInvalid()` for Contentful validation
- Receives evaluations object with severity per directive

**Data Flow:**
```
api.field.getValue() → cspManager.policy = value
                           ↓
                    User edits policy
                           ↓
                    'csp-change' event
                           ↓
                    { policy, evaluations }
                           ↓
              Check evaluations.severity === 'high'
                           ↓
              api.field.setValue(policy)
              api.field.setInvalid(message | false)
```

---

### web-config-manifest/index.html (72 lines)

Simplest wrapper handling JSON serialization.

**Component Property:** `value` (JSON string)

**Event Name:** `manifest-change`

**Data Format Handling (lines 38-46):**
```javascript
if (currentValue && typeof currentValue === 'object' && Object.keys(currentValue).length > 0) {
  editor.value = JSON.stringify(currentValue);
} else if (typeof currentValue === 'string' && currentValue.trim()) {
  editor.value = currentValue;
}
```

**Unique Features:**
- Accepts both object and string formats from Contentful
- Converts objects to JSON strings for component
- Stores `event.detail` directly (manifest object)

---

### web-config-robots/index.html (87 lines)

Backward-compatible wrapper with dual format support.

**Component Properties:** `value` (string) OR `config` (object)

**Event Name:** `robtxt-change`

**Ready Wait Utility (lines 26-36):**
```javascript
const waitForReady = async (el) => {
  if (!el?.ready) return;
  try {
    await Promise.race([
      el.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Component ready timeout')), 10000))
    ]);
  } catch { /* Silently ignore timeout */ }
};
```

**Backward Compatibility (lines 48-54):**
```javascript
// Prefers string format (current)
if (typeof currentValue === 'string' && currentValue.trim()) {
  editor.value = currentValue;
}
// Falls back to object format (legacy)
else if (currentValue && typeof currentValue === 'object') {
  editor.config = currentValue;
}
```

**Data Flow:**
```
api.field.getValue() → Check type
                           ↓
              String? → editor.value = value
              Object? → editor.config = value
                           ↓
                    'robtxt-change' event
                           ↓
              { robotsTxt: string }
                           ↓
              api.field.setValue(robotsTxt)
```

---

### web-config-security/index.html (87 lines)

Nearly identical to robots wrapper.

**Component Properties:** `value` (string) OR `config` (object)

**Event Name:** `sec-change`

**Event Detail Property:** `securityTxt` (vs `robotsTxt` in robots)

**Code Duplication:** `waitForReady()` function duplicated from robots wrapper.

## Common Patterns

### Import Map Requirement

**Critical:** All wrappers must include import map before module scripts:

```html
<script type="importmap">
  {
    "imports": {
      "@browser.style/web-config-shared": "https://browser.style/ui/web-config-shared/index.js"
    }
  }
</script>
```

Without this, browsers cannot resolve bare module specifiers.

### SDK Initialization Pattern

All wrappers use identical SDK initialization:

```javascript
if (window.contentfulExtension) {
  try {
    const initResult = window.contentfulExtension.init(async (api) => {
      // ... initialization code
    });
    if (initResult && typeof initResult.catch === 'function') {
      initResult.catch((error) => console.error('Contentful init error:', error));
    }
  } catch (error) {
    console.error('SDK initialization error:', error);
  }
} else {
  // Fallback: run in standalone mode
  mount();
}
```

### Component Ready Pattern

All wrappers wait for component readiness:

```javascript
await customElements.whenDefined('web-config-xxx');
const editor = document.createElement('web-config-xxx');
app.appendChild(editor);

await Promise.race([
  editor.ready,
  new Promise((_, reject) => setTimeout(() => reject(), 10000))
]);
```

## Component Event Mapping

| Wrapper | Component | Event Name | Event Detail | Contentful Action |
|---------|-----------|------------|--------------|-------------------|
| web-config-csp | `<web-config-csp>` | `csp-change` | `{ policy, evaluations }` | `setValue(policy)` + validation |
| web-config-manifest | `<web-config-manifest>` | `manifest-change` | manifest object | `setValue(detail)` |
| web-config-robots | `<web-config-robots>` | `robtxt-change` | `{ robotsTxt }` | `setValue(robotsTxt)` |
| web-config-security | `<web-config-security>` | `sec-change` | `{ securityTxt }` | `setValue(securityTxt)` |

## Contentful Setup

### 1. Create App

1. Go to Contentful Organization → Apps → Create app
2. Set App URL: `https://browser.style/ui/cms/contentful/[component]/`
3. Enable **Entry field** location
4. Select appropriate field type:
   - CSP: JSON object
   - Manifest: JSON object
   - Robots: Long text
   - Security: Long text

### 2. Install to Space

Install the app to your Contentful space(s).

### 3. Configure Content Model

1. Add field of matching type
2. In Appearance tab, select the custom app
3. Save content type

## Security Headers

Apps served from `/ui/cms/contentful/*` require special headers:

- **CSP**: Must allow iframe embedding from `*.contentful.com`
- **No X-Frame-Options**: Conflicts with CSP frame-ancestors
- **No Permissions-Policy**: CMS apps need flexible permissions

These are configured via Cloudflare Rules.

## Gotchas & Edge Cases

### 1. Ready Promise Timeout

All wrappers use 10-second hardcoded timeout. If component initialization takes longer (slow network, large data), it silently fails:

```javascript
await Promise.race([
  editor.ready,
  new Promise((_, reject) => setTimeout(() => reject(), 10000))
]);
// catch block is empty - silent failure
```

**Impact:** Initial value may not be set correctly on slow connections.

### 2. Error Handling Gap

CSP wrapper assumes `evaluations` object structure without defensive checks:

```javascript
const highSeverityIssues = Object.entries(evaluations)
  .filter(([_, evaluation]) => evaluation.severity === 'high');
```

If `evaluations` is malformed, this throws.

### 3. Event Detail Destructuring

Robots/Security wrappers use destructuring with undefined fallback:

```javascript
const { robotsTxt } = event.detail || {};
api.field.setValue(typeof robotsTxt === 'string' ? robotsTxt : null);
```

If `event.detail` becomes `null` (not `undefined`), `|| {}` handles it, but structure changes could cause silent data loss.

### 4. Code Duplication

`waitForReady()` function is duplicated in robots and security wrappers. Bug fixes must be applied in both places.

### 5. Inconsistent Event Property Names

- Robots: `event.detail.robotsTxt`
- Security: `event.detail.securityTxt`
- CSP: `event.detail.policy`
- Manifest: `event.detail` (entire object)

No consistent naming convention across components.

### 6. JSON Parsing Assumptions

Manifest wrapper assumes `JSON.stringify()` won't throw:

```javascript
editor.value = JSON.stringify(currentValue);
```

Circular references or non-serializable values would throw, caught only by outer try-catch.

### 7. Policy Type Assumption

CSP wrapper sets policy without type validation:

```javascript
cspManager.policy = currentValue;
```

If Contentful stores unexpected type (string instead of object), component may fail silently.

### 8. Auto Resizer Timing

All wrappers call `api.window.startAutoResizer()` after component setup, but iframe height may not account for dynamically loaded content.

## Adding New CMS Integrations

### Contentful Pattern

1. Create directory: `/ui/cms/contentful/[component-name]/`
2. Create `index.html` with:
   - Contentful SDK script from CDN
   - Import map for dependencies
   - Component import and initialization
3. Handle field lifecycle:
   - `api.field.getValue()` for initial value
   - Component event listener for changes
   - `api.field.setValue()` to persist
4. Register app in Contentful

### Other CMS Platforms (Future)

```
cms/
├── contentful/     # Current
├── sanity/         # Future: Sanity.io integration
├── strapi/         # Future: Strapi integration
└── wordpress/      # Future: WordPress Gutenberg blocks
```

Each would follow similar patterns:
- SDK script loading
- Component wrapping
- Field value binding
- Event-based updates

## Debugging Tips

1. **App not loading?** Check import map is present and URLs are correct
2. **Data not saving?** Verify Contentful field type matches (JSON vs Long text)
3. **Iframe blocked?** Check Cloudflare security headers for frame-ancestors
4. **Module resolution error?** Import map must be before module scripts
5. **Component not initializing?** Check console for `ready` promise timeout errors
6. **Validation not working?** CSP wrapper requires `evaluate` attribute on component
