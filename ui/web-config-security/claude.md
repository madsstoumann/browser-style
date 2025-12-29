# Web Config Security

## Overview

Web Config Security is a **visual web component** (`<web-config-security>`) for managing `security.txt` files following RFC 9116. It provides a structured interface for security disclosure information.

## Architecture

### Package Structure

```
web-config-security/
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
- web-config-robots (robots.txt)
- **web-config-security** (security.txt)

## Features

- **RFC 9116 Compliant**: All standard fields supported
- **Visual Management**: Required and Optional sections
- **Date Picker**: Easy `Expires` field management
- **Localization**: English (`en`) and Danish (`da`) support
- **Live Preview**: Real-time security.txt output
- **Event-Driven**: `sec-change` events on updates
- **Import/Export**: Parse and generate security.txt files

## Usage

### Basic

```html
<web-config-security></web-config-security>

<script type="module">
  import '@browser.style/web-config-security/src/index.js';
</script>
```

### Load Existing security.txt

```html
<web-config-security
  src="https://example.com/.well-known/security.txt">
</web-config-security>
```

### Set Initial Configuration

```html
<web-config-security
  initial-config='{"contact":["mailto:security@example.com"],"expires":"2025-12-31T23:59:00.000Z"}'>
</web-config-security>
```

## API

### Attributes

| Attribute | Description |
|-----------|-------------|
| `src` | URL to load security.txt file |
| `initial-config` | JSON string for initial configuration |
| `lang` | UI language (`en` or `da`) |

### Properties

#### `config` (getter/setter)

```javascript
const manager = document.querySelector('web-config-security');

// Set
manager.config = {
  contact: ['mailto:security@example.com'],
  expires: '2026-01-01T00:00:00.000Z'
};

// Get
console.log(manager.config);
```

#### `securityTxt` (getter)

Get generated security.txt string:

```javascript
console.log(manager.securityTxt);
// Contact: mailto:security@example.com
// Expires: 2026-01-01T00:00:00.000Z
```

### Methods

#### `fromString(securityTxtString)`

Parse security.txt string:

```javascript
await manager.fromString(`
Contact: mailto:security@example.com
Expires: 2025-12-31T23:59:00.000Z
`);
```

### Events

#### `sec-change`

Fired when configuration changes:

```javascript
manager.addEventListener('sec-change', (e) => {
  console.log('Config:', e.detail.config);
  console.log('Security.txt:', e.detail.securityTxt);
});
```

## RFC 9116 Fields

### Required Fields

| Field | Description |
|-------|-------------|
| `Contact` | Security contact (mailto: or https:) |
| `Expires` | Expiration date (ISO 8601) |

### Optional Fields

| Field | Description |
|-------|-------------|
| `Encryption` | PGP key URL |
| `Acknowledgments` | Hall of fame URL |
| `Preferred-Languages` | Comma-separated language codes |
| `Canonical` | Canonical URL for this file |
| `Policy` | Security policy URL |
| `Hiring` | Security jobs URL |

## Configuration Object

```javascript
{
  contact: [
    'mailto:security@example.com',
    'https://example.com/security'
  ],
  expires: '2026-01-01T00:00:00.000Z',
  encryption: 'https://example.com/pgp-key.txt',
  acknowledgments: 'https://example.com/hall-of-fame',
  preferredLanguages: ['en', 'es'],
  canonical: 'https://example.com/.well-known/security.txt',
  policy: 'https://example.com/security-policy',
  hiring: 'https://example.com/security-jobs'
}
```

## Output Format

```
Contact: mailto:security@example.com
Contact: https://example.com/security
Expires: 2026-01-01T00:00:00.000Z
Encryption: https://example.com/pgp-key.txt
Acknowledgments: https://example.com/hall-of-fame
Preferred-Languages: en, es
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security-policy
Hiring: https://example.com/security-jobs
```

## Styling

```css
web-config-security {
  --sec-manager-accent: hsl(211, 100%, 95%);
  --sec-manager-accent-dark: hsl(211, 50%, 50%);
  /* See src/index.css for full list */
}
```

## Integration

### Contentful

See `/ui/cms/contentful/web-config-security/` for Contentful CMS integration.

Field type: **Long text**

### Server Deployment

Save security.txt to `/.well-known/security.txt`:

```javascript
manager.addEventListener('sec-change', async (e) => {
  await fetch('/api/security-txt', {
    method: 'POST',
    body: e.detail.securityTxt,
    headers: { 'Content-Type': 'text/plain' }
  });
});
```

## Best Practices

1. **Always set Expires**: Required by RFC 9116
2. **Use HTTPS URLs**: For encryption, acknowledgments, etc.
3. **Multiple contacts**: Add fallback contact methods
4. **Sign the file**: Consider PGP signing for authenticity

## Related Resources

- [RFC 9116 - A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116)
- [securitytxt.org](https://securitytxt.org/)

## Debugging Tips

1. **Date invalid?** Ensure ISO 8601 format
2. **Contact not saving?** Must be mailto: or https: URL
3. **Preview not updating?** Check event listener
4. **Parser errors?** Verify security.txt format
