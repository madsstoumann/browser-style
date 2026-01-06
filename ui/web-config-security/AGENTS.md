# Web Config Security - Internal Architecture

## Overview

Web Config Security is a **web component for editing security.txt files** following RFC 9116. It provides a structured interface for security disclosure information with parser support for existing files.

**Package Type:** Web Component (Custom Element)

**Tag Name:** `web-config-security`

**Total LOC:** ~336 lines (single file + i18n JSON)

**Key architectural decisions:**
- **RFC 9116 compliance**: All standard security.txt fields supported
- **Multi-value fields**: Contact, encryption, and other fields support multiple values
- **Datetime handling**: Local timezone conversion for Expires field
- **Deep equality**: JSON comparison for array state changes
- **Ready promise**: Async initialization pattern for external consumers

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + ready promise
  ↓
Initialize state with empty fields
  ↓
Create translator from i18n.json
  ↓
connectedCallback()
  ↓
Resolve ready promise
  ↓
Check src attribute → Load external security.txt
  OR
Check value attribute → Parse inline security.txt
  OR
Check initial-config attribute → Apply JSON config
  ↓
render() + attach event listeners
```

### Parser Flow

```
fromString(securityTxtString)
  ↓
Split into lines
  ↓
For each line:
  - Skip comments (#) and empty lines
  - Match against regex patterns
  - Extract field values
  ↓
Update state with parsed values
```

## File Structure

```
web-config-security/
├── src/
│   ├── index.js        336 lines   Main web component
│   └── i18n.json       ---         Translation strings
├── demo.html           ---         Demo page
└── claude.md           ---         This file
```

## Component API

### Class Definition

**File:** [src/index.js](src/index.js)

**Lines 44-335:** `WebConfigSecurity extends HTMLElement`

**Registration:** Line 335: `customElements.define('web-config-security', WebConfigSecurity);`

### Regex Constants (Lines 5-12)

```javascript
const RE_CONTACT = /^Contact:\s*(.+)$/i;
const RE_EXPIRES = /^Expires:\s*(.+)$/i;
const RE_ENCRYPTION = /^Encryption:\s*(.+)$/i;
const RE_ACKNOWLEDGMENTS = /^Acknowledgments:\s*(.+)$/i;
const RE_PREFERRED_LANGUAGES = /^Preferred-Languages:\s*(.+)$/i;
const RE_CANONICAL = /^Canonical:\s*(.+)$/i;
const RE_POLICY = /^Policy:\s*(.+)$/i;
const RE_HIRING = /^Hiring:\s*(.+)$/i;
```

### Static Properties (Lines 45-47)

```javascript
static get observedAttributes() {
  return ['src', 'lang', 'value'];
}
```

### Constructor (Lines 49-67)

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this._loadStyles();
  this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');

  this.state = {
    contact: [],            // Multi-value: mailto: or https: URLs
    expires: '',            // ISO 8601 datetime
    encryption: [],         // Multi-value: PGP key URLs
    acknowledgments: [],    // Multi-value: Hall of fame URLs
    preferredLanguages: '', // Comma-separated language codes
    canonical: [],          // Multi-value: Canonical URLs
    policy: [],             // Multi-value: Security policy URLs
    hiring: []              // Multi-value: Security job URLs
  };

  this.ready = new Promise(resolve => this._resolveReady = resolve);
  this._loadedUrls = { src: null };
}
```

### Utility Functions

#### `jsonEqual(a, b)` (Lines 14-21)

Deep equality comparison for arrays using JSON serialization.

```javascript
function jsonEqual(a, b) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
```

#### `toDatetimeLocalValue(dateOrIsoString)` (Lines 23-29)

Converts ISO date to local datetime-local input value.

```javascript
/* Lines 23-29 */
function toDatetimeLocalValue(dateOrIsoString) {
  if (!dateOrIsoString) return '';
  const date = dateOrIsoString instanceof Date ? dateOrIsoString : new Date(dateOrIsoString);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);  // Remove seconds/ms
}
```

#### `fromDatetimeLocalValue(value)` (Lines 31-42)

Converts datetime-local input value back to ISO 8601 for RFC compliance.

```javascript
/* Lines 31-42 */
function fromDatetimeLocalValue(value) {
  if (!value) return '';
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return '';
  const [year, month, day] = datePart.split('-').map(n => parseInt(n, 10));
  const [hour, minute, secondPart] = timePart.split(':');
  const second = secondPart ? parseInt(secondPart, 10) : 0;
  const date = new Date(year, month - 1, day, parseInt(hour, 10), parseInt(minute, 10),
                        Number.isFinite(second) ? second : 0, 0);
  if (Number.isNaN(date.getTime())) return '';
  // RFC 3339 format, omit milliseconds
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
```

### State Management (Lines 87-102)

```javascript
/* Lines 87-102 */
_updateState(partialState) {
  const changedKeys = setState(this, partialState, {
    equalsByKey: {
      contact: jsonEqual,
      encryption: jsonEqual,
      acknowledgments: jsonEqual,
      canonical: jsonEqual,
      policy: jsonEqual,
      hiring: jsonEqual
    }
  });

  if (changedKeys.length === 0) return;
  this.render();
  this.dispatchChangeEvent();
}
```

### Properties

#### `config` (Lines 104-111)

```javascript
get config() {
  return structuredClone(this.state);  // Deep copy to prevent mutation
}

set config(data) {
  if (typeof data !== 'object' || data === null) return;
  this._updateState(data);
}
```

#### `value` (Lines 113-119)

```javascript
get value() {
  return this.generateSecurityTxt();
}

set value(val) {
  this.fromString(val);
}
```

#### `securityTxt` (Lines 121-123)

```javascript
get securityTxt() {
  return this.generateSecurityTxt();
}
```

### Parser Method (Lines 125-158)

```javascript
/* Lines 125-158 */
async fromString(securityTxtString) {
  if (typeof securityTxtString !== 'string' || !securityTxtString.trim()) return;
  await this.ready;

  const newState = {
    contact: [],
    expires: '',
    encryption: [],
    acknowledgments: [],
    preferredLanguages: '',
    canonical: [],
    policy: [],
    hiring: []
  };

  const lines = securityTxtString.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;  // Skip comments

    let match;
    if ((match = trimmed.match(RE_CONTACT))) newState.contact.push(match[1].trim());
    else if ((match = trimmed.match(RE_EXPIRES))) newState.expires = match[1].trim();
    else if ((match = trimmed.match(RE_ENCRYPTION))) newState.encryption.push(match[1].trim());
    else if ((match = trimmed.match(RE_ACKNOWLEDGMENTS))) newState.acknowledgments.push(match[1].trim());
    else if ((match = trimmed.match(RE_PREFERRED_LANGUAGES))) newState.preferredLanguages = match[1].trim();
    else if ((match = trimmed.match(RE_CANONICAL))) newState.canonical.push(match[1].trim());
    else if ((match = trimmed.match(RE_POLICY))) newState.policy.push(match[1].trim());
    else if ((match = trimmed.match(RE_HIRING))) newState.hiring.push(match[1].trim());
  }

  this.config = newState;
}
```

### Generator Method (Lines 172-190)

```javascript
/* Lines 172-190 */
generateSecurityTxt() {
  let output = '';

  // Required fields first
  this.state.contact.forEach(c => output += `Contact: ${c}\n`);
  if (this.state.expires) output += `Expires: ${this.state.expires}\n`;

  if (output) output += '\n';  // Blank line separator

  // Optional fields
  this.state.encryption.forEach(e => output += `Encryption: ${e}\n`);
  this.state.acknowledgments.forEach(a => output += `Acknowledgments: ${a}\n`);
  if (this.state.preferredLanguages) output += `Preferred-Languages: ${this.state.preferredLanguages}\n`;
  this.state.canonical.forEach(c => output += `Canonical: ${c}\n`);
  this.state.policy.forEach(p => output += `Policy: ${p}\n`);
  this.state.hiring.forEach(h => output += `Hiring: ${h}\n`);

  return output.trim();
}
```

### Events

#### `sec-change` (Lines 160-170)

```javascript
dispatchChangeEvent() {
  const detail = {
    config: this.config,
    securityTxt: this.securityTxt
  };
  this.dispatchEvent(new CustomEvent('sec-change', {
    bubbles: true,
    composed: true,
    detail
  }));
}
```

### Event Handling (Lines 235-267)

```javascript
/* Lines 235-267 */
_attachEventListeners() {
  this.shadowRoot.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const field = target.dataset.field;
    const index = parseInt(target.dataset.index, 10);

    if (target.dataset.action === 'add') {
      const input = this.shadowRoot.querySelector(`input[data-new="${field}"]`);
      if (input?.value) {
        const newValue = input.value.trim();
        this._updateState({ [field]: [...this.state[field], newValue] });
        input.value = '';
        input.focus();
      }
    } else if (target.dataset.remove !== undefined) {
      const newList = this.state[field].filter((_, i) => i !== index);
      this._updateState({ [field]: newList });
    }
  });

  this.shadowRoot.addEventListener('input', (e) => {
    const field = e.target.dataset.field;
    if (!field) return;

    if (field === 'expires') {
      this._updateState({ expires: fromDatetimeLocalValue(e.target.value) });
    } else if (field === 'preferredLanguages') {
      this._updateState({ preferredLanguages: e.target.value });
    }
  });
}
```

### Render Helpers

#### `_renderMultiField(field, label, hint)` (Lines 269-286)

Renders multi-value fields (contact, encryption, etc.).

```javascript
/* Lines 269-286 */
_renderMultiField(field, label, hint) {
  const values = this.state[field];
  return `
    <small>${label}</small>
    ${values.length > 0 ? `
      <ul>
        ${values.map((val, idx) => `
          <li>${val}
            <button data-remove data-field="${field}" data-index="${idx}" title="${this.t('ui.remove')}">×</button>
          </li>
        `).join('')}
      </ul>
    ` : ''}
    <fieldset>
      <input type="text" data-new="${field}" placeholder="${hint}">
      <button data-action="add" data-field="${field}">${this.t('ui.add')}</button>
    </fieldset>`;
}
```

#### `_renderSingleField(field, label, hint, type)` (Lines 288-302)

Renders single-value fields (expires, preferredLanguages).

```javascript
/* Lines 288-302 */
_renderSingleField(field, label, hint, type = 'text') {
  const value = type === 'datetime-local'
    ? toDatetimeLocalValue(this.state[field])
    : (this.state[field] || '');
  return `
    <label for="${field}-input"><small>${label}</small>
      <input
        type="${type}"
        id="${field}-input"
        data-field="${field}"
        value="${value}"
        placeholder="${hint}"
      >
    </label>`;
}
```

## Shadow DOM Structure (Lines 304-332)

```html
<!-- Required Fields -->
<details name="sec-manager" data-panel="required" open data-status="ok">
  <summary>Required</summary>
  <div>
    <!-- Multi-value Contact field -->
    <small>Contact</small>
    <ul>
      <li>mailto:security@example.com <button data-remove>×</button></li>
    </ul>
    <fieldset>
      <input type="text" data-new="contact" placeholder="mailto: or https://">
      <button data-action="add" data-field="contact">Add</button>
    </fieldset>

    <!-- Single datetime-local Expires field -->
    <label>
      <small>Expires</small>
      <input type="datetime-local" data-field="expires" value="2025-12-31T23:59">
    </label>
  </div>
</details>

<!-- Optional Fields -->
<details name="sec-manager" data-panel="optional">
  <summary>Optional</summary>
  <div>
    <!-- Multi-value fields: encryption, acknowledgments, canonical, policy, hiring -->
    <!-- Single text field: preferredLanguages -->
  </div>
</details>

<!-- Output Preview -->
<pre><code>Contact: mailto:security@example.com
Expires: 2025-12-31T23:59:00Z</code></pre>
```

## State Structure

```javascript
{
  contact: string[],            // Required: mailto: or https: URLs
  expires: string,              // Required: ISO 8601 datetime
  encryption: string[],         // PGP key URLs
  acknowledgments: string[],    // Hall of fame URLs
  preferredLanguages: string,   // Comma-separated language codes
  canonical: string[],          // Canonical file URLs
  policy: string[],             // Security policy URLs
  hiring: string[]              // Security job URLs
}
```

## Dependencies

| Import | Line | Source | Purpose |
|--------|------|--------|---------|
| `i18nData` | 1 | `./i18n.json` | Translation strings |
| `adoptSharedStyles` | 3 | `@browser.style/web-config-shared` | Shared CSS |
| `captureOpenDetailsState` | 3 | `@browser.style/web-config-shared` | Accordion persistence |
| `createTranslator` | 3 | `@browser.style/web-config-shared` | i18n function |
| `restoreOpenDetailsState` | 3 | `@browser.style/web-config-shared` | Accordion persistence |
| `setState` | 3 | `@browser.style/web-config-shared` | State management |

## RFC 9116 Compliance

### Required Fields

| Field | Description | Format |
|-------|-------------|--------|
| `Contact` | Security contact | `mailto:` or `https://` URL |
| `Expires` | Expiration date | ISO 8601 / RFC 3339 datetime |

### Optional Fields

| Field | Description | Format |
|-------|-------------|--------|
| `Encryption` | PGP key location | `https://` URL |
| `Acknowledgments` | Hall of fame | `https://` URL |
| `Preferred-Languages` | Supported languages | Comma-separated ISO 639-1 |
| `Canonical` | Canonical location | `https://` URL |
| `Policy` | Security policy | `https://` URL |
| `Hiring` | Security jobs | `https://` URL |

## Output Example

```
Contact: mailto:security@example.com
Contact: https://example.com/security-contact
Expires: 2026-01-01T00:00:00Z

Encryption: https://example.com/pgp-key.txt
Acknowledgments: https://example.com/hall-of-fame
Preferred-Languages: en, es, fr
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security-policy
Hiring: https://example.com/jobs/security
```

## Usage Examples

### Basic Usage

```html
<web-config-security lang="en"></web-config-security>

<script type="module">
  import '@browser.style/web-config-security';

  const security = document.querySelector('web-config-security');
  security.addEventListener('sec-change', (e) => {
    console.log('Config:', e.detail.config);
    console.log('Output:', e.detail.securityTxt);
  });
</script>
```

### Load Existing security.txt

```html
<web-config-security src="/.well-known/security.txt"></web-config-security>
```

### Parse security.txt String

```javascript
const security = document.querySelector('web-config-security');
await security.ready;

security.fromString(`
Contact: mailto:security@example.com
Expires: 2026-01-01T00:00:00Z
Policy: https://example.com/security-policy
`);
```

### Set Configuration Programmatically

```javascript
security.config = {
  contact: ['mailto:security@example.com'],
  expires: '2026-01-01T00:00:00Z',
  policy: ['https://example.com/policy']
};
```

## Gotchas & Edge Cases

### 1. Ready Promise Required for External Data (Lines 65, 127)

```javascript
await security.ready;
security.fromString(data);
```

External consumers must await `ready` before calling `fromString()` to ensure the component is initialized.

### 2. Deep Equality for Array State (Lines 88-97)

```javascript
equalsByKey: {
  contact: jsonEqual,
  encryption: jsonEqual,
  // ...
}
```

Arrays use JSON serialization for comparison. Reordering values is considered a change.

### 3. Datetime Timezone Handling (Lines 23-42)

Local datetime-local input values are converted to UTC for RFC 3339 compliance. The displayed time shows local timezone but output is UTC.

### 4. Multi-value vs Single-value Fields

| Multi-value | Single-value |
|-------------|--------------|
| contact | expires |
| encryption | preferredLanguages |
| acknowledgments | |
| canonical | |
| policy | |
| hiring | |

### 5. Empty Output Handling (Line 328)

```javascript
<pre><code>${this.generateSecurityTxt() || this.t('ui.noOutput')}</code></pre>
```

Shows translated "No output" message when no fields are configured.

### 6. Regex Case Insensitivity (Lines 5-12)

```javascript
const RE_CONTACT = /^Contact:\s*(.+)$/i;  // 'i' flag
```

Parser is case-insensitive to handle variations in existing security.txt files.

### 7. Comment Line Handling (Line 144)

```javascript
if (!trimmed || trimmed.startsWith('#')) continue;
```

Lines starting with `#` are skipped during parsing (RFC 9116 comment format).

### 8. URL Loading Deduplication (Lines 66, 222-226)

```javascript
if (newValue && this._loadedUrls.src !== newValue) {
  this._loadedUrls.src = newValue;
  await this._loadFromSecurityTxt(newValue);
}
```

Prevents redundant fetches when src attribute is set multiple times.

### 9. Milliseconds Stripped from ISO Date (Line 41)

```javascript
return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
```

RFC 3339 doesn't require milliseconds, so they're removed for cleaner output.

### 10. structuredClone for Config Getter (Line 105)

```javascript
return structuredClone(this.state);
```

Returns a deep copy to prevent external mutation of internal state.

## Debugging Tips

1. **Date invalid?** Ensure ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
2. **Contact not saving?** Must be `mailto:` or `https:` URL
3. **Preview empty?** Check at least one Contact and Expires are set
4. **Parser errors?** Verify security.txt format matches RFC 9116
5. **Timezone wrong?** Component converts local input to UTC output
6. **ready promise timing?** Always await ready before programmatic operations

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles

## Related Resources

- [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116) - security.txt specification
- [securitytxt.org](https://securitytxt.org/) - Generator and validator
